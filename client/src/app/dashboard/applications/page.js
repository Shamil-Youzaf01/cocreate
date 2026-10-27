"use client";
import useAuthStore from "@/store/authStore";
import { PageSkeleton } from "@/components/loading-state";
import CreatorApplicationsPage from "../_components/creator/CreatorApplicationsPage";
import BrandApplicationsPage from "../_components/brand/BrandApplicationsPage";
export default function ApplicationsPage() {
  const role = useAuthStore((state) => state.user?.role);
  if (!role) return <PageSkeleton label="Loading applications..." />;
  if (role === "CREATOR") return <CreatorApplicationsPage />;
  if (role === "BRAND") return <BrandApplicationsPage />;
  return (
    <p className="p-6">Applications are not available for this account.</p>
  );
}
