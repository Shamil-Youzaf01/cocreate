"use client";
import AdminCampaignsPage from "../_components/admin/AdminCampaignsPage";

import useAuthStore from "@/store/authStore";

import CreatorCampaignsPage from "../_components/creator/CreatorCampaignsPage";
import BrandCampaignsPage from "../_components/brand/BrandCampaignsPage";
import { PageSkeleton } from "@/components/loading-state";

export default function CampaignsPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <PageSkeleton label="Loading campaigns..." />;
  }

  switch (user.role) {
    case "ADMIN":
      return <AdminCampaignsPage />;
    case "CREATOR":
      return <CreatorCampaignsPage />;

    case "BRAND":
      return <BrandCampaignsPage />;

    default:
      return (
        <div className="p-6 text-text-tertiary">
          Campaign management is not available for this account.
        </div>
      );
  }
}
