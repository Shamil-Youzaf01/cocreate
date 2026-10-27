import Link from "next/link";

import { ArrowRight, Flag } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

import EmptyState from "../shared/EmptyState";
import StatusBadge from "../shared/StatusBadge";

export default function CampaignReviewQueue({ campaigns = [] }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-4">
        <div>
          <CardTitle>Campaigns Requiring Review</CardTitle>

          <p className="mt-1 text-sm text-text-tertiary">
            Campaign-related reports requiring moderation.
          </p>
        </div>

        <Link
          href="/dashboard/reports"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          View all
        </Link>
      </CardHeader>

      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaign reviews"
          description="No campaign reports currently require attention."
        />
      ) : (
        <div className="divide-y divide-card-border">
          {campaigns.map((item) => (
            <div key={item._id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background-gray-primary text-text-tertiary">
                  <Flag size={15} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {item.campaign?.title || "Campaign unavailable"}
                    </p>

                    <StatusBadge status={item.status} />
                  </div>

                  {item.campaign?.brandId?.name && (
                    <p className="mt-1 text-xs text-text-tertiary">
                      {item.campaign.brandId.name}
                    </p>
                  )}

                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-text-secondary">
                    {item.reason}
                  </p>

                  <Link
                    href="/dashboard/reports"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-500"
                  >
                    Review Report
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
