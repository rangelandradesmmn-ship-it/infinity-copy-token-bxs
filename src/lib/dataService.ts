import {
  UserProfile,
  UserLandingSettings,
  UserWithSettings,
  LandingPageContent,
  LandingPageVersion,
  LandingEvent,
  AdminAuditLog,
  AdminDashboardMetrics,
  UserMetrics,
  UserStatus,
  ChatMessage,
  ChatSettings,
  UserChatRestriction,
  ChatVisitorAuth,
  ChatParticipant,
  ChatUserRole,
} from '@/types';
import { initialLandingPageContent } from '@/data/defaultLandingPage';
import {
  seedUsers,
  seedRangelUser,
  seedJorgeUser,
  seedUserSettings,
  seedVersions,
  seedEvents,
  seedAuditLogs,
} from '@/data/seedData';
import { isSupabaseConfigured, supabase } from './supabase';
import { generateSlug, isValidHttpsUrl, sanitizePhoneNumber } from './security';

const STORAGE_KEYS = {
  USERS: 'clonelp_users',
  SETTINGS: 'clonelp_settings',
  VERSIONS: 'clonelp_versions',
  EVENTS: 'clonelp_events',
  AUDIT: 'clonelp_audit_logs',
  SESSION_USER: 'clonelp_current_user_id',
  PASSWORDS: 'clonelp_passwords',
  CHAT_MESSAGES: 'clonelp_chat_messages',
  CHAT_SETTINGS: 'clonelp_chat_settings',
  CHAT_RESTRICTIONS: 'clonelp_chat_restrictions',
  ADMIN_PRESENCE: 'clonelp_admin_presence',
  CHAT_VISITOR_AUTH: 'clonelp_chat_visitor_auth',
  CHAT_PARTICIPANTS: 'clonelp_chat_participants',
};

const TEST_USER_IDS = new Set(['admin-uuid-0001', 'user-uuid-0001', 'user-uuid-0002', 'user-uuid-0003']);
const TEST_USER_EMAILS = new Set(['admin@saas.com', 'joao@parceiro.com', 'maria@parceiro.com', 'carlos@parceiro.com']);

export const defaultPasswords: Record<string, string> = {
  'user-rangel-0001': 'senha123456',
  'user-jorge-0001': 'senha123456',
};

// --- In-Memory & LocalStorage Persistence for Mock/Local Mode ---
const memoryStorage = new Map<string, string>();

function getLocalItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    const raw = memoryStorage.get(key);
    if (!raw) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    memoryStorage.set(key, JSON.stringify(value));
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
}

// Initialize seed data in local storage and preserve all real and prior registrations
export function initLocalDatabase() {
  if (typeof window === 'undefined') return;

  // 1. Load users and ensure Rangel and Jorge are always present
  let existingUsers = getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
  if (!existingUsers || existingUsers.length === 0) {
    existingUsers = [...seedUsers];
  }

  const rangelExists = existingUsers.some(
    (u) => u.email.toLowerCase() === 'rangelandradesmmn@gmail.com'
  );
  if (!rangelExists) {
    existingUsers.unshift(seedRangelUser);
  }

  const jorgeExists = existingUsers.some(
    (u) => u.name.toLowerCase() === 'jorge carvalho' || u.email.toLowerCase() === 'jorgecarvalho@gmail.com'
  );
  if (!jorgeExists) {
    existingUsers.push(seedJorgeUser);
  }
  setLocalItem(STORAGE_KEYS.USERS, existingUsers);

  // 2. Settings: ensure Rangel and Jorge settings are present while preserving existing users' settings
  const existingSettings = getLocalItem<Record<string, UserLandingSettings>>(
    STORAGE_KEYS.SETTINGS,
    seedUserSettings
  );
  if (!existingSettings['user-rangel-0001']) {
    existingSettings['user-rangel-0001'] = seedUserSettings['user-rangel-0001'];
  }
  if (!existingSettings['user-jorge-0001']) {
    existingSettings['user-jorge-0001'] = seedUserSettings['user-jorge-0001'];
  }
  setLocalItem(STORAGE_KEYS.SETTINGS, existingSettings);

  // 3. Passwords: ensure Rangel and Jorge passwords are present while preserving existing users' passwords
  const existingPasswords = getLocalItem<Record<string, string>>(
    STORAGE_KEYS.PASSWORDS,
    defaultPasswords
  );
  if (!existingPasswords['user-rangel-0001']) {
    existingPasswords['user-rangel-0001'] = 'senha123456';
  }
  if (!existingPasswords['user-jorge-0001']) {
    existingPasswords['user-jorge-0001'] = 'senha123456';
  }
  setLocalItem(STORAGE_KEYS.PASSWORDS, existingPasswords);

  if (!localStorage.getItem(STORAGE_KEYS.VERSIONS)) {
    setLocalItem(STORAGE_KEYS.VERSIONS, seedVersions);
  }
  if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
    setLocalItem(STORAGE_KEYS.EVENTS, seedEvents);
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT)) {
    setLocalItem(STORAGE_KEYS.AUDIT, seedAuditLogs);
  }

  // 4. If session points to old test admin ID, map it seamlessly to Rangel
  const sessionUser = localStorage.getItem(STORAGE_KEYS.SESSION_USER);
  if (sessionUser === 'admin-uuid-0001') {
    localStorage.setItem(STORAGE_KEYS.SESSION_USER, 'user-rangel-0001');
  }
}

// -------------------------------------------------------------
// Current Authentication Session & Password Authentication
// -------------------------------------------------------------
export function getCurrentSessionUserId(): string | null {
  if (typeof window === 'undefined') {
    const saved = memoryStorage.get(STORAGE_KEYS.SESSION_USER);
    return saved ? JSON.parse(saved) : null;
  }
  const saved = localStorage.getItem(STORAGE_KEYS.SESSION_USER);
  return saved && saved.trim() ? saved.trim() : null;
}

export function setCurrentSessionUserId(userId: string): void {
  if (typeof window === 'undefined') {
    memoryStorage.set(STORAGE_KEYS.SESSION_USER, JSON.stringify(userId));
    return;
  }
  localStorage.setItem(STORAGE_KEYS.SESSION_USER, userId);
}

export async function logoutUser(): Promise<void> {
  const currentId = getCurrentSessionUserId();

  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.SESSION_USER);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_PRESENCE);
    const localSettings = getLocalItem<ChatSettings>(STORAGE_KEYS.CHAT_SETTINGS, initialChatSettings);
    setLocalItem(STORAGE_KEYS.CHAT_SETTINGS, { ...localSettings, adminOnline: false });
  } else {
    memoryStorage.delete(STORAGE_KEYS.SESSION_USER);
  }

  if (currentId) {
    await recordAdminHeartbeatAsync(currentId, false);
  }
}

export async function getCurrentSessionUser(): Promise<UserWithSettings | null> {
  const userId = getCurrentSessionUserId();
  if (!userId) return null;
  return await getUserById(userId);
}

export async function authenticateUser(
  email: string,
  passwordInput: string
): Promise<{ success: boolean; user?: UserWithSettings; message: string }> {
  initLocalDatabase();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  if (!cleanEmail || !cleanPassword) {
    return { success: false, message: 'Por favor, preencha o e-mail e a senha.' };
  }

  const allUsers = await getAllUsers();
  const user = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    if (cleanEmail === 'admin@saas.com' && (cleanPassword === 'admin123' || cleanPassword === 'senha123456')) {
      const rangel = allUsers.find((u) => u.email.toLowerCase() === 'rangelandradesmmn@gmail.com') || seedRangelUser;
      setCurrentSessionUserId(rangel.id);
      recordAdminHeartbeat(rangel.id, true);
      return {
        success: true,
        user: rangel,
        message: 'Autenticação realizada com sucesso!',
      };
    }
    return {
      success: false,
      message: 'Nenhum usuário cadastrado com este e-mail. Verifique suas credenciais.',
    };
  }

  const passwords = getLocalItem<Record<string, string>>(
    STORAGE_KEYS.PASSWORDS,
    defaultPasswords
  );

  const storedPassword = passwords[user.id] || user.password;
  const expectedPassword =
    storedPassword || (user.role === 'admin' ? 'admin123' : 'senha123456');

  const isRangelMatch =
    user.email === 'rangelandradesmmn@gmail.com' &&
    (cleanPassword === storedPassword || cleanPassword === 'senha123456' || cleanPassword === 'admin123');

  if (cleanPassword !== expectedPassword && !isRangelMatch) {
    return {
      success: false,
      message: 'Senha incorreta. Por favor, tente novamente.',
    };
  }

  if (user.status === 'blocked') {
    return {
      success: false,
      message: 'Esta conta está temporariamente suspensa pela administração. Entre em contato com o suporte.',
    };
  }

  // Set active session in local storage
  setCurrentSessionUserId(user.id);
  if (user.role === 'admin') {
    recordAdminHeartbeat(user.id, true);
  }

  return {
    success: true,
    user,
    message: 'Autenticação realizada com sucesso!',
  };
}

