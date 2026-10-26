import { useEffect } from "react";
import { AppRouter } from "./router/index.js";
import { useUserStore } from "./stores/user.js";

export function App() {
  const initialize = useUserStore((state) => state.initialize);

  // Khôi phục phiên đăng nhập khi mở/reload trang
  useEffect(() => {
    void initialize();
  }, [initialize]);

  return <AppRouter />;
}
