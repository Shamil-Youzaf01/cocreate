import Link from "next/link";

export function isDashboardRouteAvailable(href) {
  return (
    href === "/dashboard/notifications" ||
    href === "/dashboard/users" ||
    href === "/dashboard" ||
    href === "/dashboard/reports" ||
    href === "/dashboard/disputes" ||
    href === "/dashboard/profile" ||
    href === "/dashboard/applications" ||
    href === "/dashboard/campaigns/new" ||
    href === "/dashboard/campaigns" ||
    href === "/dashboard/withdrawals" ||
    href === "/dashboard/wallet" ||
    href === "/dashboard/submissions" ||
    /^\/dashboard\/campaigns\/[a-f\d]{24}(?:\/(?:edit|applications|submissions))?$/i.test(
      href,
    )
  );
}

export default function DashboardLink({ href, children, className, ...props }) {
  if (isDashboardRouteAvailable(href))
    return (
      <Link href={href} className={className} {...props}>
        {children}
      </Link>
    );
  return (
    <span
      aria-disabled="true"
      title="This page is not available yet"
      className={`${className || ""} cursor-not-allowed opacity-50`}
    >
      {children}
      <span className="sr-only"> (not available yet)</span>
    </span>
  );
}
