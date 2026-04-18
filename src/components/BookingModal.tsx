import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Doctor, BookingType } from "@/lib/store";

export function BookingModal({ doctor, open, onClose }: { doctor: Doctor; open: boolean; onClose: () => void }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<BookingType>("new");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    if (!user || !profile) { onClose(); navigate({ to: "/login" }); return; }
    if (!time) return;
    setError("");
    setSubmitting(true);
    try {
      const { error: insErr } = await supabase.from("bookings").insert({
        doctor_id: doctor.id,
        doctor_name: doctor.name,
        patient_id: user.id,
        patient_name: profile.fullName,
        time,
        date: new Date().toLocaleDateString("ar-EG"),
        status: "upcoming",
        booking_type: bookingType,
      });
      if (insErr) { setError(insErr.message); return; }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4 bg-foreground/30 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-strong rounded-3xl w-full max-w-md p-6"
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">تأكيد الحجز</h3>
              <button onClick={onClose} aria-label="إغلاق" className="w-9 h-9 rounded-full glass grid place-items-center"><X className="w-4 h-4" /></button>
            </div>

            {done ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
                <h4 className="mt-4 font-bold text-xl">تم تأكيد الحجز بنجاح</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {bookingType === "new" ? "كشف جديد" : "إعادة كشف"} • سنرسل لك تذكير قبل الموعد
                </p>
                <button onClick={() => { setDone(false); setTime(null); onClose(); navigate({ to: "/dashboard/patient" }); }} className="btn-primary mt-6 px-5 h-11 rounded-xl text-sm font-bold">عرض حجوزاتي</button>
              </div>
            ) : (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <img src={doctor.image} alt={doctor.name} className="w-14 h-14 rounded-2xl object-cover" />
                  <div>
                    <div className="font-bold">{doctor.name}</div>
                    <div className="text-xs text-muted-foreground">{doctor.specialty} — {doctor.area}</div>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-sm font-semibold">نوع الحجز</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {([
                      { v: "new", l: "كشف جديد" },
                      { v: "followup", l: "إعادة كشف" },
                    ] as const).map((b) => (
                      <button
                        key={b.v}
                        onClick={() => setBookingType(b.v)}
                        className={`h-11 rounded-xl text-sm font-bold transition ${bookingType === b.v ? "btn-primary" : "glass hover:bg-white/80 text-foreground"}`}
                      >{b.l}</button>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-sm font-semibold flex items-center gap-1"><Clock className="w-4 h-4" /> اختر الموعد</label>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {doctor.times.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={`h-11 rounded-xl text-sm font-medium transition ${
                          time === t ? "btn-primary" : "glass hover:bg-white/80 text-foreground"
                        }`}
                      >{t}</button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">السعر</div>
                  <div className="text-primary font-extrabold text-lg">{doctor.price} ج.م</div>
                </div>

                {error && <div className="mt-3 text-destructive text-sm text-center">{error}</div>}

                <button
                  disabled={!time || submitting}
                  onClick={confirm}
                  className="btn-primary w-full mt-5 h-12 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >{submitting ? "جارٍ الحجز..." : "تأكيد الحجز"}</button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
