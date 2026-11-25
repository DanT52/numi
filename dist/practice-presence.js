const HEARTBEAT_MS = 45_000;
export const presenceTimeout = 120_000;
const PRACTICE_IDLE_MS = 90_000;

export function onlineLearners(sessions, now = Date.now()) {
  const learners = new Map();
  for (const session of sessions) {
    if (session.seenAt + presenceTimeout <= now) continue;
    const previous = learners.get(session.uid);
    learners.set(session.uid, {
      uid: session.uid,
      email: previous && previous.seenAt > session.seenAt ? previous.email : session.email,
      seenAt: Math.max(previous?.seenAt ?? 0, session.seenAt),
      practicing: !!previous?.practicing || session.practicing,
    });
  }
  return learners;
}

export function createPresenceReporter({ write, remove, online, now = Date.now }) {
  let session;
  let heartbeat;
  let idleTimer;
  let practiceScreen = false;
  let lastPractice = null;

  function pulse() {
    if (!session || session.paused || session.sending || !online()) return;
    const time = now();
    const practicing = practiceScreen && lastPractice !== null && time - lastPractice < PRACTICE_IDLE_MS;
    if (practicing === session.practicing && time - session.sentAt < HEARTBEAT_MS) return;
    const current = session;
    current.sending = true;
    current.practicing = practicing;
    current.sentAt = time;
    write(current.id, { ...current.user, practicing, seenAt: time }).catch(() => {}).finally(() => {
      current.sending = false;
      if (session === current) pulse();
    });
  }

  function leave() {
    if (!session || session.paused) return;
    session.paused = true;
    clearInterval(heartbeat);
    clearTimeout(idleTimer);
    practiceScreen = false;
    lastPractice = null;
    if (online()) remove(session.id, session.user.uid).catch(() => {});
  }

  function resume() {
    if (!session || !session.paused) return;
    session.paused = false;
    session.sentAt = -Infinity;
    heartbeat = setInterval(pulse, HEARTBEAT_MS);
    pulse();
  }

  return {
    setUser(user) {
      if (session?.user.uid === user?.uid) return;
      leave();
      session = user && { user, id: `${user.uid}_${crypto.randomUUID()}`, paused: true };
      resume();
    },
    setPracticeScreen(available) {
      if (!session || session.paused || available === practiceScreen) return;
      practiceScreen = available;
      if (!available) {
        clearTimeout(idleTimer);
        lastPractice = null;
      }
      pulse();
    },
    interact() {
      if (!session || session.paused || !practiceScreen) return;
      lastPractice = now();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(pulse, PRACTICE_IDLE_MS);
      pulse();
    },
    reconnect() {
      if (session) session.sentAt = -Infinity;
      pulse();
    },
    leave,
    resume,
  };
}
