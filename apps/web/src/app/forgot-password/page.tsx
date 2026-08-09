import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="mt-3 text-sm text-neutral-500">
          Password recovery is coming in a later phase. For now, please contact
          your organization admin to regain access.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium underline"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
