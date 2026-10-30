-- ====================================================================
-- TABELA DE PARTICIPANTES ATIVOS DO CHAT (TEMPO REAL & IDENTIFICAÇÃO)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.chat_participants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  role TEXT NOT NULL DEFAULT 'visitor',
  is_online BOOLEAN NOT NULL DEFAULT true,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_chat_participants_last_seen ON public.chat_participants(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_role ON public.chat_participants(role);

ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_participants_read_all" ON public.chat_participants;
CREATE POLICY "chat_participants_read_all" ON public.chat_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "chat_participants_insert_all" ON public.chat_participants;
CREATE POLICY "chat_participants_insert_all" ON public.chat_participants FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "chat_participants_update_all" ON public.chat_participants;
CREATE POLICY "chat_participants_update_all" ON public.chat_participants FOR UPDATE USING (true);

DROP POLICY IF EXISTS "chat_participants_delete_all" ON public.chat_participants;
CREATE POLICY "chat_participants_delete_all" ON public.chat_participants FOR DELETE USING (true);
