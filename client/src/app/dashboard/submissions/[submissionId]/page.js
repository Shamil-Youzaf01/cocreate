"use client";
import useUnsavedChanges from "@/hooks/use-unsaved-changes";
import { reportLoadError } from "@/lib/toast-feedback";

import { useEffect, useRef, useState } from "react";
import { InlineSpinner } from "@/components/loading-state";

import { useParams } from "next/navigation";

import Link from "next/link";

import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  IndianRupee,
  RotateCcw,
  Send,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  getSubmissionById,
  resubmitSubmission,
} from "@/services/submission.service";

import useAuthStore from "@/store/authStore";

import SubmissionPerformance from "../../_components/shared/SubmissionPerformance";
import { getCampaignById } from "@/services/campaign.service";
import StatusBadge from "../../_components/shared/StatusBadge";

export default function SubmissionDetailsPage() {
  const params = useParams();

  const submissionId = params.submissionId;

  return <SubmissionDetails key={submissionId} submissionId={submissionId} />;
}

function SubmissionDetails({ submissionId }) {
  const submitLock = useRef(false);
  const role = useAuthStore((state) => state.user?.role);
  const [submission, setSubmission] = useState(null);

  const [contentUrl, setContentUrl] = useState("");

  const [caption, setCaption] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Fetch Submission
  |--------------------------------------------------------------------------
  */

  useUnsavedChanges(
    role === "CREATOR" &&
      submission?.status === "REVISION_REQUESTED" &&
      (contentUrl !== (submission.contentUrl || "") ||
        caption !== (submission.caption || "")),
  );

  useEffect(() => {
    let active = true;
    const fetchSubmission = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await getSubmissionById(submissionId);

        if (!active) return;
        const submissionData = response.data?.submission;

        const campaignResponse = await getCampaignById(
          submissionData.campaignId._id,
        );
        if (!active) return;
        setSubmission({
          ...submissionData,
          campaignId: campaignResponse.data.campaign,
        });

        setContentUrl(submissionData?.contentUrl || "");

        setCaption(submissionData?.caption || "");
      } catch (error) {
        if (!active) return;
        console.error("Submission fetch failed:", error);

        setError(
          reportLoadError(
            error,
            error.response?.data?.message || "Unable to load submission.",
            "submissions-[submissionId]-page-load-error-1",
          ),
        );
      } finally {
        if (active) setIsLoading(false);
      }
    };

    if (submissionId) {
      fetchSubmission();
    }
    return () => {
      active = false;
    };
  }, [submissionId]);

  /*
  |--------------------------------------------------------------------------
  | Resubmit
  |--------------------------------------------------------------------------
  */

  const handleResubmit = async (event) => {
    event.preventDefault();
    if (
      submitLock.current ||
      role !== "CREATOR" ||
      submission?.status !== "REVISION_REQUESTED"
    )
      return;
    if (!safeContentUrl(contentUrl.trim())) {
      toast.error("Enter a valid HTTP or HTTPS content URL.");
      return;
    }

    if (!contentUrl.trim()) {
      toast.error("Content URL is required.");

      return;
    }

    try {
      submitLock.current = true;
      setIsSubmitting(true);

      const response = await resubmitSubmission(submissionId, {
        contentUrl: contentUrl.trim(),

        caption: caption.trim(),
      });

      const updatedSubmission = response.data?.submission;

      if (updatedSubmission) {
        setSubmission((current) => ({
          ...current,
          ...updatedSubmission,
          campaignId: current.campaignId,
          applicationId: current.applicationId,
        }));
      } else {
        setSubmission((current) => ({
          ...current,
          contentUrl: contentUrl.trim(),
          caption: caption.trim(),
          status: "SUBMITTED",
          feedback: "",
        }));
      }

      toast.success("Content resubmitted successfully.");
    } catch (error) {
      console.error("Resubmission failed:", error);

      toast.error(
        error.response?.data?.message || "Unable to resubmit content.",
      );
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <SubmissionDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="px-2 py-6 lg:px-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!submission) {
    return <div className="p-6 text-text-tertiary">Submission not found.</div>;
  }

  const campaign = submission.campaignId;

  const canResubmit =
    role === "CREATOR" && submission.status === "REVISION_REQUESTED";

  return (
    <div className="mx-auto max-w-6xl px-2 py-6 lg:px-6">
      {/* Back */}

      <Link
        href="/dashboard/submissions"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-brand-500"
      >
        <ArrowLeft size={16} />
        Back to submissions
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main */}

        <div className="space-y-5">
          {/* Header */}

          <div className="rounded-2xl border border-card-border bg-card-background p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  Submission
                </p>

                <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-text-primary">
                  {campaign?.title || "Campaign Submission"}
                </h1>

                {campaign?.brandId?.name && (
                  <p className="mt-2 text-sm text-text-tertiary">
                    by {campaign.brandId.name}
                  </p>
                )}
              </div>

              <StatusBadge status={submission.status} />
            </div>
          </div>

          {/* Feedback */}

          {submission.status === "REVISION_REQUESTED" && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
              <div className="flex items-start gap-3">
                <RotateCcw
                  size={18}
                  className="mt-0.5 shrink-0 text-orange-600"
                />

                <div>
                  <p className="text-sm font-semibold text-orange-700">
                    Revision Requested
                  </p>

                  <p className="mt-2 text-sm leading-6 text-orange-700">
                    {submission.feedback ||
                      "The brand has requested changes to your submission."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submitted state */}

          {submission.status === "SUBMITTED" && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-sm font-medium text-blue-700">
                Your submission is currently under review.
              </p>

              <p className="mt-1 text-xs text-blue-600">
                You&apos;ll be able to resubmit if the brand requests changes.
              </p>
            </div>
          )}

          {/* Approved */}

          {submission.status === "APPROVED" && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="text-sm font-semibold text-green-700">
                Submission Approved
              </p>

              <p className="mt-1 text-xs text-green-600">
                {submission.rewardStatus === "CREDITED"
                  ? "Your reward has been credited to your creator wallet."
                  : submission.rewardStatus === "READY"
                    ? "Your verified reward is ready for the brand to credit."
                    : submission.rewardStatus === "NOT_ELIGIBLE"
                      ? "Your verified views have not reached the minimum payout."
                      : "Your content is approved. Your reward is awaiting views verification."}
              </p>
            </div>
          )}

          <SubmissionPerformance
            submission={submission}
            campaign={campaign}
            canManage={role === "BRAND"}
            onUpdated={async () => {
              const [current, budget] = await Promise.all([
                getSubmissionById(submissionId),
                getCampaignById(campaign._id),
              ]);
              setSubmission({
                ...current.data.submission,
                campaignId: budget.data.campaign,
              });
            }}
          />
          {/* Submission data */}

          <div className="rounded-2xl border border-card-border bg-card-background p-6">
            <h2 className="text-lg font-semibold text-text-primary">
              Content Submission
            </h2>

            {canResubmit ? (
              <form onSubmit={handleResubmit} className="mt-6 space-y-6">
                <div>
                  <label
                    htmlFor="contentUrl"
                    className="text-sm font-medium text-text-primary"
                  >
                    Content URL
                  </label>

                  <input
                    disabled={isSubmitting}
                    id="contentUrl"
                    type="url"
                    required
                    value={contentUrl}
                    onChange={(event) => setContentUrl(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-card-border bg-transparent px-4 text-sm text-text-primary outline-none transition focus:border-brand-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="caption"
                    className="text-sm font-medium text-text-primary"
                  >
                    Caption
                  </label>

                  <textarea
                    disabled={isSubmitting}
                    id="caption"
                    rows={7}
                    maxLength={2000}
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    className="mt-2 w-full resize-none rounded-xl border border-card-border bg-transparent px-4 py-3 text-sm leading-6 text-text-primary outline-none transition focus:border-brand-500"
                  />
                </div>

                <div className="flex justify-end border-t border-card-border pt-5">
                  <button
                    type="submit"
                    aria-busy={isSubmitting}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? <InlineSpinner /> : <Send size={16} />}

                    {isSubmitting ? "Resubmitting..." : "Resubmit for Review"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-xs font-medium text-text-tertiary">
                    Content URL
                  </p>

                  <a
                    href={safeContentUrl(submission.contentUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 break-all text-sm font-medium text-brand-500 hover:text-brand-600"
                  >
                    {submission.contentUrl}

                    <ExternalLink size={14} />
                  </a>
                </div>

                <div>
                  <p className="text-xs font-medium text-text-tertiary">
                    Caption
                  </p>

                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-text-secondary">
                    {submission.caption || "No caption provided."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}

        <div>
          <div className="sticky top-24 rounded-2xl border border-card-border bg-card-background p-5">
            <h2 className="text-base font-semibold text-text-primary">
              Campaign Details
            </h2>

            <div className="mt-6 space-y-5">
              <Detail
                icon={IndianRupee}
                label="Reward rate"
                value={`${formatCurrency(campaign?.rewardRatePerThousandViews)} / 1K views`}
              />

              <Detail
                icon={CalendarDays}
                label="Deadline"
                value={formatDate(campaign?.deadline)}
              />

              <Detail label="Platform" value={formatText(campaign?.platform)} />

              <Detail
                label="Content Type"
                value={formatText(campaign?.contentType)}
              />

              <Detail
                label="Submitted"
                value={formatDateTime(submission.submittedAt)}
              />

              {submission.reviewedAt && (
                <Detail
                  label="Reviewed"
                  value={formatDateTime(submission.reviewedAt)}
                />
              )}
            </div>

            {campaign?._id && (
              <Link
                href={`/dashboard/campaigns/${campaign._id}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600"
              >
                View campaign
                <ExternalLink size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background-gray-primary text-text-tertiary">
          <Icon size={16} />
        </div>
      )}

      <div>
        <p className="text-xs text-text-tertiary">{label}</p>

        <p className="mt-1 text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function SubmissionDetailsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading submission details"
      className="mx-auto max-w-6xl px-2 py-6 lg:px-6"
    >
      <span className="sr-only">Loading submission details...</span>
      <div className="mb-6 h-5 w-40 animate-pulse rounded bg-background-gray-secondary" />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <div className="h-32 animate-pulse rounded-2xl border border-card-border bg-card-background" />

          <div className="h-96 animate-pulse rounded-2xl border border-card-border bg-card-background" />
        </div>

        <div className="h-96 animate-pulse rounded-2xl border border-card-border bg-card-background" />
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

function formatDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatText(value) {
  if (!value) return "-";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeContentUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
