import test from "node:test";
import assert from "node:assert/strict";
import {
  cloudProgress,
  cloudDocument,
  emptyCloudProgress,
  mergeCloudProgress,
  mergeCloudDocument,
  createProgressSync,
  sameProgress,
} from "../dist/cloud-progress.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const lesson = (solved = [], answers = {}) => ({
  index: 0,
  stage: "practice",
  solved,
  answers,
  hints: [],
  reveals: [],
});
const data = (solved = [], answers = {}) => ({
  ...emptyCloudProgress(),
  lesson: "integers-1",
  progress: { "integers-1": lesson(solved, answers) },
});
function backend(initial = null) {
  let document = initial,
    writes = 0,
    fail = false;
  const listeners = new Set();
  const remote = {
    watch(receive) {
      listeners.add(receive);
      receive(clone(document));
      return () => listeners.delete(receive);
    },
    async write(merge) {
      if (fail) throw Object.assign(Error("offline"), { code: "unavailable" });
      const next = merge(clone(document));
      if (!document || next.revision !== document.revision) {
        document = clone(next);
        writes++;
      }
      return clone(document);
    },
    async reset() {
      if (fail) throw Error("offline");
      const old = cloudDocument(document);
      document = {
        version: 1,
        epoch: old.epoch + 1,
        revision: old.revision + 1,
        data: emptyCloudProgress(),
      };
      return clone(document);
    },
  };
  return {
    remote,
    get document() {
      return clone(document);
    },
    get writes() {
      return writes;
    },
    set offline(value) {
      fail = value;
    },
    broadcast() {
      for (const receive of listeners) receive(clone(document));
    },
  };
}
function device(server, initial = emptyCloudProgress(), metadata) {
  let latest = initial,
    meta,
    status;
  const sync = createProgressSync({
    remote: server.remote,
    initial,
    metadata,
    schedule: () => 0,
    cancel: () => {},
    onChange: (value) => {
      latest = value;
    },
    onMetadata: (value) => {
      meta = value;
    },
    onStatus: (value) => {
      status = value;
    },
  });
  sync.start();
  return {
    sync,
    get latest() {
      return latest;
    },
    get meta() {
      return meta;
    },
    get status() {
      return status;
    },
  };
}

test("three-way merge preserves concurrent answers, completion, positions and hint unlocks", () => {
  const base = data([0], { 0: "2", 1: "draft" });
  const left = clone(base),
    right = clone(base);
  left.progress["integers-1"].answers[1] = "-3";
  left.progress["integers-1"].solved.push(1);
  right.progress["integers-1"].answers[2] = "-8";
  right.progress["integers-1"].solved.push(2);
  right.progress["integers-1"].index = 2;
  right.progress["integers-1"].failedChecks = { 2: 2 };
  right.game.best = 3;
  const merged = mergeCloudProgress(right, left, base);
  assert.deepEqual(merged.progress["integers-1"].answers, {
    0: "2",
    1: "-3",
    2: "-8",
  });
  assert.deepEqual(
    new Set(merged.progress["integers-1"].solved),
    new Set([0, 1, 2]),
  );
  assert.equal(merged.progress["integers-1"].index, 2);
  assert.equal(merged.progress["integers-1"].failedChecks[2], 2);
  assert.equal(merged.game.best, 3);
});

test("two devices save without losing each other's solved problems", async () => {
  const server = backend(),
    a = device(server),
    b = device(server);
  a.sync.edit(data([0], { 0: "2" }));
  b.sync.edit(data([1], { 1: "-3" }));
  await a.sync.flush();
  await b.sync.flush();
  server.broadcast();
  for (const d of [a, b]) {
    assert.deepEqual(
      new Set(d.latest.progress["integers-1"].solved),
      new Set([0, 1]),
    );
    assert.deepEqual(d.latest.progress["integers-1"].answers, {
      0: "2",
      1: "-3",
    });
    d.sync.dispose();
  }
});

