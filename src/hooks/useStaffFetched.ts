import { useEffect, useRef } from "react";
import { useStoreStore } from "../stores/store";

// Cache chỉ dành cho staff. Giữ dữ liệu/request qua các lần unmount khi đổi tab.
// Store sẽ hủy request và xóa cache khi đổi cửa hàng hoặc kết thúc phiên đăng nhập.
export function useStaffFetched<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
  reloadToken = 0,
) {
  const entry = useStoreStore((state) => key === null ? undefined : state.queries[key]);
  const loadQuery = useStoreStore((state) => state.loadQuery);
  const fetcherRef = useRef(fetcher);
  const reloadTokens = useRef(new Map<string, number>());
  useEffect(() => { fetcherRef.current = fetcher; });
  useEffect(() => {
    if (key === null) return;
    const previous = reloadTokens.current.get(key);
    reloadTokens.current.set(key, reloadToken);
    void loadQuery(key, fetcherRef.current, previous !== undefined && previous !== reloadToken);
  }, [key, reloadToken, loadQuery]);

  return {
    status: key === null ? "idle" as const : entry?.status ?? "loading" as const,
    data: key === null ? undefined : entry?.data as T | undefined,
    error: key === null ? undefined : entry?.error,
  };
}
