import { getDashboard } from "../services/dashboard.service.js";

const getDashboardData = async (req, res) => {
  const dashboard = await getDashboard({
    userId: req.user.userId,
    role: req.user.role,
  });

  res.status(200).json({
    success: true,
    data: {
      dashboard,
    },
  });
};

export { getDashboardData };
