import { Link } from "@tanstack/react-router";
import { MapPin, Stethoscope, BadgeCheck } from "lucide-react";
import type { Doctor } from "@/lib/store";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
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
      </div>
      <div className="mt-4 flex-1">
        <h3 className="font-bold text-lg text-foreground">{doctor.name}</h3>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <Stethoscope className="w-4 h-4" /> {doctor.specialty}
        </div>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" /> {doctor.city}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-primary font-extrabold">{doctor.price} <span className="text-xs font-normal text-muted-foreground">ج.م</span></div>
        <Link
          to="/doctor/$id"
          params={{ id: doctor.id }}
          className="btn-primary px-4 h-10 inline-flex items-center rounded-xl text-sm font-semibold"
        >
          احجز الآن
        </Link>
      </div>
    </div>
  );
}
