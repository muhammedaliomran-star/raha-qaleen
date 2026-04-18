import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { PageShell } from "./PageShell";
import type { Role } from "@/lib/store";

export function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const allowed = roles.some((r) => allow.includes(r));

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading) return <PageShell><div className="glass rounded-2xl p-10 text-center">جاري التحقق...</div></PageShell>;
  if (!user) return null;
  if (!allowed) return <PageShell><div className="glass rounded-2xl p-10 text-center text-destructive">ليس لديك صلاحية للوصول</div></PageShell>;
  return <>{children}</>;
}