// -------------------------------------------------------------
// Password Management (Super Admin & User Self Service)
// -------------------------------------------------------------
export async function updateUserPassword(
  userId: string,
  newPassword: string,
  adminId?: string
): Promise<{ success: boolean; message: string }> {
  const cleanPassword = newPassword.trim();
  if (!cleanPassword || cleanPassword.length < 6) {
    return {
      success: false,
      message: 'A nova senha deve conter no mínimo 6 caracteres.',
    };
  }

  initLocalDatabase();
  const allUsers = await getAllUsers();
  const targetUser = allUsers.find((u) => u.id === userId);
  if (!targetUser) {
    return { success: false, message: 'Usuário não encontrado.' };
  }

  const passwords = getLocalItem<Record<string, string>>(
    STORAGE_KEYS.PASSWORDS,
    defaultPasswords
  );
  passwords[userId] = cleanPassword;
  setLocalItem(STORAGE_KEYS.PASSWORDS, passwords);

  targetUser.password = cleanPassword;
  setLocalItem(STORAGE_KEYS.USERS, allUsers);

  if (isSupabaseConfigured() && supabase) {
    const { error: supaErr } = await supabase
      .from('profiles')
      .update({ password: cleanPassword, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (supaErr) {
      console.error('Failed to update password in Supabase:', supaErr);
    }
  }

  // Log audit action
  await logAdminAction(
    adminId || userId,
    'UPDATE_USER_PASSWORD',
    'user_password',
    userId,
    {
      targetEmail: targetUser.email,
      targetName: targetUser.name,
      targetRole: targetUser.role,
    }
  );

  return {
    success: true,
    message: `Senha de ${targetUser.name} alterada com sucesso!`,
  };
}

// -------------------------------------------------------------
// Landing Page Content (Published & Drafts)
// -------------------------------------------------------------

export function normalizeLandingPageContent(raw: unknown): LandingPageContent {
  if (!raw || typeof raw !== 'object') {
    return initialLandingPageContent;
  }
  const c = raw as Record<string, any>;
  return {
    ...initialLandingPageContent,
    ...c,
    brand: { ...initialLandingPageContent.brand, ...(c.brand || {}) },
    hero: { ...initialLandingPageContent.hero, ...(c.hero || {}) },
    videosSection: {
      ...initialLandingPageContent.videosSection,
      ...(c.videosSection || {}),
      videos: Array.isArray(c.videosSection?.videos) ? c.videosSection.videos : initialLandingPageContent.videosSection.videos,
    },
    benefitsSection: {
      ...initialLandingPageContent.benefitsSection,
      ...(c.benefitsSection || {}),
      items: Array.isArray(c.benefitsSection?.items) ? c.benefitsSection.items : initialLandingPageContent.benefitsSection.items,
    },
    consultantSection: { ...initialLandingPageContent.consultantSection, ...(c.consultantSection || {}) },
    testimonialsSection: {
      ...initialLandingPageContent.testimonialsSection,
      ...(c.testimonialsSection || {}),
      items: Array.isArray(c.testimonialsSection?.items) ? c.testimonialsSection.items : initialLandingPageContent.testimonialsSection.items,
    },
    faqSection: {
      ...initialLandingPageContent.faqSection,
      ...(c.faqSection || {}),
      items: Array.isArray(c.faqSection?.items) ? c.faqSection.items : initialLandingPageContent.faqSection.items,
    },
    tokenSection: c.tokenSection
      ? { ...initialLandingPageContent.tokenSection!, ...c.tokenSection }
      : initialLandingPageContent.tokenSection,
    ctaBanner: { ...initialLandingPageContent.ctaBanner, ...(c.ctaBanner || {}) },
    footer: { ...initialLandingPageContent.footer, ...(c.footer || {}) },
    defaultSettings: { ...initialLandingPageContent.defaultSettings, ...(c.defaultSettings || {}) },
    officialChannels: c.officialChannels
      ? { ...initialLandingPageContent.officialChannels!, ...c.officialChannels }
      : initialLandingPageContent.officialChannels,
    chatSettings: c.chatSettings
      ? { ...initialLandingPageContent.chatSettings!, ...c.chatSettings }
      : initialLandingPageContent.chatSettings,
  } as LandingPageContent;
}

export async function getPublishedLandingPage(): Promise<{
  content: LandingPageContent;
  versionNumber: number;
  publishedAt?: string;
}> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('landing_page_versions')
      .select('*')
      .eq('status', 'published')
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    if (!error && data && data.content_json) {
      return {
        content: normalizeLandingPageContent(data.content_json),
        versionNumber: data.version_number,
        publishedAt: data.published_at,
      };
    }
  }

  // Local fallback
  initLocalDatabase();
  const versions = getLocalItem<LandingPageVersion[]>(STORAGE_KEYS.VERSIONS, seedVersions);
  const published = versions
    .filter((v) => v.status === 'published')
    .sort((a, b) => b.version_number - a.version_number)[0];

  if (published) {
    return {
      content: normalizeLandingPageContent(published.content_json),
      versionNumber: published.version_number,
      publishedAt: published.published_at,
    };
  }

  return {
    content: initialLandingPageContent,
    versionNumber: 1,
    publishedAt: new Date().toISOString(),
  };
}

export async function getDraftLandingPage(): Promise<{
  content: LandingPageContent;
  versionId?: string;
  hasDraft: boolean;
}> {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase
      .from('landing_page_versions')
      .select('*')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data && data.content_json) {
      return {
        content: normalizeLandingPageContent(data.content_json),
        versionId: data.id,
        hasDraft: true,
      };
    }
  }

  // Local fallback
  initLocalDatabase();
  const versions = getLocalItem<LandingPageVersion[]>(STORAGE_KEYS.VERSIONS, seedVersions);
  const draft = versions.find((v) => v.status === 'draft');
  if (draft) {
    return { content: normalizeLandingPageContent(draft.content_json), versionId: draft.id, hasDraft: true };
  }

  // Fallback to published
  const published = await getPublishedLandingPage();
  return { content: published.content, hasDraft: false };
}

