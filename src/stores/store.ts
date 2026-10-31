// src/stores/store.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getErrorMessage } from "../lib/error";

export interface StoreQuery {
  status: "loading" | "ready" | "error";
  data?: unknown;
  error?: string;
}

// Request thuộc cache, không thuộc vòng đời component: chuyển tab không hủy/tải lại.
const requests = new Map<string, { controller: AbortController; promise: Promise<void> }>();
function cancelQueries(keepWorkingStores: boolean) {
  for (const [key, request] of requests) {
    if (keepWorkingStores && key === "working-stores") continue;
    requests.delete(key);
    request.controller.abort();
  }
}
function keepWorkingStores(queries: Record<string, StoreQuery>): Record<string, StoreQuery> {
  return queries["working-stores"] ? { "working-stores": queries["working-stores"] } : {};
}

export interface Store {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  status?: string;
}

interface StoreState {
  stores: Store[];
  currentStore: Store | null;
  currentStoreId: number | null;
  queries: Record<string, StoreQuery>;
  loadQuery: (key: string, fetcher: (signal: AbortSignal) => Promise<unknown>, force?: boolean) => Promise<void>;
  invalidateQueries: (prefix: string) => void;

  setStores: (stores: Store[]) => void;
  selectStore: (storeId: number) => void;
  clearStore: () => void;
}

export const useStoreStore = create<StoreState>()(
  persist(
    (set, get) => ({
      stores: [],
      currentStore: null,
      currentStoreId: null,
      queries: {},

      invalidateQueries: (prefix) => {
        for (const [key, request] of requests) {
          if (!key.startsWith(prefix)) continue;
          requests.delete(key);
          request.controller.abort();
        }
        set((state) => ({ queries: Object.fromEntries(
          Object.entries(state.queries).filter(([key]) => !key.startsWith(prefix)),
        ) }));
      },

      loadQuery: (key, fetcher, force = false) => {
        if (!force) {
          const pending = requests.get(key);
          if (pending) return pending.promise;
          if (get().queries[key]) return Promise.resolve();
        }
        const previous = requests.get(key);
        requests.delete(key);
        previous?.controller.abort();
        const controller = new AbortController();
        set((state) => ({ queries: { ...state.queries, [key]: { status: "loading" } } }));
        const request: { controller: AbortController; promise: Promise<void> } = {
          controller,
          promise: Promise.resolve().then(() => fetcher(controller.signal)).then((data) => {
            if (controller.signal.aborted || requests.get(key) !== request) return;
            set((state) => ({ queries: { ...state.queries, [key]: { status: "ready", data } } }));
          }).catch((error: unknown) => {
            if (controller.signal.aborted || requests.get(key) !== request) return;
            set((state) => ({ queries: { ...state.queries, [key]: {
              status: "error", error: getErrorMessage(error, "Không thể tải dữ liệu."),
            } } }));
          }).finally(() => {
            if (requests.get(key) === request) requests.delete(key);
          }),
        };
        requests.set(key, request);
        return request.promise;
      },

      setStores: (stores) => {
        const currentStoreId = get().currentStoreId;

        // Giữ cửa hàng hiện tại nếu nó vẫn nằm trong danh sách hợp lệ.
        const currentStore =
          stores.find((store) => store.id === currentStoreId) ??
          stores[0] ??
          null;

        const changed = currentStoreId !== (currentStore?.id ?? null);
        const previousStores = get().stores;
        const unchanged = stores.length === previousStores.length && stores.every((store, index) => {
          const previous = previousStores[index];
          return store.id === previous.id && store.name === previous.name &&
            store.address === previous.address && store.phone === previous.phone && store.status === previous.status;
        });
        // Route mount lại có thể gửi cùng danh sách; không ghi lại store/storage.
        if (!changed && unchanged) return;
        if (changed) cancelQueries(true);
        set({
          queries: changed ? keepWorkingStores(get().queries) : get().queries,
          stores,
          currentStore,
          currentStoreId: currentStore?.id ?? null,
        });
      },

      selectStore: (storeId) => {
        const store = get().stores.find(
          (item) => item.id === storeId,
        );

        if (!store || store.id === get().currentStoreId) {
          return;
        }

        cancelQueries(true);
        set({
          queries: keepWorkingStores(get().queries),
          currentStore: store,
          currentStoreId: store.id,
        });
      },

      clearStore: () => {
        cancelQueries(false);
        set({
          queries: {},
          stores: [],
          currentStore: null,
          currentStoreId: null,
        });
      },
    }),
    {
      name: "staff-current-store",
      storage: createJSONStorage(() => localStorage),

      // Chỉ lưu lựa chọn cửa hàng, không lưu danh sách cửa hàng.
      partialize: (state) => ({
        currentStoreId: state.currentStoreId,
      }),

      // Khi khởi động, cần tải lại danh sách cửa hàng để xác thực lựa chọn.
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<StoreState>),
        stores: [],
        currentStore: null,
        queries: {},
      }),
    },
  ),
);
