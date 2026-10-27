"use client";
import {
  PageSkeleton as SharedPageSkeleton,
  InlineSpinner,
} from "@/components/loading-state";
import useUnsavedChanges from "@/hooks/use-unsaved-changes";
import { reportLoadError } from "@/lib/toast-feedback";

import { useEffect, useRef, useState } from "react";

import { AlertTriangle, Flag } from "lucide-react";

import toast from "react-hot-toast";

import { createReport, getMyReports } from "@/services/report.service";

import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";

import EmptyState from "../shared/EmptyState";
import StatusBadge from "../shared/StatusBadge";

export default function CreatorReportsPage() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [reports, setReports] = useState([]);

  const [targetType, setTargetType] = useState("CAMPAIGN");

  const [targetId, setTargetId] = useState("");

  const [reason, setReason] = useState("");

  const [description, setDescription] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");

  const requestLock = useRef(false);
  useUnsavedChanges(Boolean(targetId || reason || description));

  const retryLoad = () => {
    setError("");
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    getMyReports({ signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted)
          setReports(response.data?.reports || []);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            reportLoadError(
              error,
              error.response?.data?.message || "Unable to load reports.",
              "_components-creator-CreatorReportsPage-load-error-1",
            ),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [loadAttempt]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (requestLock.current) return;

    if (!/^[a-f\d]{24}$/i.test(targetId.trim())) {
      toast.error("Enter a valid target ID (24 hexadecimal characters).");

      return;
    }

    if (!reason.trim()) {
      toast.error("Reason is required.");

      return;
    }

    if (!description.trim()) {
      toast.error("Description is required.");
      return;
    }

    try {
      requestLock.current = true;
      setIsSubmitting(true);

      const response = await createReport({
        targetType,
        targetId: targetId.trim(),
        reason: reason.trim(),
        description: description.trim(),
      });

      toast.success("Report submitted successfully.");

      setTargetId("");
      setReason("");
      setDescription("");

      if (response.data?.report)
        setReports((current) => [response.data.report, ...current]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to submit report.");
    } finally {
      requestLock.current = false;
      setIsSubmitting(false);
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
          Reports
        </h1>

        <p className="mt-2 text-base text-text-tertiary">
          Report campaigns, users, or submitted content that may violate
          platform guidelines.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        {/* Report Form */}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Submit a Report</CardTitle>

              <p className="mt-1 text-sm text-text-tertiary">
                Provide enough information for the COCREATE team to review the
                issue.
              </p>
            </div>
          </CardHeader>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-5 pt-1"
            aria-busy={isSubmitting}
          >
            {/* Type */}

            <div>
              <label
                htmlFor="targetType"
                className="text-sm font-medium text-text-primary"
              >
                Report Type
              </label>

              <select
                id="targetType"
                disabled={isSubmitting}
                value={targetType}
                onChange={(event) => setTargetType(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-card-border bg-card-background px-3 text-sm text-text-primary outline-none focus:border-brand-500"
              >
                <option value="CAMPAIGN">Campaign</option>

                <option value="USER">User / Brand</option>

                <option value="SUBMISSION">Submission</option>
              </select>
            </div>

            {/* Target ID */}

            <div>
              <label
                htmlFor="targetId"
                className="text-sm font-medium text-text-primary"
              >
                {formatText(targetType)} ID
              </label>

              <input
                id="targetId"
                required
                maxLength={24}
                disabled={isSubmitting}
                type="text"
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
                placeholder="Enter the related ID"
                className="mt-2 h-11 w-full rounded-xl border border-card-border bg-transparent px-4 text-sm text-text-primary outline-none focus:border-brand-500"
              />

              <p className="mt-1 text-xs text-text-tertiary">
                You can copy this from the relevant campaign, user or
                submission.
              </p>
            </div>

            {/* Reason */}

            <div>
              <label
                htmlFor="reason"
                className="text-sm font-medium text-text-primary"
              >
                Reason
              </label>

              <select
                id="reason"
                required
                disabled={isSubmitting}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-card-border bg-card-background px-3 text-sm text-text-primary"
              >
                <option value="">Select a reason</option>
                {[
                  "SPAM",
                  "INAPPROPRIATE_CONTENT",
                  "FRAUD",
                  "HARASSMENT",
                  "MISLEADING",
                  "OTHER",
                ].map((value) => (
                  <option key={value} value={value}>
                    {formatText(value)}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}

            <div>
              <label
                htmlFor="description"
                className="text-sm font-medium text-text-primary"
              >
                Description
              </label>

              <textarea
                id="description"
                disabled={isSubmitting}
                rows={6}
                required
                maxLength={2000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Explain the issue in more detail..."
                className="mt-2 w-full resize-none rounded-xl border border-card-border bg-transparent px-4 py-3 text-sm leading-6 text-text-primary outline-none focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? <InlineSpinner /> : <Flag size={16} />}

              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </Card>

        {/* History */}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>My Reports</CardTitle>

              <p className="mt-1 text-sm text-text-tertiary">
                Track reports you have previously submitted.
              </p>
            </div>
          </CardHeader>

          {reports.length === 0 ? (
            <EmptyState
              title="No reports submitted"
              description="Reports you submit will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <TableRoot className="w-full min-w-[750px] border-none">
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>

                    <TableHead>Reason</TableHead>

                    <TableHead>Submitted</TableHead>

                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AlertTriangle
                            size={15}
                            className="text-text-tertiary"
                          />

                          {formatText(report.targetType)}
                        </div>
                      </TableCell>

                      <TableCell className="max-w-[260px]">
                        <p className="truncate text-sm text-text-primary">
                          {report.reason}
                        </p>
                      </TableCell>

                      <TableCell>{formatDate(report.createdAt)}</TableCell>

                      <TableCell>
                        <StatusBadge status={report.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableRoot>
            </div>
          )}
        </Card>
      </div>
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

function formatText(value) {
  if (!value) return "-";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
