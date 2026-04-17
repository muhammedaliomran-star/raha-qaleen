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
  initialized: "rq_initialized_v2",
};

const SPECIALTIES = ["باطنة", "أسنان", "أطفال", "جلدية", "نساء وتوليد", "عظام", "قلب", "نفسية"];

// Only one admin account is seeded so the platform is usable from day one.
const seedUsers: User[] = [
  { id: "u-admin", fullName: "المدير العام", age: 35, gender: "male", email: "admin@raha.com", password: "admin123", role: "admin" },
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
  // v2 reset: wipe any old demo data from previous version
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

  specialties: SPECIALTIES,
};
