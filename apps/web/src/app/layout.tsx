import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";

export const metadata: Metadata = {
  title: "WorkFlow — Project Management SaaS",
  description:
    "Multi-tenant project management for small teams. Projects, tasks, and reporting in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{ duration: 3500 }}
        />
      </body>
    </html>
  );
}
