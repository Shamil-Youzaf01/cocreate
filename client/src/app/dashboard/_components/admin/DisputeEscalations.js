import Link from "next/link";

import { ArrowRight, MessageSquareWarning } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

import EmptyState from "../shared/EmptyState";
import StatusBadge from "../shared/StatusBadge";

export default function DisputeEscalations({ disputes = [] }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Dispute Escalations</CardTitle>

          <p className="mt-1 text-sm text-text-tertiary">
            Open disputes requiring Admin review or resolution.
          </p>
        </div>

        <Link
          href="/dashboard/disputes"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          View all
        </Link>
      </CardHeader>

      {disputes.length === 0 ? (
        <EmptyState
          title="No dispute escalations"
          description="There are currently no open disputes requiring attention."
        />
      ) : (
        <div className="divide-y divide-card-border">
          {disputes.map((dispute) => (
            <div
              key={dispute._id}
              className="flex flex-col justify-between gap-4 px-5 py-4 md:flex-row md:items-center"
            >
              <div className="flex min-w-0 gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background-gray-primary text-text-tertiary">
                  <MessageSquareWarning size={17} />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-text-primary">
                      {dispute.subject}
                    </p>

                    <StatusBadge status={dispute.status} />
                  </div>

                  {dispute.campaignId?.title && (
                    <p className="mt-1 text-xs text-text-tertiary">
                      {dispute.campaignId.title}
                    </p>
                  )}

                  <p className="mt-2 line-clamp-1 text-sm text-text-secondary">
                    {dispute.description}
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/disputes"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand-500"
              >
                Review
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
