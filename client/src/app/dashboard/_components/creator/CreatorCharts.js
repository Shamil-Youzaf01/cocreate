"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";
import EmptyState from "../shared/EmptyState";

const tooltipStyle = {
  backgroundColor: "var(--color-card-background)",
  border: "1px solid var(--color-card-border)",
  borderRadius: 12,
  color: "var(--color-text-primary)",
};

export default function CreatorCharts({ dashboard }) {
  const applications = dashboard?.applications || {};
  const submissions = dashboard?.submissions || {};
  const total = applications.total ?? 0;
  const pipeline = [
    { name: "Pending", value: applications.pending ?? 0, color: "#f97316" },
    { name: "Accepted", value: applications.accepted ?? 0, color: "#22c55e" },
    {
      name: "Rejected",
      value: Math.max(
        0,
        total - (applications.pending ?? 0) - (applications.accepted ?? 0),
      ),
      color: "#ef4444",
    },
  ];
  const deliverables = [
    {
      name: "Under review",
      value: submissions.underReview ?? 0,
      color: "#f97316",
    },
    {
      name: "Needs revision",
      value: submissions.revisionRequested ?? 0,
      color: "#a855f7",
    },
    { name: "Approved", value: submissions.approved ?? 0, color: "#22c55e" },
  ];
  const submissionTotal = deliverables.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="min-w-0">
        <CardHeader className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Application Pipeline</CardTitle>
            <p className="mt-1 text-sm text-text-tertiary">
              Status of all your campaign pitches.
            </p>
          </div>
          <Link
            href="/dashboard/applications"
            className="text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            View applications
          </Link>
        </CardHeader>
        {total === 0 ? (
          <EmptyState
            title="No applications yet"
            description="Apply to a campaign to start tracking your pitches."
          />
        ) : (
          <div className="p-5 pt-0">
            <p className="text-2xl font-semibold text-text-primary">
              {total}{" "}
              <span className="text-sm font-normal text-text-tertiary">
                total applications
              </span>
            </p>
            <div
              className="mt-4 h-52"
              role="img"
              aria-label={pipeline
                .map((item) => `${item.name}: ${item.value}`)
                .join(", ")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pipeline}
                  layout="vertical"
                  margin={{ top: 5, right: 16, left: 0, bottom: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="var(--color-card-border)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--color-text-tertiary)", fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={76}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--color-background-gray-primary)" }}
                    formatter={(value) => [value, "Applications"]}
                  />
                  <Bar
                    dataKey="value"
                    barSize={24}
                    radius={[0, 6, 6, 0]}
                    isAnimationActive={false}
                  >
                    {pipeline.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ChartLegend items={pipeline} />
          </div>
        )}
      </Card>

      <Card className="min-w-0">
        <CardHeader className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Deliverable Status</CardTitle>
            <p className="mt-1 text-sm text-text-tertiary">
              Content in review, needing revisions, or approved.
            </p>
          </div>
          <Link
            href="/dashboard/submissions"
            className="text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            View submissions
          </Link>
        </CardHeader>
        {submissionTotal === 0 ? (
          <EmptyState
            title="No content in these stages yet"
            description="Your submitted content will appear here as it moves through review."
          />
        ) : (
          <div className="p-5 pt-0">
            <p className="text-2xl font-semibold text-text-primary">
              {submissions.approved ?? 0}{" "}
              <span className="text-sm font-normal text-text-tertiary">
                approved deliverables
              </span>
            </p>
            <div
              className="mt-4 h-52"
              role="img"
              aria-label={deliverables
                .map((item) => `${item.name}: ${item.value}`)
                .join(", ")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart accessibilityLayer>
                  <Pie
                    data={deliverables.filter((item) => item.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="85%"
                    paddingAngle={3}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {deliverables
                      .filter((item) => item.value > 0)
                      .map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [value, "Deliverables"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ChartLegend items={deliverables} />
          </div>
        )}
      </Card>
    </div>
  );
}

function ChartLegend({ items }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-secondary">
      {items.map((item) => (
        <li key={item.name} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.name}{" "}
          <span className="font-semibold text-text-primary">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
