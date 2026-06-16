"use client";

import { ReactNode } from "react";
import { AdminShell } from "../../components/AdminShell";
import { AuthGuard } from "../../components/AuthGuard";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
