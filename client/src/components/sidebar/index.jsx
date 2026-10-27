"use client";

import { cn } from "@/utils/cn";
import BrandLogo from "@/components/brand-logo";

import useAuthStore from "@/store/authStore";

import Link from "next/link";

import { getNavData } from "./data";

import { CloseIcon, SidebarExpandedIcon, ThreeDots } from "./icon";

import NavItem from "./nav-item";

export default function Sidebar({
  isSidebarOpen,
  toggleSidebar,
  isMobileSheet = false,
  onItemClick,
}) {
  /*
  |--------------------------------------------------------------------------
  | LOGGED-IN USER
  |--------------------------------------------------------------------------
  */

  const user = useAuthStore((state) => state.user);

  /*
  |--------------------------------------------------------------------------
  | ROLE BASED NAVIGATION
  |--------------------------------------------------------------------------
  */

  const navData = getNavData(user?.role);

  /*
  |--------------------------------------------------------------------------
  | COLLAPSIBLE ITEMS
  |--------------------------------------------------------------------------
  |
  | We currently use simple COCREATE menu links.
  | Later, if we add child menu items, this state is already ready.
  |
  */

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* =========================================================
          HEADER
      ========================================================= */}

      <div
        className={cn(
          "flex items-center px-4 pt-7 text-text-primary",

          isSidebarOpen ? "justify-between" : "flex-col justify-center gap-4",
        )}
      >
        {/* Logo */}

        <Link href="/dashboard">
          <BrandLogo variant={isSidebarOpen ? "auto" : "icon"} />
        </Link>

        {/* Sidebar toggle */}

        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            "p-1.5 transition-colors",

            isMobileSheet
              ? "rounded-lg text-icon-tertiary hover:bg-background-gray-primary hover:text-text-primary"
              : "text-icon-tertiary hover:text-text-secondary",
          )}
          aria-label={isMobileSheet ? "Close sidebar" : "Toggle sidebar"}
        >
          {isMobileSheet ? <CloseIcon /> : <SidebarExpandedIcon />}
        </button>
      </div>

      {/* =========================================================
          NAVIGATION
      ========================================================= */}

      <nav
        className={cn(
          "scrollbar-thin flex-1 overflow-y-auto",

          isSidebarOpen ? "mt-7 space-y-6 px-4" : "mt-5 px-2",
        )}
      >
        <div>
          {navData.map((section) => (
            <div key={section.label}>
              {/* =================================================
                  SECTION LABEL
              ================================================= */}

              {isSidebarOpen ? (
                <p className="mt-6 mb-4 text-xs uppercase text-text-tertiary">
                  {section.label}
                </p>
              ) : (
                section.label && (
                  <span className="flex items-center justify-center pt-6 pb-4 text-icon-secondary">
                    <ThreeDots />
                  </span>
                )
              )}

              {/* =================================================
                  MENU ITEMS
              ================================================= */}

              <div
                className={cn(
                  "space-y-1",

                  !isSidebarOpen && "space-y-1.5",
                )}
              >
                {section.items.map((item) => (
                  <NavItem
                    key={item.title}
                    id={item.title}
                    icon={item.icon}
                    label={item.title}
                    href={item.url}
                    items={item.items}
                    collapsed={!isSidebarOpen}
                    onItemClick={onItemClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
