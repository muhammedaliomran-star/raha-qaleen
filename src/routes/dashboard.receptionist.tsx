import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Booking, BookingType, Doctor } from "@/lib/store";

export const Route = createFileRoute("/dashboard/receptionist")({
  head: () => ({ meta: [{ title: "لوحة الاستقبال | RAHA" }] }),
  component: () => <RoleGuard allow={["receptionist", "admin"]}><Reception /></RoleGuard>,
});

function Reception() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ doctorId: "", patientName: "", time: "", bookingType: "new" as BookingType });
  const [error, setError] = useState("");

  const refresh = async () => {
    const [{ data: b }, { data: d }] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("doctors").select("*").order("name"),
    ]);
    setBookings((b ?? []).map((x) => ({
      id: x.id, doctorId: x.doctor_id, doctorName: x.doctor_name,
      patientId: x.patient_id, patientName: x.patient_name,
      time: x.time, date: x.date,
      status: x.status as Booking["status"], bookingType: x.booking_type as BookingType,
    })));
    setDoctors((d ?? []).map((x) => ({
      id: x.id, name: x.name, specialty: x.specialty, area: x.area, price: x.price, image: x.image, times: x.times,
    })));
  };

  useEffect(() => { void refresh(); }, []);

  const add = async () => {
    setError("");
    if (!user) { setError("يجب تسجيل الدخول"); return; }
    const doc = doctors.find((d) => d.id === form.doctorId);
    if (!doc || !form.patientName || !form.time) { setError("املأ كل الحقول"); return; }
    const { error: err } = await supabase.from("bookings").insert({
      doctor_id: doc.id, doctor_name: doc.name,
      patient_id: user.id, // walk-in attributed to receptionist
      patient_name: form.patientName,
      time: form.time, date: new Date().toLocaleDateString("ar-EG"),
      status: "upcoming", booking_type: form.bookingType,
    });
    if (err) { setError(err.message); return; }
    setShowAdd(false);
    setForm({ doctorId: "", patientName: "", time: "", bookingType: "new" });
    void refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("bookings").delete().eq("id", id);
    void refresh();
  };

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
        <div className="glass-strong rounded-2xl p-4 mt-4 grid sm:grid-cols-5 gap-2">
          <select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value, time: "" })} className="glass-input h-11 rounded-xl px-3 text-sm">
            <option value="">اختر الطبيب</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="اسم المريض" className="glass-input h-11 rounded-xl px-3 text-sm" />
          <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="glass-input h-11 rounded-xl px-3 text-sm" disabled={!selectedDoc}>
            <option value="">اختر الموعد</option>
            {selectedDoc?.times.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={form.bookingType} onChange={(e) => setForm({ ...form, bookingType: e.target.value as BookingType })} className="glass-input h-11 rounded-xl px-3 text-sm">
            <option value="new">كشف جديد</option>
            <option value="followup">إعادة كشف</option>
          </select>
          <button onClick={add} className="btn-primary h-11 rounded-xl font-bold">إضافة</button>
          {error && <div className="sm:col-span-5 text-destructive text-sm">{error}</div>}
        </div>
      )}

      <div className="glass-strong rounded-2xl overflow-x-auto mt-6">
        {bookings.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">لا توجد حجوزات</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/40"><tr className="text-right"><th className="p-3">المريض</th><th className="p-3">الطبيب</th><th className="p-3">النوع</th><th className="p-3">التاريخ</th><th className="p-3">الموعد</th><th className="p-3">الحالة</th><th className="p-3"></th></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-white/40">
                  <td className="p-3 font-semibold">{b.patientName}</td>
                  <td className="p-3">{b.doctorName}</td>
                  <td className="p-3">{b.bookingType === "new" ? "كشف جديد" : "إعادة كشف"}</td>
                  <td className="p-3">{b.date}</td>
                  <td className="p-3">{b.time}</td>
                  <td className="p-3">{b.status === "upcoming" ? "قادم" : b.status === "cancelled" ? "ملغي" : "تم"}</td>
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
