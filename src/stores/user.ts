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

export const useUserStore = create<UserState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: false,

  setAccessToken: (token) => set({ accessToken: token }),

  initialize: async () => {
    set({ isLoading: true });

    try {
      const result = await AuthService.refresh();

      set({
        accessToken: result.accessToken,
      });

      const user = await AuthService.getMe();

      set({
        user,
        isAuthenticated: true,
      });
    } catch {
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
  },

  login: async (dto) => {
    set({ isLoading: true });

    try {
      const result = await AuthService.login(dto);

      set({
        accessToken: result.accessToken,
      });

      const user = await AuthService.getMe();

      set({
        user,
        isAuthenticated: true,
      });
    } catch (error) {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });

      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (dto) => {
    set({ isLoading: true });

    try {
      const result = await AuthService.register(dto);

      set({
        accessToken: result.accessToken,
      });

      const user = await AuthService.getMe();

      set({
        user,
        isAuthenticated: true,
      });
    } catch (error) {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });

      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await AuthService.logout();
    } finally {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });
    }
  },
}));