import api from "@/lib/axios";
export const getMyWallet = async (config = {}) =>
  (await api.get("/wallet/me", config)).data;
export const getMyTransactions = async (config = {}) =>
  (await api.get("/wallet/transactions", config)).data;
