const requiredEnvVariables = [
  "MONGODB_URI",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "CLIENT_URL",
];

const validateEnv = () => {
  const missing = requiredEnvVariables.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
};

export default validateEnv;
