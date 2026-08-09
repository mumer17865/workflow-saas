import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:border-white/15">
        Multi-tenant SaaS
      </span>

      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        WorkFlow
      </h1>

      <p className="max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
        A lightweight project management platform for small teams. Organize
        projects, assign tasks, and track progress — all in one workspace.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/register"
          className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-black/10 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
        >
          Sign in
        </Link>
      </div>

      <p className="text-xs text-neutral-400">
        Phase 1 — Foundation. Authentication arrives in Phase 2.
      </p>
    </main>
  );
}
