'use client';

import React, { useState } from 'react';
import { LandingPageVersion, UserWithSettings } from '@/types';
import { restoreLandingPageVersion } from '@/lib/dataService';
import { LivePreviewModal } from './LivePreviewModal';
import {
  History,
  RotateCcw,
  Eye,
  CheckCircle2,
  Calendar,
  User,
  X,
  AlertCircle,
  Loader2,
  Layers,
  Sparkles,
} from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: LandingPageVersion[];
  currentVersionNumber: number;
  testUsers: UserWithSettings[];
  onRestored: (newVersionNumber: number) => void;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  versions,
  currentVersionNumber,
  testUsers,
  onRestored,
}: VersionHistoryModalProps) {
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [previewVersion, setPreviewVersion] = useState<LandingPageVersion | null>(null);

  if (!isOpen) return null;

  const handleRestore = async (version: LandingPageVersion) => {
    if (version.version_number === currentVersionNumber) {
      alert('Esta já é a versão publicada ativa.');
      return;
    }

    if (
      !confirm(
        `Restaurar o modelo da Versão #${version.version_number}?\n\nEssa ação publicará esse modelo globalmente e sincronizará todas as páginas dos parceiros (/p/[slug]), mantendo 100% dos dados pessoais de cada usuário (nome, foto, link de cadastro e WhatsApp).`
      )
    ) {
      return;
    }

    setRestoringId(version.id);
    setFeedback(null);
    try {
      const res = await restoreLandingPageVersion(version.id, 'admin-uuid-0001');
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        onRestored(res.versionNumber);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao restaurar versão.',
      });
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Histórico de Versões da Landing Page</h2>
              <p className="text-xs text-slate-400">
                Visualize versões publicadas anteriormente e restaure quando necessário.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="px-6 pt-4">
            <div
              className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          </div>
        )}

        {/* Versions Timeline List */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {versions.map((ver) => {
            const isCurrent = ver.version_number === currentVersionNumber;
            const heroTitle = ver.content_json?.hero?.title || 'Sem título';
            const brandColor = ver.content_json?.brand?.primaryColor || '#2563eb';
            const videoCount = ver.content_json?.videosSection?.videos?.length || 0;

            return (
              <div
                key={ver.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-purple-950/20 border-purple-500/50 shadow-lg shadow-purple-950/20'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-white">
                        Versão #{ver.version_number}
                      </span>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ativa no Ar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
                          Histórico
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 font-medium">
                      Título do Hero: &ldquo;{heroTitle}&rdquo;
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {ver.published_at
                          ? new Date(ver.published_at).toLocaleString('pt-BR')
                          : new Date(ver.created_at).toLocaleString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" /> {videoCount} vídeos cadastrados
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: brandColor }}
                        />
                        Cor primária
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewVersion(ver)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>Prévia</span>
                    </button>

                    {!isCurrent && (
                      <button
                        type="button"
                        disabled={restoringId === ver.id}
                        onClick={() => handleRestore(ver)}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-purple-950/40 disabled:opacity-50"
                      >
                        {restoringId === ver.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        <span>Restaurar Esta Versão</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-400">
          <p>
            ℹ️ A restauração de qualquer versão anterior substitui apenas o modelo central (Master). Os dados individuais de cada usuário permanecem 100% seguros e inalterados.
          </p>
        </div>
      </div>

      {/* Live Preview Modal for historical version */}
      {previewVersion && (
        <LivePreviewModal
          isOpen={Boolean(previewVersion)}
          onClose={() => setPreviewVersion(null)}
          content={previewVersion.content_json}
          testUsers={testUsers}
        />
      )}
    </div>
  );
}
