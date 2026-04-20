import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { DoctorCard } from "@/components/DoctorCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { SPECIALTIES, QALEEN_AREAS, type Doctor } from "@/lib/store";

interface SearchParams { specialty?: string; area?: string }

export const Route = createFileRoute("/doctors")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    specialty: typeof s.specialty === "string" ? s.specialty : undefined,
    area: typeof s.area === "string" ? s.area : undefined,
  }),
  head: () => ({ meta: [{ title: "الأطباء | RAHA — QALEEN" }] }),
  component: DoctorsPage,
});

const PAGE_SIZE = 12;

function DoctorsPage() {
  const search = Route.useSearch();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState(search.specialty ?? "");
  const [area, setArea] = useState(search.area ?? "");
  const [q, setQ] = useState("");
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    supabase.from("doctors").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setDoctors((data ?? []) as Doctor[]);
      setLoading(false);
    });
  }, []);

  // Realtime: refresh when doctors table changes
  useEffect(() => {
    const channel = supabase
      .channel("doctors-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "doctors" }, async () => {
        const { data } = await supabase.from("doctors").select("*").order("created_at", { ascending: false });
        setDoctors((data ?? []) as Doctor[]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => doctors.filter((d) =>
    (!specialty || d.specialty === specialty) &&
    (!area || d.area === area) &&
    (!q || d.name.includes(q.trim())) &&
    d.price <= maxPrice
  ), [doctors, specialty, area, q, maxPrice]);

  useEffect(() => { setPage(1); }, [specialty, area, q, maxPrice]);

  const paged = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > paged.length;

  return (
    <PageShell>
      <h1 className="text-2xl sm:text-3xl font-extrabold">الأطباء في قلين</h1>
      <p className="text-muted-foreground mt-1">مركز قلين - كفر الشيخ</p>

      <div className="glass-strong mt-6 rounded-2xl p-3 sm:p-4 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass-input rounded-xl flex items-center px-3 h-12">
          <Search className="w-4 h-4 text-primary ml-2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث باسم الطبيب..."
            className="bg-transparent w-full outline-none text-sm"
          />
        </div>
        <div className="glass-input rounded-xl flex items-center px-3 h-12">
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="bg-transparent w-full outline-none text-sm">
            <option value="">كل التخصصات</option>
            {SPECIALTIES.map((s) => <option key={s.key} value={s.name}>{s.emoji} {s.name}</option>)}
          </select>
        </div>
        <div className="glass-input rounded-xl flex items-center px-3 h-12">
          <select value={area} onChange={(e) => setArea(e.target.value)} className="bg-transparent w-full outline-none text-sm">
            <option value="">كل المناطق</option>
            {QALEEN_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="glass-input rounded-xl flex items-center gap-3 px-3 h-12">
          <SlidersHorizontal className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs whitespace-nowrap text-muted-foreground">حتى</span>
          <input
            type="range"
            min={50}
            max={1000}
            step={50}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <span className="text-xs font-bold text-primary whitespace-nowrap">{maxPrice} ج</span>
        </div>
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        {loading ? "جارٍ التحميل..." : `${filtered.length} طبيب${filtered.length === 1 ? "" : ""}`}
      </div>

      <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 space-y-3">
                <Skeleton className="w-full h-44 rounded-xl" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-11 w-full" />
              </div>
            ))
          : paged.map((d) => <DoctorCard key={d.id} doctor={d} />)}
      </div>

      {!loading && !filtered.length && (
        <div className="glass rounded-2xl p-10 text-center mt-6 text-muted-foreground">لا يوجد أطباء بهذه المعايير</div>
      )}

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="glass-strong px-6 h-11 rounded-xl text-sm font-bold hover:bg-white/80 transition"
          >عرض المزيد</button>
        </div>
      )}
    </PageShell>
  );
}
