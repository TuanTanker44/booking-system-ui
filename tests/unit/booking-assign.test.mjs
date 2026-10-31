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
function find(node, predicate) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap((child) => find(child, predicate));
  return [...(predicate(node) ? [node] : []), ...find(node.props?.children, predicate)];
}
const tick = () => new Promise(setImmediate);

test("assignment services use the BE routes, snake_case payloads and response envelopes", async () => {
  const calls = [];
  const axios = { post: async (...args) => { calls.push(args); return { data: { data: { id: 10 } } }; } };
  const { machineService } = load("src/services/machine.ts", { "../lib/axios": { default: axios } });
  const { staffService } = load("src/services/staff.ts", {
    "../lib/axios": { default: axios }, "./booking": { ACTIVE_STATUSES: [], BookingService: {} },
  });
  assert.deepEqual(await machineService.assign(7, 10, 42), { id: 10 });
  assert.deepEqual(await staffService.assignShipper(42, 20), { id: 10 });
  assert.deepEqual(calls, [
    ["/stores/7/machines/10/assign", { booking_id: 42 }],
    ["/bookings/42/assign-shipper", { shipper_id: 20 }],
  ]);
});

test("booking-specific machine query keeps booking_id and AbortSignal across every page", async () => {
  const signal = new AbortController().signal;
  const pages = [];
  const { machineService } = load("src/services/machine.ts", { "../lib/axios": { default: {
    get: async (url, config) => {
      assert.equal(url, "/stores/7/machines");
      assert.equal(config.signal, signal);
      assert.equal(config.params.booking_id, 42);
      pages.push(config.params.page);
      return { data: { data: [{ id: config.params.page, available_for_booking: true }], meta: { totalPages: 2 } } };
    },
  } } });
  const machines = await machineService.listForBooking(7, 42, signal);
  assert.deepEqual(pages, [1, 2]);
  assert.deepEqual(machines.map((machine) => machine.id), [1, 2]);
});

test("shipper picker loads every page of active shippers", async () => {
  const signal = new AbortController().signal;
  const pages = [];
  const { userService } = load("src/services/user.ts", { "../lib/axios": { default: {
    get: async (url, config) => {
      assert.equal(url, "/users/shippers"); assert.equal(config.signal, signal);
      assert.equal(config.params.status, "active"); assert.equal(config.params.limit, 100);
      pages.push(config.params.page);
      return { data: { data: [{ id: config.params.page }], meta: { totalPages: 2 } } };
    },
  } } });
  assert.deepEqual(await userService.getShippers(signal), [{ id: 1 }, { id: 2 }]);
  assert.deepEqual(pages, [1, 2]);
});

function dialogHarness({ status = "processing", inStore = false, tripStatus, fail = false, bookingError = false } = {}) {
  const states = [], refs = [], calls = [], machineQueries = [], messages = [];
  const fetchers = new Map();
  let stateIndex = 0, refIndex = 0, changed = 0;
  const booking = { status, in_store: inStore, actual_weight_kg: "10", delivery_trips: tripStatus ? [{ trip_type: "delivery", status: tripStatus }] : [] };
  const machines = [
    { id: 10, name: "Ready for slot", status: "idle", current_status: "running", available_for_booking: true, capacity_kg: 12 },
    { id: 11, name: "Too small", status: "idle", available_for_booking: true, capacity_kg: 3 },
    { id: 12, name: "Reserved in slot", status: "idle", available_for_booking: false, capacity_kg: 20 },
    { id: 13, name: "Maintenance", status: "maintenance", available_for_booking: false, capacity_kg: 20 },
    { id: 14, name: "Already assigned", status: "running", available_for_booking: true, assigned_to_booking: true, capacity_kg: 20 },
  ];
  const shippers = [{ id: 20, full_name: "Shipper API", phone: "0901234567" }];
  const { default: Dialog } = load("src/components/staff/dashboard/sidebar-item/BookingAssignDialog.tsx", {
    react: {
      useState: (initial) => {
        const i = stateIndex++;
        if (!(i in states)) states[i] = initial;
        return [states[i], (next) => { states[i] = typeof next === "function" ? next(states[i]) : next; }];
      },
      useRef: (initial) => refs[refIndex++] ??= { current: initial },
      useEffect: () => {},
    },
    "../../../../hooks/useFetched": { useFetched: (key, fetcher) => {
      fetchers.set(key, fetcher);
      return key.startsWith("assign-booking:") && bookingError
      ? { status: "error", error: "Booking unavailable" }
      : { status: "ready", data: key.startsWith("assign-booking:") ? booking : key.startsWith("assign-machines:") ? machines : shippers };
    } },
    "../../../../lib/error": { getErrorMessage: (error) => error.message },
    "../../../../services/machine": { machineService: { listForBooking: async (...args) => { machineQueries.push(args); return machines; }, assign: async (...args) => { calls.push(["machine", ...args]); if (fail) throw new Error("Machine conflict"); } } },
    "../../../../services/staff": { staffService: { getBookingDetail: () => {}, assignShipper: async (...args) => { calls.push(["shipper", ...args]); } } },
    "../../../../services/user": { userService: { getShippers: () => {} } },
    "../../../../services/booking": { BOOKING_STATUS_LABELS: { processing: "Đang xử lý", ready_for_delivery: "Chờ giao", confirmed: "Đã xác nhận" } },
  });
  const props = { storeId: 7, bookingId: 42, bookingCode: "API42", onClose: () => {}, onChanged: (message) => { changed++; messages.push(message); } };
  return {
    render: () => { stateIndex = 0; refIndex = 0; return Dialog(props); },
    calls,
    changed: () => changed,
    fetchers, machineQueries, messages,
  };
}
function select(tree, id, value) {
  find(tree, (node) => node.type === "select" && node.props.id === id)[0].props.onChange({ target: { value } });
}
function button(tree, label) { return find(tree, (node) => node.type === "button" && node.props.children === label)[0]; }

