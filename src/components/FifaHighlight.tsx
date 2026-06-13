interface FifaHighlightProps {
  watchId: string;
}

// FIFA's own embeddable player (evp.fifa.com). FIFA highlights can't go through
// the YouTube IFrame API, so we drop in their player and use its native
// controls. NOTE: the exact embed URL couldn't be verified here because
// fifa.com / evp.fifa.com are blocked by this environment's egress allowlist —
// if FIFA's embed expects a different URL/param, change it in this one place.
function fifaEmbedSrc(watchId: string): string {
  return 'https://evp.fifa.com/?contentId=' + encodeURIComponent(watchId);
}

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
