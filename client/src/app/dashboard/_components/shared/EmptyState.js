export default function EmptyState({
  title = "No data available",
  description = "",
}) {
  return (
    <div className="flex min-h-[150px] flex-col items-center justify-center px-6 py-10 text-center">
      <p className="text-sm font-medium text-text-primary">{title}</p>

      {description && (
        <p className="mt-1 max-w-md text-sm text-text-tertiary">
          {description}
        </p>
      )}
    </div>
  );
}
