import { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Check } from "lucide-react";
import { SPECIALTIES } from "@/lib/store";

// Healthicons (outline) — free MIT, unified line-art medical set
// Using the official "specialties" category names from healthicons.org
const ICON_MAP: Record<string, string> = {
  derma_laser: "healthicons:dermatology-outline",
  surgery: "healthicons:surgical-department-outline",
  pediatrics: "healthicons:pediatrics-outline",
  dental: "healthicons:dental-hygiene-outline",
  psych: "healthicons:psychology-outline",
  neuro: "healthicons:brain-outline",
  uro: "healthicons:urology-outline",
  labs: "healthicons:biochemistry-lab-outline",
  radiology: "healthicons:radiology-outline",
  eye: "healthicons:opthalmology-outline",
  physio: "healthicons:physical-therapy-outline",
  internal: "healthicons:stethoscope-outline",
  ent: "healthicons:ear-outline",
  obgyn: "healthicons:pregnant-outline",
};

interface Props {
  value?: string;
  onChange?: (name: string) => void;
  title?: string;
}

export function SpecialtyPicker({ value, onChange, title = "اختر التخصص" }: Props) {
  const [internal, setInternal] = useState<string>("");
  const selected = value ?? internal;

  const handleSelect = (name: string) => {
    const next = selected === name ? "" : name;
    setInternal(next);
    onChange?.(next);
  };

  return (
    <section
      className="rounded-3xl p-6 sm:p-10 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.45 0.22 264) 0%, oklch(0.55 0.24 264) 50%, oklch(0.42 0.20 260) 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(800px 400px at 90% 0%, oklch(0.75 0.18 250 / 0.4), transparent 60%), radial-gradient(600px 300px at 0% 100%, oklch(0.70 0.20 240 / 0.3), transparent 60%)",
        }}
      />

      <div className="relative">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-right mb-6 sm:mb-8">
          {title}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {SPECIALTIES.map((s, i) => {
            const iconName = ICON_MAP[s.key] ?? "healthicons:stethoscope-outline";
            const isSelected = selected === s.name;
            return (
              <motion.button
                key={s.key}
                type="button"
                onClick={() => handleSelect(s.name)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.03 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`group relative flex items-center justify-between gap-4 rounded-2xl px-5 py-5 sm:py-6 text-right transition-all duration-300 border-2 ${
                  isSelected
                    ? "bg-white/95 border-white shadow-2xl"
                    : "bg-white/5 border-white/15 hover:bg-white/10 hover:border-white/40"
                }`}
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary grid place-items-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </span>
                )}
                <span
                  className={`flex-1 font-bold text-base sm:text-lg transition-colors ${
                    isSelected ? "text-primary" : "text-white"
                  }`}
                >
                  {s.name}
                </span>
                <span
                  className={`shrink-0 w-12 h-12 rounded-xl grid place-items-center transition-all duration-300 ${
                    isSelected ? "bg-primary/10" : "bg-white/10 group-hover:bg-white/20"
                  }`}
                >
                  <Icon
                    icon={iconName}
                    className={`w-7 h-7 transition-colors ${
                      isSelected ? "text-primary" : "text-white"
                    }`}
                  />
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
