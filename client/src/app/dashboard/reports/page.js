"use client";
import AdminReportsPage from "../_components/admin/AdminReportsPage";
import useAuthStore from "@/store/authStore";
import { PageSkeleton } from "@/components/loading-state";
import CreatorReportsPage from "../_components/creator/CreatorReportsPage";
import BrandReportsPage from "../_components/brand/BrandReportsPage";
export default function ReportsPage() {
  const role = useAuthStore((state) => state.user?.role);
  if (!role) return <PageSkeleton label="Loading reports..." />;
  if (role === "ADMIN") return <AdminReportsPage />;
  if (role === "CREATOR") return <CreatorReportsPage />;
  if (role === "BRAND") return <BrandReportsPage />;
  return (
    <p className="p-6 text-text-tertiary">
      Reports are managed from the Admin moderation area.
    </p>
  );
}
