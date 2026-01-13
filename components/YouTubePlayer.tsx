import React, { useEffect, useRef, useCallback, useState } from 'react';

interface YTPlayer {
  destroy(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  getCurrentTime(): number;
}

interface YTPlayerOptions {
  videoId: string;
  width?: string | number;
  height?: string | number;
  playerVars?: {
    autoplay?: 0 | 1;
    modestbranding?: 0 | 1;
    rel?: 0 | 1;
    enablejsapi?: 0 | 1;
    origin?: string;
  };
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onError?: (event: { data: number }) => void;
  };
}

interface YTNamespace {
  Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
}

declare global {
  interface Window {
    YT: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayerProps {
  youtubeUrl: string;
  onReady?: (player: YTPlayer) => void;
  className?: string;
}

function extractYoutubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

let ytApiLoaded = false;
let ytApiLoading = false;
const ytApiReadyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (ytApiLoaded && window.YT?.Player) {
      resolve();
      return;
    }

    ytApiReadyCallbacks.push(resolve);

    if (ytApiLoading) {
      return;
    }

    ytApiLoading = true;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      ytApiLoading = false;
      ytApiReadyCallbacks.forEach((cb) => cb());
      ytApiReadyCallbacks.length = 0;
    };
  });
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  youtubeUrl,
  onReady,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videoId = extractYoutubeVideoId(youtubeUrl);

  useEffect(() => {
    if (!videoId) {
      setError('Invalid YouTube URL');
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const initPlayer = async () => {
      try {
        await loadYouTubeAPI();
        
        if (!mounted || !containerRef.current) return;

        if (playerRef.current) {
          playerRef.current.destroy();
        }

        const playerId = `youtube-player-${videoId}`;
        containerRef.current.innerHTML = `<div id="${playerId}"></div>`;

        playerRef.current = new window.YT.Player(playerId, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: { target: YTPlayer }) => {
              if (mounted) {
                setIsLoading(false);
                onReady?.(event.target);
              }
            },
            onError: (event: { data: number }) => {
              if (mounted) {
                const errorMessages: Record<number, string> = {
                  2: 'Invalid video ID',
                  5: 'HTML5 player error',
                  100: 'Video not found',
                  101: 'Video cannot be embedded',
                  150: 'Video cannot be embedded',
                };
                setError(errorMessages[event.data] || 'Failed to load video');
                setIsLoading(false);
              }
            },
          },
        });
      } catch (err) {
        if (mounted) {
          setError('Failed to load YouTube player');
          setIsLoading(false);
        }
      }
    };

    initPlayer();

    return () => {
      mounted = false;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, onReady]);

  if (!videoId) {
    return (
      <div className={`flex items-center justify-center bg-slate-900 text-white ${className}`}>
        <p className="text-sm text-slate-400">Invalid YouTube URL</p>
      </div>
    );
  }

  return (
    <div className={`relative bg-black ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading YouTube player...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-center px-4">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-3 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm text-slate-400">{error}</p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef}
        className="w-full h-full"
        style={{ aspectRatio: '16/9' }}
      />
    </div>
  );
};

export function useYouTubePlayer() {
  const playerRef = useRef<YTPlayer | null>(null);

  const setPlayer = useCallback((player: YTPlayer) => {
    playerRef.current = player;
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, true);
      playerRef.current.playVideo();
    }
  }, []);

  const getCurrentTime = useCallback((): number => {
    return playerRef.current?.getCurrentTime() ?? 0;
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  return {
    setPlayer,
    seekTo,
    getCurrentTime,
    pause,
    play,
    player: playerRef,
  };
}

export default YouTubePlayer;
