-- Ensure target user has admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('3e91a0ec-278c-4121-ab75-1ea872058897', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove any other admin roles
DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id <> '3e91a0ec-278c-4121-ab75-1ea872058897';

-- Trigger to enforce single admin (by hardcoded user_id)
CREATE OR REPLACE FUNCTION public.enforce_single_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' AND NEW.user_id <> '3e91a0ec-278c-4121-ab75-1ea872058897'::uuid THEN
    RAISE EXCEPTION 'Only the designated owner account may hold the admin role.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_single_admin_trg ON public.user_roles;
CREATE TRIGGER enforce_single_admin_trg
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.enforce_single_admin();