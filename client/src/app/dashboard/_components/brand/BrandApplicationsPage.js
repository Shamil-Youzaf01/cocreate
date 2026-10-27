"use client";
import {
  PageSkeleton as SharedPageSkeleton,
  InlineSpinner,
} from "@/components/loading-state";
import { useConfirm } from "@/components/confirm-dialog";
import { reportLoadError } from "@/lib/toast-feedback";

import StatIcon from "../shared/StatIcon";

import { useEffect, useRef, useMemo, useState } from "react";

import Link from "next/link";

import {
  Search,
  SlidersHorizontal,
  ClipboardList,
  Clock3,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";

import toast from "react-hot-toast";

import {
  getBrandApplications,
  reviewApplication,
} from "@/services/application.service";

import StatusBadge from "../shared/StatusBadge";
import EmptyState from "../shared/EmptyState";

export default function BrandApplicationsPage() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const confirm = useConfirm();
  const [data, setData] = useState(null);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("ALL");

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [actionId, setActionId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const reviewLock = useRef(false);
  const retryLoad = () => {
    setError("");
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    getBrandApplications({ signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setData(response.data);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            reportLoadError(
              error,
              error.response?.data?.message || "Unable to load applications.",
              "_components-brand-BrandApplicationsPage-load-error-1",
            ),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [loadAttempt]);

  const applications = useMemo(() => data?.applications || [], [data]);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const creator = application.creatorId;

      const campaign = application.campaignId;

      const query = search.toLowerCase();

      const matchesSearch =
        !search ||
        creator?.name?.toLowerCase().includes(query) ||
        creator?.email?.toLowerCase().includes(query) ||
        campaign?.title?.toLowerCase().includes(query);

      const matchesStatus = status === "ALL" || application.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, status]);

  const handleReview = async (applicationId, nextStatus) => {
    if (reviewLock.current) return;
    const confirmed = await confirm({
      title:
        nextStatus === "ACCEPTED" ? "Accept creator?" : "Reject application?",
      confirmLabel:
        nextStatus === "ACCEPTED" ? "Accept creator" : "Reject application",
      variant: nextStatus === "ACCEPTED" ? "default" : "danger",
      description:
        nextStatus === "ACCEPTED"
          ? "Accept this creator?"
          : "Reject this application?",
    });

    if (!confirmed) return;

    try {
      reviewLock.current = true;
      setPendingAction(nextStatus);
      setActionId(applicationId);

      const response = await reviewApplication(applicationId, nextStatus);

      toast.success(
        nextStatus === "ACCEPTED"
          ? "Creator accepted."
          : "Application rejected.",
      );

      const updated = response.data?.application;
      if (updated)
        setData((current) => {
          const applications = current.applications.map((item) =>
            item._id === applicationId
              ? {
                  ...item,
                  ...updated,
                  creatorId: item.creatorId,
                  campaignId: item.campaignId,
                }
              : item,
          );
          return {
            applications,
            summary: {
              total: applications.length,
              pending: applications.filter((item) => item.status === "PENDING")
                .length,
              accepted: applications.filter(
                (item) => item.status === "ACCEPTED",
              ).length,
              rejected: applications.filter(
                (item) => item.status === "REJECTED",
              ).length,
            },
          };
        });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to review application.",
      );
    } finally {
      reviewLock.current = false;
      setPendingAction(null);
      setActionId(null);
    }
  };

  if (isLoading) {
    return <SharedPageSkeleton label="Loading applications…" variant="list" />;
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
          Applications
        </h1>

        <p className="mt-2 text-base text-text-tertiary">
          Review creator applications across all your campaigns.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat
          label="Total Applications"
          tone="blue"
          icon={ClipboardList}
          value={summary.total ?? 0}
        />

        <Stat
          label="Pending"
          tone="orange"
          icon={Clock3}
          value={summary.pending ?? 0}
        />

        <Stat
          label="Accepted"
          tone="green"
          icon={CheckCircle2}
          value={summary.accepted ?? 0}
        />

        <Stat
          label="Rejected"
          tone="red"
          icon={XCircle}
          value={summary.rejected ?? 0}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle>Pitch Applications</CardTitle>
            <p className="mt-1 text-sm text-text-tertiary">
              Review creator applications across your campaigns.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              />
              <input
                aria-label="Search creator or campaign"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search creator or campaign..."
                className="h-10 w-full rounded-xl border border-card-border bg-transparent pl-9 pr-4 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-brand-500 sm:w-56"
              />
            </div>
            <div className="relative">
              <SlidersHorizontal
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              />
              <select
                aria-label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 rounded-xl border border-card-border bg-card-background pl-9 pr-8 text-sm text-text-primary outline-none focus:border-brand-500"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </CardHeader>
        {filteredApplications.length === 0 ? (
          <EmptyState
            title={
              applications.length === 0
                ? "No applications yet"
                : "No matching applications"
            }
            description={
              applications.length === 0
                ? "Creator pitches across your campaigns will appear here."
                : "Try changing your search or status filter."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <TableRoot className="w-full min-w-[950px] border-none">
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Pitch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <ApplicationRow
                    key={application._id}
                    application={application}
                    onReview={handleReview}
                    isProcessing={actionId !== null}
                    pendingAction={
                      actionId === application._id ? pendingAction : null
                    }
                  />
                ))}
              </TableBody>
            </TableRoot>
          </div>
        )}
      </Card>
    </div>
  );
}

function ApplicationRow({
  application,
  onReview,
  isProcessing,
  pendingAction,
}) {
  const creator = application.creatorId;
  const campaign = application.campaignId;

  return (
    <TableRow className="transition hover:bg-background-gray-primary">
      <TableCell>
        <p className="font-medium text-text-primary">
          {creator?.name || "Creator"}
        </p>
        <p className="mt-1 text-xs text-text-tertiary">
          {creator?.email || "-"}
        </p>
      </TableCell>
      <TableCell>
        {campaign?._id ? (
          <Link
            href={`/dashboard/campaigns/${campaign._id}`}
            className="font-medium text-text-primary hover:text-brand-500"
          >
            {campaign.title}
          </Link>
        ) : (
          "Campaign unavailable"
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDate(application.createdAt)}
      </TableCell>
      <TableCell>
        <details className="max-w-xs">
          <summary className="cursor-pointer text-sm font-medium text-brand-500 hover:text-brand-600">
            View pitch
          </summary>
          <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-text-secondary">
            {application.message || "No pitch provided."}
          </p>
        </details>
      </TableCell>
      <TableCell>
        <StatusBadge status={application.status} />
      </TableCell>
      <TableCell className="text-right">
        {application.status === "PENDING" ? (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onReview(application._id, "REJECTED")}
              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
              aria-busy={pendingAction === "REJECTED"}
            >
              {pendingAction === "REJECTED" ? (
                <>
                  <InlineSpinner /> Rejecting…
                </>
              ) : (
                <>Reject</>
              )}
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onReview(application._id, "ACCEPTED")}
              className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              aria-busy={pendingAction === "ACCEPTED"}
            >
              {pendingAction === "ACCEPTED" ? (
                <>
                  <InlineSpinner /> Accepting…
                </>
              ) : (
                <>Accept</>
              )}
            </button>
          </div>
        ) : (
          <span className="whitespace-nowrap text-xs text-text-tertiary">
            Reviewed {formatDate(application.reviewedAt)}
          </span>
        )}
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
