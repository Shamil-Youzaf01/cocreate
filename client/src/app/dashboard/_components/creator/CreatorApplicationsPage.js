"use client";
import { PageSkeleton as SharedPageSkeleton } from "@/components/loading-state";
import { reportLoadError } from "@/lib/toast-feedback";

import StatIcon from "@/app/dashboard/_components/shared/StatIcon";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  XCircle,
} from "lucide-react";

import { getMyApplications } from "@/services/application.service";

import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";

import StatusBadge from "../shared/StatusBadge";
import EmptyState from "../shared/EmptyState";

export default function CreatorApplicationsPage() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [applications, setApplications] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const retryLoad = () => {
    setError("");
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await getMyApplications({ signal: controller.signal });
        if (controller.signal.aborted) return;

        setApplications(
          response.data?.applications ||
            response.applications ||
            response.data ||
            [],
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Applications fetch failed:", error);

        setError(
          reportLoadError(
            error,
            error.response?.data?.message || "Unable to load applications.",
            "_components-creator-CreatorApplicationsPage-load-error-1",
          ),
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchApplications();
    return () => controller.abort();
  }, [loadAttempt]);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const campaign = application.campaignId;

      const matchesSearch =
        !search ||
        campaign?.title?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status === "ALL" || application.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, status]);

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

  return (
    <div className="space-y-5 px-2 py-6 lg:px-6">
      {/* Header */}

      <div>
        <h1 className="text-[32px] font-medium tracking-tight text-text-primary">
          My Applications
        </h1>

        <p className="mt-2 text-base text-text-tertiary">
          Track your campaign pitches and application status.
        </p>
      </div>

      {/* Summary cards */}

      <ApplicationSummary applications={applications} />

      {/* Applications table */}

      <Card>
        <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle>Pitch Applications</CardTitle>

            <p className="mt-1 text-sm text-text-tertiary">
              Review all campaigns you have applied to.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search */}

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search campaigns..."
                className="h-10 w-full rounded-xl border border-card-border bg-transparent pl-9 pr-4 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-brand-500 sm:w-56"
              />
            </div>

            {/* Status filter */}

            <div className="relative">
              <SlidersHorizontal
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              />

              <select
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
                ? "Apply to campaigns and your pitches will appear here."
                : "Try changing your search or status filter."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <TableRoot className="w-full min-w-[950px] border-none">
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>

                  <TableHead>Applied</TableHead>

                  <TableHead>Reward rate</TableHead>

                  <TableHead>Deadline</TableHead>

                  <TableHead>Status</TableHead>

                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredApplications.map((application) => {
                  const campaign = application.campaignId;

                  return (
                    <TableRow
                      key={application._id}
                      className="transition hover:bg-background-gray-primary"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-text-primary">
                            {campaign?.title || "Campaign unavailable"}
                          </p>

                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-text-tertiary">
                            {campaign?.platform && (
                              <span>{formatText(campaign.platform)}</span>
                            )}

                            {campaign?.platform && campaign?.contentType && (
                              <span>•</span>
                            )}

                            {campaign?.contentType && (
                              <span>{formatText(campaign.contentType)}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {formatDate(application.createdAt)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap font-medium text-text-primary">
                        {formatCurrency(campaign?.rewardRatePerThousandViews)} /
                        1K views
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {formatDate(campaign?.deadline)}
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={application.status} />
                      </TableCell>

                      <TableCell className="text-right">
                        {campaign?._id ? (
                          <Link
                            href={`/dashboard/campaigns/${campaign._id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600"
                          >
                            View
                            <ArrowRight size={14} />
                          </Link>
                        ) : (
                          <span className="text-xs text-text-tertiary">
                            Unavailable
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </TableRoot>
          </div>
        )}
      </Card>
    </div>
  );
}

function ApplicationSummary({ applications }) {
  const total = applications.length;

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
      label: "Total Applications",
      icon: ClipboardList,
      tone: "blue",
      value: total,
    },
    {
      label: "Pending",
      icon: Clock3,
      tone: "orange",
      value: pending,
    },
    {
      label: "Accepted",
      icon: CheckCircle2,
      tone: "green",
      value: accepted,
    },
    {
      label: "Rejected",
      icon: XCircle,
      tone: "red",
      value: rejected,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-card-border bg-card-background p-5"
        >
          <StatIcon icon={item.icon} tone={item.tone} />
          <p className="mt-6 text-2xl font-semibold text-text-primary">
            {item.value}
          </p>

          <p className="mt-2 text-sm text-text-tertiary">{item.label}</p>
        </div>
      ))}
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
  if (!value) return "-";

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
