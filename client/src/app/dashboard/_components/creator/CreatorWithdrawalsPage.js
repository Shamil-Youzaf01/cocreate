"use client";
import LoadingState, {
  PageSkeleton as SharedPageSkeleton,
  InlineSpinner,
} from "@/components/loading-state";
import { useConfirm } from "@/components/confirm-dialog";
import { reportLoadError } from "@/lib/toast-feedback";

import { useEffect, useRef, useState } from "react";

import { BadgeIndianRupee, Landmark, Smartphone } from "lucide-react";

import toast from "react-hot-toast";

import { getMyWallet } from "@/services/wallet.service";

import {
  getMyWithdrawals,
  requestWithdrawal,
} from "@/services/withdrawal.service";

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

async function loadWithdrawalData(signal) {
  const [walletResponse, withdrawalResponse] = await Promise.all([
    getMyWallet({ signal }),
    getMyWithdrawals({ signal }),
  ]);
  const withdrawals =
    withdrawalResponse.data?.withdrawals ||
    withdrawalResponse.withdrawals ||
    withdrawalResponse.data ||
    [];
  return {
    wallet: walletResponse.data?.wallet || null,
    withdrawals: Array.isArray(withdrawals) ? withdrawals : [],
  };
}

export default function CreatorWithdrawalsPage() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const confirm = useConfirm();
  const [wallet, setWallet] = useState(null);

  const [withdrawals, setWithdrawals] = useState([]);

  const [amount, setAmount] = useState("");

  const [method, setMethod] = useState("UPI");

  const [upiId, setUpiId] = useState("");

  const [accountName, setAccountName] = useState("");

  const [accountNumber, setAccountNumber] = useState("");

  const [ifsc, setIfsc] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Data
  |--------------------------------------------------------------------------
  */

  const requestLock = useRef(false);

  const retryLoad = () => {
    setError("");
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    async function loadWithdrawals() {
      try {
        const latest = await loadWithdrawalData(controller.signal);
        if (controller.signal.aborted) return;
        setWallet(latest.wallet);
        setWithdrawals(latest.withdrawals);
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(
          reportLoadError(
            error,
            error.response?.data?.message || "Unable to load withdrawals.",
            "_components-creator-CreatorWithdrawalsPage-load-error-1",
          ),
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    loadWithdrawals();
    return () => controller.abort();
  }, [loadAttempt]);

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (requestLock.current || isLoading) return;

    const withdrawalAmount = Number(amount);

    if (!Number.isFinite(withdrawalAmount) || withdrawalAmount <= 0) {
      toast.error("Enter a valid withdrawal amount.");

      return;
    }

    if (withdrawalAmount > (wallet?.availableBalance || 0)) {
      toast.error("Withdrawal amount exceeds your available balance.");

      return;
    }

    if (method === "UPI" && !upiId.trim()) {
      toast.error("UPI ID is required.");

      return;
    }

    if (
      method === "BANK_TRANSFER" &&
      (!accountName.trim() || !accountNumber.trim() || !ifsc.trim())
    ) {
      toast.error("Complete all bank details.");

      return;
    }

    const paymentDetails =
      method === "UPI"
        ? {
            method: "UPI",
            upiId: upiId.trim(),
          }
        : {
            method: "BANK_TRANSFER",
            accountName: accountName.trim(),
            accountNumber: accountNumber.trim(),
            ifsc: ifsc.trim().toUpperCase(),
          };

    if (
      !(await confirm({
        title: "Request a withdrawal?",
        description:
          "This amount will be reserved from your available balance while your payout is reviewed.",
        confirmLabel: "Request withdrawal",
        variant: "payment",
        details: [
          { label: "Amount", value: formatCurrency(withdrawalAmount) },
          {
            label: "Payment method",
            value: method === "UPI" ? "UPI" : "Bank transfer",
          },
          {
            label: "Destination",
            value:
              method === "UPI"
                ? upiId.trim()
                : `Account ending ${accountNumber.trim().slice(-4)}`,
          },
        ],
      }))
    )
      return;

    try {
      requestLock.current = true;
      setIsSubmitting(true);

      await requestWithdrawal({
        amount: withdrawalAmount,

        paymentDetails,
      });

      toast.success("Withdrawal request submitted.");

      setAmount("");
      setUpiId("");
      setAccountName("");
      setAccountNumber("");
      setIfsc("");

      setIsLoading(true);
      setError("");
      try {
        const latest = await loadWithdrawalData();
        setWallet(latest.wallet);
        setWithdrawals(latest.withdrawals);
      } catch (error) {
        setError(
          reportLoadError(
            error,
            error.response?.data?.message ||
              "Your request was submitted, but the updated balance could not be loaded.",
            "_components-creator-CreatorWithdrawalsPage-refresh-error",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to request withdrawal.",
      );
    } finally {
      requestLock.current = false;
      setIsSubmitting(false);
    }
  };

  if (isLoading && !wallet) {
    return <SharedPageSkeleton label="Loading withdrawals…" variant="list" />;
  }

  if (error && !wallet) {
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
      {isLoading && <LoadingState label="Refreshing withdrawals…" compact />}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={retryLoad}
            className="mt-2 font-medium underline"
          >
            Try again
          </button>
        </div>
      )}
      {/* Header */}

      <div>
        <h1 className="text-[32px] font-medium tracking-tight text-text-primary">
          Withdrawals
        </h1>

        <p className="mt-2 text-base text-text-tertiary">
          Withdraw your available creator earnings and track payout requests.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        {/* Withdrawal form */}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Withdraw Funds</CardTitle>

              <p className="mt-1 text-sm text-text-tertiary">
                Available balance
              </p>

              <p className="mt-2 text-2xl font-semibold text-text-primary">
                {formatCurrency(wallet?.availableBalance)}
              </p>
            </div>
          </CardHeader>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-5 pt-1"
            aria-busy={isSubmitting}
          >
            {/* Amount */}

            <div>
              <label
                htmlFor="amount"
                className="text-sm font-medium text-text-primary"
              >
                Amount
              </label>

              <div className="relative mt-2">
                <BadgeIndianRupee
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                />

                <input
                  id="amount"
                  disabled={isSubmitting}
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  max={wallet?.availableBalance || undefined}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Enter amount"
                  className="h-11 w-full rounded-xl border border-card-border bg-transparent pl-10 pr-4 text-sm text-text-primary outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Method */}

            <div>
              <label className="text-sm font-medium text-text-primary">
                Payment Method
              </label>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <MethodButton
                  disabled={isSubmitting || isLoading}
                  active={method === "UPI"}
                  icon={Smartphone}
                  title="UPI"
                  onClick={() => setMethod("UPI")}
                />

                <MethodButton
                  disabled={isSubmitting || isLoading}
                  active={method === "BANK_TRANSFER"}
                  icon={Landmark}
                  title="Bank"
                  onClick={() => setMethod("BANK_TRANSFER")}
                />
              </div>
            </div>

            {/* UPI */}

            {method === "UPI" && (
              <div>
                <label
                  htmlFor="upiId"
                  className="text-sm font-medium text-text-primary"
                >
                  UPI ID
                </label>

                <input
                  id="upiId"
                  disabled={isSubmitting}
                  type="text"
                  value={upiId}
                  onChange={(event) => setUpiId(event.target.value)}
                  placeholder="name@upi"
                  className="mt-2 h-11 w-full rounded-xl border border-card-border bg-transparent px-4 text-sm text-text-primary outline-none focus:border-brand-500"
                />
              </div>
            )}

            {/* Bank */}

            {method === "BANK_TRANSFER" && (
              <>
                <div>
                  <label
                    htmlFor="accountName"
                    className="text-sm font-medium text-text-primary"
                  >
                    Account Holder Name
                  </label>

                  <input
                    id="accountName"
                    disabled={isSubmitting}
                    type="text"
                    value={accountName}
                    onChange={(event) => setAccountName(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-card-border bg-transparent px-4 text-sm text-text-primary outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="accountNumber"
                    className="text-sm font-medium text-text-primary"
                  >
                    Account Number
                  </label>

                  <input
                    id="accountNumber"
                    disabled={isSubmitting}
                    type="text"
                    value={accountNumber}
                    onChange={(event) => setAccountNumber(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-card-border bg-transparent px-4 text-sm text-text-primary outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ifsc"
                    className="text-sm font-medium text-text-primary"
                  >
                    IFSC
                  </label>

                  <input
                    id="ifsc"
                    disabled={isSubmitting}
                    type="text"
                    value={ifsc}
                    onChange={(event) => setIfsc(event.target.value)}
                    placeholder="ABCD0123456"
                    className="mt-2 h-11 w-full rounded-xl border border-card-border bg-transparent px-4 text-sm uppercase text-text-primary outline-none focus:border-brand-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isLoading || !wallet?.availableBalance}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-busy={isSubmitting}
            >
              {isSubmitting && <InlineSpinner />}
              {isSubmitting ? "Submitting..." : "Request Withdrawal"}
            </button>
          </form>
        </Card>

        {/* History */}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Withdrawal History</CardTitle>

              <p className="mt-1 text-sm text-text-tertiary">
                Track current and previous payout requests.
              </p>
            </div>
          </CardHeader>

          {withdrawals.length === 0 ? (
            <EmptyState
              title="No withdrawals yet"
              description="Your withdrawal requests will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <TableRoot className="w-full min-w-[700px] border-none">
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>

                    <TableHead>Method</TableHead>

                    <TableHead>Requested</TableHead>

                    <TableHead>Status</TableHead>

                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal._id}>
                      <TableCell className="font-medium text-text-primary">
                        {formatCurrency(withdrawal.amount)}
                      </TableCell>

                      <TableCell>
                        {formatMethod(withdrawal.paymentDetails?.method)}
                      </TableCell>

                      <TableCell>{formatDate(withdrawal.createdAt)}</TableCell>

                      <TableCell>
                        <StatusBadge status={withdrawal.status} />
                      </TableCell>

                      <TableCell className="max-w-[220px] text-sm text-text-tertiary">
                        {withdrawal.adminNote || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableRoot>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function MethodButton({ active, disabled, icon: Icon, title, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-brand-500 bg-brand-50 text-brand-500"
          : "border-card-border text-text-secondary hover:bg-background-gray-primary"
      }`}
    >
      <Icon size={16} />

      {title}
    </button>
  );
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMethod(value) {
  if (value === "UPI") {
    return "UPI";
  }

  if (value === "BANK_TRANSFER") {
    return "Bank Transfer";
  }

  return "-";
}
