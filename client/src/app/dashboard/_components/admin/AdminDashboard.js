"use client";
import { PageSkeleton as SharedPageSkeleton } from "@/components/loading-state";

import toast from "react-hot-toast";

import { useEffect, useState } from "react";

import { getDashboard } from "@/services/dashboard.service";

import AdminOverviewStats from "./AdminOverviewStats";
import UserTrajectoryChart from "./UserTrajectoryChart";
import CampaignReviewQueue from "./CampaignReviewQueue";
import WithdrawalQueue from "./WithdrawalQueue";
import BrandOnboarding from "./BrandOnboarding";
import DisputeEscalations from "./DisputeEscalations";

export default function AdminDashboard() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [dashboard, setDashboard] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const retryLoad = () => {
    setError("");
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await getDashboard({ signal: controller.signal });
        if (controller.signal.aborted) return;

        setDashboard(response.data.dashboard);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Admin dashboard failed:", error);

        const message =
          error.response?.data?.message || "Unable to load Admin dashboard.";
        setError(message);
        toast.error(message, { id: "admin-dashboard-load-error" });
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchDashboard();
    return () => controller.abort();
  }, [loadAttempt]);

  if (isLoading) {
    return (
      <SharedPageSkeleton label="Loading dashboard…" variant="dashboard" />
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={retryLoad}
            className="mt-3 font-medium underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 py-6 lg:px-6">
      {/* Heading */}

      <div>
        <h1 className="text-[32px] font-medium tracking-tight text-text-primary">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-base text-text-tertiary">
          Platform operations, moderation and payout overview.
        </p>
      </div>

      {/* Stats */}

      <AdminOverviewStats dashboard={dashboard} />

      {/* Growth + Campaign moderation */}

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <UserTrajectoryChart data={dashboard?.userTrajectory || []} />

        <CampaignReviewQueue campaigns={dashboard?.campaignReviewQueue || []} />
      </div>

      {/* Withdrawal + brands */}

      <div className="grid gap-5 xl:grid-cols-2">
        <WithdrawalQueue withdrawals={dashboard?.withdrawalQueue || []} />

        <BrandOnboarding brands={dashboard?.newBrands || []} />
      </div>

      {/* Disputes */}

      <DisputeEscalations disputes={dashboard?.disputeQueue || []} />
    </div>
  );
}
