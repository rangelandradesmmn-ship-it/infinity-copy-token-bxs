'use client';

import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  LandingPageContent,
  LandingPageVersion,
  UserWithSettings,
  VideoItem,
  BenefitItem,
  TestimonialItem,
  FaqItem,
  AspectRatio,
} from '@/types';
import { saveLandingPageDraft, publishLandingPage } from '@/lib/dataService';
import { LivePreviewModal } from './LivePreviewModal';
import { VersionHistoryModal } from './VersionHistoryModal';
import {
  Save,
  Send,
  Eye,
  History,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  Tv,
  Palette,
  Layout,
  MessageSquare,
  Shield,
  HelpCircle,
  Video,
  Upload,
  Type,
  SlidersHorizontal,
  TrendingUp,
  Copy,
} from 'lucide-react';
import { FONT_FAMILY_MAP } from '@/components/landing/LandingRenderer';

export const FONT_OPTIONS = [
  { id: 'Inter', name: 'Inter', desc: 'Moderna & Clean (Padrão)' },
  { id: 'Montserrat', name: 'Montserrat', desc: 'Geométrica & Marcante' },
  { id: 'Poppins', name: 'Poppins', desc: 'Arredondada & Tech' },
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', desc: 'Design SaaS Moderno' },
  { id: 'Outfit', name: 'Outfit', desc: 'Elegante & Futurista' },
  { id: 'Oswald', name: 'Oswald (Condensada)', desc: 'Ideal para textos longos caberem na tela' },
  { id: 'Space Grotesk', name: 'Space Grotesk', desc: 'Web3, Cripto & Inovação' },
  { id: 'Roboto', name: 'Roboto', desc: 'Clássica & Neutra' },
];

interface MasterEditorProps {
  initialContent: LandingPageContent;
  versions: LandingPageVersion[];
  testUsers: UserWithSettings[];
  onPublished: (newVersionNumber: number) => void;
}

