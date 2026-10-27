import api, { refreshSession } from "@/lib/axios";

export const startSignup = async (email, role) =>
  (await api.post("/auth/signup/start", { email, role })).data;
export const verifySignup = async (token) =>
  (await api.post("/auth/signup/verify", { token })).data;
export const getSignupProfile = async () =>
  (await api.get("/auth/signup/profile")).data;
export const completeSignup = async (data) =>
  (await api.post("/auth/signup/profile", data)).data;

const login = async (data) => {
  const response = await api.post("/auth/login", data);

  return response.data;
};

const getMe = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};

const refreshAccessToken = refreshSession;

const logout = async () => {
  const response = await api.post("/auth/logout", {});

  return response.data;
};

const updateProfile = async (data) => {
  const response = await api.patch("/profile/me", data);
  return response.data;
};

export { updateProfile, login, getMe, refreshAccessToken, logout };
