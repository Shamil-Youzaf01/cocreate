"use client";
import {
  PageSkeleton as SharedPageSkeleton,
  InlineSpinner,
} from "@/components/loading-state";
import { useConfirm } from "@/components/confirm-dialog";

import {
  ListPanel,
  ListTable,
} from "@/app/dashboard/_components/shared/ListView";
import { TableRow, TableCell } from "@/components/tailgrids/core/table";

import StatIcon from "@/app/dashboard/_components/shared/StatIcon";

import { useEffect, useRef, useMemo, useState } from "react";

import { Ban, Search, Users, Building2, UserRoundMinus } from "lucide-react";

import useAuthStore from "@/store/authStore";

import toast from "react-hot-toast";

import { getAdminUsers, updateUserStatus } from "@/services/admin.service";

import StatusBadge from "@/app/dashboard/_components/shared/StatusBadge";
import EmptyState from "@/app/dashboard/_components/shared/EmptyState";

export default function AdminUsersPage() {
  const role = useAuthStore((state) => state.user?.role);
  if (role !== "ADMIN")
    return <p className="p-6">User management is available to Admins.</p>;
  return <AdminUsers />;
}

function AdminUsers() {
  const [loadAttempt, setLoadAttempt] = useState(0);

  const confirm = useConfirm();
  const actionLock = useRef(false);
  const [users, setUsers] = useState([]);

  const [pagination, setPagination] = useState(null);

  const [search, setSearch] = useState("");

  const [role, setRole] = useState("ALL");

  const [status, setStatus] = useState("ALL");

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [actionId, setActionId] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Fetch Users
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
        const allUsers = [];
        let page = 1;
        let response;
        do {
          response = await getAdminUsers(
            { page, limit: 100 },
            { signal: controller.signal },
          );
          allUsers.push(...(response.data?.users || []));
          page += 1;
        } while (
          response.pagination?.hasNextPage &&
          !controller.signal.aborted
        );
        if (controller.signal.aborted) return;
        setUsers(allUsers.filter((user) => user.role !== "ADMIN"));
        setPagination(response.pagination || null);
      } catch (error) {
        if (!controller.signal.aborted) {
          const message =
            error.response?.data?.message || "Unable to load users.";
          setError(message);
          toast.error(message, { id: "admin-users-load-error" });
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
  | Frontend Filter
  |--------------------------------------------------------------------------
  |
  | Your backend already supports filtering/search/pagination.
  | For now we keep this responsive locally.
  |--------------------------------------------------------------------------
  */

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = search.toLowerCase();

      const matchesSearch =
        !search ||
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query);

      const matchesRole = role === "ALL" || user.role === role;

      const matchesStatus = status === "ALL" || user.status === status;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, role, status]);

  /*
  |--------------------------------------------------------------------------
  | Status Change
  |--------------------------------------------------------------------------
  */

  const handleStatusChange = async (user, nextStatus) => {
    if (user.status === nextStatus) {
      return;
    }

    const messages = {
      ACTIVE: "Reactivate this user account?",

      SUSPENDED: "Suspend this user? Their active sessions will be revoked.",

      BANNED: "Ban this user? Their active sessions will be revoked.",
    };

    if (actionLock.current) return;
    const confirmed = await confirm({
      title:
        nextStatus === "ACTIVE"
          ? "Reactivate this user?"
          : nextStatus === "SUSPENDED"
            ? "Suspend this user?"
            : "Ban this user?",
      confirmLabel:
        nextStatus === "ACTIVE"
          ? "Reactivate user"
          : nextStatus === "SUSPENDED"
            ? "Suspend user"
            : "Ban user",
      details: [
        { label: "User", value: user.name || user.email },
        { label: "Email", value: user.email },
      ],
      variant: nextStatus === "ACTIVE" ? "default" : "danger",
      description: messages[nextStatus],
    });

    if (!confirmed) {
      return;
    }

    try {
      actionLock.current = true;
      setActionId(user._id);

      const response = await updateUserStatus(user._id, nextStatus);

      toast.success(`User status changed to ${formatText(nextStatus)}.`);

      setUsers((current) =>
        current.map((item) =>
          item._id === user._id ? { ...item, ...response.data.user } : item,
        ),
      );
    } catch (error) {
      console.error("User status update failed:", error);

      toast.error(error.response?.data?.message || "Unable to update user.");
    } finally {
      actionLock.current = false;
      setActionId(null);
    }
  };

  if (isLoading) {
    return <SharedPageSkeleton label="Loading users…" variant="list" />;
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
          Users
        </h1>

        <p className="mt-2 text-base text-text-tertiary">
          Review Creator and Brand accounts and manage platform access.
        </p>
      </div>

      {/* Stats */}

      <UserStats users={users} />

      {/* Filters */}

      <ListPanel
        title="Users"
        description="Manage user accounts and access."
        filters={
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative sm:w-56">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              />

              <input
                aria-label="Search records"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or email..."
                className="h-10 w-full rounded-xl border border-card-border bg-transparent pl-9 pr-4 text-sm text-text-primary outline-none focus:border-brand-500"
              />
            </div>

            <select
              aria-label="User status or filter"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="h-10 rounded-xl border border-card-border bg-card-background px-4 text-sm text-text-primary outline-none focus:border-brand-500"
            >
              <option value="ALL">All roles</option>

              <option value="CREATOR">Creators</option>

              <option value="BRAND">Brands</option>
            </select>

            <select
              aria-label="User status or filter"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-xl border border-card-border bg-card-background px-4 text-sm text-text-primary outline-none focus:border-brand-500"
            >
              <option value="ALL">All statuses</option>

              <option value="ACTIVE">Active</option>

              <option value="SUSPENDED">Suspended</option>

              <option value="BANNED">Banned</option>
            </select>
          </div>
        }
      >
        {/* User List */}

        {filteredUsers.length === 0 ? (
          <div className="">
            <EmptyState
              title="No users found"
              description="Try changing your search or filters."
            />
          </div>
        ) : (
          <div className="">
            <div className="overflow-x-auto">
              <ListTable
                columns={["User", "Role", "Status", "Joined", "Moderation"]}
              >
                {filteredUsers.map((user) => (
                  <UserRow
                    key={user._id}
                    user={user}
                    isProcessing={actionId !== null}
                    onStatusChange={handleStatusChange}
                    isBusy={actionId === user._id}
                  />
                ))}
              </ListTable>
            </div>

            {pagination && (
              <div className="border-t border-card-border px-5 py-3 text-xs text-text-tertiary">
                Showing {users.length} user
                {users.length === 1 ? "" : "s"}
              </div>
            )}
          </div>
        )}
      </ListPanel>
    </div>
  );
}

