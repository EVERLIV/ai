
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'client');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'Офис',
  class TEXT NOT NULL DEFAULT 'B',
  area NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  price_per_m2 NUMERIC NOT NULL DEFAULT 0,
  address TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  floor TEXT DEFAULT '',
  total_floors INTEGER DEFAULT 1,
  ceiling_height NUMERIC DEFAULT 0,
  parking TEXT DEFAULT '',
  condition TEXT DEFAULT '',
  layout TEXT DEFAULT '',
  deal_type TEXT NOT NULL DEFAULT 'Аренда',
  deposit TEXT DEFAULT '',
  contract_term TEXT DEFAULT '',
  description TEXT DEFAULT '',
  features TEXT[] DEFAULT '{}',
  photos_count INTEGER DEFAULT 0,
  published_date TIMESTAMPTZ DEFAULT now(),
  views_count INTEGER DEFAULT 0,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for properties
CREATE POLICY "Anyone can view active properties"
  ON public.properties FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated can view all properties"
  ON public.properties FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can insert properties"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admins and managers can update properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admins can delete properties"
  ON public.properties FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
