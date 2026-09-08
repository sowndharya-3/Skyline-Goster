import { useEffect, type CSSProperties } from 'react';
import { preload } from 'react-dom';
import './splash.css';

// Slice the supplied wordmark at the spaces between letters, preserving its artwork.
const letters = [
  { letter: 'G', x: 0, width: 107 },
  { letter: 'H', x: 107, width: 101 },
  { letter: 'O', x: 208, width: 102 },
  { letter: 'S', x: 310, width: 99 },
  { letter: 'T', x: 409, width: 90 },
  { letter: 'E', x: 499, width: 86 },
  { letter: 'R', x: 585, width: 104 },
];

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  preload('./assets/logo.png', { as: 'image', fetchPriority: 'high' });
  preload('./assets/wordmark.png', { as: 'image', fetchPriority: 'high' });

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // A fallback also releases the page if browser settings disable CSS animations.
    let timer: ReturnType<typeof setTimeout>;
    const scheduleFinish = () => {
      clearTimeout(timer);
      timer = setTimeout(onComplete, motion.matches ? 250 : 3500);
    };
    scheduleFinish();
    motion.addEventListener('change', scheduleFinish);

    return () => {
      clearTimeout(timer);
      motion.removeEventListener('change', scheduleFinish);
      document.body.style.overflow = previousOverflow;
    };
  }, [onComplete]);

  return (
    <div
      className="brand-splash"
      aria-label="Welcome to GHOSTER"
      role="region"
      onAnimationEnd={event => {
        if (event.target === event.currentTarget && event.animationName === 'brand-splash-exit') {
          onComplete();
        }
      }}
    >
      <p className="sr-only" role="status">GHOSTER. Build for the unseen. Opening the store.</p>
      <div className="brand-splash-art" aria-hidden="true">
        <div className="brand-splash-badge">
          <div className="brand-splash-ring">
            <svg viewBox="0 0 240 240" fill="none">
              <circle className="brand-splash-ring-track" cx="120" cy="120" r="112" />
              <circle className="brand-splash-ring-line" cx="120" cy="120" r="112" pathLength="1" />
            </svg>
          </div>
          <div className="brand-splash-emblem">
            {[0, 1, 2].map(part => (
              <div className={`brand-splash-piece brand-splash-piece-${part}`} key={part}>
                <svg viewBox="284 385 817 709" focusable="false">
                  <image href="./assets/logo.png" width="1570" height="1800" />
                </svg>
              </div>
            ))}
          </div>
        </div>
        <div className="brand-splash-wordmark">
          {letters.map(({ letter, x, width }, index) => (
            <span
              key={letter}
              className="brand-splash-letter"
              style={{
                width: `${width / 689 * 100}%`,
                '--letter-delay': `${1150 + index * 95}ms`,
                '--letter-x': `${(3 - index) * 14}px`,
                '--letter-angle': `${(index - 3) * 7}deg`,
              } as CSSProperties}
            >
              <svg viewBox={`${x} 0 ${width} 83`} focusable="false">
                <image href="./assets/wordmark.png" width="689" height="83" />
              </svg>
            </span>
          ))}
        </div>
        <p className="brand-splash-tagline">BUILD FOR THE UNSEEN</p>
      </div>
      <button className="brand-splash-skip" onClick={onComplete} autoFocus>
        Enter site <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
}
