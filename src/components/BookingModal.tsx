import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Clock, CalendarIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Doctor, BookingType, AvailabilitySlot } from "@/lib/store";

export function BookingModal({ doctor, open, onClose }: { doctor: Doctor; open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<BookingType>("new");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const dateIso = useMemo(() => format(date, "yyyy-MM-dd"), [date]);

  // Fetch slots whenever date or doctor changes
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSlotId(null);
    supabase
      .from("doctor_availability")
      .select("id,doctor_id,date,time,is_booked")
      .eq("doctor_id", doctor.id)
      .eq("date", dateIso)
      .order("time", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setSlots((data ?? []) as AvailabilitySlot[]);
        setLoadingSlots(false);
      });
    return () => { cancelled = true; };
  }, [doctor.id, dateIso, open]);

  // Realtime: refresh slots when availability changes for this doctor/date
  useEffect(() => {
    if (!open) return;
    const channel = supabase
      .channel(`avail-${doctor.id}-${dateIso}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "doctor_availability", filter: `doctor_id=eq.${doctor.id}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as AvailabilitySlot;
          if (row?.date !== dateIso) return;
          setSlots((prev) => {
            if (payload.eventType === "DELETE") return prev.filter((s) => s.id !== row.id);
            const next = payload.new as AvailabilitySlot;
            const exists = prev.find((s) => s.id === next.id);
            if (exists) return prev.map((s) => (s.id === next.id ? next : s));
            return [...prev, next].sort((a, b) => a.time.localeCompare(b.time));
          });
          if (payload.eventType === "UPDATE" && (payload.new as AvailabilitySlot).is_booked && (payload.new as AvailabilitySlot).id === slotId) {
            setSlotId(null);
            toast.warning("هذا الموعد تم حجزه للتو من شخص آخر");
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [doctor.id, dateIso, open, slotId]);

  const confirm = async () => {
    if (!user) { onClose(); navigate({ to: "/login" }); return; }
    if (!slotId) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("book_slot", {
        _availability_id: slotId,
        _booking_type: bookingType,
      });
      if (error) {
        if (error.message.includes("slot_already_booked")) toast.error("عفواً، هذا الموعد تم حجزه للتو");
        else if (error.message.includes("auth_required")) toast.error("سجّل الدخول أولاً");
        else toast.error("حدث خطأ أثناء الحجز");
        return;
      }
      if (data) {
        toast.success("تم تأكيد الحجز بنجاح ✓");
        setDone(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const availableCount = slots.filter((s) => !s.is_booked).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4 bg-foreground/30 backdrop-blur-sm overflow-y-auto"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-strong rounded-3xl w-full max-w-md p-6 my-8"
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
                <button
                  onClick={() => { setDone(false); setSlotId(null); onClose(); navigate({ to: "/dashboard/patient" }); }}
                  className="btn-primary mt-6 px-5 h-11 rounded-xl text-sm font-bold"
                >عرض حجوزاتي</button>
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
                  <label className="text-sm font-semibold flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> اختر التاريخ</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "mt-2 w-full h-11 rounded-xl glass text-sm font-medium flex items-center justify-between px-4",
                        )}
                      >
                        <span>{format(date, "EEEE d MMMM yyyy", { locale: ar })}</span>
                        <CalendarIcon className="w-4 h-4 text-primary" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && setDate(d)}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0)) || d > new Date(Date.now() + 14 * 86400000)}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="mt-5">
                  <label className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> اختر الموعد</span>
                    <span className="text-xs font-normal text-muted-foreground">{availableCount} متاح</span>
                  </label>
                  {loadingSlots ? (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-11 rounded-xl bg-primary/10 animate-pulse" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="mt-3 glass rounded-xl p-4 text-center text-sm text-muted-foreground">
                      لا توجد مواعيد لهذا اليوم
                    </div>
                  ) : (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pl-1">
                      {slots.map((s) => (
                        <button
                          key={s.id}
                          disabled={s.is_booked}
                          onClick={() => setSlotId(s.id)}
                          className={`h-11 rounded-xl text-sm font-medium transition ${
                            s.is_booked
                              ? "glass opacity-40 cursor-not-allowed line-through"
                              : slotId === s.id
                                ? "btn-primary"
                                : "glass hover:bg-white/80 text-foreground"
                          }`}
                          title={s.is_booked ? "محجوز" : "متاح"}
                        >{s.time}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">السعر</div>
                  <div className="text-primary font-extrabold text-lg">{doctor.price} ج.م</div>
                </div>

                <button
                  disabled={!slotId || submitting}
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
