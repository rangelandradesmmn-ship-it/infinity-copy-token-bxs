'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Minimize2,
  Trash2,
  VolumeX,
  Clock,
  CheckCheck,
  Check,
  Pin,
  Lock,
  Unlock,
  ShieldAlert,
  Crown,
  Sparkles,
  Users,
  AlertCircle,
  HelpCircle,
  MessageCircle,
  ChevronDown,
  UserCheck,
  User,
  Mail,
  Phone,
  ArrowLeft,
  ExternalLink,
  Edit2,
  LogOut,
} from 'lucide-react';
import {
  ChatMessage,
  ChatSettings,
  UserWithSettings,
  ChatVisitorAuth,
  ChatParticipant,
} from '@/types';
import {
  getChatSettings,
  getChatMessages,
  sendChatMessage,
  deleteChatMessage,
  muteUser,
  isUserMuted,
  getAdminPresenceStatus,
  getCurrentSessionUser,
  markPrivateMessagesAsRead,
  recordAdminHeartbeat,
  getChatVisitorAuth,
  saveChatVisitorAuth,
  clearChatVisitorAuth,
  getActiveChatParticipants,
  recordChatParticipantPresence,
} from '@/lib/dataService';

interface LandingChatWidgetProps {
  customSettings?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    welcomeMessage?: string;
    pinnedMessage?: string;
  };
  currentUser?: UserWithSettings;
  mode?: 'floating' | 'embedded';
  defaultOpen?: boolean;
}

