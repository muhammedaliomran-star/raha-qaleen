import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, AlertTriangle, Clock, CheckCircle2, Stethoscope, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { DoctorCard } from "@/components/DoctorCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { analyzeSymptoms, type SymptomAnalysis } from "@/server/symptoms";
import { getSpecialtyMeta, type Doctor } from "@/lib/store";

export const Route = createFileRoute("/symptom-checker")({
  head: () => ({
    meta: [
      { title: "محلل الأعراض الذكي | RAHA — QALEEN" },
      { name: "description", content: "اكتب أعراضك واحصل على اقتراح فوري للتخصص الطبي المناسب بالذكاء الاصطناعي." },
      { property: "og:title", content: "محلل الأعراض الذكي" },
      { property: "og:description", content: "ذكاء اصطناعي يساعدك تختار التخصص المناسب لحالتك." },
    ],
  }),
  component: SymptomCheckerPage,
});

const EXAMPLES = [
  "عندي ألم في المعدة من يومين",
  "صداع نصفي شديد ودوخة",
  "طفلي عنده حرارة وكحة",
  "ألم في الأسنان الخلفية",
  "بقعة جلدية تحكني وحمراء",
];

function urgencyMeta(u: SymptomAnalysis["urgency"]) {
  if (u === "urgent") return { label: "عاجل — توجّه فوراً للطوارئ", color: "text-destructive", bg: "bg-destructive/10", icon: AlertTriangle };
  if (u === "soon") return { label: "يُفضّل الحجز خلال أيام", color: "text-amber-600", bg: "bg-amber-500/10", icon: Clock };
  return { label: "حالة غير عاجلة", color: "text-success", bg: "bg-success/10", icon: CheckCircle2 };
}

function SymptomCheckerPage() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomAnalysis | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim().length < 3) {
      toast.error("اكتب أعراضك بشكل أوضح");
      return;
    }
    setLoading(true);
    setResult(null);
    setDoctors([]);
    try {
      const analysis = await analyzeSymptoms({ data: { symptoms: text.trim() } });
      setResult(analysis);
      // Fetch doctors of suggested specialty + alternatives
      setLoadingDocs(true);
      const specs = [analysis.specialty, ...analysis.alternatives];
      const { data } = await supabase
        .from("doctors")
        .select("*")
        .in("specialty", specs)
        .order("rating", { ascending: false })
        .limit(8);
      setDoctors((data ?? []) as Doctor[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "rate_limited") toast.error("الخدمة مشغولة الآن، حاول بعد لحظات");
      else if (msg === "payment_required") toast.error("الرصيد نفذ — يرجى التواصل مع الإدارة");
      else toast.error("تعذّر تحليل الأعراض. حاول مرة أخرى");
    } finally {
      setLoading(false);
      setLoadingDocs(false);
    }
  };

  const useExample = (ex: string) => {
    setText(ex);
  };

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 glass-strong px-4 h-9 rounded-full text-xs font-bold text-primary">
            <Sparkles className="w-4 h-4" /> مدعوم بالذكاء الاصطناعي
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-4">محلل الأعراض الذكي</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            اوصف ما تشعر به، وسأقترح لك التخصص الطبي المناسب فوراً
          </p>
        </div>

        <form onSubmit={submit} className="glass-strong rounded-3xl p-4 sm:p-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="مثال: عندي ألم في الجانب الأيمن من البطن من ٣ أيام، مع غثيان..."
            rows={4}
            maxLength={1000}
            className="glass-input w-full rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{text.length}/1000</span>
            <span className="hidden sm:inline">⌘ + Enter للإرسال</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => useExample(ex)}
                disabled={loading}
                className="glass text-xs px-3 h-8 rounded-full hover:bg-white/80 transition disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || text.trim().length < 3}
            className="btn-primary w-full mt-4 h-12 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> جارٍ التحليل...</>
            ) : (
              <><Send className="w-4 h-4" /> حلّل الأعراض</>
            )}
          </button>
        </form>

        <p className="text-[11px] text-muted-foreground text-center mt-3 px-4">
          ⚠️ هذه الأداة للاسترشاد فقط ولا تُغني عن استشارة طبيب مختص. في حالات الطوارئ اتصل بالإسعاف فوراً.
        </p>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-8"
            >
              <ResultCard analysis={result} />

              <div className="mt-8">
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  الأطباء المقترحون
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {doctors.length > 0 ? `${doctors.length} طبيب متاح في التخصصات المقترحة` : "..."}
                </p>

                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  {loadingDocs
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="glass rounded-2xl p-4 space-y-3">
                          <Skeleton className="w-full h-44 rounded-xl" />
                          <Skeleton className="h-5 w-2/3" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      ))
                    : doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
                </div>

                {!loadingDocs && doctors.length === 0 && (
                  <div className="glass rounded-2xl p-6 text-center mt-4 text-sm text-muted-foreground">
                    لا يوجد أطباء متاحون حالياً في {result.specialty}.
                    <button
                      onClick={() => navigate({ to: "/doctors" })}
                      className="text-primary font-bold mr-1 hover:underline"
                    >تصفّح كل الأطباء</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}

function ResultCard({ analysis }: { analysis: SymptomAnalysis }) {
  const meta = getSpecialtyMeta(analysis.specialty);
  const u = urgencyMeta(analysis.urgency);
  const UIcon = u.icon;
  const confidencePct = Math.round(analysis.confidence * 100);

  return (
    <div className="glass-strong rounded-3xl p-6">
      <div className={`inline-flex items-center gap-2 px-3 h-8 rounded-full text-xs font-bold ${u.bg} ${u.color}`}>
        <UIcon className="w-3.5 h-3.5" /> {u.label}
      </div>

      <div className="mt-4 flex items-start gap-4">
        <div className="text-5xl">{meta.emoji}</div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">التخصص المقترح</div>
          <div className="text-2xl font-extrabold text-primary">{analysis.specialty}</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-primary/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidencePct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-primary"
              />
            </div>
            <span className="text-xs font-bold text-muted-foreground tabular-nums">{confidencePct}%</span>
          </div>
        </div>
      </div>

      <div className="mt-4 glass rounded-xl p-4 text-sm leading-relaxed text-foreground/90">
        💡 {analysis.reasoning}
      </div>

      {analysis.alternatives.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2">تخصصات بديلة قد تكون مناسبة:</div>
          <div className="flex flex-wrap gap-2">
            {analysis.alternatives.map((alt) => {
              const m = getSpecialtyMeta(alt);
              return (
                <Link
                  key={alt}
                  to="/doctors"
                  search={{ specialty: alt }}
                  className="glass px-3 h-9 inline-flex items-center gap-1 rounded-full text-sm hover:bg-white/80 transition"
                >
                  <span>{m.emoji}</span> {alt}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <Link
        to="/doctors"
        search={{ specialty: analysis.specialty }}
        className="btn-primary mt-5 w-full h-12 rounded-xl font-bold inline-flex items-center justify-center gap-2"
      >
        تصفّح كل أطباء {analysis.specialty}
      </Link>
    </div>
  );
}
