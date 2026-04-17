import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Stethoscope, CalendarCheck, Megaphone, Trash2, Plus } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { RoleGuard } from "@/components/RoleGuard";
import { initStore, store, type Ad, type Booking, type Doctor, type User } from "@/lib/store";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "لوحة الأدمن | RAHA" }] }),
  component: () => <RoleGuard allow={["admin"]}><AdminDash /></RoleGuard>,
});

type Tab = "stats" | "users" | "doctors" | "bookings" | "ads";

function AdminDash() {
  const [tab, setTab] = useState<Tab>("stats");
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);

  const refresh = () => {
    setUsers(store.getUsers()); setDoctors(store.getDoctors());
    setBookings(store.getBookings()); setAds(store.getAds().sort((a,b)=>a.order-b.order));
  };
  useEffect(() => { initStore(); refresh(); }, []);

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
          <DataTable headers={["الاسم","البريد","الدور","العمر",""]}>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/40">
                <td className="p-3 font-semibold">{u.fullName}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3"><span className="glass px-2 py-1 rounded-full text-xs">{roleLabel(u.role)}</span></td>
                <td className="p-3">{u.age}</td>
                <td className="p-3 text-left">
                  {u.role !== "admin" && (
                    <button onClick={() => { store.setUsers(users.filter(x=>x.id!==u.id)); refresh(); }} className="text-destructive"><Trash2 className="w-4 h-4" /></button>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {tab === "doctors" && <DoctorsManager doctors={doctors} onChange={refresh} />}

        {tab === "bookings" && (
          <DataTable headers={["المريض","الطبيب","التاريخ","الموعد",""]}>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-white/40">
                <td className="p-3 font-semibold">{b.patientName}</td>
                <td className="p-3">{b.doctorName}</td>
                <td className="p-3">{b.date}</td>
                <td className="p-3">{b.time}</td>
                <td className="p-3 text-left">
                  <button onClick={() => { store.setBookings(bookings.filter(x=>x.id!==b.id)); refresh(); }} className="text-destructive"><Trash2 className="w-4 h-4" /></button>
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

function roleLabel(r: string) {
  return r === "admin" ? "أدمن" : r === "doctor" ? "دكتور" : r === "receptionist" ? "استقبال" : "مريض";
}

function AdsManager({ ads, onChange }: { ads: Ad[]; onChange: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", cta: "احجز الآن", image: "" });

  const addAd = () => {
    if (!form.title || !form.image) return;
    const next: Ad = {
      id: "a-" + Date.now(), title: form.title, description: form.description,
      cta: form.cta, image: form.image, isActive: true, order: ads.length + 1,
    };
    store.setAds([...ads, next]);
    setForm({ title: "", description: "", cta: "احجز الآن", image: "" });
    onChange();
  };
  const update = (id: string, patch: Partial<Ad>) => {
    store.setAds(ads.map((a) => a.id === id ? { ...a, ...patch } : a)); onChange();
  };
  const remove = (id: string) => { store.setAds(ads.filter((a) => a.id !== id)); onChange(); };
  const move = (id: string, dir: -1 | 1) => {
    const sorted = [...ads].sort((a,b)=>a.order-b.order);
    const i = sorted.findIndex(a=>a.id===id);
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    [sorted[i].order, sorted[j].order] = [sorted[j].order, sorted[i].order];
    store.setAds(sorted); onChange();
  };

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
                <label className="flex items-center gap-1"><input type="checkbox" checked={a.isActive} onChange={(e)=>update(a.id,{isActive:e.target.checked})} /> نشط</label>
                <button onClick={()=>move(a.id,-1)} className="glass px-2 py-1 rounded-md">↑</button>
                <button onClick={()=>move(a.id,1)} className="glass px-2 py-1 rounded-md">↓</button>
                <span className="text-muted-foreground">ترتيب: {a.order}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
