import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Clock, Stethoscope } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/lib/auth";
import { initStore, store, type Booking } from "@/lib/store";

export const Route = createFileRoute("/dashboard/patient")({
  head: () => ({ meta: [{ title: "لوحة المريض | RAHA" }] }),
  component: () => <RoleGuard allow={["patient"]}><Patient /></RoleGuard>,
});

function Patient() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    initStore();
    if (user) setBookings(store.getBookings().filter((b) => b.patientId === user.id));
  }, [user]);

  return (
    <PageShell>
      <h1 className="text-2xl sm:text-3xl font-extrabold">مرحباً، {user?.fullName}</h1>
      <p className="text-muted-foreground mt-1">إليك حجوزاتك القادمة</p>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <Stat icon={<Calendar className="w-5 h-5" />} label="إجمالي الحجوزات" value={bookings.length} />
        <Stat icon={<Clock className="w-5 h-5" />} label="القادمة" value={bookings.filter((b) => b.status === "upcoming").length} />
        <Link to="/doctors" className="glass card-hover rounded-2xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl btn-primary grid place-items-center"><Stethoscope className="w-5 h-5 text-primary-foreground" /></div>
          <div>
            <div className="font-bold">احجز موعد جديد</div>
            <div className="text-xs text-muted-foreground">تصفح الأطباء الآن</div>
          </div>
        </Link>
      </div>

      <h2 className="text-lg font-bold mt-8 mb-3">الحجوزات</h2>
      <div className="glass-strong rounded-2xl overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">لا توجد حجوزات بعد</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/40">
              <tr className="text-right">
                <th className="p-3">الطبيب</th><th className="p-3">التاريخ</th><th className="p-3">الموعد</th><th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-white/40">
                  <td className="p-3 font-semibold">{b.doctorName}</td>
                  <td className="p-3">{b.date}</td>
                  <td className="p-3">{b.time}</td>
                  <td className="p-3"><span className="glass px-2 py-1 rounded-full text-xs text-success">قادم</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}

function Stat({ icon, label, value }: { icon: ReactNodeLike; label: string; value: number | string }) {
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl btn-primary grid place-items-center text-primary-foreground">{icon}</div>
      <div>
        <div className="text-2xl font-extrabold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
type ReactNodeLike = React.ReactNode;
