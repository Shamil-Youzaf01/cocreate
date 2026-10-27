"use client";

import { useState } from "react";
import useAuthStore from "@/store/authStore";
import useNotifications from "@/hooks/use-notifications";
import NotificationList from "@/components/notification-list";
import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";
import { PageSkeleton } from "@/components/loading-state";
import { Button } from "@/components/tailgrids/core/button";

export default function NotificationsPage() {
  const userId = useAuthStore((state) => state.user?._id || state.user?.id);
  return userId ? (
    <NotificationInbox key={userId} />
  ) : (
    <PageSkeleton label="Loading notifications..." />
  );
}

function NotificationInbox() {
  const [page, setPage] = useState(1);
  const inbox = useNotifications(page);
  return (
    <div className="space-y-5 px-2 py-6 lg:px-6">
      <div>
        <h1 className="text-[32px] font-medium tracking-tight text-text-primary">
          Notifications
        </h1>
        <p className="mt-2 text-base text-text-tertiary">
          Your campaign, review, and payout updates in one place.
        </p>
      </div>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Your updates</CardTitle>
            <p className="mt-1 text-sm text-text-tertiary">
              {inbox.unreadCount} unread notifications
            </p>
          </div>
          <Button
            type="button"
            appearance="outline"
            isDisabled={
              !inbox.unreadCount ||
              inbox.busy ||
              inbox.loading ||
              inbox.refreshing
            }
            isPending={inbox.markingAll}
            pendingLabel="Marking as read..."
            onPress={inbox.readAll}
            className="rounded-xl text-brand-500 disabled:opacity-40"
          >
            Mark all as read
          </Button>
        </CardHeader>
        <span role="status" className="sr-only">
          {inbox.markingAll ? "Marking notifications as read..." : ""}
        </span>
        <NotificationList inbox={inbox} />
        <div className="flex items-center justify-between border-t border-card-border px-5 py-4 text-sm">
          <button
            type="button"
            disabled={page === 1 || inbox.loading || inbox.busy}
            onClick={() => setPage((value) => value - 1)}
            className="font-medium text-brand-500 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-text-tertiary">Page {page}</span>
          <button
            type="button"
            disabled={
              !inbox.pagination?.hasNextPage || inbox.loading || inbox.busy
            }
            onClick={() => setPage((value) => value + 1)}
            className="font-medium text-brand-500 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </Card>
    </div>
  );
}
