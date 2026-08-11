"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api-client";
import {
  getActivity,
  getDashboardStats,
  type Activity,
  type DashboardStats,
} from "@/lib/api/dashboard";
import { DashboardCharts } from "./charts";
import { Skeleton, StatTilesSkeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";

export default function DashboardPage() {
  const { user, activeOrg } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, a] = await Promise.all([getDashboardStats(), getActivity(15)]);
      setStats(s);
      setActivity(a);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <StatTilesSkeleton />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return <ErrorState message={error ?? "No data"} onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Good to see you, {user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {activeOrg
            ? `Here's what's happening in ${activeOrg.name}.`
            : "Here's your workspace."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Projects" value={stats.projects.total} hint={`${stats.projects.active} active`} />
        <StatTile label="Tasks" value={stats.tasks.total} hint={`${stats.tasks.completed} done`} />
        <StatTile label="Completion" value={`${stats.tasks.completionRate}%`} />
        <StatTile label="Overdue" value={stats.tasks.overdue} tone={stats.tasks.overdue > 0 ? "warn" : "default"} />
        <StatTile label="Members" value={stats.members} />
      </div>

      <DashboardCharts stats={stats} />

      <section>
        <h2 className="mb-3 text-sm font-semibold">Recent activity</h2>
        {activity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/15 p-8 text-center text-sm text-neutral-500 dark:border-white/15">
            No activity yet. Create a project or task to get started.
          </div>
        ) : (
          <ul className="divide-y divide-black/5 rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
            {activity.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm">{describe(a)}</span>
                <span className="shrink-0 text-xs text-neutral-400">
                  {relativeTime(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-semibold ${
          tone === "warn" ? "text-amber-600 dark:text-amber-400" : ""
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

const STATUS_TEXT: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

function meta(a: Activity, key: string): string {
  const v = a.metadata?.[key];
  return typeof v === "string" ? v : "";
}

function describe(a: Activity): React.ReactNode {
  const who = a.actor?.name ?? "Someone";
  const strong = (s: string) => <span className="font-medium">{s}</span>;
  switch (a.type) {
    case "PROJECT_CREATED":
      return <>{strong(who)} created project {strong(meta(a, "name"))}</>;
    case "PROJECT_ARCHIVED":
      return <>{strong(who)} archived project {strong(meta(a, "name"))}</>;
    case "TASK_CREATED":
      return <>{strong(who)} created task {strong(meta(a, "title"))}</>;
    case "TASK_STATUS_CHANGED":
      return (
        <>
          {strong(who)} moved {strong(meta(a, "title"))} to{" "}
          {strong(STATUS_TEXT[meta(a, "toStatus")] ?? meta(a, "toStatus"))}
        </>
      );
    case "MEMBER_JOINED":
      return <>{strong(who)} joined the organization</>;
    default:
      return <>{strong(who)} did something</>;
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
