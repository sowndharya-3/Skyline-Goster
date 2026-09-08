import { useEffect } from 'react';
import { preload } from 'react-dom';
import './splash.css';

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
        <img className="brand-splash-wordmark" src="./assets/wordmark.png" width="689" height="83" alt="" />
        <p className="brand-splash-tagline">BUILD FOR THE UNSEEN</p>
      </div>
      <button className="brand-splash-skip" onClick={onComplete} autoFocus>
        Enter site <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
}
