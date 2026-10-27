import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

import EmptyState from "../shared/EmptyState";

export default function ActiveDeliverableFunnel({ campaigns = [] }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Active Campaign & Deliverable Funnel</CardTitle>

          <p className="mt-1 text-sm text-text-tertiary">
            Track creators from application through approval.
          </p>
        </div>

        <Link
          href="/dashboard/campaigns"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          View all
        </Link>
      </CardHeader>

      {campaigns.length === 0 ? (
        <EmptyState
          title="No active campaigns"
          description="Published campaigns will appear here."
        />
      ) : (
        <div className="space-y-4 p-5 pt-1">
          {campaigns.map((campaign) => (
            <CampaignFunnel key={campaign._id} campaign={campaign} />
          ))}
        </div>
      )}
    </Card>
  );
}

function CampaignFunnel({ campaign }) {
  const steps = [
    {
      label: "Applicants",
      value: campaign.applicants ?? 0,
    },
    {
      label: "Accepted",
      value: campaign.accepted ?? 0,
    },
    {
      label: "Submitted",
      value: campaign.submitted ?? 0,
    },
    {
      label: "Revision",
      value: campaign.revisionRequested ?? 0,
    },
    {
      label: "Approved",
      value: campaign.approved ?? 0,
    },
  ];

  return (
    <div className="rounded-xl border border-card-border p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h3 className="font-medium text-text-primary">{campaign.title}</h3>

          <p className="mt-1 text-xs text-text-tertiary">
            {formatCurrency(campaign.rewardRatePerThousandViews)} / 1K views •{" "}
            {formatDate(campaign.deadline)}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/campaigns/${campaign._id}/applications`}
            className="text-xs font-medium text-brand-500 hover:text-brand-600"
          >
            Applicants
          </Link>

          <Link
            href={`/dashboard/campaigns/${campaign._id}/submissions`}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600"
          >
            Submissions
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {steps.map((step) => (
          <div
            key={step.label}
            className="rounded-xl bg-background-gray-primary p-3"
          >
            <p className="text-lg font-semibold text-text-primary">
              {step.value}
            </p>

            <p className="mt-1 text-xs text-text-tertiary">{step.label}</p>
          </div>
        ))}
      </div>
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
