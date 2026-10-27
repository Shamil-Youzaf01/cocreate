import { Badge } from "@/components/tailgrids/core/badge";

export default function StatusBadge({ status }) {
  const colorMap = {
    ACTIVE: "success",
    SUSPENDED: "warning",
    BANNED: "error",
    PENDING: "warning",
    REQUESTED: "warning",
    WITHDRAWN: "gray",

    ACCEPTED: "success",
    APPROVED: "success",
    PAID: "success",
    RESOLVED: "success",
    PUBLISHED: "success",

    REJECTED: "error",
    CLOSED: "error",

    SUBMITTED: "blue",
    UNDER_REVIEW: "blue",
    COMPLETED: "blue",

    REVISION_REQUESTED: "warning",

    DRAFT: "gray",
    OPEN: "warning",
    DISMISSED: "gray",
  };

  return (
    <Badge color={colorMap[status] || "gray"} size="sm">
      {formatStatus(status)}
    </Badge>
  );
}

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
