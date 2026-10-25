import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage
const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
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
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('Refresh token not found');
  }

  const response = await axios.post<RefreshResponse>(
    `${API_URL}/auth/refresh`,
    {
      refreshToken,
    },
  );

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
    response.data;

  setTokens(newAccessToken, newRefreshToken);

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

    // Không refresh lại chính request refresh
    if (originalRequest.url?.includes('/auth/refresh')) {
      clearTokens();
      window.location.href = '/login';

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
      window.location.href = '/login';

      return Promise.reject(refreshError);
    }
  },
);

export default axiosInstance;