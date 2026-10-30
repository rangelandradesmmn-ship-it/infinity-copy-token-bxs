'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Users,
  VolumeX,
  Trash2,
  Send,
  Clock,
  CheckCheck,
  Pin,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Search,
  AlertCircle,
  Check,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import {
  ChatMessage,
  ChatSettings,
  UserChatRestriction,
  UserWithSettings,
  ChatParticipant,
} from '@/types';
import {
  getChatSettings,
  updateChatSettings,
  getChatMessages,
  sendChatMessage,
  deleteChatMessage,
  muteUser,
  unmuteUser,
  getMutedUsers,
  markPrivateMessagesAsRead,
  pinChatMessage,
  clearPublicChat,
  recordAdminHeartbeat,
  getAdminPresenceStatus,
  getActiveChatParticipants,
} from '@/lib/dataService';
import { renderTextWithLinks } from '@/components/landing/LandingChatWidget';

interface AdminChatModerationProps {
  currentAdmin: UserWithSettings;
}

export function AdminChatModeration({ currentAdmin }: AdminChatModerationProps) {
  const [activeTab, setActiveTab] = useState<'public' | 'private' | 'participants' | 'muted'>('public');

  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [presence, setPresence] = useState<{ isOnline: boolean; manualOverride: 'auto' | 'online' | 'offline' }>({
    isOnline: true,
    manualOverride: 'auto',
  });

  const [publicMessages, setPublicMessages] = useState<ChatMessage[]>([]);
  const [privateMessages, setPrivateMessages] = useState<ChatMessage[]>([]);
  const [mutedUsers, setMutedUsers] = useState<UserChatRestriction[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');

  // Selected private conversation
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [publicInputText, setPublicInputText] = useState('');
  const [pinTextInput, setPinTextInput] = useState('');
  const [isEditingPin, setIsEditingPin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load chat and moderation data
  const loadData = useCallback(async () => {
    try {
      // Record heartbeat
      recordAdminHeartbeat(currentAdmin.id, true);

      const [s, pres, pub, priv, mList, pList] = await Promise.all([
        getChatSettings(),
        getAdminPresenceStatus(),
        getChatMessages({ type: 'public', includeDeleted: true }),
        getChatMessages({ type: 'private' }),
        getMutedUsers(),
        getActiveChatParticipants(),
      ]);

      setSettings(s);
      setPresence(pres);
      setPublicMessages(pub);
      setPrivateMessages(priv);
      setMutedUsers(mList);
      setParticipants(pList);

      if (s.pinnedMessage && !pinTextInput) {
        setPinTextInput(s.pinnedMessage);
      }
    } catch (err) {
      console.error('Error loading moderation data:', err);
    }
  }, [currentAdmin.id, pinTextInput]);

  // Periodic polling & Heartbeat
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Automatically mark conversation as read when selected
  useEffect(() => {
    if (selectedVisitorId && activeTab === 'private') {
      markPrivateMessagesAsRead(selectedVisitorId, currentAdmin.id).then(() => {
        loadData();
      });
    }
  }, [selectedVisitorId, activeTab, currentAdmin.id, loadData]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Change manual presence override
  const handleSetOverride = async (mode: 'auto' | 'online' | 'offline') => {
    setLoading(true);
    try {
      await updateChatSettings({ manualOverride: mode }, currentAdmin.id);
      await loadData();
      showFeedback('success', `Modo de presença alterado para: ${mode.toUpperCase()}`);
    } catch {
      showFeedback('error', 'Falha ao alterar status de presença.');
    } finally {
      setLoading(false);
    }
  };

  // Delete message
  const handleDelete = async (msgId: string) => {
    if (!confirm('Deseja realmente remover esta mensagem do chat?')) return;
    await deleteChatMessage(msgId, currentAdmin.id);
    await loadData();
    showFeedback('success', 'Mensagem removida com sucesso!');
  };

  // Mute user
  const handleMute = async (userId: string, userName: string) => {
    if (userId === currentAdmin.id) return;
    const reason = prompt(`Motivo do silenciamento para ${userName}:`, 'Comportamento inadequado no chat');
    if (reason === null) return;

    await muteUser(userId, userName, currentAdmin.id, reason);
    await loadData();
    showFeedback('success', `Usuário ${userName} silenciado (modo somente leitura).`);
  };

  // Unmute user
  const handleUnmute = async (userId: string, userName: string) => {
    await unmuteUser(userId, currentAdmin.id);
    await loadData();
    showFeedback('success', `Silenciamento de ${userName} removido com sucesso.`);
  };

  // Save pinned message
  const handleSavePin = async () => {
    await updateChatSettings({ pinnedMessage: pinTextInput.trim() }, currentAdmin.id);
    setIsEditingPin(false);
    await loadData();
    showFeedback('success', 'Aviso fixado atualizado no chat.');
  };

  // Clear public chat
  const handleClearChat = async () => {
    if (!confirm('ATENÇÃO: Deseja realmente limpar todas as mensagens do bate-papo geral?')) return;
    await clearPublicChat(currentAdmin.id);
    await loadData();
    showFeedback('success', 'Bate-papo geral reiniciado com sucesso.');
  };

  // Send admin reply in private DM
  const handleSendPrivateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitorId || !replyText.trim()) return;

    try {
      const targetUserMessages = privateMessages.filter(
        (m) => m.sender_id === selectedVisitorId || m.recipient_id === selectedVisitorId
      );
      const recipientName =
        targetUserMessages.find((m) => m.sender_id === selectedVisitorId)?.sender_name || 'Usuário';

      const res = await sendChatMessage({
        sender_id: currentAdmin.id,
        sender_name: `${currentAdmin.name} (Super Admin)`,
        sender_role: 'admin',
        content: replyText.trim(),
        type: 'private',
        recipient_id: selectedVisitorId,
        recipient_name: recipientName,
      });

      if (res.success) {
        setReplyText('');
        await markPrivateMessagesAsRead(selectedVisitorId, currentAdmin.id);
        await loadData();
        showFeedback('success', 'Mensagem privada enviada com sucesso!');
      } else {
        showFeedback('error', res.error || 'Erro ao enviar resposta.');
      }
    } catch {
      showFeedback('error', 'Erro ao enviar mensagem.');
    }
  };

  // Send admin public announcement in public chat
  const handleSendPublic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicInputText.trim()) return;

    try {
      const res = await sendChatMessage({
        sender_id: currentAdmin.id,
        sender_name: `${currentAdmin.name} (Super Admin)`,
        sender_role: 'admin',
        content: publicInputText.trim(),
        type: 'public',
      });

      if (res.success) {
        setPublicInputText('');
        await loadData();
        showFeedback('success', 'Mensagem enviada no bate-papo geral!');
      }
    } catch {
      showFeedback('error', 'Falha ao enviar mensagem.');
    }
  };

  // Group private messages by visitor/user
  const privateThreads = React.useMemo(() => {
    const map = new Map<
      string,
      {
        visitorId: string;
        visitorName: string;
        lastMessage: ChatMessage;
        unreadCount: number;
        messages: ChatMessage[];
      }
    >();

    privateMessages.forEach((m) => {
      // Identifier of the other party (not currentAdmin)
      const otherId = m.sender_id === currentAdmin.id ? m.recipient_id || 'unknown' : m.sender_id;
      const otherName =
        m.sender_id === currentAdmin.id ? m.recipient_name || 'Usuário' : m.sender_name;

      if (!map.has(otherId)) {
        map.set(otherId, {
          visitorId: otherId,
          visitorName: otherName,
          lastMessage: m,
          unreadCount: 0,
          messages: [],
        });
      }

      const thread = map.get(otherId)!;
      thread.messages.push(m);
      if (new Date(m.created_at) > new Date(thread.lastMessage.created_at)) {
        thread.lastMessage = m;
      }
      if (m.sender_id === otherId && m.read_status === 'pending') {
        thread.unreadCount++;
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );
  }, [privateMessages, currentAdmin.id]);

  const selectedThread = privateThreads.find((t) => t.visitorId === selectedVisitorId);
  const totalPendingDMs = privateThreads.reduce((acc, t) => acc + t.unreadCount, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
      {/* HEADER & PRESENCE CONTROL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Gestão & Moderação do Chat Online
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                presence.isOnline
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  presence.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              {presence.isOnline ? 'BATE-PAPO LIBERADO (ONLINE)' : 'CHAT GERAL BLOQUEADO (OFFLINE)'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Controle a presença do administrador, delete mensagens, silencie usuários e responda chamados privados.
          </p>
        </div>

        {/* Presence Mode Buttons */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold shrink-0">
          <span className="text-[11px] text-slate-400 px-2 hidden sm:inline">Controle:</span>
          <button
            type="button"
            onClick={() => handleSetOverride('auto')}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              presence.manualOverride === 'auto'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Liberado automaticamente enquanto você estiver conectado"
          >
            Automático (Logado)
          </button>
          <button
            type="button"
            onClick={() => handleSetOverride('online')}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              presence.manualOverride === 'online'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Forçar status online permanentemente"
          >
            Forçar Online
          </button>
          <button
            type="button"
            onClick={() => handleSetOverride('offline')}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              presence.manualOverride === 'offline'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Forçar status offline (bloqueia o bate-papo geral para visitantes)"
          >
            Forçar Offline
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {feedback.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* QUICK ACTIONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-300">Ações Rápidas:</span>
          <button
            type="button"
            onClick={() => setIsEditingPin(!isEditingPin)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Pin className="w-3.5 h-3.5 text-purple-400" />
            <span>{isEditingPin ? 'Fechar Edição' : 'Fixar Aviso no Chat'}</span>
          </button>

          <button
            type="button"
            onClick={handleClearChat}
            className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-medium flex items-center gap-1.5 border border-red-800/60 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Bate-Papo Geral</span>
          </button>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Atualizar dados do chat"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* PIN EDIT INPUT BOX */}
      {isEditingPin && (
        <div className="p-4 bg-purple-950/30 border border-purple-800/40 rounded-2xl space-y-3">
          <label className="block text-xs font-bold text-purple-300">
            Texto do Aviso Fixado no Topo do Chat:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={pinTextInput}
              onChange={(e) => setPinTextInput(e.target.value)}
              placeholder="Ex: Reunião diária às 20h na nossa sala do Google Meet!"
              className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={handleSavePin}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
            >
              Salvar Aviso
            </button>
          </div>
        </div>
      )}

      {/* MODERATION TABS */}
      <div className="flex border-b border-slate-800 gap-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('public')}
          className={`flex items-center gap-2 px-4 py-3 rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'public'
              ? 'border-purple-500 text-white bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-purple-400" />
          <span>Bate-Papo Geral ({publicMessages.filter((m) => !m.is_deleted).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('private')}
          className={`flex items-center gap-2 px-4 py-3 rounded-t-xl transition-colors border-b-2 relative ${
            activeTab === 'private'
              ? 'border-purple-500 text-white bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span>Mensagens Privadas & Chamados ({privateThreads.length})</span>
          {totalPendingDMs > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
              {totalPendingDMs} pendentes
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('participants')}
          className={`flex items-center gap-2 px-4 py-3 rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'participants'
              ? 'border-purple-500 text-white bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>Conectados no Chat ({participants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('muted')}
          className={`flex items-center gap-2 px-4 py-3 rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'muted'
              ? 'border-purple-500 text-white bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <VolumeX className="w-4 h-4 text-amber-400" />
          <span>Usuários Silenciados ({mutedUsers.length})</span>
        </button>
      </div>

      {/* TAB 1: BATE-PAPO GERAL */}
      {activeTab === 'public' && (
        <div className="space-y-4">
          {/* Post Message as Admin Box */}
          <form onSubmit={handleSendPublic} className="flex gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <input
              type="text"
              value={publicInputText}
              onChange={(e) => setPublicInputText(e.target.value)}
              placeholder="Enviar comunicado oficial no bate-papo geral como Super Admin..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={!publicInputText.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publicar</span>
            </button>
          </form>

          {/* Messages Feed */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {publicMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhuma mensagem no bate-papo geral.
              </div>
            ) : (
              publicMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl border transition-colors flex items-start justify-between gap-3 ${
                    msg.is_deleted
                      ? 'bg-slate-950/40 border-slate-900 opacity-60 text-slate-500'
                      : msg.sender_role === 'admin'
                      ? 'bg-purple-950/30 border-purple-800/40 text-purple-100'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-white">{msg.sender_name}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                          msg.sender_role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300'
                            : msg.sender_role === 'partner'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {msg.sender_role}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs leading-relaxed break-words">{renderTextWithLinks(msg.content, 'text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2 break-all')}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {!msg.is_deleted && (
                      <button
                        type="button"
                        onClick={() => handleDelete(msg.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Deletar mensagem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {msg.sender_role !== 'admin' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMute(msg.sender_id, msg.sender_name)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Silenciar usuário (Somente leitura)"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVisitorId(msg.sender_id);
                            setActiveTab('private');
                          }}
                          className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Abrir canal privado com este usuário"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MENSAGENS PRIVADAS & CHAMADOS */}
      {activeTab === 'private' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[460px]">
          {/* Thread List */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2 overflow-y-auto max-h-[460px]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1 mb-2">
              Conversas de Visitantes & Parceiros
            </span>

            {privateThreads.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                Nenhum chamado privado recebido até o momento.
              </div>
            ) : (
              privateThreads.map((thread) => {
                const isSelected = thread.visitorId === selectedVisitorId;
                return (
                  <button
                    key={thread.visitorId}
                    type="button"
                    onClick={() => setSelectedVisitorId(thread.visitorId)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-purple-950/60 border-purple-600 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate">{thread.visitorName}</span>
                      {thread.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">
                          {thread.unreadCount} nova(s)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{thread.lastMessage.content}</p>
                    <span className="text-[9px] text-slate-500 block mt-1">
                      {new Date(thread.lastMessage.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Active Conversation Detail */}
          <div className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between overflow-hidden">
            {selectedThread ? (
              <>
                {/* Header */}
                <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-xs border border-purple-500/40">
                      {selectedThread.visitorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{selectedThread.visitorName}</h4>
                      <span className="text-[10px] text-slate-400">ID: {selectedThread.visitorId}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleMute(selectedThread.visitorId, selectedThread.visitorName)}
                    className="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 text-xs font-semibold border border-amber-800/60 flex items-center gap-1"
                  >
                    <VolumeX className="w-3 h-3" />
                    <span>Silenciar</span>
                  </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[320px]">
                  {selectedThread.messages.map((m) => {
                    const isFromAdmin = m.sender_role === 'admin';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isFromAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                          <span className="font-semibold text-slate-300">{m.sender_name}</span>
                          <span>
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                            isFromAdmin
                              ? 'bg-purple-600 text-white rounded-tr-none'
                              : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                          }`}
                        >
                          {renderTextWithLinks(m.content, 'text-purple-300 hover:text-purple-100 font-semibold underline underline-offset-2 break-all')}
                        </div>

                        {/* Reading Status Indicator */}
                        <div className="flex items-center gap-1 text-[10px] mt-1 px-1">
                          {m.read_status === 'pending' ? (
                            <span className="text-amber-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Pendente de leitura</span>
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCheck className="w-3 h-3" />
                              <span>
                                Leitura realizada
                                {m.read_at &&
                                  ` às ${new Date(m.read_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}`}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendPrivateReply} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Responder para ${selectedThread.visitorName} no privado...`}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Responder</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center h-full">
                <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
                <span>Selecione uma conversa ao lado para visualizar e responder no privado.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CONECTADOS NO CHAT */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          {/* Header Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold block">Total Conectados</span>
              <span className="text-xl font-black text-white mt-1 block">{participants.length}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-emerald-400 font-semibold block">Admin Online</span>
              <span className="text-xl font-black text-emerald-400 mt-1 block">
                {presence.isOnline ? '🟢 Ativo' : '⚪ Offline'}
              </span>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-blue-400 font-semibold block">Parceiros</span>
              <span className="text-xl font-black text-blue-400 mt-1 block">
                {participants.filter((p) => p.role === 'partner').length}
              </span>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-purple-400 font-semibold block">Visitantes</span>
              <span className="text-xl font-black text-purple-400 mt-1 block">
                {participants.filter((p) => p.role === 'visitor').length}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={participantSearch}
              onChange={(e) => setParticipantSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail, WhatsApp ou perfil..."
              className="flex-1 bg-transparent text-white text-xs outline-none placeholder-slate-500"
            />
            {participantSearch && (
              <button
                type="button"
                onClick={() => setParticipantSearch('')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Participants Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            {participants.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhum participante conectado no momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {participants
                  .filter((p) => {
                    if (!participantSearch.trim()) return true;
                    const q = participantSearch.toLowerCase();
                    return (
                      p.name.toLowerCase().includes(q) ||
                      (p.email && p.email.toLowerCase().includes(q)) ||
                      (p.whatsapp && p.whatsapp.includes(q)) ||
                      p.role.toLowerCase().includes(q)
                    );
                  })
                  .map((p) => {
                    const isAdmin = p.role === 'admin';
                    const isPartner = p.role === 'partner';
                    const isMe = p.id === currentAdmin.id;

                    return (
                      <div
                        key={p.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-white text-sm">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                                p.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white truncate">{p.name}</span>
                              {isAdmin && (
                                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-extrabold border border-purple-500/30 text-[10px] flex items-center gap-1">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                  <span>SUPER ADMIN</span>
                                </span>
                              )}
                              {isPartner && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 text-[10px]">
                                  PARCEIRO CREDENCIADO
                                </span>
                              )}
                              {p.role === 'visitor' && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20 text-[10px]">
                                  VISITANTE IDENTIFICADO
                                </span>
                              )}
                              {isMe && (
                                <span className="text-[10px] text-purple-400 font-medium">
                                  (Sua Conta)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                              {p.email && (
                                <a
                                  href={`mailto:${p.email}`}
                                  className="flex items-center gap-1 hover:text-white transition-colors"
                                  title="Enviar e-mail"
                                >
                                  <Mail className="w-3 h-3 text-slate-500" />
                                  <span>{p.email}</span>
                                </a>
                              )}
                              {p.whatsapp && (
                                <a
                                  href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                                  title="Abrir WhatsApp Web"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{p.whatsapp}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                              <span className="text-slate-500">
                                {p.isOnline
                                  ? '🟢 Conectado agora'
                                  : `Visto em ${new Date(p.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions for Admin */}
                        {!isMe && (
                          <div className="flex items-center gap-2 shrink-0">
                            {p.whatsapp && (
                              <a
                                href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                title="Conversar no WhatsApp"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVisitorId(p.id);
                                setActiveTab('private');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              title="Abrir chamado privado no chat"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Privado</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                muteUser(p.id, p.name, currentAdmin.id);
                                loadData();
                              }}
                              className="p-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 transition-colors"
                              title="Silenciar usuário"
                            >
                              <VolumeX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: USUÁRIOS SILENCIADOS */}
      {activeTab === 'muted' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Usuários silenciados permanecem em <strong>modo somente leitura</strong>: podem ler as mensagens da sala, mas não têm permissão para enviar novas mensagens.
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            {mutedUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhum usuário silenciado no momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {mutedUsers.map((item) => (
                  <div key={item.userId} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{item.userName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({item.userId})</span>
                      </div>
                      <p className="text-[11px] text-amber-400 mt-0.5">Motivo: {item.reason}</p>
                      <span className="text-[10px] text-slate-500">
                        Silenciado em: {new Date(item.mutedAt).toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUnmute(item.userId, item.userName)}
                      className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Reativar Envio</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