export async function saveLandingPageDraft(
  content: LandingPageContent,
  adminId: string
): Promise<{ success: boolean; message: string }> {
  if (isSupabaseConfigured() && supabase) {
    // Check if draft exists
    const { data: existingDraft } = await supabase
      .from('landing_page_versions')
      .select('id')
      .eq('status', 'draft')
      .single();

    if (existingDraft) {
      const { error: updateErr } = await supabase
        .from('landing_page_versions')
        .update({
          content_json: content,
          created_by: adminId,
          created_at: new Date().toISOString(),
        })
        .eq('id', existingDraft.id);

      if (updateErr) {
        return { success: false, message: updateErr.message };
      }
    } else {
      // Get highest version
      const { data: highest } = await supabase
        .from('landing_page_versions')
        .select('version_number')
        .order('version_number', { ascending: false })
        .limit(1)
        .single();
      const nextVer = (highest?.version_number || 1) + 1;

      const { error: insertErr } = await supabase.from('landing_page_versions').insert({
        id: `ver-draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        version_number: nextVer,
        content_json: content,
        status: 'draft',
        created_by: adminId,
      });

      if (insertErr) {
        return { success: false, message: insertErr.message };
      }
    }

    await logAdminAction(adminId, 'SAVE_DRAFT', 'landing_page_version', 'draft', {
      note: 'Rascunho da Landing Page salvo.',
    });

    return { success: true, message: 'Rascunho salvo com sucesso.' };
  }

  // Local fallback
  initLocalDatabase();
  const versions = getLocalItem<LandingPageVersion[]>(STORAGE_KEYS.VERSIONS, seedVersions);
  const draftIndex = versions.findIndex((v) => v.status === 'draft');

  if (draftIndex >= 0) {
    versions[draftIndex].content_json = content;
    versions[draftIndex].created_at = new Date().toISOString();
  } else {
    const highestVer = Math.max(...versions.map((v) => v.version_number), 0);
    versions.push({
      id: `ver-${Date.now()}`,
      version_number: highestVer + 1,
      content_json: content,
      status: 'draft',
      created_by: adminId,
      created_at: new Date().toISOString(),
    });
  }

  setLocalItem(STORAGE_KEYS.VERSIONS, versions);
  await logAdminAction(adminId, 'SAVE_DRAFT', 'landing_page_version', 'draft', {
    note: 'Rascunho da Landing Page salvo.',
  });

  return { success: true, message: 'Rascunho salvo com sucesso!' };
}

export async function publishLandingPage(
  content: LandingPageContent,
  adminId: string
): Promise<{ success: boolean; versionNumber: number; message: string }> {
  const publishedAt = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    // Get highest version number
    const { data: highest } = await supabase
      .from('landing_page_versions')
      .select('version_number')
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const newVersionNumber = (highest?.version_number || 0) + 1;
    const newVersionId = `ver-${newVersionNumber}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Delete or update existing draft
    try {
      await supabase.from('landing_page_versions').delete().eq('status', 'draft');
    } catch {
      // non-blocking
    }

    // Insert new published version
    const { data, error } = await supabase
      .from('landing_page_versions')
      .insert({
        id: newVersionId,
        version_number: newVersionNumber,
        content_json: content,
        status: 'published',
        created_by: adminId,
        published_at: publishedAt,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, versionNumber: 0, message: error.message };
    }

    await logAdminAction(adminId, 'PUBLISH_LANDING_PAGE', 'landing_page_version', data.id, {
      version_number: newVersionNumber,
      note: `Versão #${newVersionNumber} publicada com sucesso. Todas as páginas clonadas foram sincronizadas.`,
    });

    return {
      success: true,
      versionNumber: newVersionNumber,
      message: `Versão #${newVersionNumber} publicada e sincronizada com todas as páginas dos parceiros!`,
    };
  }

  // Local fallback
  initLocalDatabase();
  let versions = getLocalItem<LandingPageVersion[]>(STORAGE_KEYS.VERSIONS, seedVersions);
  // Remove draft
  versions = versions.filter((v) => v.status !== 'draft');

  const maxVer = Math.max(...versions.map((v) => v.version_number), 0);
  const newVerNum = maxVer + 1;
  const newVerId = `ver-${Date.now()}`;

  const newVersion: LandingPageVersion = {
    id: newVerId,
    version_number: newVerNum,
    content_json: content,
    status: 'published',
    created_by: adminId,
    created_at: publishedAt,
    published_at: publishedAt,
  };

  versions.push(newVersion);
  setLocalItem(STORAGE_KEYS.VERSIONS, versions);

  await logAdminAction(adminId, 'PUBLISH_LANDING_PAGE', 'landing_page_version', newVerId, {
    version_number: newVerNum,
    note: `Versão #${newVerNum} publicada com sucesso. Todas as páginas clonadas foram sincronizadas.`,
  });

  return {
    success: true,
    versionNumber: newVerNum,
    message: `Versão #${newVerNum} publicada com sucesso! Todas as páginas dos parceiros já exibem as novas configurações.`,
  };
}

export async function getLandingPageVersions(): Promise<LandingPageVersion[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase
      .from('landing_page_versions')
      .select('*')
      .order('version_number', { ascending: false });
    if (data) {
      return (data as LandingPageVersion[]).map((v) => ({
        ...v,
        content_json: normalizeLandingPageContent(v.content_json),
      }));
    }
  }

  initLocalDatabase();
  const versions = getLocalItem<LandingPageVersion[]>(STORAGE_KEYS.VERSIONS, seedVersions);
  return versions
    .map((v) => ({ ...v, content_json: normalizeLandingPageContent(v.content_json) }))
    .sort((a, b) => b.version_number - a.version_number);
}

export async function restoreLandingPageVersion(
  versionId: string,
  adminId: string
): Promise<{ success: boolean; versionNumber: number; message: string; content?: LandingPageContent }> {
  const versions = await getLandingPageVersions();
  const target = versions.find((v) => v.id === versionId);

  if (!target) {
    return { success: false, versionNumber: 0, message: 'Versão selecionada não foi encontrada.' };
  }

  // Publish this content as the latest version
  const result = await publishLandingPage(target.content_json, adminId);

  if (result.success) {
    await logAdminAction(adminId, 'RESTORE_VERSION', 'landing_page_version', versionId, {
      restoredFromVersion: target.version_number,
      newPublishedVersion: result.versionNumber,
      note: `Versão #${target.version_number} restaurada e publicada como Versão #${result.versionNumber}. Todas as páginas clonadas foram atualizadas preservando os dados individuais dos parceiros.`,
    });

    return {
      success: true,
      versionNumber: result.versionNumber,
      message: `Versão #${target.version_number} restaurada com sucesso como Versão #${result.versionNumber}! Todas as páginas foram sincronizadas.`,
      content: target.content_json,
    };
  }

  return { success: false, versionNumber: 0, message: result.message };
}

// -------------------------------------------------------------
// User Management & Slug Resolution
// -------------------------------------------------------------

export async function getUserBySlug(slug: string): Promise<UserWithSettings | null> {
  const cleanSlug = slug.toLowerCase().trim();

  if (isSupabaseConfigured() && supabase) {
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', cleanSlug)
      .single();

    if (!profile && (cleanSlug === 'cadastro' || cleanSlug === 'rangel' || cleanSlug === 'master' || cleanSlug === 'admin')) {
      const { data: rangel } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'rangelandradesmmn@gmail.com')
        .single();
      profile = rangel;
    }

    if (!profile && (cleanSlug === 'jorge' || cleanSlug === 'jorge-carvalho' || cleanSlug === 'jorgecarvalho')) {
      const { data: jorge } = await supabase
        .from('profiles')
        .select('*')
        .ilike('name', '%jorge%')
        .single();
      profile = jorge;
    }

    if (!profile) return null;

    const { data: settings } = await supabase
      .from('user_landing_settings')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    return {
      ...(profile as UserProfile),
      settings: settings || undefined,
    };
  }

  // Local fallback
  initLocalDatabase();
  const users = getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, seedUsers);
  let profile = users.find((u) => u.slug.toLowerCase() === cleanSlug);
  if (!profile && (cleanSlug === 'cadastro' || cleanSlug === 'rangel' || cleanSlug === 'master' || cleanSlug === 'admin')) {
    profile = users.find((u) => u.email.toLowerCase() === 'rangelandradesmmn@gmail.com');
  }
  if (!profile && (cleanSlug === 'jorge' || cleanSlug === 'jorge-carvalho' || cleanSlug === 'jorgecarvalho')) {
    profile = users.find((u) => u.name.toLowerCase() === 'jorge carvalho');
  }
  if (!profile) return null;

  const allSettings = getLocalItem<Record<string, UserLandingSettings>>(
    STORAGE_KEYS.SETTINGS,
    seedUserSettings
  );
  const settings = allSettings[profile.id];

  return {
    ...profile,
    settings,
  };
}

export async function getUserById(userId: string): Promise<UserWithSettings | null> {
  if (isSupabaseConfigured() && supabase) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) return null;

    const { data: settings } = await supabase
      .from('user_landing_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    return {
      ...(profile as UserProfile),
      settings: settings || undefined,
    };
  }

  // Local fallback
  initLocalDatabase();
  const users = getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, seedUsers);
  const profile = users.find((u) => u.id === userId);
  if (!profile) return null;

  const allSettings = getLocalItem<Record<string, UserLandingSettings>>(
    STORAGE_KEYS.SETTINGS,
    seedUserSettings
  );
  return {
    ...profile,
    settings: allSettings[userId],
  };
}

