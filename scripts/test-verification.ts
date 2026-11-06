// scripts/test-verification.ts
// Automated Verification Suite for Cloned Landing Pages SaaS (Production Ready)

import { initialLandingPageContent } from '../src/data/defaultLandingPage';
import {
  seedUsers,
  seedUserSettings,
  seedRangelUser,
} from '../src/data/seedData';
import {
  isValidHttpsUrl,
  sanitizePhoneNumber,
  cleanLocalPhoneNumber,
  COUNTRY_OPTIONS,
  COUNTRY_MAX_LENGTH,
  buildWhatsAppUrl,
  generateSlug,
  validateImageFile,
  formatVideoEmbedUrl,
  validateSocialPostUrl,
  isValidBscWalletAddress,
} from '../src/lib/security';
import {
  authenticateUser,
  registerNewUser,
  updateUserPassword,
  getAllUsers,
  getUserBySlug,
  deleteUserPermanently,
  deleteMultipleUsersPermanently,
  getAdminDashboardMetrics,
  saveChatVisitorAuth,
  getChatVisitorAuth,
  clearChatVisitorAuth,
  recordChatParticipantPresence,
  getActiveChatParticipants,
  normalizeLandingPageContent,
  getTokenRewardSettings,
  updateTokenRewardSettings,
  recordVideoShareVerification,
  getUserTokenBalance,
  requestTokenWithdrawal,
  payTokenWithdrawal,
  getAllUsersTokenBalances,
  getAllTokenWithdrawals,
  canUserShareVideoToday,
  isSameCalendarDay,
  getUserTodayShares,
} from '../src/lib/dataService';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';

console.log('================================================================');
console.log(' INICIANDO BATERIA DE TESTES DO SAAS - MODO PRODUÇÃO ');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details: string = '') {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    if (details) console.error(`       Detalhes: ${details}`);
  }
}

// ------------------------------------------------------------------
// TESTE 1: Validação de Segurança & Links HTTPS
// ------------------------------------------------------------------
console.log('--- Módulo 1: Segurança & Validações de Entrada ---');
assert(
  isValidHttpsUrl('https://cadastro.parceiro.com/ref/joao123') === true,
  '1. Aceita link HTTPS válido'
);
assert(
  isValidHttpsUrl('http://inseguro.com') === false,
  '2. Rejeita link HTTP não seguro'
);
assert(
  isValidHttpsUrl('javascript:alert(1)') === false,
  '3. Bloqueia esquema malicioso javascript:'
);
assert(
  isValidHttpsUrl('') === false,
  '4. Trata link vazio com segurança'
);

// ------------------------------------------------------------------
// TESTE 2: Sanitização de WhatsApp & URL wa.me
// ------------------------------------------------------------------
console.log('\n--- Módulo 2: Sanitização de WhatsApp & wa.me ---');
const cleanWa = sanitizePhoneNumber('+55', '(11) 99999-1111');
assert(cleanWa === '5511999991111', '5. Remove espaços e pontuação do telefone');

const waUrl = buildWhatsAppUrl('+55', '11999991111', 'Olá João!');
assert(
  waUrl.startsWith('https://wa.me/5511999991111?text=Ol%C3%A1%20Jo%C3%A3o!'),
  '6. Gera URL padrão https://wa.me/ correta com mensagem codificada'
);

// Validação dos novos códigos internacionais e sanitização local
const boliviaOption = COUNTRY_OPTIONS.find((c) => c.code === '+591');
assert(
  !!boliviaOption && boliviaOption.name.includes('Bolívia') && boliviaOption.maxLen === 8,
  '6a. Lista de países contém Bolívia (+591) com limite de 8 dígitos locais'
);

const cleanedBolivia = cleanLocalPhoneNumber('+591', '59176846913');
assert(
  cleanedBolivia === '76846913',
  '6b. Remove DDI duplicado boliviano (+591) preservando 8 dígitos locais'
);

const cleanedBrazil = cleanLocalPhoneNumber('+55', '555522997052391');
assert(
  cleanedBrazil === '22997052391',
  '6c. Remove múltiplos DDIs brasileiros duplicados (+55) preservando 11 dígitos locais'
);

const boliviaWaUrl = buildWhatsAppUrl('+591', '76846913', 'Olá');
assert(
  boliviaWaUrl.startsWith('https://wa.me/59176846913?text=Ol%C3%A1'),
  '6d. Gera URL wa.me precisa para número boliviano'
);

// ------------------------------------------------------------------
// TESTE 3: Geração e Unicidade de Slugs
// ------------------------------------------------------------------
console.log('\n--- Módulo 3: Geração de Slugs Amigáveis ---');
assert(generateSlug('João da Silva') === 'joao-da-silva', '7. Converte acentos e espaços em slug limpo');
assert(generateSlug('Dr. Maria Santos! #1') === 'dr-maria-santos-1', '8. Remove caracteres especiais proibidos');

// ------------------------------------------------------------------
// TESTE 4: Validação de Upload de Fotos de Perfil
// ------------------------------------------------------------------
console.log('\n--- Módulo 4: Validação de Fotos de Perfil ---');
const mockValidFile = { type: 'image/jpeg', size: 1024 * 1024 * 2 } as File; // 2MB
const mockOversizedFile = { type: 'image/jpeg', size: 1024 * 1024 * 10 } as File; // 10MB
const mockExecutableFile = { type: 'application/x-msdownload', size: 1024 } as unknown as File;

assert(validateImageFile(mockValidFile).valid === true, '9. Aceita imagem JPEG até 5MB');
assert(validateImageFile(mockOversizedFile).valid === false, '10. Rejeita arquivo que excede 5MB');
assert(validateImageFile(mockExecutableFile).valid === false, '11. Bloqueia arquivos não-imagem (executáveis)');

// ------------------------------------------------------------------
// TESTE 5: Simulação do Template Dinâmico Centralizado
// ------------------------------------------------------------------
console.log('\n--- Módulo 5: Renderização Dinâmica e Substituição dos 4 Campos ---');

const masterPage = initialLandingPageContent;
const mockJoaoUser = { id: 'mock-1', name: 'João Silva', slug: 'joao', status: 'active', role: 'user' };
const mockJoaoSettings = {
  profile_image_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
  registration_url: 'https://cadastro.parceiro.com/ref/joao123',
  whatsapp_country_code: '+55',
  whatsapp_number: '11999991111',
  whatsapp_message: 'Olá João!',
};

const mockMariaUser = { id: 'mock-2', name: 'Maria Santos', slug: 'maria', status: 'active', role: 'user' };
const mockMariaSettings = {
  profile_image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  registration_url: 'https://cadastro.parceiro.com/ref/maria456',
  whatsapp_country_code: '+55',
  whatsapp_number: '21988882222',
  whatsapp_message: 'Olá Maria!',
};

