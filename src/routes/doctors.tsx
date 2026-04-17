import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { DoctorCard } from "@/components/DoctorCard";
import { initStore, store, type Doctor } from "@/lib/store";

interface SearchParams { specialty?: string; city?: string }

export const Route = createFileRoute("/doctors")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    specialty: typeof s.specialty === "string" ? s.specialty : undefined,
    city: typeof s.city === "string" ? s.city : undefined,
  }),
  head: () => ({ meta: [{ title: "الأطباء | RAHA — QALEEN" }] }),
  component: DoctorsPage,
});

function DoctorsPage() {
  const search = Route.useSearch();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialty, setSpecialty] = useState(search.specialty ?? "");
  const [city, setCity] = useState(search.city ?? "");
  const [q, setQ] = useState("");

  useEffect(() => { initStore(); setDoctors(store.getDoctors()); }, []);

  const filtered = useMemo(() => doctors.filter((d) =>
    (!specialty || d.specialty === specialty) &&
    (!city || d.city === city) &&
    (!q || d.name.includes(q))
  ), [doctors, specialty, city, q]);

  return (
    <PageShell>
      <h1 className="text-2xl sm:text-3xl font-extrabold">الأطباء</h1>
      <p className="text-muted-foreground mt-1">اعثر على الطبيب المناسب لك</p>

      <div className="glass-strong mt-6 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 glass-input rounded-xl flex items-center px-3 h-12">
          <Search className="w-4 h-4 text-primary ml-2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم الطبيب..." className="bg-transparent w-full outline-none text-sm" />
        </div>
        <div className="flex-1 glass-input rounded-xl flex items-center px-3 h-12">
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="bg-transparent w-full outline-none text-sm">
            <option value="">كل التخصصات</option>
            {store.specialties.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 glass-input rounded-xl flex items-center px-3 h-12">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="ابحث عن مدينة..."
            className="bg-transparent w-full outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((d) => <DoctorCard key={d.id} doctor={d} />)}
      </div>
      {!filtered.length && (
        <div className="glass rounded-2xl p-10 text-center mt-6 text-muted-foreground">لا يوجد أطباء بهذه المعايير</div>
      )}
    </PageShell>
  );
}
