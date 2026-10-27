import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

export default function ApplicationPipeline({ dashboard }) {
  const total = dashboard?.applications?.total ?? 0;

  const pending = dashboard?.applications?.pending ?? 0;

  const accepted = dashboard?.applications?.accepted ?? 0;

  const rejected = dashboard?.applications?.rejected ?? 0;

  const rows = [
    {
      label: "Pending",
      value: pending,
    },
    {
      label: "Accepted",
      value: accepted,
    },
    {
      label: "Rejected",
      value: rejected,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Application Pipeline</CardTitle>

          <p className="mt-1 text-sm text-text-tertiary">
            Current creator application status.
          </p>
        </div>
      </CardHeader>

      <div className="p-5 pt-1">
        <div>
          <p className="text-[30px] font-semibold text-text-primary">{total}</p>

          <p className="mt-1 text-xs text-text-tertiary">Total applications</p>
        </div>

        <div className="mt-6 space-y-4">
          {rows.map((row) => {
            const percentage =
              total > 0 ? Math.round((row.value / total) * 100) : 0;

            return (
              <div key={row.label}>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-secondary">{row.label}</p>

                  <p className="text-sm font-medium text-text-primary">
                    {row.value}
                  </p>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background-gray-secondary">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Link
          href="/dashboard/campaigns"
          className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          Review campaigns
          <ArrowRight size={14} />
        </Link>
      </div>
    </Card>
  );
}
