"use client";

import { SearchIcon } from "@/components/header/icons";
import { getNavData } from "@/components/sidebar/data";
import { isDashboardRouteAvailable } from "@/components/dashboard-link";
import useAuthStore from "@/store/authStore";

import { useRouter } from "next/navigation";

import { useEffect, useMemo, useRef, useState } from "react";

export default function SearchBar() {
  const router = useRouter();

  const role = useAuthStore((state) => state.user?.role);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Build searchable pages
  |--------------------------------------------------------------------------
  */

  const pages = useMemo(() => {
    const result = [];

    getNavData(role).forEach((section) => {
      const sectionLabel = section.label || "Pages";

      section.items.forEach((item) => {
        if (isDashboardRouteAvailable(item.url)) {
          result.push({
            id: item.url,
            title: item.title,
            section: sectionLabel,
            url: item.url,
            icon: item.icon,
          });
        }

        if (item.items && item.items.length > 0) {
          item.items.forEach((subItem) => {
            if (isDashboardRouteAvailable(subItem.url)) {
              result.push({
                id: subItem.url,
                title: subItem.title,
                parentTitle: item.title,
                section: sectionLabel,
                url: subItem.url,
                icon: item.icon,
              });
            }
          });
        }
      });
    });

    return result;
  }, [role]);

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return pages.slice(0, 6);
    }

    return pages
      .filter((page) => {
        const searchable = [
          page.title,
          page.parentTitle,
          page.section,
          page.url,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(value);
      })
      .slice(0, 8);
  }, [query, pages]);

  /*
  |--------------------------------------------------------------------------
  | Group results
  |--------------------------------------------------------------------------
  */

  const groupedResults = useMemo(() => {
    return results.reduce((groups, page) => {
      if (!groups[page.section]) {
        groups[page.section] = [];
      }

      groups[page.section].push(page);

      return groups;
    }, {});
  }, [results]);

  /*
  |--------------------------------------------------------------------------
  | Ctrl / Cmd + K
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();

        inputRef.current?.focus();

        setOpen(true);
      }

      if (event.key === "Escape") {
        setOpen(false);

        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Close when clicking outside
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Select Result
  |--------------------------------------------------------------------------
  */

  const handleSelect = (url) => {
    setQuery("");
    setOpen(false);

    router.push(url);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-[480px]">
      {/* Search Input */}

      <div
        className={`
          flex h-11 w-full items-center gap-3
          rounded-xl border
          bg-background-gray-primary/60
          px-3.5
          transition-all
          ${
            open
              ? "border-input-primary-focus-border bg-card-background ring-4 ring-input-primary-focus-border/10"
              : "border-card-border hover:border-input-primary-focus-border/50"
          }
        `}
      >
        <span className="shrink-0 text-icon-tertiary">
          <SearchIcon />
        </span>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);

            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search dashboard..."
          className="
            min-w-0 flex-1
            bg-transparent
            text-sm text-text-primary
            outline-none
            placeholder:text-text-tertiary
            [&::-webkit-search-cancel-button]:appearance-none
          "
        />

        {!query && (
          <div className="hidden shrink-0 items-center gap-1 md:flex">
            <kbd className="rounded-md border border-card-border bg-card-background px-1.5 py-1 text-[10px] font-medium text-text-tertiary shadow-xs">
              Ctrl
            </kbd>

            <kbd className="rounded-md border border-card-border bg-card-background px-1.5 py-1 text-[10px] font-medium text-text-tertiary shadow-xs">
              K
            </kbd>
          </div>
        )}

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="
              flex size-7 shrink-0
              items-center justify-center
              rounded-md
              text-xs text-text-tertiary
              transition-colors
              hover:bg-background-gray-secondary
              hover:text-text-primary
            "
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown */}

      {open && (
        <div
          className="
            absolute left-0 top-[calc(100%+8px)]
            z-50
            w-full
            overflow-hidden
            rounded-xl
            border border-card-border
            bg-card-background
            shadow-xl
          "
        >
          {results.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-background-gray-primary text-icon-tertiary">
                <SearchIcon />
              </div>

              <p className="mt-3 text-sm font-medium text-text-primary">
                No results found
              </p>

              <p className="mt-1 text-xs text-text-tertiary">
                Try searching for another dashboard page.
              </p>
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto p-2">
              {Object.entries(groupedResults).map(([section, items]) => (
                <div key={section} className="mb-2 last:mb-0">
                  <p className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
                    {formatSection(section)}
                  </p>

                  <div>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item.url)}
                        className="
                              group
                              flex w-full
                              items-center gap-3
                              rounded-lg
                              px-3 py-2.5
                              text-left
                              transition-colors
                              hover:bg-background-gray-primary
                            "
                      >
                        {item.icon && (
                          <span
                            className="
                                  flex size-9
                                  shrink-0
                                  items-center justify-center
                                  rounded-lg
                                  bg-background-gray-primary
                                  text-icon-secondary
                                  transition-colors
                                  group-hover:bg-card-background
                                "
                          >
                            {item.icon}
                          </span>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            {item.parentTitle && (
                              <span className="truncate text-sm text-text-tertiary">
                                {item.parentTitle}/
                              </span>
                            )}

                            <span className="truncate text-sm font-medium text-text-primary">
                              {item.title}
                            </span>
                          </div>
                        </div>

                        <span className="text-lg text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100">
                          →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}

          <div className="flex items-center justify-between border-t border-card-border bg-background-gray-primary/40 px-4 py-2.5">
            <span className="text-[11px] text-text-tertiary">ESC to close</span>
          </div>
        </div>
      )}
    </div>
  );
}

function formatSection(value) {
  if (!value) return "Pages";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
