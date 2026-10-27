import { LandingPageContent } from '@/types';

export const initialLandingPageContent: LandingPageContent = {
  brand: {
    name: 'NextScale Ecosystem',
    logoUrl: '',
    primaryColor: '#2563eb', // Modern Blue
    accentColor: '#10b981', // Emerald Green
    darkTheme: false,
  },
  hero: {
    enabled: true,
    badge: '🚀 Plataforma Oficial de Expansão & Resultados',
    title: 'Transforme Seus Resultados com a Maior Tecnologia de',
    titleHighlight: 'Crescimento e Distribuição Digital',
    subtitle:
      'Descubra o ecossistema validado por milhares de profissionais. Treinamentos de ponta, suporte humanizado e uma estrutura pronta para você alavancar sua jornada hoje mesmo.',
    showConsultantCard: true,
    primaryCtaText: 'Fazer Meu Cadastro Gratuito',
    secondaryCtaText: 'Falar Comigo no WhatsApp',
    mainVideo: {
      id: 'hero-video-1',
      title: 'Apresentação Oficial do Ecossistema',
      description: 'Entenda em menos de 3 minutos como nossa infraestrutura funciona.',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      aspectRatio: '16:9',
      badge: 'Assista ao Vídeo Oficial',
    },
  },
  videosSection: {
    enabled: true,
    title: 'Demonstrações e Resultados Práticos',
    subtitle: 'Conheça em detalhes as ferramentas, estratégias e depoimentos rápidos de quem já está acelerando.',
    videos: [
      {
        id: 'vid-demo-1',
        title: 'Visão Geral da Plataforma e Ferramentas',
        description: 'Tour guiado por todas as funcionalidades disponíveis na área do membro.',
        url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
        aspectRatio: '16:9',
        badge: 'Tour Completo',
      },
      {
        id: 'vid-demo-2',
        title: 'Depoimento em 60 Segundos',
        description: 'Feedback direto em formato vertical (Reels/Shorts).',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        aspectRatio: '9:16',
        badge: 'Shorts 9:16',
      },
    ],
  },
  benefitsSection: {
    enabled: true,
    title: 'Por Que Fazer Parte Deste Movimento?',
    subtitle: 'Uma estrutura completa pensada exclusivamente para facilitar seu aprendizado e maximizar conversões.',
    items: [
      {
        id: 'b-1',
        icon: 'Zap',
        title: 'Velocidade e Praticidade',
        description: 'Tudo pronto e configurado. Em menos de 5 minutos você já tem acesso ao painel e às ferramentas.',
      },
      {
        id: 'b-2',
        icon: 'ShieldCheck',
        title: '100% Seguro e Confiável',
        description: 'Protocolos de segurança modernos, proteção de dados conforme a LGPD e estabilidade comprovada.',
      },
      {
        id: 'b-3',
        icon: 'TrendingUp',
        title: 'Escalabilidade Ilimitada',
        description: 'Compartilhe sua página com centenas ou milhares de contatos sem perda de desempenho.',
      },
      {
        id: 'b-4',
        icon: 'Users',
        title: 'Comunidade Ativa',
        description: 'Troca diária de experiências com outros membros, mentorias semanais e materiais atualizados.',
      },
      {
        id: 'b-5',
        icon: 'Award',
        title: 'Metodologia Validada',
        description: 'Passo a passo testado no campo de batalha para você não perder tempo com tentativa e erro.',
      },
      {
        id: 'b-6',
        icon: 'Headphones',
        title: 'Suporte Direto e Humanizado',
        description: 'Canal exclusivo no WhatsApp com seu parceiro credenciado para esclarecer qualquer dúvida.',
      },
    ],
  },
  consultantSection: {
    enabled: true,
    title: 'Você Não Está Sozinho(a)',
    subtitle: 'Conheça o parceiro autorizado responsável pelo seu atendimento personalizado.',
    consultantLabel: 'Seu Parceiro Credenciado Oficial',
    customDescription:
      'Estou à disposição para guiar você em cada etapa, explicar todas as oportunidades da plataforma e garantir que você aproveite o melhor suporte desde o seu primeiro dia.',
  },
  testimonialsSection: {
    enabled: true,
    title: 'O Que Nossos Membros Dizem',
    subtitle: 'Resultados e histórias reais de quem confiou na metodologia e transformou sua realidade.',
    items: [
      {
        id: 't-1',
        name: 'Camila Ferreira',
        role: 'Empreendedora Digital',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        quote:
          'A landing page personalizada trouxe uma credibilidade imensa para meus contatos. Todos os cliques vão direto pro meu WhatsApp e pro meu link de cadastro. Incrível!',
        rating: 5,
      },
      {
        id: 't-2',
        name: 'Rodrigo Albuquerque',
        role: 'Consultor de Negócios',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        quote:
          'O sistema é extremamente rápido e o fato do administrador atualizar vídeos e textos sem apagar meus dados individuais é genial. Poupa horas de trabalho!',
        rating: 5,
      },
      {
        id: 't-3',
        name: 'Fernanda Lima',
        role: 'Líder de Expansão',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
        quote:
          'Minha equipe inteira adotou as páginas clonadas. A conversão de cadastros subiu mais de 45% logo no primeiro mês.',
        rating: 5,
      },
    ],
  },
  faqSection: {
    enabled: true,
    title: 'Perguntas Frequentes',
    subtitle: 'Tire suas principais dúvidas sobre o funcionamento da plataforma.',
    items: [
      {
        id: 'faq-1',
        question: 'O cadastro inicial tem algum custo?',
        answer:
          'O acesso e o cadastro inicial são totalmente gratuitos. Você pode criar sua conta, conhecer o painel e avaliar todas as opções sem nenhum compromisso financeiro imediato.',
      },
      {
        id: 'faq-2',
        question: 'Como funciona o link exclusivo para os parceiros?',
        answer:
          'Cada membro cadastrado recebe uma URL única e personalizada (por exemplo, seudominio.com/p/seunome). Todos os botões de cadastro e contato do WhatsApp na sua página levam diretamente aos seus dados pessoais.',
      },
      {
        id: 'faq-3',
        question: 'Preciso entender de programação para personalizar minha página?',
        answer:
          'De forma alguma! Você só precisa informar seu nome, foto de perfil, link de cadastro e WhatsApp no seu painel. O sistema monta tudo automaticamente com padrão profissional.',
      },
      {
        id: 'faq-4',
        question: 'O que acontece quando o administrador atualiza o site?',
        answer:
          'A nova versão publicada pelo administrador sincroniza automaticamente em todas as páginas, atualizando vídeos, textos e identidade visual, sem alterar o seu link pessoal, seu WhatsApp, foto ou nome.',
      },
      {
        id: 'faq-5',
        question: 'Como falar com meu consultor se eu tiver dúvidas?',
        answer:
          'Basta clicar no botão de WhatsApp disponível nesta página. Você será direcionado diretamente para uma conversa privada com o seu parceiro credenciado.',
      },
    ],
  },
  ctaBanner: {
    enabled: true,
    title: 'Não Deixe Para Depois: Comece Sua Mudança Hoje',
    subtitle:
      'Cadastre-se gratuitamente em menos de 2 minutos ou tire todas as suas dúvidas diretamente com seu consultor no WhatsApp.',
    ctaText: 'Criar Minha Conta Gratuita Agora',
    whatsappCtaText: 'Chamar no WhatsApp',
    urgencyBadge: '⚡ Acesso Imediato Liberado',
  },
  footer: {
    companyName: 'NextScale Ecosystem do Brasil Ltda.',
    cnpj: '',
    legalText:
      'Todos os direitos reservados. Este site respeita rigorosamente a privacidade dos visitantes nos termos da Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018). As informações e depoimentos apresentados refletem experiências individuais e não garantem resultados idênticos.',
    privacyLink: '#privacidade',
    termsLink: '#termos',
  },
  defaultSettings: {
    registrationUrl: 'https://exemplo-matriz.com/cadastro-oficial',
    whatsappCountryCode: '+55',
    whatsappNumber: '11999990000',
    whatsappMessage: 'Olá! Acessei a página oficial e gostaria de falar com o suporte.',
  },
};