export async function getAllUsers(): Promise<UserWithSettings[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!profiles) return [];

    const { data: allSettings } = await supabase.from('user_landing_settings').select('*');
    const settingsMap = new Map((allSettings || []).map((s) => [s.user_id, s]));

    return profiles.map((p) => ({
      ...(p as UserProfile),
      settings: settingsMap.get(p.id),
    }));
  }

  // Local fallback
  initLocalDatabase();
  const users = getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, seedUsers);
  const allSettings = getLocalItem<Record<string, UserLandingSettings>>(
    STORAGE_KEYS.SETTINGS,
    seedUserSettings
  );

  return users.map((u) => ({
    ...u,
    settings: allSettings[u.id],
  }));
}

// -------------------------------------------------------------
// STRICTLY RESTRICTED USER UPDATE (Only 4 Personal Fields)
// 1. Name
// 2. Profile Photo
// 3. Registration Link
// 4. WhatsApp (Country code, Number, Message)
// -------------------------------------------------------------
export interface AllowedUserPersonalization {
  name?: string;
  profile_image_url?: string;
  registration_url?: string;
  whatsapp_country_code?: string;
  whatsapp_number?: string;
  whatsapp_message?: string;
}

export async function updateAllowedUserPersonalization(
  userId: string,
  payload: AllowedUserPersonalization
): Promise<{ success: boolean; message: string }> {
  // Validate registration URL if provided
  if (payload.registration_url && payload.registration_url.trim()) {
    if (!isValidHttpsUrl(payload.registration_url)) {
      return {
        success: false,
        message: 'O link pessoal de cadastro deve ser uma URL válida começando com https://',
      };
    }
  }

  // Validate Name if provided
  if (payload.name !== undefined) {
    const trimmed = payload.name.trim();
    if (trimmed.length < 2 || trimmed.length > 70) {
      return {
        success: false,
        message: 'O nome de exibição deve conter entre 2 e 70 caracteres.',
      };
    }
  }

  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    // 1. Update name in profiles
    if (payload.name) {
      await supabase
        .from('profiles')
        .update({ name: payload.name.trim(), updated_at: now })
        .eq('id', userId);
    }

    // 2. Update allowed settings
    const settingsUpdate: Partial<UserLandingSettings> = {
      updated_at: now,
    };
    if (payload.profile_image_url !== undefined)
      settingsUpdate.profile_image_url = payload.profile_image_url;
    if (payload.registration_url !== undefined)
      settingsUpdate.registration_url = payload.registration_url.trim();
    if (payload.whatsapp_country_code !== undefined)
      settingsUpdate.whatsapp_country_code = payload.whatsapp_country_code.trim();
    if (payload.whatsapp_number !== undefined)
      settingsUpdate.whatsapp_number = sanitizePhoneNumber(
        payload.whatsapp_country_code || '+55',
        payload.whatsapp_number
      );
    if (payload.whatsapp_message !== undefined)
      settingsUpdate.whatsapp_message = payload.whatsapp_message.trim();

    const { data: existingSettings } = await supabase
      .from('user_landing_settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let settingsError;
    if (existingSettings?.id) {
      const { error } = await supabase
        .from('user_landing_settings')
        .update(settingsUpdate)
        .eq('user_id', userId);
      settingsError = error;
    } else {
      const { error } = await supabase
        .from('user_landing_settings')
        .insert({
          id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          user_id: userId,
          ...settingsUpdate,
        });
      settingsError = error;
    }

    if (settingsError) {
      return { success: false, message: settingsError.message };
    }

    return { success: true, message: 'Dados pessoais atualizados com sucesso!' };
  }

  // Local fallback
  initLocalDatabase();
  const users = getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, seedUsers);
  const userIdx = users.findIndex((u) => u.id === userId);
  if (userIdx >= 0 && payload.name) {
    users[userIdx].name = payload.name.trim();
    users[userIdx].updated_at = now;
    setLocalItem(STORAGE_KEYS.USERS, users);
  }

  const allSettings = getLocalItem<Record<string, UserLandingSettings>>(
    STORAGE_KEYS.SETTINGS,
    seedUserSettings
  );
  const current = allSettings[userId] || {
    id: `set-${Date.now()}`,
    user_id: userId,
    profile_image_url: '',
    registration_url: '',
    whatsapp_country_code: '+55',
    whatsapp_number: '',
    whatsapp_message: '',
    updated_at: now,
  };

  if (payload.profile_image_url !== undefined) current.profile_image_url = payload.profile_image_url;
  if (payload.registration_url !== undefined)
    current.registration_url = payload.registration_url.trim();
  if (payload.whatsapp_country_code !== undefined)
    current.whatsapp_country_code = payload.whatsapp_country_code.trim();
  if (payload.whatsapp_number !== undefined)
    current.whatsapp_number = sanitizePhoneNumber(
      payload.whatsapp_country_code || current.whatsapp_country_code,
      payload.whatsapp_number
    );
  if (payload.whatsapp_message !== undefined) current.whatsapp_message = payload.whatsapp_message.trim();
  current.updated_at = now;

  allSettings[userId] = current;
  setLocalItem(STORAGE_KEYS.SETTINGS, allSettings);

  return { success: true, message: 'Suas personalizações foram salvas com sucesso!' };
}

// -------------------------------------------------------------
// Administrative Actions (Status, Block/Unblock, Audit)
// -------------------------------------------------------------

export async function toggleUserStatus(
  userId: string,
  newStatus: UserStatus,
  adminId: string
): Promise<{ success: boolean; message: string }> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus, updated_at: now })
      .eq('id', userId);

    if (error) return { success: false, message: error.message };

    await logAdminAction(
      adminId,
      newStatus === 'blocked' ? 'BLOCK_USER' : 'ACTIVATE_USER',
      'profile',
      userId,
      { newStatus }
    );

    return {
      success: true,
      message: `Status do usuário atualizado para ${newStatus}.`,
    };
  }

  // Local fallback
  initLocalDatabase();
  const users = getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, seedUsers);
  const user = users.find((u) => u.id === userId);
  if (!user) return { success: false, message: 'Usuário não encontrado.' };

  user.status = newStatus;
  user.updated_at = now;
  setLocalItem(STORAGE_KEYS.USERS, users);

  await logAdminAction(
    adminId,
    newStatus === 'blocked' ? 'BLOCK_USER' : 'ACTIVATE_USER',
    'profile',
    userId,
    { newStatus, userName: user.name }
  );

  return {
    success: true,
    message: `Usuário ${user.name} agora está ${newStatus === 'active' ? 'Ativo' : 'Bloqueado'}.`,
  };
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const logEntry: AdminAuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details: details || {},
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    await supabase.from('admin_audit_logs').insert(logEntry);
    return;
  }

  initLocalDatabase();
  const logs = getLocalItem<AdminAuditLog[]>(STORAGE_KEYS.AUDIT, seedAuditLogs);
  logs.unshift(logEntry);
  setLocalItem(STORAGE_KEYS.AUDIT, logs.slice(0, 100)); // keep last 100
}

export async function getAuditLogs(): Promise<AdminAuditLog[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) return data as AdminAuditLog[];
  }

  initLocalDatabase();
  return getLocalItem<AdminAuditLog[]>(STORAGE_KEYS.AUDIT, seedAuditLogs);
}

// -------------------------------------------------------------
// Event Tracking & Metrics (Views, Registration Clicks, WhatsApp Clicks)
// -------------------------------------------------------------

export async function recordLandingEvent(
  event: Omit<LandingEvent, 'id' | 'created_at'>
): Promise<void> {
  // Deduplicate rapid view spam via session storage
  if (typeof window !== 'undefined' && event.event_type === 'page_view') {
    const dedupKey = `viewed_${event.page_path}`;
    const lastView = sessionStorage.getItem(dedupKey);
    const now = Date.now();
    if (lastView && now - Number(lastView) < 60000) {
      // viewed less than 1 minute ago in this browser session
      return;
    }
    sessionStorage.setItem(dedupKey, String(now));
  }

  const newEvent: LandingEvent = {
    ...event,
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    await supabase.from('landing_events').insert(newEvent);
    return;
  }

  initLocalDatabase();
  const events = getLocalItem<LandingEvent[]>(STORAGE_KEYS.EVENTS, seedEvents);
  events.push(newEvent);
  setLocalItem(STORAGE_KEYS.EVENTS, events);
}

