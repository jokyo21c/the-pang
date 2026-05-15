'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './SplashScreen.module.css';

/**
 * SplashScreen Component
 * 
 * Phases:
 * 1. counting: 001 to 100 count-up animation
 * 2. splash: ARTPAGE logo entrance with video masking and zoom-to-fill effect
 * 3. complete: Component signals it's done
 */
export default function SplashScreen({ onComplete }) {
  const [loadingPhase, setLoadingPhase] = useState('counting'); // 'counting' | 'splash' | 'complete'
  const [loadingProgress, setLoadingProgress] = useState(1);

  // 1. Loading Counter Animation (001 -> 100)
  useEffect(() => {
    if (loadingPhase !== 'counting') return;
    
    const startTime = performance.now();
    const duration = 2200; // 2.2 seconds
    
    let frameId;
    const animate = (time) => {
      let elapsed = time - startTime;
      if (elapsed > duration) elapsed = duration;
      
      // Premium Easing: easeOutQuart
      const t = elapsed / duration;
      const easeOut = 1 - Math.pow(1 - t, 4);
      
      const progress = Math.max(1, Math.min(100, Math.floor(easeOut * 100)));
      setLoadingProgress(progress);
      
      if (elapsed < duration) {
        frameId = requestAnimationFrame(animate);
      } else {
        // Delay slightly at 100 before transitioning to logo
        setTimeout(() => {
          setLoadingPhase('splash');
        }, 300);
      }
    };
    frameId = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(frameId);
  }, [loadingPhase]);

  // 2. Splash Sequence Timer
  useEffect(() => {
    if (loadingPhase === 'splash') {
      // 1.2s (swoosh entrance) + 5.2s (zoom sequence) = 6.4s
      const timer = setTimeout(() => {
        setLoadingPhase('complete');
        if (onComplete) onComplete();
      }, 6400); 
      
      return () => clearTimeout(timer);
    }
  }, [loadingPhase, onComplete]);

  if (loadingPhase === 'complete') return null;

  return (
    <div className={styles.container}>
      {/* 1. Counter Phase */}
      <div 
        className={styles.counterLayer}
        style={{ 
          opacity: loadingPhase === 'counting' ? 1 : 0,
          visibility: loadingPhase === 'counting' ? 'visible' : 'hidden'
        }}
      >
        <div className={styles.counterNumber}>
          {String(loadingProgress).padStart(3, '0')}
        </div>
      </div>

      {/* 2. Splash Phase (Logo + Video Masking) */}
      <div 
        className={styles.splashLayer}
        style={{ 
          opacity: loadingPhase === 'splash' ? 1 : 0,
          visibility: loadingPhase === 'splash' ? 'visible' : 'hidden'
        }}
      >
        {/* Background Video */}
        {loadingPhase === 'splash' && (
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            className={styles.videoBg}
          >
            {/* Note: In your new project, ensure this path is correct or use the provided asset */}
            <source src="/videos/splash.mp4" type="video/mp4" />
          </video>
        )}

        {/* Multiply Mask Layer (Pure Black with White Text) */}
        <div className={styles.maskLayer}>
          <div className={styles.logoText}>
            {'ARTPAGE'.split('').map((char, index) => (
              <span 
                key={index} 
                className={styles.char}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
