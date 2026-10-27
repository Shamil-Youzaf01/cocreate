// Explicit account response fields; never include password hashes or session data.
export default function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    status: user.status,
    avatarUrl: user.avatarUrl || "",
    bio: user.bio || "",
    location: user.location || "",
    instagramUrl: user.instagramUrl || "",
    youtubeUrl: user.role === "CREATOR" ? user.youtubeUrl || "" : "",
    categories: user.role === "CREATOR" ? user.categories || [] : [],
    industry: user.role === "BRAND" ? user.industry || "" : "",
    website: user.role === "BRAND" ? user.website || "" : "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