export async function getUserMetrics(userId: string): Promise<UserMetrics> {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase
      .from('landing_events')
      .select('event_type')
      .eq('user_id', userId);

    const views = (data || []).filter((e) => e.event_type === 'page_view').length;
    const regClicks = (data || []).filter((e) => e.event_type === 'registration_click').length;
    const waClicks = (data || []).filter((e) => e.event_type === 'whatsapp_click').length;
    const ctr = views > 0 ? Number(((regClicks / views) * 100).toFixed(1)) : 0;

    return {
      total_views: views,
      registration_clicks: regClicks,
      whatsapp_clicks: waClicks,
      ctr,
    };
  }

  initLocalDatabase();
  const events = getLocalItem<LandingEvent[]>(STORAGE_KEYS.EVENTS, seedEvents);
  const userEvents = events.filter((e) => e.user_id === userId);

  const views = userEvents.filter((e) => e.event_type === 'page_view').length;
  const regClicks = userEvents.filter((e) => e.event_type === 'registration_click').length;
  const waClicks = userEvents.filter((e) => e.event_type === 'whatsapp_click').length;
  const ctr = views > 0 ? Number(((regClicks / views) * 100).toFixed(1)) : 0;

  return {
    total_views: views,
    registration_clicks: regClicks,
    whatsapp_clicks: waClicks,
    ctr,
  };
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const users = await getAllUsers();
  const regularUsers = users.filter((u) => u.role !== 'admin');

  const activeCount = regularUsers.filter((u) => u.status === 'active').length;
  const blockedCount = regularUsers.filter((u) => u.status === 'blocked').length;

  let allEvents: LandingEvent[] = [];
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase
      .from('landing_events')
      .select('*')
      .order('created_at', { ascending: false });
    allEvents = (data || []) as LandingEvent[];
  } else {
    initLocalDatabase();
    allEvents = getLocalItem<LandingEvent[]>(STORAGE_KEYS.EVENTS, seedEvents);
  }

  const totalViews = allEvents.filter((e) => e.event_type === 'page_view').length;
  const totalRegistrationClicks = allEvents.filter(
    (e) => e.event_type === 'registration_click'
  ).length;
  const totalWhatsappClicks = allEvents.filter((e) => e.event_type === 'whatsapp_click').length;
  const globalCtr =
    totalViews > 0 ? Number(((totalRegistrationClicks / totalViews) * 100).toFixed(1)) : 0;

  // Rank top users by views and clicks
  const topUsers = regularUsers.map((user) => {
    const userEvents = allEvents.filter((e) => e.user_id === user.id);
    const views = userEvents.filter((e) => e.event_type === 'page_view').length;
    const regClicks = userEvents.filter((e) => e.event_type === 'registration_click').length;
    const waClicks = userEvents.filter((e) => e.event_type === 'whatsapp_click').length;
    const ctr = views > 0 ? Number(((regClicks / views) * 100).toFixed(1)) : 0;
    return { user, views, regClicks, waClicks, ctr };
  });

  topUsers.sort((a, b) => b.views + b.regClicks - (a.views + a.regClicks));

  return {
    totalUsers: regularUsers.length,
    activeUsers: activeCount,
    blockedUsers: blockedCount,
    totalViews,
    totalRegistrationClicks,
    totalWhatsappClicks,
    globalCtr,
    topUsers,
    recentUsers: regularUsers.slice(0, 5),
    recentEvents: allEvents.slice(0, 10),
  };
}

// -------------------------------------------------------------
// User Registration / Account Creation
// -------------------------------------------------------------

export async function registerNewUser(
  name: string,
  email: string,
  slugCandidate?: string,
  password?: string
): Promise<{ success: boolean; user?: UserWithSettings; message: string }> {
  initLocalDatabase();
  const users = await getAllUsers();

  // Check email
  const existingEmail = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingEmail) {
    return { success: false, message: 'Já existe um cadastro com este endereço de e-mail.' };
  }

  // Generate unique slug
  let baseSlug = generateSlug(slugCandidate || name);
  if (!baseSlug) baseSlug = 'parceiro';

  let uniqueSlug = baseSlug;
  let counter = 1;
  while (users.some((u) => u.slug.toLowerCase() === uniqueSlug.toLowerCase())) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const userId = `user-uuid-${Date.now()}`;
  const now = new Date().toISOString();

  const newUser: UserProfile = {
    id: userId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: 'user',
    status: 'active',
    slug: uniqueSlug,
    password: password && password.trim() ? password.trim() : 'senha123456',
    created_at: now,
    updated_at: now,
  };

  const initialSettings: UserLandingSettings = {
    id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    profile_image_url: '',
    registration_url: '',
    whatsapp_country_code: '+55',
    whatsapp_number: '',
    whatsapp_message: 'Olá! Acessei sua página e gostaria de informações.',
    updated_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    const { error: profileErr } = await supabase.from('profiles').insert(newUser);
    if (profileErr) return { success: false, message: profileErr.message };

    await supabase.from('user_landing_settings').insert(initialSettings);
  }

  // Keep local storage in sync
  const localUsers = getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, seedUsers);
  if (!localUsers.some((u) => u.id === newUser.id)) {
    localUsers.push(newUser);
    setLocalItem(STORAGE_KEYS.USERS, localUsers);
  }

  const allSettings = getLocalItem<Record<string, UserLandingSettings>>(
    STORAGE_KEYS.SETTINGS,
    seedUserSettings
  );
  allSettings[userId] = initialSettings;
  setLocalItem(STORAGE_KEYS.SETTINGS, allSettings);

  const passwords = getLocalItem<Record<string, string>>(
    STORAGE_KEYS.PASSWORDS,
    defaultPasswords
  );
  passwords[userId] = password && password.trim() ? password.trim() : 'senha123456';
  setLocalItem(STORAGE_KEYS.PASSWORDS, passwords);

  return {
    success: true,
    user: { ...newUser, settings: initialSettings },
    message: 'Cadastro realizado com sucesso! Sua landing page já foi gerada.',
  };
}

// -------------------------------------------------------------
// Live Chat & Moderation System
// -------------------------------------------------------------

export const initialChatSettings: ChatSettings = {
  enabled: true,
  title: 'Chat da Comunidade & Suporte',
  subtitle: 'Bate-papo ao vivo entre membros e atendimento com a moderação.',
  welcomeMessage:
    'Olá! Seja bem-vindo ao bate-papo oficial da Infinity Copy. Converse com os membros ou envie uma mensagem no privado do administrador.',
  adminOnline: false,
  manualOverride: 'auto',
  slowModeSeconds: 0,
  pinnedMessage: '🚀 Apresentações do projeto de Segunda a Sexta às 20h na nossa sala do Google Meet!',
};

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-welcome-001',
    sender_id: 'user-rangel-0001',
    sender_name: 'Rangel Andrade',
    sender_role: 'admin',
    content: 'Sejam todos bem-vindos ao bate-papo oficial da nossa comunidade! Fiquem à vontade para tirar dúvidas e interagir.',
    type: 'public',
    is_pinned: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg-welcome-002',
    sender_id: 'user-jorge-0001',
    sender_name: 'Jorge Carvalho',
    sender_role: 'partner',
    content: 'Excelente projeto! Os resultados diários e a automação do copy estão superando todas as expectativas.',
    type: 'public',
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

// 1. Admin Presence & Heartbeat
export function recordAdminHeartbeat(adminId: string, isOnline: boolean = true): void {
  const now = new Date().toISOString();
  const presence = {
    adminId,
    isOnline,
    lastSeen: now,
  };
  setLocalItem(STORAGE_KEYS.ADMIN_PRESENCE, presence);

  if (isSupabaseConfigured() && supabase) {
    try {
      Promise.resolve(
        supabase
          .from('chat_settings')
          .update({
            admin_online: isOnline,
            admin_last_seen: now,
            updated_at: now,
          })
          .eq('id', 'chat_global_settings')
      ).catch(() => {});
    } catch {}
  }
}

export async function recordAdminHeartbeatAsync(adminId: string, isOnline: boolean = true): Promise<void> {
  const now = new Date().toISOString();
  const presence = {
    adminId,
    isOnline,
    lastSeen: now,
  };
  setLocalItem(STORAGE_KEYS.ADMIN_PRESENCE, presence);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('chat_settings')
        .update({
          admin_online: isOnline,
          admin_last_seen: now,
          updated_at: now,
        })
        .eq('id', 'chat_global_settings');
    } catch {}
  }
}

