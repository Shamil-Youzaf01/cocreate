import api from "@/lib/axios";

const getDashboard = async (config = {}) => {
  const response = await api.get("/dashboard", config);
  return response.data;
};

export { getDashboard };
