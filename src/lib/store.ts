import doc1 from "@/assets/doc1.jpg";
import doc2 from "@/assets/doc2.jpg";
import doc3 from "@/assets/doc3.jpg";
import doc4 from "@/assets/doc4.jpg";
import ad1 from "@/assets/ad1.jpg";
import ad2 from "@/assets/ad2.jpg";
import ad3 from "@/assets/ad3.jpg";

export type Role = "patient" | "doctor" | "receptionist" | "admin";

export interface User {
  id: string;
  fullName: string;
  age: number;
  gender: "male" | "female";
  email: string;
  password: string;
  role: Role;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  city: string;
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
  status: "upcoming" | "done" | "cancelled";
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

const KEYS = {
  users: "rq_users",
  session: "rq_session",
  doctors: "rq_doctors",
  bookings: "rq_bookings",
  ads: "rq_ads",
};

const SPECIALTIES = ["باطنة", "أسنان", "أطفال", "جلدية", "نساء وتوليد", "عظام", "قلب", "نفسية"];
const CITIES = ["القاهرة", "الإسكندرية", "الجيزة", "المنصورة", "أسيوط", "طنطا"];

const seedDoctors: Doctor[] = [
  { id: "d1", name: "د. أحمد المصري", specialty: "باطنة", city: "القاهرة", price: 350, image: doc1, times: ["10:00 ص", "12:00 م", "04:00 م", "06:00 م"] },
  { id: "d2", name: "د. سارة عبدالله", specialty: "نساء وتوليد", city: "الإسكندرية", price: 400, image: doc2, times: ["09:00 ص", "11:00 ص", "03:00 م"] },
  { id: "d3", name: "د. خالد يوسف", specialty: "أسنان", city: "الجيزة", price: 300, image: doc3, times: ["10:30 ص", "01:00 م", "05:00 م", "07:00 م"] },
  { id: "d4", name: "د. منى حسن", specialty: "أطفال", city: "القاهرة", price: 280, image: doc4, times: ["09:30 ص", "12:30 م", "04:30 م"] },
  { id: "d5", name: "د. عمر شريف", specialty: "جلدية", city: "المنصورة", price: 320, image: doc1, times: ["11:00 ص", "02:00 م", "06:30 م"] },
  { id: "d6", name: "د. ليلى إبراهيم", specialty: "قلب", city: "القاهرة", price: 500, image: doc2, times: ["10:00 ص", "01:00 م"] },
  { id: "d7", name: "د. حسام علي", specialty: "عظام", city: "طنطا", price: 350, image: doc3, times: ["12:00 م", "04:00 م", "07:00 م"] },
  { id: "d8", name: "د. نور الدين", specialty: "نفسية", city: "الإسكندرية", price: 450, image: doc4, times: ["11:00 ص", "03:00 م", "06:00 م"] },
];

const seedAds: Ad[] = [
  { id: "a1", image: ad1, title: "خصم 20% على أول كشف", description: "احجز الآن مع نخبة من الأطباء واحصل على خصم فوري", cta: "احجز الآن", isActive: true, order: 1 },
  { id: "a2", image: ad2, title: "عيادات الأسنان الفاخرة", description: "ابتسامة هوليود وتركيبات بأحدث التقنيات", cta: "اعرف المزيد", isActive: true, order: 2 },
  { id: "a3", image: ad3, title: "رعاية الأطفال على مدار الساعة", description: "أفضل أطباء الأطفال في انتظار طفلك", cta: "احجز الآن", isActive: true, order: 3 },
];

const seedUsers: User[] = [
  { id: "u-admin", fullName: "المدير العام", age: 35, gender: "male", email: "admin@raha.com", password: "admin123", role: "admin" },
  { id: "u-doc", fullName: "د. أحمد المصري", age: 40, gender: "male", email: "doctor@raha.com", password: "doctor123", role: "doctor" },
  { id: "u-rec", fullName: "موظفة الاستقبال", age: 28, gender: "female", email: "rec@raha.com", password: "rec123", role: "receptionist" },
  { id: "u-pat", fullName: "محمد سامي", age: 30, gender: "male", email: "patient@raha.com", password: "patient123", role: "patient" },
];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const v = localStorage.getItem(key);
  if (!v) return fallback;
  try { return JSON.parse(v) as T; } catch { return fallback; }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function initStore() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(KEYS.doctors)) write(KEYS.doctors, seedDoctors);
  if (!localStorage.getItem(KEYS.ads)) write(KEYS.ads, seedAds);
  if (!localStorage.getItem(KEYS.users)) write(KEYS.users, seedUsers);
  if (!localStorage.getItem(KEYS.bookings)) write(KEYS.bookings, [] as Booking[]);
}

export const store = {
  // Users / auth
  getUsers: () => read<User[]>(KEYS.users, []),
  setUsers: (u: User[]) => write(KEYS.users, u),
  signup: (u: Omit<User, "id">): User => {
    const users = store.getUsers();
    if (users.some((x) => x.email === u.email)) throw new Error("البريد الإلكتروني مستخدم بالفعل");
    const newUser: User = { ...u, id: "u-" + Date.now() };
    store.setUsers([...users, newUser]);
    store.setSession(newUser);
    return newUser;
  },
  login: (email: string, password: string): User => {
    const user = store.getUsers().find((x) => x.email === email && x.password === password);
    if (!user) throw new Error("بيانات الدخول غير صحيحة");
    store.setSession(user);
    return user;
  },
  logout: () => { if (typeof window !== "undefined") localStorage.removeItem(KEYS.session); },
  getSession: (): User | null => read<User | null>(KEYS.session, null),
  setSession: (u: User) => write(KEYS.session, u),

  // Doctors
  getDoctors: () => read<Doctor[]>(KEYS.doctors, []),
  setDoctors: (d: Doctor[]) => write(KEYS.doctors, d),
  getDoctor: (id: string) => store.getDoctors().find((d) => d.id === id),

  // Bookings
  getBookings: () => read<Booking[]>(KEYS.bookings, []),
  setBookings: (b: Booking[]) => write(KEYS.bookings, b),
  addBooking: (b: Omit<Booking, "id">): Booking => {
    const list = store.getBookings();
    const nb: Booking = { ...b, id: "b-" + Date.now() };
    store.setBookings([nb, ...list]);
    return nb;
  },

  // Ads
  getAds: () => read<Ad[]>(KEYS.ads, []),
  setAds: (a: Ad[]) => write(KEYS.ads, a),

  specialties: SPECIALTIES,
  cities: CITIES,
};
