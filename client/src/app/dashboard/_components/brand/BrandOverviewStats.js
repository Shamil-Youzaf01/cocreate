import {
  BadgeIndianRupee,
  Megaphone,
  UserRoundCheck,
  Users,
} from "lucide-react";

import DashboardStatCard from "../shared/DashboardStatCard";

export default function BrandOverviewStats({ dashboard }) {
  const stats = [
    {
      label: "Active Campaigns",
      icon: Megaphone,
      tone: "purple",

      value: dashboard?.campaigns?.active ?? 0,

      subtitle: "Published, before deadline",
    },

    {
      label: "Total Applicants",
      icon: Users,
      tone: "blue",

      value: dashboard?.applications?.total ?? 0,

      subtitle: `${dashboard?.applications?.pending ?? 0} awaiting review`,
    },

    {
      label: "Creators In Flight",
      icon: UserRoundCheck,
      tone: "orange",

      value: dashboard?.creatorsInFlight ?? 0,

      subtitle: "Accepted unfinished assignments",
    },

    {
      label: "Rewards Ready",
      icon: BadgeIndianRupee,
      tone: "green",

      value: formatCurrency(dashboard?.committedRewards),

      subtitle: "Verified rewards awaiting credit",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
