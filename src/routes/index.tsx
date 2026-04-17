import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Stethoscope, Sparkles, ShieldCheck, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { PageShell } from "@/components/PageShell";
import { AdsSlider } from "@/components/AdsSlider";
import { DoctorCard } from "@/components/DoctorCard";
import { initStore, store, type Doctor } from "@/lib/store";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "RAHA — QALEEN | احجز طبيبك بسهولة" }] }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => { initStore(); setDoctors(store.getDoctors()); }, []);

  const featured = useMemo(() => doctors.slice(0, 4), [doctors]);

  const onSearch = () => {
    const params = new URLSearchParams();
    if (specialty) params.set("specialty", specialty);
    if (city) params.set("city", city);
    navigate({ to: "/doctors", search: () => Object.fromEntries(params) as never });
  };

  return (
    <PageShell>
      {/* HERO */}
      <section className="gradient-bg-hero rounded-3xl overflow-hidden glass-strong">
        <div className="grid lg:grid-cols-2 gap-6 p-6 sm:p-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-1 glass px-3 h-8 rounded-full text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" /> منصة الحجز الأولى — تجربة فاخرة
            </span>
            <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold leading-tight text-foreground">
              راحة قلبك تبدأ من <span className="text-primary">حجز طبيبك</span>
            </h1>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-lg">
              ابحث عن أفضل الأطباء في مدينتك واحجز موعدك في ثوانٍ — بدون مكالمات ولا انتظار.
            </p>

            {/* Search */}
            <div className="glass-strong mt-6 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 glass-input rounded-xl flex items-center px-3 h-12">
                <Stethoscope className="w-4 h-4 text-primary ml-2" />
                <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="bg-transparent w-full outline-none text-sm">
                  <option value="">كل التخصصات</option>
                  {store.specialties.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex-1 glass-input rounded-xl flex items-center px-3 h-12">
                <MapPin className="w-4 h-4 text-primary ml-2" />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="ابحث عن مدينة..."
                  className="bg-transparent w-full outline-none text-sm placeholder:text-muted-foreground"
                />
              </div>
              <button onClick={onSearch} className="btn-primary h-12 px-6 rounded-xl font-bold inline-flex items-center justify-center gap-2">
                <Search className="w-4 h-4" /> بحث
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-primary" /> أطباء معتمدون</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-primary" /> حجز فوري</span>
              <span className="flex items-center gap-1"><Sparkles className="w-4 h-4 text-primary" /> تجربة بدون عناء</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }}>
            <img src={heroImg} alt="أطباء RAHA" width={1536} height={1024} className="w-full h-72 sm:h-96 object-cover rounded-2xl shadow-glass-lg" />
          </motion.div>
        </div>
      </section>

      {/* ADS */}
      <section className="mt-8">
        <AdsSlider />
      </section>

      {/* SPECIALTIES */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-extrabold mb-4">تصفح حسب التخصص</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {store.specialties.slice(0, 8).map((s) => (
            <Link key={s} to="/doctors" search={{ specialty: s } as never} className="glass card-hover rounded-2xl p-5 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl btn-primary grid place-items-center mx-auto"><Stethoscope className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" /></div>
              <div className="mt-3 font-semibold text-base">{s}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED DOCTORS */}
      <section className="mt-10">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-extrabold">أطباء مميزون</h2>
          <Link to="/doctors" className="text-sm text-primary font-semibold">عرض الكل ←</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((d) => <DoctorCard key={d.id} doctor={d} />)}
        </div>
      </section>
    </PageShell>
  );
}
