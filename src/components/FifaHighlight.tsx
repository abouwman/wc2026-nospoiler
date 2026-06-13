import { fifaEmbedSrc } from '../data/sources';

interface FifaHighlightProps {
  watchId: string;
}

// FIFA's own embeddable player (evp.fifa.com). Only reached when a FIFA partner
// name is configured (see data/sources.ts); otherwise EN links out to fifa.com.
export function FifaHighlight({ watchId }: FifaHighlightProps) {
  return (
    <div className="video-wrap">
      <iframe
        src={fifaEmbedSrc(watchId)}
        title="FIFA highlights"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
      ></iframe>
      <div className="mask-top mono">
        <span className="shield"></span>
        <span>FIFA player — plays with FIFA's own controls</span>
      </div>
    </div>
  );
}
