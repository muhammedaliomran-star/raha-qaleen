// Static metadata + types only. All data lives in Supabase now.
export type Role = "patient" | "doctor" | "receptionist" | "admin";
export type BookingType = "new" | "followup";
export type BookingStatus = "upcoming" | "done" | "cancelled";
export type Gender = "male" | "female";

export interface Specialty {
  key: string;
  name: string;
  emoji: string;
}

export interface Profile {
  id: string;
  username: string;
  fullName: string;
  age: number;
  gender: Gender;
  phone: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  area: string;
  price: number;
  image: string;
  times: string[];
}

export interface Booking {
  id: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  time: string;
  date: string;
  status: BookingStatus;
  bookingType: BookingType;
}

export interface Ad {
  id: string;
  image: string;
  title: string;
  description: string;
  cta: string;
  isActive: boolean;
  order: number;
}

export const SPECIALTIES: Specialty[] = [
  { key: "cardio", name: "قلب", emoji: "❤️" },
  { key: "dental", name: "أسنان", emoji: "🦷" },
  { key: "derma", name: "جلدية", emoji: "🧴" },
  { key: "pediatrics", name: "أطفال", emoji: "👶" },
  { key: "internal", name: "باطنة", emoji: "🩺" },
  { key: "ortho", name: "عظام", emoji: "🦴" },
  { key: "obgyn", name: "نساء وتوليد", emoji: "🤰" },
  { key: "ent", name: "أنف وأذن", emoji: "👂" },
  { key: "eye", name: "رمد", emoji: "👁️" },
  { key: "psych", name: "نفسية", emoji: "🧠" },
];

export const QALEEN_AREAS: string[] = [
  "قلين",
  "منشأة عباس",
  "شباس الشهداء",
  "شباس الملح",
  "كفر المرازقة",
  "كفر يوسف",
  "عزبة بدوي",
  "عزبة عمرو",
  "كفر الشيخ",
];

export function getSpecialtyMeta(name: string): Specialty {
  return SPECIALTIES.find((s) => s.name === name) ?? { key: "other", name, emoji: "🩺" };
}

export const ROLE_LABEL: Record<Role, string> = {
  patient: "مريض",
  doctor: "دكتور",
  receptionist: "استقبال",
  admin: "أدمن",
};
