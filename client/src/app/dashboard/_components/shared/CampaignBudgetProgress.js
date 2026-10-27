export default function CampaignBudgetProgress({
  campaignBudget = 0,
  rewardsIssued = 0,
  remainingBudget = 0,
  budgetUsagePercent = 0,
  compact = false,
}) {
  const percent = Math.max(0, Math.min(Number(budgetUsagePercent) || 0, 100));
  return (
    <div>
      {!compact && (
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-text-tertiary">Rewards issued</p>
            <p className="mt-1 text-base font-semibold text-text-primary">
              {formatCurrency(rewardsIssued)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-tertiary">Remaining budget</p>
            <p className="mt-1 text-base font-semibold text-text-primary">
              {formatCurrency(remainingBudget)}
            </p>
          </div>
        </div>
      )}
      <div
        role="progressbar"
        aria-label="Campaign budget used"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${percent.toFixed(0)}% allocated`}
        className="relative h-2.5 overflow-hidden rounded-full bg-background-gray-secondary"
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-text-tertiary">
        <span>{percent.toFixed(0)}% allocated</span>
        <span>
          {compact
            ? `${formatCurrency(remainingBudget)} remaining`
            : `${formatCurrency(campaignBudget)} total`}
        </span>
      </div>
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
