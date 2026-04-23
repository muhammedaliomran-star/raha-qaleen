-- ============================================================
-- WEEKLY SCHEDULE + CAPACITY SYSTEM
-- ============================================================

-- 1. Per-day work-hour templates (one row per time block per weekday)
CREATE TABLE IF NOT EXISTS public.weekly_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=Sun .. 6=Sat
  start_time text NOT NULL, -- "HH:MM"
  end_time text NOT NULL,   -- "HH:MM"
  slot_minutes integer NOT NULL DEFAULT 30 CHECK (slot_minutes BETWEEN 5 AND 240),
  capacity integer NOT NULL DEFAULT 1 CHECK (capacity BETWEEN 1 AND 50),
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_schedule_doctor ON public.weekly_schedule(doctor_id, weekday);

ALTER TABLE public.weekly_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weekly schedule"
  ON public.weekly_schedule FOR SELECT USING (true);

CREATE POLICY "Staff can manage weekly schedule"
  ON public.weekly_schedule FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'receptionist'::app_role) OR has_role(auth.uid(), 'doctor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'receptionist'::app_role) OR has_role(auth.uid(), 'doctor'::app_role));

-- 2. Add capacity + disabled to doctor_availability (slot-level overrides)
ALTER TABLE public.doctor_availability
  ADD COLUMN IF NOT EXISTS capacity integer NOT NULL DEFAULT 1 CHECK (capacity BETWEEN 1 AND 50),
  ADD COLUMN IF NOT EXISTS booked_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_disabled boolean NOT NULL DEFAULT false;

-- Backfill booked_count from existing is_booked flag
UPDATE public.doctor_availability SET booked_count = 1 WHERE is_booked = true AND booked_count = 0;

-- Ensure uniqueness for ON CONFLICT in seed function
CREATE UNIQUE INDEX IF NOT EXISTS uq_doctor_availability_slot
  ON public.doctor_availability(doctor_id, date, time);

-- 3. RPC: regenerate availability for next N days from weekly_schedule
CREATE OR REPLACE FUNCTION public.apply_weekly_schedule(_doctor_id uuid, _days integer DEFAULT 14)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d_off int;
  slot_date date;
  wd smallint;
  blk record;
  cur_min int;
  end_min int;
  hh int;
  mm int;
  t_text text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'receptionist'::app_role) OR has_role(auth.uid(),'doctor'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR d_off IN 0.._days-1 LOOP
    slot_date := current_date + d_off;
    -- Postgres dow: 0=Sun..6=Sat — matches our convention
    wd := EXTRACT(DOW FROM slot_date)::smallint;

    FOR blk IN
      SELECT * FROM public.weekly_schedule
       WHERE doctor_id = _doctor_id AND weekday = wd AND is_enabled = true
    LOOP
      cur_min := (split_part(blk.start_time,':',1))::int * 60 + (split_part(blk.start_time,':',2))::int;
      end_min := (split_part(blk.end_time,':',1))::int * 60 + (split_part(blk.end_time,':',2))::int;
      WHILE cur_min < end_min LOOP
        hh := cur_min / 60;
        mm := cur_min % 60;
        t_text := lpad(hh::text,2,'0') || ':' || lpad(mm::text,2,'0');

        INSERT INTO public.doctor_availability (doctor_id, date, time, capacity, is_disabled)
        VALUES (_doctor_id, slot_date, t_text, blk.capacity, false)
        ON CONFLICT (doctor_id, date, time) DO UPDATE
          SET capacity = GREATEST(EXCLUDED.capacity, public.doctor_availability.booked_count);

        cur_min := cur_min + blk.slot_minutes;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

-- 4. RPC: copy one weekday's blocks into other weekdays
CREATE OR REPLACE FUNCTION public.copy_weekday_schedule(
  _doctor_id uuid, _from_weekday smallint, _to_weekdays smallint[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target smallint;
  src record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'receptionist'::app_role) OR has_role(auth.uid(),'doctor'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOREACH target IN ARRAY _to_weekdays LOOP
    IF target = _from_weekday THEN CONTINUE; END IF;
    DELETE FROM public.weekly_schedule WHERE doctor_id = _doctor_id AND weekday = target;
    FOR src IN SELECT * FROM public.weekly_schedule WHERE doctor_id = _doctor_id AND weekday = _from_weekday LOOP
      INSERT INTO public.weekly_schedule(doctor_id, weekday, start_time, end_time, slot_minutes, capacity, is_enabled)
      VALUES (_doctor_id, target, src.start_time, src.end_time, src.slot_minutes, src.capacity, src.is_enabled);
    END LOOP;
  END LOOP;
END;
$$;

-- 5. Replace book_slot to honor capacity + is_disabled
CREATE OR REPLACE FUNCTION public.book_slot(_availability_id uuid, _booking_type booking_type DEFAULT 'new'::booking_type)
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
  IF _uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  SELECT * INTO _slot FROM public.doctor_availability WHERE id = _availability_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'slot_not_found'; END IF;
  IF _slot.is_disabled THEN RAISE EXCEPTION 'slot_disabled'; END IF;
  IF _slot.booked_count >= _slot.capacity THEN RAISE EXCEPTION 'slot_full'; END IF;

  SELECT * INTO _doctor FROM public.doctors WHERE id = _slot.doctor_id;
  SELECT * INTO _profile FROM public.profiles WHERE id = _uid;

  INSERT INTO public.bookings (
    doctor_id, doctor_name, patient_id, patient_name,
    time, date, date_iso, status, booking_type, availability_id
  ) VALUES (
    _slot.doctor_id, _doctor.name, _uid, COALESCE(_profile.full_name,'مريض'),
    _slot.time, to_char(_slot.date,'YYYY-MM-DD'), _slot.date,
    'upcoming', _booking_type, _slot.id
  ) RETURNING id INTO _booking_id;

  UPDATE public.doctor_availability
     SET booked_count = booked_count + 1,
         is_booked = (booked_count + 1) >= capacity,
         booking_id = _booking_id
   WHERE id = _slot.id;

  RETURN _booking_id;
END;
$$;

-- 6. Update release-on-cancel trigger for capacity-aware decrement
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
         SET booked_count = GREATEST(0, booked_count - 1),
             is_booked = (GREATEST(0, booked_count - 1)) >= capacity,
             booking_id = NULL
       WHERE id = OLD.availability_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' AND NEW.availability_id IS NOT NULL THEN
      UPDATE public.doctor_availability
         SET booked_count = GREATEST(0, booked_count - 1),
             is_booked = (GREATEST(0, booked_count - 1)) >= capacity,
             booking_id = NULL
       WHERE id = NEW.availability_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;