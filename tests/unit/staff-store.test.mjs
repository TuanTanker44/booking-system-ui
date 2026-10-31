import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = ts.transpileModule(readFileSync(new URL("../../src/stores/store.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
}).outputText;
function createStore(resetStorage = true) {
  if (resetStorage) {
    const values = new Map();
    globalThis.localStorage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    };
  }
  const exports = {};
  new Function("require", "exports", source)((name) => name === "../lib/error"
    ? { getErrorMessage: (error) => error.message }
    : require(name), exports);
  return exports.useStoreStore;
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function hookHarness(store) {
  const refs = [];
  const dependencies = [];
  let cursor = 0;
  let effects = [];
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL("../../src/hooks/useStaffFetched.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
  }).outputText;
  new Function("require", "exports", code)((name) => name === "react" ? {
    useRef: (initial) => { const index = cursor++; return refs[index] ??= { current: initial }; },
    useEffect: (effect, next) => {
      const index = cursor++;
      const previous = dependencies[index];
      if (!next || !previous || next.some((value, i) => value !== previous[i])) effects.push(effect);
      dependencies[index] = next;
    },
  } : { useStoreStore: (selector) => selector(store.getState()) }, exports);
  return (key, fetcher, token = 0) => {
    cursor = 0;
    effects = [];
    const result = exports.useStaffFetched(key, fetcher, token);
    for (const effect of effects) effect();
    return result;
  };
}

test("tab remounts reuse data, including an empty result; refresh refetches", async () => {
  const store = createStore();
  let calls = 0;
  const fetcher = async () => { calls += 1; return []; };
  await store.getState().loadQuery("staff-bookings:7", fetcher);
  await store.getState().loadQuery("staff-bookings:7", fetcher);
  assert.equal(calls, 1);
  assert.deepEqual(store.getState().queries["staff-bookings:7"].data, []);
  await store.getState().loadQuery("staff-bookings:7", fetcher, true);
  assert.equal(calls, 2);
});

test("concurrent consumers share a pending request (StrictMode / rapid tab changes)", async () => {
  const store = createStore();
  const pending = deferred();
  let calls = 0;
  const fetcher = () => { calls += 1; return pending.promise; };
  const first = store.getState().loadQuery("staff-bookings:7", fetcher);
  const second = store.getState().loadQuery("staff-bookings:7", fetcher);
  await Promise.resolve();
  assert.equal(calls, 1);
  pending.resolve([42]);
  await Promise.all([first, second]);
  assert.deepEqual(store.getState().queries["staff-bookings:7"].data, [42]);
});

test("refresh aborts old request and ignores its late response", async () => {
  const store = createStore();
  const old = deferred();
  let oldSignal;
  const first = store.getState().loadQuery("services:7", (signal) => {
    oldSignal = signal;
    return old.promise;
  });
  await Promise.resolve();
  await store.getState().loadQuery("services:7", async () => ["new"], true);
  assert.equal(oldSignal.aborted, true);
  old.resolve(["old"]);
  await first;
  assert.deepEqual(store.getState().queries["services:7"].data, ["new"]);
});

test("switching stores clears scoped data, aborts requests, and retains assignments", async () => {
  const store = createStore();
  const stores = [{ id: 7, name: "A" }, { id: 8, name: "B" }];
  store.getState().setStores(stores);
  await store.getState().loadQuery("working-stores", async () => stores);
  await store.getState().loadQuery("services:7", async () => [1]);
  const pending = deferred();
  let signal;
  const request = store.getState().loadQuery("machines:7", (incoming) => {
    signal = incoming;
    return pending.promise;
  });
  await Promise.resolve();
  store.getState().selectStore(8);
  assert.equal(signal.aborted, true);
  assert.equal(store.getState().currentStoreId, 8);
  assert.deepEqual(Object.keys(store.getState().queries), ["working-stores"]);
  pending.resolve(["stale A"]);
  await request;
  assert.equal(store.getState().queries["machines:7"], undefined);
  store.getState().selectStore(7);
  assert.equal(store.getState().queries["services:7"], undefined);
});

