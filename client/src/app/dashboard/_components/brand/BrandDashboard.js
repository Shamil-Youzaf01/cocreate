"use client";
import { PageSkeleton as SharedPageSkeleton } from "@/components/loading-state";
import { reportLoadError } from "@/lib/toast-feedback";

import { useEffect, useState } from "react";

import Link from "next/link";

import { Plus } from "lucide-react";

import { getDashboard } from "@/services/dashboard.service";

import BrandOverviewStats from "./BrandOverviewStats";
import CampaignActivityChart from "./CampaignActivityChart";
import ActiveDeliverableFunnel from "./ActiveDeliverableFunnel";
import ApplicationPipeline from "./ApplicationPipeline";
import SubmissionReviewQueue from "./SubmissionReviewQueue";

export default function BrandDashboard() {
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
        console.error("Brand dashboard failed:", error);

        setError(
          reportLoadError(
            error,
            error.response?.data?.message || "Unable to load dashboard.",
            "_components-brand-BrandDashboard-load-error-1",
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
    <div className="space-y-6 px-2 py-6 lg:px-6">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[32px] font-medium tracking-tight text-text-primary">
            Brand Dashboard
          </h1>

          <p className="mt-2 text-base text-text-tertiary">
            Track campaigns, applications and creator deliverables.
          </p>
        </div>

        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          <Plus size={17} />
          Create Campaign
        </Link>
      </div>

      {/* Stats */}

      <BrandOverviewStats dashboard={dashboard} />

      {/* Chart + Queue */}

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <CampaignActivityChart data={dashboard?.activity || []} />

        <ApplicationPipeline dashboard={dashboard} />
      </div>

      {/* Campaign funnel */}

      <ActiveDeliverableFunnel
        campaigns={dashboard?.activeCampaignFunnel || []}
      />

      {/* Review queue */}

      <SubmissionReviewQueue submissions={dashboard?.submissionQueue || []} />
    </div>
  );
}
