"use client";

import { useEffect, useMemo } from "react";

import { usePathname, useRouter } from "next/navigation";

import useAuthStore from "@/store/authStore";
import LoadingState from "@/components/loading-state";

/*
|--------------------------------------------------------------------------
| Route Permissions
|--------------------------------------------------------------------------
*/

const permissions = {
  CREATOR: [
    "/dashboard",

    "/dashboard/notifications",

    "/dashboard/campaigns",

    "/dashboard/applications",

    "/dashboard/submissions",

    "/dashboard/wallet",

    "/dashboard/withdrawals",

    "/dashboard/reports",

    "/dashboard/disputes",

    "/dashboard/profile",
  ],

  BRAND: [
    "/dashboard",

    "/dashboard/notifications",

    "/dashboard/campaigns",

    "/dashboard/applications",

    "/dashboard/submissions",

    "/dashboard/reports",

    "/dashboard/disputes",

    "/dashboard/profile",
  ],

  ADMIN: [
    "/dashboard",

    "/dashboard/notifications",

    "/dashboard/users",

    "/dashboard/campaigns",

    "/dashboard/withdrawals",

    "/dashboard/reports",

    "/dashboard/disputes",
  ],
};

/*
|--------------------------------------------------------------------------
| Explicitly Restricted Child Routes
|--------------------------------------------------------------------------
|
| Some routes share a parent route between roles.
|
| Example:
|
| /dashboard/campaigns
|
| Creator + Brand + Admin use it.
|
| But:
|
| /dashboard/campaigns/new
|
| Brand only.
|--------------------------------------------------------------------------
*/

const specificRoutes = [
  {
    pattern: /^\/dashboard\/campaigns\/new\/?$/,

    roles: ["BRAND"],
  },

  {
    pattern: /^\/dashboard\/campaigns\/[^/]+\/edit\/?$/,

    roles: ["BRAND"],
  },

  {
    pattern: /^\/dashboard\/campaigns\/[^/]+\/applications\/?$/,

    roles: ["BRAND"],
  },

  {
    pattern: /^\/dashboard\/campaigns\/[^/]+\/submissions\/?$/,

    roles: ["BRAND"],
  },

  {
    pattern: /^\/dashboard\/submissions\/new\/?$/,

    roles: ["CREATOR"],
  },

  {
    pattern: /^\/dashboard\/submissions\/[^/]+\/?$/,

    roles: ["CREATOR"],
  },

  {
    pattern: /^\/dashboard\/wallet\/?$/,

    roles: ["CREATOR"],
  },

  {
    pattern: /^\/dashboard\/users\/?$/,

    roles: ["ADMIN"],
  },
];

export default function DashboardRouteGuard({ children }) {
  const pathname = usePathname();

  const router = useRouter();

  const user = useAuthStore((state) => state.user);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isLoading = useAuthStore((state) => state.isLoading);

  const isAllowed = useMemo(() => {
    if (!user) {
      return false;
    }

    /*
      |--------------------------------------------------------------------------
      | Exact / Special Rules First
      |--------------------------------------------------------------------------
      */

    const specificRule = specificRoutes.find((rule) =>
      rule.pattern.test(pathname),
    );

    if (specificRule) {
      return specificRule.roles.includes(user.role);
    }

    /*
      |--------------------------------------------------------------------------
      | Base Permission
      |--------------------------------------------------------------------------
      */

    const roleRoutes = permissions[user.role] || [];

    return roleRoutes.some((route) => {
      if (route === "/dashboard") {
        return pathname === "/dashboard";
      }

      return pathname === route || pathname.startsWith(`${route}/`);
    });
  }, [pathname, user]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace("/login");

      return;
    }

    if (!isAllowed) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, isAllowed, router]);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (isLoading) {
    return (
      <LoadingState
        label="Loading your workspace..."
        className="min-h-[60vh]"
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Unauthorized
  |--------------------------------------------------------------------------
  */

  if (!isAuthenticated || !user || !isAllowed) {
    return (
      <LoadingState
        label="Opening your dashboard..."
        className="min-h-[60vh]"
      />
    );
  }

  return children;
}
