'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserWithSettings, UserMetrics } from '@/types';
import {
  getUserById,
  getUserMetrics,
  getCurrentSessionUserId,
  setCurrentSessionUserId,
  getAllUsers,
} from '@/lib/dataService';
import { UserMetricsCards } from '@/components/user/UserMetricsCards';
import { PersonalizationForm } from '@/components/user/PersonalizationForm';
import { EasyShareModal } from '@/components/user/EasyShareModal';
import {
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Share2,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  LogOut,
  User,
  Users,
  Settings,
  Sparkles,
  QrCode,
} from 'lucide-react';

export default function UserPanelPage() {
  const [currentUser, setCurrentUser] = useState<UserWithSettings | null>(null);
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [allUsers, setAllUsers] = useState<UserWithSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [origin, setOrigin] = useState('');

  // Read current origin on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const loadUserData = async (userId: string) => {
    setLoading(true);
    try {
      const u = await getUserById(userId);
      const m = await getUserMetrics(userId);
      const all = await getAllUsers();
      setCurrentUser(u);
      setMetrics(m);
      setAllUsers(all);
    } catch (err) {
      console.error('Failed to load user in panel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const sessionUserId = getCurrentSessionUserId();
    // Default to João Silva for standard user experience if session is admin
    const targetUserId =
      sessionUserId === 'admin-uuid-0001' ? 'user-uuid-0001' : sessionUserId;
    loadUserData(targetUserId);
  }, []);

  // Switch demo user
  const handleSwitchUser = (userId: string) => {
    setCurrentSessionUserId(userId);
    loadUserData(userId);
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-medium">Carregando seu painel exclusivo...</p>
      </div>
    );
  }

  const landingUrl = `${origin}/p/${currentUser.slug}`;
  const isBlocked = currentUser.status === 'blocked';

  // Copy URL to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(landingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // WhatsApp share link
  const shareMessage = `Olá! Conheça minha página exclusiva e veja todos os detalhes oficiais da nossa plataforma: ${landingUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-extrabold">
                N
              </div>
              <span className="hidden sm:inline">NextScale</span>
            </Link>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Painel do Parceiro
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* User Switcher for Instant Testing */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <span className="text-slate-400 px-2 flex items-center gap-1">
                <Users className="w-3 h-3" /> Testar como:
              </span>
              {allUsers
                .filter((u) => u.role !== 'admin')
                .map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSwitchUser(u.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      currentUser.id === u.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {u.name.split(' ')[0]} {u.status === 'blocked' ? '(Bloqueado)' : ''}
                  </button>
                ))}
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-800 hover:bg-purple-900/60 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Super Admin</span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome & Status Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-800 border-2 border-emerald-500 flex items-center justify-center shrink-0 shadow-lg">
              {currentUser.settings?.profile_image_url ? (
                <Image
                  src={currentUser.settings.profile_image_url}
                  alt={currentUser.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-slate-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  Olá, {currentUser.name}!
                </h1>
                {isBlocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                    <ShieldAlert className="w-3 h-3" /> Bloqueado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <ShieldCheck className="w-3 h-3" /> Conta Ativa
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                E-mail: {currentUser.email} &bull; Membro desde{' '}
                {new Date(currentUser.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="text-right flex flex-col items-center md:items-end">
            <span className="text-xs text-slate-400">Última atualização pessoal</span>
            <span className="text-sm font-semibold text-slate-300">
              {currentUser.settings?.updated_at
                ? new Date(currentUser.settings.updated_at).toLocaleString('pt-BR')
                : 'Hoje'}
            </span>
          </div>
        </div>

        {/* Exclusive Public URL Box (Requirement 5.2) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                Sua URL Exclusiva de Divulgação
              </h2>
            </div>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Sincronizada com o Master
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mb-5">
            Compartilhe este link com seus contatos. Todos os botões de cadastro e contato do WhatsApp na sua página levarão para seus dados pessoais.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* URL input */}
            <div className="w-full flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-blue-400 truncate select-all">
              {landingUrl}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-300" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              <a
                href={landingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-md"
              >
                <span>Abrir Minha Página</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors shadow-md shadow-purple-950/40"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartilhar & QR Code</span>
              </button>

              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-md"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Real-time Metrics (Requirement 5.2) */}
        {metrics && (
          <section>
            <h2 className="text-base font-bold text-white mb-4">
              Desempenho da Sua Página
            </h2>
            <UserMetricsCards metrics={metrics} />
          </section>
        )}

        {/* Allowed Personalization Form (Requirement 5.3) */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">
              Personalização da Sua Página
            </h2>
            <p className="text-xs text-slate-400">
              Edite exclusivamente os quatro campos abaixo autorizados pelo Super Admin.
            </p>
          </div>

          <PersonalizationForm
            user={currentUser}
            onSaved={(updated) => {
              setCurrentUser(updated);
            }}
          />
        </section>
      </main>

      {/* Feature 3: Compartilhamento Fácil Modal */}
      <EasyShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        landingUrl={landingUrl}
        userName={currentUser.name}
      />
    </div>
  );
}
