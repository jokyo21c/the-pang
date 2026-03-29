/* ══════════════════════════════════════════════════════════
   THE PANG — Portfolio Filter (portfolio-filter.js)
   ══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const filterBtns = document.querySelectorAll('.portfolio-filter__btn');

    const portfolioItems = [
        { category: 'meokpang', badge: '먹팡', bg: 'linear-gradient(135deg,#e63946 0%,#1a1a2e 100%)', label: '강남 파스타 레스토랑' },
        { category: 'meokpang', badge: '먹팡', bg: 'linear-gradient(135deg,#ff5e00 0%,#2a1a3a 100%)', label: '홍대 수제버거 맛집' },
        { category: 'nolpang',  badge: '놀팡', bg: 'linear-gradient(135deg,#7b2fff 0%,#1a2a3a 100%)', label: '강남 VR테마파크 체험' },
        { category: 'swimpang', badge: '쉼팡', bg: 'linear-gradient(135deg,#1a3a3a 0%,#2a1a3a 100%)', label: '제주 풀빌라 힐링 리조트' },
        { category: 'salpang',  badge: '살팡', bg: 'linear-gradient(135deg,#3a2a1a 0%,#1a1a3a 100%)', label: '스마트스토어 신상품 언박싱' },
        { category: 'meotpang', badge: '멋팡', bg: 'linear-gradient(135deg,#3a1a2a 0%,#1a2a3a 100%)', label: '청담 네일샵 아트 시술' },
        { category: 'meokpang', badge: '먹팡', bg: 'linear-gradient(135deg,#c0392b 0%,#2c3e50 100%)', label: '이태원 멕시코 타코 맛집' },
        { category: 'nolpang',  badge: '놀팡', bg: 'linear-gradient(135deg,#6c3483 0%,#1a2a4a 100%)', label: '홍대 방탈출 카페 체험' },
        { category: 'salpang',  badge: '살팡', bg: 'linear-gradient(135deg,#784212 0%,#1a3a2a 100%)', label: '패션 브랜드 신상 룩북' },
        { category: 'meotpang', badge: '멋팡', bg: 'linear-gradient(135deg,#1a5276 0%,#2a1a3a 100%)', label: '강남 헤어샵 스타일링' },
    ];

    function renderPortfolio(filter) {
        const portfolioWrap = document.getElementById('portfolioSlideWrap');
        const portfolioTrack = document.getElementById('portfolioTrack');
        const portfolioDots = document.getElementById('portfolioDots');

        if (!portfolioTrack || !portfolioDots || !portfolioWrap) return;

        const filtered = filter === 'all' ? portfolioItems : portfolioItems.filter(item => item.category === filter);
        
        portfolioTrack.innerHTML = '';
        portfolioDots.innerHTML = '';
        
        const isMobile = window.innerWidth <= 768;
        const ITEMS_PER_PAGE = isMobile ? 2 : 10;
        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        
        for (let i = 0; i < totalPages; i++) {
            const page = document.createElement('div');
            page.className = 'thumb-all-page portfolio-page';
            
            for (let j = 0; j < ITEMS_PER_PAGE; j++) {
                const item = filtered[i * ITEMS_PER_PAGE + j];
                if (item) {
                    page.innerHTML += `
                        <div class="category-thumb" data-label="${item.label}" data-color="${item.bg}" style="background: ${item.bg};">
                            <div class="category-thumb__overlay"><i class="ri-play-circle-line"></i></div>
                        </div>
                    `;
                }
            }
            
            portfolioTrack.appendChild(page);
            portfolioDots.innerHTML += `<span class="thumb-all-dot ${i === 0 ? 'active' : ''}"></span>`;
        }

        // 초기화 시 애니메이션 효과 (Fade-in)
        portfolioTrack.style.transition = 'none';
        portfolioTrack.style.opacity = '0';
        portfolioTrack.style.transform = 'scale(0.98)';
        
        // Force reflow
        void portfolioTrack.offsetWidth;
        
        portfolioTrack.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        portfolioTrack.style.opacity = '1';
        portfolioTrack.style.transform = 'scale(1)';

        // 슬라이드 위치 리셋
        portfolioWrap.dataset.slideIndex = '0';
        portfolioTrack.style.transform = 'translateX(0%)';

        // 슬라이드 기능 재초기화 (전역에 노출된 initThumbAllSlide 호출)
        let currentWrap = document.getElementById('portfolioSlideWrap');
        if (window.initThumbAllSlide && currentWrap) {
            // 이전에 등록된 이벤트 리스너가 중복되지 않도록 새 wrapper 요소로 교체하거나 이벤트 정리 필요
            // DOM 복제로 이벤트 제거 후 재초기화
            const newWrap = currentWrap.cloneNode(true);
            currentWrap.parentNode.replaceChild(newWrap, currentWrap);
            window.initThumbAllSlide(newWrap);
        }
    }

    if (filterBtns.length > 0) {
        // 첫 화면 렌더링
        renderPortfolio('all');

        // 필터 버튼 클릭 이벤트
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.portfolio-filter__btn');
            if (!btn) return;
            
            document.querySelectorAll('.portfolio-filter__btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            renderPortfolio(btn.dataset.filter);
        });

        // 반응형 리렌더링 (모바일 <-> PC 전환 시 아이템 개수가 다르므로 재배치)
        let currentStateMobile = window.innerWidth <= 768;
        window.addEventListener('resize', () => {
            const newStateMobile = window.innerWidth <= 768;
            if (currentStateMobile !== newStateMobile) {
                currentStateMobile = newStateMobile;
                const activeBtn = document.querySelector('.portfolio-filter__btn.active');
                renderPortfolio(activeBtn ? activeBtn.dataset.filter : 'all');
            }
        });
    }
});
