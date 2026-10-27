const calculateCampaignReward = ({
  verifiedViews,
  rewardRatePerThousandViews,
  minimumPayout,
  maximumPayoutPerCreator,
}) => {
  const views = Number(verifiedViews) || 0;
  const rate = Number(rewardRatePerThousandViews) || 0;
  const minimum = Number(minimumPayout) || 0;
  const maximum = Number(maximumPayoutPerCreator) || 0;

  const calculatedReward = (views / 1000) * rate;

  if (calculatedReward < minimum) {
    return { calculatedReward, finalReward: 0, eligible: false };
  }

  const finalReward = Math.min(calculatedReward, maximum);
  return { calculatedReward, finalReward, eligible: true };
};

export default calculateCampaignReward;
