import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Stethoscope, Sparkles, ShieldCheck, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { PageShell } from "@/components/PageShell";
import { AdsSlider } from "@/components/AdsSlider";
import { DoctorCard } from "@/components/DoctorCard";
import { SpecialtyPicker } from "@/components/SpecialtyPicker";
import { supabase } from "@/integrations/supabase/client";
import { SPECIALTIES, QALEEN_AREAS, type Doctor } from "@/lib/store";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "RAHA — QALEEN | احجز كشفك الآن" }] }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [specialty, setSpecialty] = useState("");
  const [area, setArea] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    supabase.from("doctors").select("*").order("created_at", { ascending: false }).limit(8).then(({ data }) => {
      setDoctors((data ?? []).map(mapDoctor));
    });
  }, []);

  const featured = useMemo(() => doctors.slice(0, 4), [doctors]);

  const onSearch = () => {
    const params: Record<string, string> = {};
    if (specialty) params.specialty = specialty;
    if (area) params.area = area;
    navigate({ to: "/doctors", search: () => params as never });
  };

  return (
    <PageShell>
      {/* HERO */}
      <section className="gradient-bg-hero rounded-3xl overflow-hidden glass-strong">
        <div className="grid lg:grid-cols-2 gap-6 p-6 sm:p-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-1 glass px-3 h-8 rounded-full text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" /> منصة الحجز الأولى في قلين
            </span>
            <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold leading-tight text-foreground">
              احجز كشفك <span className="text-primary">في قلين</span> بكل سهولة
            </h1>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-lg">
              اختار التخصص وحدّد منطقتك، واحجز عند أقرب دكتور ليك في ثواني — من غير مكالمات ولا انتظار.
            </p>

            <div className="glass-strong mt-6 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 glass-input rounded-xl flex items-center px-3 h-12">
                <Stethoscope className="w-4 h-4 text-primary ml-2" />
                <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="bg-transparent w-full outline-none text-sm">
                  <option value="">اختر التخصص</option>
                  {SPECIALTIES.map((s) => <option key={s.key} value={s.name}>{s.emoji} {s.name}</option>)}
                </select>
              </div>
              <div className="flex-1 glass-input rounded-xl flex items-center px-3 h-12">
                <MapPin className="w-4 h-4 text-primary ml-2" />
                <select value={area} onChange={(e) => setArea(e.target.value)} className="bg-transparent w-full outline-none text-sm">
                  <option value="">حدّد منطقتك</option>
                  {QALEEN_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <button onClick={onSearch} className="btn-primary h-12 px-6 rounded-xl font-bold inline-flex items-center justify-center gap-2">
                <Search className="w-4 h-4" /> بحث
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-primary" /> أطباء معتمدون</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-primary" /> حجز فوري</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-primary" /> مركز قلين - كفر الشيخ</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }}>
            <img src={heroImg} alt="أطباء RAHA قلين" width={1536} height={1024} className="w-full h-72 sm:h-96 object-cover rounded-2xl shadow-glass-lg" />
          </motion.div>
        </div>
      </section>

      <section className="mt-8"><AdsSlider /></section>

      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-extrabold mb-4">اختر التخصص</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
          {SPECIALTIES.map((s) => (
            <Link key={s.key} to="/doctors" search={{ specialty: s.name } as never} className="glass card-hover rounded-2xl p-4 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/70 grid place-items-center mx-auto text-3xl sm:text-4xl">
                <span>{s.emoji}</span>
              </div>
              <div className="mt-3 font-semibold text-sm sm:text-base">{s.name}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-extrabold">أطباء مميزون</h2>
          <Link to="/doctors" className="text-sm text-primary font-semibold">عرض الكل ←</Link>
        </div>
        {featured.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-muted-foreground">قريباً سيتم إضافة الأطباء</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((d) => <DoctorCard key={d.id} doctor={d} />)}
          </div>
        )}
      </section>
    </PageShell>
  );
}

function mapDoctor(d: { id: string; name: string; specialty: string; area: string; price: number; image: string; times: string[] }): Doctor {
  return { id: d.id, name: d.name, specialty: d.specialty, area: d.area, price: d.price, image: d.image, times: d.times };
}
