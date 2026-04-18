import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { RoleGuard } from "@/components/RoleGuard";
import { initStore, store, type Booking, type Doctor } from "@/lib/store";

export const Route = createFileRoute("/dashboard/receptionist")({
  head: () => ({ meta: [{ title: "لوحة الاستقبال | RAHA" }] }),
  component: () => <RoleGuard allow={["receptionist", "admin"]}><Reception /></RoleGuard>,
});

function Reception() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ doctorId: "", patientName: "", time: "" });

  const refresh = () => { setBookings(store.getBookings()); setDoctors(store.getDoctors()); };
  useEffect(() => { initStore(); refresh(); }, []);

  const add = () => {
    const doc = doctors.find((d) => d.id === form.doctorId);
    if (!doc || !form.patientName || !form.time) return;
    store.addBooking({
      doctorId: doc.id, doctorName: doc.name,
      patientId: "walkin-" + Date.now(), patientName: form.patientName,
      time: form.time, date: new Date().toLocaleDateString("ar-EG"), status: "upcoming",
      bookingType: "new",
    });
    setShowAdd(false); setForm({ doctorId: "", patientName: "", time: "" }); refresh();
  };

  const remove = (id: string) => { store.setBookings(store.getBookings().filter((b) => b.id !== id)); refresh(); };

  const selectedDoc = doctors.find((d) => d.id === form.doctorId);

  return (
    <PageShell>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">إدارة الحجوزات</h1>
          <p className="text-muted-foreground mt-1">جميع حجوزات العيادات</p>
        </div>
        <button onClick={() => setShowAdd((s) => !s)} className="btn-primary px-4 h-11 rounded-xl font-bold inline-flex items-center gap-2"><Plus className="w-4 h-4" /> حجز جديد</button>
      </div>

      {showAdd && (
        <div className="glass-strong rounded-2xl p-4 mt-4 grid sm:grid-cols-4 gap-2">
          <select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value, time: "" })} className="glass-input h-11 rounded-xl px-3 text-sm">
            <option value="">اختر الطبيب</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="اسم المريض" className="glass-input h-11 rounded-xl px-3 text-sm" />
          <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="glass-input h-11 rounded-xl px-3 text-sm" disabled={!selectedDoc}>
            <option value="">اختر الموعد</option>
            {selectedDoc?.times.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={add} className="btn-primary h-11 rounded-xl font-bold">إضافة</button>
        </div>
      )}

      <div className="glass-strong rounded-2xl overflow-hidden mt-6">
        {bookings.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">لا توجد حجوزات</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/40"><tr className="text-right"><th className="p-3">المريض</th><th className="p-3">الطبيب</th><th className="p-3">التاريخ</th><th className="p-3">الموعد</th><th className="p-3"></th></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-white/40">
                  <td className="p-3 font-semibold">{b.patientName}</td>
                  <td className="p-3">{b.doctorName}</td>
                  <td className="p-3">{b.date}</td>
                  <td className="p-3">{b.time}</td>
                  <td className="p-3 text-left"><button onClick={() => remove(b.id)} className="text-destructive text-xs">حذف</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
