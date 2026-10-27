"use client";
import toast from "react-hot-toast";

import { LogoutIcon, UserCircleIcon } from "@/components/header/icons";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/tailgrids/core/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSection,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";

import useAuthStore from "@/store/authStore";
import { logout } from "@/services/auth.service";

import { ChevronDown as AltArrowDownIcon } from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { InlineSpinner } from "@/components/loading-state";

export function UserProfileButton() {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const logoutLock = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const handleLogout = async () => {
    if (logoutLock.current) return;
    logoutLock.current = true;

    try {
      setIsLoggingOut(true);
      setLogoutError("");

      // Backend deletes Redis session
      // and clears the refresh-token cookie.
      await logout();
      clearAuth();
      toast.success("You have been logged out.");
      router.replace("/login");
    } catch (error) {
      const message =
        error.response?.data?.message || "Unable to log out. Please try again.";
      setLogoutError(message);
      toast.error(message);
      logoutLock.current = false;
      setIsLoggingOut(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | User display values
  |--------------------------------------------------------------------------
  */

  const userName = user?.name || "COCREATE User";
  const userEmail = user?.email || "";
  const userRole = formatRole(user?.role);

  const avatarUrl = user?.avatarUrl;

  const initials = getInitials(userName);

  return (
    <div>
      {logoutError && (
        <p role="alert" className="max-w-64 text-sm text-red-600">
          {logoutError}
        </p>
      )}
      <DropdownMenu>
        {/* =========================================================
          TRIGGER
      ========================================================= */}

        <DropdownMenuTrigger
          isDisabled={isLoggingOut}
          aria-busy={isLoggingOut || undefined}
          aria-label={isLoggingOut ? "Logging out..." : "Open user menu"}
          className="group flex items-center gap-2.5 rounded-lg border-0 p-0 transition-all outline-none focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20 focus-visible:ring-offset-1"
        >
          <Avatar>
            {avatarUrl && (
              <AvatarImage
                src={avatarUrl}
                alt={userName}
                className="size-10 rounded-lg"
              />
            )}

            <AvatarFallback className="rounded-lg border border-border-secondary-alt bg-background-gray-secondary_alt">
              {initials}
            </AvatarFallback>
          </Avatar>

          <span className="hidden text-sm leading-5 font-medium text-text-primary lg:block">
            {userName}
          </span>

          {isLoggingOut ? (
            <InlineSpinner className="text-brand-500" />
          ) : (
            <AltArrowDownIcon className="hidden text-icon-tertiary transition-transform duration-200 group-aria-expanded:-rotate-180 lg:block" />
          )}
        </DropdownMenuTrigger>

        {/* =========================================================
          DROPDOWN
      ========================================================= */}

        <DropdownMenuContent
          placement="bottom end"
          className="w-70 overflow-hidden p-0 shadow-3xl"
        >
          {/* =======================================================
            USER INFO
        ======================================================= */}

          <DropdownMenuHeader className="flex w-full items-center justify-start gap-3 border-b border-border-secondary-alt px-4 py-3">
            <Avatar size="md">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}

              <AvatarFallback className="border border-border-secondary-alt bg-background-gray-secondary_alt">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex flex-col">
              <span className="truncate text-sm font-medium text-text-primary">
                {userName}
              </span>

              {userEmail && (
                <span className="truncate text-xs text-text-tertiary">
                  {userEmail}
                </span>
              )}

              {userRole && (
                <span className="mt-0.5 text-xs font-medium text-brand-500">
                  {userRole}
                </span>
              )}
            </div>
          </DropdownMenuHeader>

          {/* =======================================================
            PROFILE
        ======================================================= */}

          <DropdownMenuSection className="p-1.5">
            <DropdownMenuItem
              href="/dashboard/profile"
              className="cursor-pointer px-3 py-2.5"
              render={(domProps) =>
                "href" in domProps ? (
                  <Link {...domProps} />
                ) : (
                  <div {...domProps} />
                )
              }
            >
              <span className="shrink-0 text-icon-secondary group-hover:text-text-primary">
                <UserCircleIcon />
              </span>

              <span className="leading-5 font-medium">View profile</span>
            </DropdownMenuItem>
          </DropdownMenuSection>

          <DropdownMenuSeparator />

          {/* =======================================================
            LOGOUT
        ======================================================= */}

          <DropdownMenuItem
            onAction={handleLogout}
            isDisabled={isLoggingOut}
            className="m-1.5 w-auto cursor-pointer px-3 py-2.5"
          >
            <span className="text-icon-secondary group-hover:text-text-primary">
              {isLoggingOut ? <InlineSpinner /> : <LogoutIcon />}
            </span>

            <span className="leading-5">
              {isLoggingOut ? "Logging out..." : "Logout"}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isLoggingOut && (
        <span role="status" className="sr-only">
          Logging out...
        </span>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Role formatter
|--------------------------------------------------------------------------
*/

function formatRole(role) {
  switch (role) {
    case "CREATOR":
      return "Creator";

    case "BRAND":
      return "Brand";

    case "ADMIN":
      return "Administrator";

    default:
      return "";
  }
}

/*
|--------------------------------------------------------------------------
| Avatar initials
|--------------------------------------------------------------------------
*/

function getInitials(name) {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
