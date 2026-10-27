'use client';

import React from 'react';
import { LandingPageContent } from '@/types';
import { VideoPlayer } from '@/components/ui/VideoPlayer';

interface VideosSectionProps {
  videosSection: LandingPageContent['videosSection'];
}

export function VideosSection({ videosSection }: VideosSectionProps) {
  if (!videosSection.enabled || !videosSection.videos.length) return null;

  return (
    <section className="py-16 md:py-24 bg-slate-900 border-t border-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
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
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {video.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
