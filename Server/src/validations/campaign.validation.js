import { z } from "zod";
import { objectIdSchema } from "./common.validation.js";

const createCampaignSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(150),

    description: z.string().trim().min(10).max(5000),

    requirements: z.string().trim().min(5).max(5000),

    platform: z.enum(["INSTAGRAM", "YOUTUBE", "TIKTOK", "OTHER"]),

    contentType: z.enum(["VIDEO", "REEL", "POST", "STORY", "SHORT", "OTHER"]),

    reward: z.number().positive("Reward must be greater than zero"),

    maxCreators: z.number().int().positive(),

    deadline: z.coerce.date(),
  }),
});

const campaignIdSchema = z.object({
  params: z.object({
    campaignId: objectIdSchema,
  }),
});

export { createCampaignSchema, campaignIdSchema };
