// Minimal surface of the YouTube IFrame Player API that we use.
export interface YTPlayer {
  getDuration(): number;
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  loadVideoById(videoId: string): void;
  destroy(): void;
}

interface YTPlayerOptions {
  videoId: string;
  playerVars: Record<string, number | string>;
  events: {
    onReady: () => void;
    onStateChange: (e: { data: number }) => void;
  };
}

interface YTNamespace {
  Player: new (el: HTMLElement, opts: YTPlayerOptions) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
    __ytQueue?: Array<() => void>;
    __ytLoading?: boolean;
  }
}

export type { YTNamespace };

/** Loads the YouTube IFrame API (once) and runs `cb` once it's ready. */
export function loadYT(cb: () => void): void {
  if (window.YT && window.YT.Player) { cb(); return; }
  window.__ytQueue = window.__ytQueue || [];
  window.__ytQueue.push(cb);
  if (!window.__ytLoading) {
    window.__ytLoading = true;
    window.onYouTubeIframeAPIReady = () => {
      (window.__ytQueue || []).forEach((f) => { try { f(); } catch (e) { console.error(e); } });
      window.__ytQueue = [];
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }
}
