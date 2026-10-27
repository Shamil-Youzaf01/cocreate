"use client";
import { useConfirm } from "@/components/confirm-dialog";
import toast from "react-hot-toast";
import { InlineSpinner } from "@/components/loading-state";

import { useRef, useState } from "react";

import {
  verifySubmissionViews,
  creditSubmissionReward,
  syncSubmissionViews,
} from "@/services/submission.service";

export default function SubmissionPerformance({
  submission,
  campaign,
  canManage = false,
  disabled = false,
  onBusyChange,
  onUpdated,
}) {
  const confirm = useConfirm();
  const [views, setViews] = useState(String(submission.verifiedViews ?? 0));

  const [busy, setBusy] = useState("");

  const [error, setError] = useState("");

  const lock = useRef(false);

  const status = submission.rewardStatus || "PENDING_VERIFICATION";

  const credited = status === "CREDITED";

  const tracking = submission.platformTracking;

  const youtube =
    campaign?.platform === "YOUTUBE" ||
    submission.campaignId?.platform === "YOUTUBE" ||
    tracking?.platform === "YOUTUBE" ||
    tracking?.source === "YOUTUBE_API";

  const creditedAmount =
    submission.creditedReward ?? (credited ? submission.finalReward : 0);

  const remainingBudget = Number(campaign?.remainingBudget) || 0;

  const insufficient = Number(submission.finalReward) > remainingBudget;

  const changed =
    !youtube &&
    (views.trim() === "" || Number(views) !== Number(submission.verifiedViews));

  async function act(action) {
    if (lock.current || disabled) return;

    if (action === "verify" && youtube) {
      setError("Use Sync YouTube views.");
      toast.error("Use Sync YouTube views.");
      return;
    }

    if (
      action === "verify" &&
      (views.trim() === "" ||
        !Number.isSafeInteger(Number(views)) ||
        Number(views) < 0)
    ) {
      setError("Enter a valid whole number of views.");
      toast.error("Enter a valid whole number of views.");
      return;
    }

    lock.current = true;
    setBusy(action);
    setError("");

    try {
      onBusyChange?.(true);
      if (
        action === "credit" &&
        !(await confirm({
          title: "Credit creator reward?",
          confirmLabel: "Credit reward",
          variant: "payment",
          description: `Credit ${currency(submission.finalReward)} to this creator?`,
        }))
      )
        return;
      const response =
        action === "sync"
          ? await syncSubmissionViews(submission._id)
          : action === "verify"
            ? await verifySubmissionViews(submission._id, Number(views))
            : await creditSubmissionReward(submission._id);

      if (response.data?.submission?.verifiedViews !== undefined)
        setViews(String(response.data.submission.verifiedViews));
      toast.success(
        action === "sync"
          ? "YouTube views synced."
          : action === "verify"
            ? "Views verified."
            : "Reward credited to the creator.",
      );
      try {
        await onUpdated?.(response.data);
      } catch {
        const message =
          "Changes saved, but the latest details could not be loaded. Refresh the page.";
        setError(message);
        toast.error(message);
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Unable to update reward.";
      setError(message);
      toast.error(message);
    } finally {
      lock.current = false;
      setBusy("");
      onBusyChange?.(false);
    }
  }

  return (
    <section className="mt-4">
      {busy && (
        <p role="status" className="sr-only">
          {busy === "sync"
            ? "Syncing YouTube views..."
            : busy === "verify"
              ? "Verifying views..."
              : "Processing reward credit..."}
        </p>
      )}
      {/* Compact metrics */}

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <Metric
          label="Verified views"
          value={Number(submission.verifiedViews || 0).toLocaleString("en-IN")}
        />

        <Metric
          label="Reward rate"
          value={`${currency(campaign?.rewardRatePerThousandViews)} / 1K`}
        />

        <Metric label="Reward" value={currency(submission.finalReward)} />

        <Metric label="Budget left" value={currency(remainingBudget)} />
      </div>

      {/* Tracking line */}

      {youtube && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary">
          <span>YouTube</span>

          <span>•</span>

          <span>
            {Number(tracking?.baselineViews || 0).toLocaleString("en-IN")}
            {" → "}
            {Number(tracking?.currentViews || 0).toLocaleString("en-IN")}
          </span>

          {tracking?.lastSyncedAt && (
            <>
              <span>•</span>

              <span>Synced {formatRelativeTime(tracking.lastSyncedAt)}</span>
            </>
          )}
        </div>
      )}

      {/* Manual views */}

      {canManage && !youtube && !credited && (
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="number"
            min="0"
            step="1"
            value={views}
            disabled={!!busy || disabled}
            onChange={(event) => setViews(event.target.value)}
            className="h-10 min-w-[160px] flex-1 rounded-lg border border-card-border bg-transparent px-3 text-sm text-text-primary"
            placeholder="Verified views"
          />

          <button
            type="button"
            aria-busy={busy === "verify"}
            disabled={!!busy || disabled}
            onClick={() => act("verify")}
            className="inline-flex items-center gap-2 rounded-lg border border-card-border px-3 py-2 text-sm font-medium text-brand-500 disabled:opacity-50"
          >
            {busy === "verify" && <InlineSpinner />}
            {busy === "verify" ? "Verifying..." : "Verify"}
          </button>
        </div>
      )}

      {/* Actions */}

      {canManage && submission.status === "APPROVED" && !credited && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {youtube && (
            <button
              type="button"
              aria-busy={busy === "sync"}
              disabled={
                !!busy || disabled || tracking?.source !== "YOUTUBE_API"
              }
              onClick={() => act("sync")}
              className="inline-flex items-center gap-2 rounded-lg border border-card-border px-3 py-2 text-sm font-medium text-brand-500 disabled:opacity-50"
            >
              {busy === "sync" && <InlineSpinner />}
              {busy === "sync" ? "Syncing..." : "Sync views"}
            </button>
          )}

          {status === "READY" && (
            <button
              type="button"
              aria-busy={busy === "credit"}
              disabled={
                !!busy ||
                disabled ||
                insufficient ||
                changed ||
                !(submission.finalReward > 0)
              }
              onClick={() => act("credit")}
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy === "credit" && <InlineSpinner />}
              {busy === "credit"
                ? "Crediting..."
                : `Credit ${currency(submission.finalReward)}`}
            </button>
          )}
        </div>
      )}

      {/* Status */}

      {credited && (
        <p className="mt-3 text-sm font-medium text-green-600">
          Credited {currency(creditedAmount)}
        </p>
      )}

      {status === "NOT_ELIGIBLE" && (
        <p className="mt-3 text-sm text-text-tertiary">Below minimum payout.</p>
      )}

      {insufficient && (
        <p className="mt-3 text-sm text-red-600">
          Insufficient campaign budget.
        </p>
      )}

      {tracking?.lastSyncError && (
        <p className="mt-3 text-sm text-red-600">{tracking.lastSyncError}</p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-text-tertiary">{label}</p>

      <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatRelativeTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const diff = Date.now() - date.getTime();

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
}
