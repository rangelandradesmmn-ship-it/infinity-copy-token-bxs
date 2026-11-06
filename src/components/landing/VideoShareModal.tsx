'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { VideoItem, UserWithSettings, TokenRewardSettings } from '@/types';
import {
  recordVideoShareVerification,
  getCurrentSessionUser,
  getChatVisitorAuth,
  canUserShareVideoToday,
} from '@/lib/dataService';
import {
  Share2,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  Coins,
  Send,
  MessageCircle,
  Sparkles,
  Lock,
} from 'lucide-react';

interface VideoShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoItem;
  landingUrl: string;
  user?: UserWithSettings;
  rewardSettings?: TokenRewardSettings;
  onShareCompleted?: () => void;
}

export function VideoShareModal({
  isOpen,
  onClose,
  video,
  landingUrl,
  user,
  rewardSettings,
  onShareCompleted,
}: VideoShareModalProps) {
  const [postUrl, setPostUrl] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [alreadySharedToday, setAlreadySharedToday] = useState(false);
  const [checkingDailyShare, setCheckingDailyShare] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function checkDaily() {
      setCheckingDailyShare(true);
      try {
        let uId = user?.id;
        let uEmail = user?.email;
        if (!uId) {
          const session = await getCurrentSessionUser();
          if (session) {
            uId = session.id;
            uEmail = session.email;
          } else {
            const visitor = getChatVisitorAuth();
            if (visitor) {
              uId = visitor.id;
              uEmail = visitor.email;
            }
          }
        }
        if (!uEmail && visitorEmail.trim()) {
          uEmail = visitorEmail.trim();
        }

        if (uId || uEmail) {
          const check = await canUserShareVideoToday({
            userId: uId,
            userEmail: uEmail,
            videoId: video.id,
            videoTitle: video.title,
          });
          if (isMounted) {
            setAlreadySharedToday(!check.canShare);
          }
        } else {
          if (isMounted) setAlreadySharedToday(false);
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setCheckingDailyShare(false);
      }
    }

    if (isOpen) {
      checkDaily();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, user, video, visitorEmail]);

  if (!isOpen) return null;

  const isStockDepleted =
    rewardSettings?.tokenStock !== undefined
      ? rewardSettings.tokenStock <= 0
      : false || rewardSettings?.isSharingEnabled === false;
  const rewardAmount = rewardSettings?.rewardPerShare || 1;

  // Share text and links
  const shareText = `Confira esse vídeo oficial da Infinity Copy: "${video.title}"! Acesse agora: ${landingUrl}`;
  const encodedShareText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(landingUrl);

  const socialChannels = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      url: `https://api.whatsapp.com/send?text=${encodedShareText}`,
    },
    {
      name: 'Facebook',
      icon: Share2,
      color: 'bg-blue-600 hover:bg-blue-500 text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'X (Twitter)',
      icon: Send,
      color: 'bg-neutral-800 hover:bg-neutral-700 text-white',
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(video.title)}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-sky-600 hover:bg-sky-500 text-white',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(video.title)}`,
    },
    {
      name: 'LinkedIn',
      icon: Share2,
      color: 'bg-blue-700 hover:bg-blue-600 text-white',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(landingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleVerifySubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (isStockDepleted) {
      setFeedback({
        type: 'error',
        message: 'O estoque de recompensas está esgotado ou temporariamente pausado pela administração.',
      });
      return;
    }

    if (alreadySharedToday) {
      setFeedback({
        type: 'error',
        message:
          'Este vídeo já foi compartilhado por você hoje! Só é permitido compartilhar 1 vez cada vídeo da galeria por dia (liberado novamente à meia-noite). Compartilhe os outros vídeos disponíveis na galeria para continuar acumulando Tokens BXS.',
      });
      return;
    }

    if (!postUrl.trim()) {
      setFeedback({
        type: 'error',
        message: 'Por favor, informe a URL da sua publicação pública.',
      });
      return;
    }

    // Determine target user
    let targetUserId = user?.id;
    let targetUserName = user?.name;
    let targetUserEmail = user?.email;

    if (!targetUserId) {
      const session = await getCurrentSessionUser();
      if (session) {
        targetUserId = session.id;
        targetUserName = session.name;
        targetUserEmail = session.email;
      } else {
        const visitor = getChatVisitorAuth();
        if (visitor) {
          targetUserId = visitor.id;
          targetUserName = visitor.name;
          targetUserEmail = visitor.email;
        }
      }
    }

    // If still no user, require name and email
    if (!targetUserId) {
      if (!visitorName.trim() || !visitorEmail.trim()) {
        setFeedback({
          type: 'error',
          message: 'Por favor, informe seu Nome e E-mail para creditarmos seu Token BXS.',
        });
        return;
      }
      targetUserId = `vis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      targetUserName = visitorName.trim();
      targetUserEmail = visitorEmail.trim();
    }

    setSubmitting(true);
    try {
      const res = await recordVideoShareVerification({
        userId: targetUserId,
        userName: targetUserName,
        userEmail: targetUserEmail,
        videoId: video.id,
        videoTitle: video.title,
        postUrl: postUrl.trim(),
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setPostUrl('');
        setAlreadySharedToday(true);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
        if (onShareCompleted) onShareCompleted();
      } else {
        if (res.message && res.message.includes('já foi compartilhado por você hoje')) {
          setAlreadySharedToday(true);
        }
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Erro ao validar compartilhamento. Tente novamente mais tarde.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Programa de Recompensas BXS
              </span>
            </div>
            <h3 className="text-lg font-bold text-white leading-tight">
              Compartilhar Vídeo & Ganhar Tokens
            </h3>
          </div>
        </div>

        {/* Reward Alert Box */}
        {isStockDepleted ? (
          <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs mb-5 flex items-start gap-3">
            <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">Estoque de Recompensas Temporariamente Esgotado</p>
              <p className="mt-0.5 text-rose-300/90 leading-relaxed">
                Todos os tokens do lote promocional foram distribuídos. Você ainda pode compartilhar o vídeo com seus amigos, mas novas recompensas estão pausadas até que o administrador recarregue o estoque.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-indigo-500/10 border border-amber-500/30 text-amber-200 text-xs mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-black">
                +1
              </div>
              <p className="text-xs text-slate-300">
                Ganhe <strong className="text-amber-400">{rewardAmount} Token BXS</strong> por postagem pública comprovada!
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
              Disponível
            </span>
          </div>
        )}

        {/* Video Info */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 mb-5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Vídeo Selecionado:
          </span>
          <p className="text-sm font-bold text-white truncate">{video.title}</p>
        </div>

        {/* Already Shared Today Notice */}
        {alreadySharedToday && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs mb-5 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Vídeo Já Compartilhado Hoje</p>
              <p className="mt-1 text-slate-300 leading-relaxed">
                Você já compartilhou este vídeo hoje e garantiu sua recompensa! Só é permitido compartilhar <strong>1 vez cada vídeo da galeria por dia</strong>.
              </p>
              <p className="mt-1 text-emerald-400 font-medium">
                ⏰ Novos compartilhamentos liberados todos os dias à <strong>meia-noite (00:00)</strong>.
              </p>
              <p className="mt-2 text-amber-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Que tal compartilhar os outros vídeos disponíveis na galeria para continuar ganhando BXS hoje?
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Social Networks */}
        <div className="space-y-3 mb-6">
          <label className="block text-xs font-bold text-slate-200">
            Passo 1: Escolha onde compartilhar nas suas redes:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {socialChannels.map((c) => {
              const Icon = c.icon;
              return (
                <a
                  key={c.name}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-3 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${c.color} active:scale-95`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{c.name}</span>
                </a>
              );
            })}
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
            >
              {copiedLink ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
          </div>
        </div>

        {/* Step 2: Proof of Share (URL input) */}
        <form onSubmit={handleVerifySubmission} className="space-y-4 pt-4 border-t border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              Passo 2: Comprove sua Publicação em Modo Público
            </label>
            <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
              Após publicar em modo <strong>Público</strong> no Facebook, Instagram, X (Twitter), LinkedIn, TikTok ou YouTube, cole o link direto da postagem abaixo:
            </p>
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              disabled={isStockDepleted || submitting}
              placeholder="Ex: https://www.facebook.com/seu.perfil/posts/123456789"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50"
            />
          </div>

          {/* If visitor is not identified, ask for name and email */}
          {!user && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  disabled={isStockDepleted || submitting}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Seu E-mail
                </label>
                <input
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  disabled={isStockDepleted || submitting}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <span className="leading-relaxed">{feedback.message}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isStockDepleted || submitting || !postUrl.trim() || alreadySharedToday}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                alreadySharedToday
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-80'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/40 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando publicação...</span>
                </>
              ) : alreadySharedToday ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Já Compartilhado Hoje (Liberado à meia-noite)</span>
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  <span>Validar & Creditar 1 BXS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
