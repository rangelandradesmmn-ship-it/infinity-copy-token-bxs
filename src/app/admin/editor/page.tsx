'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LandingPageContent, LandingPageVersion, UserWithSettings } from '@/types';
import {
  getDraftLandingPage,
  getLandingPageVersions,
  getAllUsers,
} from '@/lib/dataService';
import { MasterEditor } from '@/components/admin/MasterEditor';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function AdminEditorPage() {
  const [content, setContent] = useState<LandingPageContent | null>(null);
  const [versions, setVersions] = useState<LandingPageVersion[]>([]);
  const [users, setUsers] = useState<UserWithSettings[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [draftRes, vers, usrs] = await Promise.all([
        getDraftLandingPage(),
        getLandingPageVersions(),
        getAllUsers(),
      ]);
      setContent(draftRes.content);
      setVersions(vers);
      setUsers(usrs);
    } catch (err) {
      console.error('Failed to load editor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !content) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
        <p className="text-sm font-medium">Carregando Editor Master...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-sm sm:text-base font-bold text-white">
              Edição do Modelo Oficial da Landing Page
            </h1>
          </div>
        </header>

        <main className="p-6 overflow-y-auto">
          <MasterEditor
            initialContent={content}
            versions={versions}
            testUsers={users}
            onPublished={() => {
              loadData();
            }}
          />
        </main>
      </div>
    </div>
  );
}
