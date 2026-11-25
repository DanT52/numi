import { cloudDocument, emptyCloudProgress } from "./cloud-progress.js";
import { adminUid } from "./practice-stats.js";
import { presenceTimeout } from "./practice-presence.js";

// Firebase's browser configuration is public. Authorization lives in firestore.rules.
export const firebaseConfig = {
  apiKey: "AIzaSyA28iHGmQHQO5ZLykhhsbARPrhxmYEj9Kg",
  authDomain: "numi-5609a.firebaseapp.com",
  projectId: "numi-5609a",
  storageBucket: "numi-5609a.firebasestorage.app",
  messagingSenderId: "1093926404023",
  appId: "1:1093926404023:web:22f2c816d0949522867232",
};

export async function createFirebaseClient() {
  const [appSDK, authSDK, dbSDK] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js"),
  ]);
  return createFirebaseAdapter(appSDK, authSDK, dbSDK);
}

// The SDK boundary also lets integration tests use the real Firebase emulators.
export function createFirebaseAdapter(appSDK, authSDK, dbSDK) {
  const app = appSDK.initializeApp(firebaseConfig);
  const auth = authSDK.getAuth(app);
  const db = dbSDK.getFirestore(app);
  return {
    watchAuth: (callback) => authSDK.onAuthStateChanged(auth, callback),
    async signIn(email, password, remember) {
      await authSDK.setPersistence(
        auth,
        remember
          ? authSDK.browserLocalPersistence
          : authSDK.browserSessionPersistence,
      );
      return authSDK.signInWithEmailAndPassword(auth, email, password);
    },
    async signUp(email, password, remember) {
      await authSDK.setPersistence(
        auth,
        remember
          ? authSDK.browserLocalPersistence
          : authSDK.browserSessionPersistence,
      );
      return authSDK.createUserWithEmailAndPassword(auth, email, password);
    },
    resetPassword: (email) => authSDK.sendPasswordResetEmail(auth, email),
    signOut: () => authSDK.signOut(auth),
    async writePresence(id, entry) {
      if (auth.currentUser?.uid !== entry.uid) return;
      await dbSDK.setDoc(dbSDK.doc(db, "practicePresence", id), entry);
    },
    async removePresence(id, uid) {
      if (auth.currentUser?.uid !== uid) return;
      await dbSDK.deleteDoc(dbSDK.doc(db, "practicePresence", id));
    },
    watchPresence(callback) {
      if (auth.currentUser?.uid !== adminUid) return () => {};
      const active = dbSDK.query(
        dbSDK.collection(db, "practicePresence"),
        dbSDK.where("seenAt", ">", Date.now() - presenceTimeout),
      );
      return dbSDK.onSnapshot(active, { includeMetadataChanges: true }, (snapshot) => {
        callback(snapshot.metadata.fromCache ? null : snapshot.docs.map((doc) => doc.data()));
      }, () => callback(null));
    },
    writePracticeActivity({ id, ...entry }) {
      if (auth.currentUser?.uid !== entry.uid) return Promise.reject(new Error("Account changed"));
      return dbSDK.setDoc(dbSDK.doc(db, "practiceActivity", id), entry);
    },
    async readPracticeActivity(from, until) {
      if (auth.currentUser?.uid !== adminUid) throw new Error("Admin access required");
      const days = dbSDK.query(
        dbSDK.collection(db, "practiceActivity"),
        dbSDK.where("day", ">=", from),
        dbSDK.where("day", "<", until),
      );
      const snapshot = await dbSDK.getDocsFromServer(days);
      return snapshot.docs.map((doc) => doc.data());
    },
    progress(uid) {
      const ref = dbSDK.doc(db, "progress", uid);
      return {
        watch(callback, onError) {
          return dbSDK.onSnapshot(
            ref,
            { includeMetadataChanges: true },
            (snapshot) => {
              // An empty local cache must not overwrite a save that hasn't loaded yet.
              if (
                !snapshot.metadata.fromCache &&
                !snapshot.metadata.hasPendingWrites
              )
                callback(snapshot.exists() ? snapshot.data() : null);
            },
            onError,
          );
        },
        write(merge) {
          return dbSDK.runTransaction(db, async (transaction) => {
            const snapshot = await transaction.get(ref);
            const previous = snapshot.exists() ? snapshot.data() : null;
            const next = merge(previous);
            if (!previous || next.revision !== previous.revision)
              transaction.set(ref, {
                ...next,
                updatedAt: dbSDK.serverTimestamp(),
              });
            return next;
          });
        },
        reset() {
          return dbSDK.runTransaction(db, async (transaction) => {
            const snapshot = await transaction.get(ref);
            const previous = cloudDocument(
              snapshot.exists() ? snapshot.data() : null,
            );
            const next = {
              version: 1,
              epoch: previous.epoch + 1,
              revision: previous.revision + 1,
              data: emptyCloudProgress(),
            };
            transaction.set(ref, {
              ...next,
              updatedAt: dbSDK.serverTimestamp(),
            });
            return next;
          });
        },
      };
    },
  };
}

export function accountError(error) {
  return (
    {
      "auth/invalid-email": "Enter a valid email address.",
      "auth/invalid-credential": "The email or password is incorrect.",
      "auth/user-not-found": "The email or password is incorrect.",
      "auth/wrong-password": "The email or password is incorrect.",
      "auth/email-already-in-use":
        "An account already uses this email. Sign in or reset your password.",
      "auth/weak-password":
        "Choose a stronger password with at least 8 characters.",
      "auth/too-many-requests":
        "Too many attempts. Please wait a little and try again.",
      "auth/network-request-failed":
        "Could not connect. Check your internet connection and try again.",
      "auth/operation-not-allowed":
        "Email and password sign-in is not available yet. You can keep learning as a guest.",
      "auth/user-disabled":
        "This account is disabled. Contact the app owner for help.",
    }[error?.code] || "Could not complete that request. Please try again."
  );
}
