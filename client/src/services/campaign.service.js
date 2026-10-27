import api from "@/lib/axios";

export const uploadCampaignCover = async (file, config = {}) => {
  const formData = new FormData();
  formData.append("cover", file);
  const response = await api.post("/campaigns/upload-cover", formData, {
    ...config,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

const getCampaignById = async (campaignId, config) => {
  const response = await api.get(`/campaigns/${campaignId}`, config);

  return response.data;
};

const getPublishedCampaigns = async (params = {}, config = {}) => {
  const response = await api.get("/campaigns/published", { ...config, params });

  return response.data;
};

export { getCampaignById, getPublishedCampaigns };

export const getMyCampaigns = async (config) => {
  const response = await api.get("/campaigns/my", config);
  return response.data;
};

export const createCampaign = async (data) => {
  const response = await api.post("/campaigns", data);
  return response.data;
};
export const updateCampaign = async (campaignId, data) => {
  const response = await api.patch(`/campaigns/${campaignId}`, data);
  return response.data;
};
export const publishCampaign = async (campaignId) => {
  const response = await api.patch(`/campaigns/${campaignId}/publish`);
  return response.data;
};
export const closeCampaign = async (campaignId) => {
  const response = await api.patch(`/campaigns/${campaignId}/close`);
  return response.data;
};
