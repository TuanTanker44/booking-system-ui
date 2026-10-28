import { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../../lib/error";

export type FetchStatus = "idle" | "loading" | "ready" | "error";

interface FetchedState<T> {
  key: string | null;
  data?: T;
  error?: string;
}

// Tải dữ liệu theo `key`: key đổi thì tải lại, key = null thì không tải (idle).
// `reloadToken` đổi giá trị để buộc tải lại với cùng key.
// Trạng thái loading được suy ra từ key nên không cần setState đồng bộ trong effect.
export function useFetched<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
  reloadToken = 0,
) {
  const [state, setState] = useState<FetchedState<T>>({ key: null });
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (key === null) return;

    const controller = new AbortController();

    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ key, data });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ key, error: getErrorMessage(err, "Không thể tải dữ liệu.") });
      });

    return () => controller.abort();
  }, [key, reloadToken]);

  const fresh = key !== null && state.key === key;
  const status: FetchStatus =
    key === null ? "idle" : !fresh ? "loading" : state.error ? "error" : "ready";

  return { status, data: fresh ? state.data : undefined, error: fresh ? state.error : undefined };
}