export function MasterEditor({
  initialContent,
  versions,
  testUsers,
  onPublished,
}: MasterEditorProps) {
  const [content, setContent] = useState<LandingPageContent>(initialContent);
  const [activeTab, setActiveTab] = useState<
    'brand' | 'hero' | 'videos' | 'benefits' | 'consultant' | 'testimonials' | 'faq' | 'token' | 'cta' | 'defaults'
  >('brand');

  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      setFeedback({
        type: 'error',
        text: 'Formato de imagem inválido. Utilize PNG, JPG, WEBP ou SVG.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setContent((prev) => ({
          ...prev,
          brand: { ...prev.brand, logoUrl: reader.result as string },
        }));
        setFeedback({
          type: 'success',
          text: 'Logotipo carregado com sucesso! Veja a prévia e publique quando desejar.',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setContent((prev) => ({
      ...prev,
      brand: { ...prev.brand, logoUrl: '' },
    }));
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  // Draft Save Handler
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setFeedback(null);
    try {
      const res = await saveLandingPageDraft(content, 'admin-uuid-0001');
      setFeedback({ type: 'success', text: res.message });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao salvar rascunho.',
      });
    } finally {
      setSavingDraft(false);
    }
  };

  // Publish Handler
  const handlePublish = async () => {
    if (
      !confirm(
        'Publicar esta versão agora? Todas as landing pages dos parceiros serão sincronizadas imediatamente preservando seus dados pessoais.'
      )
    ) {
      return;
    }

    setPublishing(true);
    setFeedback(null);
    try {
      const res = await publishLandingPage(content, 'admin-uuid-0001');
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        onPublished(res.versionNumber);
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao publicar versão.',
      });
    } finally {
      setPublishing(false);
    }
  };

  // Restore past version handler
  const handleRestoreVersion = (versionId: string) => {
    const target = versions.find((v) => v.id === versionId);
    if (!target) return;
    if (
      confirm(
        `Deseja carregar o conteúdo da Versão #${target.version_number}? As alterações não salvas serão substituídas.`
      )
    ) {
      setContent(target.content_json);
      setFeedback({
        type: 'success',
        text: `Conteúdo da Versão #${target.version_number} carregado no editor!`,
      });
    }
  };

  // Video Management Helpers
  const handleAddVideo = () => {
    const newVideo: VideoItem = {
      id: `vid-${Date.now()}`,
      title: 'Novo Vídeo de Demonstração',
      description: 'Descrição breve sobre o conteúdo exibido.',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      aspectRatio: '16:9',
      badge: 'Novo',
    };
    setContent((prev) => ({
      ...prev,
      videosSection: {
        ...prev.videosSection,
        videos: [...prev.videosSection.videos, newVideo],
      },
    }));
  };

  const handleRemoveVideo = (id: string) => {
    setContent((prev) => ({
      ...prev,
      videosSection: {
        ...prev.videosSection,
        videos: prev.videosSection.videos.filter((v) => v.id !== id),
      },
    }));
  };

  // Testimonial Helpers
  const handleAddTestimonial = () => {
    const newT: TestimonialItem = {
      id: `t-${Date.now()}`,
      name: 'Nome do Cliente / Membro',
      role: 'Empreendedor',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      quote: 'Espaço para o depoimento positivo sobre os resultados e suporte da plataforma.',
      rating: 5,
    };
    setContent((prev) => ({
      ...prev,
      testimonialsSection: {
        ...prev.testimonialsSection,
        items: [...prev.testimonialsSection.items, newT],
      },
    }));
  };

  const handleRemoveTestimonial = (id: string) => {
    setContent((prev) => ({
      ...prev,
      testimonialsSection: {
        ...prev.testimonialsSection,
        items: prev.testimonialsSection.items.filter((t) => t.id !== id),
      },
    }));
  };

  // FAQ Helpers
  const handleAddFaq = () => {
    const newFaq: FaqItem = {
      id: `faq-${Date.now()}`,
      question: 'Pergunta frequente sobre o sistema?',
      answer: 'Resposta detalhada esclarecendo a dúvida do visitante.',
    };
    setContent((prev) => ({
      ...prev,
      faqSection: {
        ...prev.faqSection,
        items: [...prev.faqSection.items, newFaq],
      },
    }));
  };

  const handleRemoveFaq = (id: string) => {
    setContent((prev) => ({
      ...prev,
      faqSection: {
        ...prev.faqSection,
        items: prev.faqSection.items.filter((f) => f.id !== id),
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Editor Visual da Landing Page Master</h1>
            <p className="text-xs text-slate-400">
              O template oficial que governa todas as páginas dos parceiros.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Versions History Dropdown & Modal Button */}
          <button
            type="button"
            onClick={() => setHistoryModalOpen(true)}
            className="px-3.5 py-2 bg-slate-850 hover:bg-slate-800 text-purple-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-purple-500/30 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span>Histórico de Versões</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Eye className="w-4 h-4 text-blue-400" />
            <span>Prévia ao Vivo</span>
          </button>

          <button
            type="button"
            disabled={savingDraft}
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50"
          >
            {savingDraft ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4 text-amber-400" />
            )}
            <span>Salvar Rascunho</span>
          </button>

          <button
            type="button"
            disabled={publishing}
            onClick={handlePublish}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950/40 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Publicar e Sincronizar Tudo</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 text-xs font-semibold">
        {[
          { id: 'brand', label: 'Empresa & Logotipo', icon: Palette },
          { id: 'hero', label: 'Hero & Vídeo Principal', icon: Layout },
          { id: 'videos', label: 'Galeria de Vídeos', icon: Video },
          { id: 'benefits', label: 'Benefícios', icon: Sparkles },
          { id: 'consultant', label: 'Seção do Consultor', icon: Shield },
          { id: 'testimonials', label: 'Depoimentos', icon: MessageSquare },
          { id: 'faq', label: 'Perguntas Frequentes', icon: HelpCircle },
          { id: 'token', label: 'Token BXS & Gráfico', icon: TrendingUp },
          { id: 'cta', label: 'Banner Final & Rodapé', icon: Tv },
          { id: 'defaults', label: 'Padrões da Matriz', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HERO & MAIN VIDEO */}
      {activeTab === 'hero' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Hero Principal</h2>
              <p className="text-xs text-slate-400">
                A primeira e mais importante seção vista pelos visitantes.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={content.hero.enabled}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, enabled: e.target.checked },
                  }))
                }
                className="w-4 h-4 rounded text-purple-600"
              />
              <span>Seção Habilitada</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Badge Superior
              </label>
              <input
                type="text"
                value={content.hero.badge}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, badge: e.target.value },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Título Principal
              </label>
              <input
                type="text"
                value={content.hero.title}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, title: e.target.value },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Destaque Colorido do Título
              </label>
              <input
                type="text"
                value={content.hero.titleHighlight}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, titleHighlight: e.target.value },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            {/* BOX DE AJUSTE DE TIPOGRAFIA, TAMANHO E LARGURA DO TÍTULO */}
            <div className="md:col-span-2 bg-slate-950/80 border border-purple-500/30 rounded-2xl p-5 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <Type className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Tipografia & Tamanho do Título Principal (Para Caber o Texto)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Ajuste o tipo da fonte, reduza ou aumente o tamanho e configure a largura do bloco para textos longos.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 font-semibold">
                  Personalizável
                </span>
              </div>

              {/* 1. Prévia em Tempo Real do Título */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-center space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Pré-visualização do Título:</span>
                  <span className="text-purple-400 font-mono text-[10px]">
                    Fonte: {content.hero.fontFamily || content.brand.headingFontFamily || content.brand.fontFamily || 'Inter'} • Tamanho: {content.hero.titleFontSizePx ? `${content.hero.titleFontSizePx}px` : (content.hero.titleSize === 'sm' ? 'Pequeno (~36px)' : content.hero.titleSize === 'lg' ? 'Grande (~56px)' : content.hero.titleSize === 'xl' ? 'Extra Grande (~68px)' : 'Médio (~44px)')}
                  </span>
                </div>
                <div className="py-3 px-2 border-y border-slate-800/60 overflow-hidden">
                  <h2
                    className="font-extrabold tracking-tight transition-all"
                    style={{
                      fontFamily: FONT_FAMILY_MAP[content.hero.fontFamily || content.brand.headingFontFamily || content.brand.fontFamily || 'Inter'],
                      fontSize: content.hero.titleFontSizePx
                        ? `clamp(20px, 4vw, ${content.hero.titleFontSizePx}px)`
                        : content.hero.titleSize === 'sm'
                        ? '1.875rem'
                        : content.hero.titleSize === 'lg'
                        ? '2.75rem'
                        : content.hero.titleSize === 'xl'
                        ? '3.5rem'
                        : '2.25rem',
                      lineHeight: 1.15,
                    }}
                  >
                    <span>{content.hero.title || 'Título Principal Aqui'} </span>
                    <span
                      className="bg-clip-text text-transparent bg-gradient-to-r"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${content.brand.primaryColor || '#3b82f6'}, ${content.brand.accentColor || '#10b981'})`,
                      }}
                    >
                      {content.hero.titleHighlight || 'Destaque Colorido'}
                    </span>
                  </h2>
                </div>
              </div>

              {/* 2. Seleção do Tipo de Fonte (Família Tipográfica) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-200">
                  Tipo da Fonte do Título (Família Tipográfica)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FONT_OPTIONS.map((font) => {
                    const isSelected = (content.hero.fontFamily || content.brand.headingFontFamily || content.brand.fontFamily || 'Inter') === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() =>
                          setContent((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, fontFamily: font.id },
                          }))
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm ring-1 ring-purple-500'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs" style={{ fontFamily: FONT_FAMILY_MAP[font.id] }}>
                            {font.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {font.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Seleção de Tamanho Predefinido */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-200">
                    Tamanho Predefinido do Título
                  </label>
                  <span className="text-[11px] text-slate-400">
                    (Escolha um preset ou use o controle em pixels abaixo)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'sm', label: 'Compacto / Pequeno', desc: 'Ideal para textos longos de 2 a 3 linhas', px: 34 },
                    { id: 'md', label: 'Médio (Equilibrado)', desc: 'Tamanho recomendado padrão', px: 44 },
                    { id: 'lg', label: 'Grande (Marcante)', desc: 'Destaque visual forte e impactante', px: 56 },
                    { id: 'xl', label: 'Extra Grande', desc: 'Impacto máximo para frases curtas', px: 68 },
                  ].map((preset) => {
                    const isSelected = (content.hero.titleSize || 'md') === preset.id && !content.hero.titleFontSizePx;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          setContent((prev) => ({
                            ...prev,
                            hero: {
                              ...prev.hero,
                              titleSize: preset.id as any,
                              titleFontSizePx: undefined,
                            },
                          }))
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{preset.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Ajuste Fino Manual de Tamanho (Slider) */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <label className="text-xs font-semibold text-slate-200">
                      Ajuste Fino de Tamanho em Pixels (Slider)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-md border border-purple-500/30">
                      {content.hero.titleFontSizePx ? `${content.hero.titleFontSizePx}px` : (
                        content.hero.titleSize === 'sm' ? '~34px (Compacto)' :
                        content.hero.titleSize === 'lg' ? '~56px (Grande)' :
                        content.hero.titleSize === 'xl' ? '~68px (Extra Grande)' :
                        '~44px (Médio)'
                      )}
                    </span>
                    {content.hero.titleFontSizePx && (
                      <button
                        type="button"
                        onClick={() =>
                          setContent((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, titleFontSizePx: undefined },
                          }))
                        }
                        className="text-[10px] text-slate-400 hover:text-white underline"
                      >
                        Redefinir
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={24}
                  max={72}
                  step={2}
                  value={content.hero.titleFontSizePx || (
                    content.hero.titleSize === 'sm' ? 34 :
                    content.hero.titleSize === 'lg' ? 56 :
                    content.hero.titleSize === 'xl' ? 68 :
                    44
                  )}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setContent((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, titleFontSizePx: val },
                    }));
                  }}
                  className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>24px (Mínimo compacto)</span>
                  <span>44px (Padrão equilibrado)</span>
                  <span>72px (Impacto máximo)</span>
                </div>
              </div>

              {/* 5. Largura Máxima do Bloco (Para o Texto Caber na Horizontal) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-200">
                    Largura Máxima do Bloco do Título
                  </label>
                  <span className="text-[11px] text-slate-400">
                    (Evita que frases longas quebrem em 6 ou 7 linhas)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: '3xl', label: 'Estreito (768px)', desc: 'Bloco compacto padrão' },
                    { id: '4xl', label: 'Amplo (896px)', desc: 'Recomendado para títulos médios' },
                    { id: '5xl', label: 'Expandido (1024px)', desc: 'Excelente para frases longas' },
                    { id: '6xl', label: 'Máximo (1152px)', desc: 'Aproveita toda a largura da tela' },
                  ].map((widthOpt) => {
                    const isSelected = (content.hero.titleMaxWidth || '4xl') === widthOpt.id;
                    return (
                      <button
                        key={widthOpt.id}
                        type="button"
                        onClick={() =>
                          setContent((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, titleMaxWidth: widthOpt.id as any },
                          }))
                        }
                        className={`p-2 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{widthOpt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{widthOpt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Tamanho do Subtítulo */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">
                    Tamanho do Texto do Subtítulo / Descrição
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Ajuste o tamanho do texto explicativo abaixo do título
                  </span>
                </div>
                <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                  {[
                    { id: 'sm', label: 'Pequeno' },
                    { id: 'md', label: 'Médio' },
                    { id: 'lg', label: 'Grande' },
                  ].map((subOpt) => {
                    const isSelected = (content.hero.subtitleSize || 'md') === subOpt.id;
                    return (
                      <button
                        key={subOpt.id}
                        type="button"
                        onClick={() =>
                          setContent((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, subtitleSize: subOpt.id as any },
                          }))
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {subOpt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cartão do Parceiro no Hero
              </label>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="showConsultantCard"
                  checked={content.hero.showConsultantCard}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, showConsultantCard: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded text-purple-600"
                />
                <label htmlFor="showConsultantCard" className="text-xs text-slate-300 cursor-pointer">
                  Exibir foto e nome do parceiro credenciado diretamente no Hero
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subtítulo / Descrição
              </label>
              <textarea
                rows={3}
                value={content.hero.subtitle}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, subtitle: e.target.value },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Texto do Botão Primário (Cadastro)
              </label>
              <input
                type="text"
                value={content.hero.primaryCtaText}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, primaryCtaText: e.target.value },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Texto do Botão Secundário (WhatsApp)
              </label>
              <input
                type="text"
                value={content.hero.secondaryCtaText}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, secondaryCtaText: e.target.value },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
          </div>

          {/* Main Video Settings */}
          <div className="pt-6 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3">Vídeo Principal do Hero</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL do Vídeo (YouTube ou Vimeo)
                </label>
                <input
                  type="url"
                  value={content.hero.mainVideo?.url || ''}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      hero: {
                        ...prev.hero,
                        mainVideo: {
                          id: prev.hero.mainVideo?.id || 'hero-vid',
                          title: prev.hero.mainVideo?.title || 'Apresentação Oficial',
                          aspectRatio: prev.hero.mainVideo?.aspectRatio || '16:9',
                          badge: prev.hero.mainVideo?.badge || 'Oficial',
                          url: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Proporção do Player
                </label>
                <select
                  value={content.hero.mainVideo?.aspectRatio || '16:9'}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      hero: {
                        ...prev.hero,
                        mainVideo: {
                          ...(prev.hero.mainVideo as VideoItem),
                          aspectRatio: e.target.value as AspectRatio,
                        },
                      },
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                >
                  <option value="16:9">16:9 (Horizontal Widescreen)</option>
                  <option value="9:16">9:16 (Vertical Shorts / Reels)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VIDEOS SECTION */}
      {activeTab === 'videos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Galeria de Vídeos</h2>
              <p className="text-xs text-slate-400">
                Adicione demonstrações, tutoriais ou vídeos verticais (Shorts/Reels 9:16).
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddVideo}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Vídeo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Título da Seção de Vídeos
              </label>
              <input
                type="text"
                value={content.videosSection.title}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    videosSection: { ...prev.videosSection, title: e.target.value },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subtítulo da Seção
              </label>
              <input
                type="text"
                value={content.videosSection.subtitle}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    videosSection: { ...prev.videosSection, subtitle: e.target.value },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {content.videosSection.videos.map((vid, idx) => (
              <div
                key={vid.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400">
                    Vídeo #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveVideo(vid.id)}
                    className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Título do Vídeo
                    </label>
                    <input
                      type="text"
                      value={vid.title}
                      onChange={(e) => {
                        const updated = [...content.videosSection.videos];
                        updated[idx].title = e.target.value;
                        setContent((prev) => ({
                          ...prev,
                          videosSection: { ...prev.videosSection, videos: updated },
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      URL (YouTube / Vimeo)
                    </label>
                    <input
                      type="url"
                      value={vid.url}
                      onChange={(e) => {
                        const updated = [...content.videosSection.videos];
                        updated[idx].url = e.target.value;
                        setContent((prev) => ({
                          ...prev,
                          videosSection: { ...prev.videosSection, videos: updated },
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Proporção
                    </label>
                    <select
                      value={vid.aspectRatio}
                      onChange={(e) => {
                        const updated = [...content.videosSection.videos];
                        updated[idx].aspectRatio = e.target.value as AspectRatio;
                        setContent((prev) => ({
                          ...prev,
                          videosSection: { ...prev.videosSection, videos: updated },
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    >
                      <option value="16:9">16:9 (Horizontal)</option>
                      <option value="9:16">9:16 (Vertical Shorts/Reels)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: BRAND, LOGO & COMPANY NAME */}
      {activeTab === 'brand' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-8">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white">Logotipo e Nome da Empresa Divulgada</h2>
            <p className="text-xs text-slate-400">
              Personalize o nome e o logotipo da empresa que aparecem no cabeçalho (navbar) e no rodapé de todas as landing pages principais e clonadas.
            </p>
          </div>

          {/* Live Header Preview Box */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Prévia do Topo da Página (Como os visitantes verão):
              </span>
              <span className="text-[10px] text-purple-400 font-medium">Tempo Real</span>
            </div>

            <div className="h-16 px-6 bg-slate-950/95 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3">
                {content.brand.logoUrl ? (
                  <div className="h-9 flex items-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={content.brand.logoUrl}
                      alt={content.brand.name}
                      className="h-9 w-auto max-w-[180px] object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md shrink-0"
                    style={{ backgroundColor: content.brand.primaryColor || '#2563eb' }}
                  >
                    {content.brand.name ? content.brand.name.charAt(0).toUpperCase() : 'N'}
                  </div>
                )}
                <span className="font-bold text-white text-base sm:text-lg tracking-tight">
                  {content.brand.name || 'Nome da Sua Empresa'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block px-3 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
                  WhatsApp
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                  Área do Membro
                </span>
              </div>
            </div>
          </div>

          {/* Configuration Inputs */}
          <div className="space-y-6">
            {/* 1. Nome da Empresa */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                Texto / Nome da Empresa Divulgada
              </label>
              <input
                type="text"
                value={content.brand.name}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    brand: { ...prev.brand, name: e.target.value },
                    footer: { ...prev.footer, companyName: e.target.value },
                  }))
                }
                placeholder="Ex: Infinity Copy - Token BXS, Minha Empresa Digital..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
              <p className="text-[11px] text-slate-400">
                Este texto substitui a marca ao lado do logotipo na barra superior e no rodapé oficial.
              </p>
            </div>

            {/* 2. Logotipo da Empresa */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Logotipo da Empresa (Imagem)
                </label>
                <p className="text-xs text-slate-400">
                  Envie o arquivo do seu logotipo ou informe uma URL externa de imagem.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-950/40"
                >
                  <Upload className="w-4 h-4" />
                  <span>Enviar Imagem do Logotipo</span>
                </button>

                {content.brand.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover Logo (Usar Ícone Monograma)</span>
                  </button>
                )}
              </div>

              {/* Direct URL input */}
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Ou informe o link direto da imagem (URL HTTPS):
                </label>
                <input
                  type="url"
                  value={content.brand.logoUrl || ''}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      brand: { ...prev.brand, logoUrl: e.target.value },
                    }))
                  }
                  placeholder="https://sua-empresa.com/imagens/logo.png"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Formatos ideais: PNG com fundo transparente ou SVG vetorial.
                </p>
              </div>
            </div>

            {/* 3. Cores Institucionais */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Cores Institucionais da Marca
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cor Primária (Botões e Destaques Principais)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={content.brand.primaryColor}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, primaryColor: e.target.value },
                        }))
                      }
                      className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={content.brand.primaryColor}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, primaryColor: e.target.value },
                        }))
                      }
                      className="flex-1 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cor de Destaque / Acentos (Secundária)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={content.brand.accentColor}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, accentColor: e.target.value },
                        }))
                      }
                      className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={content.brand.accentColor}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, accentColor: e.target.value },
                        }))
                      }
                      className="flex-1 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Tipografia & Fonte Global da Marca */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <Type className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Tipografia Geral da Página (Fonte Padrão)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Escolha a família tipográfica aplicada à estrutura e textos de todas as páginas.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-purple-400 font-mono px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                  Ativa: {content.brand.fontFamily || 'Inter'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {FONT_OPTIONS.map((font) => {
                  const isSelected = (content.brand.fontFamily || 'Inter') === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() =>
                        setContent((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, fontFamily: font.id },
                        }))
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm ring-1 ring-purple-500'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm" style={{ fontFamily: FONT_FAMILY_MAP[font.id] }}>
                          {font.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{font.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BENEFITS */}
      {activeTab === 'benefits' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-base font-bold text-white">Diferenciais e Benefícios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Título da Seção
              </label>
              <input
                type="text"
                value={content.benefitsSection.title}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    benefitsSection: { ...prev.benefitsSection, title: e.target.value },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subtítulo da Seção
              </label>
              <input
                type="text"
                value={content.benefitsSection.subtitle}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    benefitsSection: { ...prev.benefitsSection, subtitle: e.target.value },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content.benefitsSection.items.map((b, idx) => (
              <div key={b.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-purple-400">Card #{idx + 1}</span>
                <input
                  type="text"
                  value={b.title}
                  onChange={(e) => {
                    const updated = [...content.benefitsSection.items];
                    updated[idx].title = e.target.value;
                    setContent((prev) => ({
                      ...prev,
                      benefitsSection: { ...prev.benefitsSection, items: updated },
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                />
                <textarea
                  rows={2}
                  value={b.description}
                  onChange={(e) => {
                    const updated = [...content.benefitsSection.items];
                    updated[idx].description = e.target.value;
                    setContent((prev) => ({
                      ...prev,
                      benefitsSection: { ...prev.benefitsSection, items: updated },
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CONSULTANT SPOTLIGHT */}
      {activeTab === 'consultant' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-base font-bold text-white">Seção do Consultor / Parceiro</h2>
          <p className="text-xs text-slate-400">
            Esta seção dá destaque pessoal ao parceiro, exibindo sua foto, nome e link direto do WhatsApp.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Etiqueta / Rótulo do Parceiro
              </label>
              <input
                type="text"
                value={content.consultantSection.consultantLabel}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    consultantSection: {
                      ...prev.consultantSection,
                      consultantLabel: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Título da Seção
              </label>
              <input
                type="text"
                value={content.consultantSection.title}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    consultantSection: { ...prev.consultantSection, title: e.target.value },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Texto de Apresentação e Boas-Vindas do Consultor
              </label>
              <textarea
                rows={3}
                value={content.consultantSection.customDescription}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    consultantSection: {
                      ...prev.consultantSection,
                      customDescription: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: TESTIMONIALS */}
      {activeTab === 'testimonials' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Depoimentos de Membros</h2>
              <p className="text-xs text-slate-400">
                Prova social que reforça autoridade em todas as páginas clonadas.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTestimonial}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Depoimento</span>
            </button>
          </div>

          <div className="space-y-4">
            {content.testimonialsSection.items.map((t, idx) => (
              <div key={t.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400">Depoimento #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTestimonial(t.id)}
                    className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={t.name}
                    onChange={(e) => {
                      const updated = [...content.testimonialsSection.items];
                      updated[idx].name = e.target.value;
                      setContent((prev) => ({
                        ...prev,
                        testimonialsSection: { ...prev.testimonialsSection, items: updated },
                      }));
                    }}
                    placeholder="Nome"
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                  />
                  <input
                    type="text"
                    value={t.role}
                    onChange={(e) => {
                      const updated = [...content.testimonialsSection.items];
                      updated[idx].role = e.target.value;
                      setContent((prev) => ({
                        ...prev,
                        testimonialsSection: { ...prev.testimonialsSection, items: updated },
                      }));
                    }}
                    placeholder="Profissão / Cargo"
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                  />
                  <textarea
                    rows={2}
                    value={t.quote}
                    onChange={(e) => {
                      const updated = [...content.testimonialsSection.items];
                      updated[idx].quote = e.target.value;
                      setContent((prev) => ({
                        ...prev,
                        testimonialsSection: { ...prev.testimonialsSection, items: updated },
                      }));
                    }}
                    placeholder="Depoimento..."
                    className="sm:col-span-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: FAQ */}
      {activeTab === 'faq' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Perguntas Frequentes (FAQ)</h2>
              <p className="text-xs text-slate-400">
                Quebre as principais objeções de novos cadastros.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddFaq}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Pergunta</span>
            </button>
          </div>

          <div className="space-y-4">
            {content.faqSection.items.map((item, idx) => (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400">Pergunta #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFaq(item.id)}
                    className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={item.question}
                  onChange={(e) => {
                    const updated = [...content.faqSection.items];
                    updated[idx].question = e.target.value;
                    setContent((prev) => ({
                      ...prev,
                      faqSection: { ...prev.faqSection, items: updated },
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                />
                <textarea
                  rows={2}
                  value={item.answer}
                  onChange={(e) => {
                    const updated = [...content.faqSection.items];
                    updated[idx].answer = e.target.value;
                    setContent((prev) => ({
                      ...prev,
                      faqSection: { ...prev.faqSection, items: updated },
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: TOKEN BXS & GRÁFICO EM TEMPO REAL */}
      {activeTab === 'token' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Gráfico em Tempo Real & Token BXS</h2>
              <p className="text-xs text-slate-400">
                Configure o gráfico ao vivo do token e o botão de cópia do contrato para os visitantes.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={content.tokenSection?.enabled ?? true}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    tokenSection: {
                      ...(prev.tokenSection || {
                        enabled: true,
                        badge: '🟢 Gráfico em Tempo Real',
                        title: 'Acompanhe a Cotação do Token BXS',
                        subtitle:
                          'Monitoramento ao vivo de preço, liquidez e negociações descentralizadas na rede Binance Smart Chain (BSC).',
                        tokenSymbol: 'BXS',
                        tokenName: 'BXSignals Token',
                        network: 'BNB Smart Chain (BEP-20)',
                        contractAddress: '0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                        copyButtonText: 'copie o contrato da BXS',
                        chartProvider: 'geckoterminal',
                        embedUrl:
                          'https://www.geckoterminal.com/bsc/pools/0xd4ad1ce50f942f2f036f1f759ff3eb785d77a7a2e71db52849a37ad28e4295ab?embed=1&info=0&swaps=0&grayscale=0&light_chart=0',
                        coinMarketCapUrl:
                          'https://dex.coinmarketcap.com/token/bsc/0xadcea94f46ce8a87b890d7da9a444b4a21811a76/',
                        bscScanUrl:
                          'https://bscscan.com/token/0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                      }),
                      enabled: e.target.checked,
                    },
                  }))
                }
                className="w-4 h-4 rounded text-purple-600"
              />
              <span>Ativar Seção do Gráfico</span>
            </label>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Badge Superior da Seção
              </label>
              <input
                type="text"
                value={content.tokenSection?.badge || '🟢 Gráfico em Tempo Real'}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    tokenSection: {
                      ...(prev.tokenSection || {
                        enabled: true,
                        badge: '🟢 Gráfico em Tempo Real',
                        title: 'Acompanhe a Cotação do Token BXS',
                        subtitle:
                          'Monitoramento ao vivo de preço, liquidez e negociações descentralizadas na rede Binance Smart Chain (BSC).',
                        tokenSymbol: 'BXS',
                        tokenName: 'BXSignals Token',
                        network: 'BNB Smart Chain (BEP-20)',
                        contractAddress: '0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                        copyButtonText: 'copie o contrato da BXS',
                        chartProvider: 'geckoterminal',
                        embedUrl:
                          'https://www.geckoterminal.com/bsc/pools/0xd4ad1ce50f942f2f036f1f759ff3eb785d77a7a2e71db52849a37ad28e4295ab?embed=1&info=0&swaps=0&grayscale=0&light_chart=0',
                        coinMarketCapUrl:
                          'https://dex.coinmarketcap.com/token/bsc/0xadcea94f46ce8a87b890d7da9a444b4a21811a76/',
                        bscScanUrl:
                          'https://bscscan.com/token/0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                      }),
                      badge: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Texto do Botão de Cópia do Contrato
              </label>
              <input
                type="text"
                value={content.tokenSection?.copyButtonText || 'copie o contrato da BXS'}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    tokenSection: {
                      ...(prev.tokenSection || {
                        enabled: true,
                        badge: '🟢 Gráfico em Tempo Real',
                        title: 'Acompanhe a Cotação do Token BXS',
                        subtitle:
                          'Monitoramento ao vivo de preço, liquidez e negociações descentralizadas na rede Binance Smart Chain (BSC).',
                        tokenSymbol: 'BXS',
                        tokenName: 'BXSignals Token',
                        network: 'BNB Smart Chain (BEP-20)',
                        contractAddress: '0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                        copyButtonText: 'copie o contrato da BXS',
                        chartProvider: 'geckoterminal',
                        embedUrl:
                          'https://www.geckoterminal.com/bsc/pools/0xd4ad1ce50f942f2f036f1f759ff3eb785d77a7a2e71db52849a37ad28e4295ab?embed=1&info=0&swaps=0&grayscale=0&light_chart=0',
                        coinMarketCapUrl:
                          'https://dex.coinmarketcap.com/token/bsc/0xadcea94f46ce8a87b890d7da9a444b4a21811a76/',
                        bscScanUrl:
                          'https://bscscan.com/token/0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                      }),
                      copyButtonText: e.target.value,
                    },
                  }))
                }
                placeholder="Ex: copie o contrato da BXS"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Título Principal da Seção
              </label>
              <input
                type="text"
                value={content.tokenSection?.title || 'Acompanhe a Cotação do Token BXS'}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    tokenSection: {
                      ...(prev.tokenSection || {
                        enabled: true,
                        badge: '🟢 Gráfico em Tempo Real',
                        title: 'Acompanhe a Cotação do Token BXS',
                        subtitle:
                          'Monitoramento ao vivo de preço, liquidez e negociações descentralizadas na rede Binance Smart Chain (BSC).',
                        tokenSymbol: 'BXS',
                        tokenName: 'BXSignals Token',
                        network: 'BNB Smart Chain (BEP-20)',
                        contractAddress: '0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                        copyButtonText: 'copie o contrato da BXS',
                        chartProvider: 'geckoterminal',
                        embedUrl:
                          'https://www.geckoterminal.com/bsc/pools/0xd4ad1ce50f942f2f036f1f759ff3eb785d77a7a2e71db52849a37ad28e4295ab?embed=1&info=0&swaps=0&grayscale=0&light_chart=0',
                        coinMarketCapUrl:
                          'https://dex.coinmarketcap.com/token/bsc/0xadcea94f46ce8a87b890d7da9a444b4a21811a76/',
                        bscScanUrl:
                          'https://bscscan.com/token/0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                      }),
                      title: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subtítulo Explicativo
              </label>
              <textarea
                rows={2}
                value={
                  content.tokenSection?.subtitle ||
                  'Monitoramento ao vivo de preço, liquidez e negociações descentralizadas na rede Binance Smart Chain (BSC).'
                }
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    tokenSection: {
                      ...(prev.tokenSection || {
                        enabled: true,
                        badge: '🟢 Gráfico em Tempo Real',
                        title: 'Acompanhe a Cotação do Token BXS',
                        subtitle:
                          'Monitoramento ao vivo de preço, liquidez e negociações descentralizadas na rede Binance Smart Chain (BSC).',
                        tokenSymbol: 'BXS',
                        tokenName: 'BXSignals Token',
                        network: 'BNB Smart Chain (BEP-20)',
                        contractAddress: '0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                        copyButtonText: 'copie o contrato da BXS',
                        chartProvider: 'geckoterminal',
                        embedUrl:
                          'https://www.geckoterminal.com/bsc/pools/0xd4ad1ce50f942f2f036f1f759ff3eb785d77a7a2e71db52849a37ad28e4295ab?embed=1&info=0&swaps=0&grayscale=0&light_chart=0',
                        coinMarketCapUrl:
                          'https://dex.coinmarketcap.com/token/bsc/0xadcea94f46ce8a87b890d7da9a444b4a21811a76/',
                        bscScanUrl:
                          'https://bscscan.com/token/0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                      }),
                      subtitle: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Endereço do Contrato do Token (Código que será copiado)
              </label>
              <input
                type="text"
                value={content.tokenSection?.contractAddress || '0xadcea94f46ce8a87b890d7da9a444b4a21811a76'}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    tokenSection: {
                      ...(prev.tokenSection || {
                        enabled: true,
                        badge: '🟢 Gráfico em Tempo Real',
                        title: 'Acompanhe a Cotação do Token BXS',
                        subtitle:
                          'Monitoramento ao vivo de preço, liquidez e negociações descentralizadas na rede Binance Smart Chain (BSC).',
                        tokenSymbol: 'BXS',
                        tokenName: 'BXSignals Token',
                        network: 'BNB Smart Chain (BEP-20)',
                        contractAddress: '0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                        copyButtonText: 'copie o contrato da BXS',
                        chartProvider: 'geckoterminal',
                        embedUrl:
                          'https://www.geckoterminal.com/bsc/pools/0xd4ad1ce50f942f2f036f1f759ff3eb785d77a7a2e71db52849a37ad28e4295ab?embed=1&info=0&swaps=0&grayscale=0&light_chart=0',
                        coinMarketCapUrl:
                          'https://dex.coinmarketcap.com/token/bsc/0xadcea94f46ce8a87b890d7da9a444b4a21811a76/',
                        bscScanUrl:
                          'https://bscscan.com/token/0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                      }),
                      contractAddress: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-mono text-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Ao clicar no botão "copie o contrato da BXS", este endereço exato será copiado para o dispositivo do visitante.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Link do CoinMarketCap DEX
              </label>
              <input
                type="url"
                value={
                  content.tokenSection?.coinMarketCapUrl ||
                  'https://dex.coinmarketcap.com/token/bsc/0xadcea94f46ce8a87b890d7da9a444b4a21811a76/'
                }
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    tokenSection: {
                      ...(prev.tokenSection || {
                        enabled: true,
                        badge: '🟢 Gráfico em Tempo Real',
                        title: 'Acompanhe a Cotação do Token BXS',
                        subtitle:
                          'Monitoramento ao vivo de preço, liquidez e negociações descentralizadas na rede Binance Smart Chain (BSC).',
                        tokenSymbol: 'BXS',
                        tokenName: 'BXSignals Token',
                        network: 'BNB Smart Chain (BEP-20)',
                        contractAddress: '0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                        copyButtonText: 'copie o contrato da BXS',
                        chartProvider: 'geckoterminal',
                        embedUrl:
                          'https://www.geckoterminal.com/bsc/pools/0xd4ad1ce50f942f2f036f1f759ff3eb785d77a7a2e71db52849a37ad28e4295ab?embed=1&info=0&swaps=0&grayscale=0&light_chart=0',
                        coinMarketCapUrl:
                          'https://dex.coinmarketcap.com/token/bsc/0xadcea94f46ce8a87b890d7da9a444b4a21811a76/',
                        bscScanUrl:
                          'https://bscscan.com/token/0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                      }),
                      coinMarketCapUrl: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Link do BSCScan (Explorador)
              </label>
              <input
                type="url"
                value={
                  content.tokenSection?.bscScanUrl ||
                  'https://bscscan.com/token/0xadcea94f46ce8a87b890d7da9a444b4a21811a76'
                }
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    tokenSection: {
                      ...(prev.tokenSection || {
                        enabled: true,
                        badge: '🟢 Gráfico em Tempo Real',
                        title: 'Acompanhe a Cotação do Token BXS',
                        subtitle:
                          'Monitoramento ao vivo de preço, liquidez e negociações descentralizadas na rede Binance Smart Chain (BSC).',
                        tokenSymbol: 'BXS',
                        tokenName: 'BXSignals Token',
                        network: 'BNB Smart Chain (BEP-20)',
                        contractAddress: '0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                        copyButtonText: 'copie o contrato da BXS',
                        chartProvider: 'geckoterminal',
                        embedUrl:
                          'https://www.geckoterminal.com/bsc/pools/0xd4ad1ce50f942f2f036f1f759ff3eb785d77a7a2e71db52849a37ad28e4295ab?embed=1&info=0&swaps=0&grayscale=0&light_chart=0',
                        coinMarketCapUrl:
                          'https://dex.coinmarketcap.com/token/bsc/0xadcea94f46ce8a87b890d7da9a444b4a21811a76/',
                        bscScanUrl:
                          'https://bscscan.com/token/0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
                      }),
                      bscScanUrl: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: CTA & FOOTER */}
      {activeTab === 'cta' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-base font-bold text-white">Banner Final de CTA & Rodapé</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Título do Banner Final
              </label>
              <input
                type="text"
                value={content.ctaBanner.title}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    ctaBanner: { ...prev.ctaBanner, title: e.target.value },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Badge de Urgência
              </label>
              <input
                type="text"
                value={content.ctaBanner.urgencyBadge || ''}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    ctaBanner: { ...prev.ctaBanner, urgencyBadge: e.target.value },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Texto Legal do Rodapé (Conformidade LGPD)
              </label>
              <textarea
                rows={2}
                value={content.footer.legalText}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    footer: { ...prev.footer, legalText: e.target.value },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: DEFAULTS */}
      {activeTab === 'defaults' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-base font-bold text-white">Destinos Padrão da Matriz</h2>
          <p className="text-xs text-slate-400">
            Utilizados na página principal (/) ou como substitutos caso algum parceiro ainda não tenha cadastrado seus dados pessoais.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Link Padrão de Cadastro da Matriz
              </label>
              <input
                type="url"
                value={content.defaultSettings.registrationUrl}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    defaultSettings: {
                      ...prev.defaultSettings,
                      registrationUrl: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                WhatsApp Padrão da Matriz
              </label>
              <input
                type="tel"
                value={content.defaultSettings.whatsappNumber}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    defaultSettings: {
                      ...prev.defaultSettings,
                      whatsappNumber: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      <LivePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        content={content}
        testUsers={testUsers}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        versions={versions}
        currentVersionNumber={versions.find((v) => v.status === 'published')?.version_number || 1}
        testUsers={testUsers}
        onRestored={(newVer) => {
          onPublished(newVer);
          setHistoryModalOpen(false);
        }}
      />
    </div>
  );
}
