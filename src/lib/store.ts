export type Role = "patient" | "doctor" | "receptionist" | "admin";
export type BookingType = "new" | "followup";

export interface User {
  id: string;
  username: string;
  fullName: string;
  age: number;
  gender: "male" | "female";
  phone: string;
  email?: string;
  password: string;
  role: Role;
  bookingType?: BookingType;
}

export interface Specialty {
  key: string;
  name: string;
  emoji: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string; // specialty name (Arabic)
  area: string;      // area within Qaleen
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

const KEYS = {
  users: "rq_users",
  session: "rq_session",
  doctors: "rq_doctors",
  bookings: "rq_bookings",
  ads: "rq_ads",
  initialized: "rq_initialized_v3",
};

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

const seedUsers: User[] = [
  { id: "u-admin", username: "admin", fullName: "المدير العام", age: 35, gender: "male", phone: "01000000000", email: "admin@raha.com", password: "admin123", role: "admin" },
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
  if (!localStorage.getItem(KEYS.initialized)) {
    localStorage.removeItem(KEYS.doctors);
    localStorage.removeItem(KEYS.ads);
    localStorage.removeItem(KEYS.users);
    localStorage.removeItem(KEYS.bookings);
    localStorage.removeItem(KEYS.session);
    write(KEYS.initialized, true);
  }
  if (!localStorage.getItem(KEYS.doctors)) write(KEYS.doctors, [] as Doctor[]);
  if (!localStorage.getItem(KEYS.ads)) write(KEYS.ads, [] as Ad[]);
  if (!localStorage.getItem(KEYS.users)) write(KEYS.users, seedUsers);
  if (!localStorage.getItem(KEYS.bookings)) write(KEYS.bookings, [] as Booking[]);
}

export const store = {
  // Users / auth
  getUsers: () => read<User[]>(KEYS.users, []),
  setUsers: (u: User[]) => write(KEYS.users, u),
  signup: (u: Omit<User, "id">): User => {
    const users = store.getUsers();
    if (users.some((x) => x.username.toLowerCase() === u.username.toLowerCase())) throw new Error("اسم المستخدم مستخدم بالفعل");
    if (users.some((x) => x.phone === u.phone)) throw new Error("رقم الهاتف مسجل بالفعل");
    if (u.email && users.some((x) => x.email && x.email === u.email)) throw new Error("البريد الإلكتروني مستخدم بالفعل");
    const newUser: User = { ...u, id: "u-" + Date.now() };
    store.setUsers([...users, newUser]);
    store.setSession(newUser);
    return newUser;
  },
  login: (identifier: string, password: string): User => {
    const id = identifier.trim().toLowerCase();
    const user = store.getUsers().find(
      (x) =>
        (x.username.toLowerCase() === id || x.phone === identifier.trim() || (x.email ?? "").toLowerCase() === id) &&
        x.password === password,
    );
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
  addDoctor: (d: Omit<Doctor, "id">): Doctor => {
    const list = store.getDoctors();
    const nd: Doctor = { ...d, id: "d-" + Date.now() };
    store.setDoctors([nd, ...list]);
    return nd;
  },

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

  specialties: SPECIALTIES.map((s) => s.name),
  specialtiesMeta: SPECIALTIES,
  areas: QALEEN_AREAS,
};
