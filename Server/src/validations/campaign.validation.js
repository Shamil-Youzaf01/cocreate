import { z } from "zod";
import { objectIdSchema } from "./common.validation.js";

const coverImageSchema = z.object({
  url: z.string().url().or(z.literal("")),
  publicId: z.string().optional().default(""),
});

const createCampaignSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(150),

    coverImage: coverImageSchema.optional(),

    description: z.string().trim().min(10).max(5000),

    requirements: z.string().trim().min(5).max(5000),

    platform: z.enum(["INSTAGRAM", "YOUTUBE"]),

    contentType: z.enum(["VIDEO", "REEL", "SHORT"]),

    campaignBudget: z.number().positive("Campaign budget must be greater than 0."),

    rewardRatePerThousandViews: z
      .number()
      .positive("Reward rate must be greater than 0."),

    minimumPayout: z.number().min(0, "Minimum payout cannot be negative."),

    maximumPayoutPerCreator: z
      .number()
      .positive("Maximum payout must be greater than 0."),

    creatorSlots: z.number().int().positive().nullable().optional(),

    deadline: z.coerce.date(),
  })
    .refine(
      (data) => data.platform === "INSTAGRAM"
        ? data.contentType === "REEL"
        : ["VIDEO", "SHORT"].includes(data.contentType),
      {
        message: "Instagram campaigns require Reels. YouTube campaigns require Video or Shorts.",
        path: ["contentType"],
      },
    )
    .refine(
      (data) => data.minimumPayout <= data.maximumPayoutPerCreator,
      {
        message: "Minimum payout cannot exceed maximum payout per creator.",
        path: ["minimumPayout"],
      },
    )
    .refine(
      (data) => data.maximumPayoutPerCreator <= data.campaignBudget,
      {
        message: "Maximum payout per creator cannot exceed campaign budget.",
        path: ["maximumPayoutPerCreator"],
      },
    ),
});

const campaignIdSchema = z.object({
  params: z.object({
    campaignId: objectIdSchema,
  }),
});

// Existing edit fields retain their model validation; validate the optional
// image independently so partial edits do not require a full create payload.
const updateCampaignSchema = z.object({
  body: z.object({ coverImage: coverImageSchema.optional() }).passthrough(),
});

export { createCampaignSchema, campaignIdSchema, updateCampaignSchema };
