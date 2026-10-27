import Link from "next/link";

import { ArrowRight, Building2 } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

import EmptyState from "../shared/EmptyState";
import StatusBadge from "../shared/StatusBadge";

export default function BrandOnboarding({ brands = [] }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>New Brand Onboarding</CardTitle>

          <p className="mt-1 text-sm text-text-tertiary">
            Most recently registered Brand accounts.
          </p>
        </div>

        <Link
          href="/dashboard/users"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          View users
        </Link>
      </CardHeader>

      {brands.length === 0 ? (
        <EmptyState
          title="No brands yet"
          description="Newly registered Brand accounts will appear here."
        />
      ) : (
        <div className="divide-y divide-card-border">
          {brands.map((brand) => (
            <div
              key={brand._id}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background-gray-primary text-text-tertiary">
                  <Building2 size={17} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {brand.name}
                  </p>

                  <p className="mt-1 truncate text-xs text-text-tertiary">
                    {brand.email}
                  </p>

                  <p className="mt-1 text-xs text-text-tertiary">
                    Joined {formatDate(brand.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={brand.status} />

                <Link
                  href="/dashboard/users"
                  aria-label="View users"
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

function formatDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
