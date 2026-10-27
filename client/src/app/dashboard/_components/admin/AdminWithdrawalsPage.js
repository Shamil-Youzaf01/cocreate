"use client";
import {
  PageSkeleton as SharedPageSkeleton,
  InlineSpinner,
} from "@/components/loading-state";
import { useConfirm } from "@/components/confirm-dialog";

import {
  ListPanel,
  ListTable,
  ExpandableListRow,
} from "@/app/dashboard/_components/shared/ListView";

import StatIcon from "@/app/dashboard/_components/shared/StatIcon";

import { useEffect, useRef, useMemo, useState } from "react";

import {
  Check,
  CheckCircle2,
  Clock3,
  Search,
  WalletCards,
  X,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  approveWithdrawal,
  getAdminWithdrawals,
  markWithdrawalPaid,
  rejectWithdrawal,
} from "@/services/withdrawal.service";

import StatusBadge from "../shared/StatusBadge";
import EmptyState from "../shared/EmptyState";

export default function AdminWithdrawalsPage() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const confirm = useConfirm();
  const actionLock = useRef(false);
  const [withdrawals, setWithdrawals] = useState([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("ALL");

  const [notes, setNotes] = useState({});

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [actionId, setActionId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Fetch
  |--------------------------------------------------------------------------
  */

  const retryLoad = () => {
    setError("");
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await getAdminWithdrawals({
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setWithdrawals(response.data?.withdrawals || []);
      } catch (error) {
        if (!controller.signal.aborted) {
          const message =
            error.response?.data?.message || "Unable to load withdrawals.";
          setError(message);
          toast.error(message, { id: "admin-withdrawals-load-error" });
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [loadAttempt]);

  /*
  |--------------------------------------------------------------------------
  | Filter
  |--------------------------------------------------------------------------
  */

  const filtered = useMemo(() => {
    return withdrawals.filter((withdrawal) => {
      const creator = withdrawal.creatorId;

      const query = search.toLowerCase();

      const matchesSearch =
        !search ||
        creator?.name?.toLowerCase().includes(query) ||
        creator?.email?.toLowerCase().includes(query);

      const matchesStatus = status === "ALL" || withdrawal.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [withdrawals, search, status]);

  /*
  |--------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------
  */

  const handleApprove = async (withdrawal) => {
    if (actionLock.current) return;
    const confirmed = await confirm({
      title: "Approve withdrawal?",
      confirmLabel: "Approve withdrawal",
      variant: "payment",
      details: [
        { label: "Creator", value: withdrawal.creatorId?.name || "Creator" },
        { label: "Amount", value: formatCurrency(withdrawal.amount) },
        {
          label: "Destination",
          value:
            withdrawal.paymentDetails?.method === "UPI"
              ? withdrawal.paymentDetails.upiId
              : `Account ending ${withdrawal.paymentDetails?.accountNumber?.slice(-4) || "----"}`,
        },
      ],
      description: `Approve withdrawal of ${formatCurrency(
        withdrawal.amount,
      )}?`,
    });

    if (!confirmed) return;

    try {
      actionLock.current = true;
      setPendingAction("APPROVE");
      setActionId(withdrawal._id);

      const response = await approveWithdrawal(
        withdrawal._id,
        notes[withdrawal._id] || "",
      );

      toast.success("Withdrawal approved.");

      setWithdrawals((current) =>
        current.map((item) =>
          item._id === withdrawal._id
            ? {
                ...item,
                ...response.data.withdrawal,
                creatorId: item.creatorId,
              }
            : item,
        ),
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to approve withdrawal.",
      );
    } finally {
      actionLock.current = false;
      setPendingAction(null);
      setActionId(null);
    }
  };

  const handleReject = async (withdrawal) => {
    const adminNote = notes[withdrawal._id]?.trim() || "";

    if (actionLock.current) return;
    const confirmed = await confirm({
      title: "Reject withdrawal?",
      confirmLabel: "Reject withdrawal",
      variant: "danger",
      details: [
        { label: "Creator", value: withdrawal.creatorId?.name || "Creator" },
        { label: "Amount", value: formatCurrency(withdrawal.amount) },
        {
          label: "Destination",
          value:
            withdrawal.paymentDetails?.method === "UPI"
              ? withdrawal.paymentDetails.upiId
              : `Account ending ${withdrawal.paymentDetails?.accountNumber?.slice(-4) || "----"}`,
        },
      ],
      description:
        "Reject this withdrawal? The reserved balance will be restored to the creator.",
    });

    if (!confirmed) return;

    try {
      actionLock.current = true;
      setPendingAction("REJECT");
      setActionId(withdrawal._id);

      const response = await rejectWithdrawal(withdrawal._id, adminNote);

      toast.success("Withdrawal rejected and balance restored.");

      setWithdrawals((current) =>
        current.map((item) =>
          item._id === withdrawal._id
            ? {
                ...item,
                ...response.data.withdrawal,
                creatorId: item.creatorId,
              }
            : item,
        ),
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to reject withdrawal.",
      );
    } finally {
      actionLock.current = false;
      setPendingAction(null);
      setActionId(null);
    }
  };

  const handlePaid = async (withdrawal) => {
    if (actionLock.current) return;
    const confirmed = await confirm({
      title: "Mark withdrawal as paid?",
      confirmLabel: "Confirm payment sent",
      variant: "payment",
      details: [
        { label: "Creator", value: withdrawal.creatorId?.name || "Creator" },
        { label: "Amount", value: formatCurrency(withdrawal.amount) },
        {
          label: "Destination",
          value:
            withdrawal.paymentDetails?.method === "UPI"
              ? withdrawal.paymentDetails.upiId
              : `Account ending ${withdrawal.paymentDetails?.accountNumber?.slice(-4) || "----"}`,
        },
      ],
      description:
        "Confirm that this payout has actually been sent to the creator?",
    });

    if (!confirmed) return;

    try {
      actionLock.current = true;
      setPendingAction("PAID");
      setActionId(withdrawal._id);

      const response = await markWithdrawalPaid(
        withdrawal._id,
        notes[withdrawal._id] || "",
      );

      toast.success("Withdrawal marked as paid.");

      setWithdrawals((current) =>
        current.map((item) =>
          item._id === withdrawal._id
            ? {
                ...item,
                ...response.data.withdrawal,
                creatorId: item.creatorId,
              }
            : item,
        ),
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to mark withdrawal as paid.",
      );
    } finally {
      actionLock.current = false;
      setPendingAction(null);
      setActionId(null);
    }
  };

  if (isLoading) {
    return <SharedPageSkeleton label="Loading withdrawals…" variant="list" />;
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
      {/* Header */}

      <div>
        <h1 className="text-[32px] font-medium tracking-tight text-text-primary">
          Withdrawals
        </h1>

        <p className="mt-2 text-base text-text-tertiary">
          Review payout requests and track withdrawal settlement.
        </p>
      </div>

      <WithdrawalStats withdrawals={withdrawals} />

      {/* Filters */}

      <ListPanel
        title="Withdrawals"
        description="Review withdrawal requests and payment details."
        filters={
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative sm:w-56">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              />

              <input
                aria-label="Search records"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search creator..."
                className="h-10 w-full rounded-xl border border-card-border bg-transparent pl-9 pr-4 text-sm text-text-primary outline-none focus:border-brand-500"
              />
            </div>

            <select
              aria-label="Withdrawal status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-xl border border-card-border bg-card-background px-4 text-sm text-text-primary outline-none focus:border-brand-500"
            >
              <option value="ALL">All statuses</option>

              <option value="PENDING">Pending</option>

              <option value="APPROVED">Approved</option>

              <option value="REJECTED">Rejected</option>

              <option value="PAID">Paid</option>
            </select>
          </div>
        }
      >
        {/* Withdrawal List */}

        {filtered.length === 0 ? (
          <div className="">
            <EmptyState
              title="No withdrawals"
              description="No withdrawal requests match the selected filters."
            />
          </div>
        ) : (
          <ListTable
            columns={[
              "Creator",
              "Amount",
              "Method",
              "Requested",
              "Status",
              "Action",
            ]}
          >
            {filtered.map((withdrawal) => (
              <WithdrawalCard
                key={withdrawal._id}
                withdrawal={withdrawal}
                note={notes[withdrawal._id] || ""}
                setNote={(value) =>
                  setNotes((current) => ({
                    ...current,
                    [withdrawal._id]: value,
                  }))
                }
                isProcessing={actionId !== null}
                onApprove={handleApprove}
                onReject={handleReject}
                onPaid={handlePaid}
                pendingAction={
                  actionId === withdrawal._id ? pendingAction : null
                }
              />
            ))}
          </ListTable>
        )}
      </ListPanel>
    </div>
  );
}

function WithdrawalCard(props) {
  const { withdrawal } = props;
  return (
    <ExpandableListRow
      label="View / Review"
      cells={[
        <div key="creator">
          <p className="font-medium text-text-primary">
            {withdrawal.creatorId?.name || "Creator"}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            {withdrawal.creatorId?.email || "-"}
          </p>
        </div>,
        formatCurrency(withdrawal.amount),
        formatMethod(withdrawal.paymentDetails?.method),
        formatDate(withdrawal.createdAt),
        <StatusBadge key="status" status={withdrawal.status} />,
      ]}
    >
      <WithdrawalDetails {...props} />
    </ExpandableListRow>
  );
}

function WithdrawalDetails({
  withdrawal,
  note,
  setNote,
  isProcessing,
  pendingAction,
  onApprove,
  onReject,
  onPaid,
}) {
  const creator = withdrawal.creatorId;

  const payment = withdrawal.paymentDetails;

  return (
    <div className="rounded-2xl border border-card-border bg-card-background p-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_330px]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h2 className="font-semibold text-text-primary">
                {creator?.name || "Creator"}
              </h2>

              <p className="mt-1 text-xs text-text-tertiary">
                {creator?.email || "-"}
              </p>
            </div>

            <StatusBadge status={withdrawal.status} />
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Amount" value={formatCurrency(withdrawal.amount)} />

            <Detail label="Method" value={formatMethod(payment?.method)} />

            <Detail
              label="Requested"
              value={formatDate(withdrawal.createdAt)}
            />

            <Detail
              label="Paid"
              value={withdrawal.paidAt ? formatDate(withdrawal.paidAt) : "-"}
            />
          </div>

          <div className="mt-5 rounded-xl bg-background-gray-primary p-4">
            <p className="text-xs font-medium text-text-tertiary">
              Payment Details
            </p>

            {payment?.method === "UPI" ? (
              <p className="mt-2 text-sm text-text-primary">
                UPI: {payment.upiId || "-"}
              </p>
            ) : (
              <div className="mt-2 space-y-1 text-sm text-text-secondary">
                <p>Account: {payment?.accountName || "-"}</p>

                <p>Number: {payment?.accountNumber || "-"}</p>

                <p>IFSC: {payment?.ifsc || "-"}</p>
              </div>
            )}
          </div>

          {withdrawal.adminNote &&
            !["PENDING", "APPROVED"].includes(withdrawal.status) && (
              <div className="mt-4">
                <p className="text-xs text-text-tertiary">Admin Note</p>

                <p className="mt-1 text-sm text-text-secondary">
                  {withdrawal.adminNote}
                </p>
              </div>
            )}
        </div>

        {/* Actions */}

        <div>
          {["PENDING", "APPROVED"].includes(withdrawal.status) && (
            <div>
              <label className="text-xs font-medium text-text-tertiary">
                Admin Note
              </label>

              <textarea
                aria-label="Admin note"
                maxLength={2000}
                disabled={isProcessing}
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional processing note..."
                className="mt-2 w-full resize-none rounded-xl border border-card-border bg-transparent px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-500"
              />
            </div>
          )}

          {withdrawal.status === "PENDING" && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onReject(withdrawal)}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                aria-busy={pendingAction === "REJECT"}
              >
                {pendingAction === "REJECT" ? (
                  <>
                    <InlineSpinner /> Rejecting…
                  </>
                ) : (
                  <>
                    <X size={15} /> Reject
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onApprove(withdrawal)}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                aria-busy={pendingAction === "APPROVE"}
              >
                {pendingAction === "APPROVE" ? (
                  <>
                    <InlineSpinner /> Approving…
                  </>
                ) : (
                  <>
                    <Check size={15} /> Approve
                  </>
                )}
              </button>
            </div>
          )}

          {withdrawal.status === "APPROVED" && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onPaid(withdrawal)}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              aria-busy={pendingAction === "PAID"}
            >
              {pendingAction === "PAID" ? (
                <>
                  <InlineSpinner /> Marking paid…
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Mark as Paid
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WithdrawalStats({ withdrawals }) {
  const pending = withdrawals.filter((item) => item.status === "PENDING");

  const approved = withdrawals.filter((item) => item.status === "APPROVED");

  const paid = withdrawals.filter((item) => item.status === "PAID");

  const pendingAmount = pending.reduce(
    (total, item) => total + Number(item.amount || 0),
    0,
  );

  const stats = [
    {
      label: "Pending Requests",
      icon: Clock3,
      tone: "orange",
      value: pending.length,
    },

    {
      label: "Pending Amount",
      icon: WalletCards,
      tone: "blue",
      value: formatCurrency(pendingAmount),
    },

    {
      label: "Approved",
      icon: Check,
      tone: "purple",
      value: approved.length,
    },

    {
      label: "Paid",
      icon: CheckCircle2,
      tone: "green",
      value: paid.length,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {stats.map((item) => {
        return (
          <div
            key={item.label}
            className="rounded-2xl border border-card-border bg-card-background p-5"
          >
            <StatIcon icon={item.icon} tone={item.tone} />

            <p className="mt-6 text-2xl font-semibold text-text-primary">
              {item.value}
            </p>

            <p className="mt-1 text-sm text-text-tertiary">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-text-tertiary">{label}</p>

      <p className="mt-1 text-sm font-medium text-text-primary">{value}</p>
    </div>
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
