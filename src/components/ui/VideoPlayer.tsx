'use client';

import React from 'react';
import { AspectRatio } from '@/types';
import { Play } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title: string;
  aspectRatio?: AspectRatio;
  badge?: string;
  className?: string;
}

export function VideoPlayer({
  url,
  title,
  aspectRatio = '16:9',
  badge,
  className = '',
}: VideoPlayerProps) {
  // Convert standard YouTube watch URL to embed URL
  const getEmbedUrl = (rawUrl: string): string => {
    if (!rawUrl) return '';
    try {
      if (rawUrl.includes('youtube.com/watch')) {
        const urlObj = new URL(rawUrl);
        const v = urlObj.searchParams.get('v');
        return v ? `https://www.youtube.com/embed/${v}?rel=0&modestbranding=1` : rawUrl;
      }
      if (rawUrl.includes('youtu.be/')) {
        const id = rawUrl.split('youtu.be/')[1]?.split('?')[0];
        return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : rawUrl;
      }
      if (rawUrl.includes('vimeo.com/')) {
        const id = rawUrl.split('vimeo.com/')[1]?.split('?')[0];
        return id ? `https://player.vimeo.com/video/${id}` : rawUrl;
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  };

  const embedUrl = getEmbedUrl(url);
  const isVertical = aspectRatio === '9:16';

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl ${className}`}>
      {badge && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 bg-black/75 backdrop-blur-md rounded-full text-xs font-semibold text-white tracking-wide border border-white/10">
          <Play className="w-3 h-3 text-red-500 fill-red-500" />
          <span>{badge}</span>
        </div>
      )}

      <div
        className={`relative w-full ${
          isVertical ? 'aspect-[9/16] max-w-[340px] mx-auto' : 'aspect-video'
        }`}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full border-0 rounded-2xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <Play className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-medium">Nenhum vídeo configurado</p>
          </div>
        )}
      </div>
    </div>
  );
}
