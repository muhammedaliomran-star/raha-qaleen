import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Clock, Stethoscope, X } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Booking } from "@/lib/store";

export const Route = createFileRoute("/dashboard/patient")({
  head: () => ({ meta: [{ title: "لوحة المريض | RAHA" }] }),
  component: () => <RoleGuard allow={["patient", "admin"]}><Patient /></RoleGuard>,
});

function Patient() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });
    setBookings((data ?? []).map(mapBooking));
    setLoading(false);
  };

  useEffect(() => { void load(); }, [user]);

  const cancel = async (id: string) => {
    if (!confirm("هل تريد إلغاء هذا الحجز؟")) return;
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    void load();
  };

  return (
    <PageShell>
      <h1 className="text-2xl sm:text-3xl font-extrabold">مرحباً، {profile?.fullName ?? ""}</h1>
      <p className="text-muted-foreground mt-1">إليك حجوزاتك</p>

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
      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">جارٍ التحميل...</div>
      ) : bookings.length === 0 ? (
        <div className="glass-strong rounded-2xl p-10 text-center text-muted-foreground">لا توجد حجوزات بعد</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {bookings.map((b) => (
            <div key={b.id} className="glass-strong rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-lg">{b.doctorName}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="glass px-2 py-1 rounded-full">{b.bookingType === "new" ? "كشف جديد" : "إعادة كشف"}</span>
                    <span className={`glass px-2 py-1 rounded-full ${b.status === "upcoming" ? "text-success" : b.status === "cancelled" ? "text-destructive" : ""}`}>
                      {b.status === "upcoming" ? "قادم" : b.status === "cancelled" ? "ملغي" : "تم"}
                    </span>
                  </div>
                </div>
                {b.status === "upcoming" && (
                  <button onClick={() => cancel(b.id)} title="إلغاء" className="w-9 h-9 rounded-full glass grid place-items-center text-destructive hover:bg-destructive/10 transition">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {b.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {b.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
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

function mapBooking(b: { id: string; doctor_id: string; doctor_name: string; patient_id: string; patient_name: string; time: string; date: string; status: string; booking_type: string }): Booking {
  return {
    id: b.id, doctorId: b.doctor_id, doctorName: b.doctor_name,
    patientId: b.patient_id, patientName: b.patient_name,
    time: b.time, date: b.date,
    status: b.status as Booking["status"],
    bookingType: b.booking_type as Booking["bookingType"],
  };
}
