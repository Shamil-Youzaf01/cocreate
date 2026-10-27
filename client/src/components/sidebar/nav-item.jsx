"use client";

import {
  Root as Collapsible,
  Content as CollapsibleContent,
  Trigger as CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import {
  Provider as TooltipProvider,
  Root as Tooltip,
  Content as TooltipContent,
  Trigger as TooltipTrigger,
  Portal as TooltipPortal,
} from "@radix-ui/react-tooltip";
import { cn } from "@/utils/cn";
import { ChevronUp as AltArrowUpIcon } from "lucide-react";
import Link from "@/components/dashboard-link";
import { usePathname } from "next/navigation";

import { isPathActive } from "./utils";

export default function NavItem({
  id,
  icon,
  label,
  href,
  items,
  collapsed,
  onItemClick,
}) {
  const pathname = usePathname();

  const isActive = href ? isPathActive(href, pathname) : false;

  const hasActiveChild = items?.some(
    (item) => item.url && isPathActive(item.url, pathname),
  );

  // Collapsed: icon-only button centered, no dropdown
  if (collapsed) {
    return (
      <div className="flex justify-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={href ?? items?.[0]?.url ?? "#"}
                aria-label={label}
                onClick={onItemClick}
                className={cn(
                  "flex items-center justify-center rounded-lg px-3 py-2.5",
                  isActive || hasActiveChild
                    ? "bg-sidebar-navigation-nav-item-nav-hover-background text-icon-primary"
                    : "text-icon-tertiary transition-colors duration-200 hover:bg-sidebar-navigation-nav-item-nav-hover-background hover:text-icon-primary",
                )}
              >
                {icon}
              </Link>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent
                side="right"
                sideOffset={8}
                className="z-50 rounded-lg bg-text-primary px-3 py-2 text-sm text-background-white-primary"
              >
                <p>{label}</p>
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Expanded: with sub-items → collapsible
  if (items && items.length > 0) {
    return (
      <Collapsible
        id={id}
        defaultOpen={Boolean(hasActiveChild)}
        className="border-none bg-transparent data-[state=open]:pb-0!"
      >
        <CollapsibleTrigger
          className={cn(
            "group/collapsible flex w-full items-center justify-between gap-3 rounded-lg border-none bg-transparent px-3 py-2 text-sm font-medium sm:px-3 sm:py-2",
            hasActiveChild
              ? "bg-sidebar-navigation-nav-item-nav-hover-background text-text-primary"
              : "text-text-secondary transition-colors duration-200 hover:bg-sidebar-navigation-nav-item-nav-hover-background hover:text-text-primary",
          )}
        >
          <div className="flex flex-1 items-center gap-3">
            <span
              className={cn(
                hasActiveChild
                  ? "text-icon-primary"
                  : "text-icon-tertiary transition-colors duration-200 group-hover/collapsible:text-icon-primary",
              )}
            >
              {icon}
            </span>
            <span>{label}</span>
          </div>

          <AltArrowUpIcon className="rotate-180 text-icon-tertiary duration-200 group-data-[state=open]/collapsible:rotate-0" />
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-1 pr-0 data-[state=open]:mt-2">
          {items.map((item) => {
            const isChildActive = item.url
              ? isPathActive(item.url, pathname)
              : false;

            return (
              <div key={item.title} className="px-0">
                <Link
                  href={item.url ?? "#"}
                  onClick={onItemClick}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isChildActive
                      ? "bg-sidebar-navigation-nav-item-nav-hover-background text-text-primary"
                      : "text-text-secondary hover:bg-sidebar-navigation-nav-item-nav-hover-background hover:text-text-primary",
                  )}
                >
                  {item.title}
                </Link>
              </div>
            );
          })}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Expanded: simple link
  return (
    href && (
      <Link
        href={href}
        onClick={onItemClick}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-navigation-nav-item-nav-hover-background text-text-primary"
            : "text-text-secondary hover:bg-sidebar-navigation-nav-item-nav-hover-background hover:text-text-primary",
        )}
      >
        <span className="text-icon-tertiary">{icon}</span>
        <span>{label}</span>
      </Link>
    )
  );
}
