import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  collection,
  getDocs,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { adminUid, emptyStats } from "../dist/practice-stats.js";

test("Firestore isolates accounts, validates saves, and protects reset epochs", async () => {
  assert.ok(
    process.env.FIRESTORE_EMULATOR_HOST,
    "Run npm run test:rules to start the isolated emulator",
  );
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
  const env = await initializeTestEnvironment({
    projectId: "demo-numi",
    firestore: {
      host,
      port: Number(port),
      rules: await readFile(
        new URL("../firestore.rules", import.meta.url),
        "utf8",
      ),
    },
  });
  try {
    const alice = doc(
      env.authenticatedContext("alice").firestore(),
      "progress/alice",
    );
    const bobAtAlice = doc(
      env.authenticatedContext("bob").firestore(),
      "progress/alice",
    );
    const guest = doc(
      env.unauthenticatedContext().firestore(),
      "progress/alice",
    );
    const data = {
      version: 1,
      lesson: null,
      progress: {},
      game: { streak: 0, best: 0 },
    };
    const save = (epoch, revision, payload = data) => ({
      version: 1,
      epoch,
      revision,
      data: payload,
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(setDoc(alice, save(0, 1)));
    await assertSucceeds(getDoc(alice));
    await assertFails(getDoc(guest));
    await assertFails(setDoc(guest, save(0, 2)));
    await assertFails(getDoc(bobAtAlice));
    await assertFails(setDoc(bobAtAlice, save(0, 2)));
    await assertFails(
      setDoc(alice, { ...save(0, 2), password: "must not be stored here" }),
    );
    await assertFails(
      setDoc(alice, save(0, 2, { ...data, progress: "not a map" })),
    );
    await assertFails(setDoc(alice, save(0, 8)));
    await assertSucceeds(
      setDoc(
        alice,
        save(0, 2, { ...data, progress: { "integers-1": { solved: [0] } } }),
      ),
    );
    await assertFails(
      setDoc(
        alice,
        save(1, 3, { ...data, progress: { "integers-1": { solved: [0] } } }),
      ),
    );
    await assertSucceeds(setDoc(alice, save(1, 3)));
    await assertFails(setDoc(alice, save(0, 4)));
    await assertSucceeds(setDoc(alice, save(1, 4)));
    const scored = {
      ...data,
      activityScores: {
        signedQuizBest: 10,
        signedQuizPassed: 10,
        integers: 17,
      },
    };
    await assertSucceeds(setDoc(alice, save(1, 5, scored)));
    await assertFails(setDoc(bobAtAlice, save(1, 6, scored)));
    await assertFails(setDoc(alice, save(1, 6))); // Older clients cannot drop records.
    await assertFails(
      setDoc(
        alice,
        save(1, 6, { ...scored, activityScores: { integers: 16 } }),
      ),
    );
    await assertFails(
      setDoc(
        alice,
        save(1, 6, { ...scored, activityScores: { integers: "17" } }),
      ),
    );
    await assertSucceeds(setDoc(alice, save(2, 6)));
    await assertFails(deleteDoc(alice));
    const learnerDb = env.authenticatedContext("learner", { email: "learner@example.com" }).firestore();
    const impersonatorDb = env.authenticatedContext("other-uid", { email: "dantramp52@gmail.com", admin: true }).firestore();
    const adminDb = env.authenticatedContext(adminUid, { email: "dantramp52@gmail.com" }).firestore();
    const guestDb = env.unauthenticatedContext().firestore();
    const id = "learner_00112233-4455-6677-8899-aabbccddeeff";
    const batch = {
      ...emptyStats(), uid: "learner", email: "learner@example.com",
      day: "2026-11-25", lastAt: Date.now(), lesson: 2, correct: 1, activeMs: 15_000,
    };
    const ledger = doc(learnerDb, "practiceActivity", id);
    await assertFails(setDoc(ledger, { ...batch, email: "someone@example.com" }));
    await assertFails(setDoc(ledger, { ...batch, correct: 3 }));
    await assertFails(setDoc(ledger, { ...batch, answer: "never store raw answers" }));
    await assertFails(setDoc(doc(impersonatorDb, "practiceActivity", id), batch));
    await assertFails(setDoc(doc(guestDb, "practiceActivity", id), batch));
    await assertSucceeds(setDoc(ledger, batch));
    await assertSucceeds(setDoc(ledger, batch));
    await assertFails(setDoc(ledger, { ...batch, activeMs: 0 }));
    await assertFails(deleteDoc(ledger));
    await assertFails(getDoc(ledger));
    await assertFails(getDocs(collection(learnerDb, "practiceActivity")));
    await assertFails(getDocs(collection(guestDb, "practiceActivity")));
    await assertFails(getDocs(collection(impersonatorDb, "practiceActivity")));
    const results = await assertSucceeds(getDocs(collection(adminDb, "practiceActivity")));
    assert.deepEqual(results.docs.find((snapshot) => snapshot.id === id).data(), batch);
    await assertFails(getDoc(doc(adminDb, "progress/alice")));
    await assertFails(
      setDoc(
        doc(env.authenticatedContext("alice").firestore(), "unrelated/example"),
        {},
      ),
    );
  } finally {
    await env.cleanup();
  }
});
