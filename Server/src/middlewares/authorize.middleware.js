import AppError from "../utils/AppError.js";

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError("You are not authorized to perform this action", 403);
    }

    next();
  };
};

export default authorize;
