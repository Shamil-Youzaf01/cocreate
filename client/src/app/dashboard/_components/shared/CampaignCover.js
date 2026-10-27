"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";
import { InlineSpinner } from "@/components/loading-state";

export default function CampaignCover({
  campaign,
  className = "aspect-[16/10]",
  creator = false,
  showStatus = true,
}) {
  const [failedUrl, setFailedUrl] = useState(null);
  const [loadedUrl, setLoadedUrl] = useState(null);
  const url = campaign?.coverImage?.url;
  const loading = Boolean(url && failedUrl !== url && loadedUrl !== url);
  return (
    <div
      className={`relative overflow-hidden bg-background-gray-secondary ${className}`}
    >
      {url && failedUrl !== url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={campaign.title || "Campaign cover"}
          loading="lazy"
          onLoad={() => setLoadedUrl(url)}
          onError={() => setFailedUrl(url)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03] motion-reduce:transition-none"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-text-tertiary">
          No campaign image
        </div>
      )}
      {loading && (
        <div
          role="status"
          aria-label="Loading campaign image"
          className="absolute inset-0 flex items-center justify-center bg-background-gray-secondary text-text-tertiary"
        >
          <InlineSpinner />
          <span className="sr-only">Loading campaign image...</span>
        </div>
      )}
      {url && failedUrl !== url && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
        />
      )}
      {creator && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-black">
            {campaign.platform}
          </span>
          {showStatus && <StatusBadge status={campaign.status} />}
        </div>
      )}
    </div>
  );
}
