-- 1. Add new columns to doctors
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS whatsapp_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS rating numeric(2,1) NOT NULL DEFAULT 4.5,
  ADD COLUMN IF NOT EXISTS patients_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT 'كفر الشيخ',
  ADD COLUMN IF NOT EXISTS governorate text NOT NULL DEFAULT 'كفر الشيخ',
  ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '';

-- 2. Create doctor_availability table
CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  date date NOT NULL,
  time text NOT NULL,
  is_booked boolean NOT NULL DEFAULT false,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, date, time)
);

CREATE INDEX IF NOT EXISTS idx_avail_doctor_date ON public.doctor_availability(doctor_id, date);
CREATE INDEX IF NOT EXISTS idx_avail_booked ON public.doctor_availability(is_booked);

-- 3. Enable RLS
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Anyone can view availability"
  ON public.doctor_availability FOR SELECT USING (true);

CREATE POLICY "Staff can manage availability"
  ON public.doctor_availability FOR ALL
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'receptionist') OR has_role(auth.uid(),'doctor'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'receptionist') OR has_role(auth.uid(),'doctor'));

-- Allow authenticated users to update is_booked atomically via app logic (we'll use a SECURITY DEFINER function below for booking)

-- 5. Add availability_id + date_iso to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS availability_id uuid REFERENCES public.doctor_availability(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS date_iso date;

-- 6. Atomic booking function: claims a slot + creates booking in one transaction
CREATE OR REPLACE FUNCTION public.book_slot(
  _availability_id uuid,
  _booking_type booking_type DEFAULT 'new'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _slot record;
  _doctor record;
  _profile record;
  _booking_id uuid;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  -- Lock the slot row to prevent races
  SELECT * INTO _slot FROM public.doctor_availability
   WHERE id = _availability_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'slot_not_found'; END IF;
  IF _slot.is_booked THEN RAISE EXCEPTION 'slot_already_booked'; END IF;

  SELECT * INTO _doctor FROM public.doctors WHERE id = _slot.doctor_id;
  SELECT * INTO _profile FROM public.profiles WHERE id = _uid;

  INSERT INTO public.bookings (
    doctor_id, doctor_name, patient_id, patient_name,
    time, date, date_iso, status, booking_type, availability_id
  ) VALUES (
    _slot.doctor_id, _doctor.name, _uid,
    COALESCE(_profile.full_name,'مريض'),
    _slot.time,
    to_char(_slot.date,'YYYY-MM-DD'),
    _slot.date,
    'upcoming', _booking_type, _slot.id
  ) RETURNING id INTO _booking_id;

  UPDATE public.doctor_availability
     SET is_booked = true, booking_id = _booking_id
   WHERE id = _slot.id;

  RETURN _booking_id;
END;
$$;

-- 7. Release slot when booking cancelled/deleted
CREATE OR REPLACE FUNCTION public.release_slot_on_booking_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.availability_id IS NOT NULL THEN
      UPDATE public.doctor_availability
         SET is_booked = false, booking_id = NULL
       WHERE id = OLD.availability_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' AND NEW.availability_id IS NOT NULL THEN
      UPDATE public.doctor_availability
         SET is_booked = false, booking_id = NULL
       WHERE id = NEW.availability_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_release_slot ON public.bookings;
CREATE TRIGGER trg_release_slot
AFTER UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.release_slot_on_booking_change();

-- 8. Seed availability generator (4pm-10pm every 30 min, next 14 days) for all doctors that have none
CREATE OR REPLACE FUNCTION public.seed_availability_for_all(_days int DEFAULT 14)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d record;
  day_offset int;
  hour int;
  minute int;
  slot_date date;
  slot_time text;
BEGIN
  FOR d IN SELECT id FROM public.doctors LOOP
    FOR day_offset IN 0.._days-1 LOOP
      slot_date := (current_date + day_offset);
      FOR hour IN 16..21 LOOP
        FOR minute IN 0..1 LOOP
          slot_time := lpad(hour::text,2,'0') || ':' || CASE WHEN minute=0 THEN '00' ELSE '30' END;
          INSERT INTO public.doctor_availability (doctor_id, date, time)
          VALUES (d.id, slot_date, slot_time)
          ON CONFLICT (doctor_id, date, time) DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

SELECT public.seed_availability_for_all(14);

-- 9. Seed default whatsapp number for doctors without one (placeholder Egyptian format)
UPDATE public.doctors SET whatsapp_number = '201000000000' WHERE whatsapp_number = '' OR whatsapp_number IS NULL;

-- 10. Enable Realtime
ALTER TABLE public.doctor_availability REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_availability;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;