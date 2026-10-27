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
} from '@/types';
import { initialLandingPageContent } from '@/data/defaultLandingPage';
import {
  seedUsers,
  seedRangelUser,
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
};

const TEST_USER_IDS = new Set(['admin-uuid-0001', 'user-uuid-0001', 'user-uuid-0002', 'user-uuid-0003']);
const TEST_USER_EMAILS = new Set(['admin@saas.com', 'joao@parceiro.com', 'maria@parceiro.com', 'carlos@parceiro.com']);

export const defaultPasswords: Record<string, string> = {
  'user-rangel-0001': 'senha123456',
};

// --- In-Memory & LocalStorage Persistence for Mock/Local Mode ---
function getLocalItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
}

// Initialize seed data in local storage and preserve all real and prior registrations
export function initLocalDatabase() {
  if (typeof window === 'undefined') return;

  // 1. Load users and ensure Rangel is always present
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
  setLocalItem(STORAGE_KEYS.USERS, existingUsers);

  // 2. Settings: ensure Rangel's settings are present while preserving existing users' settings
  const existingSettings = getLocalItem<Record<string, UserLandingSettings>>(
    STORAGE_KEYS.SETTINGS,
    seedUserSettings
  );
  if (!existingSettings['user-rangel-0001']) {
    existingSettings['user-rangel-0001'] = seedUserSettings['user-rangel-0001'];
  }
  setLocalItem(STORAGE_KEYS.SETTINGS, existingSettings);

  // 3. Passwords: ensure Rangel's password is present while preserving existing users' passwords
  const existingPasswords = getLocalItem<Record<string, string>>(
    STORAGE_KEYS.PASSWORDS,
    defaultPasswords
  );
  if (!existingPasswords['user-rangel-0001']) {
    existingPasswords['user-rangel-0001'] = 'senha123456';
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
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(STORAGE_KEYS.SESSION_USER);
  return saved && saved.trim() ? saved.trim() : null;
}

export function setCurrentSessionUserId(userId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SESSION_USER, userId);
}

export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.SESSION_USER);
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

  const storedPassword = passwords[user.id];
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

    if (!error && data) {
      return {
        content: data.content_json as LandingPageContent,
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
      content: published.content_json,
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

    if (data) {
      return {
        content: data.content_json as LandingPageContent,
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
    return { content: draft.content_json, versionId: draft.id, hasDraft: true };
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
      await supabase
        .from('landing_page_versions')
        .update({
          content_json: content,
          created_by: adminId,
          created_at: new Date().toISOString(),
        })
        .eq('id', existingDraft.id);
    } else {
      // Get highest version
      const { data: highest } = await supabase
        .from('landing_page_versions')
        .select('version_number')
        .order('version_number', { ascending: false })
        .limit(1)
        .single();
      const nextVer = (highest?.version_number || 1) + 1;

      await supabase.from('landing_page_versions').insert({
        version_number: nextVer,
        content_json: content,
        status: 'draft',
        created_by: adminId,
      });
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

    // Delete or update existing draft
    await supabase.from('landing_page_versions').delete().eq('status', 'draft');

    // Insert new published version
    const { data, error } = await supabase
      .from('landing_page_versions')
      .insert({
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
    if (data) return data as LandingPageVersion[];
  }

  initLocalDatabase();
  const versions = getLocalItem<LandingPageVersion[]>(STORAGE_KEYS.VERSIONS, seedVersions);
  return versions.sort((a, b) => b.version_number - a.version_number);
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', cleanSlug)
      .single();

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

    const { error } = await supabase
      .from('user_landing_settings')
      .upsert({
        user_id: userId,
        ...settingsUpdate,
      });

    if (error) {
      return { success: false, message: error.message };
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
  const users = getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, seedUsers);

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
  while (users.some((u) => u.slug === uniqueSlug)) {
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
    created_at: now,
    updated_at: now,
  };

  const initialSettings: UserLandingSettings = {
    id: `set-${Date.now()}`,
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
  } else {
    users.push(newUser);
    setLocalItem(STORAGE_KEYS.USERS, users);

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
  }

  return {
    success: true,
    user: { ...newUser, settings: initialSettings },
    message: 'Cadastro realizado com sucesso! Sua landing page já foi gerada.',
  };
}