test("same/invalid store selection and metadata updates do not reset cache", async () => {
  const store = createStore();
  store.getState().setStores([{ id: 7, name: "A" }]);
  await store.getState().loadQuery("services:7", async () => [1]);
  const queries = store.getState().queries;
  store.getState().selectStore(7);
  store.getState().selectStore(999);
  store.getState().setStores([{ id: 7, name: "A updated" }]);
  assert.equal(store.getState().queries, queries);
  assert.equal(store.getState().currentStore.name, "A updated");
});

test("errors stay cached until explicit retry", async () => {
  const store = createStore();
  let calls = 0;
  const failing = async () => { calls += 1; throw new Error("Offline"); };
  await store.getState().loadQuery("services:7", failing);
  await store.getState().loadQuery("services:7", failing);
  assert.equal(calls, 1);
  assert.equal(store.getState().queries["services:7"].error, "Offline");
  await store.getState().loadQuery("services:7", async () => ["retry"], true);
  assert.equal(store.getState().queries["services:7"].status, "ready");
});

test("only selection is persisted; logout clears data and aborts assignment request", async () => {
  const store = createStore();
  store.getState().setStores([{ id: 7, name: "A" }]);
  await store.getState().loadQuery("staff-bookings:7", async () => ["private"]);
  assert.deepEqual(JSON.parse(localStorage.getItem("staff-current-store")).state, { currentStoreId: 7 });
  const rehydrated = createStore(false);
  assert.equal(rehydrated.getState().currentStoreId, 7);
  assert.deepEqual(rehydrated.getState().queries, {});
  assert.deepEqual(rehydrated.getState().stores, []);
  const pending = deferred();
  let signal;
  const request = store.getState().loadQuery("working-stores", (incoming) => {
    signal = incoming;
    return pending.promise;
  });
  await Promise.resolve();
  store.getState().clearStore();
  assert.equal(signal.aborted, true);
  pending.resolve(["late"]);
  await request;
  assert.deepEqual(store.getState().queries, {});
  assert.deepEqual(store.getState().stores, []);
  assert.equal(store.getState().currentStoreId, null);
});

test("hook remount reuses cache and refresh works after key is temporarily disabled", async () => {
  const store = createStore();
  let calls = 0;
  const fetcher = async () => ++calls;
  let render = hookHarness(store);
  render("machine-usage:7:3", fetcher);
  await store.getState().loadQuery("machine-usage:7:3", fetcher);
  render = hookHarness(store); // Tab unmounts/remounts; local reload token returns to 0.
  assert.equal(render("machine-usage:7:3", fetcher).data, 1);
  await Promise.resolve();
  assert.equal(calls, 1);
  render(null, fetcher, 1); // Machine list briefly loading during refresh.
  render("machine-usage:7:3", fetcher, 1);
  await store.getState().loadQuery("machine-usage:7:3", fetcher);
  assert.equal(calls, 2);
  assert.equal(render("machine-usage:7:3", fetcher, 1).data, 2);
});

test("rapid detail changes keep each key paired with its original fetcher", async () => {
  const store = createStore();
  const render = hookHarness(store);
  render("detail:1", async () => "first booking");
  render("detail:2", async () => "second booking");
  await Promise.all([
    store.getState().loadQuery("detail:1", async () => "unexpected"),
    store.getState().loadQuery("detail:2", async () => "unexpected"),
  ]);
  assert.equal(store.getState().queries["detail:1"].data, "first booking");
  assert.equal(store.getState().queries["detail:2"].data, "second booking");
});

test("assignment invalidation clears machine usage without resetting selected store or bookings", async () => {
  const store = createStore();
  store.getState().setStores([{ id: 7, name: "A" }]);
  await store.getState().loadQuery("staff-bookings:7", async () => [42]);
  await store.getState().loadQuery("machine-usage:7:10", async () => []);
  store.getState().invalidateQueries("machine-usage:7:");
  assert.equal(store.getState().currentStoreId, 7);
  assert.equal(store.getState().queries["machine-usage:7:10"], undefined);
  assert.deepEqual(store.getState().queries["staff-bookings:7"].data, [42]);
});
