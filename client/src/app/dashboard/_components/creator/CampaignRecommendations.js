import CampaignCover from "../shared/CampaignCover";
import CampaignRewardSummary from "../shared/CampaignRewardSummary";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

import EmptyState from "../shared/EmptyState";

export default function CampaignRecommendations({ campaigns = [] }) {
  const recommendations = campaigns.slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Campaign Recommendations</CardTitle>

          <p className="mt-1 text-sm text-text-tertiary">
            Explore campaigns currently available to you.
          </p>
        </div>

        <Link
          href="/dashboard/campaigns"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          View all
        </Link>
      </CardHeader>

      {recommendations.length === 0 ? (
        <EmptyState
          title="No campaign recommendations"
          description="New published campaigns available to you will appear here."
        />
      ) : (
        <div className="grid gap-4 p-5 pt-2 lg:grid-cols-3">
          {recommendations.map((campaign) => (
            <div
              key={campaign._id}
              className="flex h-full flex-col overflow-hidden rounded-xl border border-card-border bg-card-background p-5 transition hover:border-brand-300"
            >
              <CampaignCover
                campaign={campaign}
                creator
                showStatus={false}
                className="aspect-[16/10] -mx-5 -mt-5 mb-5"
              />
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-text-tertiary">
                {campaign.platform && (
                  <span>{formatText(campaign.platform)}</span>
                )}

                {campaign.platform && campaign.contentType && <span>•</span>}

                {campaign.contentType && (
                  <span>{formatText(campaign.contentType)}</span>
                )}
              </div>

              {/* Title */}
              <h3 className="mt-4 text-base font-semibold text-text-primary">
                {campaign.title}
              </h3>

              {/* Brand */}
              {campaign.brandId?.name && (
                <p className="mt-1 text-xs text-text-tertiary">
                  by {campaign.brandId.name}
                </p>
              )}

              {/* Description */}
              <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-text-secondary">
                {campaign.description ||
                  "View the full campaign brief and requirements."}
              </p>

              {/* Details */}
              <div className="mt-5 space-y-2">
                <CampaignRewardSummary
                  campaign={campaign}
                  variant="creator-card"
                />

                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <CalendarDays size={15} className="text-text-tertiary" />

                  <span>Apply before {formatDate(campaign.deadline)}</span>
                </div>
              </div>

              {/* CTA */}
              <Link
                href={`/dashboard/campaigns/${campaign._id}`}
                className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                View Campaign
                <ArrowRight size={15} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
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
  if (!value) return "";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
