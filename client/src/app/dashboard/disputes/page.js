"use client";
import AdminDisputesPage from "../_components/admin/AdminDisputesPage";
import useAuthStore from "@/store/authStore";
import { PageSkeleton } from "@/components/loading-state";
import CreatorDisputesPage from "../_components/creator/CreatorDisputesPage";
import BrandDisputesPage from "../_components/brand/BrandDisputesPage";
export default function DisputesPage() {
  const role = useAuthStore((state) => state.user?.role);
  if (!role) return <PageSkeleton label="Loading disputes..." />;
  if (role === "ADMIN") return <AdminDisputesPage />;
  if (role === "CREATOR") return <CreatorDisputesPage />;
  if (role === "BRAND") return <BrandDisputesPage />;
  return (
    <p className="p-6 text-text-tertiary">
      Disputes are managed from the Admin moderation area.
    </p>
  );
}
