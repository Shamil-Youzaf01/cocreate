"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import useAuthStore from "@/store/authStore";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/services/notification.service";

export default function useNotifications(page = 1) {
  const userId = useAuthStore((state) => state.user?._id || state.user?.id);
  const [data, setData] = useState(null);
  const [requestState, setRequestState] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const refreshRef = useRef(null);
  const active = useRef(false);
  const mutationLock = useRef(false);

  useEffect(() => {
    if (!userId) return;
    active.current = true;
    let controller;
    async function load(notifyFailure = false) {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      setRequestState({ owner: userId, page, pending: true, error: "" });
      try {
        const response = await getNotifications(
          { page, limit: 20 },
          { signal: request.signal },
        );
        if (!request.signal.aborted) {
          setData({ ...response.data, owner: userId, page });
        }
      } catch (error) {
        if (!request.signal.aborted) {
          const message =
            error.response?.data?.message || "Unable to load notifications.";
          setRequestState({
            owner: userId,
            page,
            pending: false,
            error: message,
          });
          if (notifyFailure)
            toast.error(message, { id: "notifications-load-error" });
        }
      } finally {
        if (!request.signal.aborted)
          setRequestState((current) => ({ ...current, pending: false }));
      }
    }
    refreshRef.current = () => load(true);
    const refreshVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    load(true);
    const timer = window.setInterval(refreshVisible, 60000);
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      active.current = false;
      refreshRef.current = null;
      controller?.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [page, userId]);

  const refresh = useCallback(() => refreshRef.current?.(), []);
  const run = async (action, successMessage, actionId) => {
    if (mutationLock.current) return false;
    mutationLock.current = true;
    setPendingAction(actionId);
    try {
      await action();
      const currentUser = useAuthStore.getState().user;
      if (!active.current || (currentUser?._id || currentUser?.id) !== userId)
        return false;
      if (successMessage) toast.success(successMessage);
      await refresh();
      return true;
    } catch (error) {
      if (active.current)
        toast.error(
          error.response?.data?.message || "Unable to update notifications.",
        );
      return false;
    } finally {
      mutationLock.current = false;
      if (active.current) setPendingAction(null);
    }
  };

  const current = data?.owner === userId && data?.page === page ? data : null;
  const currentRequest =
    requestState?.owner === userId && requestState?.page === page
      ? requestState
      : null;
  const error = currentRequest?.error || "";
  const loading = !current && (!currentRequest || currentRequest.pending);
  return {
    notifications: current?.notifications || [],
    unreadCount: data?.owner === userId ? data.unreadCount : 0,
    pagination: current?.pagination,
    loading,
    refreshing: Boolean(current && currentRequest?.pending),
    error,
    busy: pendingAction !== null,
    pendingId: pendingAction === "all" ? null : pendingAction,
    markingAll: pendingAction === "all",
    refresh,
    read: (notification) =>
      mutationLock.current
        ? Promise.resolve(false)
        : notification.readAt
          ? Promise.resolve(true)
          : run(
              () => markNotificationRead(notification._id),
              null,
              notification._id,
            ),
    readAll: () =>
      current?.asOf
        ? run(
            () => markAllNotificationsRead(current.asOf),
            "Notifications marked as read.",
            "all",
          )
        : Promise.resolve(false),
  };
}
