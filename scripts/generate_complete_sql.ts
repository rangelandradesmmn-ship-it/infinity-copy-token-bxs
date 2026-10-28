import fs from 'fs';
import path from 'path';
import { initialLandingPageContent } from '../src/data/defaultLandingPage';

const contentJsonEscaped = JSON.stringify(initialLandingPageContent).replace(/'/g, "''");

const sql = `-- ====================================================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO DO BANCO DE DADOS - SUPABASE
-- PROJETO: INFINITY COPY - TOKEN BXS
-- ====================================================================

-- 1. TABELA PROFILES (Usuários e Administradores)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT DEFAULT 'senha123456',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'pending')),
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. TABELA USER_LANDING_SETTINGS (Campos Personalizados dos Parceiros)
CREATE TABLE IF NOT EXISTS public.user_landing_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_image_url TEXT DEFAULT '',
  registration_url TEXT DEFAULT '',
  whatsapp_country_code TEXT DEFAULT '+55',
  whatsapp_number TEXT DEFAULT '',
  whatsapp_message TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_landing_settings_user_id ON public.user_landing_settings(user_id);

-- 3. TABELA LANDING_PAGE_VERSIONS (Gerenciamento de Versões da Landing Page Master)
CREATE TABLE IF NOT EXISTS public.landing_page_versions (
  id TEXT PRIMARY KEY,
  version_number INTEGER NOT NULL,
  content_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_landing_page_versions_ver ON public.landing_page_versions(version_number DESC);

-- 4. TABELA LANDING_EVENTS (Métricas de Acessos e Cliques em Tempo Real)
CREATE TABLE IF NOT EXISTS public.landing_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'registration_click', 'whatsapp_click')),
  page_path TEXT NOT NULL,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_landing_events_user_id ON public.landing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_landing_events_type ON public.landing_events(event_type);

-- 5. TABELA ADMIN_AUDIT_LOGS (Registro de Auditoria de Ações)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. POLÍTICAS DE ACESSO (Row Level Security - RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_landing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Permissões para profiles
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
CREATE POLICY "profiles_insert_all" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;
CREATE POLICY "profiles_update_all" ON public.profiles FOR UPDATE USING (true);

-- Permissões para user_landing_settings
DROP POLICY IF EXISTS "settings_select_all" ON public.user_landing_settings;
CREATE POLICY "settings_select_all" ON public.user_landing_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "settings_insert_all" ON public.user_landing_settings;
CREATE POLICY "settings_insert_all" ON public.user_landing_settings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "settings_update_all" ON public.user_landing_settings;
CREATE POLICY "settings_update_all" ON public.user_landing_settings FOR UPDATE USING (true);

-- Permissões para landing_page_versions
DROP POLICY IF EXISTS "versions_select_all" ON public.landing_page_versions;
CREATE POLICY "versions_select_all" ON public.landing_page_versions FOR SELECT USING (true);

DROP POLICY IF EXISTS "versions_insert_all" ON public.landing_page_versions;
CREATE POLICY "versions_insert_all" ON public.landing_page_versions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "versions_update_all" ON public.landing_page_versions;
CREATE POLICY "versions_update_all" ON public.landing_page_versions FOR UPDATE USING (true);

-- Permissões para landing_events
DROP POLICY IF EXISTS "events_select_all" ON public.landing_events;
CREATE POLICY "events_select_all" ON public.landing_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "events_insert_all" ON public.landing_events;
CREATE POLICY "events_insert_all" ON public.landing_events FOR INSERT WITH CHECK (true);

-- Permissões para admin_audit_logs
DROP POLICY IF EXISTS "audit_select_all" ON public.admin_audit_logs;
CREATE POLICY "audit_select_all" ON public.admin_audit_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "audit_insert_all" ON public.admin_audit_logs;
CREATE POLICY "audit_insert_all" ON public.admin_audit_logs FOR INSERT WITH CHECK (true);

-- 7. DADOS INICIAIS (SEED)

-- Inserir Rangel Andrade (Super Admin)
INSERT INTO public.profiles (id, name, email, role, status, slug, password)
VALUES (
  'user-rangel-0001',
  'Rangel Andrade',
  'rangelandradesmmn@gmail.com',
  'admin',
  'active',
  'cadastro',
  'senha123456'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  slug = EXCLUDED.slug;

-- Inserir Jorge Carvalho (Parceiro)
INSERT INTO public.profiles (id, name, email, role, status, slug, password)
VALUES (
  'user-jorge-0001',
  'Jorge Carvalho',
  'jorgecarvalho@gmail.com',
  'user',
  'active',
  'jorge-carvalho',
  'senha123456'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  slug = EXCLUDED.slug;

-- Configurações de Landing Page do Rangel
INSERT INTO public.user_landing_settings (
  id, user_id, profile_image_url, registration_url, whatsapp_country_code, whatsapp_number, whatsapp_message
)
VALUES (
  'set-rangel-0001',
  'user-rangel-0001',
  '/logo.png',
  'https://meet.google.com/meet/qng-voma-xqm',
  '+55',
  '22997953907',
  'Olá Rangel! Acessei sua página exclusiva e quero tirar dúvidas sobre a Infinity Copy.'
)
ON CONFLICT (user_id) DO NOTHING;

-- Configurações de Landing Page do Jorge Carvalho
INSERT INTO public.user_landing_settings (
  id, user_id, profile_image_url, registration_url, whatsapp_country_code, whatsapp_number, whatsapp_message
)
VALUES (
  'set-jorge-0001',
  'user-jorge-0001',
  '',
  'https://meet.google.com/meet/qng-voma-xqm',
  '+55',
  '',
  'Olá Jorge! Acessei sua página exclusiva e quero saber mais sobre a Infinity Copy.'
)
ON CONFLICT (user_id) DO NOTHING;

-- Versão 1 Publicada Oficial da Landing Page Master
INSERT INTO public.landing_page_versions (
  id, version_number, status, published_at, content_json
)
VALUES (
  'ver-uuid-0001',
  1,
  'published',
  now(),
  '${contentJsonEscaped}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
`;

const targetPath = path.resolve(__dirname, '../supabase/complete_setup.sql');
fs.writeFileSync(targetPath, sql, 'utf8');
console.log('Script gerado em:', targetPath);
