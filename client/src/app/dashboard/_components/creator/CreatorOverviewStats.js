import { Wallet, BadgeIndianRupee, Megaphone, Clock3 } from "lucide-react";

import DashboardStatCard from "../shared/DashboardStatCard";

export default function CreatorOverviewStats({ dashboard }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard
        title="Available Balance"
        value={formatCurrency(dashboard?.wallet?.availableBalance)}
        subtitle="Ready to withdraw"
        icon={Wallet}
        iconBgClass="bg-blue-50"
        iconColorClass="text-blue-500"
      />

      <DashboardStatCard
        title="Total Earned"
        value={formatCurrency(dashboard?.wallet?.totalEarned)}
        subtitle="Lifetime earnings"
        icon={BadgeIndianRupee}
        iconBgClass="bg-green-50"
        iconColorClass="text-green-500"
      />

      <DashboardStatCard
        title="Active Campaigns"
        value={dashboard?.applications?.active ?? 0}
        subtitle="In progress"
        icon={Megaphone}
        iconBgClass="bg-purple-50"
        iconColorClass="text-purple-500"
      />

      <DashboardStatCard
        title="Under Review"
        value={dashboard?.submissions?.underReview ?? 0}
        subtitle="Awaiting brand"
        icon={Clock3}
        iconBgClass="bg-orange-50"
        iconColorClass="text-orange-500"
      />
    </div>
  );
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