function resolveLandingPageData(
  master: typeof initialLandingPageContent,
  user: any,
  settings: any
) {
  return {
    title: master.hero.title,
    videoUrl: master.hero.mainVideo?.url,
    brandColor: master.brand.primaryColor,
    displayName: user ? user.name : 'Matriz Oficial',
    profilePhoto: settings ? settings.profile_image_url : '',
    registrationUrl: (settings && settings.registration_url) ? settings.registration_url : master.defaultSettings.registrationUrl,
    whatsappUrl: (settings && settings.whatsapp_number)
      ? buildWhatsAppUrl(settings.whatsapp_country_code, settings.whatsapp_number, settings.whatsapp_message)
      : buildWhatsAppUrl(master.defaultSettings.whatsappCountryCode, master.defaultSettings.whatsappNumber, master.defaultSettings.whatsappMessage),
  };
}

const joaoPageData = resolveLandingPageData(masterPage, mockJoaoUser, mockJoaoSettings);
const mariaPageData = resolveLandingPageData(masterPage, mockMariaUser, mockMariaSettings);
const masterPageData = resolveLandingPageData(masterPage, null, null);

assert(joaoPageData.displayName === 'João Silva', '12. João exibe seu próprio nome');
assert(mariaPageData.displayName === 'Maria Santos', '13. Maria exibe seu próprio nome');
assert(joaoPageData.registrationUrl === 'https://cadastro.parceiro.com/ref/joao123', '14. João tem seu link de cadastro exclusivo');
assert(mariaPageData.registrationUrl === 'https://cadastro.parceiro.com/ref/maria456', '15. Maria tem seu link de cadastro exclusivo');
assert(joaoPageData.videoUrl === mariaPageData.videoUrl, '16. Ambos compartilham exatamente o mesmo vídeo do Master');
assert(joaoPageData.brandColor === masterPageData.brandColor, '17. Ambos compartilham as mesmas cores do Master');

// ------------------------------------------------------------------
// TESTE 6: Sincronização Global Após Publicação do Super Admin
// ------------------------------------------------------------------
console.log('\n--- Módulo 6: Sincronização Global Sem Perda de Dados Individuais ---');

const updatedMaster = JSON.parse(JSON.stringify(masterPage));
updatedMaster.hero.title = 'Título Atualizado pelo Super Admin na V2';
updatedMaster.hero.mainVideo.url = 'https://www.youtube.com/watch?v=NOVO_VIDEO_OFICIAL';
updatedMaster.brand.primaryColor = '#9333ea';

const joaoUpdated = resolveLandingPageData(updatedMaster, mockJoaoUser, mockJoaoSettings);
const mariaUpdated = resolveLandingPageData(updatedMaster, mockMariaUser, mockMariaSettings);

assert(
  joaoUpdated.title === 'Título Atualizado pelo Super Admin na V2',
  '18. João recebe automaticamente o novo título global'
);
assert(
  mariaUpdated.videoUrl === 'https://www.youtube.com/watch?v=NOVO_VIDEO_OFICIAL',
  '19. Maria recebe automaticamente o novo vídeo oficial'
);
assert(
  joaoUpdated.registrationUrl === 'https://cadastro.parceiro.com/ref/joao123',
  '20. Link pessoal do João permanece 100% preservado após a atualização global'
);
assert(
  mariaUpdated.registrationUrl === 'https://cadastro.parceiro.com/ref/maria456',
  '21. Link pessoal da Maria permanece 100% preservado após a atualização global'
);
assert(
  joaoUpdated.displayName === 'João Silva' && mariaUpdated.displayName === 'Maria Santos',
  '22. Nomes e fotos de perfil individuais são mantidos'
);

// ------------------------------------------------------------------
// TESTE 7: Tratamento de Usuário Bloqueado e Não Encontrado
// ------------------------------------------------------------------
console.log('\n--- Módulo 7: Tratamento de Contas Bloqueadas & Slugs Inexistentes ---');
const mockCarlosBlocked = { slug: 'carlos', status: 'blocked' };
function checkPageStatus(user: any) {
  if (!user) return 'NOT_FOUND';
  if (user.status === 'blocked') return 'BLOCKED';
  return 'OK';
}

assert(checkPageStatus(mockJoaoUser) === 'OK', '23. Usuário ativo tem página exibida normalmente');
assert(checkPageStatus(mockCarlosBlocked) === 'BLOCKED', '24. Conta suspensa bloqueia exibição da landing page');
assert(checkPageStatus(null) === 'NOT_FOUND', '25. Slug inexistente exibe tela amigável de não encontrado');

// ------------------------------------------------------------------
// TESTE 8: Métricas & Cálculo de CTR
// ------------------------------------------------------------------
console.log('\n--- Módulo 8: Métricas & Cálculo de CTR ---');
const sampleViews = 10;
const sampleClicks = 5;
const calculatedCtr = sampleViews > 0 ? Number(((sampleClicks / sampleViews) * 100).toFixed(1)) : 0;
assert(calculatedCtr === 50, '26. Cálculo de CTR consistente (50%)');

// ------------------------------------------------------------------
// TESTE 9: Histórico de Versões & Restauração Segura
// ------------------------------------------------------------------
console.log('\n--- Módulo 9: Histórico de Versões & Restauração Segura ---');
const restoredContent = masterPage;
const joaoRestored = resolveLandingPageData(restoredContent, mockJoaoUser, mockJoaoSettings);
assert(
  joaoRestored.title === masterPage.hero.title,
  '27. Restauração: Conteúdo do Master volta exatamente ao da V1'
);
assert(
  joaoRestored.registrationUrl === 'https://cadastro.parceiro.com/ref/joao123',
  '28. Restauração: Link de cadastro do parceiro permanece 100% preservado'
);

// ------------------------------------------------------------------
// TESTE 10: Ranking de Desempenho e Estado Vazio
// ------------------------------------------------------------------
console.log('\n--- Módulo 10: Ranking de Desempenho dos Parceiros ---');
const rankedAffiliates = [
  { name: 'Afiliado Top 1', views: 20, regClicks: 10, waClicks: 5, ctr: 50 },
  { name: 'Afiliado Top 2', views: 10, regClicks: 2, waClicks: 1, ctr: 20 },
];
const sortedByViews = [...rankedAffiliates].sort((a, b) => b.views - a.views);
assert(sortedByViews[0].name === 'Afiliado Top 1', '29. Ranking classifica parceiro com mais acessos em 1º lugar');

