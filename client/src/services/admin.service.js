import api from "@/lib/axios";

/*
|--------------------------------------------------------------------------
| Users
|--------------------------------------------------------------------------
*/

const getAdminUsers = async (params = {}, config = {}) => {
  const response = await api.get("/admin/users", {
    ...config,
    params,
  });

  return response.data;
};

const updateUserStatus = async (userId, status) => {
  const response = await api.patch(`/admin/users/${userId}/status`, {
    status,
  });

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Campaign Moderation
|--------------------------------------------------------------------------
*/

const moderateCampaign = async (campaignId, data) => {
  const response = await api.patch(
    `/admin/campaigns/${campaignId}/moderate`,
    data,
  );

  return response.data;
};

export { getAdminUsers, updateUserStatus, moderateCampaign };

export const getAdminCampaigns = async (params = {}, config = {}) => {
  const response = await api.get("/admin/campaigns", { ...config, params });
  return response.data;
};
