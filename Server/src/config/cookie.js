const refreshTokenCookieBaseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  path: "/",
};

const refreshTokenCookieOptions = {
  ...refreshTokenCookieBaseOptions,
  maxAge: Number(process.env.REFRESH_COOKIE_MAX_AGE_MS),
};

const clearRefreshTokenCookieOptions = {
  ...refreshTokenCookieBaseOptions,
};

export { refreshTokenCookieOptions, clearRefreshTokenCookieOptions };
