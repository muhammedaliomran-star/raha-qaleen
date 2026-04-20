import { Link } from "@tanstack/react-router";
import { MapPin, BadgeCheck, Star, Users } from "lucide-react";
import { getSpecialtyMeta, type Doctor } from "@/lib/store";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const meta = getSpecialtyMeta(doctor.specialty);
  return (
    <div className="glass card-hover rounded-2xl p-4 flex flex-col">
      <div className="relative">
        <img
          src={doctor.image}
          alt={doctor.name}
          loading="lazy"
          width={400}
          height={300}
          className="w-full h-44 object-cover rounded-xl"
        />
        <span className="absolute top-2 right-2 glass-strong text-xs px-2 py-1 rounded-full flex items-center gap-1 text-success">
          <BadgeCheck className="w-3.5 h-3.5" /> متاح اليوم
        </span>
        <span className="absolute top-2 left-2 glass-strong text-base px-2 py-1 rounded-full" title={doctor.specialty}>
          {meta.emoji}
        </span>
      </div>
      <div className="mt-4 flex-1">
        <h3 className="font-bold text-lg text-foreground line-clamp-1">{doctor.name}</h3>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <span>{meta.emoji}</span> {doctor.specialty}
        </div>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" /> {doctor.area}
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 text-amber-600">
            <Star className="w-3.5 h-3.5 fill-current" /> {(doctor.rating ?? 4.5).toFixed(1)}
          </span>
          {!!doctor.patients_count && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Users className="w-3.5 h-3.5" /> {doctor.patients_count}+ مريض
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-primary font-extrabold">{doctor.price} <span className="text-xs font-normal text-muted-foreground">ج.م</span></div>
        <Link
          to="/doctor/$id"
          params={{ id: doctor.id }}
          className="btn-primary px-4 h-11 inline-flex items-center rounded-xl text-sm font-bold"
        >
          احجز الآن
        </Link>
      </div>
      {doctor.whatsapp_number && (
        <WhatsAppButton phone={doctor.whatsapp_number} doctorName={doctor.name} className="mt-2 w-full" />
      )}
    </div>
  );
}
