-- ====================================================================
-- 02_STORAGE.SQL - CONFIGURAÇÃO DO BUCKET DE FOTOS DE PERFIL
-- ====================================================================

-- 1. Criação do bucket público 'avatars' para fotos de perfil dos usuários
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB em bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- 2. Políticas de segurança do Storage

-- Visualização pública de avatares (qualquer visitante pode ver a foto na landing page)
CREATE POLICY "Public avatars are accessible by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Usuários autenticados podem fazer upload apenas na sua própria pasta: avatars/{user_id}/*
CREATE POLICY "Users can upload their own profile avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Usuários podem atualizar/sobrescrever seus próprios avatares
CREATE POLICY "Users can update their own profile avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Usuários podem excluir seu próprio avatar
CREATE POLICY "Users can delete their own profile avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
