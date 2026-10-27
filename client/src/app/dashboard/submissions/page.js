"use client";
import useAuthStore from "@/store/authStore";
import CreatorSubmissionsPage from "../_components/creator/CreatorSubmissionsPage";
import BrandSubmissionsPage from "../_components/brand/BrandSubmissionsPage";
import { PageSkeleton } from "@/components/loading-state";
export default function SubmissionsPage() {
  const role = useAuthStore((state) => state.user?.role);
  if (!role) return <PageSkeleton label="Loading submissions..." />;
  if (role === "CREATOR") return <CreatorSubmissionsPage />;
  if (role === "BRAND") return <BrandSubmissionsPage />;
  return <p className="p-6">Submissions are not available for this account.</p>;
}
