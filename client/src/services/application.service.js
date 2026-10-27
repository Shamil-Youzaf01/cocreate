import api from "@/lib/axios";

const applyToCampaign = async (campaignId, data) => {
  const response = await api.post(
    `/applications/campaigns/${campaignId}/apply`,
    data,
  );

  return response.data;
};

const getMyApplications = async (config = {}) => {
  const response = await api.get("/applications/my", config);

  return response.data;
};

export { applyToCampaign, getMyApplications };

export const getCampaignApplications = async (campaignId, config) => {
  const response = await api.get(
    `/applications/campaigns/${campaignId}`,
    config,
  );
  return response.data;
};

export const reviewApplication = async (applicationId, decision) => {
  const response = await api.patch(`/applications/${applicationId}/review`, {
    decision,
  });
  return response.data;
};

export const getBrandApplications = async (config) => {
  const response = await api.get("/applications/brand/my", config);
  return response.data;
};
