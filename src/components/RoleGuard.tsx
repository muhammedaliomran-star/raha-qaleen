import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { PageShell } from "./PageShell";
import type { Role } from "@/lib/store";

export function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user === null) return;
    if (!user || !allow.includes(user.role)) navigate({ to: "/login" });
  }, [user, allow, navigate]);

  if (!user) return <PageShell><div className="glass rounded-2xl p-10 text-center">جاري التحقق...</div></PageShell>;
  if (!allow.includes(user.role)) return <PageShell><div className="glass rounded-2xl p-10 text-center text-destructive">ليس لديك صلاحية للوصول</div></PageShell>;
  return <>{children}</>;
}
