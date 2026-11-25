import test from "node:test";
import assert from "node:assert/strict";
import * as appSDK from "firebase/app";
import * as authSDK from "firebase/auth";
import * as dbSDK from "firebase/firestore";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { createFirebaseAdapter } from "../dist/firebase-client.js";
import { adminUid } from "../dist/practice-stats.js";
import {
  emptyCloudProgress,
  mergeCloudDocument,
} from "../dist/cloud-progress.js";

test(
  "real Firebase SDK signs up, signs in, resets passwords and syncs isolated accounts",
  { timeout: 45000 },
  async () => {
    assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
    assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
    const apps = [];
    function client(name) {
      const app = appSDK.initializeApp(
        { projectId: "demo-numi", apiKey: "demo-key", authDomain: "localhost" },
        name,
      );
      apps.push(app);
      const auth = authSDK.getAuth(app);
      authSDK.connectAuthEmulator(
        auth,
        "http://" + process.env.FIREBASE_AUTH_EMULATOR_HOST,
        { disableWarnings: true },
      );
      const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
      dbSDK.connectFirestoreEmulator(
        dbSDK.getFirestore(app),
        host,
        Number(port),
      );
      return createFirebaseAdapter(
        { ...appSDK, initializeApp: () => app },
        {
          ...authSDK,
          // Node has no browser storage. All auth/network/transaction methods below
          // are real SDK calls; browser persistence selection is covered by account tests.
          browserLocalPersistence: authSDK.inMemoryPersistence,
          browserSessionPersistence: authSDK.inMemoryPersistence,
        },
        dbSDK,
      );
    }
    const a = client("device-a"),
      b = client("device-b"),
      other = client("other-account");
    const email = `numi-test-${Date.now()}@example.invalid`,
      password = "Test-Only-Password-42!";
    const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
    const rules = await initializeTestEnvironment({ projectId: "demo-numi", firestore: { host, port: Number(port) } });
    const adminDb = rules.authenticatedContext(adminUid).firestore();
    function waitForSummary(uid, predicate) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          unsubscribe();
          reject(new Error("Timed out waiting for the synced practice summary"));
        }, 5000);
        const unsubscribe = dbSDK.onSnapshot(dbSDK.doc(adminDb, "practiceSummaries", uid), (snapshot) => {
          if (!snapshot.exists() || !predicate(snapshot.data())) return;
          clearTimeout(timer);
          unsubscribe();
          resolve(snapshot.data());
        }, (error) => {
          clearTimeout(timer);
          reject(error);
        });
      });
    }
    const payload = (index, answer) => ({
      ...emptyCloudProgress(),
      activityScores: { integers: 12 },
      lesson: "integers-1",
      progress: {
        "integers-1": {
          index,
          stage: "practice",
          solved: [index],
          answers: { [index]: answer },
          hints: [],
          reveals: [],
          failedChecks: { [index]: 2 },
        },
      },
    });
    let stop;
    try {
      const credentials = await a.signUp(email, password, true);
      const uid = credentials.user.uid;
      await a.signOut();
      assert.equal((await a.signIn(email, password, true)).user.uid, uid);
      assert.equal((await b.signIn(email, password, false)).user.uid, uid);
      await a.resetPassword(email);
      const remoteA = a.progress(uid),
        remoteB = b.progress(uid);
      await remoteA.write((previous) =>
        mergeCloudDocument(previous, payload(0, "2"), emptyCloudProgress(), 0),
      );
      const merged = await remoteB.write((previous) =>
        mergeCloudDocument(previous, payload(1, "-3"), emptyCloudProgress(), 0),
      );
      assert.deepEqual(
        new Set(merged.data.progress["integers-1"].solved),
        new Set([0, 1]),
      );
      await new Promise((resolve, reject) => {
        stop = remoteB.watch((value) => {
          if (value?.data.progress["integers-1"]?.solved.length === 2)
            resolve();
        }, reject);
      });
      const summary = await waitForSummary(uid, (item) => item.reviewBest.integers === 12);
      assert.deepEqual(summary, {
        email, revision: merged.revision, completedLessons: 0,
        reviewBest: { fractions: 0, integers: 12, pemdas: 0, factors: 0 },
      });
      await other.signUp("other-" + email, password, true);
      await assert.rejects(
        other.progress(uid).write(() => merged),
        (error) => error.code === "permission-denied",
      );
      const reset = await remoteA.reset();
      assert.equal(reset.epoch, 1);
      await waitForSummary(uid, (item) => item.revision === reset.revision && item.reviewBest.integers === 0);
      const stale = await remoteB.write((previous) =>
        mergeCloudDocument(previous, payload(1, "-3"), emptyCloudProgress(), 0),
      );
      assert.equal(stale.epoch, 1);
      assert.deepEqual(stale.data.progress, {});
    } finally {
      stop?.();
      await rules.cleanup();
      for (const app of apps) {
        await dbSDK.terminate(dbSDK.getFirestore(app));
        await appSDK.deleteApp(app);
      }
    }
  },
);
