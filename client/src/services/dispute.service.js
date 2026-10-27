import api from "@/lib/axios";

const getMyDisputes = async (config) => {
  const response = await api.get("/disputes/my", config);
  return response.data;
};

const createDispute = async (data) => {
  const response = await api.post("/disputes", data);
  return response.data;
};

export { getMyDisputes, createDispute };

export const getAdminDisputes = async (config) => {
  const response = await api.get("/disputes/admin", config);
  return response.data;
};

export const reviewDispute = async (disputeId, data) => {
  const response =
    data.status === "UNDER_REVIEW"
      ? await api.patch(`/disputes/${disputeId}/review`)
      : await api.patch(`/disputes/${disputeId}/resolve`, {
          decision: data.status,
          resolution: data.resolution,
        });
  return response.data;
};
