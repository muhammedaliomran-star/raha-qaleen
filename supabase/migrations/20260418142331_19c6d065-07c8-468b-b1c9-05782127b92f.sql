-- 1. Enums
create type public.app_role as enum ('patient', 'doctor', 'receptionist', 'admin');
create type public.booking_type as enum ('new', 'followup');
create type public.gender_type as enum ('male', 'female');
create type public.booking_status as enum ('upcoming', 'done', 'cancelled');

-- 2. Profiles (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  age integer not null check (age between 1 and 120),
  gender gender_type not null,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 3. User roles (separate table — never store roles on profiles)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- 4. Security definer function to check role (avoids RLS recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- 5. Doctors
create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text not null,
  area text not null,
  price integer not null default 0,
  image text not null default '',
  times text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.doctors enable row level security;

-- 6. Bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctors(id) on delete cascade not null,
  patient_id uuid references auth.users(id) on delete cascade not null,
  patient_name text not null,
  doctor_name text not null,
  time text not null,
  date text not null,
  status booking_status not null default 'upcoming',
  booking_type booking_type not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;
create index idx_bookings_patient on public.bookings(patient_id);
create index idx_bookings_doctor on public.bookings(doctor_id);

-- 7. Ads
create table public.ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  cta text not null default 'احجز الآن',
  image text not null,
  is_active boolean not null default true,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.ads enable row level security;

-- 8. updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- 9. handle_new_user trigger: create profile + default patient role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _role app_role;
begin
  insert into public.profiles (id, username, full_name, age, gender, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'full_name', 'مستخدم'),
    coalesce((new.raw_user_meta_data->>'age')::int, 25),
    coalesce((new.raw_user_meta_data->>'gender')::gender_type, 'male'),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );

  _role := coalesce((new.raw_user_meta_data->>'role')::app_role, 'patient'::app_role);
  -- Never auto-assign admin via signup
  if _role = 'admin' then
    _role := 'patient';
  end if;

  insert into public.user_roles (user_id, role) values (new.id, _role);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 10. RLS Policies

-- profiles: users see/update own; admins see all
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- user_roles: users see own roles; only admins manage
create policy "Users can view own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- doctors: public read; only admins write
create policy "Anyone can view doctors"
  on public.doctors for select
  using (true);

create policy "Admins can manage doctors"
  on public.doctors for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- bookings:
-- patient sees own; admin/receptionist see all; doctor sees own appointments
create policy "Patients can view own bookings"
  on public.bookings for select
  using (auth.uid() = patient_id);

create policy "Staff can view all bookings"
  on public.bookings for select
  using (
    public.has_role(auth.uid(), 'admin') or
    public.has_role(auth.uid(), 'receptionist') or
    public.has_role(auth.uid(), 'doctor')
  );

create policy "Authenticated can create own booking"
  on public.bookings for insert
  with check (auth.uid() = patient_id);

create policy "Receptionist/admin can create any booking"
  on public.bookings for insert
  with check (
    public.has_role(auth.uid(), 'admin') or
    public.has_role(auth.uid(), 'receptionist')
  );

create policy "Patient can cancel own booking"
  on public.bookings for update
  using (auth.uid() = patient_id);

create policy "Staff can update bookings"
  on public.bookings for update
  using (
    public.has_role(auth.uid(), 'admin') or
    public.has_role(auth.uid(), 'receptionist')
  );

create policy "Patient can delete own booking"
  on public.bookings for delete
  using (auth.uid() = patient_id);

create policy "Staff can delete bookings"
  on public.bookings for delete
  using (
    public.has_role(auth.uid(), 'admin') or
    public.has_role(auth.uid(), 'receptionist')
  );

-- ads: public read active; admins manage
create policy "Anyone can view active ads"
  on public.ads for select
  using (is_active = true);

create policy "Admins can view all ads"
  on public.ads for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage ads"
  on public.ads for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));