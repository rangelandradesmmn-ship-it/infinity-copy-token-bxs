'use client';

import React, { useState, useEffect } from 'react';
import { LandingPageContent, UserWithSettings, TokenRewardSettings, VideoItem } from '@/types';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import { VideoShareModal } from './VideoShareModal';
import { Share2, Coins, Sparkles } from 'lucide-react';

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(landingUrl || window.location.href);
    }
  }, [landingUrl]);

  if (!videosSection.enabled || !videosSection.videos.length) return null;

  const isSharingActive =
    tokenRewardSettings?.isSharingEnabled !== false &&
    (tokenRewardSettings?.tokenStock ?? 5000) > 0;

  const rewardPerShare = tokenRewardSettings?.rewardPerShare || 1;

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {videosSection.videos.map((video) => (
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
                <h3 className="text-lg font-bold text-white mb-1">{video.title}</h3>
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
                      isSharingActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{isSharingActive ? 'Compartilhar Vídeo' : 'Estoque Esgotado'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
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
        />
      )}
    </section>
  );
}
