"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, ClipboardList, Flag, Megaphone, Wallet } from "lucide-react";
import LoadingState, { InlineSpinner } from "@/components/loading-state";

const icons = {
  APPLICATION: ClipboardList,
  SUBMISSION: ClipboardList,
  WITHDRAWAL: Wallet,
  REWARD: Wallet,
  REPORT: Flag,
  DISPUTE: Flag,
  CAMPAIGN: Megaphone,
};

export default function NotificationList({ inbox, onNavigate }) {
  const router = useRouter();
  return (
    <div>
      {inbox.error && (
        <div
          role="alert"
          className="m-3 rounded-xl bg-red-50 p-3 text-sm text-red-600"
        >
          {inbox.error}
          <button
            type="button"
            disabled={inbox.loading || inbox.refreshing}
            onClick={inbox.refresh}
            className="ml-2 font-medium underline disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      )}
      {inbox.refreshing && (
        <LoadingState compact label="Updating notifications..." />
      )}
      {inbox.loading ? (
        <LoadingState label="Loading notifications..." />
      ) : !inbox.notifications.length && !inbox.error ? (
        <div className="px-5 py-12 text-center">
          <Bell className="mx-auto mb-3 text-text-tertiary" size={28} />
          <p className="font-medium text-text-primary">No notifications yet</p>
          <p className="mt-2 text-sm text-text-tertiary">
            Campaign, review, and payout updates will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-card-border">
          {inbox.notifications.map((notification) => {
            const Icon = icons[notification.type] || Bell;
            return (
              <li key={notification._id}>
                <Link
                  href={
                    /^\/dashboard(?:\/|$)/.test(notification.href)
                      ? notification.href
                      : "/dashboard/notifications"
                  }
                  aria-disabled={inbox.busy}
                  onClick={async (event) => {
                    if (
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey ||
                      event.button !== 0
                    )
                      return;
                    event.preventDefault();
                    if (inbox.busy) return;
                    if (!(await inbox.read(notification))) return;
                    if (!/^\/dashboard(?:\/|$)/.test(notification.href)) return;
                    onNavigate?.();
                    router.push(notification.href);
                  }}
                  className={`flex w-full gap-3 px-5 py-4 text-left transition hover:bg-background-gray-primary aria-disabled:opacity-60 ${notification.readAt ? "" : "bg-brand-500/5"}`}
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${notification.readAt ? "bg-background-gray-secondary text-text-tertiary" : "bg-brand-50 text-brand-500"}`}
                  >
                    {inbox.pendingId === notification._id ? (
                      <InlineSpinner className="size-5" />
                    ) : (
                      <Icon size={19} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-text-primary">
                        {notification.title}
                      </span>
                      {!notification.readAt && (
                        <span
                          className="size-2 shrink-0 rounded-full bg-brand-500"
                          aria-label="Unread"
                        />
                      )}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-text-secondary">
                      {notification.message}
                    </span>
                    {inbox.pendingId === notification._id && (
                      <span
                        role="status"
                        className="mt-1 block text-xs text-brand-500"
                      >
                        Opening notification...
                      </span>
                    )}
                    <time
                      dateTime={notification.createdAt}
                      className="mt-2 block text-xs text-text-tertiary"
                    >
                      {new Date(notification.createdAt).toLocaleString(
                        "en-IN",
                        { dateStyle: "medium", timeStyle: "short" },
                      )}
                    </time>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