test("status-disabled assign buttons show a contextual hint immediately below the button", () => {
  for (const [status, machineHint, shipperHint] of [
    ["confirmed", false, true], ["processing", false, true], ["ready_for_delivery", true, false],
  ]) {
    const tree = dialogHarness({ status }).render();
    for (const [target, expected] of [["machine", machineHint], ["shipper", shipperHint]]) {
      const id = `assign-${target}-status-hint`;
      const hints = find(tree, (node) => node.props?.id === id);
      assert.equal(hints.length, expected ? 1 : 0);
      const control = button(tree, target === "machine" ? "Gán máy" : "Gán shipper");
      assert.equal(control.props["aria-describedby"], expected ? id : undefined);
      const picker = find(tree, (node) => node.type === "select" && node.props.id === `assign-${target}`)[0];
      assert.equal(picker.props.disabled, expected);
      assert.equal(picker.props["aria-describedby"], expected ? id : undefined);
      if (expected) {
        assert.equal(control.props.disabled, true);
        assert.ok(hints[0].props.children.includes("trạng thái"));
        const section = find(tree, (node) => node.props?.className === "booking-assign-section")
          .find((node) => find(node, (child) => child.props?.id === id).length > 0);
        const children = section.props.children.filter(Boolean);
        assert.equal(children[children.indexOf(control) + 1], hints[0]);
      }
    }
  }
});

test("machine picker displays fetched data with unavailable options disabled and prevents duplicate submit", async () => {
  const harness = dialogHarness();
  let tree = harness.render();
  const picker = find(tree, (node) => node.type === "select" && node.props.id === "assign-machine")[0];
  const options = find(picker, (node) => node.type === "option");
  assert.equal(picker.props.disabled, false);
  assert.deepEqual(options.map((node) => node.props.value), ["", 10, 11, 12, 13, 14]);
  assert.deepEqual(options.slice(1).map((node) => node.props.disabled), [false, true, true, true, true]);
  const signal = new AbortController().signal;
  await harness.fetchers.get("assign-machines:7:42:0")(signal);
  assert.deepEqual(harness.machineQueries, [[7, 42, signal]]);
  assert.equal(button(tree, "Gán máy").props.disabled, true);
  select(tree, "assign-machine", "10"); tree = harness.render();
  const submit = button(tree, "Gán máy"); assert.equal(submit.props.disabled, false);
  submit.props.onClick(); submit.props.onClick(); await tick();
  assert.deepEqual(harness.calls, [["machine", 7, 10, 42]]);
  assert.equal(harness.changed(), 1);
  assert.deepEqual(harness.messages, ["Đã gán máy Ready for slot cho đơn #API42."]);
});

test("confirmed booking can reserve a machine available in its slot", async () => {
  for (const status of ["confirmed", "picked_up", "processing"]) {
    const harness = dialogHarness({ status });
    select(harness.render(), "assign-machine", "10");
    const submit = button(harness.render(), "Gán máy");
    assert.equal(submit.props.disabled, false, status);
    submit.props.onClick(); await tick();
    assert.deepEqual(harness.calls, [["machine", 7, 10, 42]]);
  }
});

test("machine conflict stays in dialog and does not report assignment success", async () => {
  const harness = dialogHarness({ fail: true });
  select(harness.render(), "assign-machine", "10");
  button(harness.render(), "Gán máy").props.onClick(); await tick();
  assert.equal(harness.changed(), 0);
  assert.deepEqual(harness.messages, []);
  assert.ok(find(harness.render(), (node) => node.props?.role === "alert").length > 0);
});

