import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "تسجيل الدخول | RAHA" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim()) { setError("ادخل اسم المستخدم أو رقم الهاتف"); return; }
    if (password.length < 6) { setError("كلمة المرور قصيرة"); return; }
    try {
      const u = store.login(identifier, password);
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
            <label className="block">
              <span className="block text-xs font-semibold text-foreground/70 mb-1">اسم المستخدم أو رقم الهاتف</span>
              <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="ahmed_ali أو 01012345678" className="glass-input w-full h-12 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary text-sm" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-foreground/70 mb-1">كلمة المرور</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" className="glass-input w-full h-12 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary text-sm" />
            </label>
            {error && <div className="text-destructive text-sm">{error}</div>}
            <button className="btn-primary w-full h-12 rounded-xl font-bold">دخول</button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            ليس لديك حساب؟ <Link to="/signup" className="text-primary font-semibold">إنشاء حساب</Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
