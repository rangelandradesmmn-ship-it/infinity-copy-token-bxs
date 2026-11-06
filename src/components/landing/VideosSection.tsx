'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LandingPageContent, UserWithSettings, TokenRewardSettings, VideoItem, VideoShareRecord } from '@/types';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import { VideoShareModal } from './VideoShareModal';
import {
  getUserTodayShares,
  getCurrentSessionUser,
  getChatVisitorAuth,
} from '@/lib/dataService';
import { Share2, Coins, Sparkles, CheckCircle, Clock } from 'lucide-react';

interface VideosSectionProps {
  videosSection: LandingPageContent['videosSection'];
  user?: UserWithSettings;
  tokenRewardSettings?: TokenRewardSettings;
  landingUrl?: string;
}

export function VideosSection({
  videosSection,
  user,
  tokenRewardSettings,
  landingUrl,
}: VideosSectionProps) {
  const [sharingVideo, setSharingVideo] = useState<VideoItem | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [todayShares, setTodayShares] = useState<VideoShareRecord[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(landingUrl || window.location.href);
    }
  }, [landingUrl]);

  const loadTodayShares = useCallback(async () => {
    try {
      let uId = user?.id;
      let uEmail = user?.email;
      if (!uId) {
        const session = await getCurrentSessionUser();
        if (session) {
          uId = session.id;
          uEmail = session.email;
        } else {
          const visitor = getChatVisitorAuth();
          if (visitor) {
            uId = visitor.id;
            uEmail = visitor.email;
          }
        }
      }
      if (uId || uEmail) {
        const shares = await getUserTodayShares(uId || uEmail || '');
        setTodayShares(shares);
      }
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    loadTodayShares();
  }, [loadTodayShares]);

  if (!videosSection.enabled || !videosSection.videos.length) return null;

  const isSharingActive =
    tokenRewardSettings?.isSharingEnabled !== false &&
    (tokenRewardSettings?.tokenStock ?? 5000) > 0;

  const rewardPerShare = tokenRewardSettings?.rewardPerShare || 1;
  const totalGalleryVideos = videosSection.videos.length;
  const sharedCountToday = videosSection.videos.filter((v) =>
    todayShares.some(
      (s) =>
        s.videoId === v.id ||
        (v.title && s.videoTitle && s.videoTitle.trim().toLowerCase() === v.title.trim().toLowerCase())
    )
  ).length;
  const maxDailyBxs = totalGalleryVideos * rewardPerShare;

  return (
    <section className="py-16 md:py-24 bg-slate-900 border-t border-slate-800 text-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Compartilhe & Ganhe Recompensas</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4">
            {videosSection.title}
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            {videosSection.subtitle}
          </p>
        </div>

        {/* Daily Share Progress & Midnight Renewal Banner */}
        <div className="max-w-2xl mx-auto mb-10 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-lg text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-xs sm:text-sm">
                  Progresso Diário: {sharedCountToday} de {totalGalleryVideos} vídeos compartilhados hoje
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Limite: 1 compartilhamento por vídeo ao dia • Ganhe até {maxDailyBxs} BXS/dia
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-semibold self-start sm:self-auto shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span>Renova à meia-noite (00:00)</span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-900 h-2 rounded-full mt-3 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${totalGalleryVideos > 0 ? (sharedCountToday / totalGalleryVideos) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {videosSection.videos.map((video) => {
            const isSharedToday = todayShares.some(
              (s) =>
                s.videoId === video.id ||
                (video.title &&
                  s.videoTitle &&
                  s.videoTitle.trim().toLowerCase() === video.title.trim().toLowerCase())
            );

            return (
              <div
                key={video.id}
                className="flex flex-col bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition duration-200"
              >
                <VideoPlayer
                  url={video.url}
                  title={video.title}
                  aspectRatio={video.aspectRatio}
                  badge={video.badge}
                />
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white truncate">{video.title}</h3>
                    {isSharedToday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Hoje ✅
                      </span>
                    )}
                  </div>
                  {video.description && (
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">
                      {video.description}
                    </p>
                  )}

                  {/* Share to Earn BXS Button */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>+{rewardPerShare} Token BXS</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSharingVideo(video)}
                      disabled={!isSharingActive}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                        !isSharingActive
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                          : isSharedToday
                          ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 cursor-pointer active:scale-95'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer active:scale-95'
                      }`}
                    >
                      {isSharedToday ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Compartilhado hoje ✅</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{isSharingActive ? 'Compartilhar Vídeo' : 'Estoque Esgotado'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {sharingVideo && (
        <VideoShareModal
          isOpen={!!sharingVideo}
          onClose={() => setSharingVideo(null)}
          video={sharingVideo}
          landingUrl={currentUrl || (typeof window !== 'undefined' ? window.location.href : 'https://infinitycopy.pro')}
          user={user}
          rewardSettings={tokenRewardSettings}
          onShareCompleted={loadTodayShares}
        />
      )}
    </section>
  );
}
