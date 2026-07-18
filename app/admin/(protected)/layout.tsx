import type { Metadata } from "next";
import { requireAdmin } from "@/src/lib/auth";
import { AdminShell } from "@/src/components/admin/admin-shell";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return <AdminShell email={session.email}>{children}</AdminShell>;
}
