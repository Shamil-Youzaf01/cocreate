"use client";
import { useConfirm } from "@/components/confirm-dialog";
import { reportLoadError } from "@/lib/toast-feedback";

import { useEffect, useRef, useMemo, useState } from "react";

import { useParams } from "next/navigation";

import Link from "next/link";
import useAuthStore from "@/store/authStore";

import {
  ArrowLeft,
  Check,
  Clock3,
  Mail,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  getCampaignApplications,
  reviewApplication,
} from "@/services/application.service";

import { getCampaignById } from "@/services/campaign.service";

import StatusBadge from "@/app/dashboard/_components/shared/StatusBadge";
import EmptyState from "@/app/dashboard/_components/shared/EmptyState";
import { InlineSpinner, PageSkeleton } from "@/components/loading-state";

export default function CampaignApplicationsPage() {
  const params = useParams();

  const campaignId = params.campaignId;

  const role = useAuthStore((state) => state.user?.role);
  if (!role) return <PageSkeleton label="Loading applications..." />;
  if (role !== "BRAND")
    return <p className="p-6">Application review is available to Brands.</p>;
  return <CampaignApplicants key={campaignId} campaignId={campaignId} />;
}

function CampaignApplicants({ campaignId }) {
  const confirm = useConfirm();
  const reviewLock = useRef(false);
  const [campaign, setCampaign] = useState(null);

  const [applications, setApplications] = useState([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("ALL");

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [actionId, setActionId] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getCampaignById(campaignId, { signal: controller.signal }),
      getCampaignApplications(campaignId, { signal: controller.signal }),
    ])
      .then(([campaignResponse, applicationResponse]) => {
        if (controller.signal.aborted) return;
        setCampaign(campaignResponse.data?.campaign || null);
        setApplications(applicationResponse.data?.applications || []);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            reportLoadError(
              error,
              error.response?.data?.message || "Unable to load applications.",
              "campaigns-[campaignId]-applications-page-load-error-1",
            ),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [campaignId]);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const creator = application.creatorId;

      const matchesSearch =
        !search ||
        creator?.name?.toLowerCase().includes(search.toLowerCase()) ||
        creator?.email?.toLowerCase().includes(search.toLowerCase()) ||
        application.message?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status === "ALL" || application.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, status]);

  const handleReview = async (applicationId, nextStatus) => {
    if (
      reviewLock.current ||
      !applications.some(
        (item) => item._id === applicationId && item.status === "PENDING",
      )
    )
      return;
    reviewLock.current = true;
    setActionId(applicationId);
    setActionStatus(nextStatus);
    try {
      const confirmed = await confirm({
        title:
          nextStatus === "ACCEPTED" ? "Accept creator?" : "Reject application?",
        confirmLabel:
          nextStatus === "ACCEPTED" ? "Accept creator" : "Reject application",
        variant: nextStatus === "ACCEPTED" ? "default" : "danger",
        description:
          nextStatus === "ACCEPTED"
            ? "Accept this creator for the campaign?"
            : "Reject this application?",
      });

      if (!confirmed) return;

      const response = await reviewApplication(applicationId, nextStatus);

      toast.success(
        nextStatus === "ACCEPTED"
          ? "Creator accepted."
          : "Application rejected.",
      );

      const updated = response.data?.application;
      if (updated)
        setApplications((current) =>
          current.map((application) =>
            application._id === applicationId
              ? { ...application, ...updated, creatorId: application.creatorId }
              : application,
          ),
        );
    } catch (error) {
      console.error("Application review failed:", error);

      toast.error(
        error.response?.data?.message || "Unable to review application.",
      );
    } finally {
      reviewLock.current = false;
      setActionId(null);
      setActionStatus(null);
    }
  };

  if (isLoading) {
    return <ApplicationsSkeleton />;
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
        href="/dashboard/campaigns"
        className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-brand-500"
      >
        <ArrowLeft size={16} />
        Back to campaigns
      </Link>

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
            Campaign Applications
          </p>

          <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-text-primary">
            {campaign?.title || "Campaign"}
          </h1>

          <p className="mt-2 text-sm text-text-tertiary">
            Review creator pitches and select creators for this campaign.
          </p>
        </div>

        <StatusBadge status={campaign?.status} />
      </div>

      <ApplicationStats applications={applications} />

      <div className="flex flex-col gap-3 rounded-2xl border border-card-border bg-card-background p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />

          <input
            aria-label="Search creators or pitches"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search creators or pitches..."
            className="h-11 w-full rounded-xl border border-card-border bg-transparent pl-10 pr-4 text-sm text-text-primary outline-none focus:border-brand-500"
          />
        </div>

        <select
          aria-label="Application status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-11 rounded-xl border border-card-border bg-card-background px-4 text-sm text-text-primary outline-none focus:border-brand-500"
        >
          <option value="ALL">All applications</option>

          <option value="PENDING">Pending</option>

          <option value="ACCEPTED">Accepted</option>

          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="rounded-2xl border border-card-border bg-card-background">
          <EmptyState
            title={
              applications.length === 0
                ? "No applications yet"
                : "No matching applications"
            }
            description={
              applications.length === 0
                ? "Creator applications will appear here once people apply."
                : "Try changing your search or filter."
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <ApplicantCard
              key={application._id}
              application={application}
              isProcessing={actionId !== null}
              busyStatus={actionId === application._id ? actionStatus : null}
              onReview={handleReview}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationStats({ applications }) {
  const pending = applications.filter(
    (item) => item.status === "PENDING",
  ).length;

  const accepted = applications.filter(
    (item) => item.status === "ACCEPTED",
  ).length;

  const rejected = applications.filter(
    (item) => item.status === "REJECTED",
  ).length;

  const stats = [
    {
      label: "Total Applicants",
      value: applications.length,
      icon: Users,
    },
    {
      label: "Pending",
      value: pending,
      icon: Clock3,
    },
    {
      label: "Accepted",
      value: accepted,
      icon: Check,
    },
    {
      label: "Rejected",
      value: rejected,
      icon: X,
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

function ApplicantCard({ application, isProcessing, busyStatus, onReview }) {
  const creator = application.creatorId;

  return (
    <div className="rounded-2xl border border-card-border bg-card-background p-6">
      {busyStatus && (
        <p role="status" className="sr-only">
          Updating application...
        </p>
      )}
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
              <UserRound size={19} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-text-primary">
                  {creator?.name || "Creator"}
                </h2>

                <StatusBadge status={application.status} />
              </div>

              {creator?.email && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-text-tertiary">
                  <Mail size={13} />

                  {creator.email}
                </p>
              )}

              <p className="mt-1 text-xs text-text-tertiary">
                Applied {formatDate(application.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-background-gray-primary p-4">
            <p className="text-xs font-medium text-text-tertiary">
              Creator Pitch
            </p>

            <p className="mt-2 break-words whitespace-pre-line text-sm leading-6 text-text-secondary">
              {application.message || "No pitch message provided."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {application.status === "PENDING" ? (
            <>
              <button
                type="button"
                aria-busy={busyStatus === "REJECTED"}
                disabled={isProcessing}
                onClick={() => onReview(application._id, "REJECTED")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
              >
                {busyStatus === "REJECTED" ? (
                  <InlineSpinner />
                ) : (
                  <X size={15} />
                )}

                {busyStatus === "REJECTED" ? "Rejecting..." : "Reject"}
              </button>

              <button
                type="button"
                aria-busy={busyStatus === "ACCEPTED"}
                disabled={isProcessing}
                onClick={() => onReview(application._id, "ACCEPTED")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                {busyStatus === "ACCEPTED" ? (
                  <InlineSpinner />
                ) : (
                  <Check size={15} />
                )}

                {busyStatus === "ACCEPTED" ? "Accepting..." : "Accept"}
              </button>
            </>
          ) : (
            <span className="text-xs text-text-tertiary">
              Reviewed {formatDate(application.reviewedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ApplicationsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading campaign applications"
      className="space-y-6 px-2 py-6 lg:px-6"
    >
      <span className="sr-only">Loading campaign applications...</span>
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
        length: 4,
      }).map((_, index) => (
        <div
          key={index}
          className="h-48 animate-pulse rounded-2xl border border-card-border bg-card-background"
        />
      ))}
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
