"use client";
import { PageSkeleton as SharedPageSkeleton } from "@/components/loading-state";
import { reportLoadError } from "@/lib/toast-feedback";

import { useEffect, useState } from "react";

import useAuthStore from "@/store/authStore";
import { getDashboard } from "@/services/dashboard.service";

import CreatorOverviewStats from "./CreatorOverviewStats";
import ActiveDeliverables from "./ActiveDeliverables";
import CampaignRecommendations from "./CampaignRecommendations";
import RecentApplications from "./RecentApplications";
import CreatorCharts from "./CreatorCharts";

export default function CreatorDashboard() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const user = useAuthStore((state) => state.user);

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

        if (!controller.signal.aborted) setDashboard(response.data.dashboard);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Creator dashboard error:", error);

        setError(
          reportLoadError(
            error,
            error.response?.data?.message || "Unable to load dashboard.",
            "_components-creator-CreatorDashboard-load-error-1",
          ),
        );
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
    <div className="mt-6 space-y-5">
      <div className="px-2 lg:px-6">
        <h1 className="text-[32px] font-medium tracking-tight text-text-primary">
          Creator Dashboard
        </h1>

        <p className="mt-2 text-base text-text-tertiary">
          Welcome back, {user?.name}. Discover opportunities, manage
          deliverables, and track your earnings.
        </p>
      </div>

      <div className="space-y-5 px-2 lg:px-5">
        <CreatorOverviewStats dashboard={dashboard} />

        <CreatorCharts dashboard={dashboard} />

        <ActiveDeliverables
          deliverables={dashboard?.activeDeliverables || []}
        />

        <CampaignRecommendations
          campaigns={dashboard?.recommendedCampaigns || []}
        />

        <RecentApplications
          applications={dashboard?.recentApplications || []}
        />
      </div>
    </div>
  );
}
