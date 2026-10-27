import api from "@/lib/axios";

const getMyWithdrawals = async (config) => {
  const response = await api.get("/withdrawals/my", config);
  return response.data;
};

const requestWithdrawal = async (data) => {
  const response = await api.post("/withdrawals", data);
  return response.data;
};

export { getMyWithdrawals, requestWithdrawal };

const getAdminWithdrawals = async (config) => {
  const response = await api.get("/withdrawals/admin", config);

  return response.data;
};

const approveWithdrawal = async (withdrawalId, adminNote = "") => {
  const response = await api.patch(`/withdrawals/${withdrawalId}/approve`, {
    adminNote,
  });

  return response.data;
};

const rejectWithdrawal = async (withdrawalId, adminNote = "") => {
  const response = await api.patch(`/withdrawals/${withdrawalId}/reject`, {
    adminNote,
  });

  return response.data;
};

const markWithdrawalPaid = async (withdrawalId, adminNote = "") => {
  const response = await api.patch(`/withdrawals/${withdrawalId}/paid`, {
    adminNote,
  });

  return response.data;
};

export {
  getAdminWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalPaid,
};
