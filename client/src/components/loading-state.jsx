import { cn } from "@/utils/cn";

export function InlineSpinner({ className = "" }) {
  return (
    <svg
      data-loading-spinner=""
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        "inline-block size-4 shrink-0 animate-spin motion-reduce:animate-none",
        className,
      )}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.2"
      />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LoadingState({
  label = "Loading...",
  className = "",
  compact = false,
  fullScreen = false,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "flex items-center justify-center gap-3 text-sm text-text-tertiary",
        compact ? "py-3" : "min-h-40 px-6 py-10",
        fullScreen && "min-h-screen bg-background-gray-primary",
        className,
      )}
    >
      <InlineSpinner
        className={compact ? "size-4 text-brand-500" : "size-6 text-brand-500"}
      />
      <span>{label}</span>
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-card-border motion-reduce:animate-none",
        className,
      )}
    />
  );
}

export function PageSkeleton({
  label = "Loading page...",
  variant = "list",
  className = "",
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn("space-y-6 px-2 py-6 lg:px-6", className)}
    >
      <div className="flex items-center gap-2 text-sm text-text-tertiary">
        <InlineSpinner className="text-brand-500" />
        <span>{label}</span>
      </div>
      <div aria-hidden="true" className="space-y-6">
        <div className="space-y-3">
          <SkeletonBlock className="h-8 w-48 max-w-full" />
          <SkeletonBlock className="h-4 w-80 max-w-full" />
        </div>
        {variant === "dashboard" && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="space-y-4 rounded-2xl border border-card-border bg-card-background p-6"
              >
                <SkeletonBlock className="h-10 w-10" />
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-8 w-32 max-w-full" />
              </div>
            ))}
          </div>
        )}
        <div className="space-y-5 rounded-2xl border border-card-border bg-card-background p-5 sm:p-6">
          <SkeletonBlock className="h-6 w-40" />
          {Array.from({ length: variant === "form" ? 4 : 5 }, (_, index) =>
            variant === "form" ? (
              <div key={index} className="space-y-2">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock
                  className={index === 2 ? "h-28 w-full" : "h-11 w-full"}
                />
              </div>
            ) : (
              <div
                key={index}
                className="flex items-center gap-4 border-t border-card-border pt-5"
              >
                <SkeletonBlock className="size-10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-2/3" />
                  <SkeletonBlock className="h-3 w-1/3" />
                </div>
                <SkeletonBlock className="hidden h-7 w-20 sm:block" />
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
