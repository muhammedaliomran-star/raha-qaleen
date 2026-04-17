import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "تسجيل الدخول | RAHA" }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "بريد إلكتروني غير صالح" }),
  password: z.string().min(6, { message: "كلمة المرور قصيرة" }),
});

function LoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const r = schema.safeParse({ email, password });
    if (!r.success) { setError(r.error.issues[0].message); return; }
    try {
      const u = store.login(email, password);
      setUser(u);
      const path = u.role === "admin" ? "/dashboard/admin" : u.role === "doctor" ? "/dashboard/doctor" : u.role === "receptionist" ? "/dashboard/receptionist" : "/dashboard/patient";
      navigate({ to: path });
    } catch (err) { setError((err as Error).message); }
  };

  return (
    <PageShell>
      <div className="max-w-md mx-auto">
        <div className="glass-strong rounded-3xl p-8">
          <h1 className="text-2xl font-extrabold text-center">تسجيل الدخول</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">مرحباً بعودتك إلى RAHA</p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="glass-input w-full h-12 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="glass-input w-full h-12 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary" />
            {error && <div className="text-destructive text-sm">{error}</div>}
            <button className="btn-primary w-full h-12 rounded-xl font-bold">دخول</button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            ليس لديك حساب؟ <Link to="/signup" className="text-primary font-semibold">إنشاء حساب</Link>
          </div>

          <div className="mt-6 glass rounded-xl p-3 text-xs text-muted-foreground text-center">
            حساب الأدمن الافتراضي: <span className="text-foreground font-semibold">admin@raha.com / admin123</span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
