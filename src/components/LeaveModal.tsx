import { useEffect } from 'react';

interface LeaveModalProps {
  url: string;
  onClose: () => void;
}

// Heads-up shown before sending the viewer to fifa.com (which we can't wrap in
// the spoiler-shield player), so they know how to stay spoiler-free.
export function LeaveModal({ url, onClose }: LeaveModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="leave-modal" onClick={(e) => e.stopPropagation()}>
        <div className="leave-title display">Heads up — opening fifa.com</div>
        <p className="leave-body">
          This international highlight plays on the official <strong>fifa.com</strong> site, which we can't wrap in the
          spoiler-shield player. The score isn't shown straight away, but to stay spoiler-free:
        </p>
        <ul className="leave-list">
          <li>Press <strong>play right away</strong>.</li>
          <li><strong>Don't scroll down</strong> — match info and the score sit below the video.</li>
        </ul>
        <div className="overlay-actions">
          <a className="btn primary" href={url} target="_blank" rel="noopener noreferrer" onClick={onClose}>
            Open on fifa.com ↗
          </a>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
