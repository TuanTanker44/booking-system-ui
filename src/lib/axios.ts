import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useUserStore } from '../stores/user.js';
import { useStoreStore } from '../stores/store';

const API_URL = import.meta.env.VITE_API_URL;

interface RefreshResponse {
  access_token: string;
}

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage
const getAccessToken = () => {
  return (
    useUserStore.getState().accessToken ??
    localStorage.getItem('accessToken')
  );
};

const clearTokens = () => {
  localStorage.removeItem('accessToken');
  useStoreStore.getState().clearStore();

  // Xoá phiên trong store để ProtectedRoute tự điều hướng về /login
  useUserStore.setState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
  });
};

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Refresh logic
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  // Refresh token nằm trong cookie httpOnly, trình duyệt tự gửi kèm
  const response = await axios.post<RefreshResponse>(
    `${API_URL}/auth/refresh`,
    undefined,
    { withCredentials: true },
  );

  const newAccessToken = response.data.access_token;

  useUserStore.getState().setAccessToken(newAccessToken);

  return newAccessToken;
};

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Chỉ xử lý 401
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Login/register trả 401 là lỗi nghiệp vụ, giữ nguyên để hiển thị message
    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register')
    ) {
      return Promise.reject(error);
    }

    // Không refresh lại chính request refresh
    if (originalRequest.url?.includes('/auth/refresh')) {
      clearTokens();

      return Promise.reject(error);
    }

    // Không retry request quá một lần
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // Nếu đã có refresh đang chạy thì dùng chung promise đó
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return axiosInstance(originalRequest);
    } catch (refreshError) {
      clearTokens();

      return Promise.reject(refreshError);
    }
  },
);

export default axiosInstance;