function UserRow({ user, isProcessing, isBusy, onStatusChange }) {
  return (
    <TableRow className="transition hover:bg-background-gray-primary">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background-gray-primary font-medium text-text-secondary">
            {getInitials(user.name)}
          </div>

          <div className="min-w-0">
            <p className="font-medium text-text-primary">
              {user.name || "User"}
            </p>

            <p className="mt-1 text-xs text-text-tertiary">{user.email}</p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <span className="text-sm text-text-secondary">
          {formatText(user.role)}
        </span>
      </TableCell>

      <TableCell>
        <StatusBadge status={user.status} />
      </TableCell>

      <TableCell>{formatDate(user.createdAt)}</TableCell>

      <TableCell>
        <div className="flex items-center justify-end gap-2">
          {isBusy && (
            <span
              role="status"
              className="inline-flex items-center gap-2 text-xs text-text-tertiary"
            >
              <InlineSpinner /> Updating…
            </span>
          )}
          <select
            aria-label="User status or filter"
            aria-busy={isBusy}
            value={user.status}
            disabled={isProcessing || user.role === "ADMIN"}
            onChange={(event) => onStatusChange(user, event.target.value)}
            className="h-9 rounded-lg border border-card-border bg-card-background px-3 text-xs text-text-primary outline-none focus:border-brand-500 disabled:opacity-50"
          >
            <option value="ACTIVE">Active</option>

            <option value="SUSPENDED">Suspend</option>

            <option value="BANNED">Ban</option>
          </select>
        </div>
      </TableCell>
    </TableRow>
  );
}

function UserStats({ users }) {
  const creators = users.filter((user) => user.role === "CREATOR").length;

  const brands = users.filter((user) => user.role === "BRAND").length;

  const suspended = users.filter((user) => user.status === "SUSPENDED").length;

  const banned = users.filter((user) => user.status === "BANNED").length;

  const stats = [
    {
      label: "Creators",
      icon: Users,
      tone: "blue",
      value: creators,
    },

    {
      label: "Brands",
      icon: Building2,
      tone: "purple",
      value: brands,
    },

    {
      label: "Suspended",
      icon: UserRoundMinus,
      tone: "orange",
      value: suspended,
    },

    {
      label: "Banned",
      icon: Ban,
      tone: "red",
      value: banned,
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

function getInitials(name = "") {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatText(value) {
  if (!value) return "-";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
