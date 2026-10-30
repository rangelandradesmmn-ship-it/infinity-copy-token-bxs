-- ====================================================================
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
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE IF EXISTS public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE IF EXISTS public.user_landing_settings ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE IF EXISTS public.landing_page_versions ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE IF EXISTS public.landing_events ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE IF EXISTS public.admin_audit_logs ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

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

DROP POLICY IF EXISTS "versions_delete_all" ON public.landing_page_versions;
CREATE POLICY "versions_delete_all" ON public.landing_page_versions FOR DELETE USING (true);

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
-- 6. TABELAS DE CHAT AO VIVO & MODERAÇÃO
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

-- Permissões RLS para Chat
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

INSERT INTO public.landing_page_versions (
  id, version_number, status, published_at, content_json
)
VALUES (
  'ver-uuid-0001',
  1,
  'published',
  now(),
  '{"brand":{"name":"Infinity Copy - Token BXS","logoUrl":"/logo.png","primaryColor":"#2563eb","accentColor":"#c5cecb","darkTheme":false,"fontFamily":"Inter","headingFontFamily":"Inter"},"hero":{"enabled":true,"badge":"🚀 Automação de operações de Futuros de Cripto","title":"Transforme Seus Resultados com a Melhor Tecnologia de","titleHighlight":"Automação de Operações de Futuro de Cripto","titleSize":"md","titleMaxWidth":"4xl","subtitle":"Descubra o ecossistema da Infinity Copy. Treinamentos de ponta, suporte humanizado e uma estrutura pronta para você alavancar sua jornada hoje mesmo.","showConsultantCard":true,"primaryCtaText":"Fazer Meu Cadastro Gratuito","secondaryCtaText":"Falar Comigo no WhatsApp","mainVideo":{"id":"hero-video-1","title":"Apresentação Oficial do Ecossistema","description":"Entenda em menos de 3 minutos como nossa infraestrutura funciona.","url":"https://youtu.be/4JYv1tHyUG4?si=pCQt1hKxWwY1s1UB","aspectRatio":"16:9","badge":"Assista ao Vídeo Oficial"}},"videosSection":{"enabled":true,"title":"Tutoriais & Apresentação","subtitle":"Saiba tudo sobre a Infinity Copy com nossos videos.","videos":[{"id":"vid-demo-1","title":"Apresentação resumida da Infinity Copy","description":"Tour guiado por todas as funcionalidades disponíveis na área do membro.","url":"https://youtu.be/4JYv1tHyUG4?si=pCQt1hKxWwY1s1UB","aspectRatio":"16:9","badge":"Tour Completo"},{"id":"vid-demo-2","title":"Trader Diego falando da automação e sustentabilidade","description":"Feedback direto em formato vertical (Reels/Shorts).","url":"https://youtu.be/Je3dmYucxms?si=_4ZC8ehtOZxaO6p9","aspectRatio":"16:9","badge":"Shorts 9:16"}]},"benefitsSection":{"enabled":true,"title":"Por Que Investir na Infinity Copy é um excelente negócio?","subtitle":"Segurança, estabilidade, longevidade, lucratividade, network, Garantia BXS.","items":[{"id":"b-1","icon":"Zap","title":"Velocidade e Praticidade","description":"Tudo pronto e configurado. Em menos de 5 minutos você já tem acesso ao painel e às ferramentas."},{"id":"b-2","icon":"ShieldCheck","title":"100% Seguro e Confiável","description":"Protocolos de segurança modernos, proteção de dados conforme a LGPD e estabilidade comprovada."},{"id":"b-3","icon":"TrendingUp","title":"Escalabilidade Ilimitada","description":"Compartilhe sua página com centenas ou milhares de contatos sem perda de desempenho."},{"id":"b-4","icon":"Users","title":"Comunidade Ativa","description":"Troca diária de experiências com outros membros, mentorias semanais e materiais atualizados."},{"id":"b-5","icon":"Award","title":"Metodologia Validada","description":"Passo a passo testado no campo de batalha para você não perder tempo com tentativa e erro."},{"id":"b-6","icon":"Headphones","title":"Suporte Direto e Humanizado","description":"Canal exclusivo no WhatsApp com seu parceiro credenciado para esclarecer qualquer dúvida."}]},"consultantSection":{"enabled":true,"title":"Você Não Está Sozinho(a)","subtitle":"Conheça o parceiro autorizado responsável pelo seu atendimento personalizado.","consultantLabel":"Seu Parceiro Credenciado Oficial","customDescription":"Estou à disposição para guiar você em cada etapa, explicar todas as oportunidades da plataforma e garantir que você aproveite o melhor suporte desde o seu primeiro dia."},"testimonialsSection":{"enabled":true,"title":"O Que Nossos Membros Dizem","subtitle":"Resultados e histórias reais de quem confiou na metodologia e transformou sua realidade.","items":[{"id":"t-1","name":"Camila Ferreira","role":"Empreendedora Digital","avatarUrl":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80","quote":"Estou muito satisfeita com meus resultados na Infinity Copy, minha equipe está crescendo acelerada e todos estão super satisfeitos e motivados.","rating":5},{"id":"t-2","name":"Rodrigo Albuquerque","role":"Consultor de Negócios","avatarUrl":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80","quote":"o melhor de tudo está sendo a liberdade que tenho para trabalhar enquanto meu capital está sendo operado automaticamente.","rating":5},{"id":"t-3","name":"Fernanda Lima","role":"Líder de Expansão","avatarUrl":"https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80","quote":"o sistema de ganhos em rede é simplesmente fantástico, binário, residual , coisa de outro mundo, vida longa a Infinity Copy. ","rating":5}]},"faqSection":{"enabled":true,"title":"Perguntas Frequentes","subtitle":"Tire suas principais dúvidas sobre o funcionamento da plataforma.","items":[{"id":"faq-1","question":"O cadastro inicial tem algum custo?","answer":"O acesso e o cadastro inicial são totalmente gratuitos. Você pode criar sua conta, conhecer o painel e avaliar todas as opções sem nenhum compromisso financeiro imediato."},{"id":"faq-2","question":"Qual o Investimento mínimo?","answer":"Você pode iniciar a partir de 10 dólares em USDT ou PIX"},{"id":"faq-3","question":"Qual o mínimo de saque e qual a taxa?","answer":"saque mínimo de $1.00 e taxa de 10%, porem essa taxa é devolvida 100% em BXS, o token de utilidade da Infinity Copy."},{"id":"faq-4","question":"Sou Obrigado a convidar pessoas para ter ganhos na empresa?","answer":"Absolutamente NÃO! sem indicar novos membros, você ganha até 3 tipos de renda com a Infinity Copy: rentabilidade de até 2% ao dia útil ( contrato de 200% ), ganhos ilimitados pelo copytrader usando a automação exclusiva para membros ativos, valorização do token BXS estocados em sua carteira."},{"id":"faq-5","question":"Como falar com meu consultor se eu tiver dúvidas?","answer":"Basta clicar no botão de WhatsApp disponível nesta página. Você será direcionado diretamente para uma conversa privada com o seu parceiro credenciado."}]},"tokenSection":{"enabled":true,"badge":"Gráfico em Tempo Real","title":"Acompanhe a Cotação do Token BXS","subtitle":"Monitoramento ao vivo de preço, liquidez e negociações descentralizadas na rede Binance Smart Chain (BSC).","tokenSymbol":"BXS","tokenName":"BXSignals Token","network":"BNB Smart Chain (BEP-20)","contractAddress":"0xadcea94f46ce8a87b890d7da9a444b4a21811a76","copyButtonText":"copie o contrato da BXS","chartProvider":"geckoterminal","embedUrl":"https://www.geckoterminal.com/bsc/pools/0xd4ad1ce50f942f2f036f1f759ff3eb785d77a7a2e71db52849a37ad28e4295ab?embed=1&info=0&swaps=0&grayscale=0&light_chart=0","coinMarketCapUrl":"https://dex.coinmarketcap.com/token/bsc/0xadcea94f46ce8a87b890d7da9a444b4a21811a76/","bscScanUrl":"https://bscscan.com/token/0xadcea94f46ce8a87b890d7da9a444b4a21811a76"},"ctaBanner":{"enabled":true,"title":"Comece Sua Mudança Hoje","subtitle":"Cadastre-se gratuitamente em menos de 2 minutos ou tire todas as suas dúvidas diretamente com seu consultor no WhatsApp.","ctaText":"Criar Minha Conta Gratuita Agora","whatsappCtaText":"Chamar no WhatsApp","urgencyBadge":"⚡ Acesso Imediato Liberado"},"footer":{"companyName":"Infinity Copy - Token BXS","cnpj":"","legalText":"Todos os direitos reservados. Este site respeita rigorosamente a privacidade dos visitantes nos termos da Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018). As informações e depoimentos apresentados refletem experiências individuais e não garantem resultados idênticos.","privacyLink":"#privacidade","termsLink":"#termos"},"defaultSettings":{"registrationUrl":"https://meet.google.com/meet/qng-voma-xqm","whatsappCountryCode":"+55","whatsappNumber":"22997953907","whatsappMessage":"Olá! Acessei a página oficial e gostaria de falar com o suporte."}}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
