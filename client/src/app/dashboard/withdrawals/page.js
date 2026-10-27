"use client";

import useAuthStore from "@/store/authStore";
import { PageSkeleton } from "@/components/loading-state";

import CreatorWithdrawalsPage from "@/app/dashboard/_components/creator/CreatorWithdrawalsPage";
import AdminWithdrawalsPage from "@/app/dashboard/_components/admin/AdminWithdrawalsPage";

export default function WithdrawalsPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <PageSkeleton label="Loading withdrawals..." />;
  }

  if (user.role === "CREATOR") {
    return <CreatorWithdrawalsPage />;
  }

  if (user.role === "ADMIN") {
    return <AdminWithdrawalsPage />;
  }

  return (
    <div className="p-6 text-text-tertiary">
      Withdrawals are not available for this account.
    </div>
  );
}
