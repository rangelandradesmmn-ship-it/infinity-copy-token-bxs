'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';

function MigrarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Sincronizando dados com o novo domínio oficial...');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const dataParam = searchParams.get('data');
      const redirectParam = searchParams.get('redirect') || '/painel';

      if (dataParam) {
        const decoded = JSON.parse(
          decodeURIComponent(escape(atob(decodeURIComponent(dataParam))))
        );

        if (decoded) {
          // 1. Merge users
          if (decoded.users && Array.isArray(decoded.users)) {
            const currentUsersStr = localStorage.getItem('clonelp_users');
            const currentUsers = currentUsersStr ? JSON.parse(currentUsersStr) : [];
            const map = new Map(currentUsers.map((u: any) => [u.id, u]));
            decoded.users.forEach((u: any) => {
              if (!map.has(u.id)) {
                currentUsers.push(u);
              }
            });
            localStorage.setItem('clonelp_users', JSON.stringify(currentUsers));
          }

          // 2. Merge settings
          if (decoded.settings) {
            const currentSettingsStr = localStorage.getItem('clonelp_settings');
            const currentSettings = currentSettingsStr ? JSON.parse(currentSettingsStr) : {};
            Object.assign(currentSettings, decoded.settings);
            localStorage.setItem('clonelp_settings', JSON.stringify(currentSettings));
          }

          // 3. Merge passwords
          if (decoded.passwords) {
            const currentPasswordsStr = localStorage.getItem('clonelp_passwords');
            const currentPasswords = currentPasswordsStr ? JSON.parse(currentPasswordsStr) : {};
            Object.assign(currentPasswords, decoded.passwords);
            localStorage.setItem('clonelp_passwords', JSON.stringify(currentPasswords));
          }

          // 4. Set session user
          if (decoded.sessionUser) {
            localStorage.setItem('clonelp_current_user_id', decoded.sessionUser);
          }

          localStorage.setItem('clonelp_synced_from_old_domain', 'true');
        }
      }

      setStatus('Dados sincronizados com sucesso! Redirecionando...');
      setTimeout(() => {
        router.replace(redirectParam);
      }, 500);
    } catch (err) {
      console.error('Migration error:', err);
      router.replace('/painel');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <h1 className="text-lg font-bold text-white mb-2">{status}</h1>
      <p className="text-xs text-slate-400 max-w-sm">
        Transferindo sua sessão e personalizações do domínio anterior para o endereço definitivo da Infinity Copy.
      </p>
    </div>
  );
}

export default function MigrarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500 mb-2" />
          <span>Carregando migração...</span>
        </div>
      }
    >
      <MigrarContent />
    </Suspense>
  );
}
