"use client";

import { useState, useRef } from "react";

import { useRouter } from "next/navigation";

import toast from "react-hot-toast";

import { createCampaign } from "@/services/campaign.service";

import CampaignForm from "@/app/dashboard/_components/brand/CampaignForm";
import useAuthStore from "@/store/authStore";
import { PageSkeleton } from "@/components/loading-state";

export default function CreateCampaignPage() {
  const user = useAuthStore((state) => state.user);

  if (!user)
    return <PageSkeleton label="Loading campaign form..." variant="form" />;
  if (user.role !== "BRAND")
    return <p className="p-6">Campaign management is available to Brands.</p>;
  return <CampaignEditor />;
}

function CampaignEditor() {
  const requestLock = useRef(false);
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    if (requestLock.current) return;
    let navigating = false;
    try {
      requestLock.current = true;
      setIsSubmitting(true);

      const response = await createCampaign(data);

      toast.success("Campaign created as draft.");

      const campaign = response.data?.campaign;
      navigating = true;

      if (campaign?._id) {
        router.push(`/dashboard/campaigns/${campaign._id}`);

        return;
      }

      router.push("/dashboard/campaigns");
    } catch (error) {
      navigating = false;
      console.error("Campaign creation failed:", error);

      toast.error(
        error.response?.data?.message || "Unable to create campaign.",
      );
    } finally {
      if (!navigating) {
        requestLock.current = false;
        setIsSubmitting(false);
      }
    }
  };

  return (
    <CampaignForm
      title="Create Campaign"
      subtitle="Create the campaign brief first. It will remain a draft until you publish it."
      submitLabel="Save Draft"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
