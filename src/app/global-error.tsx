'use client';

import React, { useEffect } from 'react';
import { RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Detect ChunkLoadError or new deployment on Vercel
    const msg = (error?.message || '').toLowerCase();
    const isChunkError =
      msg.includes('chunk') ||
      msg.includes('dynamically imported module') ||
      msg.includes('loading chunk') ||
      msg.includes('failed to fetch') ||
      msg.includes('networkerror');

    if (isChunkError) {
      // Automatic soft reload to pull fresh deployment chunks without user friction
      console.warn('Nova versão do sistema detectada. Atualizando componentes...', error);
      window.location.reload();
    }
  }, [error]);

  return (
    <html lang="pt-BR" className="h-full bg-slate-950 text-slate-100">
      <head>
        <title>Atualização de Sistema — Infinity Copy</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-200 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 shadow-xl">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Atualização de Sistema Detectada
        </h1>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Uma nova versão da plataforma foi sincronizada. Clique no botão abaixo para recarregar o sistema com os componentes mais recentes.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-purple-950/40 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recarregar Página Agora</span>
          </button>

          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-sm transition-colors cursor-pointer"
          >
            Tentar Novamente
          </button>

          <a
            href="/admin"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-sm flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Painel Administrativo</span>
          </a>
        </div>
      </body>
    </html>
  );
}
