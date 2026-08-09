"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-3 dark:border-white/10">
        <span className="text-lg font-bold tracking-tight">WorkFlow</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-500">{user?.name}</span>
          <button
            onClick={() => logout()}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </header>
      <div className="p-6">{children}</div>
    </div>
  );
}
