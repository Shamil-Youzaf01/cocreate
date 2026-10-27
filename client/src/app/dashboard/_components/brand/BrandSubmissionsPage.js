"use client";
import { PageSkeleton as SharedPageSkeleton } from "@/components/loading-state";
import { reportLoadError } from "@/lib/toast-feedback";

import {
  ListPanel,
  ListTable,
} from "@/app/dashboard/_components/shared/ListView";
import { TableRow, TableCell } from "@/components/tailgrids/core/table";

import StatIcon from "../shared/StatIcon";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";

import { getBrandSubmissions } from "@/services/submission.service";

import StatusBadge from "../shared/StatusBadge";
import EmptyState from "../shared/EmptyState";

export default function BrandSubmissionsPage() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [data, setData] = useState(null);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("ALL");

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const retryLoad = () => {
    setError("");
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await getBrandSubmissions({
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        setData(response.data || null);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Brand submissions failed:", error);

        setError(
          reportLoadError(
            error,
            error.response?.data?.message || "Unable to load submissions.",
            "_components-brand-BrandSubmissionsPage-load-error-1",
          ),
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchSubmissions();
    return () => controller.abort();
  }, [loadAttempt]);

  const submissions = useMemo(() => data?.submissions || [], [data]);

  const filtered = useMemo(() => {
    return submissions.filter((submission) => {
      const creator = submission.creatorId;

      const campaign = submission.campaignId;

      const query = search.toLowerCase();

      const matchesSearch =
        !search ||
        creator?.name?.toLowerCase().includes(query) ||
        campaign?.title?.toLowerCase().includes(query);

      const matchesStatus = status === "ALL" || submission.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [submissions, search, status]);

  if (isLoading) {
    return <SharedPageSkeleton label="Loading submissions…" variant="list" />;
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

  const summary = data?.summary || {};

  return (
    <div className="space-y-5 px-2 py-6 lg:px-6">
      <div>
        <h1 className="text-[32px] font-medium tracking-tight text-text-primary">
          Submissions
        </h1>

        <p className="mt-2 text-base text-text-tertiary">
          Review creator deliverables across all campaigns.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat
          label="Awaiting Review"
          tone="orange"
          value={summary.awaitingReview ?? 0}
          icon={Clock3}
        />

        <Stat
          label="Needs Revision"
          tone="purple"
          value={summary.revisionRequested ?? 0}
          icon={RotateCcw}
        />

        <Stat
          label="Approved"
          tone="green"
          value={summary.approved ?? 0}
          icon={CheckCircle2}
        />

        <Stat
          label="Rejected"
          tone="red"
          value={summary.rejected ?? 0}
          icon={XCircle}
        />
      </div>

      <ListPanel
        title="Submissions"
        description="Review creator deliverables across your campaigns."
        filters={
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative sm:w-56">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              />

              <input
                aria-label="Search creator or campaign"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search creator or campaign..."
                className="h-10 w-full rounded-xl border border-card-border bg-transparent pl-9 pr-4 text-sm text-text-primary outline-none focus:border-brand-500"
              />
            </div>

            <select
              aria-label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-xl border border-card-border bg-card-background px-4 text-sm text-text-primary outline-none focus:border-brand-500"
            >
              <option value="ALL">All statuses</option>

              <option value="SUBMITTED">Awaiting Review</option>

              <option value="REVISION_REQUESTED">Revision Requested</option>

              <option value="APPROVED">Approved</option>

              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <div className="">
            <EmptyState
              title="No matching submissions"
              description="Creator deliverables will appear here."
            />
          </div>
        ) : (
          <ListTable
            columns={["Creator", "Campaign", "Submitted", "Status", "Action"]}
          >
            {filtered.map((submission) => (
              <SubmissionRow key={submission._id} submission={submission} />
            ))}
          </ListTable>
        )}
      </ListPanel>
    </div>
  );
}

function SubmissionRow({ submission }) {
  const creator = submission.creatorId;
  const campaign = submission.campaignId;
  return (
    <TableRow className="transition hover:bg-background-gray-primary">
      <TableCell>
        <p className="font-medium text-text-primary">
          {creator?.name || "Creator"}
        </p>
      </TableCell>
      <TableCell>{campaign?.title || "Campaign unavailable"}</TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDate(submission.submittedAt)}
      </TableCell>
      <TableCell>
        <StatusBadge status={submission.status} />
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-3">
          {" "}
          {safeUrl(submission.contentUrl) && (
            <a
              href={safeUrl(submission.contentUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-brand-500"
            >
              Open Content
              <ExternalLink size={14} />
            </a>
          )}
          {campaign?._id && (
            <Link
              href={`/dashboard/submissions/campaign/${campaign._id}`}
              className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              {submission.status === "SUBMITTED" ? "Review" : "View"}
            </Link>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function Stat({ label, value, tone, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-card-border bg-card-background p-5">
      <StatIcon icon={Icon} tone={tone} />

      <p className="mt-6 text-2xl font-semibold text-text-primary">{value}</p>

      <p className="mt-1 text-sm text-text-tertiary">{label}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
