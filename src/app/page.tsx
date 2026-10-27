'use client';

import React, { useEffect, useState } from 'react';
import { LandingPageContent } from '@/types';
import { getPublishedLandingPage } from '@/lib/dataService';
import { LandingRenderer } from '@/components/landing/LandingRenderer';
import { initialLandingPageContent } from '@/data/defaultLandingPage';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const [content, setContent] = useState<LandingPageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getPublishedLandingPage();
        setContent(res.content);
      } catch (err) {
        console.error('Failed to load published landing page:', err);
        setContent(initialLandingPageContent);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !content) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-medium">Carregando Landing Page Oficial...</p>
      </div>
    );
  }

  return <LandingRenderer content={content} />;
}
