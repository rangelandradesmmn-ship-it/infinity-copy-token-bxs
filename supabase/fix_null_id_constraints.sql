-- ====================================================================
-- SCRIPT DE CORREÇÃO DEFINITIVA DE ID E CHAT NO SUPABASE
-- Execute este script no SQL Editor do Supabase para corrigir
-- os erros de "null value in column id violates not-null constraint"
-- ====================================================================

-- 1. Habilitar extensões necessárias para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Configurar geração automática de ID em todas as tabelas existentes
-- Mesmo que a tabela já tenha sido criada anteriormente, isso adiciona o valor padrão gen_random_uuid()
ALTER TABLE IF EXISTS public.profiles 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE IF EXISTS public.user_landing_settings 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE IF EXISTS public.landing_page_versions 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE IF EXISTS public.landing_events 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE IF EXISTS public.admin_audit_logs 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 3. Criação das Tabelas de Chat ao Vivo & Moderação (se ainda não existirem)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'visitor' CHECK (sender_role IN ('admin', 'partner', 'visitor')),
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private', 'system')),
  recipient_id TEXT,
  recipient_name TEXT,
  read_status TEXT DEFAULT 'pending' CHECK (read_status IN ('pending', 'read')),
  read_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON public.chat_messages(type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient ON public.chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at DESC);

CREATE TABLE IF NOT EXISTS public.chat_settings (
  id TEXT PRIMARY KEY DEFAULT 'chat_global_settings',
  is_chat_enabled BOOLEAN NOT NULL DEFAULT true,
  admin_online BOOLEAN NOT NULL DEFAULT false,
  admin_last_seen TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  manual_override TEXT NOT NULL DEFAULT 'auto' CHECK (manual_override IN ('auto', 'online', 'offline')),
  slow_mode_seconds INTEGER NOT NULL DEFAULT 0,
  pinned_message TEXT,
  welcome_message TEXT DEFAULT 'Olá! Bem-vindo ao bate-papo ao vivo da comunidade Infinity Copy.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.chat_restrictions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT UNIQUE NOT NULL,
  user_name TEXT,
  muted BOOLEAN NOT NULL DEFAULT true,
  muted_by TEXT NOT NULL,
  muted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  reason TEXT
);

-- 4. Habilitar RLS e Permissões de Acesso (Leitura e Escrita Públicas)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_restrictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select_all" ON public.chat_messages;
CREATE POLICY "chat_messages_select_all" ON public.chat_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "chat_messages_insert_all" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_all" ON public.chat_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "chat_messages_update_all" ON public.chat_messages;
CREATE POLICY "chat_messages_update_all" ON public.chat_messages FOR UPDATE USING (true);

DROP POLICY IF EXISTS "chat_messages_delete_all" ON public.chat_messages;
CREATE POLICY "chat_messages_delete_all" ON public.chat_messages FOR DELETE USING (true);

DROP POLICY IF EXISTS "chat_settings_select_all" ON public.chat_settings;
CREATE POLICY "chat_settings_select_all" ON public.chat_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "chat_settings_upsert_all" ON public.chat_settings;
CREATE POLICY "chat_settings_upsert_all" ON public.chat_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "chat_restrictions_select_all" ON public.chat_restrictions;
CREATE POLICY "chat_restrictions_select_all" ON public.chat_restrictions FOR SELECT USING (true);

DROP POLICY IF EXISTS "chat_restrictions_all" ON public.chat_restrictions;
CREATE POLICY "chat_restrictions_all" ON public.chat_restrictions FOR ALL USING (true);

-- 5. Inserir configuração padrão do chat caso não exista
INSERT INTO public.chat_settings (
  id, is_chat_enabled, admin_online, manual_override, slow_mode_seconds, pinned_message, welcome_message
)
VALUES (
  'chat_global_settings',
  true,
  false,
  'auto',
  0,
  '🚀 Apresentações do projeto de Segunda a Sexta às 20h na nossa sala do Google Meet!',
  'Olá! Seja bem-vindo ao bate-papo oficial da Infinity Copy. Converse com os membros ou envie uma mensagem no privado do administrador.'
)
ON CONFLICT (id) DO NOTHING;