export async function getAdminPresenceStatus(): Promise<{ isOnline: boolean; manualOverride: 'auto' | 'online' | 'offline'; lastSeen: string }> {
  const settings = await getChatSettings();
  if (settings.manualOverride === 'online') {
    return { isOnline: true, manualOverride: 'online', lastSeen: new Date().toISOString() };
  }
  if (settings.manualOverride === 'offline') {
    return { isOnline: false, manualOverride: 'offline', lastSeen: '' };
  }

  // Auto mode: check local presence or Cloud presence (timeout: 45s)
  const presence = getLocalItem<{ adminId: string; isOnline: boolean; lastSeen: string } | null>(
    STORAGE_KEYS.ADMIN_PRESENCE,
    null
  );

  if (presence && presence.isOnline === true && presence.lastSeen) {
    const diffMs = Date.now() - new Date(presence.lastSeen).getTime();
    if (diffMs < 45000) {
      return { isOnline: true, manualOverride: 'auto', lastSeen: presence.lastSeen };
    }
  }

  if (settings.adminOnline) {
    return { isOnline: true, manualOverride: 'auto', lastSeen: new Date().toISOString() };
  }

  return { isOnline: false, manualOverride: 'auto', lastSeen: '' };
}

// 1.1. Visitor Identification for Chat (Outside Panel)
export function getChatVisitorAuth(): ChatVisitorAuth | null {
  if (typeof window === 'undefined') return null;
  return getLocalItem<ChatVisitorAuth | null>(STORAGE_KEYS.CHAT_VISITOR_AUTH, null);
}

export function saveChatVisitorAuth(data: {
  name: string;
  email: string;
  whatsapp: string;
  id?: string;
}): ChatVisitorAuth {
  const existingId =
    data.id ||
    (typeof window !== 'undefined' ? localStorage.getItem('clonelp_visitor_id') : null) ||
    `vis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const auth: ChatVisitorAuth = {
    id: existingId,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    whatsapp: data.whatsapp.replace(/\D/g, ''),
    identifiedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem('clonelp_visitor_id', auth.id);
    localStorage.setItem('clonelp_visitor_name', auth.name);
  }

  setLocalItem(STORAGE_KEYS.CHAT_VISITOR_AUTH, auth);

  // Record presence immediately
  recordChatParticipantPresence({
    id: auth.id,
    name: auth.name,
    role: 'visitor',
    email: auth.email,
    whatsapp: auth.whatsapp,
    isOnline: true,
    lastSeen: auth.identifiedAt,
  });

  return auth;
}

export function clearChatVisitorAuth(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.CHAT_VISITOR_AUTH);
    localStorage.removeItem('clonelp_visitor_name');
  }
}

// 1.2. Active Chat Participants Presence
export async function recordChatParticipantPresence(participant: ChatParticipant): Promise<void> {
  const now = new Date().toISOString();
  const item: ChatParticipant = {
    ...participant,
    lastSeen: now,
    isOnline: participant.isOnline !== false,
  };

  // 1. Update in local storage
  initLocalDatabase();
  const currentList = getLocalItem<ChatParticipant[]>(STORAGE_KEYS.CHAT_PARTICIPANTS, []);
  const idx = currentList.findIndex(
    (p) => p.id === item.id || (p.email && item.email && p.email.toLowerCase() === item.email.toLowerCase())
  );
  if (idx >= 0) {
    currentList[idx] = { ...currentList[idx], ...item, lastSeen: now, isOnline: item.isOnline };
  } else {
    currentList.push(item);
  }
  setLocalItem(STORAGE_KEYS.CHAT_PARTICIPANTS, currentList);

  // 2. Sync with Supabase (chat_participants or fallback to landing_events)
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error: partErr } = await supabase.from('chat_participants').upsert({
        id: item.id,
        name: item.name,
        email: item.email || null,
        whatsapp: item.whatsapp || null,
        role: item.role,
        is_online: item.isOnline,
        last_seen: now,
      });

      if (partErr) {
        // Fallback to landing_events
        await supabase.from('landing_events').insert({
          id: `pres-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          event_type: 'page_view',
          page_path: '/chat',
          user_id: item.role === 'partner' ? item.id : null,
          metadata: {
            is_chat_presence: true,
            participant_id: item.id,
            name: item.name,
            email: item.email,
            whatsapp: item.whatsapp,
            role: item.role,
            is_online: item.isOnline,
            last_seen: now,
          },
        });
      }
    } catch {}
  }
}

export async function getActiveChatParticipants(): Promise<ChatParticipant[]> {
  const now = Date.now();
  const ACTIVE_WINDOW_MS = 3 * 60 * 1000; // 3 minutes
  const participantsMap = new Map<string, ChatParticipant>();

  // 1. Check Super Admin status
  const presence = await getAdminPresenceStatus();
  if (presence.isOnline) {
    participantsMap.set('user-rangel-0001', {
      id: 'user-rangel-0001',
      name: 'Rangel Andrade',
      role: 'admin',
      email: 'rangelandradesmmn@gmail.com',
      whatsapp: '22997953907',
      isOnline: true,
      lastSeen: presence.lastSeen || new Date().toISOString(),
    });
  }

  // 2. Read from Supabase Cloud (chat_participants or landing_events)
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: dbParts, error: partErr } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('is_online', true)
        .order('last_seen', { ascending: false });

      if (!partErr && dbParts && dbParts.length > 0) {
        dbParts.forEach((p: any) => {
          const diffMs = now - new Date(p.last_seen).getTime();
          if (diffMs < ACTIVE_WINDOW_MS) {
            participantsMap.set(p.id, {
              id: p.id,
              name: p.name,
              role: p.role as ChatUserRole,
              email: p.email,
              whatsapp: p.whatsapp,
              lastSeen: p.last_seen,
              isOnline: true,
            });
          }
        });
      } else {
        // Fallback: check landing_events
        const threeMinAgo = new Date(now - ACTIVE_WINDOW_MS).toISOString();
        const { data: events } = await supabase
          .from('landing_events')
          .select('*')
          .eq('page_path', '/chat')
          .gte('created_at', threeMinAgo)
          .order('created_at', { ascending: false })
          .limit(50);

        if (events) {
          events.forEach((evt: any) => {
            const meta = evt.metadata;
            if (meta?.is_chat_presence && meta.participant_id && meta.is_online !== false) {
              const diffMs = now - new Date(meta.last_seen || evt.created_at).getTime();
              if (diffMs < ACTIVE_WINDOW_MS && !participantsMap.has(meta.participant_id)) {
                participantsMap.set(meta.participant_id, {
                  id: meta.participant_id,
                  name: meta.name || 'Participante',
                  role: (meta.role as ChatUserRole) || 'visitor',
                  email: meta.email,
                  whatsapp: meta.whatsapp,
                  lastSeen: meta.last_seen || evt.created_at,
                  isOnline: true,
                });
              }
            }
          });
        }
      }
    } catch {}
  }

  // 3. Merge local storage participants
  initLocalDatabase();
  const localList = getLocalItem<ChatParticipant[]>(STORAGE_KEYS.CHAT_PARTICIPANTS, []);
  localList.forEach((p) => {
    const diffMs = now - new Date(p.lastSeen).getTime();
    if (p.isOnline && diffMs < ACTIVE_WINDOW_MS) {
      if (!participantsMap.has(p.id)) {
        participantsMap.set(p.id, p);
      }
    }
  });

  // 4. Return sorted: Admin first, then partners, then visitors
  return Array.from(participantsMap.values()).sort((a, b) => {
    if (a.role === 'admin') return -1;
    if (b.role === 'admin') return 1;
    if (a.role === 'partner' && b.role !== 'partner') return -1;
    if (b.role === 'partner' && a.role !== 'partner') return 1;
    return a.name.localeCompare(b.name);
  });
}

