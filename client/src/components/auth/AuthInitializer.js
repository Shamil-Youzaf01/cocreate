"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import useAuthStore from "@/store/authStore";
import { refreshAccessToken, getMe } from "@/services/auth.service";
import {
  queueSessionExpiredNotice,
  showSessionExpiredNotice,
} from "@/lib/toast-feedback";
import LoadingState from "@/components/loading-state";

let restorationPromise;

function restoreSession() {
  if (!restorationPromise) {
    restorationPromise = (async () => {
      await refreshAccessToken();
      const meResponse = await getMe();
      return {
        user: meResponse.data.user,
        accessToken: useAuthStore.getState().accessToken,
      };
    })().finally(() => {
      restorationPromise = null;
    });
  }
  return restorationPromise;
}

export default function AuthInitializer({ children }) {
  const router = useRouter();

  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    const auth = useAuthStore.getState();
    if (auth.isAuthenticated && auth.user && auth.accessToken) {
      return;
    }

    let active = true;
    const restoreAuth = async () => {
      try {
        setLoading(true);

        const session = await restoreSession();
        if (active) setAuth(session);
      } catch (error) {
        if (!active) return;
        if ([401, 403].includes(error.response?.status)) {
          queueSessionExpiredNotice();
          showSessionExpiredNotice();
        }
        clearAuth();
        router.replace("/login");
      }
    };

    restoreAuth();
    return () => {
      active = false;
    };
  }, [clearAuth, router, setAuth, setLoading]);

  if (isLoading) {
    return <LoadingState fullScreen label="Restoring your session..." />;
  }

  return isAuthenticated ? (
    children
  ) : (
    <LoadingState fullScreen label="Opening sign in..." />
  );
}
