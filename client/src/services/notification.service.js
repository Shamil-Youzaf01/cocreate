import api from "@/lib/axios";

export const getNotifications = async (params = {}, config = {}) =>
  (await api.get("/notifications", { ...config, params })).data;

export const markNotificationRead = async (id) =>
  (await api.patch(`/notifications/${id}/read`)).data;

export const markAllNotificationsRead = async (before) =>
  (await api.patch("/notifications/read-all", { before })).data;
