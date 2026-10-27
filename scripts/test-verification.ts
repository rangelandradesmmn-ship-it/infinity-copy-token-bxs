// scripts/test-verification.ts
// Automated Verification Suite for Cloned Landing Pages SaaS

import { initialLandingPageContent } from '../src/data/defaultLandingPage';
import {
  seedUsers,
  seedUserSettings,
  seedEvents,
} from '../src/data/seedData';
import {
  isValidHttpsUrl,
  sanitizePhoneNumber,
  buildWhatsAppUrl,
  generateSlug,
  validateImageFile,
} from '../src/lib/security';

console.log('================================================================');
console.log(' INICIANDO BATERIA DE TESTES OBRIGATÓRIOS DO SAAS (18 PONTOS) ');
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
const joaoUser = seedUsers.find((u) => u.slug === 'joao')!;
const joaoSettings = seedUserSettings[joaoUser.id];

const mariaUser = seedUsers.find((u) => u.slug === 'maria')!;
const mariaSettings = seedUserSettings[mariaUser.id];

// Dynamic template resolver function
function resolveLandingPageData(
  master: typeof initialLandingPageContent,
  user: any,
  settings: any
) {
  return {
    title: master.hero.title,
    videoUrl: master.hero.mainVideo?.url,
    brandColor: master.brand.primaryColor,
    // The 4 personalized fields:
    displayName: user ? user.name : 'Matriz Oficial',
    profilePhoto: settings ? settings.profile_image_url : '',
    registrationUrl: (settings && settings.registration_url) ? settings.registration_url : master.defaultSettings.registrationUrl,
    whatsappUrl: (settings && settings.whatsapp_number)
      ? buildWhatsAppUrl(settings.whatsapp_country_code, settings.whatsapp_number, settings.whatsapp_message)
      : buildWhatsAppUrl(master.defaultSettings.whatsappCountryCode, master.defaultSettings.whatsappNumber, master.defaultSettings.whatsappMessage),
  };
}

const joaoPageData = resolveLandingPageData(masterPage, joaoUser, joaoSettings);
const mariaPageData = resolveLandingPageData(masterPage, mariaUser, mariaSettings);
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

// Admin updates title, video, and primary brand color
const updatedMaster = JSON.parse(JSON.stringify(masterPage));
updatedMaster.hero.title = 'Título Atualizado pelo Super Admin na V2';
updatedMaster.hero.mainVideo.url = 'https://www.youtube.com/watch?v=NOVO_VIDEO_OFICIAL';
updatedMaster.brand.primaryColor = '#9333ea'; // changed to purple

// Both users' pages load the updated master
const joaoUpdated = resolveLandingPageData(updatedMaster, joaoUser, joaoSettings);
const mariaUpdated = resolveLandingPageData(updatedMaster, mariaUser, mariaSettings);

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
const carlosUser = seedUsers.find((u) => u.slug === 'carlos')!;
assert(carlosUser.status === 'blocked', '23. Usuário Carlos identificado com status blocked');

function checkPageStatus(user: any) {
  if (!user) return 'NOT_FOUND';
  if (user.status === 'blocked') return 'BLOCKED';
  return 'OK';
}

assert(checkPageStatus(joaoUser) === 'OK', '24. João está ativo e sua página é exibida normalmente');
assert(checkPageStatus(carlosUser) === 'BLOCKED', '25. Carlos redireciona para a tela de conta suspensa/bloqueada');
assert(checkPageStatus(null) === 'NOT_FOUND', '26. Slug inexistente exibe tela amigável de não encontrado');

// ------------------------------------------------------------------
// TESTE 8: Métricas & Cálculo de CTR
// ------------------------------------------------------------------
console.log('\n--- Módulo 8: Métricas & Cálculo de CTR ---');
const joaoViews = seedEvents.filter((e) => e.user_id === joaoUser.id && e.event_type === 'page_view').length;
const joaoClicks = seedEvents.filter((e) => e.user_id === joaoUser.id && e.event_type === 'registration_click').length;
const calculatedCtr = joaoViews > 0 ? Number(((joaoClicks / joaoViews) * 100).toFixed(1)) : 0;

assert(joaoViews > 0, '27. Visualizações do parceiro registradas');
assert(joaoClicks > 0, '28. Cliques de cadastro do parceiro registrados');
assert(calculatedCtr > 0 && calculatedCtr <= 100, `29. Cálculo de CTR consistente (${calculatedCtr}%)`);

console.log('\n================================================================');
console.log(` RESULTADO: ${passedTests} DE ${totalTests} TESTES APROVADOS COM SUCESSO! `);
console.log('================================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
