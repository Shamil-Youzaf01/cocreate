"use client";
import LoadingState, {
  PageSkeleton as SharedPageSkeleton,
} from "@/components/loading-state";
import { reportLoadError } from "@/lib/toast-feedback";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  RotateCcw,
  UploadCloud,
} from "lucide-react";

import { getMySubmissions } from "@/services/submission.service";

import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

import StatusBadge from "../shared/StatusBadge";

export default function CreatorSubmissionsPage() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const retryLoad = () => {
    setError("");
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    let controller;
    const fetchSubmissions = async () => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      try {
        setIsLoading(true);
        setError("");

        const response = await getMySubmissions({ signal: request.signal });

        if (!request.signal.aborted) setData(response.data);
      } catch (error) {
        if (request.signal.aborted) return;
        console.error("Submissions fetch failed:", error);

        setError(
          reportLoadError(
            error,
            error.response?.data?.message || "Unable to load submissions.",
            "_components-creator-CreatorSubmissionsPage-load-error-1",
          ),
        );
      } finally {
        if (!request.signal.aborted) setIsLoading(false);
      }
    };

    fetchSubmissions();
    const refreshVisible = () => {
      if (document.visibilityState === "visible") fetchSubmissions();
    };
    window.addEventListener("focus", refreshVisible);
    window.addEventListener("pageshow", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      controller?.abort();
      window.removeEventListener("focus", refreshVisible);
      window.removeEventListener("pageshow", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [loadAttempt]);

  const sections = useMemo(() => {
    if (!data) return [];

    return [
      {
        key: "ready",
        title: "Ready to Submit",
        description: "Accepted campaigns waiting for your first deliverable.",
        items: data.readyToSubmit || [],
        type: "READY_TO_SUBMIT",
      },
      {
        key: "review",
        title: "Under Review",
        description: "Submitted content currently waiting for brand review.",
        items: data.underReview || [],
        type: "SUBMITTED",
      },
      {
        key: "revision",
        title: "Needs Revision",
        description: "Submissions where the brand requested changes.",
        items: data.needsRevision || [],
        type: "REVISION_REQUESTED",
      },
      {
        key: "approved",
        title: "Approved",
        description: "Approved deliverables and completed creator work.",
        items: data.approved || [],
        type: "APPROVED",
      },
      {
        key: "rejected",
        title: "Rejected",
        description: "Rejected submissions are available to view only.",
        items: data.rejected || [],
        type: "REJECTED",
      },
    ];
  }, [data]);

  if (isLoading && !data) {
    return <SharedPageSkeleton label="Loading submissions…" variant="list" />;
  }

  if (error && !data) {
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
    <div className="space-y-5 px-2 py-6 lg:px-6">
      {isLoading && <LoadingState label="Refreshing submissions…" compact />}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={retryLoad}
            className="mt-2 font-medium underline"
          >
            Try again
          </button>
        </div>
      )}
      <div>
        <h1 className="text-[32px] font-medium tracking-tight text-text-primary">
          My Submissions
        </h1>

        <p className="mt-2 text-base text-text-tertiary">
          Manage deliverables, revisions, reviews, and approved content.
        </p>
      </div>

      <SubmissionSummary summary={data?.summary} />

      <div className="space-y-5">
        {sections.map((section) => (
          <SubmissionSection
            key={section.key}
            title={section.title}
            description={section.description}
            items={section.items}
            type={section.type}
          />
        ))}
      </div>
    </div>
  );
}

