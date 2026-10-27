"use client";
import useUnsavedChanges from "@/hooks/use-unsaved-changes";
import { reportLoadError } from "@/lib/toast-feedback";
import CampaignCover from "@/app/dashboard/_components/shared/CampaignCover";
import CampaignRewardSummary from "@/app/dashboard/_components/shared/CampaignRewardSummary";

import { useEffect, useRef, useState } from "react";
import { InlineSpinner } from "@/components/loading-state";
import { useParams } from "next/navigation";

import { ArrowLeft, CalendarDays, Megaphone } from "lucide-react";

import Link from "next/link";
import toast from "react-hot-toast";
import useAuthStore from "@/store/authStore";

import { getCampaignById } from "@/services/campaign.service";

import { applyToCampaign } from "@/services/application.service";

export default function CampaignDetailsPage() {
  const params = useParams();

  const campaignId = params.campaignId;
  return <CampaignDetails key={campaignId} campaignId={campaignId} />;
}

function CampaignDetails({ campaignId }) {
  const applyLock = useRef(false);
  const role = useAuthStore((state) => state.user?.role);
  const [applyError, setApplyError] = useState("");

  const [campaign, setCampaign] = useState(null);
  const [myApplication, setMyApplication] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);

  const [message, setMessage] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [isApplying, setIsApplying] = useState(false);

  const [error, setError] = useState("");

  const [applied, setApplied] = useState(false);

  useUnsavedChanges(Boolean(message) && !applied);

  useEffect(() => {
    let active = true;
    const fetchCampaign = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await getCampaignById(campaignId);

        if (active) {
          setCampaign(response.data.campaign);
          setMyApplication(response.data.myApplication || null);
          setMySubmission(response.data.mySubmission || null);
        }
      } catch (error) {
        console.error("Campaign fetch error:", error);

        if (active)
          setError(
            reportLoadError(
              error,
              error.response?.data?.message || "Unable to load campaign.",
              "campaigns-[campaignId]-page-load-error-1",
            ),
          );
      } finally {
        if (active) setIsLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaign();
    }
    return () => {
      active = false;
    };
  }, [campaignId]);

  const handleApply = async (event) => {
    event.preventDefault();
    if (
      applyLock.current ||
      applied ||
      myApplication ||
      mySubmission ||
      role !== "CREATOR"
    )
      return;

    try {
      applyLock.current = true;
      setIsApplying(true);
      setApplyError("");

      const response = await applyToCampaign(campaignId, {
        message: message.trim(),
      });

      setMyApplication(response.data?.application || { status: "PENDING" });
      setApplied(true);
      setMessage("");
      toast.success("Application submitted successfully.");
    } catch (error) {
      const message =
        error.response?.data?.message || "Unable to submit application.";
      setApplyError(message);
      toast.error(message);
    } finally {
      applyLock.current = false;
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return <CampaignDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return <div className="p-6 text-text-tertiary">Campaign not found.</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-2 py-6 lg:px-6">
      {/* Back */}

      <Link
        href="/dashboard/campaigns"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-brand-500"
      >
        <ArrowLeft size={16} />
        Back to campaigns
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main content */}

        <div className="space-y-5">
          <CampaignCover
            campaign={campaign}
            className="aspect-[16/10] rounded-2xl border border-card-border"
          />
          <div className="rounded-2xl border border-card-border bg-card-background p-6">
            {/* Meta */}

            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-text-tertiary">
              {campaign.platform && (
                <span>{formatText(campaign.platform)}</span>
              )}

              {campaign.platform && campaign.contentType && <span>•</span>}

              {campaign.contentType && (
                <span>{formatText(campaign.contentType)}</span>
              )}
            </div>

            {/* Title */}

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text-primary">
              {campaign.title}
            </h1>

            {/* Brand */}

            {campaign.brandId?.name && (
              <p className="mt-2 text-sm text-text-tertiary">
                by {campaign.brandId.name}
              </p>
            )}

            {/* Description */}

            <div className="mt-8">
              <h2 className="text-base font-semibold text-text-primary">
                Campaign Brief
              </h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-text-secondary">
                {campaign.description}
              </p>
            </div>

            <section className="mt-6">
              <CampaignRewardSummary campaign={campaign} variant="detail" />
            </section>
            {role === "BRAND" && campaign.rewardOverview && (
              <section className="mt-6 border-t border-card-border pt-6">
                <h2 className="text-base font-semibold text-text-primary">
                  Creator performance &amp; rewards
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {[
                    [
                      "Approved creators",
                      campaign.rewardOverview.approvedCreators,
                    ],
                    ["Rewards ready", campaign.rewardOverview.rewardsReady],
                    [
                      "Rewards credited",
                      campaign.rewardOverview.rewardsCredited,
                    ],
                    [
                      "Total verified views",
                      campaign.rewardOverview.totalVerifiedViews,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl bg-background-gray-primary p-4"
                    >
                      <p className="text-xs text-text-tertiary">{label}</p>
                      <p className="mt-2 text-xl font-semibold text-text-primary">
                        {Number(value || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/dashboard/campaigns/${campaign._id}/submissions`}
                  className="mt-4 inline-block text-sm font-semibold text-brand-500"
                >
                  Review submissions and issue rewards
                </Link>
              </section>
            )}
            {/* Requirements */}

            {campaign.requirements && (
              <div className="mt-8">
                <h2 className="text-base font-semibold text-text-primary">
                  Requirements
                </h2>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-text-secondary">
                  {campaign.requirements}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}

        <div>
          <div className="sticky top-24 rounded-2xl border border-card-border bg-card-background p-6">
            <h2 className="text-lg font-semibold text-text-primary">
              Campaign Details
            </h2>

            <div className="mt-6 space-y-5">
              <DetailItem
                icon={CalendarDays}
                label="Deadline"
                value={formatDate(campaign.deadline)}
              />

              <DetailItem
                icon={Megaphone}
                label="Status"
                value={formatText(campaign.status)}
              />
            </div>

            <div className="my-6 border-t border-card-border" />

            {role !== "CREATOR" ? (
              <p className="text-sm text-text-secondary">
                Only Creator accounts can apply to campaigns.
              </p>
            ) : mySubmission ? (
              <div
                role="status"
                className="rounded-xl bg-background-gray-primary p-4"
              >
                <p className="text-sm text-text-primary">
                  Submission: {formatText(mySubmission.status)}
                </p>
                <Link
                  href={`/dashboard/submissions/${mySubmission._id}`}
                  className="mt-4 inline-block text-sm font-medium text-brand-500"
                >
                  {mySubmission.status === "REVISION_REQUESTED"
                    ? "Revise & Resubmit"
                    : "View Submission"}
                </Link>
              </div>
            ) : applied || myApplication ? (
              <div role="status" className="rounded-xl bg-green-50 px-4 py-4">
                <p className="text-sm font-medium text-green-700">
                  Application submitted
                </p>

                <p className="mt-1 text-xs text-green-600">
                  Status: {formatText(myApplication?.status || "PENDING")}
                </p>

                <Link
                  href={
                    myApplication?.status === "ACCEPTED"
                      ? `/dashboard/submissions/new?campaignId=${campaignId}`
                      : "/dashboard/applications"
                  }
                  className="mt-4 inline-block text-sm font-medium text-green-700"
                >
                  {myApplication?.status === "ACCEPTED"
                    ? "Submit Content"
                    : "View application"}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleApply}>
                <label
                  htmlFor="message"
                  className="text-sm font-medium text-text-primary"
                >
                  Pitch Message
                </label>

                <textarea
                  id="message"
                  rows={5}
                  maxLength={1000}
                  disabled={isApplying}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tell the brand why you're a good fit for this campaign..."
                  className="mt-2 w-full resize-none rounded-xl border border-card-border bg-transparent px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-brand-500"
                />

                <button
                  type="submit"
                  disabled={
                    isApplying ||
                    campaign.status !== "PUBLISHED" ||
                    new Date(campaign.deadline) <= new Date()
                  }
                  aria-busy={isApplying}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isApplying && <InlineSpinner />}
                  {isApplying ? "Submitting..." : "Apply to Campaign"}
                </button>

                {applyError && (
                  <p role="alert" className="mt-3 text-sm text-red-600">
                    {applyError}
                  </p>
                )}
                {(campaign.status !== "PUBLISHED" ||
                  new Date(campaign.deadline) <= new Date()) && (
                  <p className="mt-3 text-center text-xs text-text-tertiary">
                    This campaign is no longer accepting applications.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-lg bg-background-gray-primary text-text-tertiary">
        <Icon size={17} />
      </div>

      <div>
        <p className="text-xs text-text-tertiary">{label}</p>

        <p className="mt-0.5 text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function CampaignDetailsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading campaign details"
      className="mx-auto max-w-6xl px-2 py-6 lg:px-6"
    >
      <span className="sr-only">Loading campaign details...</span>
      <div className="mb-6 h-5 w-32 animate-pulse rounded bg-background-gray-secondary" />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="h-[500px] animate-pulse rounded-2xl border border-card-border bg-card-background" />

        <div className="h-[430px] animate-pulse rounded-2xl border border-card-border bg-card-background" />
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatText(value) {
  if (!value) return "-";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
