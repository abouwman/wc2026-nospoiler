// Cross-browser fullscreen toggle. Returns nothing; callers can read
// document.fullscreenElement if they need state. iOS Safari only supports
// fullscreen on <video>/<iframe>, not arbitrary divs, so prefer passing the
// media element where possible.
type FsEl = HTMLElement & {
  webkitRequestFullscreen?: () => void;
  webkitEnterFullscreen?: () => void;
};
type FsDoc = Document & {
  webkitFullscreenElement?: Element;
  webkitExitFullscreen?: () => void;
};

export function toggleFullscreen(el: HTMLElement | null): void {
  if (!el) return;
  const doc = document as FsDoc;
  const active = doc.fullscreenElement || doc.webkitFullscreenElement;
  if (active) {
    (doc.exitFullscreen || doc.webkitExitFullscreen)?.call(doc);
    return;
  }
  const target = el as FsEl;
  const req = target.requestFullscreen || target.webkitRequestFullscreen || target.webkitEnterFullscreen;
  if (req) req.call(target);
}
