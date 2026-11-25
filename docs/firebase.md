# Firebase accounts and progress

Numi stays a static GitHub Pages app. Firebase Authentication handles email/password
accounts, password resets, token refresh, and remembered sessions. Firestore stores
one private progress document per user at `progress/{uid}`. The frontend does not
initialize Analytics, and never stores passwords in app state or progress exports.

## Project setup

The configured project is `numi-5609a`. Its public web configuration is in
`dist/firebase-client.js`; it is not an administrative credential. Enable
Email/Password in Authentication and add `dant52.github.io` and `localhost` to its
authorized domains. Create a default Firestore Standard database. Firebase Hosting
and Cloud Functions are not required; the Spark plan is sufficient within quotas.

Install Node.js 24.12+ for development and Java 21+ for emulator tests. Then run:

```sh
npm ci
npm test
npm run test:firebase
```

The last command starts isolated Authentication and Firestore emulators against
`demo-numi`, tests real SDK login/transactions as well as database security rules,
then shuts them down. It never creates accounts or edits data in the live project.
The GitHub Pages workflow runs both suites before publishing `dist/`.

For rule changes, sign in to the Firebase CLI and deploy from this directory:

```sh
npx --yes firebase-tools@15.36.0 login
npx --yes firebase-tools@15.36.0 deploy --only firestore:rules --project numi-5609a
```

GitHub Actions tests the rules but does not deploy them: Firebase administrator
credentials are intentionally not stored in GitHub. Deploy changed rules before
pushing an app version that depends on them. App-only updates need the usual Git
commit/push; GitHub Pages publishes automatically. Keep CLI credentials and service
account files outside this checkout.

## Account experience

- Open Sign in in the header or the account section at the top of Settings.
- New accounts bring over the current guest work. Existing accounts explicitly
  offer Add guest progress or Keep separate, to prevent merging another person's
  work on a shared device.
- Keep me signed in is selected by default and uses Firebase local persistence.
  Unchecking it uses per-tab session persistence. No password is saved by Numi.
- Sign out returns to the separate guest profile. Pending work remains in the
  original account's local cache for its next session.
- Password reset uses Firebase's standard email flow. Configure its email templates
  in Firebase Authentication if you want custom branding.
- Appearance preferences remain local to each device.

## Activity dashboard

The Admin tab uses the same Firebase sign-in as Numi. The allowed Firebase UID
is configured in `dist/practice-stats.js` and `firestore.rules`. Change both if
you transfer dashboard access. Only that UID can read `practiceActivity`. The
existing `progress` collection remains readable by each account owner.

The Admin dashboard subscribes to recent `practicePresence` entries. A signed-in
tab updates its heartbeat every 45 seconds. Practice status requires a focused
problem and recent interaction, and clears after 90 seconds of inactivity.
The dashboard ignores heartbeats older than two minutes. Each signed-in tab can
write or delete its own presence entry, and only the dashboard UID can read the
collection.

Numi collects signed-in activity and queues immutable batches in browser storage
until Firestore acknowledges them. Each batch identifies the account and Pacific
date and contains counters and timing totals. Answer text and keystrokes are
excluded. The dashboard reads one month at a time.

When learners sync, their current completion count and per-topic best review
streaks are mirrored to `practiceSummaries`. Only the dashboard UID can read
that collection. Review averages use new timing samples of up to two active
minutes per answer. Older activity batches remain readable and do not affect
the filtered averages.

Practice time is committed through the last submitted answer in an active
interval. The clock pauses when the tab loses focus and starts a new interval
after five minutes without interaction. Quiz and signed-number review per-answer
averages use observed question timings. An interrupted or restored quiz can still
contribute its final result even when a full run timing is unavailable. Activity
starts accumulating with this release. The existing Delete all progress control
clears lesson progress and scores independently of aggregate activity history.

## Saving and conflicts

Guest work retains the original `numi.progress.v1` localStorage key. Each account
uses `numi.progress.user.{uid}.v1`; caches are loaded only after Firebase confirms
the matching signed-in user. Each cache includes its last acknowledged server
snapshot so unsynced edits survive reloads and can be merged correctly.

Changes save locally immediately. Cloud writes are debounced, unchanged renders
do not write, and connection errors retain local work and retry. The account panel
and header show whether progress is synced or waiting. Firestore transactions
merge completion and hint unlocks, and use a three-way comparison to avoid
overwriting another device's answer or position with unchanged cached values.

Delete all progress requires confirmation. For a signed-in account it commits a
new reset epoch and an empty save. Older devices must observe that epoch before
uploading again, so old offline data cannot recreate deleted progress. The reset
needs a working connection; failure leaves work in place. Separate guest work and
appearance are kept. Existing NUMI2 codes and JSON backups can still restore work
explicitly. Old NUMI1 codes remain unsupported.

## Files

- `dist/account.js`: account UI, session transitions, guest import, scoped caches.
- `dist/cloud-progress.js`: validation, conflict merging, debounce/retry/reset logic.
- `dist/firebase-client.js`: pinned Firebase browser SDK and service adapter.
- `firestore.rules`: private access, payload validation, revision/reset protection.
- `firebase.json` and `.firebaserc`: CLI project and local emulators.
- `tests/account.test.mjs`, `tests/cloud-progress.test.mjs`: account/sync behavior.
- `tests/firebase-client.test.mjs`, `tests/firestore-rules.test.mjs`: real SDK and
  security checks against emulators.
