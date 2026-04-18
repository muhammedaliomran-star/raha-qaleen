import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { DoctorCard } from "@/components/DoctorCard";
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

function DoctorsPage() {
  const search = Route.useSearch();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialty, setSpecialty] = useState(search.specialty ?? "");
  const [area, setArea] = useState(search.area ?? "");
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("doctors").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setDoctors((data ?? []).map((d) => ({
        id: d.id, name: d.name, specialty: d.specialty, area: d.area, price: d.price, image: d.image, times: d.times,
      })));
    });
  }, []);

  const filtered = useMemo(() => doctors.filter((d) =>
    (!specialty || d.specialty === specialty) &&
    (!area || d.area === area) &&
    (!q || d.name.includes(q))
  ), [doctors, specialty, area, q]);

  return (
    <PageShell>
      <h1 className="text-2xl sm:text-3xl font-extrabold">الأطباء في قلين</h1>
      <p className="text-muted-foreground mt-1">مركز قلين - كفر الشيخ</p>

      <div className="glass-strong mt-6 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 glass-input rounded-xl flex items-center px-3 h-12">
          <Search className="w-4 h-4 text-primary ml-2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم الطبيب..." className="bg-transparent w-full outline-none text-sm" />
        </div>
        <div className="flex-1 glass-input rounded-xl flex items-center px-3 h-12">
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="bg-transparent w-full outline-none text-sm">
            <option value="">كل التخصصات</option>
            {SPECIALTIES.map((s) => <option key={s.key} value={s.name}>{s.emoji} {s.name}</option>)}
          </select>
        </div>
        <div className="flex-1 glass-input rounded-xl flex items-center px-3 h-12">
          <select value={area} onChange={(e) => setArea(e.target.value)} className="bg-transparent w-full outline-none text-sm">
            <option value="">كل المناطق</option>
            {QALEEN_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
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
