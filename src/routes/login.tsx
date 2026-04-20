import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { GoogleButton } from "@/components/GoogleButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "تسجيل الدخول | RAHA" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || password.length < 6) {
      setError("ادخل البريد وكلمة المرور");
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) {
        setError(err.message.toLowerCase().includes("invalid") ? "بيانات الدخول غير صحيحة" : err.message);
        return;
      }
      navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="max-w-md mx-auto">
        <div className="glass-strong rounded-3xl p-8">
          <h1 className="text-2xl font-extrabold text-center">تسجيل الدخول</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">مرحباً بعودتك إلى RAHA</p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <label className="block">
              <span className="block text-xs font-semibold text-foreground/70 mb-1">البريد الإلكتروني</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" className="glass-input w-full h-12 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary text-sm" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-foreground/70 mb-1">كلمة المرور</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" className="glass-input w-full h-12 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary text-sm" />
            </label>
            {error && <div className="text-destructive text-sm">{error}</div>}
            <button disabled={loading} className="btn-primary w-full h-12 rounded-xl font-bold disabled:opacity-60">
              {loading ? "جارٍ الدخول..." : "دخول"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px bg-border flex-1" />
            <span>أو</span>
            <div className="h-px bg-border flex-1" />
          </div>
          <GoogleButton />

          <div className="mt-4 text-center text-sm text-muted-foreground">
            ليس لديك حساب؟ <Link to="/signup" className="text-primary font-semibold">إنشاء حساب</Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
