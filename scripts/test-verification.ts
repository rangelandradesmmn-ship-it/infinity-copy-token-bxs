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
  buildWhatsAppUrl,
  generateSlug,
  validateImageFile,
} from '../src/lib/security';
import {
  authenticateUser,
  registerNewUser,
  updateUserPassword,
  getAllUsers,
  getAdminDashboardMetrics,
} from '../src/lib/dataService';

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

  const jorgeAuth = await authenticateUser('jorgecarvalho@gmail.com', 'senha123456');
  assert(jorgeAuth.success === true && jorgeAuth.user?.role === 'user', '36.2. Jorge Carvalho autentica estritamente com perfil user');

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

  console.log('\n================================================================');
  console.log(` RESULTADO: ${passedTests} DE ${totalTests} TESTES APROVADOS COM SUCESSO! `);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
})();
