/* ══════════════════════════════════════════════════════════
   THE PANG — Portfolio Filter (portfolio-filter.js)
   ══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
    const filterBtns = document.querySelectorAll('.portfolio-filter__btn');

    // ── 1. Load Dynamic Portfolio Items from CMS ──
    const isVideoUrl = (url) => {
        if (!url) return false;
        if (url.startsWith('data:video/')) return true;
        if (/\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(url)) return true;
        return false;
    };

    let portfolioItems = [];
    const categories = {
        meokpang: '먹팡',
        nolpang: '놀팡',
        swimpang: '쉼팡',
        salpang: '살팡',
        meotpang: '멋팡'
    };

    try {
        if (window.PangData) {
            const items = await PangData.getPortfolio();
            if (items && items.length > 0) {
                // Group by category to count indexes
                const catCounts = { meokpang: 0, nolpang: 0, swimpang: 0, salpang: 0, meotpang: 0 };
                items.forEach(item => {
                    const catName = categories[item.category] || '';
                    if (!catName) return;
                    catCounts[item.category]++;
                    
                    let url = item.media_url;
                    // Use #t=0.001 to render thumbnail for videos
                    if (item.media_type === 'video' || isVideoUrl(url)) {
                        if (!url.includes('#t=')) url += '#t=0.001';
                    }

                    portfolioItems.push({
                        category: item.category,
                        badge: catName,
                        url: url,
                        label: `${catName} #${catCounts[item.category]}`,
                        type: item.media_type
                    });
                });
            }
        }
    } catch (err) {
        console.error('포트폴리오 필터 데이터 로드 실패:', err);
    }

    // CMS 데이터가 아예 없을 경우를 대비한 Fallback 기본 데이터
    if (portfolioItems.length === 0) {
        portfolioItems = [
            { category: 'meokpang', badge: '먹팡', bg: 'linear-gradient(135deg,#e63946 0%,#1a1a2e 100%)', label: '강남 파스타 레스토랑' },
            { category: 'meokpang', badge: '먹팡', bg: 'linear-gradient(135deg,#ff5e00 0%,#2a1a3a 100%)', label: '홍대 수제버거 맛집' },
            { category: 'nolpang',  badge: '놀팡', bg: 'linear-gradient(135deg,#7b2fff 0%,#1a2a3a 100%)', label: '강남 VR테마파크 체험' },
            { category: 'swimpang', badge: '쉼팡', bg: 'linear-gradient(135deg,#1a3a3a 0%,#2a1a3a 100%)', label: '제주 풀빌라 힐링 리조트' },
            { category: 'salpang',  badge: '살팡', bg: 'linear-gradient(135deg,#3a2a1a 0%,#1a1a3a 100%)', label: '스마트스토어 신상품 언박싱' },
            { category: 'meotpang', badge: '멋팡', bg: 'linear-gradient(135deg,#3a1a2a 0%,#1a2a3a 100%)', label: '청담 네일샵 아트 시술' }
        ];
    }

    function renderPortfolio(filter) {
        const portfolioWrap = document.getElementById('portfolioSlideWrap');
        const portfolioTrack = document.getElementById('portfolioTrack');
        const portfolioDots = document.getElementById('portfolioDots');

        if (!portfolioTrack || !portfolioDots || !portfolioWrap) return;

        const filtered = filter === 'all' ? portfolioItems : portfolioItems.filter(item => item.category === filter);
        
        portfolioTrack.innerHTML = '';
        portfolioDots.innerHTML = '';
        
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // ── 모바일: 센터-포커스 캐러셀 (아이템 하나하나 개별 렌더링) ──
            const mediaStyle = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;border-radius:inherit;z-index:1;';

            filtered.forEach((item) => {
                const div = document.createElement('div');
                div.className = 'portfolio-carousel-item';
                const bgStyle = item.bg ? `background: ${item.bg};` : 'background: var(--bg-surface-elevated);';
                div.setAttribute('style', bgStyle);

                let mediaTag = '';
                if (item.url) {
                    const isVid = item.type === 'video' || isVideoUrl(item.url);
                    mediaTag = isVid
                        ? `<video src="${item.url}" muted playsinline preload="metadata" style="${mediaStyle}"></video>`
                        : `<img src="${item.url}" alt="${item.label}" loading="lazy" style="${mediaStyle}">`;
                }
                div.innerHTML = mediaTag + `<div class="category-thumb__overlay" style="z-index:2;"><i class="ri-play-circle-line"></i></div>`;
                portfolioTrack.appendChild(div);
            });

            // 트랙 페이드인
            portfolioTrack.style.transition = 'none';
            portfolioTrack.style.transform = '';
            void portfolioTrack.offsetWidth;
            portfolioTrack.style.opacity = '0';
            portfolioTrack.style.transition = 'opacity 0.3s ease';
            void portfolioTrack.offsetWidth;
            portfolioTrack.style.opacity = '1';

            // 캐러셀 리셋(cloneNode로 이전 이벤트 정리 후) 초기화
            let currentWrap = document.getElementById('portfolioSlideWrap');
            if (window.initPortfolioCarousel && currentWrap) {
                const newWrap = currentWrap.cloneNode(true);
                newWrap.dataset.carouselInit = ''; // 클론 시 복사된 초기화 상태 방지
                currentWrap.parentNode.replaceChild(newWrap, currentWrap);
                window.initPortfolioCarousel(newWrap);
            }

        } else {
            // ── 데스크톱: 기존 페이지 방식 ──
            const ITEMS_PER_PAGE = 10;
            const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
            
            for (let i = 0; i < totalPages; i++) {
                const page = document.createElement('div');
                page.className = 'thumb-all-page portfolio-page';
                
                for (let j = 0; j < ITEMS_PER_PAGE; j++) {
                    const item = filtered[i * ITEMS_PER_PAGE + j];
                    if (item) {
                        const mediaStyle = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;border-radius:inherit;z-index:1;';
                        let mediaTag = '';
                        
                        if (item.url) {
                            const isVid = item.type === 'video' || isVideoUrl(item.url);
                            mediaTag = isVid 
                                ? `<video src="${item.url}" muted playsinline loop onmouseenter="this.play()" onmouseleave="this.pause()" preload="metadata" style="${mediaStyle}"></video>`
                                : `<img src="${item.url}" alt="${item.label}" style="${mediaStyle}">`;
                        }
                        
                        const bgStyle = item.bg ? `background: ${item.bg};` : 'background: var(--bg-surface-elevated);';

                        page.innerHTML += `
                            <div class="category-thumb" data-label="${item.label}" data-color="${item.bg || ''}" style="${bgStyle} position:relative; overflow:hidden;">
                                ${mediaTag}
                                <div class="category-thumb__overlay" style="z-index:2;"><i class="ri-play-circle-line"></i></div>
                            </div>
                        `;
                    }
                }
                
                portfolioTrack.appendChild(page);
                portfolioDots.innerHTML += `<span class="thumb-all-dot ${i === 0 ? 'active' : ''}"></span>`;
            }

            portfolioTrack.style.transition = 'none';
            portfolioTrack.style.transform = 'translateX(0%)';
            portfolioWrap.dataset.slideIndex = '0';
            void portfolioTrack.offsetWidth;
            portfolioTrack.style.opacity = '0';
            portfolioTrack.style.transition = 'opacity 0.3s ease';
            void portfolioTrack.offsetWidth;
            portfolioTrack.style.opacity = '1';

            let currentWrap = document.getElementById('portfolioSlideWrap');
            if (window.initThumbAllSlide && currentWrap) {
                const newWrap = currentWrap.cloneNode(true);
                currentWrap.parentNode.replaceChild(newWrap, currentWrap);
                window.initThumbAllSlide(newWrap);
            }
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
