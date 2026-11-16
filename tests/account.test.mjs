import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { createAccountManager } from "../dist/account.js";
import { emptyCloudProgress, cloudDocument } from "../dist/cloud-progress.js";
import { accountError } from "../dist/firebase-client.js";

const blank = () => ({
  ...emptyCloudProgress(),
  view: "settings",
  topic: "all",
});
const worked = (answer) => ({
  ...blank(),
  lesson: "integers-1",
  progress: {
    "integers-1": {
      index: 0,
      stage: "practice",
      solved: [0],
      answers: { 0: answer },
      hints: [],
      reveals: [],
    },
  },
});
function setup(guest = worked("2")) {
  const { window } = parseHTML(
    '<html><body><div id="app"></div></body></html>',
  );
  globalThis.document = window.document;
  const records = new Map([["numi.progress.v1", JSON.stringify(guest)]]);
  const storage = {
    getItem: (key) => records.get(key) || null,
    setItem: (key, value) => records.set(key, value),
  };
  let state = guest,
    authListener,
    manager,
    credentials;
  const documents = new Map();
  const api = {
    watchAuth(callback) {
      authListener = callback;
      callback(null);
      return () => {};
    },
    async signIn(email, password, remember) {
      credentials = { email, password, remember };
      authListener({ uid: email.split("@")[0], email });
    },
    async signUp(email, password, remember) {
      return this.signIn(email, password, remember);
    },
    async resetPassword(email) {
      credentials = { reset: email };
    },
    async signOut() {
      authListener(null);
    },
    progress(uid) {
      return {
        watch(callback) {
          callback(documents.get(uid) || null);
          return () => {};
        },
        async write(merge) {
          const next = merge(documents.get(uid) || null);
          documents.set(uid, next);
          return next;
        },
        async reset() {
          const previous = cloudDocument(documents.get(uid));
          const next = {
            version: 1,
            epoch: previous.epoch + 1,
            revision: previous.revision + 1,
            data: emptyCloudProgress(),
          };
          documents.set(uid, next);
          return next;
        },
      };
    },
  };
  function render() {
    document.querySelector("#app").innerHTML = manager.view();
    manager.save(state);
  }
  manager = createAccountManager({
    getState: () => state,
    replaceState: (value) => {
      state = value;
    },
    render,
    storage,
    clientFactory: async () => api,
  });
  render();
  return {
    manager,
    records,
    documents,
    api,
    render,
    get state() {
      return state;
    },
    get credentials() {
      return credentials;
    },
    emit(user) {
      authListener(user);
    },
    fill(email, password, remember = true) {
      document.querySelector("#account-email").value = email;
      if (document.querySelector("#account-password"))
        document.querySelector("#account-password").value = password;
      if (document.querySelector("#account-password-confirm"))
        document.querySelector("#account-password-confirm").value = password;
      if (document.querySelector("#remember-login"))
        document.querySelector("#remember-login").checked = remember;
    },
  };
}

test("sign-in uses the selected persistence and isolates guest and account caches", async () => {
  const h = setup();
  await h.manager.start();
  h.documents.set("alice", {
    version: 1,
    epoch: 0,
    revision: 1,
    data: worked("cloud answer"),
  });
  h.fill("alice@example.com", "secret-password", false);
  await h.manager.submit();
  assert.equal(h.credentials.remember, false);
  assert.equal(h.manager.user.uid, "alice");
  assert.equal(h.state.progress["integers-1"].answers[0], "cloud answer");
  assert.equal(
    JSON.parse(h.records.get("numi.progress.v1")).progress["integers-1"]
      .answers[0],
    "2",
  );
  assert.ok(h.records.has("numi.progress.user.alice.v1"));
  assert.ok(document.querySelector('[data-action="auth-add-guest"]'));
  assert.ok(![...h.records.values()].join("").includes("secret-password"));
  h.emit(null);
  assert.equal(h.state.progress["integers-1"].answers[0], "2");
  h.emit({ uid: "bob", email: "bob@example.com" });
  assert.equal(h.state.progress["integers-1"], undefined);
  h.manager.dispose();
});

test("creating an account brings existing guest progress and remembers login by default", async () => {
  const h = setup();
  await h.manager.start();
  h.manager.handleClick("auth-mode", "sign-up");
  h.fill("new@example.com", "another-secret");
  await h.manager.submit();
  await h.manager.flush();
  assert.equal(h.credentials.remember, true);
  assert.deepEqual(h.documents.get("new").data.progress["integers-1"].solved, [
    0,
  ]);
  assert.equal(document.querySelector('[data-action="auth-add-guest"]'), null);
  assert.ok(![...h.records.values()].join("").includes("another-secret"));
  h.manager.dispose();
});

test("restored sessions use their account cache and never auto-import guest work", async () => {
  const h = setup();
  await h.manager.start();
  h.records.set(
    "numi.progress.user.alice.v1",
    JSON.stringify(worked("cached draft")),
  );
  h.emit({ uid: "alice", email: "alice@example.com" });
  assert.equal(h.state.progress["integers-1"].answers[0], "cached draft");
  assert.equal(
    h.records.get("numi.progress.v1").includes("cached draft"),
    false,
  );
  h.manager.handleClick("auth-dismiss-guest");
  h.emit(null);
  h.emit({ uid: "alice", email: "alice@example.com" });
  assert.equal(document.querySelector('[data-action="auth-add-guest"]'), null);
  h.manager.dispose();
});

test("password reset and sign-in errors give useful messages without storing credentials", async () => {
  const h = setup();
  await h.manager.start();
  h.manager.handleClick("auth-mode", "reset");
  h.fill("alice@example.com");
  await h.manager.submit();
  assert.deepEqual(h.credentials, { reset: "alice@example.com" });
  assert.match(
    document.querySelector(".account-message").textContent,
    /reset instructions/,
  );
  h.manager.handleClick("auth-mode", "sign-in");
  h.api.signIn = async () => {
    throw { code: "auth/invalid-credential" };
  };
  h.fill("alice@example.com", "wrong-password");
  await h.manager.submit();
  assert.match(
    document.querySelector(".account-message").textContent,
    /email or password is incorrect/,
  );
  assert.equal(h.manager.user, null);
  assert.equal(
    JSON.stringify([...h.records]).includes("wrong-password"),
    false,
  );
  assert.match(
    accountError({ code: "auth/network-request-failed" }),
    /internet/,
  );
  h.manager.dispose();
});

test("account progress reset clears cloud work while preserving the guest profile", async () => {
  const h = setup();
  await h.manager.start();
  h.documents.set("alice", {
    version: 1,
    epoch: 0,
    revision: 1,
    data: worked("2"),
  });
  h.emit({ uid: "alice", email: "alice@example.com" });
  await h.manager.resetProgress();
  assert.equal(h.documents.get("alice").epoch, 1);
  assert.deepEqual(h.documents.get("alice").data.progress, {});
  assert.deepEqual(h.state.progress, {});
  assert.deepEqual(
    JSON.parse(h.records.get("numi.progress.v1")).progress["integers-1"].solved,
    [0],
  );
  h.manager.dispose();
});
