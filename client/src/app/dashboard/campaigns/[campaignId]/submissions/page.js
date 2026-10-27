"use client";
import { useConfirm } from "@/components/confirm-dialog";
import { reportLoadError } from "@/lib/toast-feedback";

import { useEffect, useRef, useMemo, useState } from "react";

import { useParams, usePathname } from "next/navigation";

import Link from "next/link";
import useAuthStore from "@/store/authStore";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  getCampaignSubmissions,
  reviewSubmission,
} from "@/services/submission.service";

import { getCampaignById } from "@/services/campaign.service";

import StatusBadge from "@/app/dashboard/_components/shared/StatusBadge";
import SubmissionPerformance from "@/app/dashboard/_components/shared/SubmissionPerformance";
import CampaignRewardSummary from "@/app/dashboard/_components/shared/CampaignRewardSummary";
import EmptyState from "@/app/dashboard/_components/shared/EmptyState";
import { InlineSpinner, PageSkeleton } from "@/components/loading-state";

export default function CampaignSubmissionsPage() {
  const params = useParams();
  const pathname = usePathname();
  const fromSubmissions = pathname.startsWith("/dashboard/submissions/");

  const campaignId = params.campaignId;

  const role = useAuthStore((state) => state.user?.role);
  if (!role) return <PageSkeleton label="Loading campaign submissions..." />;
  if (role !== "BRAND")
    return <p className="p-6">Submission review is available to Brands.</p>;
  return (
    <CampaignSubmissions
      key={campaignId}
      campaignId={campaignId}
      fromSubmissions={fromSubmissions}
    />
  );
}

