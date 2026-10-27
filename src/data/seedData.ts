import { UserProfile, UserLandingSettings, LandingPageVersion, LandingEvent, AdminAuditLog } from '@/types';
import { initialLandingPageContent } from './defaultLandingPage';

export const seedAdminUser: UserProfile = {
  id: 'admin-uuid-0001',
  name: 'Super Administrador',
  email: 'admin@saas.com',
  role: 'admin',
  status: 'active',
  slug: 'admin',
  created_at: '2026-01-01T10:00:00Z',
  updated_at: '2026-01-01T10:00:00Z',
};

export const seedRangelUser: UserProfile = {
  id: 'user-rangel-0001',
  name: 'Rangel Andrade',
  email: 'rangelandradesmmn@gmail.com',
  role: 'admin',
  status: 'active',
  slug: 'cadastro',
  created_at: '2026-02-01T10:00:00Z',
  updated_at: '2026-02-01T10:00:00Z',
};

export const seedUsers: UserProfile[] = [
  seedRangelUser,
  seedAdminUser,
  {
    id: 'user-uuid-0001',
    name: 'João Silva',
    email: 'joao@parceiro.com',
    role: 'user',
    status: 'active',
    slug: 'joao',
    created_at: '2026-02-10T14:30:00Z',
    updated_at: '2026-02-15T09:00:00Z',
  },
  {
    id: 'user-uuid-0002',
    name: 'Maria Santos',
    email: 'maria@parceiro.com',
    role: 'user',
    status: 'active',
    slug: 'maria',
    created_at: '2026-02-18T11:20:00Z',
    updated_at: '2026-02-20T16:45:00Z',
  },
  {
    id: 'user-uuid-0003',
    name: 'Carlos Mendes',
    email: 'carlos@parceiro.com',
    role: 'user',
    status: 'blocked', // Used to test blocked accounts
    slug: 'carlos',
    created_at: '2026-03-01T08:00:00Z',
    updated_at: '2026-03-05T12:00:00Z',
  },
];

export const seedUserSettings: Record<string, UserLandingSettings> = {
  'user-rangel-0001': {
    id: 'set-rangel-0001',
    user_id: 'user-rangel-0001',
    profile_image_url: '/logo.png',
    registration_url: 'https://meet.google.com/meet/qng-voma-xqm',
    whatsapp_country_code: '+55',
    whatsapp_number: '22997953907',
    whatsapp_message: 'Olá Rangel! Acessei sua página exclusiva e quero tirar dúvidas sobre a Infinity Copy.',
    updated_at: '2026-02-01T10:00:00Z',
  },
  'user-uuid-0001': {
    id: 'set-uuid-0001',
    user_id: 'user-uuid-0001',
    profile_image_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    registration_url: 'https://cadastro.parceiro.com/ref/joao123',
    whatsapp_country_code: '+55',
    whatsapp_number: '11999991111',
    whatsapp_message: 'Olá João! Acessei sua página exclusiva e quero tirar dúvidas sobre o cadastro.',
    updated_at: '2026-02-15T09:00:00Z',
  },
  'user-uuid-0002': {
    id: 'set-uuid-0002',
    user_id: 'user-uuid-0002',
    profile_image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    registration_url: 'https://cadastro.parceiro.com/ref/maria456',
    whatsapp_country_code: '+55',
    whatsapp_number: '21988882222',
    whatsapp_message: 'Olá Maria! Vi sua página e gostaria de suporte para iniciar.',
    updated_at: '2026-02-20T16:45:00Z',
  },
  'user-uuid-0003': {
    id: 'set-uuid-0003',
    user_id: 'user-uuid-0003',
    profile_image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    registration_url: 'https://cadastro.parceiro.com/ref/carlos789',
    whatsapp_country_code: '+55',
    whatsapp_number: '31977773333',
    whatsapp_message: 'Olá Carlos! Quero falar sobre a plataforma.',
    updated_at: '2026-03-05T12:00:00Z',
  },
};

export const seedVersions: LandingPageVersion[] = [
  {
    id: 'ver-uuid-0001',
    version_number: 1,
    content_json: initialLandingPageContent,
    status: 'published',
    created_by: 'admin-uuid-0001',
    created_at: '2026-02-01T12:00:00Z',
    published_at: '2026-02-01T12:00:00Z',
  },
];

export const seedEvents: LandingEvent[] = [
  // João events
  { id: 'evt-1', user_id: 'user-uuid-0001', event_type: 'page_view', page_path: '/p/joao', created_at: '2026-02-16T10:00:00Z' },
  { id: 'evt-2', user_id: 'user-uuid-0001', event_type: 'page_view', page_path: '/p/joao', created_at: '2026-02-16T11:15:00Z' },
  { id: 'evt-3', user_id: 'user-uuid-0001', event_type: 'registration_click', page_path: '/p/joao', created_at: '2026-02-16T11:20:00Z' },
  { id: 'evt-4', user_id: 'user-uuid-0001', event_type: 'page_view', page_path: '/p/joao', created_at: '2026-02-17T09:40:00Z' },
  { id: 'evt-5', user_id: 'user-uuid-0001', event_type: 'whatsapp_click', page_path: '/p/joao', created_at: '2026-02-17T09:45:00Z' },
  { id: 'evt-6', user_id: 'user-uuid-0001', event_type: 'page_view', page_path: '/p/joao', created_at: '2026-02-18T14:10:00Z' },
  { id: 'evt-7', user_id: 'user-uuid-0001', event_type: 'registration_click', page_path: '/p/joao', created_at: '2026-02-18T14:15:00Z' },
  // Maria events
  { id: 'evt-8', user_id: 'user-uuid-0002', event_type: 'page_view', page_path: '/p/maria', created_at: '2026-02-21T08:00:00Z' },
  { id: 'evt-9', user_id: 'user-uuid-0002', event_type: 'page_view', page_path: '/p/maria', created_at: '2026-02-21T09:30:00Z' },
  { id: 'evt-10', user_id: 'user-uuid-0002', event_type: 'whatsapp_click', page_path: '/p/maria', created_at: '2026-02-21T09:35:00Z' },
  { id: 'evt-11', user_id: 'user-uuid-0002', event_type: 'page_view', page_path: '/p/maria', created_at: '2026-02-22T15:00:00Z' },
  { id: 'evt-12', user_id: 'user-uuid-0002', event_type: 'registration_click', page_path: '/p/maria', created_at: '2026-02-22T15:10:00Z' },
  // Master page events
  { id: 'evt-13', user_id: null, event_type: 'page_view', page_path: '/', created_at: '2026-02-23T10:00:00Z' },
  { id: 'evt-14', user_id: null, event_type: 'registration_click', page_path: '/', created_at: '2026-02-23T10:05:00Z' },
];

export const seedAuditLogs: AdminAuditLog[] = [
  {
    id: 'log-1',
    admin_id: 'admin-uuid-0001',
    action: 'PUBLISH_LANDING_PAGE',
    target_type: 'landing_page_version',
    target_id: 'ver-uuid-0001',
    details: { version_number: 1, note: 'Primeira versão oficial da Landing Page Master publicada.' },
    created_at: '2026-02-01T12:00:00Z',
  },
  {
    id: 'log-2',
    admin_id: 'admin-uuid-0001',
    action: 'BLOCK_USER',
    target_type: 'profile',
    target_id: 'user-uuid-0003',
    details: { user_name: 'Carlos Mendes', reason: 'Suspeita de atividade irregular' },
    created_at: '2026-03-05T12:00:00Z',
  },
];
