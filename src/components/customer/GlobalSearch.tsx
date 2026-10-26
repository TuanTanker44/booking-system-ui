import { useEffect, useMemo, useRef, useState } from "react";
import { isCancel } from "axios";
import {
  MapPinned,
  Package,
  Search,
  Store,
  WashingMachine,
  X,
} from "lucide-react";
import {
  highlightSegments,
  searchEntries,
  type SearchEntry,
  type SearchEntryType,
  type SearchResult,
} from "../../lib/search";
import { searchStores, type ApiStore } from "../../services/store";
import "./GlobalSearch.css";

const GROUPS: { type: SearchEntryType; label: string; icon: React.ReactNode }[] =
  [
    { type: "store", label: "Cửa hàng", icon: <Store /> },
    { type: "service", label: "Dịch vụ", icon: <WashingMachine /> },
    { type: "address", label: "Địa chỉ của tôi", icon: <MapPinned /> },
    { type: "order", label: "Đơn hàng", icon: <Package /> },
  ];

const MAX_PER_GROUP = 4;
const STORE_PAGE = 1;
const STORE_LIMIT = 10;
const DEBOUNCE_MS = 300;

type StoreStatus = "idle" | "loading" | "error";

// Chuyển cửa hàng từ API thành mục gợi ý (tên, địa chỉ, mô tả, số điện thoại)
function toStoreEntry(store: ApiStore): SearchEntry {
  const fields: SearchEntry["fields"] = [
    { label: "Địa chỉ", value: store.address },
  ];

  if (store.description) {
    fields.push({ label: "Mô tả", value: store.description });
  }

  if (store.phone) {
    fields.push({ label: "SĐT", value: store.phone, kind: "phone" });
  }

  return {
    id: `store-${store.id}`,
    type: "store",
    title: store.name,
    subtitle: store.address,
    fields,
  };
}

function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightSegments(text, query).map((segment, index) =>
        segment.match ? (
          <mark key={index}>{segment.text}</mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

interface Props {
  // Dữ liệu cục bộ (dịch vụ, địa chỉ, đơn hàng); cửa hàng được tìm qua API
  entries: SearchEntry[];
  onSelect: (entry: SearchEntry, store?: ApiStore) => void;
}

export function GlobalSearch({ entries, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [stores, setStores] = useState<{ query: string; items: ApiStore[] }>({
    query: "",
    items: [],
  });
  const [storeStatus, setStoreStatus] = useState<StoreStatus>("idle");

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  // Gọi GET /stores?search=...&page=1&limit=10 khi gõ (debounce, hủy request cũ)
  useEffect(() => {
    if (!trimmedQuery) return;

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setStoreStatus("loading");

      try {
        const result = await searchStores(
          { search: trimmedQuery, page: STORE_PAGE, limit: STORE_LIMIT },
          controller.signal,
        );

        setStores({ query: trimmedQuery, items: result.data });
        setStoreStatus("idle");
      } catch (error) {
        if (isCancel(error)) return;

        setStoreStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery]);

  // Gom kết quả theo nhóm (giới hạn mỗi nhóm), giữ thứ tự để điều hướng bằng phím
  const groups = useMemo(() => {
    const local = searchEntries(entries, query);

    const storeResults: SearchResult[] = hasQuery
      ? stores.items.map((store) => {
          const entry = toStoreEntry(store);

          return {
            entry,
            matchedField: searchEntries([entry], query)[0]?.matchedField,
            score: 0,
          };
        })
      : [];

    return GROUPS.map((group) => ({
      ...group,
      results: (group.type === "store"
        ? storeResults
        : local.filter((result) => result.entry.type === group.type)
      ).slice(0, group.type === "store" ? STORE_LIMIT : MAX_PER_GROUP),
    }));
  }, [entries, query, stores, hasQuery]);

  const visibleGroups = groups.filter(
    (group) =>
      group.results.length > 0 || (group.type === "store" && hasQuery && storeStatus !== "idle"),
  );
  const flatResults: SearchResult[] = groups.flatMap((group) => group.results);
  const showPanel = open && hasQuery;
  const isEmpty =
    flatResults.length === 0 && storeStatus === "idle" && stores.query === trimmedQuery;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function choose(result: SearchResult) {
    const store =
      result.entry.type === "store"
        ? stores.items.find((item) => `store-${item.id}` === result.entry.id)
        : undefined;

    onSelect(result.entry, store);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (flatResults.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % flatResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(
        (current) => (current - 1 + flatResults.length) % flatResults.length,
      );
    } else if (event.key === "Enter" && showPanel) {
      event.preventDefault();
      choose(flatResults[Math.min(activeIndex, flatResults.length - 1)]);
    }
  }

  return (
    <div className="global-search" ref={containerRef}>
      <Search className="global-search-icon" />
      <input
        type="text"
        role="combobox"
        aria-label="Tìm kiếm cửa hàng, dịch vụ, địa chỉ, đơn hàng"
        aria-expanded={showPanel}
        aria-controls="global-search-list"
        aria-activedescendant={
          showPanel && flatResults.length > 0
            ? `global-search-option-${Math.min(activeIndex, flatResults.length - 1)}`
            : undefined
        }
        autoComplete="off"
        placeholder="Tìm kiếm theo tên, địa chỉ, mô tả, số điện thoại..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {query && (
        <button
          type="button"
          className="global-search-clear"
          aria-label="Xóa tìm kiếm"
          onClick={() => {
            setQuery("");
            setOpen(false);
          }}
        >
          <X />
        </button>
      )}

      {showPanel && (
        <div
          className="global-search-panel"
          id="global-search-list"
          role="listbox"
        >
          {isEmpty && (
            <div className="global-search-empty">
              Không tìm thấy kết quả cho “{trimmedQuery}”
            </div>
          )}

          {visibleGroups.map((group) => (
            <div key={group.type} role="group" aria-label={group.label}>
              <div className="global-search-group">{group.label}</div>

              {group.type === "store" && storeStatus === "loading" && (
                <div className="global-search-status">Đang tìm cửa hàng...</div>
              )}

              {group.type === "store" && storeStatus === "error" && (
                <div className="global-search-status global-search-status-error">
                  Không thể tìm cửa hàng. Vui lòng thử lại.
                </div>
              )}

              {group.results.map((result) => {
                const index = flatResults.indexOf(result);
                const isActive = index === activeIndex;

                return (
                  <div
                    key={result.entry.id}
                    id={`global-search-option-${index}`}
                    role="option"
                    aria-selected={isActive}
                    className={`global-search-option ${isActive ? "active" : ""}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(result)}
                  >
                    <span className="global-search-option-icon">
                      {group.icon}
                    </span>
                    <span className="global-search-option-text">
                      <strong>
                        <Highlight text={result.entry.title} query={query} />
                      </strong>
                      {result.matchedField ? (
                        <small>
                          {result.matchedField.label}:{" "}
                          <Highlight
                            text={result.matchedField.value}
                            query={query}
                          />
                        </small>
                      ) : (
                        result.entry.subtitle && (
                          <small>{result.entry.subtitle}</small>
                        )
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
