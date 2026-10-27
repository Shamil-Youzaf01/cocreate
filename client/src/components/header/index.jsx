"use client";
import { useState } from "react";
import { MenuIcon } from "./icons";
import { ThreeDots } from "@/components/sidebar/icon";
import { cn } from "@/utils/cn";
import ThemeToggle from "./theme-toggle";
import { UserProfileButton } from "./user-profile";
import { NotificationsButton } from "./notifications";
import SearchBar from "./searchbar";
import BrandLogo from "@/components/brand-logo";
import Link from "next/link";

export default function Header({ onMenuClick }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-card-border bg-card-background p-4">
      <div className="flex items-center justify-between xl:hidden">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
          className="p-2 text-icon-primary"
        >
          <MenuIcon />
        </button>
        <Link href="/dashboard">
          <BrandLogo />
        </Link>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-label="Toggle quick access"
          aria-expanded={expanded}
          aria-controls="header-actions"
          className="p-2 text-icon-primary"
        >
          <ThreeDots />
        </button>
      </div>
      <div
        id="header-actions"
        className={cn(
          "items-center justify-between gap-3 xl:flex",
          expanded ? "flex flex-wrap pt-4 xl:pt-0" : "hidden",
        )}
      >
        <SearchBar />
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <NotificationsButton />
          <UserProfileButton />
        </div>
      </div>
    </header>
  );
}
