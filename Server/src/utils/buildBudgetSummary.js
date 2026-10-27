const buildBudgetSummary = ({ campaignBudget, rewardsIssued }) => ({
  campaignBudget,
  rewardsIssued,
  remainingBudget: Math.max(campaignBudget - rewardsIssued, 0),
  budgetUsagePercent: campaignBudget > 0 ? Math.min((rewardsIssued / campaignBudget) * 100, 100) : 0,
});

export default buildBudgetSummary;
