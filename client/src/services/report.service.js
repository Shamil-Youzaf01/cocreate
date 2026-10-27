import api from "@/lib/axios";

const getMyReports = async (config) => {
  const response = await api.get("/reports/my", config);
  return response.data;
};

const createReport = async (data) => {
  const response = await api.post("/reports", data);
  return response.data;
};

export { getMyReports, createReport };

export const getAdminReports = async (config) => {
  const response = await api.get("/reports/admin", config);
  return response.data;
};

export const reviewReport = async (reportId, data) => {
  const response = await api.patch(`/reports/${reportId}/status`, data);
  return response.data;
};