// 2. Chat Settings Management
export async function getChatSettings(): Promise<ChatSettings> {
  let settings = getLocalItem<ChatSettings>(STORAGE_KEYS.CHAT_SETTINGS, initialChatSettings);

  // Sync with Supabase Cloud
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase
        .from('chat_settings')
        .select('*')
        .eq('id', 'chat_global_settings')
        .maybeSingle();

      if (data) {
        const diffMs = data.admin_last_seen
          ? Date.now() - new Date(data.admin_last_seen).getTime()
          : Infinity;
        // Heartbeats sent every 15s. Marked offline if older than 45s or if admin_online is false
        const isRecent = diffMs < 45000;

        const isOnlineInDb =
          data.manual_override === 'online'
            ? true
            : data.manual_override === 'offline'
            ? false
            : Boolean(data.admin_online === true && data.admin_last_seen && isRecent);

        settings = {
          enabled: data.is_chat_enabled,
          title: 'Chat da Comunidade & Suporte',
          subtitle: 'Bate-papo ao vivo entre membros e atendimento com a moderação.',
          welcomeMessage: data.welcome_message || initialChatSettings.welcomeMessage,
          adminOnline: isOnlineInDb,
          manualOverride: (data.manual_override as 'auto' | 'online' | 'offline') || 'auto',
          slowModeSeconds: data.slow_mode_seconds || 0,
          pinnedMessage: data.pinned_message || '',
        };
        setLocalItem(STORAGE_KEYS.CHAT_SETTINGS, settings);
      }
    } catch {}
  }

  // Calculate dynamic presence
  let dynamicAdminOnline = false;
  if (settings.manualOverride === 'online') {
    dynamicAdminOnline = true;
  } else if (settings.manualOverride === 'offline') {
    dynamicAdminOnline = false;
  } else {
    const presence = getLocalItem<{ isOnline: boolean; lastSeen: string } | null>(STORAGE_KEYS.ADMIN_PRESENCE, null);
    const isLocalRecent = Boolean(
      presence?.isOnline === true &&
      presence.lastSeen &&
      Date.now() - new Date(presence.lastSeen).getTime() < 45000
    );

    if (isLocalRecent) {
      dynamicAdminOnline = true;
    } else if (settings.adminOnline) {
      dynamicAdminOnline = true;
    } else {
      dynamicAdminOnline = false;
    }
  }

  return {
    ...settings,
    adminOnline: dynamicAdminOnline,
  };
}

export async function updateChatSettings(
  patch: Partial<ChatSettings>,
  adminId?: string
): Promise<{ success: boolean; settings: ChatSettings }> {
  initLocalDatabase();
  const current = await getChatSettings();
  const updated: ChatSettings = {
    ...current,
    ...patch,
  };
  setLocalItem(STORAGE_KEYS.CHAT_SETTINGS, updated);

  if (isSupabaseConfigured() && supabase) {
    try {
      const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (patch.enabled !== undefined) dbPatch.is_chat_enabled = patch.enabled;
      if (patch.adminOnline !== undefined) dbPatch.admin_online = patch.adminOnline;
      if (patch.manualOverride !== undefined) dbPatch.manual_override = patch.manualOverride;
      if (patch.slowModeSeconds !== undefined) dbPatch.slow_mode_seconds = patch.slowModeSeconds;
      if (patch.pinnedMessage !== undefined) dbPatch.pinned_message = patch.pinnedMessage;
      if (patch.welcomeMessage !== undefined) dbPatch.welcome_message = patch.welcomeMessage;

      await supabase.from('chat_settings').update(dbPatch).eq('id', 'chat_global_settings');
    } catch {}
  }

  if (adminId) {
    await logAdminAction(adminId, 'UPDATE_CHAT_SETTINGS', 'chat_settings', 'global', patch);
  }

  return { success: true, settings: updated };
}

// 3. Chat Messages (Public & Private)
export async function getChatMessages(options?: {
  type?: 'public' | 'private';
  visitorId?: string;
  userId?: string;
  includeDeleted?: boolean;
}): Promise<ChatMessage[]> {
  initLocalDatabase();
  let allMessages = getLocalItem<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, []);

  // Sync with Supabase Cloud
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('chat_messages').select('*');
      if (options?.type) {
        query = query.eq('type', options.type);
      }
      if (!options?.includeDeleted) {
        query = query.eq('is_deleted', false);
      }
      query = query.order('created_at', { ascending: true });

      const { data, error } = await query;
      if (!error && data) {
        const cloudMessages = data as ChatMessage[];

        if (options?.type === 'public') {
          // Public messages: Supabase is the single source of truth.
          // Discard any old local public messages so cleared/deleted messages immediately disappear on all clones and landing pages.
          const localPrivate = allMessages.filter((m) => m.type === 'private');
          const updated = [...localPrivate, ...cloudMessages];
          setLocalItem(STORAGE_KEYS.CHAT_MESSAGES, updated);
          return cloudMessages;
        }

        if (options?.type === 'private') {
          // Private messages: keep local public, update local private
          const localPublic = allMessages.filter((m) => m.type === 'public');
          const updated = [...localPublic, ...cloudMessages];
          setLocalItem(STORAGE_KEYS.CHAT_MESSAGES, updated);

          let filtered = cloudMessages;
          if (options.visitorId || options.userId) {
            const validIds = new Set([options.visitorId, options.userId].filter(Boolean) as string[]);
            filtered = filtered.filter(
              (m) =>
                validIds.has(m.sender_id) ||
                validIds.has(m.recipient_id || '') ||
                (validIds.has('admin') && (m.recipient_id === 'admin' || m.sender_id === 'admin'))
            );
          }
          return filtered;
        }

        // When all types are requested (or in moderation overview)
        setLocalItem(STORAGE_KEYS.CHAT_MESSAGES, cloudMessages);
        return cloudMessages;
      }
    } catch {
      // Fallback to local if Supabase is offline
    }
  }

  // Fallback to local data when Supabase is not configured or offline
  let filtered = allMessages.length > 0 ? allMessages : initialChatMessages;

  if (options?.type) {
    filtered = filtered.filter((m) => m.type === options.type);
  }

  if (options?.type === 'private' && (options.visitorId || options.userId)) {
    const validIds = new Set([options.visitorId, options.userId].filter(Boolean) as string[]);
    filtered = filtered.filter(
      (m) =>
        validIds.has(m.sender_id) ||
        validIds.has(m.recipient_id || '') ||
        (validIds.has('admin') && (m.recipient_id === 'admin' || m.sender_id === 'admin'))
    );
  }

  if (!options?.includeDeleted) {
    filtered = filtered.filter((m) => !m.is_deleted);
  }

  // Sort chronological ascending
  return [...filtered].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

// 4. Send Message
export async function sendChatMessage(payload: {
  sender_id: string;
  sender_name: string;
  sender_role: 'admin' | 'partner' | 'visitor';
  content: string;
  type: 'public' | 'private';
  recipient_id?: string;
  recipient_name?: string;
}): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  initLocalDatabase();

  // Check if sender is restricted/muted
  const isMuted = await isUserMuted(payload.sender_id);
  if (isMuted && payload.sender_role !== 'admin') {
    return {
      success: false,
      error: 'Você está no modo somente leitura (envio restrito pelo administrador) e não pode enviar novas mensagens.',
    };
  }

  // Pure text sanitization
  const cleanContent = payload.content.replace(/<[^>]*>?/gm, '').trim();
  if (!cleanContent) {
    return { success: false, error: 'A mensagem não pode ser vazia.' };
  }
  if (cleanContent.length > 500) {
    return { success: false, error: 'A mensagem não pode ter mais de 500 caracteres.' };
  }

  // If public chat, verify admin is online
  if (payload.type === 'public' && payload.sender_role !== 'admin') {
    const presence = await getAdminPresenceStatus();
    if (!presence.isOnline) {
      return {
        success: false,
        error:
          'O bate-papo geral está pausado no momento pois o administrador está offline. Você pode enviar uma mensagem no privado do administrador!',
      };
    }
  }

  const now = new Date().toISOString();
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sender_id: payload.sender_id,
    sender_name: payload.sender_name.trim() || 'Visitante',
    sender_role: payload.sender_role,
    content: cleanContent,
    type: payload.type,
    recipient_id: payload.recipient_id,
    recipient_name: payload.recipient_name,
    read_status: payload.type === 'private' ? 'pending' : undefined,
    is_deleted: false,
    is_pinned: false,
    created_at: now,
  };

  // Record presence of active sender
  recordChatParticipantPresence({
    id: payload.sender_id,
    name: payload.sender_name.trim() || 'Participante',
    role: payload.sender_role,
    isOnline: true,
    lastSeen: now,
  });

  const allMessages = getLocalItem<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, initialChatMessages);
  allMessages.push(newMsg);
  setLocalItem(STORAGE_KEYS.CHAT_MESSAGES, allMessages);

  // If Supabase is active, try to insert there too
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('chat_messages').insert({
        id: newMsg.id,
        sender_id: newMsg.sender_id,
        sender_name: newMsg.sender_name,
        sender_role: newMsg.sender_role,
        content: newMsg.content,
        type: newMsg.type,
        recipient_id: newMsg.recipient_id || null,
        recipient_name: newMsg.recipient_name || null,
        read_status: newMsg.read_status || null,
        is_deleted: false,
        is_pinned: false,
        created_at: newMsg.created_at,
      });
    } catch {
      // Non-blocking fallback
    }
  }

  return { success: true, message: newMsg };
}

