export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-black/15 p-10 text-center dark:border-white/15">
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
      <p className="text-sm font-medium text-red-700 dark:text-red-300">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/50"
        >
          Try again
        </button>
      )}
    </div>
  );
}