function SubmissionSummary({ summary = {} }) {
  const stats = [
    {
      label: "Ready to Submit",
      value: summary.readyToSubmit ?? 0,
      icon: UploadCloud,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      label: "Under Review",
      value: summary.underReview ?? 0,
      icon: Clock3,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
    },
    {
      label: "Needs Revision",
      value: summary.needsRevision ?? 0,
      icon: RotateCcw,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
    },
    {
      label: "Approved",
      value: summary.approved ?? 0,
      icon: CheckCircle2,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="rounded-2xl border border-card-border bg-card-background p-5"
          >
            <div
              className={`flex size-9 items-center justify-center rounded-lg ${item.iconBg} ${item.iconColor}`}
            >
              <Icon size={18} />
            </div>

            <p className="mt-6 text-2xl font-semibold text-text-primary">
              {item.value}
            </p>

            <p className="mt-2 text-sm text-text-tertiary">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function SubmissionSection({ title, description, items = [], type }) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>

          <p className="mt-1 text-sm text-text-tertiary">{description}</p>
        </div>
      </CardHeader>

      <div className="space-y-3 p-5 pt-2">
        {items.map((item) => (
          <SubmissionCard
            key={item._id || item.submissionId || item.applicationId}
            item={item}
            type={type}
          />
        ))}
      </div>
    </Card>
  );
}

function SubmissionCard({ item, type }) {
  const campaign =
    item.campaignId && typeof item.campaignId === "object"
      ? item.campaignId
      : null;

  const campaignId = campaign?._id || item.campaignId;

  const campaignTitle = item.campaignTitle || campaign?.title || "Campaign";

  const brandName = item.brand?.name || campaign?.brandId?.name || null;

  const rewardRate =
    item.rewardRatePerThousandViews ??
    campaign?.rewardRatePerThousandViews ??
    0;

  const deadline = item.deadline || campaign?.deadline;

  return (
    <div className="rounded-xl border border-card-border p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-text-primary">{campaignTitle}</h3>

            {type !== "READY_TO_SUBMIT" && (
              <StatusBadge status={item.status || type} />
            )}
          </div>

          {brandName && (
            <p className="mt-1 text-xs text-text-tertiary">by {brandName}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-tertiary">
            {(item.platform || campaign?.platform) && (
              <span>{formatText(item.platform || campaign?.platform)}</span>
            )}

            {(item.contentType || campaign?.contentType) && (
              <span>
                {formatText(item.contentType || campaign?.contentType)}
              </span>
            )}

            <span>{formatCurrency(rewardRate)} / 1K views</span>

            {deadline && <span>Due {formatDate(deadline)}</span>}
          </div>

          <SubmissionMessage item={item} type={type} />
        </div>

        <SubmissionAction item={item} type={type} campaignId={campaignId} />
      </div>
    </div>
  );
}

function SubmissionMessage({ item, type }) {
  if (type === "READY_TO_SUBMIT") {
    return (
      <p className="mt-4 text-sm text-text-secondary">
        Your application was accepted. Submit your first deliverable when ready.
      </p>
    );
  }

  if (type === "SUBMITTED") {
    return (
      <p className="mt-4 text-sm text-text-secondary">
        Your content has been submitted and is waiting for brand review.
      </p>
    );
  }

  if (type === "REVISION_REQUESTED") {
    return (
      <div className="mt-4 rounded-lg bg-orange-50 px-3 py-2">
        <p className="text-sm font-medium text-orange-700">
          Revision requested
        </p>

        {item.feedback && (
          <p className="mt-1 text-xs leading-5 text-orange-600">
            {item.feedback}
          </p>
        )}
      </div>
    );
  }

  if (type === "APPROVED") {
    return (
      <p className="mt-4 text-sm font-medium text-green-600">
        {item.rewardStatus === "CREDITED"
          ? "Deliverable approved. Your reward has been credited."
          : item.rewardStatus === "READY"
            ? "Deliverable approved. Your verified reward is ready for credit."
            : item.rewardStatus === "NOT_ELIGIBLE"
              ? "Deliverable approved. Verified views have not reached the minimum payout."
              : "Deliverable approved. Awaiting views verification before reward credit."}
      </p>
    );
  }

  return null;
}

function SubmissionAction({ item, type, campaignId }) {
  if (type === "READY_TO_SUBMIT" && campaignId) {
    return (
      <Link
        href={`/dashboard/submissions/new?campaignId=${campaignId}`}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
      >
        Submit Content
        <ArrowRight size={15} />
      </Link>
    );
  }

  if (type === "REVISION_REQUESTED" && item._id) {
    return (
      <Link
        href={`/dashboard/submissions/${item._id}`}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
      >
        Revise & Resubmit
        <ArrowRight size={15} />
      </Link>
    );
  }

  if (item._id) {
    return (
      <Link
        href={`/dashboard/submissions/${item._id}`}
        className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600"
      >
        View Submission
        <ArrowRight size={15} />
      </Link>
    );
  }

  return null;
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "-";

  if (Number.isNaN(new Date(value).getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatText(value) {
  if (!value) return "-";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
