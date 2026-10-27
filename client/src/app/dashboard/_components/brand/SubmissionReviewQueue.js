import Link from "next/link";

import { ArrowRight, ExternalLink } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

import EmptyState from "../shared/EmptyState";
import StatusBadge from "../shared/StatusBadge";

export default function SubmissionReviewQueue({ submissions = [] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Submissions Awaiting Review</CardTitle>

          <p className="mt-1 text-sm text-text-tertiary">
            Creator deliverables requiring Brand action.
          </p>
        </div>
      </CardHeader>

      {submissions.length === 0 ? (
        <EmptyState
          title="Nothing waiting for review"
          description="New creator submissions will appear here."
        />
      ) : (
        <div className="divide-y divide-card-border">
          {submissions.map((submission) => (
            <div
              key={submission._id}
              className="flex flex-col justify-between gap-4 px-5 py-4 lg:flex-row lg:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-text-primary">
                    {submission.creator?.name || "Creator"}
                  </p>

                  <StatusBadge status={submission.status} />
                </div>

                <p className="mt-1 text-sm text-text-secondary">
                  {submission.campaign?.title || "Campaign"}
                </p>

                <p className="mt-1 text-xs text-text-tertiary">
                  Submitted {formatDate(submission.submittedAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {safeUrl(submission.contentUrl) && (
                  <a
                    href={safeUrl(submission.contentUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-brand-500"
                  >
                    Content
                    <ExternalLink size={13} />
                  </a>
                )}

                {submission.campaign?._id && (
                  <Link
                    href={`/dashboard/campaigns/${submission.campaign._id}/submissions`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600"
                  >
                    Review
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
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

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
