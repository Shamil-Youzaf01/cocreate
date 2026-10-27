"use client";
import { PageSkeleton as SharedPageSkeleton } from "@/components/loading-state";
import { reportLoadError } from "@/lib/toast-feedback";

import { useEffect, useState } from "react";

import DashboardLink from "@/components/dashboard-link";

import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeIndianRupee,
  Wallet,
} from "lucide-react";

import { getMyWallet, getMyTransactions } from "@/services/wallet.service";

import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

import EmptyState from "../_components/shared/EmptyState";
import StatIcon from "../_components/shared/StatIcon";

export default function WalletPage() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [wallet, setWallet] = useState(null);

  const [transactions, setTransactions] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const retryLoad = () => {
    setError("");
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchWallet = async () => {
      try {
        setIsLoading(true);

        const [walletResponse, transactionResponse] = await Promise.all([
          getMyWallet({ signal: controller.signal }),
          getMyTransactions({ signal: controller.signal }),
        ]);

        if (controller.signal.aborted) return;
        setWallet(
          walletResponse.data?.wallet || walletResponse.data?.wallet || null,
        );

        setTransactions(
          transactionResponse.data?.transactions ||
            transactionResponse.data?.transactions ||
            [],
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Wallet fetch failed:", error);

        setError(
          reportLoadError(
            error,
            error.response?.data?.message || "Unable to load wallet.",
            "wallet-page-load-error-1",
          ),
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchWallet();
    return () => controller.abort();
  }, [loadAttempt]);

  if (isLoading) {
    return <SharedPageSkeleton label="Loading wallet…" variant="dashboard" />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={retryLoad}
            className="mt-3 font-medium underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-2 py-6 lg:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[32px] font-medium tracking-tight text-text-primary">
            Wallet
          </h1>

          <p className="mt-2 text-base text-text-tertiary">
            Track your earnings, withdrawals and creator rewards.
          </p>
        </div>

        <DashboardLink
          href="/dashboard/withdrawals"
          className="w-fit rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          Withdraw Funds
        </DashboardLink>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <WalletCard
          title="Available Balance"
          tone="blue"
          value={formatCurrency(wallet?.availableBalance)}
          icon={Wallet}
          subtitle="Available to withdraw"
        />

        <WalletCard
          title="Total Earned"
          tone="green"
          value={formatCurrency(wallet?.totalEarned)}
          icon={BadgeIndianRupee}
          subtitle="Lifetime rewards"
        />

        <WalletCard
          title="Total Withdrawn"
          tone="purple"
          value={formatCurrency(wallet?.totalWithdrawn)}
          icon={ArrowUpRight}
          subtitle="Successfully withdrawn"
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Transactions</CardTitle>

            <p className="mt-1 text-sm text-text-tertiary">
              Your latest wallet activity.
            </p>
          </div>
        </CardHeader>

        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Campaign rewards and withdrawals will appear here."
          />
        ) : (
          <div className="divide-y divide-card-border">
            {transactions.slice(0, 10).map((transaction) => (
              <TransactionRow key={transaction._id} transaction={transaction} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function WalletCard({ title, value, subtitle, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border border-card-border bg-card-background p-6">
      <StatIcon icon={Icon} tone={tone} />

      <p className="mt-8 text-[28px] font-semibold tracking-tight text-text-primary">
        {value}
      </p>

      <p className="mt-3 text-sm font-medium text-text-secondary">{title}</p>

      <p className="mt-1 text-xs text-text-tertiary">{subtitle}</p>
    </div>
  );
}

function TransactionRow({ transaction }) {
  const isCredit = transaction.direction === "CREDIT";

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${
            isCredit
              ? "bg-green-50 text-green-500"
              : "bg-orange-50 text-orange-500"
          }`}
        >
          {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
        </div>

        <div>
          <p className="text-sm font-medium text-text-primary">
            {transaction.description || formatText(transaction.type)}
          </p>

          <p className="mt-1 text-xs text-text-tertiary">
            {formatDateTime(transaction.createdAt)}
          </p>
        </div>
      </div>

      <p
        className={`text-sm font-semibold ${
          isCredit ? "text-green-600" : "text-text-primary"
        }`}
      >
        {isCredit ? "+" : "-"}
        {formatCurrency(transaction.amount)}
      </p>
    </div>
  );
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDateTime(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatText(value) {
  if (!value) return "Transaction";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
