import AppError from "../utils/AppError.js";

const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      throw new AppError(message, 400);
    }

    req.validated = result.data;

    next();
  };
};

export default validate;
