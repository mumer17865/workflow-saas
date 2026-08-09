import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
