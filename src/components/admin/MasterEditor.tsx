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
} from 'lucide-react';

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
    'brand' | 'hero' | 'videos' | 'benefits' | 'consultant' | 'testimonials' | 'faq' | 'cta' | 'defaults'
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
                placeholder="Ex: Minha Empresa Digital, NextScale Ecosystem, Vital Cosméticos..."
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
