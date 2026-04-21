import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Stethoscope, CalendarCheck, Megaphone, Trash2, Plus, Upload, Save, ArrowUp, ArrowDown, Loader2, MapPin, DollarSign, Clock, User as UserIcon, ImageIcon } from "lucide-react";
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

      <div className="glass mt-6 rounded-2xl p-2 overflow-x-auto scrollbar-none">
        <div className="flex gap-1 min-w-max">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 h-11 rounded-xl text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap transition-all ${
                tab === t.id
                  ? "btn-primary shadow-md scale-[1.02]"
                  : "hover:bg-white/70 text-foreground/70 hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
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
  const emptyForm = { title: "", description: "", cta: "احجز الآن", image: "" };
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const uploadImage = async (file: File): Promise<string | null> => {
    setError("");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("ads").upload(path, file, { upsert: false });
      if (upErr) { setError(upErr.message); return null; }
      const { data } = supabase.storage.from("ads").getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setForm((f) => ({ ...f, image: url }));
    e.target.value = "";
  };

  const addAd = async () => {
    setError("");
    if (!form.title || !form.image) { setError("أضف العنوان والصورة"); return; }
    const { error: err } = await supabase.from("ads").insert({
      title: form.title, description: form.description, cta: form.cta || "احجز الآن",
      image: form.image, is_active: true, order: ads.length + 1,
    });
    if (err) { setError(err.message); return; }
    setForm(emptyForm);
    onChange();
  };

  const update = async (id: string, patch: Partial<{ is_active: boolean; title: string; description: string; cta: string; image: string; order: number }>) => {
    await supabase.from("ads").update(patch).eq("id", id);
    onChange();
  };

  const replaceImage = async (id: string, file: File) => {
    const url = await uploadImage(file);
    if (url) await update(id, { image: url });
  };

  const move = async (a: Ad, dir: -1 | 1) => {
    const sorted = [...ads].sort((x, y) => x.order - y.order);
    const idx = sorted.findIndex((x) => x.id === a.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("ads").update({ order: swap.order }).eq("id", a.id),
      supabase.from("ads").update({ order: a.order }).eq("id", swap.id),
    ]);
    onChange();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا الإعلان؟")) return;
    await supabase.from("ads").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="space-y-6">
      {/* Add new ad */}
      <div className="glass-strong rounded-2xl p-4 space-y-3">
        <h3 className="font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> إضافة إعلان جديد</h3>
        <div className="grid sm:grid-cols-3 gap-2">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="العنوان" className="glass-input h-11 rounded-xl px-3 text-sm" />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="الوصف" className="glass-input h-11 rounded-xl px-3 text-sm sm:col-span-2" />
          <input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="نص الزر" className="glass-input h-11 rounded-xl px-3 text-sm" />
          <label className="glass-input h-11 rounded-xl px-3 text-sm inline-flex items-center justify-center gap-2 cursor-pointer sm:col-span-2 hover:bg-white/60 transition">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {form.image ? "تم رفع الصورة ✓ (اضغط لتغييرها)" : "ارفع صورة الإعلان"}
            <input type="file" accept="image/*" className="hidden" onChange={onPickFile} disabled={uploading} />
          </label>
        </div>
        {form.image && <img src={form.image} alt="" className="w-full h-32 object-cover rounded-xl" />}
        {error && <div className="text-destructive text-sm">{error}</div>}
        <button onClick={addAd} disabled={uploading} className="btn-primary h-11 px-6 rounded-xl font-bold inline-flex items-center gap-2 disabled:opacity-50">
          <Plus className="w-4 h-4" /> إضافة الإعلان
        </button>
      </div>

      {/* Existing ads */}
      {ads.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">لا توجد إعلانات بعد</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {ads.map((a) => <AdCard key={a.id} ad={a} onUpdate={update} onReplaceImage={replaceImage} onRemove={remove} onMove={move} uploading={uploading} />)}
        </div>
      )}
    </div>
  );
}

function AdCard({
  ad, onUpdate, onReplaceImage, onRemove, onMove, uploading,
}: {
  ad: Ad;
  onUpdate: (id: string, patch: Partial<{ is_active: boolean; title: string; description: string; cta: string }>) => Promise<void>;
  onReplaceImage: (id: string, file: File) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onMove: (a: Ad, dir: -1 | 1) => Promise<void>;
  uploading: boolean;
}) {
  const [edit, setEdit] = useState({ title: ad.title, description: ad.description, cta: ad.cta });
  const [saving, setSaving] = useState(false);
  const dirty = edit.title !== ad.title || edit.description !== ad.description || edit.cta !== ad.cta;

  const save = async () => {
    setSaving(true);
    await onUpdate(ad.id, edit);
    setSaving(false);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="relative">
        <img src={ad.image} alt={ad.title} className="w-full h-40 object-cover" />
        <label className="absolute top-2 right-2 glass-strong h-9 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-white/90 transition">
          <Upload className="w-3.5 h-3.5" /> تغيير
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) void onReplaceImage(ad.id, f); e.target.value = ""; }} />
        </label>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <button onClick={() => onMove(ad, -1)} className="glass-strong w-8 h-8 rounded-lg grid place-items-center hover:bg-white/90"><ArrowUp className="w-3.5 h-3.5" /></button>
          <button onClick={() => onMove(ad, 1)} className="glass-strong w-8 h-8 rounded-lg grid place-items-center hover:bg-white/90"><ArrowDown className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} className="glass-input h-10 w-full rounded-lg px-3 text-sm font-bold" placeholder="العنوان" />
        <textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} rows={2} className="glass-input w-full rounded-lg px-3 py-2 text-sm" placeholder="الوصف" />
        <input value={edit.cta} onChange={(e) => setEdit({ ...edit, cta: e.target.value })} className="glass-input h-10 w-full rounded-lg px-3 text-sm" placeholder="نص الزر" />
        <div className="flex items-center justify-between gap-2 pt-2">
          <label className="flex items-center gap-1 text-xs cursor-pointer">
            <input type="checkbox" checked={ad.isActive} onChange={(e) => onUpdate(ad.id, { is_active: e.target.checked })} /> نشط
          </label>
          <div className="flex gap-1">
            {dirty && (
              <button onClick={save} disabled={saving} className="btn-primary h-9 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} حفظ
              </button>
            )}
            <button onClick={() => onRemove(ad.id)} className="glass h-9 w-9 rounded-lg grid place-items-center text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
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
