"use client";

import {
  CartesianGrid,
  Line,
  Legend,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

export default function CampaignActivityChart({ data = [] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Campaign Activity</CardTitle>

          <p className="mt-1 text-sm text-text-tertiary">
            Campaign, application and submission activity over the last six
            months.
          </p>
        </div>
      </CardHeader>

      <div className="h-[300px] p-5 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />

            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />

            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="campaigns"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="applications"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="submissions"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