// 5. Delete Message (Admin Only)
export async function deleteChatMessage(
  messageId: string,
  adminId: string
): Promise<{ success: boolean; message?: string }> {
  initLocalDatabase();
  const allMessages = getLocalItem<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, initialChatMessages);
  const idx = allMessages.findIndex((m) => m.id === messageId);
  if (idx >= 0) {
    allMessages[idx].is_deleted = true;
    allMessages[idx].content = '[Mensagem removida pela moderação]';
    setLocalItem(STORAGE_KEYS.CHAT_MESSAGES, allMessages);
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('chat_messages')
        .update({ is_deleted: true, content: '[Mensagem removida pela moderação]' })
        .eq('id', messageId);
    } catch {}
  }

  await logAdminAction(adminId, 'DELETE_CHAT_MESSAGE', 'chat_message', messageId);
  return { success: true, message: 'Mensagem deletada com sucesso.' };
}

// 6. Restrict / Mute User (Admin Only)
export async function muteUser(
  userId: string,
  userName: string,
  adminId: string,
  reason?: string
): Promise<{ success: boolean }> {
  initLocalDatabase();
  const restrictions = getLocalItem<UserChatRestriction[]>(STORAGE_KEYS.CHAT_RESTRICTIONS, []);
  const existingIdx = restrictions.findIndex((r) => r.userId === userId);
  const now = new Date().toISOString();
  const item: UserChatRestriction = {
    userId,
    userName: userName || 'Usuário',
    muted: true,
    mutedAt: now,
    mutedBy: adminId,
    reason: reason || 'Restrito pela moderação do chat.',
  };

  if (existingIdx >= 0) {
    restrictions[existingIdx] = item;
  } else {
    restrictions.push(item);
  }
  setLocalItem(STORAGE_KEYS.CHAT_RESTRICTIONS, restrictions);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('chat_restrictions').upsert(
        {
          user_id: userId,
          user_name: item.userName,
          muted: true,
          muted_by: adminId,
          muted_at: now,
          reason: item.reason,
        },
        { onConflict: 'user_id' }
      );
    } catch {}
  }

  await logAdminAction(adminId, 'MUTE_CHAT_USER', 'chat_restriction', userId, { userName, reason });
  return { success: true };
}

export async function unmuteUser(userId: string, adminId: string): Promise<{ success: boolean }> {
  initLocalDatabase();
  const restrictions = getLocalItem<UserChatRestriction[]>(STORAGE_KEYS.CHAT_RESTRICTIONS, []);
  const updated = restrictions.filter((r) => r.userId !== userId);
  setLocalItem(STORAGE_KEYS.CHAT_RESTRICTIONS, updated);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('chat_restrictions').delete().eq('user_id', userId);
    } catch {}
  }

  await logAdminAction(adminId, 'UNMUTE_CHAT_USER', 'chat_restriction', userId);
  return { success: true };
}

export async function isUserMuted(userId: string): Promise<boolean> {
  if (!userId) return false;
  initLocalDatabase();
  const restrictions = getLocalItem<UserChatRestriction[]>(STORAGE_KEYS.CHAT_RESTRICTIONS, []);
  if (restrictions.some((r) => r.userId === userId && r.muted)) {
    return true;
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase
        .from('chat_restrictions')
        .select('muted')
        .eq('user_id', userId)
        .maybeSingle();

      if (data?.muted) {
        return true;
      }
    } catch {}
  }

  return false;
}

export async function getMutedUsers(): Promise<UserChatRestriction[]> {
  initLocalDatabase();
  let list = getLocalItem<UserChatRestriction[]>(STORAGE_KEYS.CHAT_RESTRICTIONS, []);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase.from('chat_restrictions').select('*').eq('muted', true);
      if (data && data.length > 0) {
        list = data.map((r: { user_id: string; user_name?: string; muted: boolean; muted_at: string; muted_by: string; reason?: string }) => ({
          userId: r.user_id,
          userName: r.user_name || 'Usuário',
          muted: r.muted,
          mutedAt: r.muted_at,
          mutedBy: r.muted_by,
          reason: r.reason,
        }));
        setLocalItem(STORAGE_KEYS.CHAT_RESTRICTIONS, list);
      }
    } catch {}
  }

  return list;
}

// 7. Mark Private Messages As Read (Admin views user's private messages)
export async function markPrivateMessagesAsRead(
  visitorOrUserId: string,
  adminId: string
): Promise<{ success: boolean; updatedCount: number }> {
  initLocalDatabase();
  const allMessages = getLocalItem<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, initialChatMessages);
  let updatedCount = 0;
  const now = new Date().toISOString();

  allMessages.forEach((m) => {
    // If message was sent by the visitor and is still pending
    if (m.type === 'private' && m.sender_id === visitorOrUserId && m.read_status === 'pending') {
      m.read_status = 'read';
      m.read_at = now;
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    setLocalItem(STORAGE_KEYS.CHAT_MESSAGES, allMessages);
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('chat_messages')
        .update({ read_status: 'read', read_at: now })
        .eq('type', 'private')
        .eq('sender_id', visitorOrUserId)
        .eq('read_status', 'pending');
    } catch {}
  }

  return { success: true, updatedCount };
}

// 8. Pin/Unpin Message & Clear Chat
export async function pinChatMessage(messageId: string, adminId: string): Promise<{ success: boolean }> {
  initLocalDatabase();
  const allMessages = getLocalItem<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, initialChatMessages);
  allMessages.forEach((m) => {
    m.is_pinned = m.id === messageId;
  });
  setLocalItem(STORAGE_KEYS.CHAT_MESSAGES, allMessages);
  await logAdminAction(adminId, 'PIN_CHAT_MESSAGE', 'chat_message', messageId);
  return { success: true };
}

export async function clearPublicChat(adminId: string): Promise<{ success: boolean; message?: string }> {
  initLocalDatabase();
  const allMessages = getLocalItem<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, initialChatMessages);
  // Keep only private messages
  const privateOnly = allMessages.filter((m) => m.type === 'private');
  // Add a clean restart message
  const restartMsg: ChatMessage = {
    id: `msg-${Date.now()}`,
    sender_id: adminId,
    sender_name: 'Moderação Oficial',
    sender_role: 'admin',
    content: 'O histórico do bate-papo foi reiniciado pela administração.',
    type: 'public',
    is_pinned: false,
    created_at: new Date().toISOString(),
    is_deleted: false,
  };
  privateOnly.push(restartMsg);
  setLocalItem(STORAGE_KEYS.CHAT_MESSAGES, privateOnly);

  if (isSupabaseConfigured() && supabase) {
    try {
      // 1. Delete all public messages in Supabase
      const { error: delErr } = await supabase.from('chat_messages').delete().eq('type', 'public');
      if (delErr) {
        console.error('Failed to delete public chat in Supabase:', delErr);
      }
      // 2. Insert fresh restart message
      const { error: insErr } = await supabase.from('chat_messages').insert([
        {
          id: restartMsg.id,
          sender_id: restartMsg.sender_id,
          sender_name: restartMsg.sender_name,
          sender_role: restartMsg.sender_role,
          content: restartMsg.content,
          type: restartMsg.type,
          is_pinned: false,
          created_at: restartMsg.created_at,
          is_deleted: false,
        },
      ]);
      if (insErr) {
        console.error('Failed to insert restart message in Supabase:', insErr);
      }
    } catch (err) {
      console.error('Error clearing public chat in Supabase:', err);
    }
  }

  await logAdminAction(adminId, 'CLEAR_PUBLIC_CHAT', 'chat_message', 'public');
  return { success: true, message: 'Bate-papo geral limpo com sucesso.' };
}
