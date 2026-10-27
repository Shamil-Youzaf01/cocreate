"use client";
import { PageSkeleton as SharedPageSkeleton } from "@/components/loading-state";
import { reportLoadError } from "@/lib/toast-feedback";
import CampaignBudgetProgress from "../shared/CampaignBudgetProgress";
import CampaignCover from "../shared/CampaignCover";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  ArrowRight,
  CalendarDays,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { getPublishedCampaigns } from "@/services/campaign.service";

import EmptyState from "../shared/EmptyState";

export default function CampaignsPage() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [campaigns, setCampaigns] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [platform, setPlatform] = useState("ALL");

  const [contentType, setContentType] = useState("ALL");

  const retryLoad = () => {
    setError("");
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchCampaigns = async () => {
      try {
        setIsLoading(true);
        setError("");

        const allCampaigns = [];
        let page = 1;
        let hasNextPage;
        do {
          const response = await getPublishedCampaigns(
            { page, limit: 100 },
            { signal: controller.signal },
          );
          allCampaigns.push(...(response.data?.campaigns || []));
          hasNextPage = response.pagination?.hasNextPage;
          page += 1;
        } while (hasNextPage && !controller.signal.aborted);
        if (!controller.signal.aborted)
          setCampaigns([
            ...new Map(
              allCampaigns.map((campaign) => [campaign._id, campaign]),
            ).values(),
          ]);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Campaign fetch failed:", error);

        setError(
          reportLoadError(
            error,
            error.response?.data?.message || "Unable to load campaigns.",
            "_components-creator-CreatorCampaignsPage-load-error-1",
          ),
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchCampaigns();
    return () => controller.abort();
  }, [loadAttempt]);

  const platforms = useMemo(() => {
    return [
      ...new Set(
        campaigns.map((campaign) => campaign.platform).filter(Boolean),
      ),
    ];
  }, [campaigns]);

  const contentTypes = useMemo(() => {
    return [
      ...new Set(
        campaigns.map((campaign) => campaign.contentType).filter(Boolean),
      ),
    ];
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch =
        !search ||
        campaign.title?.toLowerCase().includes(search.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(search.toLowerCase()) ||
        campaign.brandId?.name?.toLowerCase().includes(search.toLowerCase());

      const matchesPlatform =
        platform === "ALL" || campaign.platform === platform;

      const matchesContentType =
        contentType === "ALL" || campaign.contentType === contentType;

      return matchesSearch && matchesPlatform && matchesContentType;
    });
  }, [campaigns, search, platform, contentType]);

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

      <div>
        <h1 className="text-[32px] font-medium tracking-tight text-text-primary">
          Discover Campaigns
        </h1>

        <p className="mt-2 text-base text-text-tertiary">
          Explore active campaigns and find opportunities that match your
          content.
        </p>
      </div>

      {/* Filters */}

      <div className="flex flex-col gap-3 rounded-2xl border border-card-border bg-card-background p-4 lg:flex-row">
        {/* Search */}

        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />

          <input
            type="text"
            aria-label="Search campaigns"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search campaigns..."
            className="h-10 w-full rounded-xl border border-card-border bg-transparent pl-9 pr-4 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-brand-500"
          />
        </div>

        {/* Platform */}

        <div className="relative">
          <SlidersHorizontal
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />

          <select
            aria-label="Platform"
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
            className="h-10 min-w-44 rounded-xl border border-card-border bg-card-background pl-9 pr-8 text-sm text-text-primary outline-none focus:border-brand-500"
          >
            <option value="ALL">All platforms</option>

            {platforms.map((item) => (
              <option key={item} value={item}>
                {formatText(item)}
              </option>
            ))}
          </select>
        </div>

        {/* Content type */}

        <select
          aria-label="Content type"
          value={contentType}
          onChange={(event) => setContentType(event.target.value)}
          className="h-10 min-w-44 rounded-xl border border-card-border bg-card-background px-3 text-sm text-text-primary outline-none focus:border-brand-500"
        >
          <option value="ALL">All content types</option>

          {contentTypes.map((item) => (
            <option key={item} value={item}>
              {formatText(item)}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-tertiary">
          {filteredCampaigns.length} campaign
          {filteredCampaigns.length === 1 ? "" : "s"} available
        </p>
      </div>

      {/* Campaigns */}

      {filteredCampaigns.length === 0 ? (
        <div className="rounded-2xl border border-card-border bg-card-background">
          <EmptyState
            title={
              campaigns.length === 0
                ? "No campaigns available"
                : "No matching campaigns"
            }
            description={
              campaigns.length === 0
                ? "New creator opportunities will appear here."
                : "Try adjusting your search or filters."
            }
          />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard key={campaign._id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaign }) {
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-card-border bg-card-background transition hover:border-brand-300">
      <CampaignCover
        campaign={campaign}
        creator
        showStatus={false}
        className="aspect-video"
      />
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <h2 className="text-base font-semibold text-text-primary">
          {campaign.title}
        </h2>
        {campaign.brandId?.name && (
          <p className="mt-1 text-xs text-text-tertiary">
            by {campaign.brandId.name}
          </p>
        )}
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
        <div className="mt-4">
          <CampaignBudgetProgress
            campaignBudget={campaign.campaignBudget}
            rewardsIssued={campaign.rewardsIssued}
            remainingBudget={campaign.remainingBudget}
            budgetUsagePercent={campaign.budgetUsagePercent}
            compact
          />
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
        <div className="mt-4 flex border-t border-card-border pt-3">
          <Link
            href={`/dashboard/campaigns/${campaign._id}`}
            className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent bg-brand-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-600"
          >
            View Campaign <ArrowRight size={14} />
          </Link>
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

function formatText(value) {
  if (!value) return "";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}
