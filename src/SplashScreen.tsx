import { useEffect } from 'react';
import { preload } from 'react-dom';
import './splash.css';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  preload('./assets/brand-mark.svg', { as: 'image', fetchPriority: 'high' });
  preload('./assets/brand-wordmark.svg', { as: 'image', fetchPriority: 'high' });

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
          <div className="brand-splash-emblem">
            {[0, 1, 2].map(part => (
              <div className={`brand-splash-piece brand-splash-piece-${part}`} key={part}>
                <img src="./assets/brand-mark.svg" width="199" height="173" alt="" />
              </div>
            ))}
          </div>
        </div>
        <img className="brand-splash-wordmark" src="./assets/brand-wordmark.svg" width="336" height="39" alt="" />
        <p className="brand-splash-tagline">BUILD FOR THE UNSEEN</p>
      </div>
      <button className="brand-splash-skip" onClick={onComplete} autoFocus>
        Enter site <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
}
