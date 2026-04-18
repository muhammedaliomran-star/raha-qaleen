import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/lib/auth";
import { store, type Role, type BookingType } from "@/lib/store";

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
  email: z.string().trim().email({ message: "بريد إلكتروني غير صالح" }).optional().or(z.literal("")),
  password: z.string().min(6, { message: "كلمة المرور 6 أحرف على الأقل" }),
  role: z.enum(["patient", "doctor", "receptionist"]),
  bookingType: z.enum(["new", "followup"]),
});

function SignupPage() {
  const { setUser } = useAuth();
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
    bookingType: "new" as BookingType,
  });
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const r = schema.safeParse({ ...form, age: Number(form.age), email: form.email || undefined });
    if (!r.success) { setError(r.error.issues[0].message); return; }
    try {
      const u = store.signup({ ...r.data, email: r.data.email || undefined });
      setUser(u);
      navigate({ to: "/" });
    } catch (err) { setError((err as Error).message); }
  };

  return (
    <PageShell>
      <div className="max-w-lg mx-auto">
        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold text-center">إنشاء حساب جديد</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">سجّل برقم موبايلك واحجز كشفك في ثواني</p>

          <form onSubmit={submit} className="mt-6 grid sm:grid-cols-2 gap-3">
            <Field label="اسم المستخدم *" sm2={false}>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="مثال: ahmed_ali" className="glass-input h-12 w-full rounded-xl px-4 outline-none focus:ring-2 focus:ring-primary text-sm" />
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

            <Field label="البريد الإلكتروني (اختياري)" sm2>
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

            <Field label="نوع الحجز" sm2>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: "new", l: "كشف جديد" },
                  { v: "followup", l: "إعادة كشف" },
                ] as const).map((b) => (
                  <button type="button" key={b.v} onClick={() => setForm({ ...form, bookingType: b.v })}
                    className={`h-11 rounded-xl text-sm font-semibold transition ${form.bookingType === b.v ? "btn-primary" : "glass hover:bg-white/80"}`}>
                    {b.l}
                  </button>
                ))}
              </div>
            </Field>

            {error && <div className="text-destructive text-sm sm:col-span-2 text-center">{error}</div>}
            <button className="btn-primary h-12 rounded-xl font-bold sm:col-span-2 mt-2">إنشاء الحساب</button>
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
