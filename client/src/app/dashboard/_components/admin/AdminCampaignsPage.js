"use client";
import {
  PageSkeleton as SharedPageSkeleton,
  InlineSpinner,
} from "@/components/loading-state";
import { useConfirm } from "@/components/confirm-dialog";
import Link from "next/link";

import {
  ListPanel,
  ListTable,
} from "@/app/dashboard/_components/shared/ListView";
import { TableRow, TableCell } from "@/components/tailgrids/core/table";

import StatIcon from "@/app/dashboard/_components/shared/StatIcon";

import { useEffect, useRef, useMemo, useState } from "react";

import {
  Search,
  ShieldAlert,
  Archive,
  FilePenLine,
  Megaphone,
  Radio,
} from "lucide-react";

import toast from "react-hot-toast";

import { getAdminCampaigns, moderateCampaign } from "@/services/admin.service";

import StatusBadge from "../shared/StatusBadge";
import EmptyState from "../shared/EmptyState";

export default function AdminCampaignsPage() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const confirm = useConfirm();
  const actionLock = useRef(false);
  const [campaigns, setCampaigns] = useState([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("ALL");

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [actionId, setActionId] = useState(null);

  const retryLoad = () => {
    setError("");
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const items = [];
        let page = 1;
        let response;
        do {
          response = await getAdminCampaigns(
            { page, limit: 100 },
            { signal: controller.signal },
          );
          items.push(...(response.data?.campaigns || []));
          page += 1;
        } while (
          response.data?.pagination?.hasNextPage &&
          !controller.signal.aborted
        );
        if (!controller.signal.aborted) setCampaigns(items);
      } catch (error) {
        if (!controller.signal.aborted) {
          const message =
            error.response?.data?.message || "Unable to load campaigns.";
          setError(message);
          toast.error(message, { id: "admin-campaigns-load-error" });
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [loadAttempt]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const query = search.toLowerCase();

      const matchesSearch =
        !search ||
        campaign.title?.toLowerCase().includes(query) ||
        campaign.brandId?.name?.toLowerCase().includes(query) ||
        campaign.brandId?.email?.toLowerCase().includes(query);

      const matchesStatus = status === "ALL" || campaign.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, status]);

  const handleClose = async (campaign) => {
    const confirmed = await confirm({
      title: "Close this campaign?",
      confirmLabel: "Close campaign",
      variant: "danger",
      description: `Moderate and close "${campaign.title}"?`,
    });

    if (!confirmed) return;

    try {
      if (actionLock.current) return;
      actionLock.current = true;
      setActionId(campaign._id);

      const response = await moderateCampaign(campaign._id, {
        action: "CLOSE",
      });

      toast.success("Campaign closed by Admin.");

      setCampaigns((current) =>
        current.map((item) =>
          item._id === campaign._id
            ? { ...item, ...response.data.campaign, brandId: item.brandId }
            : item,
        ),
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to moderate campaign.",
      );
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
      <div>
        <h1 className="text-[32px] font-medium tracking-tight text-text-primary">
          Campaign Moderation
        </h1>

        <p className="mt-2 text-base text-text-tertiary">
          Review campaigns across COCREATE and close campaigns requiring
          moderation.
        </p>
      </div>

      <CampaignStats campaigns={campaigns} />

      <ListPanel
        title="Campaigns"
        description="Review and manage campaigns across all brands."
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
                placeholder="Search campaign or brand..."
                className="h-10 w-full rounded-xl border border-card-border bg-transparent pl-9 pr-4 text-sm text-text-primary outline-none focus:border-brand-500"
              />
            </div>

            <select
              aria-label="Status filter"
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
        }
      >
        {filteredCampaigns.length === 0 ? (
          <div className="">
            <EmptyState
              title="No campaigns found"
              description="Try changing the filters."
            />
          </div>
        ) : (
          <ListTable
            columns={[
              "Campaign",
              "Brand",
              "Reward rate",
              "Deadline",
              "Status",
              "Action",
            ]}
          >
            {filteredCampaigns.map((campaign) => (
              <CampaignRow
                key={campaign._id}
                campaign={campaign}
                isProcessing={actionId !== null}
                onClose={handleClose}
                isBusy={actionId === campaign._id}
              />
            ))}
          </ListTable>
        )}
      </ListPanel>
    </div>
  );
}

function CampaignRow({ campaign, isProcessing, isBusy, onClose }) {
  return (
    <TableRow className="transition hover:bg-background-gray-primary">
      <TableCell>
        <Link
          href={`/dashboard/campaigns/${campaign._id}`}
          className="font-medium text-text-primary hover:text-brand-500"
        >
          {campaign.title}
        </Link>
      </TableCell>
      <TableCell>{campaign.brandId?.name || "Brand unavailable"}</TableCell>
      <TableCell className="whitespace-nowrap font-medium text-text-primary">
        {formatCurrency(campaign.rewardRatePerThousandViews)} / 1K views
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDate(campaign.deadline)}
      </TableCell>
      <TableCell>
        <StatusBadge status={campaign.status} />
      </TableCell>
      <TableCell className="text-right">
        {" "}
        {campaign.status === "PUBLISHED" && (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onClose(campaign)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
            aria-busy={isBusy}
          >
            {isBusy ? (
              <>
                <InlineSpinner /> Closing…
              </>
            ) : (
              <>
                <ShieldAlert size={15} /> Close Campaign
              </>
            )}
          </button>
        )}
      </TableCell>
    </TableRow>
  );
}

function CampaignStats({ campaigns }) {
  const published = campaigns.filter(
    (item) => item.status === "PUBLISHED",
  ).length;

  const draft = campaigns.filter((item) => item.status === "DRAFT").length;

  const closed = campaigns.filter((item) => item.status === "CLOSED").length;

  const stats = [
    {
      label: "Total",
      icon: Megaphone,
      tone: "purple",
      value: campaigns.length,
    },
    {
      label: "Published",
      icon: Radio,
      tone: "green",
      value: published,
    },
    {
      label: "Draft",
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

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
