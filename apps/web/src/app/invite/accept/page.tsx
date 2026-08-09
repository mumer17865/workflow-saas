"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api-client";
import {
  acceptInvitation,
  previewInvitation,
  type InvitationPreview,
} from "@/lib/api/organizations";

function AcceptInvite() {
  const { status, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    (async () => {
      try {
        setPreview(await previewInvitation(token));
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Invitation is not valid",
        );
      } finally {
        setChecking(false);
      }
    })();
  }, [status, token]);

  if (!token) {
    return <Message text="This invitation link is missing its token." />;
  }

  if (status === "loading") {
    return <Message text="Loading…" />;
  }

  if (status === "unauthenticated") {
    const redirect = encodeURIComponent(`/invite/accept?token=${token}`);
    return (
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold">You&apos;ve been invited</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Sign in or create an account to accept this invitation.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href={`/login?redirect=${redirect}`}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/15"
          >
            Register
          </Link>
        </div>
      </div>
    );
  }

  if (checking) {
    return <Message text="Checking invitation…" />;
  }

  if (error) {
    return (
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold">Invitation problem</h1>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <Link
          href="/app/dashboard"
          className="mt-6 inline-block text-sm font-medium underline"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  const onAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      await acceptInvitation(token);
      await refreshUser();
      router.replace("/app/team");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to accept");
      setAccepting(false);
    }
  };

  return (
    <div className="w-full max-w-sm text-center">
      <h1 className="text-xl font-semibold">Join {preview?.organizationName}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        You&apos;ve been invited as{" "}
        <span className="font-medium">{preview?.role.toLowerCase()}</span>.
      </p>
      <button
        onClick={onAccept}
        disabled={accepting}
        className="mt-6 w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {accepting ? "Joining…" : `Accept invitation`}
      </button>
    </div>
  );
}

function Message({ text }: { text: string }) {
  return <p className="text-sm text-neutral-500">{text}</p>;
}

export default function AcceptInvitePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Suspense fallback={<Message text="Loading…" />}>
        <AcceptInvite />
      </Suspense>
    </main>
  );
}
