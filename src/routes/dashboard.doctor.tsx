import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Booking } from "@/lib/store";

export const Route = createFileRoute("/dashboard/doctor")({
  head: () => ({ meta: [{ title: "لوحة الطبيب | RAHA" }] }),
  component: () => <RoleGuard allow={["doctor", "admin"]}><DoctorDash /></RoleGuard>,
});

function DoctorDash() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("bookings")
      .select("*")
      .eq("doctor_name", profile.fullName)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBookings(
          (data ?? []).map((b) => ({
            id: b.id, doctorId: b.doctor_id, doctorName: b.doctor_name,
            patientId: b.patient_id, patientName: b.patient_name,
            time: b.time, date: b.date,
            status: b.status as Booking["status"],
            bookingType: b.booking_type as Booking["bookingType"],
          })),
        );
      });
  }, [profile]);

  return (
    <PageShell>
      <h1 className="text-2xl sm:text-3xl font-extrabold">مرحباً د. {profile?.fullName ?? ""}</h1>
      <p className="text-muted-foreground mt-1">مواعيدك</p>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <div className="glass rounded-2xl p-5"><div className="text-3xl font-extrabold">{bookings.length}</div><div className="text-xs text-muted-foreground">إجمالي الحجوزات</div></div>
        <div className="glass rounded-2xl p-5"><div className="text-3xl font-extrabold text-success">{bookings.filter(b=>b.status==='upcoming').length}</div><div className="text-xs text-muted-foreground">قادمة</div></div>
        <div className="glass rounded-2xl p-5"><div className="text-3xl font-extrabold text-primary">4.9</div><div className="text-xs text-muted-foreground">تقييمك</div></div>
      </div>

      <h2 className="text-lg font-bold mt-8 mb-3">الحجوزات</h2>
      <div className="glass-strong rounded-2xl overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">لا توجد حجوزات حتى الآن</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/40"><tr className="text-right"><th className="p-3">المريض</th><th className="p-3">النوع</th><th className="p-3">التاريخ</th><th className="p-3">الموعد</th><th className="p-3">الحالة</th></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-white/40">
                  <td className="p-3 font-semibold">{b.patientName}</td>
                  <td className="p-3">{b.bookingType === "new" ? "كشف جديد" : "إعادة كشف"}</td>
                  <td className="p-3">{b.date}</td>
                  <td className="p-3">{b.time}</td>
                  <td className="p-3">{b.status === "upcoming" ? "قادم" : b.status === "cancelled" ? "ملغي" : "تم"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
