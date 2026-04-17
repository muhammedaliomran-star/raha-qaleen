import { useEffect, useState } from "react";
import { store, type Ad } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

export function AdsSlider() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [i, setI] = useState(0);

  useEffect(() => {
    const list = store.getAds().filter((a) => a.isActive).sort((a, b) => a.order - b.order);
    setAds(list);
  }, []);

  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % ads.length), 4500);
    return () => clearInterval(t);
  }, [ads.length]);

  if (!ads.length) return null;
  const ad = ads[i];

  return (
    <div className="glass-strong rounded-3xl overflow-hidden relative h-48 sm:h-60">
      <AnimatePresence mode="wait">
        <motion.div
          key={ad.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img src={ad.image} alt={ad.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-l from-primary/70 via-primary/30 to-transparent" />
          <div className="relative h-full flex flex-col justify-center p-6 sm:p-10 text-primary-foreground max-w-xl">
            <h3 className="text-xl sm:text-3xl font-extrabold drop-shadow">{ad.title}</h3>
            <p className="mt-2 text-sm sm:text-base opacity-95">{ad.description}</p>
            <button className="mt-4 self-start glass-strong text-foreground px-5 h-11 rounded-xl text-sm font-bold hover:bg-white/90 transition">
              {ad.cta}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {ads.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`إعلان ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-1.5 bg-white/60"}`}
          />
        ))}
      </div>
    </div>
  );
}
