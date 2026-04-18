import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/store";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "إنشاء حساب | RAHA" }] }),
  component: SignupPage,
});

const schema = z.object({
  username: z.string().trim().min(3, { message: "اسم المستخدم 3 أحرف على الأقل" }).max(30).regex(/^[a-zA-Z0-9_.]+$/, { message: "حروف إنجليزية وأرقام فقط" }),
  fullName: z.string().trim().min(3, { message: "الاسم قصير جداً" }).max(80),
  age: z.number().min(1).max(120),
  gender: z.enum(["male", "female"]),
  phone: z.string().trim().regex(/^01[0-9]{9}$/, { message: "رقم هاتف مصري غير صالح (مثال: 01012345678)" }),
  email: z.string().trim().email({ message: "بريد إلكتروني غير صالح" }),
  password: z.string().min(6, { message: "كلمة المرور 6 أحرف على الأقل" }),
  role: z.enum(["patient", "doctor", "receptionist"]),
});

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    age: "",
    gender: "male" as "male" | "female",
    phone: "",
    email: "",
    password: "",
    role: "patient" as Exclude<Role, "admin">,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const r = schema.safeParse({ ...form, age: Number(form.age) });
    if (!r.success) { setError(r.error.issues[0].message); return; }

    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: r.data.email,
        password: r.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: r.data.username,
            full_name: r.data.fullName,
            age: r.data.age,
            gender: r.data.gender,
            phone: r.data.phone,
            role: r.data.role,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already")) {
          setError("هذا البريد مسجل بالفعل");
        } else if (signUpError.message.toLowerCase().includes("password")) {
          setError("كلمة المرور ضعيفة أو مكشوفة، اختر كلمة أقوى");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="max-w-lg mx-auto">
        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold text-center">إنشاء حساب جديد</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">سجّل في ثواني واحجز كشفك</p>

          <form onSubmit={submit} className="mt-6 grid sm:grid-cols-2 gap-3">
            <Field label="اسم المستخدم *" sm2={false}>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="ahmed_ali" className="glass-input h-12 w-full rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary text-sm" />
            </Field>
            <Field label="رقم الهاتف *" sm2={false}>
              <input type="tel" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01012345678" className="glass-input h-12 w-full rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary text-sm" />
            </Field>

            <Field label="الاسم بالكامل *" sm2>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="الاسم بالكامل" className="glass-input h-12 w-full rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary text-sm" />
            </Field>

            <Field label="السن *" sm2={false}>
              <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="السن" className="glass-input h-12 w-full rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary text-sm" />
            </Field>
            <Field label="النوع *" sm2={false}>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as "male" | "female" })} className="glass-input h-12 w-full rounded-xl px-4 outline-none text-sm">
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </Field>

            <Field label="البريد الإلكتروني *" sm2>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="example@email.com" className="glass-input h-12 w-full rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary text-sm" />
            </Field>

            <Field label="كلمة المرور *" sm2>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="6 أحرف على الأقل" className="glass-input h-12 w-full rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary text-sm" />
            </Field>

            <Field label="نوع الحساب" sm2>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "patient", l: "مريض" },
                  { v: "doctor", l: "دكتور" },
                  { v: "receptionist", l: "استقبال" },
                ] as const).map((r) => (
                  <button type="button" key={r.v} onClick={() => setForm({ ...form, role: r.v })}
                    className={`h-11 rounded-xl text-sm font-semibold transition ${form.role === r.v ? "btn-primary" : "glass hover:bg-white/80"}`}>
                    {r.l}
                  </button>
                ))}
              </div>
            </Field>

            {error && <div className="text-destructive text-sm sm:col-span-2 text-center">{error}</div>}
            <button disabled={loading} className="btn-primary h-12 rounded-xl font-bold sm:col-span-2 mt-2 disabled:opacity-60">
              {loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            لديك حساب؟ <Link to="/login" className="text-primary font-semibold">تسجيل الدخول</Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Field({ label, children, sm2 }: { label: string; children: React.ReactNode; sm2: boolean }) {
  return (
    <label className={`block ${sm2 ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs font-semibold text-foreground/70 mb-1">{label}</span>
      {children}
    </label>
  );
}
