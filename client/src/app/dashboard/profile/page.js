"use client";
import useAuthStore from "@/store/authStore";
import { PageSkeleton } from "@/components/loading-state";
import CreatorProfilePage from "../_components/creator/CreatorProfilePage";
import BrandProfilePage from "../_components/brand/BrandProfilePage";
export default function ProfilePage() {
  const role = useAuthStore((state) => state.user?.role);
  if (!role) return <PageSkeleton variant="form" label="Loading profile..." />;
  if (role === "CREATOR") return <CreatorProfilePage />;
  if (role === "BRAND") return <BrandProfilePage />;
  return (
    <p className="p-6 text-text-tertiary">
      Profile is unavailable for this role.
    </p>
  );
}
