import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/lib/auth";
import { store, type Role } from "@/lib/store";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "إنشاء حساب | RAHA" }] }),
  component: SignupPage,
});

const schema = z.object({
  fullName: z.string().trim().min(3, { message: "الاسم قصير جداً" }).max(80),
  age: z.number().min(1).max(120),
  gender: z.enum(["male", "female"]),
  email: z.string().trim().email({ message: "بريد إلكتروني غير صالح" }),
  password: z.string().min(6, { message: "كلمة المرور 6 أحرف على الأقل" }),
  role: z.enum(["patient", "doctor", "receptionist", "admin"]),
});

function SignupPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", age: "", gender: "male" as "male" | "female", email: "", password: "", role: "patient" as Role });
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const r = schema.safeParse({ ...form, age: Number(form.age) });
    if (!r.success) { setError(r.error.issues[0].message); return; }
    try {
      const u = store.signup(r.data);
      setUser(u);
      navigate({ to: "/" });
    } catch (err) { setError((err as Error).message); }
  };

  return (
    <PageShell>
      <div className="max-w-lg mx-auto">
        <div className="glass-strong rounded-3xl p-8">
          <h1 className="text-2xl font-extrabold text-center">إنشاء حساب جديد</h1>
          <form onSubmit={submit} className="mt-6 grid sm:grid-cols-2 gap-3">
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="الاسم بالكامل" className="glass-input h-12 rounded-xl px-4 sm:col-span-2 outline-none focus:ring-2 focus:ring-primary" />
            <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="السن" className="glass-input h-12 rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary" />
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as "male" | "female" })} className="glass-input h-12 rounded-xl px-4 outline-none">
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="البريد الإلكتروني" className="glass-input h-12 rounded-xl px-4 sm:col-span-2 outline-none focus:ring-2 focus:ring-primary" />
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="كلمة المرور" className="glass-input h-12 rounded-xl px-4 sm:col-span-2 outline-none focus:ring-2 focus:ring-primary" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="glass-input h-12 rounded-xl px-4 sm:col-span-2 outline-none">
              <option value="patient">مريض</option>
              <option value="doctor">دكتور</option>
              <option value="receptionist">موظفة استقبال</option>
              <option value="admin">أدمن</option>
            </select>
            {error && <div className="text-destructive text-sm sm:col-span-2">{error}</div>}
            <button className="btn-primary h-12 rounded-xl font-bold sm:col-span-2">إنشاء الحساب</button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            لديك حساب؟ <Link to="/login" className="text-primary font-semibold">تسجيل الدخول</Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
