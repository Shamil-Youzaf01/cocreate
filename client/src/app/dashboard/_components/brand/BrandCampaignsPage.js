"use client";
import {
  PageSkeleton as SharedPageSkeleton,
  InlineSpinner,
} from "@/components/loading-state";
import { useConfirm } from "@/components/confirm-dialog";
import { reportLoadError } from "@/lib/toast-feedback";
import CampaignCover from "../shared/CampaignCover";

import StatIcon from "@/app/dashboard/_components/shared/StatIcon";

import { useEffect, useRef, useMemo, useState } from "react";

import Link from "next/link";

import {
  CalendarDays,
  Edit3,
  Eye,
  Plus,
  Search,
  Send,
  Square,
  Users,
  Archive,
  FilePenLine,
  Megaphone,
  Radio,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  closeCampaign,
  getMyCampaigns,
  publishCampaign,
} from "@/services/campaign.service";

import EmptyState from "../shared/EmptyState";

export default function BrandCampaignsPage() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const confirm = useConfirm();
  const [campaigns, setCampaigns] = useState([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("ALL");

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const actionLock = useRef(false);
  const [actionId, setActionId] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Fetch Campaigns
  |--------------------------------------------------------------------------
  */

  const retryLoad = () => {
    setError("");
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    getMyCampaigns({ signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted)
          setCampaigns(response.data?.campaigns || []);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            reportLoadError(
              error,
              error.response?.data?.message || "Unable to load campaigns.",
              "_components-brand-BrandCampaignsPage-load-error-1",
            ),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [loadAttempt]);

  /*
  |--------------------------------------------------------------------------
  | Filter
  |--------------------------------------------------------------------------
  */

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch =
        !search || campaign.title?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status === "ALL" || campaign.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, status]);

  /*
  |--------------------------------------------------------------------------
  | Publish
  |--------------------------------------------------------------------------
  */

  const handlePublish = async (campaignId) => {
    if (actionLock.current) return;
    const confirmed = await confirm({
      title: "Publish campaign?",
      confirmLabel: "Publish campaign",
      variant: "default",
      description:
        "Publish this campaign? Creators will be able to discover and apply to it.",
    });

    if (!confirmed) return;

    try {
      actionLock.current = true;
      setActionId(campaignId);

      const response = await publishCampaign(campaignId);

      toast.success("Campaign published.");

      setCampaigns((current) =>
        current.map((campaign) =>
          campaign._id === campaignId
            ? { ...campaign, ...response.data.campaign }
            : campaign,
        ),
      );
    } catch (error) {
      console.error("Publish failed:", error);

      toast.error(
        error.response?.data?.message || "Unable to publish campaign.",
      );
    } finally {
      actionLock.current = false;
      setActionId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Close
  |--------------------------------------------------------------------------
  */

  const handleClose = async (campaignId) => {
    if (actionLock.current) return;
    const confirmed = await confirm({
      title: "Close campaign?",
      confirmLabel: "Close campaign",
      variant: "danger",
      description:
        "Close this campaign? Creators will no longer be able to apply.",
    });

    if (!confirmed) return;

    try {
      actionLock.current = true;
      setActionId(campaignId);

      const response = await closeCampaign(campaignId);

      toast.success("Campaign closed.");

      setCampaigns((current) =>
        current.map((campaign) =>
          campaign._id === campaignId
            ? { ...campaign, ...response.data.campaign }
            : campaign,
        ),
      );
    } catch (error) {
      console.error("Close failed:", error);

      toast.error(error.response?.data?.message || "Unable to close campaign.");
    } finally {
      actionLock.current = false;
      setActionId(null);
    }
  };

  if (isLoading) {
    return <SharedPageSkeleton label="Loading campaigns…" variant="list" />;
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

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[32px] font-medium tracking-tight text-text-primary">
            My Campaigns
          </h1>

          <p className="mt-2 text-base text-text-tertiary">
            Create, publish and manage your creator campaigns.
          </p>
        </div>

        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          <Plus size={17} />
          Create Campaign
        </Link>
      </div>

      {/* Stats */}

      <CampaignStats campaigns={campaigns} />

      {/* Filters */}

      <div className="flex flex-col gap-3 rounded-2xl border border-card-border bg-card-background p-4 lg:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />

          <input
            aria-label="Search campaigns"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search campaigns..."
            className="h-10 w-full rounded-xl border border-card-border bg-transparent pl-9 pr-4 text-sm text-text-primary outline-none focus:border-brand-500"
          />
        </div>

        <select
          aria-label="Campaign status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-xl border border-card-border bg-card-background px-4 text-sm text-text-primary outline-none focus:border-brand-500"
        >
          <option value="ALL">All statuses</option>

          <option value="DRAFT">Draft</option>

          <option value="PUBLISHED">Published</option>

          <option value="CLOSED">Closed</option>

          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Campaign Grid */}

      {filteredCampaigns.length === 0 ? (
        <div className="rounded-2xl border border-card-border bg-card-background">
          <EmptyState
            title={
              campaigns.length === 0
                ? "No campaigns yet"
                : "No matching campaigns"
            }
            description={
              campaigns.length === 0
                ? "Create your first campaign to start working with creators."
                : "Try changing your search or status filter."
            }
          />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign._id}
              campaign={campaign}
              isProcessing={actionId === campaign._id}
              onPublish={handlePublish}
              onClose={handleClose}
              actionsDisabled={actionId !== null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignStats({ campaigns }) {
  const total = campaigns.length;

  const draft = campaigns.filter(
    (campaign) => campaign.status === "DRAFT",
  ).length;

  const published = campaigns.filter(
    (campaign) => campaign.status === "PUBLISHED",
  ).length;

  const closed = campaigns.filter(
    (campaign) => campaign.status === "CLOSED",
  ).length;

  const stats = [
    {
      label: "Total Campaigns",
      icon: Megaphone,
      tone: "purple",
      value: total,
    },
    {
      label: "Published",
      icon: Radio,
      tone: "green",
      value: published,
    },
    {
      label: "Drafts",
      icon: FilePenLine,
      tone: "orange",
      value: draft,
    },
    {
      label: "Closed",
      icon: Archive,
      tone: "blue",
      value: closed,
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

function CampaignCard({
  campaign,
  isProcessing,
  actionsDisabled,
  onPublish,
  onClose,
}) {
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-card-border bg-card-background transition hover:border-brand-300">
      <CampaignCover campaign={campaign} creator className="aspect-video" />
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <h2 className="text-base font-semibold text-text-primary">
          {campaign.title}
        </h2>
        <p className="mt-2 line-clamp-2 flex-1 text-xs leading-5 text-text-secondary">
          {campaign.description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="text-text-tertiary">Reward / 1K views</p>
            <p className="mt-1 font-semibold text-text-primary">
              {formatCurrency(campaign.rewardRatePerThousandViews)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-text-tertiary">Budget remaining</p>
            <p className="mt-1 font-semibold text-text-primary">
              {formatCurrency(campaign.remainingBudget)}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-text-tertiary">
          <span className="inline-flex items-center gap-1.5">
            <Users size={13} />
            {campaign.creatorSlots == null
              ? "Unlimited slots"
              : `${campaign.creatorSlots} slots`}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} />
            Due {formatDate(campaign.deadline)}
          </span>
        </div>
        <div className="mt-4 flex flex-nowrap gap-1.5 overflow-x-auto border-t border-card-border pt-3 [&_svg:not([data-loading-spinner])]:hidden">
          {campaign.status !== "DRAFT" && (
            <Link
              href={`/dashboard/campaigns/${campaign._id}/submissions`}
              className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-card-border px-2 py-2 text-[11px] font-medium text-brand-500 hover:bg-brand-50"
            >
              Submissions
            </Link>
          )}

          <Link
            href={`/dashboard/campaigns/${campaign._id}`}
            className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-card-border px-2 py-2 text-[11px] font-medium text-text-secondary transition hover:bg-background-gray-primary"
          >
            <Eye size={14} />
            View
          </Link>

          {campaign.status === "DRAFT" && (
            <>
              <Link
                href={`/dashboard/campaigns/${campaign._id}/edit`}
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-card-border px-2 py-2 text-[11px] font-medium text-text-secondary transition hover:bg-background-gray-primary"
              >
                <Edit3 size={14} />
                Edit
              </Link>

              <button
                type="button"
                disabled={actionsDisabled}
                onClick={() => onPublish(campaign._id)}
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-brand-500 px-2 py-2 text-[11px] font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
                aria-busy={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <InlineSpinner /> Publishing…
                  </>
                ) : (
                  <>
                    <Send size={14} /> Publish
                  </>
                )}
              </button>
            </>
          )}

          {campaign.status === "PUBLISHED" && (
            <>
              <Link
                href={`/dashboard/campaigns/${campaign._id}/applications`}
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-card-border px-2 py-2 text-[11px] font-medium text-brand-500 transition hover:bg-brand-50"
              >
                <Users size={14} />
                Applicants
              </Link>

              <button
                type="button"
                disabled={actionsDisabled}
                onClick={() => onClose(campaign._id)}
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-red-200 px-2 py-2 text-[11px] font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                aria-busy={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <InlineSpinner /> Closing…
                  </>
                ) : (
                  <>
                    <Square size={13} /> Close
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
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

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}
