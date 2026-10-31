import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(file, mocks) {
  const code = ts.transpileModule(readFileSync(new URL(`../../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: false },
  }).outputText;
  const exports = {};
  new Function("require", "exports", code)((name) => name in mocks ? mocks[name] : require(name), exports);
  return exports;
}
const fee = { pickup: { address_id: 10, distance_km: 2, fee: 15000 }, delivery: { address_id: 10, distance_km: 2, fee: 15000 }, total_fee: 30000 };
test("delivery fee service unwraps the API result and omits an empty delivery address", async () => {
  const signal = new AbortController().signal;
  const { getDeliveryFee } = load("src/services/delivery.ts", { "../lib/axios": { default: {
    get: async (url, config) => {
      assert.equal(url, "/delivery/fee"); assert.equal(config.signal, signal);
      assert.deepEqual(config.params, { store_id: 1, pickup_address_id: 10 });
      return { data: { data: fee } };
    },
  } } });
  assert.deepEqual(await getDeliveryFee({ store_id: 1, pickup_address_id: 10 }, signal), fee);
});

function find(node, predicate) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap((child) => find(child, predicate));
  return [...(predicate(node) ? [node] : []), ...find(node.props?.children, predicate)];
}
function text(node) {
  return typeof node === "string" || typeof node === "number" ? String(node)
    : Array.isArray(node) ? node.map(text).join("") : node?.props ? text(node.props.children) : "";
}
function harness({ step = 2, inStore = false, deliveryStatus = "ready" } = {}) {
  const noop = () => {};
  const states = [], creates = [], fetches = [];
  let index = 0;
  const form = { step, setStep: noop, serviceId: 1, weight: "1", items: [], inStore, date: "2026-10-31", slot: "08:00", note: "", appliedPromo: "", promoInput: "", reset: noop };
  const props = {
    form, stores: [{ id: 1, name: "Store" }], selectedStore: 1, setSelectedStore: noop,
    addresses: [10, 11].map((id) => ({ id, label: "Home", recipientName: "Customer", phone: "0901234567" })),
    addressesStatus: "ready", selectedAddress: 10, setSelectedAddress: noop, goToAddresses: noop,
    requestedServiceName: null, onRequestedServiceHandled: noop, notify: noop, onCreated: noop,
  };
  const { BookingPage } = load("src/pages/customer/BookingPage.tsx", {
    react: { useEffect: noop, useRef: (value) => ({ current: value }), useState: (initial) => {
      const i = index++; if (!(i in states)) states[i] = initial;
      return [states[i], (next) => { states[i] = typeof next === "function" ? next(states[i]) : next; }];
    } },
    "../../lib/error": { getErrorMessage: (error) => error.message },
    "../../lib/pickup": { MAX_ADVANCE_DAYS: 7, addDays: (date) => date, toLocalDateString: () => "2026-10-31" },
    "../../services/address": { formatAddress: () => "Home" },
    "../../services/booking": { BookingService: { quote: noop, create: async (input) => { creates.push(input); return { id: 42 }; } } },
    "../../services/delivery": { getDeliveryFee: noop }, "../../services/store-booking": {},
    "./PageHeading": { PageHeading: () => null },
    "./format": { formatMoney: (value) => `${value} VND`, formatStoreDate: String, formatStoreTime: String },
    "../../hooks/useFetched": { useFetched: (key, fetcher) => {
      fetches.push({ key, fetcher });
      if (!key) return { status: "idle" };
      if (key.startsWith("services:")) return { status: "ready", data: [{ id: 1, name: "Wash", pricing_unit: "per_kg", unit_price: 20000 }] };
      if (key.startsWith("slots:")) return { status: "ready", data: { slots: [{ start: "08:00", is_available: true }] } };
      if (key.startsWith("delivery-fee:")) return { status: deliveryStatus, data: deliveryStatus === "ready" ? fee : undefined, error: deliveryStatus === "error" ? "Fee unavailable" : undefined };
      return { status: "ready", data: { subtotal: 20000, estimated_price: 47000, delivery_price: 30000, discount_amount: 3000 } };
    } },
  });
  return { props, creates, fetches, render: () => { index = 0; fetches.length = 0; return BookingPage(props); } };
}
function nextButton(tree) { return find(tree, (node) => node.type === "button" && text(node).includes("Tiếp tục"))[0]; }

test("step 2 shows fee plus subtotal and refetches for a different address/store", () => {
  const app = harness();
  let tree = app.render();
  assert.ok(text(tree).includes("Phí giao nhận30000 VND"));
  assert.ok(text(tree).includes("Tổng tạm tính50000 VND"));
  assert.equal(nextButton(tree).props.disabled, false);
  assert.ok(app.fetches.some(({ key }) => key === "delivery-fee:1:10:0"));
  app.props.selectedAddress = 11; tree = app.render();
  assert.ok(app.fetches.some(({ key }) => key === "delivery-fee:1:11:0"));
  app.props.stores = [{ id: 2, name: "Other" }]; app.props.selectedStore = 2; app.render();
  assert.ok(app.fetches.some(({ key }) => key === "delivery-fee:2:11:0"));
});

test("loading/error fees block continuing; retry uses a fresh request key", () => {
  for (const deliveryStatus of ["loading", "error"]) {
    const app = harness({ deliveryStatus }); const tree = app.render();
    assert.equal(nextButton(tree).props.disabled, true);
    assert.ok(text(tree).includes("Chưa tính đủ phí giao nhận"));
    if (deliveryStatus === "error") {
      find(tree, (node) => node.type === "button" && text(node) === "Tính lại phí giao nhận")[0].props.onClick();
      app.render(); assert.ok(app.fetches.some(({ key }) => key === "delivery-fee:1:10:1"));
    }
  }
});

test("in-store orders skip delivery API and show zero delivery fee", () => {
  const app = harness({ inStore: true }); const tree = app.render();
  assert.ok(!app.fetches.some(({ key }) => key?.startsWith("delivery-fee:")));
  assert.ok(text(tree).includes("Phí giao nhận0 VND"));
  assert.ok(text(tree).includes("Tổng tạm tính20000 VND"));
  assert.equal(nextButton(tree).props.disabled, false);
});

test("step 3 uses BE total once and creation sends supported input instead of client prices", async () => {
  const app = harness({ step: 3 }); const tree = app.render();
  assert.ok(text(tree).includes("Tổng tạm tính47000 VND"));
  const confirm = find(tree, (node) => node.type === "button" && text(node).includes("Xác nhận đặt lịch"))[0];
  assert.equal(confirm.props.disabled, false);
  confirm.props.onClick(); await new Promise(setImmediate);
  assert.equal(app.creates.length, 1);
  assert.equal(app.creates[0].pickup_address_id, 10);
  assert.equal("delivery_address_id" in app.creates[0], false);
  assert.equal("estimated_price" in app.creates[0], false);
  assert.equal("delivery_price" in app.creates[0], false);
});
