import CampaignBudgetProgress from "./CampaignBudgetProgress";

export default function CampaignRewardSummary({
  campaign,
  variant = "detail",
}) {
  const {
    campaignBudget = 0,
    rewardsIssued = 0,
    remainingBudget = 0,
    budgetUsagePercent = 0,
    rewardRatePerThousandViews = 0,
    minimumPayout = 0,
    maximumPayoutPerCreator = 0,
  } = campaign || {};

  if (variant === "creator-card") {
    return (
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-text-tertiary">Reward rate</p>

            <p className="mt-1 text-base font-semibold text-text-primary">
              {formatCurrency(rewardRatePerThousandViews)}
              <span className="text-sm font-normal text-text-tertiary">
                {" "}
                / 1K views
              </span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-text-tertiary">Remaining</p>

            <p className="mt-1 text-sm font-medium text-text-primary">
              {formatCurrency(remainingBudget)}
            </p>
          </div>
        </div>

        <CampaignBudgetProgress
          campaignBudget={campaignBudget}
          rewardsIssued={rewardsIssued}
          remainingBudget={remainingBudget}
          budgetUsagePercent={budgetUsagePercent}
          compact
        />
      </div>
    );
  }

  if (variant === "brand-card") {
    return (
      <div className="space-y-4">
        <CampaignBudgetProgress
          campaignBudget={campaignBudget}
          rewardsIssued={rewardsIssued}
          remainingBudget={remainingBudget}
          budgetUsagePercent={budgetUsagePercent}
        />

        <div className="grid grid-cols-3 gap-3 border-t border-card-border pt-4">
          <Metric
            label="Reward rate"
            value={`${formatCurrency(rewardRatePerThousandViews)} / 1K`}
          />

          <Metric label="Minimum" value={formatCurrency(minimumPayout)} />

          <Metric
            label="Max / creator"
            value={formatCurrency(maximumPayoutPerCreator)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary">
          Reward Settings
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <RewardCard
            label="Reward rate"
            value={`${formatCurrency(rewardRatePerThousandViews)} / 1K views`}
            helper="Based on verified views"
          />

          <RewardCard
            label="Minimum payout"
            value={formatCurrency(minimumPayout)}
            helper="Minimum eligible reward"
          />

          <RewardCard
            label="Maximum payout per creator"
            value={formatCurrency(maximumPayoutPerCreator)}
            helper="Per creator"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-card-border bg-card-background p-5">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary">
          Campaign Budget
        </p>

        <CampaignBudgetProgress
          campaignBudget={campaignBudget}
          rewardsIssued={rewardsIssued}
          remainingBudget={remainingBudget}
          budgetUsagePercent={budgetUsagePercent}
        />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-text-tertiary">{label}</p>

      <p className="mt-1 text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

function RewardCard({ label, value, helper }) {
  return (
    <div className="rounded-xl border border-card-border bg-background-gray-primary/40 p-4">
      <p className="text-xs text-text-tertiary">{label}</p>

      <p className="mt-2 text-lg font-semibold text-text-primary">{value}</p>

      <p className="mt-1 text-[11px] text-text-tertiary">{helper}</p>
    </div>
  );
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}
