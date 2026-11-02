-- ====================================================================
-- HABILITAR EXCLUSÃO PERMANENTE DE USUÁRIOS E DADOS NO SUPABASE
-- Execute este script no SQL Editor do Supabase para garantir que
-- o Super Admin possa apagar registros diretamente nas tabelas
-- ====================================================================

-- 1. Permissão de exclusão para perfis
DROP POLICY IF EXISTS "profiles_delete_all" ON public.profiles;
CREATE POLICY "profiles_delete_all" ON public.profiles FOR DELETE USING (true);

-- 2. Permissão de exclusão para configurações de landing page
DROP POLICY IF EXISTS "settings_delete_all" ON public.user_landing_settings;
CREATE POLICY "settings_delete_all" ON public.user_landing_settings FOR DELETE USING (true);

-- 3. Permissão de exclusão para eventos de métricas
DROP POLICY IF EXISTS "events_delete_all" ON public.landing_events;
CREATE POLICY "events_delete_all" ON public.landing_events FOR DELETE USING (true);
