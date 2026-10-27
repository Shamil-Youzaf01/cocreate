import {
  BadgeIndianRupee,
  Building2,
  Flag,
  Megaphone,
  UserRound,
  WalletCards,
} from "lucide-react";

import DashboardStatCard from "../shared/DashboardStatCard";

export default function AdminOverviewStats({ dashboard }) {
  const stats = [
    {
      label: "Total Creators",
      icon: UserRound,
      tone: "blue",

      value: dashboard?.users?.creators ?? 0,

      subtitle: "Registered creators",
    },

    {
      label: "Total Brands",
      icon: Building2,
      tone: "purple",

      value: dashboard?.users?.brands ?? 0,

      subtitle: "Registered brands",
    },

    {
      label: "Active Campaigns",
      icon: Megaphone,
      tone: "purple",

      value: dashboard?.campaigns?.active ?? 0,

      subtitle: "Published, before deadline",
    },

    {
      label: "Campaign Reviews",
      icon: Flag,
      tone: "orange",

      value: dashboard?.campaigns?.requiringReview ?? 0,

      subtitle: "Requiring moderation",
    },

    {
      label: "Pending Payouts",
      icon: WalletCards,
      tone: "orange",

      value: dashboard?.payouts?.pending ?? 0,

      subtitle: "Need settlement action",
    },

    {
      label: "Rewards Settled",
      icon: BadgeIndianRupee,
      tone: "green",

      value: formatCurrency(dashboard?.payouts?.rewardsSettled),

      subtitle: "Creator rewards credited",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {stats.map((stat) => (
        <DashboardStatCard
          key={stat.label}
          title={stat.label}
          value={stat.value}
          subtitle={stat.subtitle}
          icon={stat.icon}
          iconTone={stat.tone}
        />
      ))}
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
