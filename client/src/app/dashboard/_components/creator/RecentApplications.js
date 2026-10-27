import Link from "next/link";

import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";

import EmptyState from "../shared/EmptyState";
import StatusBadge from "../shared/StatusBadge";

export default function RecentApplications({ applications = [] }) {
  const recentApplications = applications.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Recent Pitch Applications</CardTitle>

          <p className="mt-1 text-sm text-text-tertiary">
            Track your latest campaign applications.
          </p>
        </div>

        <Link
          href="/dashboard/applications"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          View all
        </Link>
      </CardHeader>

      {recentApplications.length === 0 ? (
        <EmptyState
          title="No recent pitch applications"
          description="Campaigns you apply to will appear here."
        />
      ) : (
        <div className="overflow-x-auto">
          <TableRoot className="w-full min-w-[820px] border-none">
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>

                <TableHead>Applied On</TableHead>

                <TableHead>Reward rate</TableHead>

                <TableHead>Status</TableHead>

                <TableHead>Update</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {recentApplications.map((application) => {
                const campaign = application.campaignId;

                return (
                  <TableRow
                    key={application._id}
                    className="transition hover:bg-background-gray-primary"
                  >
                    <TableCell>
                      <Link
                        href={`/dashboard/campaigns/${campaign?._id}`}
                        className="block"
                      >
                        <p className="font-medium text-text-primary hover:text-brand-500">
                          {campaign?.title || "Campaign"}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-text-tertiary">
                          {campaign?.platform && (
                            <span>{formatText(campaign.platform)}</span>
                          )}

                          {campaign?.platform && campaign?.contentType && (
                            <span>•</span>
                          )}

                          {campaign?.contentType && (
                            <span>{formatText(campaign.contentType)}</span>
                          )}
                        </div>
                      </Link>
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {formatDate(application.createdAt)}
                    </TableCell>

                    <TableCell className="whitespace-nowrap font-medium text-text-primary">
                      {formatCurrency(campaign?.rewardRatePerThousandViews)} /
                      1K views
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={application.status} />
                    </TableCell>

                    <TableCell>
                      <ApplicationUpdate status={application.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </TableRoot>
        </div>
      )}
    </Card>
  );
}

function ApplicationUpdate({ status }) {
  const messages = {
    PENDING: {
      text: "Waiting for brand",
      className: "text-text-tertiary",
    },

    ACCEPTED: {
      text: "You were accepted",
      className: "text-green-600",
    },

    REJECTED: {
      text: "Not selected",
      className: "text-red-500",
    },
  };

  const item = messages[status] || {
    text: "Application updated",
    className: "text-text-tertiary",
  };

  return (
    <span className={`text-xs font-medium ${item.className}`}>{item.text}</span>
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
