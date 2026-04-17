import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Stethoscope, BadgeCheck, Star } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { BookingModal } from "@/components/BookingModal";
import { initStore, store, type Doctor } from "@/lib/store";

export const Route = createFileRoute("/doctor/$id")({
  head: () => ({ meta: [{ title: "ملف الطبيب | RAHA — QALEEN" }] }),
  component: DoctorPage,
  notFoundComponent: () => (
    <PageShell><div className="glass rounded-2xl p-10 text-center">الطبيب غير موجود</div></PageShell>
  ),
});

function DoctorPage() {
  const { id } = Route.useParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    initStore();
    setDoctor(store.getDoctor(id) ?? null);
  }, [id]);

  if (!doctor) return <PageShell><div className="glass rounded-2xl p-10 text-center">الطبيب غير موجود</div></PageShell>;

  return (
    <PageShell>
      <Link to="/doctors" className="inline-flex items-center gap-1 text-sm text-primary mb-4"><ArrowRight className="w-4 h-4" /> رجوع للأطباء</Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-strong rounded-3xl p-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row gap-5">
            <img src={doctor.image} alt={doctor.name} className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover" />
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold">{doctor.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <span className="glass px-3 h-8 rounded-full inline-flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5" /> {doctor.specialty}</span>
                <span className="glass px-3 h-8 rounded-full inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {doctor.city}</span>
                <span className="glass px-3 h-8 rounded-full inline-flex items-center gap-1 text-success"><BadgeCheck className="w-3.5 h-3.5" /> متاح اليوم</span>
                <span className="glass px-3 h-8 rounded-full inline-flex items-center gap-1 text-amber-600"><Star className="w-3.5 h-3.5 fill-current" /> 4.9</span>
              </div>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                خبرة طويلة في تقديم رعاية طبية متميزة. يستقبل المرضى يومياً بأحدث الأساليب الطبية وأفضل خدمة ممكنة.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-bold mb-3">المواعيد المتاحة اليوم</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {doctor.times.map((t) => (
                <div key={t} className="glass rounded-xl h-11 grid place-items-center text-sm font-medium">{t}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6 h-fit lg:sticky lg:top-24">
          <div className="text-sm text-muted-foreground">سعر الكشف</div>
          <div className="text-4xl font-extrabold text-primary mt-1">{doctor.price} <span className="text-base font-normal text-muted-foreground">ج.م</span></div>
          <button onClick={() => setOpen(true)} className="btn-primary w-full mt-5 h-12 rounded-xl font-bold">تأكيد الحجز</button>
          <p className="text-xs text-muted-foreground mt-3 text-center">لن يتم خصم أي مبلغ — الدفع في العيادة</p>
        </div>
      </div>

      <BookingModal doctor={doctor} open={open} onClose={() => setOpen(false)} />
    </PageShell>
  );
}