function CampaignSubmissions({ campaignId, fromSubmissions }) {
  const confirm = useConfirm();
  const reviewLock = useRef(false);
  const rewardLock = useRef(false);
  const [rewardBusyId, setRewardBusyId] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);
  const [campaign, setCampaign] = useState(null);

  const [submissions, setSubmissions] = useState([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("ALL");

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [actionId, setActionId] = useState(null);

  const [feedbackById, setFeedbackById] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getCampaignById(campaignId, { signal: controller.signal }),
      getCampaignSubmissions(campaignId, { signal: controller.signal }),
    ])
      .then(([campaignResponse, submissionResponse]) => {
        if (controller.signal.aborted) return;
        setCampaign(campaignResponse.data?.campaign || null);
        setSubmissions(submissionResponse.data?.submissions || []);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            reportLoadError(
              error,
              error.response?.data?.message || "Unable to load submissions.",
              "campaigns-[campaignId]-submissions-page-load-error-1",
            ),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [campaignId]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const creator = submission.creatorId;

      const matchesSearch =
        !search ||
        creator?.name?.toLowerCase().includes(search.toLowerCase()) ||
        creator?.email?.toLowerCase().includes(search.toLowerCase()) ||
        submission.caption?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status === "ALL" || submission.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [submissions, search, status]);

  const refreshRewardState = async (data) => {
    if (data?.submission)
      setSubmissions((current) =>
        current.map((item) =>
          item._id === data.submission._id
            ? { ...item, ...data.submission, creatorId: item.creatorId }
            : item,
        ),
      );
    const [campaignResponse, submissionResponse] = await Promise.all([
      getCampaignById(campaignId),
      getCampaignSubmissions(campaignId),
    ]);
    setCampaign(campaignResponse.data.campaign);
    setSubmissions(submissionResponse.data.submissions);
  };

  const handleReview = async (submission, nextStatus) => {
    if (
      reviewLock.current ||
      rewardLock.current ||
      submission.status !== "SUBMITTED"
    )
      return;
    const feedback = feedbackById[submission._id]?.trim() || "";

    if (nextStatus === "REVISION_REQUESTED" && !feedback) {
      toast.error("Add feedback before requesting a revision.");

      return;
    }

    if (nextStatus === "REJECTED" && !feedback) {
      toast.error("Add a reason before rejecting the submission.");

      return;
    }

    reviewLock.current = true;
    setActionId(submission._id);
    setActionStatus(nextStatus);
    try {
      const confirmed = await confirm({
        title:
          nextStatus === "APPROVED"
            ? "Approve content?"
            : nextStatus === "REVISION_REQUESTED"
              ? "Request a revision?"
              : "Reject submission?",
        confirmLabel:
          nextStatus === "APPROVED"
            ? "Approve content"
            : nextStatus === "REVISION_REQUESTED"
              ? "Request revision"
              : "Reject submission",
        variant: nextStatus === "REJECTED" ? "danger" : "default",
        description:
          nextStatus === "APPROVED"
            ? "Approve this content? Views verification and reward credit are separate steps."
            : nextStatus === "REVISION_REQUESTED"
              ? "Request a revision from this creator?"
              : "Reject this submission?",
      });

      if (!confirmed) return;

      const response = await reviewSubmission(submission._id, {
        decision: nextStatus,

        feedback: feedback || undefined,
      });

      if (nextStatus === "APPROVED") {
        toast.success(
          "Content approved. Verify views to calculate the reward.",
        );
      } else if (nextStatus === "REVISION_REQUESTED") {
        toast.success("Revision requested.");
      } else {
        toast.success("Submission rejected.");
      }

      setFeedbackById((current) => ({
        ...current,
        [submission._id]: "",
      }));

      const updated = response.data?.submission;
      if (updated)
        setSubmissions((current) =>
          current.map((item) =>
            item._id === submission._id
              ? { ...item, ...updated, creatorId: item.creatorId }
              : item,
          ),
        );
    } catch (error) {
      console.error("Submission review failed:", error);

      toast.error(
        error.response?.data?.message || "Unable to review submission.",
      );
    } finally {
      reviewLock.current = false;
      setActionId(null);
      setActionStatus(null);
    }
  };

  if (isLoading) {
    return <SubmissionSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 py-6 lg:px-6">
      <Link
        href={
          fromSubmissions ? "/dashboard/submissions" : "/dashboard/campaigns"
        }
        className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-brand-500"
      >
        <ArrowLeft size={16} />

        {fromSubmissions ? "Back to submissions" : "Back to campaigns"}
      </Link>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
          Campaign Submissions
        </p>

        <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-text-primary">
          {campaign?.title || "Campaign"}
        </h1>

        <p className="mt-2 text-sm text-text-tertiary">
          Review creator deliverables, request changes or approve completed
          work.
        </p>
      </div>

      <div className="rounded-2xl border border-card-border bg-card-background p-5">
        <CampaignRewardSummary campaign={campaign} variant="brand-card" />
      </div>
      <SubmissionStats submissions={submissions} />

      <div className="flex flex-col gap-3 rounded-2xl border border-card-border bg-card-background p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />

          <input
            aria-label="Search creators or captions"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search creators..."
            className="h-11 w-full rounded-xl border border-card-border bg-transparent pl-10 pr-4 text-sm text-text-primary outline-none focus:border-brand-500"
          />
        </div>

        <select
          aria-label="Submission status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-11 rounded-xl border border-card-border bg-card-background px-4 text-sm text-text-primary outline-none focus:border-brand-500"
        >
          <option value="ALL">All submissions</option>

          <option value="SUBMITTED">Submitted</option>

          <option value="REVISION_REQUESTED">Revision Requested</option>

          <option value="APPROVED">Approved</option>

          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="rounded-2xl border border-card-border bg-card-background">
          <EmptyState
            title={
              submissions.length === 0
                ? "No submissions yet"
                : "No matching submissions"
            }
            description={
              submissions.length === 0
                ? "Creator deliverables will appear here once submitted."
                : "Try changing your search or filter."
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission._id}
              campaign={campaign}
              onRewardUpdated={refreshRewardState}
              onRewardBusyChange={(busy) => {
                rewardLock.current = busy;
                setRewardBusyId(busy ? submission._id : null);
              }}
              busyStatus={actionId === submission._id ? actionStatus : null}
              submission={submission}
              feedback={feedbackById[submission._id] || ""}
              setFeedback={(value) =>
                setFeedbackById((current) => ({
                  ...current,
                  [submission._id]: value,
                }))
              }
              onReview={handleReview}
              isProcessing={actionId !== null || rewardBusyId !== null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionStats({ submissions }) {
  const submitted = submissions.filter(
    (item) => item.status === "SUBMITTED",
  ).length;

  const revision = submissions.filter(
    (item) => item.status === "REVISION_REQUESTED",
  ).length;

  const approved = submissions.filter(
    (item) => item.status === "APPROVED",
  ).length;

  const rejected = submissions.filter(
    (item) => item.status === "REJECTED",
  ).length;

  const stats = [
    {
      label: "Awaiting Review",
      value: submitted,
      icon: Clock3,
    },
    {
      label: "Revision Requested",
      value: revision,
      icon: RotateCcw,
    },
    {
      label: "Approved",
      value: approved,
      icon: CheckCircle2,
    },
    {
      label: "Rejected",
      value: rejected,
      icon: XCircle,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="rounded-2xl border border-card-border bg-card-background p-5"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-background-gray-primary text-text-tertiary">
              <Icon size={17} />
            </div>

            <p className="mt-5 text-2xl font-semibold text-text-primary">
              {item.value}
            </p>

            <p className="mt-1 text-sm text-text-tertiary">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function SubmissionCard({
  campaign,
  onRewardUpdated,
  onRewardBusyChange,
  busyStatus,
  submission,
  feedback,
  setFeedback,
  onReview,
  isProcessing,
}) {
  const creator = submission.creatorId;

  const canReview = submission.status === "SUBMITTED";

  return (
    <article className="overflow-hidden rounded-2xl border border-card-border bg-card-background">
      {busyStatus && (
        <p role="status" className="sr-only">
          Updating submission review...
        </p>
      )}
      {/* Main card */}
      <div className="p-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-text-primary">
                {creator?.name || "Creator"}
              </h2>

              <StatusBadge status={submission.status} />
            </div>

            <p className="mt-1 text-xs text-text-tertiary">
              {creator?.email || "Creator submission"}
            </p>
          </div>

          <div className="shrink-0 text-left sm:text-right">
            <p className="text-[11px] text-text-tertiary">Submitted</p>

            <p className="mt-1 text-xs font-medium text-text-secondary">
              {formatDateTime(submission.submittedAt)}
            </p>
          </div>
        </div>

        {/* Submission information */}
        <div className="mt-5 grid gap-x-8 gap-y-4 border-t border-card-border pt-4 lg:grid-cols-[160px_1fr]">
          {/* Content */}
          <p className="text-xs font-medium text-text-tertiary">Content</p>

          <div>
            <a
              href={safeContentUrl(submission.contentUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 break-all text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              View submitted content
              <ExternalLink size={14} />
            </a>

            <p className="mt-1 break-all text-[11px] text-text-tertiary">
              {submission.contentUrl}
            </p>
          </div>

          {/* Caption */}
          <p className="text-xs font-medium text-text-tertiary">Caption</p>

          <p className="whitespace-pre-line text-sm leading-6 text-text-secondary">
            {submission.caption || "No caption provided."}
          </p>

          {/* Existing feedback */}
          {submission.feedback && !canReview && (
            <>
              <p className="text-xs font-medium text-text-tertiary">Feedback</p>

              <p className="text-sm leading-6 text-text-secondary">
                {submission.feedback}
              </p>
            </>
          )}
        </div>

        {/* Review controls */}
        {canReview && (
          <div className="mt-5 border-t border-card-border pt-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor={`feedback-${submission._id}`}
                  className="text-xs font-medium text-text-tertiary"
                >
                  Feedback
                </label>

                <textarea
                  id={`feedback-${submission._id}`}
                  rows={2}
                  maxLength={2000}
                  disabled={isProcessing}
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="Add feedback when requesting a revision or rejecting..."
                  className="mt-2 min-h-[72px] w-full resize-none rounded-xl border border-card-border bg-transparent px-3 py-2.5 text-sm leading-5 text-text-primary outline-none transition focus:border-brand-500"
                />
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  aria-busy={busyStatus === "REVISION_REQUESTED"}
                  disabled={isProcessing}
                  onClick={() => onReview(submission, "REVISION_REQUESTED")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-orange-200 px-3.5 py-2.5 text-sm font-medium text-orange-600 transition hover:bg-orange-50 disabled:opacity-50"
                >
                  {busyStatus === "REVISION_REQUESTED" ? (
                    <InlineSpinner />
                  ) : (
                    <RotateCcw size={14} />
                  )}
                  {busyStatus === "REVISION_REQUESTED"
                    ? "Requesting..."
                    : "Revision"}
                </button>

                <button
                  type="button"
                  aria-busy={busyStatus === "REJECTED"}
                  disabled={isProcessing}
                  onClick={() => onReview(submission, "REJECTED")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3.5 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {busyStatus === "REJECTED" ? (
                    <InlineSpinner />
                  ) : (
                    <XCircle size={14} />
                  )}
                  {busyStatus === "REJECTED" ? "Rejecting..." : "Reject"}
                </button>

                <button
                  type="button"
                  aria-busy={busyStatus === "APPROVED"}
                  disabled={isProcessing}
                  onClick={() => onReview(submission, "APPROVED")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
                >
                  {busyStatus === "APPROVED" ? (
                    <InlineSpinner />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}

                  {busyStatus === "APPROVED" ? "Approving..." : "Approve"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approved performance */}
      {submission.status === "APPROVED" && (
        <div className="border-t border-card-border px-5 pb-5">
          <SubmissionPerformance
            submission={submission}
            campaign={campaign}
            canManage
            disabled={isProcessing}
            onBusyChange={onRewardBusyChange}
            onUpdated={onRewardUpdated}
          />
        </div>
      )}
    </article>
  );
}

function SubmissionSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading campaign submissions"
      className="space-y-6 px-2 py-6 lg:px-6"
    >
      <span className="sr-only">Loading campaign submissions...</span>
      <div className="h-20 animate-pulse rounded-xl bg-background-gray-secondary" />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-card-border bg-card-background"
          />
        ))}
      </div>

      {Array.from({
        length: 3,
      }).map((_, index) => (
        <div
          key={index}
          className="h-72 animate-pulse rounded-2xl border border-card-border bg-card-background"
        />
      ))}
    </div>
  );
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

function safeContentUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
