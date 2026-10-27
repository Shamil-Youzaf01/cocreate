import "dotenv/config";
import mongoose from "mongoose";
import Campaign from "../src/models/Campaign.js";

const migrationFilter = {
  $or: [
    { campaignBudget: { $exists: false } },
    { rewardRatePerThousandViews: { $exists: false } },
  ],
};

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    // Read raw records: reward and maxCreators are no longer schema paths.
    const campaigns = await Campaign.collection.find(migrationFilter).toArray();
    console.log(`Found ${campaigns.length} campaigns to migrate.`);

    // Validate every proposed reward configuration before changing any records.
    const changes = [];
    for (const campaign of campaigns) {
      const oldReward = Number(campaign.reward) || 2500;
      const oldMaxCreators = Number(campaign.maxCreators) || 10;
      const fields = {
        campaignBudget: oldReward * oldMaxCreators,
        rewardRatePerThousandViews: 200,
        minimumPayout: 800,
        maximumPayoutPerCreator: oldReward,
        creatorSlots: oldMaxCreators,
      };
      const candidate = new Campaign({ ...campaign, ...fields });
      await candidate.validate(Object.keys(fields));
      changes.push({ campaign, fields });
    }

    let migrated = 0;
    for (const { campaign, fields } of changes) {
      // Set only new fields, retaining the original reward and maxCreators.
      const result = await Campaign.collection.updateOne(
        { _id: campaign._id, ...migrationFilter },
        { $set: fields },
      );
      if (!result.modifiedCount) {
        throw new Error(`Campaign ${campaign._id} changed during migration; rerun to inspect remaining records.`);
      }
      const saved = await Campaign.collection.findOne({ _id: campaign._id });
      for (const [field, value] of Object.entries(fields)) {
        if (saved[field] !== value) throw new Error(`Verification failed for ${campaign._id}: ${field}`);
      }
      for (const field of ["reward", "maxCreators"]) {
        if (saved[field] !== campaign[field]) throw new Error(`Legacy field changed for ${campaign._id}: ${field}`);
      }
      migrated += 1;
      console.log(`Migrated: ${campaign.title}`);
    }

    const remaining = await Campaign.collection.countDocuments(migrationFilter);
    console.log(`Campaign reward migration complete. Migrated: ${migrated}. Remaining: ${remaining}. Legacy fields retained.`);
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

await migrate();
