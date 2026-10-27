'use client';

import React, { useEffect } from 'react';

const OLD_DOMAIN = 'infinity-copy-token-bxs.vercel.app';
const NEW_DOMAIN = 'infinitycopy-gra.vercel.app';

export function DomainSyncBridge() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;

    // -------------------------------------------------------------
    // SCENARIO 1: User is visiting the OLD domain
    // Migrate their local data and redirect them to the NEW domain
    // -------------------------------------------------------------
    if (hostname === OLD_DOMAIN) {
      try {
        const users = localStorage.getItem('clonelp_users');
        const settings = localStorage.getItem('clonelp_settings');
        const passwords = localStorage.getItem('clonelp_passwords');
        const sessionUser = localStorage.getItem('clonelp_current_user_id');

        const payload = {
          users: users ? JSON.parse(users) : null,
          settings: settings ? JSON.parse(settings) : null,
          passwords: passwords ? JSON.parse(passwords) : null,
          sessionUser: sessionUser || null,
        };

        const hasCustomData =
          (payload.users && payload.users.length > 0) ||
          (payload.settings && Object.keys(payload.settings).length > 0) ||
          payload.sessionUser;

        const targetPath = window.location.pathname + window.location.search;

        if (hasCustomData) {
          const serialized = encodeURIComponent(
            btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
          );
          window.location.replace(
            `https://${NEW_DOMAIN}/migrar?data=${serialized}&redirect=${encodeURIComponent(targetPath)}`
          );
        } else {
          // Direct forward to the new official domain
          window.location.replace(`https://${NEW_DOMAIN}${targetPath}`);
        }
      } catch (err) {
        console.warn('Old domain migration error:', err);
        window.location.replace(`https://${NEW_DOMAIN}${window.location.pathname}`);
      }
      return;
    }

    // -------------------------------------------------------------
    // SCENARIO 2: User is visiting the NEW domain
    // Pull any prior data from the old domain via an invisible iframe bridge
    // -------------------------------------------------------------
    if (hostname === NEW_DOMAIN || hostname === 'localhost') {
      const alreadySynced = localStorage.getItem('clonelp_synced_from_old_domain');
      if (alreadySynced === 'true') return;

      const handleMessage = (event: MessageEvent) => {
        if (!event.origin.includes(OLD_DOMAIN)) return;

        if (event.data && event.data.type === 'CLONELP_STORAGE_EXPORT') {
          const exportData = event.data.payload;
          if (exportData) {
            try {
              // 1. Merge users
              if (exportData.users && Array.isArray(exportData.users)) {
                const currentUsersStr = localStorage.getItem('clonelp_users');
                const currentUsers = currentUsersStr ? JSON.parse(currentUsersStr) : [];
                const currentMap = new Map(currentUsers.map((u: any) => [u.id, u]));

                exportData.users.forEach((u: any) => {
                  if (!currentMap.has(u.id)) {
                    currentUsers.push(u);
                  }
                });
                localStorage.setItem('clonelp_users', JSON.stringify(currentUsers));
              }

              // 2. Merge settings
              if (exportData.settings) {
                const currentSettingsStr = localStorage.getItem('clonelp_settings');
                const currentSettings = currentSettingsStr ? JSON.parse(currentSettingsStr) : {};
                Object.assign(currentSettings, exportData.settings);
                localStorage.setItem('clonelp_settings', JSON.stringify(currentSettings));
              }

              // 3. Merge passwords
              if (exportData.passwords) {
                const currentPasswordsStr = localStorage.getItem('clonelp_passwords');
                const currentPasswords = currentPasswordsStr ? JSON.parse(currentPasswordsStr) : {};
                Object.assign(currentPasswords, exportData.passwords);
                localStorage.setItem('clonelp_passwords', JSON.stringify(currentPasswords));
              }

              // 4. Restore session if empty
              if (exportData.sessionUser && !localStorage.getItem('clonelp_current_user_id')) {
                localStorage.setItem('clonelp_current_user_id', exportData.sessionUser);
              }

              localStorage.setItem('clonelp_synced_from_old_domain', 'true');
              console.log('Dados do domínio anterior sincronizados com sucesso.');
            } catch (err) {
              console.error('Failed to import data from bridge:', err);
            }
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Create hidden bridge iframe
      const iframe = document.createElement('iframe');
      iframe.src = `https://${OLD_DOMAIN}/bridge`;
      iframe.style.display = 'none';
      iframe.title = 'Domain Sync Bridge';
      document.body.appendChild(iframe);

      return () => {
        window.removeEventListener('message', handleMessage);
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      };
    }
  }, []);

  return null;
}
