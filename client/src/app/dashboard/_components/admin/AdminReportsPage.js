"use client";
import {
  PageSkeleton as SharedPageSkeleton,
  InlineSpinner,
} from "@/components/loading-state";
import { useConfirm } from "@/components/confirm-dialog";

import {
  ListPanel,
  ListTable,
  ExpandableListRow,
} from "@/app/dashboard/_components/shared/ListView";

import StatIcon from "@/app/dashboard/_components/shared/StatIcon";

import { useEffect, useRef, useMemo, useState } from "react";

import { CheckCircle2, Eye, Search, XCircle, Clock3, Flag } from "lucide-react";

import toast from "react-hot-toast";

import { getAdminReports, reviewReport } from "@/services/report.service";

import StatusBadge from "../shared/StatusBadge";
import EmptyState from "../shared/EmptyState";

export default function AdminReportsPage() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const confirm = useConfirm();
  const actionLock = useRef(false);
  const [reports, setReports] = useState([]);

  const [status, setStatus] = useState("ALL");

  const [search, setSearch] = useState("");

  const [notes, setNotes] = useState({});

  const [isLoading, setIsLoading] = useState(true);

  const [actionId, setActionId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const [error, setError] = useState("");

  const retryLoad = () => {
    setError("");
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await getAdminReports({ signal: controller.signal });
        if (!controller.signal.aborted)
          setReports(response.data?.reports || []);
      } catch (error) {
        if (!controller.signal.aborted) {
          const message =
            error.response?.data?.message || "Unable to load reports.";
          setError(message);
          toast.error(message, { id: "admin-reports-load-error" });
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [loadAttempt]);

  const filtered = useMemo(() => {
    return reports.filter((report) => {
      const query = search.toLowerCase();

      const matchesSearch =
        !search ||
        report.reason?.toLowerCase().includes(query) ||
        report.reporterId?.name?.toLowerCase().includes(query);

      const matchesStatus = status === "ALL" || report.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [reports, search, status]);

  const handleReview = async (report, nextStatus) => {
    if (actionLock.current) return;
    if (
      ["RESOLVED", "DISMISSED"].includes(nextStatus) &&
      !(await confirm({
        title:
          nextStatus === "RESOLVED"
            ? "Resolve this report?"
            : "Dismiss this report?",
        description:
          "This closes the report. You cannot reopen it through the current review workflow.",
        confirmLabel:
          nextStatus === "RESOLVED" ? "Resolve report" : "Dismiss report",
        variant: nextStatus === "RESOLVED" ? "default" : "danger",
        details: [
          { label: "Report", value: report.reason },
          {
            label: "Review note",
            value: notes[report._id]?.trim() || "No review note provided.",
          },
        ],
      }))
    )
      return;

    try {
      if (actionLock.current) return;
      actionLock.current = true;
      setPendingAction(nextStatus);
      setActionId(report._id);

      const response = await reviewReport(report._id, {
        status: nextStatus,

        adminNote: notes[report._id] || "",
      });

      toast.success("Report updated.");

      setReports((current) =>
        current.map((item) =>
          item._id === report._id
            ? { ...item, ...response.data.report, reporterId: item.reporterId }
            : item,
        ),
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update report.");
    } finally {
      actionLock.current = false;
      setPendingAction(null);
      setActionId(null);
    }
  };

  if (isLoading) {
    return <SharedPageSkeleton label="Loading reports…" variant="list" />;
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
      <div>
        <h1 className="text-[32px] font-medium tracking-tight text-text-primary">
          Report Moderation
        </h1>

        <p className="mt-2 text-base text-text-tertiary">
          Investigate reports raised by Creators and Brands.
        </p>
      </div>

      <ModerationStats items={reports} />

      <ListPanel
        title="Reports"
        description="Review reported content and moderation requests."
        filters={
          <Filters
            search={search}
            setSearch={setSearch}
            status={status}
            setStatus={setStatus}
          />
        }
      >
        {filtered.length === 0 ? (
          <div className="">
            <EmptyState
              title="No reports found"
              description="No reports match the selected filters."
            />
          </div>
        ) : (
          <ListTable
            columns={["Report", "Reported by", "Type", "Status", "Action"]}
          >
            {filtered.map((report) => (
              <ExpandableListRow
                key={report._id}
                cells={[
                  report.reason,
                  report.reporterId?.name || "User",
                  formatText(report.targetType),
                  <StatusBadge key="status" status={report.status} />,
                ]}
                label="View / Review"
              >
                <div className="rounded-2xl border border-card-border bg-card-background p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-text-primary">
                          {report.reason}
                        </p>

                        <StatusBadge status={report.status} />
                      </div>

                      <p className="mt-2 text-xs text-text-tertiary">
                        {formatText(report.targetType)} • Submitted by{" "}
                        {report.reporterId?.name || "User"}
                      </p>

                      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-text-secondary">
                        {report.description || "No description provided."}
                      </p>
                    </div>

                    {!["RESOLVED", "DISMISSED"].includes(report.status) && (
                      <div className="w-full xl:w-[320px]">
                        <textarea
                          aria-label="Review notes"
                          maxLength={2000}
                          disabled={actionId !== null}
                          rows={4}
                          value={notes[report._id] || ""}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [report._id]: event.target.value,
                            }))
                          }
                          placeholder="Admin review note..."
                          className="w-full resize-none rounded-xl border border-card-border bg-transparent px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-500"
                        />

                        <div className="mt-3 grid gap-2">
                          {report.status === "OPEN" && (
                            <button
                              disabled={actionId !== null}
                              onClick={() =>
                                handleReview(report, "UNDER_REVIEW")
                              }
                              className="flex items-center justify-center gap-2 rounded-xl border border-card-border px-3 py-2 text-sm font-medium text-text-primary"
                              aria-busy={
                                actionId === report._id &&
                                pendingAction === "UNDER_REVIEW"
                              }
                            >
                              {actionId === report._id &&
                              pendingAction === "UNDER_REVIEW" ? (
                                <>
                                  <InlineSpinner /> Starting review…
                                </>
                              ) : (
                                <>
                                  <Eye size={15} /> Start Review
                                </>
                              )}
                            </button>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              disabled={actionId !== null}
                              onClick={() => handleReview(report, "DISMISSED")}
                              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-500"
                              aria-busy={
                                actionId === report._id &&
                                pendingAction === "DISMISSED"
                              }
                            >
                              {actionId === report._id &&
                              pendingAction === "DISMISSED" ? (
                                <>
                                  <InlineSpinner /> Dismissing…
                                </>
                              ) : (
                                <>
                                  <XCircle size={15} /> Dismiss
                                </>
                              )}
                            </button>

                            <button
                              disabled={actionId !== null}
                              onClick={() => handleReview(report, "RESOLVED")}
                              className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 py-2 text-sm font-medium text-white"
                              aria-busy={
                                actionId === report._id &&
                                pendingAction === "RESOLVED"
                              }
                            >
                              {actionId === report._id &&
                              pendingAction === "RESOLVED" ? (
                                <>
                                  <InlineSpinner /> Resolving…
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={15} /> Resolve
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ExpandableListRow>
            ))}
          </ListTable>
        )}
      </ListPanel>
    </div>
  );
}

function ModerationStats({ items }) {
  const values = [
    {
      label: "Open",
      icon: Flag,
      tone: "blue",
      value: items.filter((item) => item.status === "OPEN").length,
    },
    {
      label: "Under Review",
      icon: Clock3,
      tone: "orange",
      value: items.filter((item) => item.status === "UNDER_REVIEW").length,
    },
    {
      label: "Resolved",
      icon: CheckCircle2,
      tone: "green",
      value: items.filter((item) => item.status === "RESOLVED").length,
    },
    {
      label: "Dismissed",
      icon: XCircle,
      tone: "red",
      value: items.filter((item) => item.status === "DISMISSED").length,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {values.map((item) => (
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

function Filters({ search, setSearch, status, setStatus }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative sm:w-56">
        <Search
          size={17}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
        />

        <input
          aria-label="Search records"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search report or user..."
          className="h-10 w-full rounded-xl border border-card-border bg-transparent pl-10 pr-4 text-sm text-text-primary outline-none focus:border-brand-500"
        />
      </div>

      <select
        aria-label="Status filter"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        className="h-10 rounded-xl border border-card-border bg-card-background px-4 text-sm text-text-primary"
      >
        <option value="ALL">All statuses</option>
        <option value="OPEN">Open</option>
        <option value="UNDER_REVIEW">Under Review</option>
        <option value="RESOLVED">Resolved</option>
        <option value="DISMISSED">Dismissed</option>
      </select>
    </div>
  );
}

function formatText(value) {
  if (!value) return "-";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
