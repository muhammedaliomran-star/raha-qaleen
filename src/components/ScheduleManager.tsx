import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Clock, Users, Plus, Trash2, Copy, RefreshCw, Loader2, Power,
  CalendarDays, AlertCircle, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Doctor } from "@/lib/store";

const WEEKDAYS = [
  { idx: 6, short: "السبت", long: "السبت" },
  { idx: 0, short: "الأحد", long: "الأحد" },
  { idx: 1, short: "الإثنين", long: "الإثنين" },
  { idx: 2, short: "الثلاثاء", long: "الثلاثاء" },
  { idx: 3, short: "الأربعاء", long: "الأربعاء" },
  { idx: 4, short: "الخميس", long: "الخميس" },
  { idx: 5, short: "الجمعة", long: "الجمعة" },
];

interface WeeklyBlock {
  id: string;
  doctor_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  capacity: number;
  is_enabled: boolean;
}

interface AvailRow {
  id: string;
  doctor_id: string;
  date: string;
  time: string;
  capacity: number;
  booked_count: number;
  is_disabled: boolean;
}

function formatTimeAr(t: string): string {
  if (!/^\d{1,2}:\d{2}/.test(t)) return t;
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const suffix = h < 12 ? "ص" : "م";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${mStr.slice(0, 2)} ${suffix}`;
}

export function ScheduleManager({ doctors }: { doctors: Doctor[] }) {
  const activeDoctors = doctors.filter((d) => d.is_active !== false);
  const [doctorId, setDoctorId] = useState<string>(activeDoctors[0]?.id ?? doctors[0]?.id ?? "");
  const [weekday, setWeekday] = useState<number>(WEEKDAYS[0].idx);
  const [blocks, setBlocks] = useState<WeeklyBlock[]>([]);
  const [slots, setSlots] = useState<AvailRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showCopy, setShowCopy] = useState(false);

  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  // Pick the next date that matches the selected weekday (within 14 days)
  const nextDateForWeekday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(today.getTime() + i * 86400000);
      if (d.getDay() === weekday) return d;
    }
    return today;
  }, [weekday]);

  const dateIso = useMemo(() => {
    const y = nextDateForWeekday.getFullYear();
    const m = String(nextDateForWeekday.getMonth() + 1).padStart(2, "0");
    const d = String(nextDateForWeekday.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [nextDateForWeekday]);

  const refresh = async () => {
    if (!doctorId) return;
    setLoading(true);
    const [wRes, aRes] = await Promise.all([
      supabase.from("weekly_schedule").select("*").eq("doctor_id", doctorId).order("start_time"),
      supabase.from("doctor_availability")
        .select("id,doctor_id,date,time,capacity,booked_count,is_disabled")
        .eq("doctor_id", doctorId).eq("date", dateIso).order("time"),
    ]);
    setBlocks((wRes.data ?? []) as WeeklyBlock[]);
    setSlots((aRes.data ?? []) as AvailRow[]);
    setLoading(false);
  };

  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, [doctorId, dateIso]);

  const dayBlocks = blocks.filter((b) => b.weekday === weekday).sort((a, b) => a.start_time.localeCompare(b.start_time));

  const addBlock = async () => {
    if (!doctorId) return;
    setBusy(true);
    const { error } = await supabase.from("weekly_schedule").insert({
      doctor_id: doctorId, weekday, start_time: "10:00", end_time: "13:00", slot_minutes: 30, capacity: 1, is_enabled: true,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تمت إضافة فترة جديدة");
    refresh();
  };

  const updateBlock = async (id: string, patch: Partial<WeeklyBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    const { error } = await supabase.from("weekly_schedule").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  };

  const removeBlock = async (id: string) => {
    if (!confirm("حذف هذه الفترة؟")) return;
    const { error } = await supabase.from("weekly_schedule").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
    refresh();
  };

  const applySchedule = async () => {
    if (!doctorId) return;
    setBusy(true);
    const { error } = await supabase.rpc("apply_weekly_schedule", { _doctor_id: doctorId, _days: 14 });
    setBusy(false);
    if (error) { toast.error("تعذّر تطبيق الجدول: " + error.message); return; }
    toast.success("تم توليد المواعيد للأسبوعين القادمين ✓");
    refresh();
  };

  const copyToOtherDays = async (targetDays: number[]) => {
    if (!doctorId || targetDays.length === 0) return;
    setBusy(true);
    const { error } = await supabase.rpc("copy_weekday_schedule", {
      _doctor_id: doctorId, _from_weekday: weekday, _to_weekdays: targetDays,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم نسخ الجدول للأيام المختارة ✓");
    setShowCopy(false);
    refresh();
  };

  const toggleSlot = async (s: AvailRow) => {
    setSlots((prev) => prev.map((x) => (x.id === s.id ? { ...x, is_disabled: !x.is_disabled } : x)));
    const { error } = await supabase.from("doctor_availability").update({ is_disabled: !s.is_disabled }).eq("id", s.id);
    if (error) toast.error(error.message);
  };

  const updateSlotCapacity = async (id: string, capacity: number) => {
    const safe = Math.max(1, Math.min(50, Math.floor(capacity || 1)));
    setSlots((prev) => prev.map((x) => (x.id === id ? { ...x, capacity: safe } : x)));
    const { error } = await supabase.from("doctor_availability").update({ capacity: safe }).eq("id", id);
    if (error) toast.error(error.message);
  };

  return (
    <div className="space-y-5">
      {/* Doctor + apply */}
      <div className="bg-card rounded-3xl border border-border/60 shadow-soft p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-foreground">اختر الطبيب</label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="mt-1 w-full h-12 rounded-xl bg-background border border-border px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
              ))}
            </select>
          </div>
          <button
            onClick={applySchedule}
            disabled={busy || !doctorId}
            className="btn-primary h-12 px-5 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
            title="تطبيق القالب الأسبوعي وتوليد المواعيد لـ 14 يومًا قادمًا"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            توليد مواعيد الأسبوعين
          </button>
        </div>
        {selectedDoctor && (
          <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            عدّل الجدول الأسبوعي بالأسفل ثم اضغط "توليد المواعيد" لتفعيل التغييرات على المواعيد القادمة.
          </p>
        )}
      </div>

      {/* Weekday tabs */}
      <div className="bg-card rounded-2xl border border-border/60 p-2 overflow-x-auto scrollbar-none">
        <div className="flex gap-1 min-w-max">
          {WEEKDAYS.map((w) => {
            const count = blocks.filter((b) => b.weekday === w.idx && b.is_enabled).length;
            return (
              <button
                key={w.idx}
                onClick={() => setWeekday(w.idx)}
                className={`px-4 h-11 rounded-xl text-sm font-bold inline-flex items-center gap-2 whitespace-nowrap transition ${
                  weekday === w.idx ? "btn-primary shadow-md" : "hover:bg-muted text-foreground/70"
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                {w.short}
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${weekday === w.idx ? "bg-white/25" : "bg-primary/15 text-primary"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={addBlock}
          disabled={busy}
          className="btn-primary h-10 px-4 rounded-xl text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> إضافة فترة عمل
        </button>
        <button
          onClick={() => setShowCopy(true)}
          disabled={dayBlocks.length === 0}
          className="h-10 px-4 rounded-xl text-sm font-bold border border-border bg-background hover:bg-muted inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <Copy className="w-4 h-4" /> نسخ مواعيد هذا اليوم
        </button>
      </div>

      {/* Timeline blocks */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left: weekly templates for this day */}
        <div className="bg-card rounded-3xl border border-border/60 shadow-soft p-5">
          <h4 className="font-extrabold text-sm flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" /> فترات العمل ({WEEKDAYS.find((w) => w.idx === weekday)?.long})
          </h4>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : dayBlocks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              لا توجد فترات لهذا اليوم. اضغط "إضافة فترة عمل" للبدء.
            </div>
          ) : (
            <div className="relative space-y-3">
              {/* Vertical line */}
              <div className="absolute right-[15px] top-2 bottom-2 w-px bg-border" />
              <AnimatePresence initial={false}>
                {dayBlocks.map((b) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="relative pr-9"
                  >
                    {/* Dot */}
                    <span className={`absolute right-2 top-5 w-3 h-3 rounded-full ring-4 ring-card ${b.is_enabled ? "bg-primary" : "bg-muted-foreground/40"}`} />
                    <div className={`rounded-2xl border p-3 transition ${b.is_enabled ? "border-border bg-background" : "border-dashed border-muted-foreground/30 bg-muted/30 opacity-70"}`}>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <label className="text-[11px] font-semibold text-muted-foreground">من
                          <input type="time" value={b.start_time.slice(0, 5)}
                            onChange={(e) => updateBlock(b.id, { start_time: e.target.value })}
                            className="mt-1 w-full h-10 rounded-lg border border-border bg-card px-2 text-sm font-bold" />
                        </label>
                        <label className="text-[11px] font-semibold text-muted-foreground">إلى
                          <input type="time" value={b.end_time.slice(0, 5)}
                            onChange={(e) => updateBlock(b.id, { end_time: e.target.value })}
                            className="mt-1 w-full h-10 rounded-lg border border-border bg-card px-2 text-sm font-bold" />
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-[11px] font-semibold text-muted-foreground">مدة الموعد (دقيقة)
                          <select value={b.slot_minutes}
                            onChange={(e) => updateBlock(b.id, { slot_minutes: Number(e.target.value) })}
                            className="mt-1 w-full h-10 rounded-lg border border-border bg-card px-2 text-sm font-bold">
                            {[10, 15, 20, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </label>
                        <label className="text-[11px] font-semibold text-muted-foreground flex flex-col">
                          <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> أقصى عدد مرضى</span>
                          <input type="number" min={1} max={50} value={b.capacity}
                            onChange={(e) => updateBlock(b.id, { capacity: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
                            className="mt-1 w-full h-10 rounded-lg border border-border bg-card px-2 text-sm font-bold" />
                        </label>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <button onClick={() => updateBlock(b.id, { is_enabled: !b.is_enabled })}
                          className={`inline-flex items-center gap-1 text-xs font-bold ${b.is_enabled ? "text-success" : "text-muted-foreground"}`}>
                          <Power className="w-3.5 h-3.5" /> {b.is_enabled ? "مفعّلة" : "معطّلة"}
                        </button>
                        <button onClick={() => removeBlock(b.id)} className="text-destructive p-1.5 rounded-lg hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right: generated slots for the next matching date (capacity controls + disable) */}
        <div className="bg-card rounded-3xl border border-border/60 shadow-soft p-5">
          <h4 className="font-extrabold text-sm flex items-center justify-between mb-3">
            <span className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> مواعيد {nextDateForWeekday.toLocaleDateString("ar-EG", { day: "numeric", month: "long" })}</span>
            <span className="text-[11px] font-medium text-muted-foreground">{slots.length} موعد</span>
          </h4>
          {loading ? (
            <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : slots.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              لا توجد مواعيد بعد لهذا اليوم. اضغط <strong className="text-foreground">"توليد مواعيد الأسبوعين"</strong> بالأعلى.
            </div>
          ) : (
            <div className="relative space-y-2 max-h-[480px] overflow-y-auto pr-1">
              <div className="absolute right-[11px] top-2 bottom-2 w-px bg-border" />
              {slots.map((s) => {
                const full = s.booked_count >= s.capacity;
                const ratio = s.capacity > 0 ? s.booked_count / s.capacity : 0;
                return (
                  <div key={s.id} className="relative pr-7">
                    <span className={`absolute right-1.5 top-4 w-2.5 h-2.5 rounded-full ring-4 ring-card ${
                      s.is_disabled ? "bg-muted-foreground/40" : full ? "bg-destructive" : ratio > 0.6 ? "bg-amber-500" : "bg-success"
                    }`} />
                    <div className={`rounded-xl border p-2.5 flex items-center gap-2 transition ${
                      s.is_disabled ? "border-dashed border-muted-foreground/30 bg-muted/30 opacity-60" : full ? "border-destructive/40 bg-destructive/5" : "border-border bg-background"
                    }`}>
                      <div className="font-bold text-sm tabular-nums w-20">{formatTimeAr(s.time)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-[11px] font-semibold">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className={full ? "text-destructive" : "text-foreground"}>{s.booked_count}</span>
                          <span className="text-muted-foreground">/</span>
                          <input type="number" min={Math.max(1, s.booked_count)} max={50} value={s.capacity}
                            onChange={(e) => updateSlotCapacity(s.id, Number(e.target.value))}
                            className="w-12 h-6 rounded border border-border bg-card px-1 text-center text-xs font-bold" />
                          {full && <span className="ml-auto text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full font-bold inline-flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" /> مكتمل</span>}
                        </div>
                      </div>
                      <button onClick={() => toggleSlot(s)} title={s.is_disabled ? "تفعيل" : "تعطيل (راحة)"}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${s.is_disabled ? "bg-muted-foreground/30" : "bg-primary"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${s.is_disabled ? "-translate-x-[18px]" : "-translate-x-0.5"}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Copy modal */}
      {showCopy && (
        <CopyDayModal
          fromWeekday={weekday}
          onCancel={() => setShowCopy(false)}
          onConfirm={(targets) => copyToOtherDays(targets)}
        />
      )}
    </div>
  );
}

function CopyDayModal({ fromWeekday, onCancel, onConfirm }: { fromWeekday: number; onCancel: () => void; onConfirm: (t: number[]) => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  const toggle = (i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  const fromName = WEEKDAYS.find((w) => w.idx === fromWeekday)?.long;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-foreground/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-card rounded-3xl shadow-2xl border border-border/60 p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Copy className="w-5 h-5 text-primary" />
          <h3 className="font-extrabold text-lg">نسخ جدول {fromName}</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">اختر الأيام التي تريد نسخ نفس الجدول إليها (سيتم استبدال جدولها الحالي).</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {WEEKDAYS.filter((w) => w.idx !== fromWeekday).map((w) => {
            const on = picked.includes(w.idx);
            return (
              <button key={w.idx} onClick={() => toggle(w.idx)}
                className={`h-11 rounded-xl text-sm font-bold border transition ${on ? "btn-primary border-transparent" : "border-border bg-background hover:bg-muted"}`}>
                {w.short}
              </button>
            );
          })}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button onClick={onCancel} className="h-11 rounded-xl border border-border bg-background hover:bg-muted text-sm font-bold">إلغاء</button>
          <button onClick={() => onConfirm(picked)} disabled={picked.length === 0}
            className="btn-primary h-11 rounded-xl text-sm font-bold disabled:opacity-50">
            نسخ ({picked.length})
          </button>
        </div>
      </div>
    </div>
  );
}
