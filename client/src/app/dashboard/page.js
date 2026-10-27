"use client";

import useAuthStore from "@/store/authStore";

import CreatorDashboard from "./_components/creator/CreatorDashboard";
import BrandDashboard from "./_components/brand/BrandDashboard";
import AdminDashboard from "./_components/admin/AdminDashboard";
import { PageSkeleton } from "@/components/loading-state";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  switch (user?.role) {
    case "CREATOR":
      return <CreatorDashboard />;

    case "BRAND":
      return <BrandDashboard />;

    case "ADMIN":
      return <AdminDashboard />;

    default:
      return <PageSkeleton variant="dashboard" label="Loading dashboard..." />;
  }
}
