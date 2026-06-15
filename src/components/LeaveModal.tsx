import { useEffect } from 'react';

export interface LeaveTarget {
  url: string;
  /** Display name of the destination, e.g. 'fifa.com' or 'BBC iPlayer'. */
  site: string;
  /** Optional viewing restriction, e.g. 'UK' — shown as a heads-up. */
  geo?: string;
}

interface LeaveModalProps {
  target: LeaveTarget;
  onClose: () => void;
}

// Heads-up shown before sending the viewer to an external highlights site (which
// we can't wrap in the spoiler-shield player), so they know how to stay
// spoiler-free.
export function LeaveModal({ target, onClose }: LeaveModalProps) {
  const { url, site, geo } = target;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="leave-modal" onClick={(e) => e.stopPropagation()}>
        <div className="leave-title display">Heads up — opening {site}</div>
        <p className="leave-body">
          This highlight plays on the official <strong>{site}</strong> site, which we can't wrap in the
          spoiler-shield player. The score isn't shown straight away, but to stay spoiler-free:
        </p>
        <ul className="leave-list">
          <li>Press <strong>play right away</strong>.</li>
          <li><strong>Don't scroll down</strong> — match info and the score sit below the video.</li>
        </ul>
        {geo ? (
          <p className="leave-geo mono">⚠ Available in the {geo} only — may not play elsewhere.</p>
        ) : null}
        <div className="overlay-actions">
          <a className="btn primary" href={url} target="_blank" rel="noopener noreferrer" onClick={onClose}>
            Open {site} ↗
          </a>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
