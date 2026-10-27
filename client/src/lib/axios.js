import axios from "axios";
import useAuthStore from "@/store/authStore";
import { queueSessionExpiredNotice } from "./toast-feedback";

const options = {
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json", "X-CoCreate-Request": "1" },
};
const api = axios.create(options);
export const refreshClient = axios.create(options);
let refreshPromise = null;

// Shared by startup restoration and expired-token retries.
export function refreshSession() {
  if (!refreshPromise) {
    const originalState = useAuthStore.getState();
    refreshPromise = refreshClient
      .post("/auth/refresh", {})
      .then((response) => {
        const token = response.data?.data?.accessToken;
        if (!token)
          throw new Error("Refresh endpoint did not return an access token.");
        if (
          useAuthStore.getState().sessionVersion !==
          originalState.sessionVersion
        ) {
          throw new Error("Session changed during refresh.");
        }
        useAuthStore.getState().setAccessToken(token);
        return response.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const state = useAuthStore.getState();
  config._sessionVersion ??= state.sessionVersion;
  if (state.accessToken)
    config.headers.Authorization = `Bearer ${state.accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const excluded =
      /\/auth\/(login|register|refresh|logout|verify-email|resend-verification|signup)(?:[/?]|$)/;
    if (
      error.response?.status !== 401 ||
      !request ||
      excluded.test(request.url || "")
    )
      throw error;
    const state = useAuthStore.getState();
    if (request._sessionVersion !== state.sessionVersion) throw error;
    const endSession = () => {
      if (useAuthStore.getState().sessionVersion !== request._sessionVersion)
        return;
      useAuthStore.getState().clearAuth();
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        queueSessionExpiredNotice();
        window.location.replace("/login");
      }
    };
    if (request._retry) {
      endSession();
      throw error;
    }
    request._retry = true;
    try {
      // A delayed 401 may belong to the token already replaced by another request.
      if (
        !state.accessToken ||
        request.headers.Authorization === `Bearer ${state.accessToken}`
      ) {
        await refreshSession();
      }
    } catch (refreshError) {
      endSession();
      throw refreshError;
    }
    if (request._sessionVersion !== useAuthStore.getState().sessionVersion)
      throw error;
    request.headers.Authorization = `Bearer ${useAuthStore.getState().accessToken}`;
    return api(request);
  },
);

export default api;
