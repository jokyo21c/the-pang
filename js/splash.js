/**
 * ═══════════════════════════════════════════════════════
 * THE PANG - Splash Screen (Opening Sequence)
 * 
 * Phases:
 * 1. counting: 001 → 100 카운트업 (easeOutQuart, 2.2s)
 * 2. splash: THE PANG 로고 + 비디오 마스킹 + 줌 시퀀스
 * 3. complete: 페이드아웃 후 DOM 제거, 본문 표시
 * ═══════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  const container = document.getElementById('splashScreen');
  if (!container) return;

  const counterLayer = container.querySelector('.splash-counter-layer');
  const counterNumber = container.querySelector('.splash-counter-number');
  const loadingFill = document.getElementById('splashLoadingFill');
  const splashLayer = container.querySelector('.splash-splash-layer');

  // ═══════════════════════════════════════════════════
  // 스크롤 잠금 + 최상단 고정
  // ═══════════════════════════════════════════════════
  document.body.style.overflow = 'hidden';
  window.scrollTo(0, 0);

  // Hide page content until splash is done
  // auth-modal, auth-overlay, pang-alert 등 모달 계열은 제외
  const allSections = document.querySelectorAll(
    'body > *:not(#splashScreen):not(.pang-alert-overlay):not(.auth-overlay):not(.auth-modal):not(.plan-detail-modal):not(script):not(style):not(link)'
  );
  allSections.forEach(el => { el.style.opacity = '0'; el.style.transition = 'opacity 1s ease'; });

  let currentPhase = 'counting'; // 'counting' | 'splash' | 'complete'

  // ═══════════════════════════════════════════════════
  // Phase 1: Counter Animation (001 → 100)
  // ═══════════════════════════════════════════════════
  function startCounting() {
    const startTime = performance.now();
    const duration = 2200; // 2.2 seconds

    function animate(time) {
      let elapsed = time - startTime;
      if (elapsed > duration) elapsed = duration;

      // Premium Easing: easeOutQuart
      const t = elapsed / duration;
      const easeOut = 1 - Math.pow(1 - t, 4);

      const progress = Math.max(1, Math.min(100, Math.floor(easeOut * 100)));
      counterNumber.textContent = String(progress).padStart(3, '0');

      // 로딩바 fill 업데이트
      if (loadingFill) loadingFill.style.width = progress + '%';

      if (elapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        // 100에서 잠시 머문 후 로고 페이즈 전환
        setTimeout(() => {
          transitionToSplash();
        }, 300);
      }
    }

    requestAnimationFrame(animate);
  }

  // ═══════════════════════════════════════════════════
  // Phase 2: Splash (Logo + Video Masking)
  // ═══════════════════════════════════════════════════
  function transitionToSplash() {
    currentPhase = 'splash';

    // Counter 레이어 페이드아웃
    counterLayer.style.opacity = '0';
    counterLayer.style.visibility = 'hidden';

    // Splash 레이어 페이드인
    splashLayer.style.opacity = '1';
    splashLayer.style.visibility = 'visible';

    // 비디오 엘리먼트 생성 및 삽입
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.className = 'splash-video-bg';
    video.innerHTML = '<source src="images/splash.mp4" type="video/mp4">';
    splashLayer.insertBefore(video, splashLayer.firstChild);

    // 비디오 재생 (모바일 대응)
    video.play().catch(() => { /* 자동재생 차단 시 무시 */ });

    // 로고 글자별 swoosh 딜레이 적용
    const chars = splashLayer.querySelectorAll('.splash-char');
    chars.forEach((char, index) => {
      char.style.animationDelay = (index * 0.05) + 's';
    });

    // 1.2s (swoosh) + 5.2s (zoom) = 6.4s 후 완료
    setTimeout(() => {
      completeSplash();
    }, 6400);
  }

  // ═══════════════════════════════════════════════════
  // Phase 3: Complete - 페이드아웃 후 본문 표시
  // ═══════════════════════════════════════════════════
  function completeSplash() {
    currentPhase = 'complete';

    // ─── 모든 모달/오버레이 강제 닫기 ───
    // (스플래시 중 main.js 등에서 자동 열린 모달 차단)
    const modalsToClose = [
      'quoteOverlay', 'quoteModal',
      'thumbModal',
      'planDetailOverlay', 'planDetailModal',
      'authOverlay', 'authModal',
      'newsModal',
      'companyIntroModal', 'termsModal', 'privacyModal'
    ];
    modalsToClose.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = 'none';
        el.classList.remove('open', 'show', 'active', 'visible');
      }
    });

    // 반드시 페이지 최상단(히어로)으로 이동
    window.scrollTo(0, 0);
    const hero = document.getElementById('hero');
    if (hero) hero.scrollIntoView({ behavior: 'instant' });

    // 스플래시 전체 페이드아웃
    container.classList.add('splash-fade-out');

    // 본문 콘텐츠 페이드인
    allSections.forEach(el => { el.style.opacity = '1'; });

    // 스크롤 잠금 해제
    document.body.style.overflow = '';

    // 애니메이션 완료 후 DOM에서 제거
    setTimeout(() => {
      container.remove();
    }, 800);
  }

  // ═══════════════════════════════════════════════════
  // 초기화: 카운팅 시작
  // ═══════════════════════════════════════════════════
  // Splash Layer 초기 상태: 숨김
  splashLayer.style.opacity = '0';
  splashLayer.style.visibility = 'hidden';

  startCounting();
})();
