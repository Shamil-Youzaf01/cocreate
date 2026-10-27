"use client";
import useUnsavedChanges from "@/hooks/use-unsaved-changes";
import { reportLoadError } from "@/lib/toast-feedback";

import { Suspense, useEffect, useRef, useState } from "react";
import LoadingState, {
  InlineSpinner,
  PageSkeleton,
} from "@/components/loading-state";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  createSubmission,
  getMySubmissions,
} from "@/services/submission.service";
import { getCampaignById } from "@/services/campaign.service";
import useAuthStore from "@/store/authStore";

export default function NewSubmissionPage() {
  return (
    <Suspense
      fallback={
        <PageSkeleton label="Loading submission form..." variant="form" />
      }
    >
      <CampaignSubmission />
    </Suspense>
  );
}

function CampaignSubmission() {
  const params = useSearchParams();
  const campaignId = params.get("campaignId");
  return <SubmissionForm key={campaignId} campaignId={campaignId} />;
}

function SubmissionForm({ campaignId }) {
  const submitLock = useRef(false);
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const [campaign, setCampaign] = useState(null);
  const [application, setApplication] = useState(null);
  const [contentUrl, setContentUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  useUnsavedChanges(Boolean(application && (contentUrl || caption)));

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        if (!campaignId || !/^[a-f\d]{24}$/i.test(campaignId))
          throw new Error("Choose a campaign from Ready to Submit first.");
        const [campaignResponse, submissionsResponse] = await Promise.all([
          getCampaignById(campaignId),
          getMySubmissions(),
        ]);
        if (!active) return;
        const existingSubmission = [
          ...(submissionsResponse.data?.underReview || []),
          ...(submissionsResponse.data?.needsRevision || []),
          ...(submissionsResponse.data?.approved || []),
          ...(submissionsResponse.data?.rejected || []),
        ].find(
          (item) =>
            String(item.campaignId?._id || item.campaignId) ===
            String(campaignId),
        );
        if (existingSubmission) {
          setRedirecting(true);
          router.replace(`/dashboard/submissions/${existingSubmission._id}`);
          return;
        }
        const readyToSubmit = submissionsResponse.data?.readyToSubmit || [];
        const readyItem = readyToSubmit.find(
          (item) => String(item.campaignId) === String(campaignId),
        );
        setCampaign(campaignResponse.data?.campaign || null);
        setApplication(
          readyItem
            ? { _id: readyItem.applicationId, status: "ACCEPTED" }
            : null,
        );
      } catch (error) {
        if (active)
          setError(
            reportLoadError(
              error,
              error.response?.data?.message ||
                error.message ||
                "Unable to load campaign.",
              "submissions-new-page-load-error-1",
            ),
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [campaignId, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (
      submitLock.current ||
      role !== "CREATOR" ||
      application?.status !== "ACCEPTED"
    )
      return;
    try {
      const url = new URL(contentUrl.trim());
      if (!["https:", "http:"].includes(url.protocol)) throw new Error();
    } catch {
      setError("Enter a valid HTTP or HTTPS content URL.");
      toast.error("Enter a valid HTTP or HTTPS content URL.");
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    setError("");
    try {
      const response = await createSubmission(campaignId, {
        contentUrl: contentUrl.trim(),
        caption: caption.trim(),
      });
      const submission = response.data?.submission;
      setApplication(null);
      setRedirecting(true);
      toast.success("Content submitted successfully.");
      router.replace(
        submission?._id
          ? `/dashboard/submissions/${submission._id}`
          : "/dashboard/submissions",
      );
    } catch (error) {
      const message =
        error.response?.data?.message || "Unable to submit content.";
      setRedirecting(false);
      setError(message);
      toast.error(message);
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  if (!role || loading)
    return <PageSkeleton label="Loading submission form..." variant="form" />;
  if (redirecting) return <LoadingState label="Opening submission..." />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-2 py-6 lg:px-6">
      <Link href="/dashboard/submissions" className="text-sm text-brand-500">
        Back to submissions
      </Link>
      <h1 className="text-3xl font-semibold text-text-primary">
        Submit Content
      </h1>
      <>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {campaign && (
          <section className="rounded-2xl border border-card-border bg-card-background p-6">
            <h2 className="text-xl font-semibold text-text-primary">
              {campaign.title}
            </h2>
            {role === "CREATOR" && application?.status === "ACCEPTED" ? (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="contentUrl"
                    className="text-sm text-text-primary"
                  >
                    Content URL
                  </label>
                  <input
                    id="contentUrl"
                    type="url"
                    required
                    disabled={submitting}
                    value={contentUrl}
                    onChange={(event) => setContentUrl(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-card-border bg-transparent p-3 text-text-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="caption"
                    className="text-sm text-text-primary"
                  >
                    Caption
                  </label>
                  <textarea
                    id="caption"
                    rows={7}
                    maxLength={2000}
                    disabled={submitting}
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-card-border bg-transparent p-3 text-text-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-white disabled:opacity-50"
                >
                  {submitting && <InlineSpinner />}
                  {submitting ? "Submitting..." : "Submit for Review"}
                </button>
              </form>
            ) : (
              <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm font-medium text-orange-700">
                  This campaign is not currently available for a new submission.
                </p>
                <p className="mt-1 text-xs leading-5 text-orange-600">
                  Your application must be accepted and the campaign must not
                  already have a submission.
                </p>
                <Link
                  href="/dashboard/submissions"
                  className="mt-3 inline-flex text-sm font-medium text-brand-500"
                >
                  Return to My Submissions
                </Link>
              </div>
            )}
          </section>
        )}
      </>
    </div>
  );
}