test("shipper assignment follows BE status and in-store/trip restrictions", async () => {
  const harness = dialogHarness({ status: "ready_for_delivery" });
  select(harness.render(), "assign-shipper", "20");
  const tree = harness.render();
  assert.equal(find(tree, (node) => node.type === "select" && node.props.id === "assign-machine")[0].props.disabled, true);
  assert.equal(button(tree, "Gán máy").props.disabled, true);
  select(tree, "assign-machine", "10");
  button(harness.render(), "Gán máy").props.onClick(); await tick();
  assert.deepEqual(harness.calls, []);
  assert.equal(button(tree, "Gán shipper").props.disabled, false);
  button(tree, "Gán shipper").props.onClick(); await tick();
  assert.deepEqual(harness.calls, [["shipper", 42, 20]]);
  assert.deepEqual(harness.messages, ["Đã gán shipper Shipper API cho đơn #API42."]);
  assert.equal(harness.changed(), 1);
  for (const options of [{ status: "confirmed" }, { status: "ready_for_delivery", inStore: true }, { status: "ready_for_delivery", tripStatus: "in_progress" }]) {
    const blocked = dialogHarness(options);
    select(blocked.render(), "assign-shipper", "20");
    const blockedTree = blocked.render();
    assert.equal(find(blockedTree, (node) => node.type === "select" && node.props.id === "assign-shipper")[0].props.disabled, true);
    assert.equal(button(blockedTree, "Gán shipper").props.disabled, true);
    button(blockedTree, "Gán shipper").props.onClick(); await tick();
    assert.deepEqual(blocked.calls, []);
  }
});

test("failure to fetch booking does not hide successfully fetched machine/shipper options", () => {
  const tree = dialogHarness({ bookingError: true }).render();
  const machines = find(tree, (node) => node.type === "select" && node.props.id === "assign-machine")[0];
  const shippers = find(tree, (node) => node.type === "select" && node.props.id === "assign-shipper")[0];
  assert.equal(machines.props.disabled, true);
  assert.equal(shippers.props.disabled, true);
  assert.equal(find(machines, (node) => node.type === "option").length, 6);
  assert.equal(find(shippers, (node) => node.type === "option").length, 2);
  assert.equal(button(tree, "Gán máy").props.disabled, true);
  assert.equal(button(tree, "Gán shipper").props.disabled, true);
});

test("booking details show assigned machine and delivery shipper returned by BE", () => {
  let stateIndex = 0;
  const summary = {
    id: 42, store_id: 7, booking_code: "API42", customer: { full_name: "Customer", phone: null },
    service_name: "Laundry", estimated_price: 20000, final_price: null,
    created_at: "2026-10-31T00:00:00Z", scheduled_pickup_start: "2026-10-31T01:00:00Z", status: "ready_for_delivery",
  };
  const detail = {
    ...summary, in_store: false, users_bookings_customer_idTousers: summary.customer,
    delivery_trips: [{ trip_type: "delivery", shipper_id: 20, shipper: { full_name: "Shipper from API", phone: "0901234567" } }],
  };
  const { default: Page } = load("src/components/staff/dashboard/sidebar-item/BookingPage.tsx", {
    react: { useEffect: () => {}, useMemo: (factory) => factory(), useState: (initial) => {
      const index = stateIndex++;
      return [index === 5 ? 42 : index === 8 ? { message: "Đã gán máy cho đơn #API42." } : initial, () => {}];
    } },
    "./BookingPage.css": {}, "../../ui/RefreshDataButton": { default: () => null },
    "./BookingAssignDialog": { default: () => null },
    "../../../../services/staff": { staffService: {} },
    "../../../../services/machine": { machineService: {} },
    "../../../../stores/store": { useStoreStore: { getState: () => ({}) } },
    "../../../../hooks/useStaffFetched": { useStaffFetched: (key) => ({
      status: "ready", data: key === "staff-bookings:7" ? [summary]
        : key === "staff-booking:7:42" ? detail
        : [{ id: 10, name: "Assigned washer", assigned_to_booking: true, current_usage: null }],
    }) },
  });
  const tree = Page({ selectedStoreId: "7" });
  const notification = find(tree, (node) => node.props?.className === "booking-assignment-notification")[0];
  assert.equal(notification.props.role, "status");
  assert.ok(find(notification, (node) => node.type === "span" && node.props.children === "Đã gán máy cho đơn #API42.").length > 0);
  assert.ok(find(notification, (node) => node.type === "button" && node.props["aria-label"] === "Đóng thông báo").length > 0);
  const rows = find(tree, (node) => node.props?.className === "booking-modal__row");
  const text = (node) => typeof node === "string" ? node : Array.isArray(node) ? node.map(text).join("") : node?.props ? text(node.props.children) : "";
  assert.ok(rows.some((row) => text(row).includes("Máy được gánAssigned washer")));
  assert.ok(rows.some((row) => text(row).includes("Shipper được gánShipper from API · 0901234567")));
  assert.equal(find(tree, (node) => node.type === "button" && node.props.className === "booking-assign-button").length, 1);
  for (const [status, inStore, expected] of [
    ["processing", false, 0], ["processing", true, 0], ["ready_for_delivery", false, 1],
    ["ready_for_delivery", true, 1], ["confirmed", false, 1], ["confirmed", true, 1], ["pending_payment", false, 0],
    ["picked_up", false, 0], ["delivering", false, 0], ["completed", false, 0],
    ["cancelled", false, 0], ["no_show", false, 0],
  ]) {
    summary.status = status; summary.in_store = inStore; stateIndex = 0;
    const rendered = Page({ selectedStoreId: "7" });
    assert.equal(find(rendered, (node) => node.type === "button" && node.props.className === "booking-assign-button").length, expected, `${status}, in_store=${inStore}`);
  }
});
