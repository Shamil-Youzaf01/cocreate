import Link from "next/link";

import { ArrowRight, WalletCards } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

import EmptyState from "../shared/EmptyState";
import StatusBadge from "../shared/StatusBadge";

export default function WithdrawalQueue({ withdrawals = [] }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Withdrawal Requests</CardTitle>

          <p className="mt-1 text-sm text-text-tertiary">
            Payout requests awaiting settlement.
          </p>
        </div>

        <Link
          href="/dashboard/withdrawals"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          View all
        </Link>
      </CardHeader>

      {withdrawals.length === 0 ? (
        <EmptyState
          title="No pending payouts"
          description="There are currently no withdrawal requests requiring action."
        />
      ) : (
        <div className="divide-y divide-card-border">
          {withdrawals.map((withdrawal) => (
            <div
              key={withdrawal._id}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background-gray-primary text-text-tertiary">
                  <WalletCards size={17} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {withdrawal.creatorId?.name || "Creator"}
                  </p>

                  <p className="mt-1 text-xs text-text-tertiary">
                    {formatCurrency(withdrawal.amount)} •{" "}
                    {formatDate(withdrawal.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={withdrawal.status} />

                <Link
                  href="/dashboard/withdrawals"
                  aria-label="View withdrawals"
                  className="text-brand-500"
                >
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
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
  }).format(new Date(value));
}
