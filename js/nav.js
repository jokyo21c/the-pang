/* ══════════════════════════════════════════════════════════
   THE PANG — Navigation (nav.js)
   ══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    // ── 안전 체크 ────────────────────────────────────────────
    if (!hamburger || !mobileMenu) {
        console.error('[nav.js] hamburger 또는 mobileMenu 요소를 찾을 수 없습니다.');
        return;
    }

    const mobileLinks = mobileMenu.querySelectorAll('.mobile-menu__link, .mobile-menu__cta');

    // ── Hamburger Toggle ────────────────────────────────────
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('open');
        document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    // ── Close Mobile Menu on Link Click ─────────────────────
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // ── Close Mobile Menu on Outside Click ──────────────────
    document.addEventListener('click', (event) => {
        if (!mobileMenu.classList.contains('open')) return;
        const isClickInsideMenu = mobileMenu.contains(event.target);
        const isClickOnHamburger = hamburger.contains(event.target);
        if (!isClickInsideMenu && !isClickOnHamburger) {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        }
    });

    // ── Scroll Border ───────────────────────────────────────
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 200);
    });

    // ── Active Link on Scroll / Click ───────────────────────
    const sections = document.querySelectorAll('section[id]');
    const sidebarLinks = document.querySelectorAll('.floating-sidebar__link[href^="#"]');
    const navLinks = document.querySelectorAll('.nav__link');

    // 팡 섹션 ID 목록
    const pangIds = ['meokpang', 'nolpang', 'swimpang', 'salpang', 'meotpang'];

    // 사이드바 아이콘을 모두 흰색으로 초기화 (문의/카카오 제외)
    const clearSidebarActive = () => {
        sidebarLinks.forEach(link => {
            if (!link.closest('.floating-sidebar__item--kakao')) {
                link.classList.remove('active');
            }
        });
    };

    // 팡 슬라이더 컨테이너 진입/이탈 감지 (IntersectionObserver)
    const pangSlider = document.getElementById('pangSectionSlider');
    let isPangVisible = false;

    if (pangSlider && window.IntersectionObserver) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isPangVisible = entry.isIntersecting;
                if (!isPangVisible) {
                    // 팡 섹션 벗어나면 모든 아이콘 흰색 초기화
                    clearSidebarActive();
                }
            });
        }, { threshold: 0.05 });
        observer.observe(pangSlider);
    }

    // 사이드바 아이콘 클릭 시 active 상태 변경은 main.js의 통합 리스너에서 처리
    // (이중 리스너로 인한 이벤트 순서 문제 방지)


    // 스크롤 기반: 일반 섹션 감지
    const activateLink = () => {
        const scrollPos = window.scrollY + 150;
        let matchedId = null;
        let isHeroActive = false;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            if (scrollPos >= top && scrollPos < top + height) {
                matchedId = id;
                if (id === 'hero') isHeroActive = true;
            }
        });

        // 팡 섹션이 아닌 일반 섹션 스크롤 시 → 사이드바 active 초기화 (흰색으로)
        if (matchedId && !pangIds.includes(matchedId)) {
            clearSidebarActive();
        }

        // 히어로 섹션: 홈 아이콘만 active (주황색)
        if (matchedId === 'hero') {
            sidebarLinks.forEach(link => {
                if (link.getAttribute('href') === '#hero') {
                    link.classList.add('active');
                }
            });
        }

        // PC 환경(768px 초과)에서 해당 팡 섹션 스크롤 진입 시 오렌지색 액티브 처리
        if (matchedId && pangIds.includes(matchedId)) {
            if (window.innerWidth > 768) {
                clearSidebarActive();
                sidebarLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${matchedId}`) {
                        link.classList.add('active');
                    }
                });
            }
        }

        // PC 상단 nav 링크 active
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (matchedId && link.getAttribute('href') === `#${matchedId}`) {
                link.classList.add('active');
            }
        });

        const floatingSidebar = document.querySelector('.floating-sidebar');
        if (floatingSidebar) {
            floatingSidebar.classList.toggle('in-hero', isHeroActive);
        }
    };

    window.addEventListener('scroll', activateLink);
});
