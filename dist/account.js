import { escapeHTML as esc } from "./math.js";
import { createFirebaseClient, accountError } from "./firebase-client.js";
import {
  cloudProgress,
  createProgressSync,
  emptyCloudProgress,
  mergeCloudProgress,
  sameProgress,
} from "./cloud-progress.js";
import { migrateLessonProgress } from "./progress-migration.js";

const GUEST = "numi.progress.v1";
const blankState = () => ({
  version: 1,
  view: "lessons",
  topic: "all",
  ...emptyCloudProgress(),
});
const button = (text, action, cls = "btn btn-outline", extra = "") =>
  `<button type="button" class="${cls}" data-action="${action}" ${extra}>${text}</button>`;

export function createAccountManager({
  getState,
  replaceState,
  render,
  storage = localStorage,
  clientFactory = createFirebaseClient,
  onStorageError = () => {},
}) {
  let api,
    user = null,
    sync,
    metadata,
    unsubscribeAuth;
  let ready = false,
    starting = false,
    unavailable = false,
    busy = false,
    signupImport = false;
  let storageUnavailable = false;
  let mode = "sign-in",
    email = "",
    remember = true,
    message = "",
    syncKind = "guest",
    syncError;
  let cloudReset = false;
  let key = GUEST,
    transition = 0;
  function load(storageKey) {
    try {
      const value = JSON.parse(storage.getItem(storageKey));
      return value?.version === 1 && value.progress
        ? migrateLessonProgress(value)
        : null;
    } catch {
      return null;
    }
  }
  function persist(value = getState()) {
    try {
      storage.setItem(
        key,
        JSON.stringify(user ? { ...value, cloud: metadata } : value),
      );
      storageUnavailable = false;
      return true;
    } catch {
      storageUnavailable = true;
      onStorageError();
      return false;
    }
  }
  function guestWork() {
    const data = cloudProgress(load(GUEST));
    const solved = Object.values(data.progress).reduce(
      (sum, p) => sum + p.solved.length,
      0,
    );
    const hasWork =
      !!data.activityScores ||
      Object.values(data.progress).some(
        (p) => p.solved.length || Object.keys(p.answers).length,
      );
    return { data, solved, hasWork };
  }
  function offerGuest() {
    try {
      return (
        user &&
        guestWork().hasWork &&
        !storage.getItem(`numi.guest.offer.${user.uid}`)
      );
    } catch {
      return false;
    }
  }
  function dismissGuest() {
    try {
      storage.setItem(`numi.guest.offer.${user.uid}`, "dismissed");
    } catch {
      /* Optional UI preference. */
    }
  }
  function label() {
    if (storageUnavailable && (!user || syncKind !== "saved"))
      return "Progress stays in this tab";
    if (!user) return starting ? "Checking sign-in…" : "Saved on this device";
    return (
      {
        loading: "Loading cloud progress…",
        pending: "Saved locally · Sync pending",
        saving: "Saving to your account…",
        saved: "Synced to your account",
        error: "Saved locally · Sync needs attention",
        offline: "Saved locally · Offline",
      }[syncKind] || "Saved on this device"
    );
  }
  function statusMessage() {
    if (storageUnavailable && syncKind !== "saved")
      return "Browser storage is unavailable. Keep this tab open until your account has synced.";
    if (syncKind === "error")
      return syncError?.code === "permission-denied"
        ? "Cloud saves are unavailable. Your work is saved on this device. Retry after the app owner checks account access."
        : "Cloud sync is temporarily unavailable. Your work is saved on this device and will retry automatically.";
    return label();
  }
  function updateStatus() {
    document.querySelectorAll("[data-cloud-status]").forEach((el) => {
      el.textContent = label();
    });
    const status = document.querySelector("#account-sync-status");
    if (status) status.textContent = statusMessage();
    const retry = document.querySelector("#retry-cloud-sync");
    if (retry) retry.hidden = !["error", "offline"].includes(syncKind);
  }
  function refreshAccount() {
    const panel = document.querySelector("#account-panel");
    if (panel) panel.outerHTML = view();
    updateStatus();
  }
  function apply(data) {
    if (cloudReset || !sameProgress(cloudProgress(getState()), data)) {
      const next = { ...getState(), ...data };
      if (!data.activityScores) delete next.activityScores;
      if (cloudReset) delete next.activity;
      cloudReset = false;
      replaceState(next);
      render();
    }
    persist();
  }
  function changedUser(nextUser) {
    if (ready && user?.uid === nextUser?.uid) return;
    persist();
    const run = ++transition;
    sync?.dispose();
    sync = undefined;
    user = nextUser
      ? { uid: nextUser.uid, email: nextUser.email || "Your account" }
      : null;
    key = user ? `numi.progress.user.${user.uid}.v1` : GUEST;
    ready = true;
    starting = false;
    unavailable = false;
    const previous = getState(),
      cached = load(key);
    let next = cached || blankState();
    metadata = user ? cached?.cloud : undefined;
    cloudReset = false;
    if (user && signupImport) {
      next = {
        ...next,
        ...mergeCloudProgress(cloudProgress(next), guestWork().data),
      };
      dismissGuest();
    }
    signupImport = false;
    if (previous.view === "settings") next.view = "settings";
    replaceState(next, true);
    syncKind = user ? "loading" : "guest";
    if (user) {
      sync = createProgressSync({
        remote: api.progress(user.uid),
        initial: next,
        metadata,
        onChange: (data) => {
          if (run === transition) apply(data);
        },
        onMetadata: (value) => {
          if (run === transition) {
            if (metadata?.epoch != null && value.epoch !== metadata.epoch)
              cloudReset = true;
            metadata = value;
            persist();
          }
        },
        onStatus: (kind, error) => {
          if (run !== transition) return;
          syncKind =
            typeof navigator !== "undefined" && navigator.onLine === false
              ? "offline"
              : kind;
          syncError = error;
          updateStatus();
        },
      });
    }
    render();
    sync?.start();
  }
  async function start() {
    if (starting || api) return;
    starting = true;
    unavailable = false;
    refreshAccount();
    try {
      api = await clientFactory();
      unsubscribeAuth = api.watchAuth(changedUser);
    } catch {
      api = undefined;
      starting = false;
      unavailable = true;
      message =
        "Sign-in could not connect. You can keep learning as a guest and try again later.";
      refreshAccount();
    }
  }
  function view() {
    if (user)
      return `<section id="account-panel" class="account-panel" aria-labelledby="account-title"><h2 id="account-title" tabindex="-1">Your account</h2><p class="account-email">${esc(user.email)}</p><p id="account-sync-status" class="account-status" role="status">${esc(statusMessage())}</p><div class="transfer-actions">${button(busy ? "Signing out…" : "Sign out", "auth-sign-out", "btn btn-outline", busy ? "disabled" : "")}${button("Retry sync", "auth-retry-sync", "btn btn-outline", `id="retry-cloud-sync" ${!["error", "offline"].includes(syncKind) ? "hidden" : ""}`)}</div>${offerGuest() ? `<div class="guest-progress-offer"><h3>Bring your guest progress with you</h3><p>You have ${guestWork().solved} solved problems saved as a guest on this device. You can add that work to this account.</p><div class="transfer-actions">${button("Add guest progress", "auth-add-guest", "btn btn-primary")}${button("Keep separate", "auth-dismiss-guest")}</div></div>` : ""}${message ? `<p class="account-message" role="status">${esc(message)}</p>` : ""}</section>`;
    const signup = mode === "sign-up",
      reset = mode === "reset";
    const disabled = busy || !ready || !api;
    return `<section id="account-panel" class="account-panel" aria-labelledby="account-title"><h2 id="account-title" tabindex="-1">${reset ? "Reset your password" : signup ? "Create an account" : "Sign in to save across devices"}</h2><p>${reset ? "Enter your account email and we’ll send password reset instructions." : signup ? "Your guest progress on this device will be added to your new account." : "Your guest progress stays on this device until you choose to add it to an account."}</p>${starting ? '<p class="account-status" role="status">Connecting to sign-in…</p>' : ""}${unavailable ? button("Retry connection", "auth-retry", "btn btn-outline") : ""}<form id="account-form"><label for="account-email">Email address</label><input id="account-email" name="email" type="email" autocomplete="username" required maxlength="254" value="${esc(email)}" ${busy ? "disabled" : ""}>${!reset ? `<label for="account-password">Password${signup ? " <span>(at least 8 characters)</span>" : ""}</label><input id="account-password" name="password" type="password" autocomplete="${signup ? "new-password" : "current-password"}" minlength="${signup ? 8 : 1}" maxlength="128" required ${busy ? "disabled" : ""}>${signup ? '<label for="account-password-confirm">Confirm password</label><input id="account-password-confirm" name="confirm-password" type="password" autocomplete="new-password" required maxlength="128">' : ""}<label class="remember-login"><input id="remember-login" type="checkbox" ${remember ? "checked" : ""}><span>Keep me signed in on this device</span></label>` : ""}<button type="submit" class="btn btn-primary" ${disabled ? "disabled" : ""}>${busy ? "Please wait…" : reset ? "Send reset email" : signup ? "Create account" : "Sign in"}</button></form><div class="account-links">${button(reset || signup ? "Back to sign in" : "Create an account", `auth-mode:${reset || signup ? "sign-in" : "sign-up"}`, "text-button", busy ? "disabled" : "")}${!reset && !signup ? button("Forgot password?", "auth-mode:reset", "text-button", busy ? "disabled" : "") : ""}</div>${message ? `<p class="account-message" role="status">${esc(message)}</p>` : ""}</section>`;
  }
  async function submit() {
    if (busy || !api || !ready) return;
    email = document.querySelector("#account-email").value.trim();
    const password = document.querySelector("#account-password")?.value || "";
    const confirmation = document.querySelector(
      "#account-password-confirm",
    )?.value;
    remember = document.querySelector("#remember-login")?.checked ?? remember;
    if (
      mode === "sign-up" &&
      (password.length < 8 || password !== confirmation)
    ) {
      message =
        password.length < 8
          ? "Use at least 8 characters for your password."
          : "The passwords don’t match.";
      refreshAccount();
      return;
    }
    busy = true;
    message = "";
    signupImport = mode === "sign-up";
    refreshAccount();
    try {
      if (mode === "reset") {
        await api.resetPassword(email);
        message =
          "If an account uses that email, password reset instructions are on their way. Check your inbox and spam folder.";
      } else if (mode === "sign-up")
        await api.signUp(email, password, remember);
      else await api.signIn(email, password, remember);
    } catch (error) {
      signupImport = false;
      message = accountError(error);
    } finally {
      busy = false;
      refreshAccount();
    }
  }
  async function signOut() {
    if (busy || !api) return;
    busy = true;
    message = "";
    refreshAccount();
    try {
      persist();
      if (typeof navigator === "undefined" || navigator.onLine !== false) {
        let timeout;
        try {
          await Promise.race([
            sync?.flush(),
            new Promise((resolve) => {
              timeout = setTimeout(resolve, 5000);
            }),
          ]);
        } catch {
          /* Unsynced work remains in this account's local cache. */
        } finally {
          clearTimeout(timeout);
        }
      }
      await api.signOut();
      message = "Signed out. You can continue as a guest.";
    } catch (error) {
      message = accountError(error);
    } finally {
      busy = false;
      refreshAccount();
    }
  }
  return {
    start,
    view,
    submit,
    label,
    get user() {
      return user;
    },
    get storageKey() {
      return key;
    },
    save(value) {
      sync?.edit(value);
      return persist(value);
    },
    async resetProgress() {
      if (!user || !sync)
        throw Error("Sign in before deleting account progress.");
      if (typeof navigator !== "undefined" && navigator.onLine === false)
        throw Error(
          "Connect to the internet before deleting account progress.",
        );
      await sync.reset();
    },
    handleClick(action, value) {
      if (action === "auth-mode") {
        email = document.querySelector("#account-email")?.value.trim() || email;
        mode = value;
        message = "";
        refreshAccount();
        document.querySelector("#account-email")?.focus();
      } else if (action === "auth-retry") start();
      else if (action === "auth-sign-out") signOut();
      else if (action === "auth-retry-sync") sync?.retry();
      else if (action === "auth-dismiss-guest") {
        dismissGuest();
        refreshAccount();
      } else if (action === "auth-add-guest" && user) {
        const merged = mergeCloudProgress(
          cloudProgress(getState()),
          guestWork().data,
        );
        dismissGuest();
        apply(merged);
        sync?.edit(merged);
        refreshAccount();
      } else return false;
      return true;
    },
    online() {
      sync?.retry();
    },
    offline() {
      if (user) {
        syncKind = "offline";
        updateStatus();
      }
    },
    flush() {
      return sync?.flush();
    },
    dispose() {
      transition++;
      sync?.dispose();
      unsubscribeAuth?.();
    },
  };
}
