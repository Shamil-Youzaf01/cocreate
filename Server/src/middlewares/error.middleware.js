const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "MulterError") {
    statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "Campaign image must be 5 MB or smaller." : "Upload one campaign image using the cover field.";
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  if (err.code === 11000) {
    statusCode = 409;

    const field = Object.keys(err.keyPattern || {})[0] || "field";

    message = `${field} already exists`;
  }

  if (err.name === "ValidationError") {
    statusCode = 400;

    message = Object.values(err.errors)
      .map((error) => error.message)
      .join(", ");
  }

  const status = `${statusCode}`.startsWith("4") ? "fail" : "error";

  if (statusCode >= 500) {
    console.error(err);
  }

  const isProduction = process.env.NODE_ENV === "production";

  const responseMessage =
    isProduction && statusCode >= 500 ? "Internal server error" : message;

  res.status(statusCode).json({
    success: false,
    status,
    message: responseMessage,
  });
};

export default errorHandler;