export function renderTextWithLinks(text: string, linkClass?: string) {
  if (!text) return null;

  // Regex to match URLs starting with http://, https://, www., or common services like meet.google.com, wa.me, t.me
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|meet\.google\.com\/[^\s]+|wa\.me\/[^\s]+|t\.me\/[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;

        const isUrl = /(https?:\/\/[^\s]+|www\.[^\s]+|meet\.google\.com\/[^\s]+|wa\.me\/[^\s]+|t\.me\/[^\s]+)/i.test(part);

        if (isUrl) {
          // Strip any trailing punctuation (like ! ? . , ;)
          const trailingMatch = part.match(/[.,!?;:]+$/);
          const trailing = trailingMatch ? trailingMatch[0] : '';
          const cleanUrl = trailing ? part.slice(0, -trailing.length) : part;

          let href = cleanUrl;
          if (!href.startsWith('http://') && !href.startsWith('https://')) {
            href = `https://${href}`;
          }

          return (
            <React.Fragment key={index}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  linkClass ||
                  'text-amber-300 hover:text-amber-100 font-bold underline underline-offset-2 break-all transition-colors inline-flex items-center gap-0.5'
                }
                onClick={(e) => e.stopPropagation()}
              >
                <span>{cleanUrl}</span>
                <ExternalLink className="w-3 h-3 inline shrink-0 opacity-80 ml-0.5" />
              </a>
              {trailing}
            </React.Fragment>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export function LandingChatWidget({
  customSettings,
  currentUser: initialUser,
  mode = 'floating',
  defaultOpen,
}: LandingChatWidgetProps) {
  const isEmbedded = mode === 'embedded';
  const isOutsidePanel = !isEmbedded;

  const [isOpen, setIsOpen] = useState(defaultOpen !== undefined ? defaultOpen : isEmbedded);
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');

  // Visitor identification
  const [visitorId, setVisitorId] = useState<string>('');
  const [visitorName, setVisitorName] = useState<string>(isEmbedded && initialUser ? initialUser.name : 'Visitante');
  const [isEditingName, setIsEditingName] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserWithSettings | null>(isEmbedded ? (initialUser || null) : null);

  // Mandatory identification for visitors outside the panel
  const [visitorAuth, setVisitorAuth] = useState<ChatVisitorAuth | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authWhatsapp, setAuthWhatsapp] = useState('');
  const [authError, setAuthError] = useState('');

  const isIdentified = isEmbedded ? Boolean(currentUser) : Boolean(visitorAuth);

  // Online Participants
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  // Chat Data
  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [publicMessages, setPublicMessages] = useState<ChatMessage[]>([]);
  const [privateMessages, setPrivateMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Target for admin DM
  const [adminTargetUserId, setAdminTargetUserId] = useState<string | null>(null);
  const [adminTargetUserName, setAdminTargetUserName] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const prevMessagesCountRef = useRef(0);
  const lastMsgIdRef = useRef<string | null>(null);

  // Initialize Visitor ID, Auth and Session
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isOutsidePanel) {
      // OUTSIDE PANEL (/ or /p/[slug]): Strictly enforce visitor authentication
      const savedAuth = getChatVisitorAuth();
      if (savedAuth) {
        setVisitorAuth(savedAuth);
        setVisitorId(savedAuth.id);
        setVisitorName(savedAuth.name);
        setAuthName(savedAuth.name);
        setAuthEmail(savedAuth.email);
        setAuthWhatsapp(savedAuth.whatsapp);
      } else {
        setVisitorAuth(null);
        let vId = localStorage.getItem('clonelp_visitor_id');
        if (!vId) {
          vId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          localStorage.setItem('clonelp_visitor_id', vId);
        }
        setVisitorId(vId);
        setVisitorName('Visitante');
      }
      // Never use admin/user session on public landing page chat
      setCurrentUser(null);
    } else {
      // INSIDE PANEL (/painel): Auto-authenticate logged-in partner/admin
      if (initialUser) {
        setCurrentUser(initialUser);
        setVisitorName(initialUser.name);
      } else {
        getCurrentSessionUser().then((user) => {
          if (user) {
            setCurrentUser(user);
            setVisitorName(user.name);
            if (user.role === 'admin') {
              recordAdminHeartbeat(user.id, true);
            }
          }
        });
      }
    }
  }, [isOutsidePanel, initialUser]);

  // Sync initialUser if updated externally in embedded mode
  useEffect(() => {
    if (isEmbedded && initialUser) {
      setCurrentUser(initialUser);
      setVisitorName(initialUser.name);
    }
  }, [isEmbedded, initialUser]);

  // Recurring heartbeat if admin is browsing this page
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      recordAdminHeartbeat(currentUser.id, true);
      const hb = setInterval(() => {
        recordAdminHeartbeat(currentUser.id, true);
      }, 15000);

      const handleUnload = () => {
        recordAdminHeartbeat(currentUser.id, false);
      };
      window.addEventListener('beforeunload', handleUnload);
      window.addEventListener('pagehide', handleUnload);

      return () => {
        clearInterval(hb);
        window.removeEventListener('beforeunload', handleUnload);
        window.removeEventListener('pagehide', handleUnload);
      };
    }
  }, [currentUser]);

  // Fetch settings, messages & participants
  const loadData = useCallback(async () => {
    const activeVisitorId = visitorAuth?.id || visitorId;
    if (!activeVisitorId && !currentUser?.id) return;

    try {
      const effectiveUserId = isEmbedded ? (currentUser?.id || activeVisitorId) : activeVisitorId;
      const [s, pub, priv, muted, presence, parts] = await Promise.all([
        getChatSettings(),
        getChatMessages({ type: 'public' }),
        getChatMessages({
          type: 'private',
          visitorId: activeVisitorId,
          userId: isEmbedded ? currentUser?.id : undefined,
        }),
        isUserMuted(effectiveUserId),
        getAdminPresenceStatus(),
        getActiveChatParticipants(),
      ]);

      const online = Boolean(
        (isEmbedded && currentUser?.role === 'admin') || presence.isOnline || s.adminOnline
      );

      setSettings({
        ...s,
        adminOnline: online,
      });
      setPublicMessages(pub);
      setPrivateMessages(priv);
      setIsMuted(muted);
      setParticipants(parts);

      // If user is admin in embedded mode, automatically mark user private messages as read when viewing them
      if (isEmbedded && currentUser?.role === 'admin' && adminTargetUserId) {
        await markPrivateMessagesAsRead(adminTargetUserId, currentUser.id);
      }
    } catch (err) {
      console.error('Failed to load chat data:', err);
    }
  }, [visitorId, visitorAuth, currentUser, adminTargetUserId, isEmbedded]);

  // Periodic heartbeat presence for current user / visitor
  useEffect(() => {
    if (!isOpen) return;

    const pulse = () => {
      if (currentUser) {
        recordChatParticipantPresence({
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role === 'admin' ? 'admin' : 'partner',
          email: currentUser.email,
          whatsapp: currentUser.settings?.whatsapp_number,
          isOnline: true,
          lastSeen: new Date().toISOString(),
        });
      } else if (visitorAuth) {
        recordChatParticipantPresence({
          id: visitorAuth.id,
          name: visitorAuth.name,
          role: 'visitor',
          email: visitorAuth.email,
          whatsapp: visitorAuth.whatsapp,
          isOnline: true,
          lastSeen: new Date().toISOString(),
        });
      }
    };

    pulse();
    const timer = setInterval(pulse, 20000);
    return () => clearInterval(timer);
  }, [isOpen, currentUser, visitorAuth]);

  // Initial load and periodic polling
  useEffect(() => {
    loadData();

    // Poll every 3.5s for fresh messages & admin presence
    const interval = setInterval(loadData, 3500);

    // Listen to storage events for instant multi-tab sync
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadData]);

  // Scroll to bottom safely within container without causing window viewport jump
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = chatContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    });
    isAtBottomRef.current = true;
    setShowScrollBottom(false);
  }, []);

  // Monitor user scrolling inside the chat to detect if they scrolled up to read history
  const handleContainerScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Considered at bottom if within 60px of the end
    const atBottom = distanceToBottom <= 60;
    isAtBottomRef.current = atBottom;
    setShowScrollBottom(!atBottom);
  }, []);

  // Reset scroll to bottom on tab switch or first open
  useEffect(() => {
    if (isOpen) {
      isAtBottomRef.current = true;
      setShowScrollBottom(false);
      const timer = setTimeout(() => {
        scrollToBottom('auto');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, scrollToBottom]);

  // Intelligent scroll on message changes: NEVER lock or yank the scrollbar if user scrolled up!
  useEffect(() => {
    if (!isOpen) return;

    const currentTabMessages = activeTab === 'public' ? publicMessages : privateMessages;
    const count = currentTabMessages.length;
    const latestMsg = count > 0 ? currentTabMessages[count - 1] : null;
    const latestId = latestMsg?.id || null;

    const hasNewMessage =
      count > prevMessagesCountRef.current ||
      (latestId !== null && latestId !== lastMsgIdRef.current);

    prevMessagesCountRef.current = count;
    lastMsgIdRef.current = latestId;

    // Only scroll automatically if user was already at the bottom
    if (isAtBottomRef.current) {
      scrollToBottom('smooth');
    } else if (hasNewMessage) {
      // User is reading older messages: keep their scroll intact and show jump button
      setShowScrollBottom(true);
    }
  }, [publicMessages, privateMessages, isOpen, activeTab, scrollToBottom]);

  // Save customized visitor name
  const handleSaveName = (newName: string) => {
    const clean = newName.trim();
    if (clean) {
      setVisitorName(clean);
      if (typeof window !== 'undefined') {
        localStorage.setItem('clonelp_visitor_name', clean);
      }
    }
    setIsEditingName(false);
  };

  // Handle mandatory visitor identification
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const cleanName = authName.trim();
    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanPhone = authWhatsapp.replace(/\D/g, '');

    if (cleanName.length < 2) {
      setAuthError('Por favor, informe seu nome completo.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setAuthError('Por favor, informe um e-mail válido.');
      return;
    }
    if (cleanPhone.length < 10) {
      setAuthError('Por favor, informe um WhatsApp válido com DDD (mínimo 10 dígitos).');
      return;
    }

    const saved = saveChatVisitorAuth({
      name: cleanName,
      email: cleanEmail,
      whatsapp: cleanPhone,
      id: visitorId,
    });

    setVisitorAuth(saved);
    setVisitorName(saved.name);
    setVisitorId(saved.id);
    setShowAuthModal(false);
    loadData();
  };

  const handleClearAuth = () => {
    clearChatVisitorAuth();
    setVisitorAuth(null);
    setVisitorName('Visitante');
    setAuthName('');
    setAuthEmail('');
    setAuthWhatsapp('');
    loadData();
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;
    setErrorMsg('');

    // Require visitor identification if outside the panel
    if (isOutsidePanel && !visitorAuth) {
      setAuthError('Por favor, identifique-se com Nome, E-mail e WhatsApp para enviar mensagens.');
      setShowAuthModal(true);
      return;
    }

    const senderRole = isEmbedded
      ? (currentUser?.role === 'admin' ? 'admin' : 'partner')
      : 'visitor';

    const senderId = isEmbedded
      ? (currentUser?.id || 'partner')
      : (visitorAuth?.id || visitorId);

    const senderName = isEmbedded
      ? (currentUser?.name || 'Parceiro')
      : (visitorAuth?.name || 'Visitante');

    setSending(true);

    try {
      const res = await sendChatMessage({
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        content: inputText,
        type: activeTab,
        recipient_id:
          activeTab === 'private'
            ? senderRole === 'admin'
              ? adminTargetUserId || undefined
              : 'admin'
            : undefined,
        recipient_name:
          activeTab === 'private'
            ? senderRole === 'admin'
              ? adminTargetUserName || 'Usuário'
              : 'Super Admin'
            : undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Não foi possível enviar a mensagem.');
      } else {
        setInputText('');
        isAtBottomRef.current = true;
        setShowScrollBottom(false);
        await loadData();
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
    } catch {
      setErrorMsg('Erro inesperado ao enviar mensagem.');
    } finally {
      setSending(false);
    }
  };

  // Admin: Delete message
  const handleDeleteMessage = async (msgId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (!confirm('Deseja realmente deletar esta mensagem do chat?')) return;
    await deleteChatMessage(msgId, currentUser.id);
    await loadData();
  };

  // Admin: Mute user
  const handleMuteUser = async (targetId: string, targetName: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (targetId === currentUser.id) return;
    if (!confirm(`Deseja silenciar "${targetName}"? O usuário ficará em modo somente leitura.`)) return;
    await muteUser(targetId, targetName, currentUser.id);
    await loadData();
  };

  // Admin: Direct Message user
  const handleOpenAdminDM = (targetId: string, targetName: string) => {
    setAdminTargetUserId(targetId);
    setAdminTargetUserName(targetName);
    setActiveTab('private');
  };

  if (customSettings?.enabled === false) {
    return null;
  }

  const isAdminOnline = Boolean(settings?.adminOnline);
  const unreadPrivateCount = privateMessages.filter(
    (m) =>
      m.type === 'private' &&
      (m.recipient_id === currentUser?.id || m.recipient_id === visitorId) &&
      m.read_status === 'pending'
  ).length;

  const currentTabMessages = activeTab === 'public' ? publicMessages : privateMessages;
  const pinnedMsg = settings?.pinnedMessage || customSettings?.pinnedMessage;

  return (
    <>
      {/* FLOATING TRIGGER BUTTON (ONLY IN FLOATING MODE) */}
      {!isEmbedded && !isOpen && (
        <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
              isAdminOnline
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-emerald-950/60 border border-emerald-400/40'
                : 'bg-slate-900 text-slate-200 border border-slate-700/80 hover:border-slate-500 shadow-black/80'
            }`}
          >
            {/* Status Beacon Dot */}
            <span className="relative flex h-3 w-3">
              {isAdminOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isAdminOnline ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              ></span>
            </span>

            <MessageSquare className="w-5 h-5 text-white" />

            <div className="text-left">
              <span className="block text-xs font-bold leading-tight">
                {isAdminOnline ? 'Bate-Papo & Suporte' : 'Chat & Suporte'}
              </span>
              <span className="block text-[10px] text-slate-300">
                {isAdminOnline ? '🟢 Admin Online' : '⚪ Mensagem Privada'}
              </span>
            </div>

            {/* Unread badge */}
            {unreadPrivateCount > 0 && (
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-black animate-bounce shadow-lg">
                {unreadPrivateCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* CHAT WINDOW (FLOATING OR EMBEDDED) */}
      {isOpen && (
        <div
          className={
            isEmbedded
              ? 'w-full h-[620px] sm:h-[660px] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden'
              : 'fixed bottom-5 right-5 z-50 w-[94vw] sm:w-[410px] h-[580px] max-h-[85vh] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200'
          }
        >
          {/* HEADER */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
                  isAdminOnline ? 'bg-emerald-600' : 'bg-purple-600'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                  <span>{customSettings?.title || settings?.title || 'Bate-papo da Comunidade'}</span>
                </h3>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      isAdminOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  <span className={isAdminOnline ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                    {isAdminOnline ? 'Moderação Online (Liberado)' : 'Admin Offline (Apenas Privado)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowParticipantsModal(!showParticipantsModal)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
                  showParticipantsModal
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
                }`}
                title="Ver quem está conectado no chat"
              >
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Online ({participants.length})</span>
              </button>

              {isEmbedded ? (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] font-semibold text-purple-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span>Painel</span>
                </div>
              ) : (
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                    title="Minimizar chat"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                    title="Fechar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TAB SELECTOR */}
          <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-2 shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('public')}
              className={`flex-1 py-1.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'public'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Bate-papo Geral</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('private')}
              className={`flex-1 py-1.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors relative ${
                activeTab === 'private'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Privado com Admin</span>
              {unreadPrivateCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-400 absolute top-1.5 right-2" />
              )}
            </button>
          </div>

          {/* USER NAME BAR / ROLE BADGE / VISITOR PILL */}
          {isOutsidePanel ? (
            visitorAuth ? (
              <div className="px-4 py-2 bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border-b border-purple-800/40 flex items-center justify-between text-xs text-purple-200 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate text-xs">
                    Logado como: <strong className="text-white font-bold">{visitorAuth.name}</strong> ({visitorAuth.whatsapp})
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthName(visitorAuth.name);
                      setAuthEmail(visitorAuth.email);
                      setAuthWhatsapp(visitorAuth.whatsapp);
                      setAuthError('');
                      setShowAuthModal(true);
                    }}
                    className="text-xs text-purple-300 hover:text-white font-semibold underline transition-colors"
                    title="Trocar dados de identificação"
                  >
                    Trocar
                  </button>
                  <span className="text-purple-600 font-bold">|</span>
                  <button
                    type="button"
                    onClick={handleClearAuth}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold underline transition-colors"
                    title="Desconectar do chat"
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            ) : null
          ) : (
            <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <span>Painel do Parceiro:</span>
                <span className="font-bold text-blue-400 flex items-center gap-1">
                  {currentUser?.role === 'admin' && <Crown className="w-3 h-3 text-amber-400 inline" />}
                  <span>{currentUser?.name || 'Parceiro'}</span>
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {currentUser?.role === 'admin' ? 'Super Admin' : 'Parceiro'}
              </span>
            </div>
          )}

          {/* PINNED ANNOUNCEMENT (IF ANY) */}
          {pinnedMsg && activeTab === 'public' && (
            <div className="p-2.5 bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border-b border-purple-800/40 flex items-start gap-2 shrink-0 text-xs text-purple-200">
              <Pin className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] font-medium leading-relaxed">
                <span className="font-bold text-amber-300 mr-1">[Fixado]:</span>
                {renderTextWithLinks(
                  pinnedMsg,
                  'text-amber-300 hover:text-amber-100 font-bold underline underline-offset-2 break-all transition-colors inline-flex items-center gap-0.5'
                )}
              </div>
            </div>
          )}

          {/* MESSAGE LIST BODY */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            {/* OVERLAY: PARTICIPANTES CONECTADOS */}
            {showParticipantsModal && (
              <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Conectados no Chat ({participants.length})
                      </h4>
                      <p className="text-[10px] text-slate-400">Tempo real nos últimos minutos</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowParticipantsModal(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-3 space-y-2">
                  {participants.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      Nenhum participante conectado no momento.
                    </div>
                  ) : (
                    participants.map((p) => {
                      const isMe =
                        (currentUser?.id && p.id === currentUser.id) ||
                        (visitorAuth?.id && p.id === visitorAuth.id);
                      const isAdmin = p.role === 'admin';
                      const isPartner = p.role === 'partner';

                      return (
                        <div
                          key={p.id}
                          className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 ${
                            isMe
                              ? 'bg-purple-950/40 border-purple-500/40'
                              : 'bg-slate-900/80 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                              {p.isOnline && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              )}
                              <span
                                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                  p.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                                }`}
                              ></span>
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-white truncate">
                                  {p.name} {isMe && '(Você)'}
                                </span>
                                {isAdmin && (
                                  <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-extrabold border border-purple-500/30 text-[9px]">
                                    ADMIN
                                  </span>
                                )}
                                {isPartner && (
                                  <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 text-[9px]">
                                    PARCEIRO
                                  </span>
                                )}
                                {p.role === 'visitor' && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium border border-slate-700 text-[9px]">
                                    VISITANTE
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {p.isOnline ? '🟢 Online agora' : '⚪ Offline'}
                              </span>
                            </div>
                          </div>

                          {/* Actions if Super Admin is viewing */}
                          {currentUser?.role === 'admin' && p.role !== 'admin' && (
                            <div className="flex items-center gap-1 shrink-0">
                              {p.whatsapp && (
                                <a
                                  href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-400 text-xs"
                                  title="Chamar no WhatsApp"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  handleOpenAdminDM(p.id, p.name);
                                  setShowParticipantsModal(false);
                                }}
                                className="p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-300 text-xs"
                                title="Chamar no Privado"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* OVERLAY: MODAL DE IDENTIFICAÇÃO DO VISITANTE */}
            {showAuthModal && (
              <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md flex flex-col p-5 justify-center animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Identifique-se para Conversar</h4>
                      <p className="text-[10px] text-slate-400">Rápido, seguro e liberado imediatamente</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                  {authError && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                      {authError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Seu Nome Completo *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="Ex: Carlos Silva"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Seu E-mail *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      WhatsApp com DDD *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={authWhatsapp}
                        onChange={(e) => setAuthWhatsapp(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirmar e Entrar no Chat</span>
                    </button>
                    {visitorAuth && (
                      <button
                        type="button"
                        onClick={handleClearAuth}
                        className="px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold"
                        title="Desconectar dados"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            <div
              ref={chatContainerRef}
              onScroll={handleContainerScroll}
              className="flex-1 min-h-0 p-4 overflow-y-auto overscroll-contain space-y-3.5 text-xs"
            >
            {/* PUBLIC TAB NOTICE WHEN ADMIN OFFLINE */}
            {activeTab === 'public' && !isAdminOnline && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-amber-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Bate-Papo Coletivo em Espera</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  O bate-papo geral ao vivo entre todos os usuários fica liberado quando o{' '}
                  <strong className="text-white">Administrador</strong> estiver conectado.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('private')}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Mandar Mensagem no Privado do Admin</span>
                </button>
              </div>
            )}

            {/* PRIVATE TAB INTRO */}
            {activeTab === 'private' && (
              <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-purple-200 text-[11px] leading-relaxed">
                <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                  <span>Canal Privado com a Administração</span>
                </div>
                Envie suas dúvidas diretamente para o Super Admin. Mesmo quando ele estiver offline,
                sua mensagem fica salva e com acompanhamento de leitura em tempo real.
              </div>
            )}

            {/* MESSAGES */}
            {currentTabMessages.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Nenhuma mensagem por aqui ainda. Seja o primeiro a falar!
              </div>
            ) : (
              currentTabMessages.map((msg) => {
                const isMe =
                  (currentUser?.id && msg.sender_id === currentUser.id) ||
                  msg.sender_id === visitorId;
                const isAdminMsg = msg.sender_role === 'admin';
                const isPartnerMsg = msg.sender_role === 'partner';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {/* Header info */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                      <span className="font-bold text-slate-300">{msg.sender_name}</span>

                      {isAdminMsg && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-extrabold border border-purple-500/30 text-[9px]">
                          ADMIN
                        </span>
                      )}
                      {isPartnerMsg && (
                        <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 text-[9px]">
                          PARCEIRO
                        </span>
                      )}

                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {/* Super Admin Inline Actions */}
                      {currentUser?.role === 'admin' && (
                        <div className="hidden group-hover:flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-slate-800"
                            title="Deletar mensagem"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          {msg.sender_role !== 'admin' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleMuteUser(msg.sender_id, msg.sender_name)}
                                className="p-1 text-amber-400 hover:text-amber-300 rounded hover:bg-slate-800"
                                title="Silenciar usuário (Somente leitura)"
                              >
                                <VolumeX className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenAdminDM(msg.sender_id, msg.sender_name)}
                                className="p-1 text-purple-400 hover:text-purple-300 rounded hover:bg-slate-800"
                                title="Chamar usuário no Privado"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-xs break-words shadow-md ${
                        isMe
                          ? 'bg-purple-600 text-white rounded-tr-none'
                          : isAdminMsg
                          ? 'bg-gradient-to-r from-purple-950 to-slate-900 border border-purple-800/60 text-purple-100 rounded-tl-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {renderTextWithLinks(
                        msg.content,
                        isMe
                          ? 'text-purple-100 hover:text-white font-semibold underline underline-offset-2 break-all inline-flex items-center gap-0.5'
                          : 'text-purple-300 hover:text-purple-100 font-semibold underline underline-offset-2 break-all inline-flex items-center gap-0.5'
                      )}
                    </div>

                    {/* Status for Private Messages */}
                    {msg.type === 'private' && isMe && (
                      <div className="flex items-center gap-1 text-[10px] mt-1 px-1 text-slate-400">
                        {msg.read_status === 'pending' ? (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Clock className="w-3 h-3" />
                            <span>Pendente de leitura</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <CheckCheck className="w-3 h-3" />
                            <span>
                              Leitura realizada
                              {msg.read_at &&
                                ` às ${new Date(msg.read_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}`}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            </div>

            {/* FLOATING "SCROLL TO BOTTOM" PILL */}
            {showScrollBottom && (
              <button
                type="button"
                onClick={() => scrollToBottom('smooth')}
                className="absolute bottom-3 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 hover:bg-purple-600 text-slate-200 hover:text-white border border-slate-700/80 shadow-2xl text-[11px] font-semibold backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95"
                title="Rolar para as mensagens mais recentes"
              >
                <ChevronDown className="w-3.5 h-3.5 text-purple-400 group-hover:text-white" />
                <span>Rolar para o fim</span>
              </button>
            )}
          </div>

          {/* ERROR ALERT */}
          {errorMsg && (
            <div className="px-4 py-2 bg-red-950/90 border-t border-red-500/40 text-red-300 text-xs flex items-center justify-between">
              <span className="truncate">{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg('')}
                className="text-red-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* INPUT FORM */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
            {isMuted && currentUser?.role !== 'admin' ? (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <VolumeX className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  Você foi colocado em modo somente leitura pela moderação e não pode enviar novas mensagens.
                </span>
              </div>
            ) : isOutsidePanel && !visitorAuth ? (
              <div className="p-4 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 rounded-2xl text-center space-y-2.5 shadow-xl shadow-purple-950/50">
                <div className="flex items-center justify-center gap-2 text-purple-300 text-xs font-extrabold uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>Identificação Obrigatória para Participar</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  Para conversar no bate-papo coletivo ou enviar dúvidas privadas ao Administrador, identifique-se com seu Nome, E-mail e WhatsApp.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError('');
                    setShowAuthModal(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/60 transition-all active:scale-95 hover:scale-[1.01]"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Identificar-me Agora</span>
                </button>
              </div>
            ) : activeTab === 'public' && !isAdminOnline && (isEmbedded ? currentUser?.role !== 'admin' : true) ? (
              <div className="text-center py-2 text-xs text-slate-400">
                <span>Bate-papo geral bloqueado. Alterne para a aba </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('private')}
                  className="text-purple-400 font-bold underline hover:text-purple-300"
                >
                  Privado com Admin
                </button>
                <span> para enviar sua mensagem.</span>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    activeTab === 'public'
                      ? 'Digite sua mensagem no bate-papo...'
                      : 'Mensagem privada para o Administrador...'
                  }
                  maxLength={500}
                  className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs outline-none focus:border-purple-500 transition-colors"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md active:scale-95 shrink-0"
                  title="Enviar mensagem"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
