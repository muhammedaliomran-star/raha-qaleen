import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Stethoscope, CalendarCheck, Megaphone, Trash2, Plus, Upload, Save, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { RoleGuard } from "@/components/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { SPECIALTIES, QALEEN_AREAS, ROLE_LABEL, type Ad, type Booking, type Doctor, type Role } from "@/lib/store";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "لوحة الأدمن | RAHA" }] }),
  component: () => <RoleGuard allow={["admin"]}><AdminDash /></RoleGuard>,
});

type Tab = "stats" | "users" | "doctors" | "bookings" | "ads";

interface ProfileRow {
  id: string;
  username: string;
  full_name: string;
  phone: string;
  age: number;
  roles: Role[];
}

function AdminDash() {
  const [tab, setTab] = useState<Tab>("stats");
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);

  const refresh = async () => {
    const [profilesRes, rolesRes, doctorsRes, bookingsRes, adsRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("*"),
      supabase.from("doctors").select("*").order("created_at", { ascending: false }),
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("ads").select("*").order("order"),
    ]);

    const rolesByUser = new Map<string, Role[]>();
    (rolesRes.data ?? []).forEach((r) => {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role as Role);
      rolesByUser.set(r.user_id, list);
    });

    setUsers((profilesRes.data ?? []).map((p) => ({
      id: p.id, username: p.username, full_name: p.full_name, phone: p.phone, age: p.age,
      roles: rolesByUser.get(p.id) ?? [],
    })));
    setDoctors((doctorsRes.data ?? []).map((d) => ({
      id: d.id, name: d.name, specialty: d.specialty, area: d.area,
      price: d.price, image: d.image, times: d.times,
    })));
    setBookings((bookingsRes.data ?? []).map((b) => ({
      id: b.id, doctorId: b.doctor_id, doctorName: b.doctor_name,
      patientId: b.patient_id, patientName: b.patient_name,
      time: b.time, date: b.date,
      status: b.status as Booking["status"], bookingType: b.booking_type as Booking["bookingType"],
    })));
    setAds((adsRes.data ?? []).map((a) => ({
      id: a.id, title: a.title, description: a.description, cta: a.cta,
      image: a.image, isActive: a.is_active, order: a.order,
    })));
  };

  useEffect(() => { void refresh(); }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "stats", label: "الإحصائيات", icon: <CalendarCheck className="w-4 h-4" /> },
    { id: "users", label: "المستخدمون", icon: <Users className="w-4 h-4" /> },
    { id: "doctors", label: "الأطباء", icon: <Stethoscope className="w-4 h-4" /> },
    { id: "bookings", label: "الحجوزات", icon: <CalendarCheck className="w-4 h-4" /> },
    { id: "ads", label: "الإعلانات", icon: <Megaphone className="w-4 h-4" /> },
  ];

  return (
    <PageShell>
      <h1 className="text-2xl sm:text-3xl font-extrabold">لوحة الأدمن</h1>
      <p className="text-muted-foreground mt-1">تحكم كامل بالمنصة</p>

      <div className="glass mt-6 rounded-2xl p-2 flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 h-10 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition ${tab===t.id?"btn-primary":"hover:bg-white/60"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "stats" && (
          <div className="grid sm:grid-cols-4 gap-4">
            <StatCard icon={<Users />} label="المستخدمون" value={users.length} />
            <StatCard icon={<Stethoscope />} label="الأطباء" value={doctors.length} />
            <StatCard icon={<CalendarCheck />} label="الحجوزات" value={bookings.length} />
            <StatCard icon={<Megaphone />} label="الإعلانات النشطة" value={ads.filter(a=>a.isActive).length} />
          </div>
        )}

        {tab === "users" && (
          <DataTable headers={["الاسم","المستخدم","الهاتف","الأدوار","العمر"]}>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/40">
                <td className="p-3 font-semibold">{u.full_name}</td>
                <td className="p-3">{u.username}</td>
                <td className="p-3">{u.phone}</td>
                <td className="p-3 flex flex-wrap gap-1">
                  {u.roles.map((r) => <span key={r} className="glass px-2 py-1 rounded-full text-xs">{ROLE_LABEL[r]}</span>)}
                </td>
                <td className="p-3">{u.age}</td>
              </tr>
            ))}
          </DataTable>
        )}

        {tab === "doctors" && <DoctorsManager doctors={doctors} onChange={refresh} />}

        {tab === "bookings" && (
          <DataTable headers={["المريض","الطبيب","النوع","التاريخ","الموعد",""]}>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-white/40">
                <td className="p-3 font-semibold">{b.patientName}</td>
                <td className="p-3">{b.doctorName}</td>
                <td className="p-3">{b.bookingType === "new" ? "كشف جديد" : "إعادة كشف"}</td>
                <td className="p-3">{b.date}</td>
                <td className="p-3">{b.time}</td>
                <td className="p-3 text-left">
                  <button onClick={async () => { await supabase.from("bookings").delete().eq("id", b.id); refresh(); }} className="text-destructive"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {tab === "ads" && <AdsManager ads={ads} onChange={refresh} />}
      </div>
    </PageShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl btn-primary grid place-items-center text-primary-foreground">{icon}</div>
      <div className="text-3xl font-extrabold mt-3">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="glass-strong rounded-2xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-white/40"><tr className="text-right">{headers.map((h,i)=><th key={i} className="p-3">{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function AdsManager({ ads, onChange }: { ads: Ad[]; onChange: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", cta: "احجز الآن", image: "" });

  const addAd = async () => {
    if (!form.title || !form.image) return;
    await supabase.from("ads").insert({
      title: form.title, description: form.description, cta: form.cta,
      image: form.image, is_active: true, order: ads.length + 1,
    });
    setForm({ title: "", description: "", cta: "احجز الآن", image: "" });
    onChange();
  };
  const update = async (id: string, patch: { is_active?: boolean }) => {
    await supabase.from("ads").update(patch).eq("id", id); onChange();
  };
  const remove = async (id: string) => { await supabase.from("ads").delete().eq("id", id); onChange(); };

  return (
    <div className="space-y-6">
      <div className="glass-strong rounded-2xl p-4 grid sm:grid-cols-5 gap-2">
        <input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="العنوان" className="glass-input h-11 rounded-xl px-3 text-sm sm:col-span-1" />
        <input value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} placeholder="الوصف" className="glass-input h-11 rounded-xl px-3 text-sm sm:col-span-2" />
        <input value={form.image} onChange={(e)=>setForm({...form,image:e.target.value})} placeholder="رابط الصورة" className="glass-input h-11 rounded-xl px-3 text-sm" />
        <button onClick={addAd} className="btn-primary h-11 rounded-xl font-bold inline-flex items-center justify-center gap-1"><Plus className="w-4 h-4" /> إضافة</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {ads.map((a) => (
          <div key={a.id} className="glass rounded-2xl overflow-hidden">
            <img src={a.image} alt={a.title} className="w-full h-32 object-cover" />
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.description}</div>
                </div>
                <button onClick={()=>remove(a.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1"><input type="checkbox" checked={a.isActive} onChange={(e)=>update(a.id,{is_active:e.target.checked})} /> نشط</label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DoctorsManager({ doctors, onChange }: { doctors: Doctor[]; onChange: () => void }) {
  const [form, setForm] = useState({
    name: "", specialty: SPECIALTIES[0].name, area: QALEEN_AREAS[0],
    price: "", image: "", times: "10:00 ص, 12:00 م, 04:00 م",
  });
  const [error, setError] = useState("");

  const addDoctor = async () => {
    setError("");
    if (!form.name || !form.area || !form.price) { setError("املأ الاسم والمنطقة والسعر"); return; }
    const { error: err } = await supabase.from("doctors").insert({
      name: form.name,
      specialty: form.specialty,
      area: form.area,
      price: Number(form.price) || 0,
      image: form.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form.name)}&backgroundColor=1856FF`,
      times: form.times.split(",").map((t) => t.trim()).filter(Boolean),
    });
    if (err) { setError(err.message); return; }
    setForm({ name: "", specialty: SPECIALTIES[0].name, area: QALEEN_AREAS[0], price: "", image: "", times: "10:00 ص, 12:00 م, 04:00 م" });
    onChange();
  };

  const remove = async (id: string) => {
    await supabase.from("doctors").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="space-y-6">
      <div className="glass-strong rounded-2xl p-4 grid sm:grid-cols-6 gap-2">
        <input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="اسم الطبيب" className="glass-input h-11 rounded-xl px-3 text-sm sm:col-span-2" />
        <select value={form.specialty} onChange={(e)=>setForm({...form,specialty:e.target.value})} className="glass-input h-11 rounded-xl px-3 text-sm">
          {SPECIALTIES.map((s) => <option key={s.key} value={s.name}>{s.emoji} {s.name}</option>)}
        </select>
        <select value={form.area} onChange={(e)=>setForm({...form,area:e.target.value})} className="glass-input h-11 rounded-xl px-3 text-sm">
          {QALEEN_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <input type="number" value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})} placeholder="السعر" className="glass-input h-11 rounded-xl px-3 text-sm" />
        <button onClick={addDoctor} className="btn-primary h-11 rounded-xl font-bold inline-flex items-center justify-center gap-1"><Plus className="w-4 h-4" /> إضافة</button>
        <input value={form.image} onChange={(e)=>setForm({...form,image:e.target.value})} placeholder="رابط الصورة (اختياري)" className="glass-input h-11 rounded-xl px-3 text-sm sm:col-span-3" />
        <input value={form.times} onChange={(e)=>setForm({...form,times:e.target.value})} placeholder="المواعيد (مفصولة بفاصلة)" className="glass-input h-11 rounded-xl px-3 text-sm sm:col-span-3" />
        {error && <div className="sm:col-span-6 text-destructive text-sm">{error}</div>}
      </div>

      <div className="glass-strong rounded-2xl overflow-x-auto">
        {doctors.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">لا يوجد أطباء بعد — أضف أول طبيب من النموذج أعلاه</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/40"><tr className="text-right"><th className="p-3">الاسم</th><th className="p-3">التخصص</th><th className="p-3">المنطقة</th><th className="p-3">السعر</th><th className="p-3"></th></tr></thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id} className="border-t border-white/40">
                  <td className="p-3 font-semibold flex items-center gap-2"><img src={d.image} className="w-8 h-8 rounded-full object-cover" alt="" />{d.name}</td>
                  <td className="p-3">{d.specialty}</td>
                  <td className="p-3">{d.area}</td>
                  <td className="p-3">{d.price} ج.م</td>
                  <td className="p-3 text-left">
                    <button onClick={() => remove(d.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
