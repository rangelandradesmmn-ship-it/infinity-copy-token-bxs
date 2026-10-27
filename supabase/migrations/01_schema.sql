-- ====================================================================
-- 01_SCHEMA.SQL - SAAS DE LANDING PAGES PERSONALIZADAS (ANTIGRAVITY)
-- ====================================================================

-- Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. TABELA PROFILES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'pending')),
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- --------------------------------------------------------------------
-- 2. TABELA USER_LANDING_SETTINGS (Apenas os 4 campos autorizados)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_landing_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_image_url TEXT DEFAULT '',
  registration_url TEXT DEFAULT '',
  whatsapp_country_code TEXT DEFAULT '+55',
  whatsapp_number TEXT DEFAULT '',
  whatsapp_message TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_landing_settings_user_id ON public.user_landing_settings(user_id);

-- --------------------------------------------------------------------
-- 3. TABELA LANDING_PAGE_VERSIONS (Gerenciamento da Master Page)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.landing_page_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_number INTEGER NOT NULL,
  content_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_landing_page_versions_status ON public.landing_page_versions(status);
CREATE INDEX IF NOT EXISTS idx_landing_page_versions_ver ON public.landing_page_versions(version_number DESC);

-- --------------------------------------------------------------------
-- 4. TABELA LANDING_EVENTS (Métricas e Auditoria de Acessos/Cliques)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.landing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'registration_click', 'whatsapp_click')),
  page_path TEXT NOT NULL,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_landing_events_user_id ON public.landing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_landing_events_type ON public.landing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_landing_events_created ON public.landing_events(created_at DESC);

-- --------------------------------------------------------------------
-- 5. TABELA ADMIN_AUDIT_LOGS (Auditoria de Ações do Super Admin)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);

-- --------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_landing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- PROFILES POLICIES ---
-- Qualquer pessoa (pública) pode ler dados essenciais de perfis ativos (para renderizar /p/[slug])
CREATE POLICY "Public profiles can be viewed by anyone"
  ON public.profiles FOR SELECT
  USING (status = 'active' OR auth.uid() = id OR public.is_admin());

-- Usuário autenticado pode atualizar seu próprio nome
CREATE POLICY "Users can update their own profile name"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super Admin tem acesso total a profiles
CREATE POLICY "Super admin full access on profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- --- USER_LANDING_SETTINGS POLICIES ---
-- Qualquer visitante pode ler as configurações de landing page de usuários ativos
CREATE POLICY "Public read user landing settings"
  ON public.user_landing_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = user_landing_settings.user_id
      AND (profiles.status = 'active' OR auth.uid() = profiles.id OR public.is_admin())
    )
  );

-- Usuário pode atualizar suas próprias configurações (somente as 4 personalizações)
CREATE POLICY "Users can manage own landing settings"
  ON public.user_landing_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin tem acesso total
CREATE POLICY "Super admin full access on user settings"
  ON public.user_landing_settings FOR ALL
  USING (public.is_admin());

-- --- LANDING_PAGE_VERSIONS POLICIES ---
-- Qualquer pessoa pode ler a versão publicada
CREATE POLICY "Anyone can view published landing page version"
  ON public.landing_page_versions FOR SELECT
  USING (status = 'published' OR public.is_admin());

-- Somente Super Admin pode criar, atualizar ou excluir versões
CREATE POLICY "Only super admin can manage landing page versions"
  ON public.landing_page_versions FOR ALL
  USING (public.is_admin());

-- --- LANDING_EVENTS POLICIES ---
-- Visitantes anônimos e usuários podem inserir eventos de rastreamento
CREATE POLICY "Anyone can insert landing events"
  ON public.landing_events FOR INSERT
  WITH CHECK (true);

-- Usuários comuns podem visualizar apenas os eventos associados ao seu próprio id
CREATE POLICY "Users can view their own landing events"
  ON public.landing_events FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- --- ADMIN_AUDIT_LOGS POLICIES ---
-- Somente Super Admin pode ler ou registrar logs de auditoria
CREATE POLICY "Only admin can view and manage audit logs"
  ON public.admin_audit_logs FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- 7. TRIGGER AUTOMÁTICO: NOVO USUÁRIO -> PERFIL + SLUG + SETTINGS
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
  user_full_name TEXT;
BEGIN
  user_full_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  
  -- Gera slug base limpo
  base_slug := lower(regexp_replace(user_full_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN base_slug := 'parceiro'; END IF;
  
  final_slug := base_slug;
  -- Garante unicidade do slug
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  -- Insere perfil
  INSERT INTO public.profiles (id, name, email, role, status, slug)
  VALUES (
    new.id,
    user_full_name,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    'active',
    final_slug
  );

  -- Insere linha de configurações individuais
  INSERT INTO public.user_landing_settings (user_id)
  VALUES (new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparado no cadastro do Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
