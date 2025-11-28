-- Update trigger to make first user admin automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  default_role app_role;
BEGIN
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- First user becomes admin, others start as recepcao
  IF user_count = 0 THEN
    default_role := 'admin'::app_role;
  ELSE
    default_role := 'recepcao'::app_role;
  END IF;

  INSERT INTO public.profiles (id, full_name, role, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'),
    default_role,
    true
  );
  
  -- Also create role in user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, default_role);
  
  RETURN NEW;
END;
$$;