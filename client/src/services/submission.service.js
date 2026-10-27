import api from "@/lib/axios";
export const syncSubmissionViews = async (submissionId) =>
  (await api.post(`/submissions/${submissionId}/sync-views`)).data;

export const verifySubmissionViews = async (submissionId, verifiedViews) =>
  (
    await api.patch(`/submissions/${submissionId}/verify-views`, {
      verifiedViews,
    })
  ).data;
export const creditSubmissionReward = async (submissionId) =>
  (await api.post(`/submissions/${submissionId}/credit-reward`)).data;

const getMySubmissions = async (config) => {
  const response = await api.get("/submissions/my", config);
  return response.data;
};

const createSubmission = async (campaignId, data) => {
  const response = await api.post(`/submissions/campaigns/${campaignId}`, data);
  return response.data;
};

const getSubmissionById = async (submissionId) => {
  const response = await api.get(`/submissions/${submissionId}`);
  return response.data;
};

const resubmitSubmission = async (submissionId, data) => {
  const response = await api.patch(
    `/submissions/${submissionId}/resubmit`,
    data,
  );
  return response.data;
};

export {
  getMySubmissions,
  createSubmission,
  getSubmissionById,
  resubmitSubmission,
};

export const getCampaignSubmissions = async (campaignId, config) => {
  const response = await api.get(
    `/submissions/campaigns/${campaignId}`,
    config,
  );
  return response.data;
};

export const reviewSubmission = async (submissionId, data) => {
  const response = await api.patch(`/submissions/${submissionId}/review`, data);
  return response.data;
};

export const getBrandSubmissions = async (config) => {
  const response = await api.get("/submissions/brand/my", config);
  return response.data;
};