test("offline edits survive reload with their merge base and retry successfully", async () => {
  const server = backend(),
    a = device(server);
  server.offline = true;
  a.sync.edit(data([0], { 0: "2" }));
  await assert.rejects(a.sync.flush());
  assert.equal(a.status, "error");
  const cached = data([0], { 0: "2" }),
    metadata = a.meta;
  a.sync.dispose();
  server.offline = false;
  const reopened = device(server, cached, metadata);
  await reopened.sync.flush();
  assert.deepEqual(server.document.data.progress["integers-1"].solved, [0]);
  assert.equal(reopened.status, "saved");
  reopened.sync.dispose();
});

test("reset epochs prevent a stale offline device from restoring deleted work", async () => {
  const server = backend({
    version: 1,
    epoch: 0,
    revision: 1,
    data: data([0], { 0: "2" }),
  });
  const a = device(server),
    b = device(server);
  const stale = data([0, 1], { 0: "2", 1: "-3" });
  b.sync.edit(stale);
  await a.sync.reset();
  await b.sync.flush(); // Transaction sees the newer epoch even before the listener does.
  assert.equal(server.document.epoch, 1);
  assert.deepEqual(server.document.data.progress, {});
  assert.deepEqual(b.latest.progress, {});
  assert.deepEqual(b.latest.game, { streak: 0, best: 0 });
  const staleMetadata = { epoch: 0, revision: 1, base: data([0], { 0: "2" }) };
  const reopened = device(server, stale, staleMetadata);
  assert.deepEqual(reopened.latest.progress, {});
  for (const d of [a, b, reopened]) d.sync.dispose();
});

test("unchanged saves do not write and object-key order does not cause sync loops", async () => {
  const server = backend(),
    a = device(server);
  a.sync.edit(data([0], { 0: "2" }));
  await a.sync.flush();
  server.broadcast();
  const writes = server.writes;
  a.sync.edit(clone(a.latest));
  await a.sync.flush();
  assert.equal(server.writes, writes);
  assert.ok(sameProgress({ a: 1, b: 2 }, { b: 2, a: 1 }));
  a.sync.dispose();
});

test("edits made during an in-flight save remain queued", async () => {
  const server = backend(),
    original = server.remote.write;
  let release;
  server.remote.write = async (merge) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    return original(merge);
  };
  const a = device(server);
  a.sync.edit(data([0], { 0: "2" }));
  const pending = a.sync.flush();
  a.sync.edit(data([0, 1], { 0: "2", 1: "-3" }));
  release();
  await pending;
  server.remote.write = original;
  await a.sync.flush();
  assert.deepEqual(server.document.data.progress["integers-1"].solved, [0, 1]);
  a.sync.dispose();
});

test("failed reset keeps work and disposed sessions ignore late responses", async () => {
  const server = backend({
    version: 1,
    epoch: 0,
    revision: 1,
    data: data([0], { 0: "2" }),
  });
  const a = device(server);
  server.offline = true;
  await assert.rejects(a.sync.reset());
  assert.deepEqual(a.latest.progress["integers-1"].solved, [0]);
  a.sync.dispose();
  assert.equal(
    mergeCloudDocument(server.document, data([1]), data(), -1).revision,
    1,
  );
  assert.throws(() => cloudDocument({ version: 2, epoch: 0, revision: 1 }));
  assert.throws(() =>
    cloudProgress({
      progress: { "integers-1": { ...lesson(), solved: [999] } },
    }),
  );
});

test("a late save response cannot roll back a newer reset received by the listener", async () => {
  const server = backend({
    version: 1,
    epoch: 0,
    revision: 1,
    data: data([0], { 0: "2" }),
  });
  const originalWrite = server.remote.write;
  let release;
  server.remote.write = async (merge) => {
    const result = await originalWrite(merge);
    await new Promise((resolve) => {
      release = resolve;
    });
    return result;
  };
  const a = device(server);
  a.sync.edit(data([0, 1], { 0: "2", 1: "-3" }));
  const pending = a.sync.flush();
  await Promise.resolve();
  await server.remote.reset();
  server.broadcast();
  assert.deepEqual(a.latest.progress, {});
  release();
  await pending;
  assert.equal(a.meta.epoch, 1);
  assert.deepEqual(a.latest.progress, {});
  a.sync.dispose();
});