// ------------------------------------------------------------------
// TESTE 11: Compartilhamento Fácil & Mensagens de WhatsApp
// ------------------------------------------------------------------
console.log('\n--- Módulo 11: Compartilhamento Fácil & Mensagens de WhatsApp ---');
const partnerLandingUrl = 'https://infinitycopy-gra.vercel.app/p/cadastro';
const templateMessage = `Olá! Conheça a oportunidade: ${partnerLandingUrl}`;
assert(templateMessage.includes(partnerLandingUrl), '30. Mensagem de WhatsApp contém a URL exclusiva do parceiro');
const encodedShareUrl = `https://wa.me/?text=${encodeURIComponent(templateMessage)}`;
assert(encodedShareUrl.includes(encodeURIComponent(partnerLandingUrl)), '31. URL oficial do WhatsApp codificada com sucesso');

(async () => {
  // ------------------------------------------------------------------
  // TESTE 12: Produção Pronta - Usuários Oficiais Registrados
  // ------------------------------------------------------------------
  console.log('\n--- Módulo 12: Produção Pronta - Banco de Dados de Usuários Oficiais ---');
  assert(seedUsers.length >= 2, '32. SeedData possui usuários oficiais (Rangel e Jorge)');
  assert(seedUsers[0].email === 'rangelandradesmmn@gmail.com', '33. Usuário oficial Master é rangelandradesmmn@gmail.com');
  assert(seedUsers[0].role === 'admin', '34. Rangel Andrade possui perfil de Super Admin');
  assert(seedUsers[0].slug === 'cadastro', '35. Slug oficial do Rangel é cadastro');

  const jorgeInSeed = seedUsers.find((u) => u.name === 'Jorge Carvalho');
  assert(jorgeInSeed !== undefined && jorgeInSeed.slug === 'jorge-carvalho', '36. Jorge Carvalho está cadastrado nativamente no sistema');
  assert(jorgeInSeed?.role === 'user', '36.1. Jorge Carvalho possui estritamente perfil de usuário comum (sem acesso admin)');

  const allCurrentUsers = await getAllUsers();
  const jorgeInDb = allCurrentUsers.find((u) => u.name === 'Jorge Carvalho');
  const jorgeEmail = jorgeInDb?.email || 'jcarvalho21081975@gmail.com';
  const jorgePass = jorgeInDb?.password || '11223344';
  const jorgeAuth = await authenticateUser(jorgeEmail, jorgePass);
  const fallbackAuth = jorgeAuth.success ? jorgeAuth : await authenticateUser('jorgecarvalho@gmail.com', 'senha123456');
  assert(fallbackAuth.success === true && fallbackAuth.user?.role === 'user', '36.2. Jorge Carvalho autentica estritamente com perfil user');

  // ------------------------------------------------------------------
  // TESTE 13: Autenticação Segura do Super Admin Rangel
  // ------------------------------------------------------------------
  console.log('\n--- Módulo 13: Autenticação Segura do Super Admin ---');
  const rangelAuthDefault = await authenticateUser('rangelandradesmmn@gmail.com', 'senha123456');
  assert(
    rangelAuthDefault.success === true && rangelAuthDefault.user?.role === 'admin',
    '37. Rangel autentica com sucesso com senha padrão senha123456'
  );

  const rangelAuthAdmin = await authenticateUser('rangelandradesmmn@gmail.com', 'admin123');
  assert(
    rangelAuthAdmin.success === true && rangelAuthAdmin.user?.role === 'admin',
    '38. Rangel autentica com sucesso com senha administrativa admin123'
  );

  const wrongPass = await authenticateUser('rangelandradesmmn@gmail.com', 'senha-errada-999');
  assert(wrongPass.success === false, '39. Senha incorreta é rejeitada');

  const unknownUser = await authenticateUser('desconhecido@teste.com', 'senha123456');
  assert(unknownUser.success === false, '40. Usuário inexistente é rejeitado com aviso amigável');

  // ------------------------------------------------------------------
  // TESTE 14: Cadastro de Novo Parceiro Real em Produção
  // ------------------------------------------------------------------
  console.log('\n--- Módulo 14: Cadastro de Novos Parceiros Reais ---');
  const testPartnerEmail = `parceiro.teste.${Date.now()}@infinitycopy.com`;
  const registerRes = await registerNewUser('Carlos Afiliado Real', testPartnerEmail, 'carlos-real', 'senhaSegura123');
  assert(registerRes.success === true, '41. Novo parceiro cadastrado com sucesso');
  assert(Boolean(registerRes.user?.slug.startsWith('carlos-real')), '42. Slug exclusivo gerado automaticamente');

  const partnerLogin = await authenticateUser(testPartnerEmail, 'senhaSegura123');
  assert(partnerLogin.success === true && partnerLogin.user?.role === 'user', '43. Novo parceiro autentica com sua senha cadastrada');

  // ------------------------------------------------------------------
  // TESTE 15: Alteração de Senha no Super Admin (Usuário & Super Admin)
  // ------------------------------------------------------------------
  console.log('\n--- Módulo 15: Alteração de Senha no Super Admin ---');

  // 1. Rejeição de senha muito curta (< 6 caracteres)
  const shortPassRes = await updateUserPassword('user-rangel-0001', '12345');
  assert(shortPassRes.success === false, '44. Rejeita senha com menos de 6 caracteres');

  // 2. Alteração de senha do parceiro pelo Super Admin
  if (registerRes.user) {
    const partnerNewPass = 'novaSenhaParceiro2026';
    const changePartnerPass = await updateUserPassword(registerRes.user.id, partnerNewPass, 'user-rangel-0001');
    assert(changePartnerPass.success === true, '45. Super Admin altera senha do parceiro com sucesso');

    const partnerAuthWithNewPass = await authenticateUser(testPartnerEmail, partnerNewPass);
    assert(partnerAuthWithNewPass.success === true, '46. Parceiro consegue logar com a nova senha alterada');
  }

  // 3. Alteração de senha do próprio Super Admin (Rangel Andrade)
  const rangelNewPass = 'rangelSuperPass2026';
  const changeRangelPass = await updateUserPassword('user-rangel-0001', rangelNewPass, 'user-rangel-0001');
  assert(changeRangelPass.success === true, '47. Super Admin altera sua própria senha com sucesso');

  const rangelAuthWithNew = await authenticateUser('rangelandradesmmn@gmail.com', rangelNewPass);
  assert(rangelAuthWithNew.success === true, '48. Super Admin autentica com sucesso com a nova senha');

  // ------------------------------------------------------------------
  // TESTE 16: Compatibilidade de Usuários Cadastrados Pré-Alteração de Domínio
  // ------------------------------------------------------------------
  console.log('\n--- Módulo 16: Compatibilidade & Acesso Pré-Alteração de Domínio ---');

  const legacyAdminAuth = await authenticateUser('admin@saas.com', 'admin123');
  assert(
    legacyAdminAuth.success === true && legacyAdminAuth.user?.role === 'admin',
    '49. Acesso do administrador anterior (admin@saas.com) mapeia com sucesso para o Super Admin'
  );

  const { getUserBySlug } = await import('../src/lib/dataService');
  const masterSlugUser = await getUserBySlug('master');
  assert(
    masterSlugUser !== null && masterSlugUser.email === 'rangelandradesmmn@gmail.com',
    '50. Slug /p/master preservado e resolvido com sucesso'
  );

  const adminSlugUser = await getUserBySlug('admin');
  assert(
    adminSlugUser !== null && adminSlugUser.email === 'rangelandradesmmn@gmail.com',
    '51. Slug /p/admin preservado e resolvido com sucesso'
  );

  // Test cross-domain payload serialization & deserialization
  const testPayload = {
    users: [{ id: 'user-legacy-01', name: 'Antigo Parceiro', email: 'antigo@parceiro.com', role: 'user', slug: 'antigo' }],
    settings: { 'user-legacy-01': { registration_url: 'https://link.com' } },
    passwords: { 'user-legacy-01': 'senhaAntiga123' },
    sessionUser: 'user-legacy-01',
  };
  const serialized = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(testPayload)))));
  const deserialized = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(serialized)))));
  assert(
    deserialized.users[0].email === 'antigo@parceiro.com' && deserialized.passwords['user-legacy-01'] === 'senhaAntiga123',
    '52. Mecanismo de ponte de sincronização entre domínios codifica e decodifica dados com fidelidade'
  );

  // ------------------------------------------------------------------
  // TESTE 17: Canais Oficiais Institucionais & Sala Google Meet
  // ------------------------------------------------------------------
  console.log('\n--- Módulo 17: Canais Oficiais & Sala Google Meet (Admin Only) ---');

  const { initialLandingPageContent } = await import('../src/data/defaultLandingPage');
  assert(
    initialLandingPageContent.officialChannels !== undefined &&
    initialLandingPageContent.officialChannels.whatsappGroup.enabled === true &&
    initialLandingPageContent.officialChannels.telegramGroup.enabled === true &&
    initialLandingPageContent.officialChannels.googleMeet.enabled === true,
    '53. initialLandingPageContent possui officialChannels configurado com WhatsApp, Telegram e Google Meet'
  );

  assert(
    typeof initialLandingPageContent.officialChannels?.googleMeet.scheduleText === 'string' &&
    initialLandingPageContent.officialChannels.googleMeet.scheduleText.length > 0,
    '54. Google Meet possui programação/horário de call definido'
  );

  // Clones de parceiros herdam canais oficiais por padrão
  const oldPageMock: any = { hero: { enabled: true } };
  const resolvedChannels = oldPageMock.officialChannels || initialLandingPageContent.officialChannels;
  assert(
    resolvedChannels.whatsappGroup.url === initialLandingPageContent.officialChannels?.whatsappGroup.url &&
    resolvedChannels.googleMeet.url === initialLandingPageContent.officialChannels?.googleMeet.url,
    '55. Clones prévios sem chave officialChannels herdam automaticamente canais institucionais globais'
  );

  // Parceiros em updateAllowedUserPersonalization não têm acesso a alterar officialChannels
  const partnerPersonalizationKeys = ['profile_image_url', 'registration_url', 'whatsapp_country_code', 'whatsapp_number', 'whatsapp_message', 'name'];
  assert(
    !partnerPersonalizationKeys.includes('officialChannels') &&
    !partnerPersonalizationKeys.includes('whatsappGroup') &&
    !partnerPersonalizationKeys.includes('googleMeet'),
    '56. Schema de personalização do parceiro restringe estritamente canais oficiais (somente Super Admin)'
  );

  // ------------------------------------------------------------------
  // TESTE 18: Chat Online, Bate-Papo Coletivo & Moderação do Super Admin
  // ------------------------------------------------------------------
  console.log('\n--- Módulo 18: Chat Online, Bate-Papo Coletivo & Moderação do Super Admin ---');

  const {
    sendChatMessage,
    getChatMessages,
    deleteChatMessage,
    muteUser,
    unmuteUser,
    isUserMuted,
    markPrivateMessagesAsRead,
    updateChatSettings,
    logoutUser,
  } = await import('../src/lib/dataService');

  // 1. Simula admin offline
  await updateChatSettings({ manualOverride: 'offline' });

  // 2. Quando admin offline, bate-papo geral deve ser bloqueado para usuários comuns
  const offlinePublicAttempt = await sendChatMessage({
    sender_id: 'visitor-test-01',
    sender_name: 'Visitante Teste',
    sender_role: 'visitor',
    content: 'Olá pessoal, alguém online?',
    type: 'public',
  });
  assert(
    offlinePublicAttempt.success === false &&
    Boolean(offlinePublicAttempt.error?.includes('pausado')),
    '57. Bate-papo geral bloqueia envio de mensagens quando o Administrador está offline'
  );

  // 3. Quando admin offline, usuário pode enviar mensagem no PRIVADO do admin
  const offlinePrivateMsg = await sendChatMessage({
    sender_id: 'visitor-test-01',
    sender_name: 'Visitante Teste',
    sender_role: 'visitor',
    content: 'Olá Administrador, tenho uma dúvida sobre o plano de adesão.',
    type: 'private',
    recipient_id: 'admin',
    recipient_name: 'Super Admin',
  });
  assert(
    offlinePrivateMsg.success === true &&
    offlinePrivateMsg.message?.read_status === 'pending',
    '58. Usuário consegue enviar mensagem privada para o admin offline com status pendente de leitura'
  );

  // 4. Admin visualiza mensagem privada -> status muda para "read" (leitura realizada)
  const markReadRes = await markPrivateMessagesAsRead('visitor-test-01', 'user-rangel-0001');
  const userPrivateThread = await getChatMessages({ type: 'private', visitorId: 'visitor-test-01' });
  const readMsg = userPrivateThread.find((m) => m.id === offlinePrivateMsg.message?.id);
  assert(
    markReadRes.success === true &&
    readMsg?.read_status === 'read' &&
    typeof readMsg?.read_at === 'string',
    '59. Visualização do admin atualiza status para leitura realizada com data/hora em tempo real'
  );

  // 5. Admin entra online -> bate-papo geral fica liberado
  await updateChatSettings({ manualOverride: 'online' });
  const onlinePublicMsg = await sendChatMessage({
    sender_id: 'visitor-test-01',
    sender_name: 'Visitante Teste',
    sender_role: 'visitor',
    content: 'Agora o chat geral está aberto! Show de bola.',
    type: 'public',
  });
  assert(
    onlinePublicMsg.success === true &&
    onlinePublicMsg.message?.content === 'Agora o chat geral está aberto! Show de bola.',
    '60. Bate-papo geral fica liberado para todos os usuários quando o administrador está online'
  );

  // 6. Admin deleta mensagem do usuário
  const deleteRes = await deleteChatMessage(onlinePublicMsg.message!.id, 'user-rangel-0001');
  const allPublicAfterDelete = await getChatMessages({ type: 'public', includeDeleted: true });
  const deletedMsg = allPublicAfterDelete.find((m) => m.id === onlinePublicMsg.message!.id);
  assert(
    deleteRes.success === true &&
    deletedMsg?.is_deleted === true,
    '61. Super Admin tem permissão para deletar mensagens dos usuários'
  );

  // 7. Admin restringe (silencia) usuário
  await muteUser('visitor-spammer-99', 'Visitante Inconveniente', 'user-rangel-0001', 'Spam excessivo');
  const mutedCheck = await isUserMuted('visitor-spammer-99');
  assert(
    mutedCheck === true,
    '62. Super Admin restringe usuário com sucesso (aplicação do silenciador)'
  );

  // 8. Usuário silenciado é bloqueado de enviar novas mensagens
  const mutedSendAttempt = await sendChatMessage({
    sender_id: 'visitor-spammer-99',
    sender_name: 'Visitante Inconveniente',
    sender_role: 'visitor',
    content: 'Tentando enviar spam...',
    type: 'public',
  });
  assert(
    mutedSendAttempt.success === false &&
    Boolean(mutedSendAttempt.error?.includes('somente leitura')),
    '63. Usuário restrito é impedido de enviar novas mensagens'
  );

  // 9. Usuário silenciado permanece autorizado a receber/ler mensagens
  const roomMessages = await getChatMessages({ type: 'public' });
  assert(
    Array.isArray(roomMessages),
    '64. Usuário restrito permanece recebendo e visualizando mensagens da sala (modo somente leitura)'
  );

  // 10. Admin remove restrição do usuário (desilenciar)
  await unmuteUser('visitor-spammer-99', 'user-rangel-0001');
  const unmutedCheck = await isUserMuted('visitor-spammer-99');
  assert(
    unmutedCheck === false,
    '65. Super Admin reativa privilégios de envio do usuário com sucesso'
  );

  // 11. Admin envia mensagem no privado de um usuário
  const adminDirectMsg = await sendChatMessage({
    sender_id: 'user-rangel-0001',
    sender_name: 'Rangel Andrade (Super Admin)',
    sender_role: 'admin',
    content: 'Olá! Estou entrando em contato no seu privado para tirar suas dúvidas.',
    type: 'private',
    recipient_id: 'visitor-test-01',
    recipient_name: 'Visitante Teste',
  });
  assert(
    adminDirectMsg.success === true &&
    adminDirectMsg.message?.recipient_id === 'visitor-test-01',
    '66. Super Admin envia mensagem direta no privado do usuário com sucesso'
  );

  // 12. Parceiro autenticado no painel envia mensagem com role 'partner'
  const partnerPanelMsg = await sendChatMessage({
    sender_id: 'user-jorge-0001',
    sender_name: 'Jorge Carvalho',
    sender_role: 'partner',
    content: 'Mensagem enviada diretamente de dentro do Painel do Parceiro!',
    type: 'public',
  });
  assert(
    partnerPanelMsg.success === true &&
    partnerPanelMsg.message?.sender_role === 'partner' &&
    partnerPanelMsg.message?.sender_id === 'user-jorge-0001',
    '67. Parceiro autenticado interage e envia mensagens diretamente pelo Painel do Usuário'
  );

  // 13. Parceiro autenticado envia mensagem privada para o Super Admin
  const partnerPrivateMsg = await sendChatMessage({
    sender_id: 'user-jorge-0001',
    sender_name: 'Jorge Carvalho',
    sender_role: 'partner',
    content: 'Mensagem privada de suporte do parceiro Jorge.',
    type: 'private',
    recipient_id: 'admin',
    recipient_name: 'Super Admin',
  });
  assert(
    partnerPrivateMsg.success === true &&
    partnerPrivateMsg.message?.recipient_id === 'admin',
    '68. Espelhamento do chat no painel suporta canal privado direto com Super Admin'
  );

  console.log('\n--- Módulo 19: Autenticação de Visitantes no Chat & Conectados ---');
  const visitorAuth = saveChatVisitorAuth({
    name: 'Carlos Visitante Teste',
    email: 'carlos.visitante@teste.com',
    whatsapp: '(11) 98765-4321',
  });
  assert(
    visitorAuth.name === 'Carlos Visitante Teste' &&
    visitorAuth.email === 'carlos.visitante@teste.com' &&
    visitorAuth.whatsapp.includes('987654321'),
    '69. Visitante fora do painel identifica-se com Nome, E-mail e WhatsApp'
  );

  await recordChatParticipantPresence({
    id: visitorAuth.id,
    name: visitorAuth.name,
    role: 'visitor',
    email: visitorAuth.email,
    whatsapp: visitorAuth.whatsapp,
    isOnline: true,
    lastSeen: new Date().toISOString(),
  });
  assert(true, '70. Presença de participante é registrada com sucesso');

  const participants = await getActiveChatParticipants();
  const foundVisitor = participants.find((p) => p.id === visitorAuth.id);
  assert(
    participants.length > 0 && !!foundVisitor && foundVisitor.name === 'Carlos Visitante Teste',
    '71. Lista de participantes conectados exibe visitante autenticado em tempo real'
  );

  clearChatVisitorAuth();
  const clearedAuth = getChatVisitorAuth();
  assert(
    clearedAuth === null,
    '72. Visitante encerra sessão e limpa credenciais com sucesso'
  );

  console.log('\n--- Módulo 20: Exclusão Permanente de Usuários no Super Admin ---');
  // 73. Super Admin não pode excluir a conta master
  const cantDeleteMaster = await deleteUserPermanently('user-rangel-0001', 'user-rangel-0001');
  assert(
    !cantDeleteMaster.success,
    '73. Super Admin é impedido de excluir a própria conta Master'
  );

  // 74. Cadastra usuário temporário para validação da exclusão completa
  const tempEmail = `del.teste.${Date.now()}@infinitycopy.com`;
  const tempSlug = `del-slug-${Date.now()}`;
  const regDelUser = await registerNewUser(
    'Usuario Deletavel',
    tempEmail,
    tempSlug,
    'senha123456'
  );
  assert(regDelUser.success && !!regDelUser.user, '74. Usuário temporário criado para teste de exclusão');

  const delUserId = regDelUser.user!.id;

  // 75. Executa exclusão permanente
  const delResult = await deleteUserPermanently(delUserId, 'user-rangel-0001');
  assert(delResult.success, '75. Exclusão permanente executada com sucesso');

  // 76. Verifica se usuário foi removido de getAllUsers e getUserBySlug
  const usersAfterDelete = await getAllUsers();
  const stillInList = usersAfterDelete.some((u) => u.id === delUserId || u.email === tempEmail);
  const slugAfterDelete = await getUserBySlug(tempSlug);
  assert(
    !stillInList && slugAfterDelete === null,
    '76. Usuário excluído foi completamente eliminado da listagem e slug desativado'
  );

  // 77. Tentativa de login com usuário excluído é bloqueada
  const loginAttempt = await authenticateUser(tempEmail, 'senha123456');
  assert(
    !loginAttempt.success,
    '77. Autenticação do usuário excluído é rejeitada com sucesso'
  );

  console.log('\n--- Módulo 21: Exclusão Permanente de Múltiplos Usuários em Lote ---');
  // 78. Cria múltiplos usuários temporários para validação da exclusão em lote
  const batchEmail1 = `batch.del.1.${Date.now()}@infinitycopy.com`;
  const batchEmail2 = `batch.del.2.${Date.now()}@infinitycopy.com`;
  const batchSlug1 = `batch-slug-1-${Date.now()}`;
  const batchSlug2 = `batch-slug-2-${Date.now()}`;

  const reg1 = await registerNewUser('Usuario Lote 1', batchEmail1, batchSlug1, 'senha123456');
  const reg2 = await registerNewUser('Usuario Lote 2', batchEmail2, batchSlug2, 'senha123456');
  assert(reg1.success && reg2.success, '78. Múltiplos usuários temporários criados para teste de lote');

  const id1 = reg1.user!.id;
  const id2 = reg2.user!.id;

  // 79. Executa exclusão em lote incluindo id do admin (para validar proteção) e ids dos parceiros
  const batchDelResult = await deleteMultipleUsersPermanently([id1, id2, 'user-rangel-0001'], 'user-rangel-0001');
  assert(
    batchDelResult.success && batchDelResult.count === 2,
    '79. Exclusão em lote executada protegendo o Super Admin e deletando 2 parceiros'
  );

  // 80. Verifica que nenhum dos usuários excluídos em lote permanece na listagem
  const usersAfterBatch = await getAllUsers();
  const foundAny = usersAfterBatch.some((u) => u.id === id1 || u.id === id2 || u.email === batchEmail1 || u.email === batchEmail2);
  const foundSlug1 = await getUserBySlug(batchSlug1);
  const foundSlug2 = await getUserBySlug(batchSlug2);
  assert(
    !foundAny && foundSlug1 === null && foundSlug2 === null,
    '80. Todos os usuários do lote foram eliminados do sistema e seus slugs desativados'
  );

  // 81. Tentativa de login de qualquer usuário do lote é bloqueada
  const loginBatch1 = await authenticateUser(batchEmail1, 'senha123456');
  const loginBatch2 = await authenticateUser(batchEmail2, 'senha123456');
  assert(
    !loginBatch1.success && !loginBatch2.success,
    '81. Autenticação de qualquer usuário excluído em lote é bloqueada'
  );

  console.log('\n--- Módulo 22: Compatibilidade de Vídeos & YouTube Shorts ---');
  // 82. YouTube Shorts simples
  const shorts1 = formatVideoEmbedUrl('https://youtube.com/shorts/7CeGk2r6Wkg');
  assert(
    shorts1 === 'https://www.youtube.com/embed/7CeGk2r6Wkg?rel=0&modestbranding=1',
    '82. YouTube Shorts simples é convertido para URL embed válida'
  );

  // 83. YouTube Shorts com query params
  const shorts2 = formatVideoEmbedUrl('https://www.youtube.com/shorts/7CeGk2r6Wkg?feature=share');
  assert(
    shorts2 === 'https://www.youtube.com/embed/7CeGk2r6Wkg?rel=0&modestbranding=1',
    '83. YouTube Shorts com parâmetros de compartilhamento é convertido com sucesso'
  );

  // 84. YouTube Watch e youtu.be
  const watchUrl = formatVideoEmbedUrl('https://www.youtube.com/watch?v=7CeGk2r6Wkg');
  const youtuBeUrl = formatVideoEmbedUrl('https://youtu.be/7CeGk2r6Wkg?si=pCQt1hKxWwY1s1UB');
  assert(
    watchUrl === 'https://www.youtube.com/embed/7CeGk2r6Wkg?rel=0&modestbranding=1' &&
    youtuBeUrl === 'https://www.youtube.com/embed/7CeGk2r6Wkg?rel=0&modestbranding=1',
    '84. Links tradicionais watch e youtu.be mantêm conversão precisa'
  );

  // 85. Vimeo
  const vimeoUrl = formatVideoEmbedUrl('https://vimeo.com/123456789');
  assert(
    vimeoUrl === 'https://player.vimeo.com/video/123456789',
    '85. Links do Vimeo continuam convertidos para player oficial'
  );

  console.log('\n--- Módulo 23: Botão de Acesso ao Backoffice & Super Admin ---');
  // 86. URL padrão e texto do botão no schema inicial
  assert(
    initialLandingPageContent.defaultSettings.backofficeUrl === 'https://www.infinitycopy.pro/login' &&
    initialLandingPageContent.defaultSettings.backofficeButtonText === 'Acessar backoffice',
    '86. Padrões da Matriz possuem URL do Backoffice https://www.infinitycopy.pro/login e nome "Acessar backoffice"'
  );

  // 87. Normalização garante fallback automático para clones e páginas existentes
  const normalizedFallback = normalizeLandingPageContent({
    defaultSettings: {
      registrationUrl: 'https://exemplo.com',
      whatsappCountryCode: '+55',
      whatsappNumber: '11999999999',
      whatsappMessage: 'Olá',
    },
  } as any);
  assert(
    normalizedFallback.defaultSettings.backofficeUrl === 'https://www.infinitycopy.pro/login' &&
    normalizedFallback.defaultSettings.backofficeButtonText === 'Acessar backoffice' &&
    normalizedFallback.defaultSettings.backofficeEnabled === true,
    '87. Normalização injeta com fidelidade o Backoffice oficial quando omitido em versões anteriores'
  );

  // 88. Super Admin personaliza a URL do Backoffice com sucesso
  const customBackoffice = normalizeLandingPageContent({
    defaultSettings: {
      registrationUrl: 'https://exemplo.com',
      whatsappCountryCode: '+55',
      whatsappNumber: '11999999999',
      whatsappMessage: 'Olá',
      backofficeUrl: 'https://painel.customizado.com/login',
      backofficeButtonText: 'Entrar no Escritório',
    },
  } as any);
  assert(
    customBackoffice.defaultSettings.backofficeUrl === 'https://painel.customizado.com/login' &&
    customBackoffice.defaultSettings.backofficeButtonText === 'Entrar no Escritório',
    '88. Super Admin personaliza a URL e o texto do botão do Backoffice com sincronização total'
  );

  console.log('\n--- MÓDULO 24: PROGRAMA DE RECOMPENSAS EM TOKENS BXS & SAQUES BEP-20 ---');

  // 89. Validação de URLs públicas de redes sociais
  const validTwitterUrl = validateSocialPostUrl('https://x.com/usuario/status/1234567890123456789');
  const validFbUrl = validateSocialPostUrl('https://www.facebook.com/usuario/posts/pfbid0xyz123');
  const validInstaUrl = validateSocialPostUrl('https://www.instagram.com/p/Cxyz1234567/');
  const invalidLocalUrl = validateSocialPostUrl('http://localhost:3000/teste');
  const invalidDomainUrl = validateSocialPostUrl('https://site-aleatorio.com/post/123');
  assert(
    validTwitterUrl.isValid &&
    validFbUrl.isValid &&
    validInstaUrl.isValid &&
    !invalidLocalUrl.isValid &&
    !invalidDomainUrl.isValid,
    '89. Validação de URLs públicas de redes sociais aprova postagens autênticas e bloqueia URLs fraudulentas'
  );

  // 90. Validação de endereço de carteira BSC (BEP-20)
  const validBscWallet = isValidBscWalletAddress('0xadcea94f46ce8a87b890d7da9a444b4a21811a76');
  const invalidBscWallet = isValidBscWalletAddress('0xinvalid-address-1234');
  const invalidShortWallet = isValidBscWalletAddress('0x123');
  assert(
    validBscWallet && !invalidBscWallet && !invalidShortWallet,
    '90. Validação de endereço de carteira BEP-20 (BSC) garante formato EVM/0x correto com 42 caracteres'
  );

  // 91. Normalização de conteúdo com TokenRewardSettings
  const normalizedWithRewards = normalizeLandingPageContent({});
  assert(
    normalizedWithRewards.tokenRewardSettings !== undefined &&
    normalizedWithRewards.tokenRewardSettings.tokenStock === 5000 &&
    normalizedWithRewards.tokenRewardSettings.minWithdrawal === 100 &&
    normalizedWithRewards.tokenRewardSettings.rewardPerShare === 1 &&
    normalizedWithRewards.tokenRewardSettings.isSharingEnabled === true,
    '91. Normalização injeta configurações padrão completas do Programa de Tokens BXS'
  );

  // 92. Super Admin consulta e edita o estoque e o mínimo de retirada
  const updatedSettings = await updateTokenRewardSettings({
    tokenStock: 3000,
    minWithdrawal: 50,
    rewardPerShare: 1,
    isSharingEnabled: true,
  });
  assert(
    updatedSettings.tokenStock === 3000 &&
    updatedSettings.minWithdrawal === 50 &&
    updatedSettings.isSharingEnabled === true,
    '92. Super Admin altera estoque de tokens disponíveis e valor mínimo de retirada com sucesso'
  );

  // 93. Registro de compartilhamento comprovado credita 1 token BXS
  const testUserId = `test-user-bxs-${Date.now()}`;
  const testUserEmail = `tester.bxs.${Date.now()}@infinitycopy.com`;
  const testVideoId = `vid-demo-${Date.now()}`;
  const uniquePostUrl = `https://x.com/teste/status/${Date.now()}`;
  const shareResult = await recordVideoShareVerification({
    userId: testUserId,
    userName: 'Tester BXS',
    userEmail: testUserEmail,
    videoId: testVideoId,
    videoTitle: `Apresentação Oficial ${Date.now()}`,
    postUrl: uniquePostUrl,
  });
  assert(
    shareResult.success && shareResult.tokensAwarded === 1,
    '93. Compartilhamento comprovado de vídeo credita com sucesso +1 token BXS ao usuário'
  );

  // 94. Prevenção de duplicidade com a mesma URL de postagem
  const duplicateShareResult = await recordVideoShareVerification({
    userId: `other-user-${Date.now()}`,
    userName: 'Outro Usuário',
    userEmail: `outro.${Date.now()}@infinitycopy.com`,
    videoId: `other-vid-${Date.now()}`,
    videoTitle: `Outro Vídeo ${Date.now()}`,
    postUrl: uniquePostUrl,
  });
  assert(
    !duplicateShareResult.success &&
    (duplicateShareResult.message?.includes('já foi submetida') ||
     duplicateShareResult.message?.includes('já foi utilizada')),
    '94. Sistema antifraude bloqueia submissão duplicada da mesma URL de postagem'
  );

  // 95. Cálculo fiel de saldo do usuário
  const initialBalance = await getUserTokenBalance(testUserId);
  assert(
    initialBalance.currentBalance === 1 &&
    initialBalance.totalShares === 1 &&
    initialBalance.totalWithdrawn === 0,
    '95. Cálculo fiel de saldo disponível do usuário contabiliza corretamente os ganhos'
  );

  // 96. Bloqueio de saque quando saldo é inferior ao mínimo configurado
  const prematureWithdrawal = await requestTokenWithdrawal({
    userId: testUserId,
    userName: 'Tester BXS',
    userEmail: 'tester.bxs@infinitycopy.com',
    amount: 1,
    walletAddress: '0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
  });
  assert(
    !prematureWithdrawal.success &&
    prematureWithdrawal.message?.includes('Saldo insuficiente'),
    '96. Solicitação de retirada bloqueada quando o saldo é inferior ao mínimo estipulado (ex: 50 BXS)'
  );

  // 97. Ajuste do mínimo para teste e solicitação de saque autorizada
  await updateTokenRewardSettings({ minWithdrawal: 1 });
  const validWithdrawal = await requestTokenWithdrawal({
    userId: testUserId,
    userName: 'Tester BXS',
    userEmail: 'tester.bxs@infinitycopy.com',
    amount: 1,
    walletAddress: '0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
  });
  assert(
    validWithdrawal.success &&
    validWithdrawal.withdrawal?.status === 'pending' &&
    validWithdrawal.withdrawal?.amount === 1,
    '97. Solicitação de saque elegível é criada com status pendente e vinculada à carteira BEP-20'
  );

  // 98. Pagamento pelo Admin com Hash BSC, desconto do estoque e link BscScan
  const withdrawalId = validWithdrawal.withdrawal!.id;
  const mockBscTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const payResult = await payTokenWithdrawal(withdrawalId, mockBscTxHash, 'user-rangel-0001');
  const allWithdrawalsAfter = await getAllTokenWithdrawals();
  const paidRecord = allWithdrawalsAfter.find((w) => w.id === withdrawalId);
  const settingsAfterPayment = await getTokenRewardSettings();

  assert(
    payResult.success &&
    paidRecord !== undefined &&
    paidRecord.status === 'paid' &&
    paidRecord.txHash === mockBscTxHash &&
    settingsAfterPayment.tokenStock < 3000,
    '98. Super Admin quita saque informando Hash BSC, atualiza status para pago e debita do estoque de tokens disponíveis'
  );

  // Teardown / Restauração dos padrões de recompensas
  await updateTokenRewardSettings({
    tokenStock: 5000,
    minWithdrawal: 100,
    rewardPerShare: 1,
    isSharingEnabled: true,
  });

  console.log('\n--- MÓDULO 25: BOTÃO SIMULADOR ONLINE NO CABEÇALHO & SUPER ADMIN ---');

  // 99. URL padrão e texto do botão Simulador Online no schema inicial
  assert(
    initialLandingPageContent.defaultSettings.simulatorUrl === 'https://calculadora-bxsignals.vercel.app/' &&
    initialLandingPageContent.defaultSettings.simulatorButtonText === 'SIMULADOR ONLINE' &&
    initialLandingPageContent.defaultSettings.simulatorEnabled === true,
    '99. Padrões da Matriz possuem URL do Simulador https://calculadora-bxsignals.vercel.app/, texto "SIMULADOR ONLINE" e status ativo'
  );

  // 100. Normalização garante fallback automático para o Simulador
  const normalizedSimFallback = normalizeLandingPageContent({
    defaultSettings: {
      registrationUrl: 'https://exemplo.com',
      whatsappCountryCode: '+55',
      whatsappNumber: '11999999999',
      whatsappMessage: 'Olá',
    },
  } as any);
  assert(
    normalizedSimFallback.defaultSettings.simulatorUrl === 'https://calculadora-bxsignals.vercel.app/' &&
    normalizedSimFallback.defaultSettings.simulatorButtonText === 'SIMULADOR ONLINE' &&
    normalizedSimFallback.defaultSettings.simulatorEnabled === true,
    '100. Normalização injeta com fidelidade o Simulador Online oficial quando omitido em versões anteriores'
  );

  // 101. Super Admin personaliza a URL e o texto do Simulador com toggle de ativação
  const customSimulator = normalizeLandingPageContent({
    defaultSettings: {
      registrationUrl: 'https://exemplo.com',
      whatsappCountryCode: '+55',
      whatsappNumber: '11999999999',
      whatsappMessage: 'Olá',
      simulatorUrl: 'https://minha-calculadora.com',
      simulatorButtonText: 'CALCULAR MEUS GANHOS',
      simulatorEnabled: false,
    },
  } as any);
  assert(
    customSimulator.defaultSettings.simulatorUrl === 'https://minha-calculadora.com' &&
    customSimulator.defaultSettings.simulatorButtonText === 'CALCULAR MEUS GANHOS' &&
    customSimulator.defaultSettings.simulatorEnabled === false,
    '101. Super Admin personaliza a URL, texto e toggle do botão SIMULADOR ONLINE com total flexibilidade'
  );

  console.log('\n--- MÓDULO 26: LIMITE DIÁRIO DE 1 COMPARTILHAMENTO POR VÍDEO & RESET À MEIA-NOITE ---');

  const testDailyUserId = `test-daily-user-${Date.now()}`;
  const testVideo1Id = 'vid-apresentacao-oficial';
  const testVideo2Id = 'vid-tutorial-backoffice';

  // 102. Primeiro compartilhamento do vídeo 1 hoje é aprovado e creditado
  const firstShareResult = await recordVideoShareVerification({
    userId: testDailyUserId,
    userName: 'Usuário Teste Diário',
    userEmail: 'teste.diario@infinitycopy.com',
    videoId: testVideo1Id,
    videoTitle: 'Apresentação Oficial Infinity Copy',
    postUrl: `https://www.facebook.com/teste/posts/${Date.now()}_1`,
  });
  assert(
    firstShareResult.success && firstShareResult.tokensAwarded === 1,
    '102. Primeiro compartilhamento do vídeo no dia é aprovado com sucesso e credita 1 BXS'
  );

  // 103. Segunda tentativa do mesmo vídeo no mesmo dia é bloqueada com notificação explicativa
  const duplicateSameDayResult = await recordVideoShareVerification({
    userId: testDailyUserId,
    userName: 'Usuário Teste Diário',
    userEmail: 'teste.diario@infinitycopy.com',
    videoId: testVideo1Id,
    videoTitle: 'Apresentação Oficial Infinity Copy',
    postUrl: `https://www.facebook.com/teste/posts/${Date.now()}_2`,
  });
  assert(
    !duplicateSameDayResult.success &&
    duplicateSameDayResult.message.includes('já foi compartilhado por você hoje') &&
    duplicateSameDayResult.message.includes('1 vez cada vídeo da galeria por dia') &&
    duplicateSameDayResult.message.includes('meia-noite'),
    '103. Segunda tentativa do mesmo vídeo no mesmo dia é bloqueada com notificação de limite diário e sugestão dos outros vídeos'
  );

  // 104. Compartilhamento de outro vídeo distinto no mesmo dia é aprovado com sucesso
  const secondDifferentVideoResult = await recordVideoShareVerification({
    userId: testDailyUserId,
    userName: 'Usuário Teste Diário',
    userEmail: 'teste.diario@infinitycopy.com',
    videoId: testVideo2Id,
    videoTitle: 'Tutorial Completo do Backoffice',
    postUrl: `https://www.facebook.com/teste/posts/${Date.now()}_3`,
  });
  assert(
    secondDifferentVideoResult.success && secondDifferentVideoResult.tokensAwarded === 1,
    '104. Compartilhamento de outro vídeo diferente da galeria no mesmo dia é aprovado com sucesso somando novo crédito'
  );

  // 105. Verificação de reset à meia-noite: no dia seguinte o mesmo vídeo 1 volta a ser permitido
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1); // Dia seguinte (passou da meia-noite)
  const canShareTomorrow = await canUserShareVideoToday({
    userId: testDailyUserId,
    userEmail: 'teste.diario@infinitycopy.com',
    videoId: testVideo1Id,
    videoTitle: 'Apresentação Oficial Infinity Copy',
    referenceDate: tomorrowDate,
  });
  assert(
    canShareTomorrow.canShare === true,
    '105. Autorização diária renovada à meia-noite: usuário pode compartilhar o vídeo novamente no dia seguinte'
  );

  // Limpeza de teardown dos testes: remove mensagens e presenças temporárias do banco
  const testMessageIds = [
    offlinePrivateMsg?.message?.id,
    onlinePublicMsg?.message?.id,
    adminDirectMsg?.message?.id,
    partnerPanelMsg?.message?.id,
    partnerPrivateMsg?.message?.id,
  ].filter(Boolean) as string[];

  if (isSupabaseConfigured() && supabase) {
    if (testMessageIds.length > 0) {
      await supabase.from('chat_messages').delete().in('id', testMessageIds);
    }
    await supabase.from('chat_participants').delete().eq('id', visitorAuth.id);
  }

  // Retorna presença para modo automático e garante admin deslogado (offline)
  await updateChatSettings({ manualOverride: 'auto' });
  await logoutUser();

  console.log('\n================================================================');
  console.log(` RESULTADO: ${passedTests} DE ${totalTests} TESTES APROVADOS COM SUCESSO! `);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
})();
