"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/tailgrids/core/button";
import { OverlayWrapper } from "@/components/tailgrids/core/overlay";
import { Popover } from "@/components/tailgrids/core/popover";
import useAuthStore from "@/store/authStore";
import useNotifications from "@/hooks/use-notifications";
import NotificationList from "@/components/notification-list";
import { InlineSpinner } from "@/components/loading-state";

export function NotificationsButton() {
  const userId = useAuthStore((state) => state.user?._id || state.user?.id);
  return userId ? <NotificationMenu key={userId} /> : null;
}

function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const inbox = useNotifications();
  return (
    <OverlayWrapper
      isOpen={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) inbox.refresh();
      }}
    >
      <Button
        iconOnly
        appearance="outline"
        aria-label={`Notifications${inbox.unreadCount ? `, ${inbox.unreadCount} unread` : ""}`}
        className="relative size-10 rounded-lg border border-card-border bg-card-background text-icon-primary shadow-xs"
      >
        <Bell size={20} />
        {inbox.unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {inbox.unreadCount > 99 ? "99+" : inbox.unreadCount}
          </span>
        )}
      </Button>
      <Popover
        placement="bottom end"
        aria-label="Notifications"
        className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-card-border bg-card-background p-0 shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-card-border p-5">
          <div>
            <h2 className="font-semibold text-text-primary">Notifications</h2>
            <p className="mt-1 text-xs text-text-tertiary">
              {inbox.unreadCount
                ? `${inbox.unreadCount} unread`
                : "You're all caught up"}
            </p>
          </div>
          <button
            type="button"
            disabled={
              !inbox.unreadCount ||
              inbox.busy ||
              inbox.loading ||
              inbox.refreshing
            }
            aria-busy={inbox.markingAll || undefined}
            onClick={inbox.readAll}
            className="inline-flex items-center gap-2 text-xs font-medium text-brand-500 hover:text-brand-600 disabled:opacity-40"
          >
            {inbox.markingAll && <InlineSpinner />}
            {inbox.markingAll ? "Marking as read..." : "Mark all read"}
          </button>
        </div>
        <span role="status" className="sr-only">
          {inbox.markingAll ? "Marking notifications as read..." : ""}
        </span>
        <div className="max-h-[min(26rem,60vh)] overflow-y-auto">
          <NotificationList inbox={inbox} onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t border-card-border p-4 text-center">
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            View all notifications
          </Link>
        </div>
      </Popover>
    </OverlayWrapper>
  );
}
