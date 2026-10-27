import Link from "next/link";

import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

import EmptyState from "../shared/EmptyState";
import StatusBadge from "../shared/StatusBadge";

export default function ActiveDeliverables({ deliverables = [] }) {
  const recentDeliverables = deliverables.slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Active Deliverable Funnel</CardTitle>

          <p className="mt-1 text-sm text-text-tertiary">
            Track your current campaign deliverables.
          </p>
        </div>

        <Link
          href="/dashboard/submissions"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          View all
        </Link>
      </CardHeader>

      {recentDeliverables.length === 0 ? (
        <EmptyState
          title="No active deliverables"
          description="Accepted campaign work will appear here."
        />
      ) : (
        <div className="space-y-3 p-5 pt-2">
          {recentDeliverables.map((item) => (
            <Link
              key={item._id}
              href={
                item.submissionId
                  ? `/dashboard/submissions/${item.submissionId}`
                  : `/dashboard/campaigns/${item.campaignId}`
              }
              className="block rounded-xl border border-card-border p-5 transition hover:border-brand-300 hover:bg-background-gray-primary"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="font-medium text-text-primary">
                    {item.campaignTitle || "Campaign"}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-tertiary">
                    {item.platform && <span>{item.platform}</span>}

                    {item.contentType && <span>{item.contentType}</span>}

                    {item.deadline && (
                      <span>Due {formatDate(item.deadline)}</span>
                    )}
                  </div>
                </div>

                <StatusBadge status={item.status} />
              </div>

              <Funnel status={item.status} />

              {item.status === "REVISION_REQUESTED" && (
                <p className="mt-4 text-xs font-medium text-orange-600">
                  Revision requested — update and resubmit your content.
                </p>
              )}

              {item.status === "SUBMITTED" && (
                <p className="mt-4 text-xs text-text-tertiary">
                  Your submission is waiting for brand review.
                </p>
              )}

              {item.status === "ACCEPTED" && (
                <p className="mt-4 text-xs text-text-tertiary">
                  You have been accepted. Submit your deliverable when ready.
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

function Funnel({ status }) {
  const steps = [
    {
      key: "ACCEPTED",
      label: "Accepted",
    },
    {
      key: "SUBMITTED",
      label: "Submitted",
    },
    {
      key: "REVIEW",
      label: "Under Review",
    },
    {
      key: "APPROVED",
      label: "Approved",
    },
    {
      key: "REWARD",
      label: "Reward",
    },
  ];

  let currentIndex = 0;

  switch (status) {
    case "ACCEPTED":
      currentIndex = 0;
      break;

    case "SUBMITTED":
      currentIndex = 2;
      break;

    case "REVISION_REQUESTED":
      currentIndex = 2;
      break;

    case "APPROVED":
      currentIndex = 4;
      break;

    default:
      currentIndex = 0;
  }

  return (
    <div className="mt-5 grid grid-cols-5 gap-2">
      {steps.map((step, index) => {
        const active = index <= currentIndex;

        return (
          <div key={step.key}>
            <div
              className={`h-1.5 rounded-full ${
                active ? "bg-brand-500" : "bg-background-gray-secondary"
              }`}
            />

            <p className="mt-2 hidden text-[10px] text-text-tertiary md:block">
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
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
