import { z } from "zod";

const urlField = z.string().trim().url("Enter a valid URL").or(z.literal(""));

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(50).optional(),
    bio: z.string().trim().max(300, "Bio cannot exceed 300 characters").optional(),
    location: z.string().trim().max(100).optional(),
    avatarUrl: urlField.optional(),
    instagramUrl: urlField.optional(),
    youtubeUrl: urlField.optional(),
    categories: z.array(z.string().trim().min(1).max(50)).max(8).optional(),
    industry: z.string().trim().max(100).optional(),
    website: urlField.optional(),
  }),
});
