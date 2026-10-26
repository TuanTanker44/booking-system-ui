import { create } from "zustand";
import { AuthService } from "../services/auth.js";
import type { User } from "../types/user.js";
import type {
  LoginDto,
  RegisterDto,
} from "../types/auth.js";

interface UserState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;

  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
}

// Lưu token vào localStorage để giữ phiên sau khi reload trang
function persistAccessToken(accessToken: string) {
  if (!accessToken) {
    throw new Error("Phản hồi đăng nhập không có access token.");
  }

  localStorage.setItem("accessToken", accessToken);
}

function clearPersistedTokens() {
  localStorage.removeItem("accessToken");
}

let initializePromise: Promise<void> | null = null;

export const useUserStore = create<UserState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: false,

  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }

    set({ accessToken: token });
  },

  // Khôi phục phiên khi mở/reload trang. Dùng chung một promise để
  // StrictMode (gọi effect 2 lần) không refresh token hai lần.
  initialize: () => {
    initializePromise ??= (async () => {
      set({ isLoading: true });

      try {
        const storedToken = localStorage.getItem("accessToken");

        if (storedToken) {
          set({ accessToken: storedToken });
        } else {
          // Không có token: thử xin token mới bằng refresh token (cookie)
          const result = await AuthService.refresh();

          persistAccessToken(result.accessToken);
          set({ accessToken: result.accessToken });
        }

        // Token hết hạn thì interceptor tự refresh rồi gọi lại
        const user = await AuthService.getMe();

        set({
          user,
          isAuthenticated: true,
        });
      } catch {
        clearPersistedTokens();

        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      } finally {
        set({
          isLoading: false,
          initialized: true,
        });
      }
    })();

    return initializePromise;
  },

  login: async (dto) => {
    set({ isLoading: true });

    try {
      const result = await AuthService.login(dto);

      persistAccessToken(result.accessToken);
      set({
        accessToken: result.accessToken,
      });

      const user = await AuthService.getMe();

      set({
        user,
        isAuthenticated: true,
      });
    } catch (error) {
      clearPersistedTokens();

      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });

      throw error;
    } finally {
      set({ isLoading: false, initialized: true });
    }
  },

  // Backend chỉ tạo tài khoản, không trả token: người dùng cần đăng nhập sau đó
  register: async (dto) => {
    set({ isLoading: true });

    try {
      await AuthService.register(dto);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await AuthService.logout();
    } catch {
      // Đăng xuất phía client vẫn tiếp tục dù server báo lỗi
    } finally {
      clearPersistedTokens();

      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });
    }
  },
}));