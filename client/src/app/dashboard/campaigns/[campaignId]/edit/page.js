"use client";
import { reportLoadError } from "@/lib/toast-feedback";

import { useEffect, useState, useRef } from "react";

import { useParams, useRouter } from "next/navigation";

import toast from "react-hot-toast";

import { getCampaignById, updateCampaign } from "@/services/campaign.service";

import CampaignForm from "@/app/dashboard/_components/brand/CampaignForm";
import useAuthStore from "@/store/authStore";
import { PageSkeleton } from "@/components/loading-state";

export default function EditCampaignPage() {
  const user = useAuthStore((state) => state.user);
  const params = useParams();
  if (!user)
    return <PageSkeleton label="Loading campaign form..." variant="form" />;
  if (user.role !== "BRAND")
    return <p className="p-6">Campaign management is available to Brands.</p>;
  return <CampaignEditor key={params.campaignId} />;
}

function CampaignEditor() {
  const user = useAuthStore((state) => state.user);
  const requestLock = useRef(false);
  const params = useParams();
  const router = useRouter();

  const campaignId = params.campaignId;

  const [campaign, setCampaign] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Fetch
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let active = true;
    const fetchCampaign = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await getCampaignById(campaignId);

        if (!active) return;
        const campaignData = response.data?.campaign;

        if (!campaignData) {
          throw new Error("Campaign not found.");
        }

        setCampaign(campaignData);
      } catch (error) {
        if (!active) return;
        console.error("Campaign fetch failed:", error);

        setError(
          reportLoadError(
            error,
            error.response?.data?.message ||
              error.message ||
              "Unable to load campaign.",
            "campaigns-[campaignId]-edit-page-load-error-1",
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

  /*
  |--------------------------------------------------------------------------
  | Update
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (data) => {
    if (requestLock.current) return;
    let navigating = false;
    try {
      requestLock.current = true;
      setIsSubmitting(true);

      await updateCampaign(campaignId, data);

      toast.success("Campaign updated.");
      navigating = true;

      router.push("/dashboard/campaigns");
    } catch (error) {
      navigating = false;
      console.error("Campaign update failed:", error);

      toast.error(
        error.response?.data?.message || "Unable to update campaign.",
      );
    } finally {
      if (!navigating) {
        requestLock.current = false;
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) {
    return <PageSkeleton label="Loading campaign form..." variant="form" />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Protect UI
  |--------------------------------------------------------------------------
  */

  if (
    String(campaign?.brandId?._id || campaign?.brandId) !==
    String(user?._id || user?.userId || user?.id)
  )
    return <p className="p-6">You can only edit your own campaigns.</p>;

  if (campaign?.status !== "DRAFT") {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
          Only draft campaigns can be edited.
        </div>
      </div>
    );
  }

  return (
    <CampaignForm
      title="Edit Campaign"
      subtitle="Update your draft campaign before publishing it to creators."
      initialValues={campaign}
      submitLabel="Save Changes"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
