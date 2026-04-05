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
        e.stopPropagation(); // 외부 클릭 감지 이벤트와 충돌 방지
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
        if (window.scrollY > 200) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // ── Active Link on Scroll / Click ───────────────────────
    const sections = document.querySelectorAll('section[id]');
    const sidebarLinks = document.querySelectorAll('.floating-sidebar__link[href^="#"]');
    const navLinks = document.querySelectorAll('.nav__link');
    const allNavLinks = document.querySelectorAll('.nav__link, .floating-sidebar__link[href^="#"]');

    // 사이드바 아이콘 active 초기화 함수 (카카오 제외)
    const clearSidebarActive = () => {
        sidebarLinks.forEach(link => {
            if (!link.closest('.floating-sidebar__item--kakao')) {
                link.classList.remove('active');
            }
        });
    };

    // 팡 섹션 ID 목록 (슬라이더 안에 있어 스크롤로 감지 불가)
    const pangIds = ['meokpang', 'nolpang', 'swimpang', 'salpang', 'meotpang'];

    // 사이드바 아이콘 클릭 시: 클릭된 아이콘만 주황색으로 설정
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (link.closest('.floating-sidebar__item--kakao')) return; // 카카오는 제외
            clearSidebarActive();
            link.classList.add('active');
        });
    });

    // 스크롤 기반: 팡 섹션 외의 일반 섹션 감지
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

        // 팡 섹션이 아닌 일반 섹션으로 스크롤 시 → 사이드바 active 초기화
        if (matchedId && !pangIds.includes(matchedId)) {
            clearSidebarActive();
        }

        // 히어로 섹션에 있을 때: 홈 아이콘 active 및 그림자 효과
        if (matchedId === 'hero') {
            sidebarLinks.forEach(link => {
                if (link.getAttribute('href') === '#hero') {
                    link.classList.add('active');
                }
            });
        }

        // PC용 상단 nav 링크 active 처리
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

