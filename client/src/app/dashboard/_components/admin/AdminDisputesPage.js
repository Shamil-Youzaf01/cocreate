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

import StatIcon from "../shared/StatIcon";

import { useEffect, useRef, useMemo, useState } from "react";

import { CheckCircle2, Eye, Search, XCircle, Flag, Clock3 } from "lucide-react";

import toast from "react-hot-toast";

import { getAdminDisputes, reviewDispute } from "@/services/dispute.service";

import StatusBadge from "../shared/StatusBadge";
import EmptyState from "../shared/EmptyState";

export default function AdminDisputesPage() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const confirm = useConfirm();
  const actionLock = useRef(false);
  const [disputes, setDisputes] = useState([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("ALL");

  const [resolution, setResolution] = useState({});

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
        const response = await getAdminDisputes({ signal: controller.signal });
        if (!controller.signal.aborted)
          setDisputes(response.data?.disputes || []);
      } catch (error) {
        if (!controller.signal.aborted) {
          const message =
            error.response?.data?.message || "Unable to load disputes.";
          setError(message);
          toast.error(message, { id: "admin-disputes-load-error" });
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [loadAttempt]);

  const filtered = useMemo(() => {
    return disputes.filter((dispute) => {
      const query = search.toLowerCase();

      const matchesSearch =
        !search ||
        dispute.subject?.toLowerCase().includes(query) ||
        dispute.raisedBy?.name?.toLowerCase().includes(query) ||
        dispute.campaignId?.title?.toLowerCase().includes(query);

      const matchesStatus = status === "ALL" || dispute.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [disputes, search, status]);

  const handleReview = async (dispute, nextStatus) => {
    const note = resolution[dispute._id]?.trim() || "";

    if (["RESOLVED", "REJECTED"].includes(nextStatus) && !note) {
      toast.error("Add a resolution note first.");
      return;
    }

    if (actionLock.current) return;
    if (
      ["RESOLVED", "REJECTED"].includes(nextStatus) &&
      !(await confirm({
        title:
          nextStatus === "RESOLVED"
            ? "Resolve this dispute?"
            : "Reject this dispute?",
        description:
          "This closes the dispute. You cannot reopen it through the current review workflow.",
        confirmLabel:
          nextStatus === "RESOLVED" ? "Resolve dispute" : "Reject dispute",
        variant: nextStatus === "RESOLVED" ? "default" : "danger",
        details: [
          { label: "Dispute", value: dispute.subject },
          { label: "Review note", value: note },
        ],
      }))
    )
      return;

    try {
      if (actionLock.current) return;
      actionLock.current = true;
      setPendingAction(nextStatus);
      setActionId(dispute._id);

      const response = await reviewDispute(dispute._id, {
        status: nextStatus,

        resolution: note || undefined,
      });

      toast.success("Dispute updated.");

      setDisputes((current) =>
        current.map((item) =>
          item._id === dispute._id
            ? {
                ...item,
                ...response.data.dispute,
                raisedBy: item.raisedBy,
                campaignId: item.campaignId,
              }
            : item,
        ),
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update dispute.");
    } finally {
      actionLock.current = false;
      setPendingAction(null);
      setActionId(null);
    }
  };

  if (isLoading) {
    return <SharedPageSkeleton label="Loading disputes…" variant="list" />;
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
          Dispute Resolution
        </h1>

        <p className="mt-2 text-base text-text-tertiary">
          Review conflicts between Creators and Brands and record the
          resolution.
        </p>
      </div>

      <DisputeStats disputes={disputes} />

      <ListPanel
        title="Disputes"
        description="Review disputes and resolve creator concerns."
        filters={
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
                placeholder="Search subject, user or campaign..."
                className="h-10 w-full rounded-xl border border-card-border bg-transparent pl-9 pr-4 text-sm text-text-primary outline-none focus:border-brand-500"
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
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <div className="">
            <EmptyState
              title="No disputes found"
              description="No disputes match the selected filters."
            />
          </div>
        ) : (
          <ListTable
            columns={["Subject", "Raised by", "Campaign", "Status", "Action"]}
          >
            {filtered.map((dispute) => (
              <ExpandableListRow
                key={dispute._id}
                cells={[
                  dispute.subject,
                  dispute.raisedBy?.name || "User",
                  dispute.campaignId?.title || "-",
                  <StatusBadge key="status" status={dispute.status} />,
                ]}
                label="View / Review"
              >
                <div className="rounded-2xl border border-card-border bg-card-background p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-text-primary">
                          {dispute.subject}
                        </h2>

                        <StatusBadge status={dispute.status} />
                      </div>

                      <p className="mt-2 text-xs text-text-tertiary">
                        {formatText(dispute.category)} •{" "}
                        {dispute.raisedBy?.name || "User"}
                      </p>

                      {dispute.campaignId?.title && (
                        <p className="mt-2 text-sm font-medium text-text-secondary">
                          {dispute.campaignId.title}
                        </p>
                      )}

                      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-text-secondary">
                        {dispute.description}
                      </p>

                      {dispute.resolution &&
                        ["RESOLVED", "REJECTED"].includes(dispute.status) && (
                          <div className="mt-4 rounded-xl bg-background-gray-primary p-4">
                            <p className="text-xs font-medium text-text-tertiary">
                              Resolution
                            </p>

                            <p className="mt-2 text-sm text-text-secondary">
                              {dispute.resolution}
                            </p>
                          </div>
                        )}
                    </div>

                    {!["RESOLVED", "REJECTED"].includes(dispute.status) && (
                      <div className="w-full xl:w-[330px]">
                        <textarea
                          aria-label="Review notes"
                          maxLength={3000}
                          disabled={actionId !== null}
                          rows={5}
                          value={resolution[dispute._id] || ""}
                          onChange={(event) =>
                            setResolution((current) => ({
                              ...current,
                              [dispute._id]: event.target.value,
                            }))
                          }
                          placeholder="Resolution notes..."
                          className="w-full resize-none rounded-xl border border-card-border bg-transparent px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-500"
                        />

                        <div className="mt-3 grid gap-2">
                          {dispute.status === "OPEN" && (
                            <button
                              disabled={actionId !== null}
                              onClick={() =>
                                handleReview(dispute, "UNDER_REVIEW")
                              }
                              className="flex items-center justify-center gap-2 rounded-xl border border-card-border px-3 py-2.5 text-sm font-medium text-text-primary"
                              aria-busy={
                                actionId === dispute._id &&
                                pendingAction === "UNDER_REVIEW"
                              }
                            >
                              {actionId === dispute._id &&
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
                              onClick={() => handleReview(dispute, "REJECTED")}
                              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-medium text-red-500"
                              aria-busy={
                                actionId === dispute._id &&
                                pendingAction === "REJECTED"
                              }
                            >
                              {actionId === dispute._id &&
                              pendingAction === "REJECTED" ? (
                                <>
                                  <InlineSpinner /> Rejecting…
                                </>
                              ) : (
                                <>
                                  <XCircle size={15} /> Reject
                                </>
                              )}
                            </button>

                            <button
                              disabled={actionId !== null}
                              onClick={() => handleReview(dispute, "RESOLVED")}
                              className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 py-2.5 text-sm font-medium text-white"
                              aria-busy={
                                actionId === dispute._id &&
                                pendingAction === "RESOLVED"
                              }
                            >
                              {actionId === dispute._id &&
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

function DisputeStats({ disputes }) {
  const statuses = ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"];

  const icons = {
    OPEN: { icon: Flag, tone: "blue" },
    UNDER_REVIEW: { icon: Clock3, tone: "orange" },
    RESOLVED: { icon: CheckCircle2, tone: "green" },
    REJECTED: { icon: XCircle, tone: "red" },
  };

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {statuses.map((status) => (
        <div
          key={status}
          className="rounded-2xl border border-card-border bg-card-background p-5"
        >
          <StatIcon {...icons[status]} />
          <p className="mt-6 text-2xl font-semibold text-text-primary">
            {disputes.filter((item) => item.status === status).length}
          </p>

          <p className="mt-2 text-sm text-text-tertiary">
            {formatText(status)}
          </p>
        </div>
      ))}
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
