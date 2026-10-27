"use client";
import {
  PageSkeleton as SharedPageSkeleton,
  InlineSpinner,
} from "@/components/loading-state";
import useUnsavedChanges from "@/hooks/use-unsaved-changes";
import { reportLoadError } from "@/lib/toast-feedback";

import { useEffect, useRef, useState } from "react";

import { MessageSquareWarning } from "lucide-react";

import toast from "react-hot-toast";

import { createDispute, getMyDisputes } from "@/services/dispute.service";

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

export default function BrandDisputesPage() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [disputes, setDisputes] = useState([]);

  const [campaignId, setCampaignId] = useState("");

  const [applicationId, setApplicationId] = useState("");

  const [submissionId, setSubmissionId] = useState("");

  const [category, setCategory] = useState("CAMPAIGN_REQUIREMENTS");

  const [subject, setSubject] = useState("");

  const [description, setDescription] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");

  const requestLock = useRef(false);
  useUnsavedChanges(
    Boolean(
      campaignId || applicationId || submissionId || subject || description,
    ),
  );

  const retryLoad = () => {
    setError("");
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    getMyDisputes({ signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted)
          setDisputes(response.data?.disputes || []);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            reportLoadError(
              error,
              error.response?.data?.message || "Unable to load disputes.",
              "_components-brand-BrandDisputesPage-load-error-1",
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

    if (!campaignId.trim()) {
      toast.error("Campaign ID is required.");

      return;
    }

    if (!subject.trim()) {
      toast.error("Subject is required.");

      return;
    }

    if (!description.trim()) {
      toast.error("Description is required.");

      return;
    }

    if (
      [campaignId, applicationId, submissionId].some(
        (value) => value.trim() && !/^[a-f\d]{24}$/i.test(value.trim()),
      )
    ) {
      toast.error("Enter valid IDs (24 hexadecimal characters).");
      return;
    }

    const payload = {
      campaignId: campaignId.trim(),

      category,

      subject: subject.trim(),

      description: description.trim(),
    };

    if (applicationId.trim()) {
      payload.applicationId = applicationId.trim();
    }

    if (submissionId.trim()) {
      payload.submissionId = submissionId.trim();
    }

    try {
      requestLock.current = true;
      setIsSubmitting(true);

      const response = await createDispute(payload);

      toast.success("Dispute raised successfully.");

      setCampaignId("");
      setApplicationId("");
      setSubmissionId("");
      setSubject("");
      setDescription("");

      if (response.data?.dispute)
        setDisputes((current) => [response.data.dispute, ...current]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to raise dispute.");
    } finally {
      requestLock.current = false;
      setIsSubmitting(false);
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
      {/* Header */}

      <div>
        <h1 className="text-[32px] font-medium tracking-tight text-text-primary">
          Disputes
        </h1>

        <p className="mt-2 text-base text-text-tertiary">
          Raise disputes related to creator applications, submissions or
          campaign fulfilment.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
        {/* Form */}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Raise a Dispute</CardTitle>

              <p className="mt-1 text-sm text-text-tertiary">
                Provide the related campaign and explain what happened.
              </p>
            </div>
          </CardHeader>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-5 pt-1"
            aria-busy={isSubmitting}
          >
            {/* Campaign */}

            <Input
              disabled={isSubmitting}
              label="Campaign ID"
              value={campaignId}
              onChange={setCampaignId}
              placeholder="Campaign ID"
              required
            />

            <Input
              disabled={isSubmitting}
              label="Application ID"
              value={applicationId}
              onChange={setApplicationId}
              placeholder="Optional"
            />

            <Input
              disabled={isSubmitting}
              label="Submission ID"
              value={submissionId}
              onChange={setSubmissionId}
              placeholder="Optional"
            />

            {/* Category */}

            <div>
              <label
                htmlFor="category"
                className="text-sm font-medium text-text-primary"
              >
                Category
              </label>

              <select
                id="category"
                disabled={isSubmitting}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-card-border bg-card-background px-3 text-sm text-text-primary outline-none focus:border-brand-500"
              >
                <option value="CAMPAIGN_REQUIREMENTS">
                  Campaign Requirements
                </option>

                <option value="REWARD">Reward Issue</option>

                <option value="SUBMISSION">Submission Issue</option>

                <option value="PAYMENT">Payment Issue</option>

                <option value="OTHER">Other</option>
              </select>
            </div>

            <Input
              disabled={isSubmitting}
              label="Subject"
              value={subject}
              onChange={setSubject}
              placeholder="Short summary"
              required
            />

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
                maxLength={3000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Explain the issue and any important context..."
                className="mt-2 w-full resize-none rounded-xl border border-card-border bg-transparent px-4 py-3 text-sm leading-6 text-text-primary outline-none focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <InlineSpinner />
              ) : (
                <MessageSquareWarning size={16} />
              )}

              {isSubmitting ? "Submitting..." : "Raise Dispute"}
            </button>
          </form>
        </Card>

        {/* History */}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>My Disputes</CardTitle>

              <p className="mt-1 text-sm text-text-tertiary">
                Track review and resolution of disputes created by your Brand.
              </p>
            </div>
          </CardHeader>

          {disputes.length === 0 ? (
            <EmptyState
              title="No disputes"
              description="Disputes you raise will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <TableRoot className="w-full min-w-[850px] border-none">
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>

                    <TableHead>Category</TableHead>

                    <TableHead>Created</TableHead>

                    <TableHead>Status</TableHead>

                    <TableHead>Resolution</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {disputes.map((dispute) => (
                    <TableRow key={dispute._id}>
                      <TableCell>
                        <p className="font-medium text-text-primary">
                          {dispute.subject}
                        </p>
                      </TableCell>

                      <TableCell>{formatText(dispute.category)}</TableCell>

                      <TableCell>{formatDate(dispute.createdAt)}</TableCell>

                      <TableCell>
                        <StatusBadge status={dispute.status} />
                      </TableCell>

                      <TableCell className="max-w-[250px] text-sm text-text-tertiary">
                        {dispute.resolution || dispute.adminNote || "-"}
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

function Input({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled,
}) {
  return (
    <div>
      <label htmlFor={label} className="text-sm font-medium text-text-primary">
        {label}
      </label>

      <input
        id={label}
        disabled={disabled}
        maxLength={label === "Subject" ? 150 : 24}
        type="text"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border border-card-border bg-transparent px-4 text-sm text-text-primary outline-none focus:border-brand-500"
      />
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
