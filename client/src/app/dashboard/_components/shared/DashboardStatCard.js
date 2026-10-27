import StatIcon from "./StatIcon";

export default function DashboardStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgClass = "bg-brand-50",
  iconColorClass = "text-brand-500",
  iconTone,
}) {
  return (
    <div className="flex min-h-[190px] flex-col justify-between rounded-2xl border border-card-border bg-card-background p-6">
      <StatIcon
        icon={Icon}
        tone={iconTone}
        className={iconTone ? undefined : `${iconBgClass} ${iconColorClass}`}
      />

      <div className="mt-8">
        <p className="text-[30px] font-semibold leading-none tracking-tight text-text-primary">
          {value}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-text-secondary">
            {title}
          </span>

          {subtitle && (
            <span className="text-right text-xs font-medium text-text-tertiary">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
