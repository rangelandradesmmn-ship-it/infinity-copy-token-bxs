'use client';

import { useEffect } from 'react';

const NEW_DOMAIN = 'https://infinitycopy-gra.vercel.app';

export default function BridgePage() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

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

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'CLONELP_STORAGE_EXPORT',
            payload,
          },
          '*'
        );
      }
    } catch (err) {
      console.warn('Bridge export failed:', err);
    }
  }, []);

  return null;
}
