-- Add doctor management columns
CREATE TYPE public.doctor_degree AS ENUM ('specialist', 'consultant', 'professor');

ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS degree public.doctor_degree NOT NULL DEFAULT 'specialist',
  ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_doctors_is_active ON public.doctors(is_active);

-- Public can only see active doctors; admins keep full access via existing "Admins can manage doctors" policy
DROP POLICY IF EXISTS "Anyone can view doctors" ON public.doctors;
CREATE POLICY "Anyone can view active doctors"
  ON public.doctors
  FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));