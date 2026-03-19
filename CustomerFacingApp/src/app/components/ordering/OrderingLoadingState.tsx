import { Skeleton } from "../ui/skeleton";

export function OrderingLoadingState() {
  return (
    <div className="space-y-5">
      <div
        className="rounded-2xl border p-5"
        style={{ background: "var(--card-bg)", borderColor: "var(--border)" }}
      >
        <div className="mb-3 flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" style={{ background: "var(--skeleton)" }} />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" style={{ background: "var(--skeleton)" }} />
            <Skeleton className="h-3 w-24" style={{ background: "var(--skeleton)" }} />
          </div>
        </div>
        <Skeleton className="h-16 w-full" style={{ background: "var(--skeleton)" }} />
      </div>

      <div
        className="rounded-2xl border p-5"
        style={{ background: "var(--card-bg)", borderColor: "var(--border)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
              Syncing your menu and rewards
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Pulling the latest data for this session.
            </p>
          </div>
          <div
            className="h-6 w-6 animate-spin rounded-full border-2"
            style={{ borderColor: "var(--gold-light)", borderTopColor: "var(--gold)" }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="rounded-2xl border p-4"
              style={{ borderColor: "var(--border)" }}
            >
              <Skeleton className="mb-4 h-44 w-full rounded-xl" style={{ background: "var(--skeleton)" }} />
              <Skeleton className="mb-2 h-4 w-2/3" style={{ background: "var(--skeleton)" }} />
              <Skeleton className="mb-4 h-3 w-full" style={{ background: "var(--skeleton)" }} />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" style={{ background: "var(--skeleton)" }} />
                <Skeleton className="h-9 w-28 rounded-lg" style={{ background: "var(--skeleton)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
