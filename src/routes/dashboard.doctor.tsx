import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/lib/auth";
import { initStore, store, type Booking } from "@/lib/store";

export const Route = createFileRoute("/dashboard/doctor")({
  head: () => ({ meta: [{ title: "لوحة الطبيب | RAHA" }] }),
  component: () => <RoleGuard allow={["doctor"]}><DoctorDash /></RoleGuard>,
});

function DoctorDash() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    initStore();
    // demo: match by name to seed doctor "د. أحمد المصري"
    if (user) setBookings(store.getBookings().filter((b) => b.doctorName === user.fullName));
  }, [user]);

  return (
    <PageShell>
      <h1 className="text-2xl sm:text-3xl font-extrabold">مرحباً د. {user?.fullName}</h1>
      <p className="text-muted-foreground mt-1">مواعيدك لليوم</p>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <div className="glass rounded-2xl p-5"><div className="text-3xl font-extrabold">{bookings.length}</div><div className="text-xs text-muted-foreground">إجمالي حجوزات اليوم</div></div>
        <div className="glass rounded-2xl p-5"><div className="text-3xl font-extrabold text-success">{bookings.filter(b=>b.status==='upcoming').length}</div><div className="text-xs text-muted-foreground">قادمة</div></div>
        <div className="glass rounded-2xl p-5"><div className="text-3xl font-extrabold text-primary">4.9</div><div className="text-xs text-muted-foreground">تقييمك</div></div>
      </div>

      <div className="glass-strong rounded-3xl p-6 mt-8">
        <h2 className="font-bold mb-4">إدارة المواعيد المتاحة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {["09:00","10:00","11:00","12:00","01:00","04:00","05:00","06:00"].map((t) => (
            <button key={t} className="glass h-11 rounded-xl text-sm hover:bg-white/80 transition">{t}</button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">اضغط على الموعد لتفعيله / تعطيله (واجهة فقط)</p>
      </div>

      <h2 className="text-lg font-bold mt-8 mb-3">الحجوزات</h2>
      <div className="glass-strong rounded-2xl overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">لا توجد حجوزات حتى الآن</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/40"><tr className="text-right"><th className="p-3">المريض</th><th className="p-3">التاريخ</th><th className="p-3">الموعد</th></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-white/40">
                  <td className="p-3 font-semibold">{b.patientName}</td>
                  <td className="p-3">{b.date}</td>
                  <td className="p-3">{b.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
