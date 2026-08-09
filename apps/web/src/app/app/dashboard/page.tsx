"use client";

import { useAuth } from "@/providers/auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();
  const org = user?.organizations?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Good to see you, {user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {org
            ? `You're signed in to ${org.name} as ${org.role.toLowerCase()}.`
            : "Here's your workspace."}
        </p>
      </div>

      <div className="rounded-xl border border-black/10 p-6 text-sm text-neutral-500 dark:border-white/10">
        Dashboard statistics, charts, and activity arrive in Phase 6. Phase 2
        (authentication) is now in place — this page is protected and only
        reachable when signed in.
      </div>
    </div>
  );
}
