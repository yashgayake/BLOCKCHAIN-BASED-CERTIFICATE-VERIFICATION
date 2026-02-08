
-- ============================================
-- PHASE 1 (Part 2): Tables, Functions, RLS
-- ============================================

-- 1. Create institutes table
CREATE TABLE public.institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    address TEXT,
    contact_email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;

-- 2. Add institute_id to profiles
ALTER TABLE public.profiles
ADD COLUMN institute_id UUID REFERENCES public.institutes(id);

-- 3. Helper: get user's institute_id
CREATE OR REPLACE FUNCTION public.get_user_institute_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT institute_id
    FROM public.profiles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- 4. Helper: is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = 'super_admin'
    )
$$;

-- 5. Helper: is_institute_admin for a specific institute
CREATE OR REPLACE FUNCTION public.is_institute_admin(_user_id UUID, _institute_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.profiles p ON p.user_id = ur.user_id
        WHERE ur.user_id = _user_id
          AND ur.role = 'institute_admin'
          AND p.institute_id = _institute_id
    )
$$;

-- ============================================
-- INSTITUTES RLS
-- ============================================
CREATE POLICY "Super admins can view all institutes"
ON public.institutes FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can create institutes"
ON public.institutes FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update institutes"
ON public.institutes FOR UPDATE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete institutes"
ON public.institutes FOR DELETE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Institute members can view own institute"
ON public.institutes FOR SELECT
USING (id = public.get_user_institute_id(auth.uid()));

-- ============================================
-- PROFILES RLS: Institute-scoped policies
-- ============================================
CREATE POLICY "Institute admins can view institute profiles"
ON public.profiles FOR SELECT
USING (
    public.has_role(auth.uid(), 'institute_admin') 
    AND institute_id = public.get_user_institute_id(auth.uid())
);

CREATE POLICY "Institute admins can update institute profiles"
ON public.profiles FOR UPDATE
USING (
    public.has_role(auth.uid(), 'institute_admin') 
    AND institute_id = public.get_user_institute_id(auth.uid())
);

CREATE POLICY "Super admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert any profile"
ON public.profiles FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

-- ============================================
-- USER_ROLES RLS: Super admin policies
-- ============================================
CREATE POLICY "Super admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.is_super_admin(auth.uid()));

-- ============================================
-- Trigger for institutes updated_at
-- ============================================
CREATE TRIGGER update_institutes_updated_at
BEFORE UPDATE ON public.institutes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
