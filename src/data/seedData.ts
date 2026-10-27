import { UserProfile, UserLandingSettings, LandingPageVersion, LandingEvent, AdminAuditLog } from '@/types';
import { initialLandingPageContent } from './defaultLandingPage';

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

// Aliased for backwards compatibility in existing references
export const seedAdminUser: UserProfile = seedRangelUser;

export const seedJorgeUser: UserProfile = {
  id: 'user-jorge-0001',
  name: 'Jorge Carvalho',
  email: 'jorgecarvalho@gmail.com',
  role: 'user',
  status: 'active',
  slug: 'jorge-carvalho',
  created_at: '2026-02-01T10:00:00Z',
  updated_at: '2026-02-01T10:00:00Z',
};

// Registered production users
export const seedUsers: UserProfile[] = [
  seedRangelUser,
  seedJorgeUser,
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
  'user-jorge-0001': {
    id: 'set-jorge-0001',
    user_id: 'user-jorge-0001',
    profile_image_url: '',
    registration_url: 'https://meet.google.com/meet/qng-voma-xqm',
    whatsapp_country_code: '+55',
    whatsapp_number: '',
    whatsapp_message: 'Olá Jorge! Acessei sua página exclusiva e quero saber mais sobre a Infinity Copy.',
    updated_at: '2026-02-01T10:00:00Z',
  },
};

export const seedVersions: LandingPageVersion[] = [
  {
    id: 'ver-uuid-0001',
    version_number: 1,
    content_json: initialLandingPageContent,
    status: 'published',
    created_by: 'user-rangel-0001',
    created_at: '2026-02-01T12:00:00Z',
    published_at: '2026-02-01T12:00:00Z',
  },
];

// Clean events ready for real production activity
export const seedEvents: LandingEvent[] = [];

export const seedAuditLogs: AdminAuditLog[] = [
  {
    id: 'log-1',
    admin_id: 'user-rangel-0001',
    action: 'PUBLISH_LANDING_PAGE',
    target_type: 'landing_page_version',
    target_id: 'ver-uuid-0001',
    details: { version_number: 1, note: 'Landing Page Master oficial inicializada para produção.' },
    created_at: '2026-02-01T12:00:00Z',
  },
];
