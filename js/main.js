/* ══════════════════════════════════════════════════════════
   THE PANG — Main Script (main.js)
   ══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // ── Scroll Animations (IntersectionObserver) ────────────
    const fadeElements = document.querySelectorAll('.fade-in');

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // 카테고리 컨텐츠는 매번 슬라이딩 효과가 나타나도록 unobserve 하지 않음
                if (!entry.target.classList.contains('category-content')) {
                    fadeObserver.unobserve(entry.target);
                }
            } else {
                if (entry.target.classList.contains('category-content')) {
                    entry.target.classList.remove('visible');
                }
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    fadeElements.forEach(el => fadeObserver.observe(el));


    // ── Category Sections ───────────────────────────────────────
    // Sections are separated sequentially, no tab logic required.

    // ── Testimonial Slider & Dynamic Content ────────────────
    const testimonialTrack = document.getElementById('testimonialTrack');
    const dotsContainer = document.getElementById('sliderDots');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    let currentSlide = 0;
    let totalSlides = 0;
    let autoSlideInterval;

    // [FIX] dots는 항상 최신 DOM에서 재조회 (stale closure 방지)
    const getDots = () => document.querySelectorAll('.slider-dot');

    const goToSlide = (index) => {
        const dots = getDots();
        totalSlides = document.querySelectorAll('.testimonial-card').length;
        if (totalSlides === 0) return;
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        currentSlide = index;
        if (testimonialTrack) testimonialTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
        dots.forEach(dot => dot.classList.remove('active'));
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    };

    const startAutoSlide = () => {
        autoSlideInterval = setInterval(() => goToSlide(currentSlide + 1), 3000);
    };

    const stopAutoSlide = () => clearInterval(autoSlideInterval);

    const bindSliderControls = () => {
        const dots = getDots();
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                stopAutoSlide();
                goToSlide(parseInt(dot.dataset.index));
                startAutoSlide();
            });
        });
    };

    if (prevBtn) prevBtn.addEventListener('click', () => { stopAutoSlide(); goToSlide(currentSlide - 1); startAutoSlide(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { stopAutoSlide(); goToSlide(currentSlide + 1); startAutoSlide(); });

    // [FIX] localStorage 대신 Supabase PangData.getTestimonials() 사용
    async function loadTestimonials() {
        try {
            if (window.PangData) {
                const items = await PangData.getTestimonials();
                if (items && items.length > 0 && testimonialTrack) {
                    testimonialTrack.innerHTML = items.map(t => `
                        <div class="testimonial-card">
                            <div class="testimonial-card__inner">
                                <div class="testimonial-card__photo">
                                    <img src="${t.photo || 'https://picsum.photos/seed/pang1/200/200'}" alt="${t.author || ''}">
                                </div>
                                <div class="testimonial-card__stars" style="letter-spacing:4px;color:var(--color-brand-orange);margin-bottom:20px;">${'★'.repeat(t.stars || 5)}</div>
                                <p class="testimonial-card__text">"${t.text || ''}"</p>
                                <div class="testimonial-card__footer">
                                    <div class="testimonial-card__info">
                                        <p class="testimonial-card__author">${t.author || ''}</p>
                                        <span class="testimonial-card__badge" style="background:${t.badge_color || 'var(--color-brand-purple)'}">${t.badge || ''}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('');

                    if (dotsContainer) {
                        dotsContainer.innerHTML = items.map((_, i) =>
                            `<span class="slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
                        ).join('');
                    }
                    totalSlides = items.length;
                    bindSliderControls();
                }
            }
        } catch (err) {
            console.error('[Testimonial] Supabase 로드 실패:', err);
        }
    }

    // 초기 HTML 데이터로 먼저 setup, 이후 Supabase로 교체
    totalSlides = document.querySelectorAll('.testimonial-card').length;
    bindSliderControls();
    loadTestimonials();
    startAutoSlide();


    // ── Pricing Toggle ──────────────────────────────────────
    const pricingToggle = document.getElementById('pricingToggle');
    const toggleLabels = document.querySelectorAll('.pricing-toggle__label');

    if (pricingToggle) {
        pricingToggle.addEventListener('click', () => {
            pricingToggle.classList.toggle('active');
            toggleLabels.forEach(label => label.classList.toggle('active'));
        });
    }

    // ── Mobile Pricing Slider Logic ─────────────────────────
    const pricingGrid = document.getElementById('pricingGrid');
    const pricingPrev = document.querySelector('.pricing-nav--prev');
    const pricingNext = document.querySelector('.pricing-nav--next');
    const pricingDots = document.querySelectorAll('.pricing-dot');

    if (pricingGrid && pricingDots.length > 0) {
        const updatePricingNav = () => {
            if (window.innerWidth > 768) return; // Only run on mobile
            const scrollLeft = pricingGrid.scrollLeft;
            const cardWidth = pricingGrid.clientWidth;
            // index based on scroll position
            const index = Math.round(scrollLeft / cardWidth);

            // 무한 루프로 변경됨에 따라 버튼 숨김 로직 제거
            // if (pricingPrev) pricingPrev.classList.toggle('hidden', index === 0);
            // if (pricingNext) pricingNext.classList.toggle('hidden', index === pricingDots.length - 1);

            pricingDots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        };

        pricingGrid.addEventListener('scroll', () => {
            // throttle or debounce if needed, but for dots simple scroll is usually fine
            requestAnimationFrame(updatePricingNav);
        });

        if (pricingPrev) {
            pricingPrev.addEventListener('click', () => {
                const scrollLeft = pricingGrid.scrollLeft;
                const cardWidth = pricingGrid.clientWidth;
                const index = Math.round(scrollLeft / cardWidth);

                if (index === 0) {
                    pricingGrid.scrollTo({ left: cardWidth * (pricingDots.length - 1), behavior: 'smooth' });
                } else {
                    pricingGrid.scrollBy({ left: -cardWidth, behavior: 'smooth' });
                }
            });
        }

        if (pricingNext) {
            pricingNext.addEventListener('click', () => {
                const scrollLeft = pricingGrid.scrollLeft;
                const cardWidth = pricingGrid.clientWidth;
                const index = Math.round(scrollLeft / cardWidth);

                if (index === pricingDots.length - 1) {
                    pricingGrid.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    pricingGrid.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }
            });
        }

        pricingDots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                pricingGrid.scrollTo({ left: pricingGrid.clientWidth * i, behavior: 'smooth' });
            });
        });

        // Initialize on load and resize
        window.addEventListener('resize', updatePricingNav);
        updatePricingNav();
    }

    // ── Mobile Service Slider Logic ─────────────────────────
    const serviceGrid = document.getElementById('serviceGrid');
    const servicePrev = document.querySelector('.service-nav--prev');
    const serviceNext = document.querySelector('.service-nav--next');
    const serviceDots = document.querySelectorAll('.service-dot');

    if (serviceGrid && serviceDots.length > 0) {
        const updateServiceNav = () => {
            if (window.innerWidth > 768) return;
            const scrollLeft = serviceGrid.scrollLeft;
            const cardWidth = serviceGrid.clientWidth;
            const index = Math.round(scrollLeft / cardWidth);

            // 무한 루프로 변경됨에 따라 버튼 숨김 로직 제거
            // if (servicePrev) servicePrev.classList.toggle('hidden', index === 0);
            // if (serviceNext) serviceNext.classList.toggle('hidden', index === serviceDots.length - 1);

            serviceDots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        };

        serviceGrid.addEventListener('scroll', () => {
            requestAnimationFrame(updateServiceNav);
        });

        if (servicePrev) {
            servicePrev.addEventListener('click', () => {
                const scrollLeft = serviceGrid.scrollLeft;
                const cardWidth = serviceGrid.clientWidth;
                const index = Math.round(scrollLeft / cardWidth);

                if (index === 0) {
                    serviceGrid.scrollTo({ left: cardWidth * (serviceDots.length - 1), behavior: 'smooth' });
                } else {
                    serviceGrid.scrollBy({ left: -cardWidth, behavior: 'smooth' });
                }
            });
        }

        if (serviceNext) {
            serviceNext.addEventListener('click', () => {
                const scrollLeft = serviceGrid.scrollLeft;
                const cardWidth = serviceGrid.clientWidth;
                const index = Math.round(scrollLeft / cardWidth);

                if (index === serviceDots.length - 1) {
                    serviceGrid.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    serviceGrid.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }
            });
        }

        serviceDots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                serviceGrid.scrollTo({ left: serviceGrid.clientWidth * i, behavior: 'smooth' });
            });
        });

        window.addEventListener('resize', updateServiceNav);
        updateServiceNav();
    }

    // ── Mobile Process Slider Logic ─────────────────────────
    const processGrid = document.getElementById('processGrid');
    const processPrev = document.querySelector('.process-nav--prev');
    const processNext = document.querySelector('.process-nav--next');
    const processDots = document.querySelectorAll('.process-dot');

    if (processGrid && processDots.length > 0) {
        const updateProcessNav = () => {
            if (window.innerWidth > 768) return;
            const scrollLeft = processGrid.scrollLeft;
            const cardWidth = processGrid.clientWidth;
            const index = Math.round(scrollLeft / cardWidth);

            // 무한 루프로 변경됨에 따라 버튼 숨김 로직 제거
            // if (processPrev) processPrev.classList.toggle('hidden', index === 0);
            // if (processNext) processNext.classList.toggle('hidden', index === processDots.length - 1);

            processDots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        };

        processGrid.addEventListener('scroll', () => {
            requestAnimationFrame(updateProcessNav);
        });

        if (processPrev) {
            processPrev.addEventListener('click', () => {
                const scrollLeft = processGrid.scrollLeft;
                const cardWidth = processGrid.clientWidth;
                const index = Math.round(scrollLeft / cardWidth);

                if (index === 0) {
                    processGrid.scrollTo({ left: cardWidth * (processDots.length - 1), behavior: 'smooth' });
                } else {
                    processGrid.scrollBy({ left: -cardWidth, behavior: 'smooth' });
                }
            });
        }

        if (processNext) {
            processNext.addEventListener('click', () => {
                const scrollLeft = processGrid.scrollLeft;
                const cardWidth = processGrid.clientWidth;
                const index = Math.round(scrollLeft / cardWidth);

                if (index === processDots.length - 1) {
                    processGrid.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    processGrid.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }
            });
        }

        processDots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                processGrid.scrollTo({ left: processGrid.clientWidth * i, behavior: 'smooth' });
            });
        });

        window.addEventListener('resize', updateProcessNav);
        updateProcessNav();
    }

    // ── Mobile News Slider Logic ────────────────────────────
    const newsGrid = document.getElementById('newsGrid');
    const newsPrev = document.querySelector('.news-nav--prev');
    const newsNext = document.querySelector('.news-nav--next');
    const newsDots = document.querySelectorAll('.news-dot');

    if (newsGrid && newsDots.length > 0) {
        const updateNewsNav = () => {
            if (window.innerWidth > 768) return;
            const scrollLeft = newsGrid.scrollLeft;
            const cardWidth = newsGrid.clientWidth;
            const index = Math.round(scrollLeft / cardWidth);

            // 무한 루프로 변경됨에 따라 버튼 숨김 로직 제거
            // if (newsPrev) newsPrev.classList.toggle('hidden', index === 0);
            // if (newsNext) newsNext.classList.toggle('hidden', index === newsDots.length - 1);

            newsDots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        };

        newsGrid.addEventListener('scroll', () => {
            requestAnimationFrame(updateNewsNav);
        });

        if (newsPrev) {
            newsPrev.addEventListener('click', () => {
                const scrollLeft = newsGrid.scrollLeft;
                const cardWidth = newsGrid.clientWidth;
                const index = Math.round(scrollLeft / cardWidth);

                if (index === 0) {
                    newsGrid.scrollTo({ left: cardWidth * (newsDots.length - 1), behavior: 'smooth' });
                } else {
                    newsGrid.scrollBy({ left: -cardWidth, behavior: 'smooth' });
                }
            });
        }

        if (newsNext) {
            newsNext.addEventListener('click', () => {
                const scrollLeft = newsGrid.scrollLeft;
                const cardWidth = newsGrid.clientWidth;
                const index = Math.round(scrollLeft / cardWidth);

                if (index === newsDots.length - 1) {
                    newsGrid.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    newsGrid.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }
            });
        }

        newsDots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                newsGrid.scrollTo({ left: newsGrid.clientWidth * i, behavior: 'smooth' });
            });
        });

        window.addEventListener('resize', updateNewsNav);
        updateNewsNav();
    }


    // ── Add-on Accordion ────────────────────────────────────
    const addonToggle = document.getElementById('addonToggle');
    const addonContent = document.getElementById('addonContent');

    if (addonToggle && addonContent) {
        addonToggle.addEventListener('click', () => {
            addonToggle.classList.toggle('active');
            addonContent.classList.toggle('open');
        });
    }


    // ── Scroll to Top Button ────────────────────────────────
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const scrollTopParent = scrollTopBtn ? scrollTopBtn.parentElement : null;

    // [FIX] scrollTopBtn null 가드 추가
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                if (scrollTopParent) scrollTopParent.classList.add('visible');
                else scrollTopBtn.classList.add('visible');
            } else {
                if (scrollTopParent) scrollTopParent.classList.remove('visible');
                else scrollTopBtn.classList.remove('visible');
            }
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    // ── Smooth Scroll for Anchor Links ──────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // ── Stamp Animation & Slogan Roller ──────────────────────
    const bannerContainer = document.querySelector('.slogan-banner');
    let sloganIntervalStarted = false;

    const stampObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 부모 컨테이너가 40% 보이면 안쪽 요소들을 동작시킴
                const stampElements = entry.target.querySelectorAll('.stamp-text');
                stampElements.forEach(el => el.classList.add('stamped'));

                stampObserver.unobserve(entry.target);

                if (!sloganIntervalStarted) {
                    sloganIntervalStarted = true;
                    // 도장 애니메이션(0.55초) 직후 바로 슬라이드가 교체되도록 0.8초(800ms)만 대기
                    setTimeout(startSloganRoller, 800);
                }
            }
        });
    }, {
        threshold: 0.4,
        rootMargin: '0px'
    });

    if (bannerContainer) {
        stampObserver.observe(bannerContainer);
    }


    // Slogan Roller Logic
    function startSloganRoller() {
        const sloganItems = document.querySelectorAll('.slogan-item');
        if (sloganItems.length > 0) {
            let currentSlogan = 0;
            // 첫 번째 도장 효과 제거하고 일반 롤링 상태로 전환
            document.getElementById('firstSlogan').classList.remove('stamp-text', 'stamped');
            document.getElementById('firstSlogan').classList.add('active');

            setInterval(() => {
                const prevSlogan = currentSlogan;
                sloganItems[prevSlogan].classList.remove('active');
                sloganItems[prevSlogan].classList.add('exit');
                currentSlogan = (currentSlogan + 1) % sloganItems.length;
                setTimeout(() => {
                    sloganItems[prevSlogan].classList.remove('exit');
                    sloganItems[currentSlogan].classList.add('active');
                }, 800);
            }, 3500);
        }
    }

    // ── Platform Banner Infinite Loop ────────────────────────
    const platformTrack = document.getElementById('platformTrack');
    if (platformTrack) {
        // Clone the content for seamless infinite scroll
        const clone = platformTrack.innerHTML;
        platformTrack.innerHTML += clone;

        // [FIX] 복제 후 children.length는 원본의 2배 → 2로 나눠서 올바른 속도 계산
        const originalCount = platformTrack.children.length / 2;
        const baseDuration = originalCount * 2; // 아이템 1개당 2초
        platformTrack.style.setProperty('animation-duration', `${baseDuration}s`);
    }

    // ── Thumb All Slider (Infinite Loop) ─────────────────────
    window.initThumbAllSlide = function (wrap) {
        const track = wrap.querySelector('.thumb-all-track');
        let pages = Array.from(wrap.querySelectorAll('.thumb-all-page'));
        const prevBtn = wrap.querySelector('.thumb-all-nav--prev');
        const nextBtn = wrap.querySelector('.thumb-all-nav--next');
        const dotsContainer = wrap.querySelector('.thumb-all-dots');

        if (!track || pages.length <= 1) return;

        const MAX_VISIBLE_DOTS = 5; // 화면에 표시할 최대 점 개수

        // To prevent multiple initializations
        if (wrap.dataset.initialized === 'true') {
            const clones = track.querySelectorAll('.clone');
            clones.forEach(c => c.remove());
            pages = Array.from(wrap.querySelectorAll('.thumb-all-page:not(.clone)'));
        }
        wrap.dataset.initialized = 'true';

        const totalPages = pages.length;

        // dots를 totalPages 수에 따라 동적 렌더링 (최대 MAX_VISIBLE_DOTS개)
        if (dotsContainer) {
            const count = Math.min(totalPages, MAX_VISIBLE_DOTS);
            dotsContainer.innerHTML = Array.from({ length: count }, () =>
                `<span class="thumb-all-dot"></span>`
            ).join('');
        }

        // Clone first and last pages for infinite loop
        const firstClone = pages[0].cloneNode(true);
        const lastClone = pages[totalPages - 1].cloneNode(true);
        firstClone.classList.add('clone');
        lastClone.classList.add('clone');
        track.appendChild(firstClone);
        track.insertBefore(lastClone, pages[0]);

        let currentIndex = 1; // 1-based (앞에 clone 1개 있음)
        let isTransitioning = false;

        const setTransform = (index, transition = true) => {
            track.style.transition = transition ? 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
            track.style.transform = `translateX(-${index * 100}%)`;
        };

        const updateDots = (index) => {
            if (!dotsContainer) return;
            const dotEls = dotsContainer.querySelectorAll('.thumb-all-dot');
            if (!dotEls.length) return;

            let pageIdx = index - 1; // 0-based
            if (pageIdx < 0) pageIdx = totalPages - 1;
            if (pageIdx >= totalPages) pageIdx = 0;

            if (totalPages <= MAX_VISIBLE_DOTS) {
                dotEls.forEach((d, i) => d.classList.toggle('active', i === pageIdx));
            } else {
                const half = Math.floor(MAX_VISIBLE_DOTS / 2);
                let winStart = pageIdx - half;
                winStart = Math.max(0, Math.min(winStart, totalPages - MAX_VISIBLE_DOTS));
                const activeDotIdx = pageIdx - winStart;
                dotEls.forEach((d, i) => d.classList.toggle('active', i === activeDotIdx));
            }
        };

        const goToSlide = (index) => {
            if (isTransitioning) return;
            isTransitioning = true;
            currentIndex = index;

            if (currentIndex > totalPages + 1) currentIndex = totalPages + 1;
            if (currentIndex < 0) currentIndex = 0;

            setTransform(currentIndex);
            updateDots(currentIndex);
            wrap.dataset.slideIndex = currentIndex - 1;

            clearTimeout(wrap._fallbackTimer);
            wrap._fallbackTimer = setTimeout(() => {
                isTransitioning = false;
                if (currentIndex === 0) {
                    currentIndex = totalPages;
                    setTransform(currentIndex, false);
                } else if (currentIndex === totalPages + 1) {
                    currentIndex = 1;
                    setTransform(currentIndex, false);
                }
            }, 450);
        };

        // Initial setup
        setTransform(currentIndex, false);
        updateDots(currentIndex);

        if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

        // Dot 클릭: 동적 렌더링된 dots를 위한 위임 방식
        if (dotsContainer) {
            dotsContainer.addEventListener('click', (e) => {
                const dot = e.target.closest('.thumb-all-dot');
                if (!dot) return;
                const idx = Array.from(dotsContainer.querySelectorAll('.thumb-all-dot')).indexOf(dot);
                if (idx < 0) return;
                
                const half = Math.floor(MAX_VISIBLE_DOTS / 2);
                let pageIdx = (currentIndex - 1);
                if (pageIdx < 0) pageIdx = totalPages - 1;
                if (pageIdx >= totalPages) pageIdx = 0;
                
                let winStart = pageIdx - half;
                winStart = Math.max(0, Math.min(winStart, totalPages - Math.min(totalPages, MAX_VISIBLE_DOTS)));
                const targetPageIdx = winStart + idx;
                goToSlide(targetPageIdx + 1);
            });
        }

        // Touch / Swipe
        let startX = 0, startY = 0, currentTranslate = 0, prevTranslate = 0, isDragging = false;

        const touchStart = (e) => {
            if (isTransitioning) return;
            startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
            startY = e.type.includes('mouse') ? e.pageY : e.touches[0].clientY;
            isDragging = true;
            track.style.transition = 'none';
            prevTranslate = currentIndex * -100;
        };

        const touchMove = (e) => {
            if (!isDragging) return;
            const currentPosition = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
            const diff = currentPosition - startX;
            const trackWidth = track.clientWidth || wrap.clientWidth;
            const percentageDiff = (diff / trackWidth) * 100;
            currentTranslate = prevTranslate + percentageDiff;
            track.style.transform = `translateX(${currentTranslate}%)`;
        };

        const touchEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;

            if (e && e.changedTouches) {
                const diffX = e.changedTouches[0].clientX - startX;
                const diffY = e.changedTouches[0].clientY - startY;
                if (Math.abs(diffY) > Math.abs(diffX)) {
                    // 수직 스크롤로 간주, 변환 취소
                    goToSlide(currentIndex);
                    return;
                }
            }

            const movedBy = currentTranslate - prevTranslate;

            // Threshold to trigger slide change
            if (movedBy < -15) {
                goToSlide(currentIndex + 1);
            } else if (movedBy > 15) {
                goToSlide(currentIndex - 1);
            } else {
                // Snap back
                goToSlide(currentIndex);
            }
        };

        // Add event listeners for touch/mouse
        const touchTarget = wrap.querySelector('.thumb-all-viewport') || wrap;
        touchTarget.addEventListener('touchstart', touchStart, { passive: true });
        touchTarget.addEventListener('touchmove', touchMove, { passive: true });
        touchTarget.addEventListener('touchend', touchEnd);
        touchTarget.addEventListener('mouseleave', () => { if (isDragging) touchEnd(); });
        touchTarget.addEventListener('mousedown', touchStart);
        touchTarget.addEventListener('mousemove', touchMove);
        touchTarget.addEventListener('mouseup', touchEnd);
    };

    // ── Dynamic Portfolio Categories from Supabase ─────────────────
    const _isVideoUrl = (url) => {
        if (!url) return false;
        if (url.startsWith('data:video/')) return true;
        if (/\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(url)) return true;
        return false;
    };

    async function loadPortfolioFromSupabase() {
        try {
            const categories = {
                meokpang: '먹팡', nolpang: '놀팡',
                swimpang: '쉼팡', salpang: '살팡', meotpang: '멋팡'
            };

            const items = await PangData.getPortfolio();
            if (!items || items.length === 0) return;

            // 카테고리별로 그룹화
            const grouped = {};
            items.forEach(item => {
                if (!grouped[item.category]) grouped[item.category] = [];
                grouped[item.category].push(item);
            });

            Object.entries(categories).forEach(([catKey, catName]) => {
                const catItems = grouped[catKey];
                if (!catItems || catItems.length === 0) return;

                const section = document.getElementById(catKey);
                if (!section) return;
                const track = section.querySelector('.thumb-all-track');
                const dotsContainer = section.querySelector('.thumb-all-dots');
                if (!track || !dotsContainer) return;

                let trackHtml = '';
                let dotsHtml = '';
                const itemsPerPage = 2;
                const totalPages = Math.ceil(catItems.length / itemsPerPage);

                for (let i = 0; i < totalPages; i++) {
                    let pageHtml = '<div class="thumb-all-page">';
                    for (let j = 0; j < itemsPerPage; j++) {
                        const idx = i * itemsPerPage + j;
                        if (idx < catItems.length) {
                            let url = catItems[idx].media_url;
                            const isVid = catItems[idx].media_type === 'video' || _isVideoUrl(url);
                            // [FIX] #t=0.001 적용 → 비디오 첫 프레임 썸네일 표시
                            if (isVid && url && !url.includes('#t=')) url += '#t=0.001';
                            const mediaStyle = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;border-radius:inherit;z-index:1;';
                            const mediaTag = isVid
                                ? `<video src="${url}" muted playsinline preload="metadata" onmouseenter="this.play()" onmouseleave="this.pause()" style="${mediaStyle}"></video>`
                                : `<img src="${url}" alt="${catName} #${idx + 1}" style="${mediaStyle}">`;
                            pageHtml += `
                                <div class="category-thumb" data-label="${catName} #${idx + 1}" style="background:var(--bg-surface-elevated); position:relative; overflow:hidden;">
                                    ${mediaTag}
                                    <div class="category-thumb__overlay" style="z-index:2;"><i class="ri-play-circle-line"></i></div>
                                </div>
                            `;
                        }

                    }
                    pageHtml += '</div>';
                    trackHtml += pageHtml;
                    dotsHtml += `<span class="thumb-all-dot ${i === 0 ? 'active' : ''}"></span>`;
                }
                track.innerHTML = trackHtml;
                dotsContainer.innerHTML = dotsHtml;
            });

            // 슬라이더 재초기화
            document.querySelectorAll('.thumb-all-wrap').forEach(wrap => {
                window.initThumbAllSlide(wrap);
            });
        } catch (err) {
            console.error('Supabase 포트폴리오 로드 실패:', err);
        }
    }

    // Supabase에서 비동기 로드 (기본 썸네일은 HTML에 유지)
    loadPortfolioFromSupabase();

    // Initialize all existing sliders
    document.querySelectorAll('.thumb-all-wrap').forEach(wrap => {
        window.initThumbAllSlide(wrap);
    });


    // ── Pang Section Slider (Mobile: 먹팡~멋팡 수평 슬라이더) ──
    (function initPangSectionSlider() {
        const slider = document.getElementById('pangSectionSlider');
        const track = document.getElementById('pangSliderTrack');
        const slides = slider ? Array.from(slider.querySelectorAll('.pang-slide')) : [];

        if (!slider || !track || slides.length === 0) return;

        let currentPang = 0;
        let autoTimer = null;
        let manualStop = false; // ★ 터치로 인한 수동 중지 플래그
        const TOTAL = slides.length;
        const AUTO_INTERVAL = 2000; // 2초간 대기 (사용자 수정 요청)

        // 슬라이드 인덱스 ↔ 팡 섹션 ID 매핑
        const pangIdMap = ['meokpang', 'nolpang', 'swimpang', 'salpang', 'meotpang'];

        // 모든 슬라이드에 있는 팡 네비게이션 dots 동기화
        const syncAllPangDots = (index) => {
            document.querySelectorAll('.pang-nav-dot').forEach(dot => {
                dot.classList.toggle('active', parseInt(dot.dataset.index, 10) === index);
            });
        };

        // 사이드바 active 아이콘 동기화
        const syncSidebarActive = (index) => {
            const targetId = pangIdMap[index];
            if (!targetId) return;
            const sidebarLinks = document.querySelectorAll('.floating-sidebar__link[href^="#"]');
            sidebarLinks.forEach(link => {
                if (link.closest('.floating-sidebar__item--kakao')) return;
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${targetId}`) {
                    link.classList.add('active');
                }
            });
        };

        // 슬라이더 이동
        const goToPang = (index, smooth = true) => {
            // 무한 루프 처리
            if (index < 0) index = TOTAL - 1;
            if (index >= TOTAL) index = 0;

            currentPang = index;

            // CSS transform으로 500% 너비의 트랙 이동 (한 슬라이드당 20%)
            track.style.transition = smooth ? 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
            track.style.transform = `translateX(-${currentPang * 20}%)`;

            // dot 표시자 동기화
            syncAllPangDots(currentPang);

            // 사이드바 아이콘 active 상태 동기화 (모바일에서만)
            if (window.matchMedia('(max-width: 768px)').matches) {
                syncSidebarActive(currentPang);
            }
        };

        // 자동 슬라이딩
        const startAuto = () => {
            if (manualStop) return; // 수동으로 중지된 상태라면 무시
            stopAuto();
            autoTimer = setInterval(() => {
                goToPang(currentPang + 1);
            }, AUTO_INTERVAL);
        };

        const stopAuto = () => {
            if (autoTimer) {
                clearInterval(autoTimer);
                autoTimer = null;
            }
        };

        // 팡 섹션 새 네비게이션 버튼 (< dots >)
        document.querySelectorAll('.pang-nav-btn--prev').forEach(btn => {
            btn.addEventListener('click', () => {
                manualStop = true;
                stopAuto();
                goToPang(currentPang - 1);
            });
        });

        document.querySelectorAll('.pang-nav-btn--next').forEach(btn => {
            btn.addEventListener('click', () => {
                manualStop = true;
                stopAuto();
                goToPang(currentPang + 1);
            });
        });

        // dot 클릭 이벤트
        document.querySelectorAll('.pang-nav-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const idx = parseInt(dot.dataset.index, 10);
                manualStop = true;
                stopAuto();
                goToPang(idx);
            });
        });

        // 슬라이더 자체 클릭 시 (썸네일 등) 자동 롤링 영구 정지 (스크롤 이탈 전까지)
        slider.addEventListener('click', () => {
            manualStop = true;
            stopAuto();
        });

        // [FIX] 호버용 별도 플래그 사용 → manualStop(클릭/터치) 과 충돌 방지
        const thumbWraps = slider.querySelectorAll('.thumb-all-wrap');
        thumbWraps.forEach(wrap => {
            wrap.addEventListener('mouseenter', () => { stopAuto(); });
            wrap.addEventListener('mouseleave', () => {
                // manualStop(클릭/터치 정지)이 아닌 경우에만 자동 재개
                if (!manualStop) startAuto();
            });
        });


        // 터치 스와이프
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;

        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            manualStop = true; // 터치 발생 시 영구 정지
            stopAuto();
        }, { passive: true });

        slider.addEventListener('touchend', (e) => {
            const diffX = e.changedTouches[0].clientX - touchStartX;
            const diffY = e.changedTouches[0].clientY - touchStartY;
            const diffTime = Date.now() - touchStartTime;

            // Y축 방향(위아래 스크롤) 요동이 X축보다 크다면 좌우 스와이프로 간주하지 않음
            if (Math.abs(diffY) > Math.abs(diffX)) {
                startAuto();
                return;
            }

            // 빠른 스와이프 (속도 기준) 또는 30px 이상 이동
            if (Math.abs(diffX) > 30 || (Math.abs(diffX) > 15 && diffTime < 250)) {
                if (diffX < 0) {
                    goToPang(currentPang + 1); // 다음
                } else {
                    goToPang(currentPang - 1); // 이전
                }
            }
            startAuto(); // manualStop=true 라면 동작하지 않음
        }, { passive: true });

        // 하단 플로팅 바 및 사이드바에서 네비게이션 클릭 시 해당 팡 슬라이드로 이동 및 다이너믹 스크롤
        const bottomNavLinks = document.querySelectorAll('.floating-sidebar__link[href^="#"]');
        bottomNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href').replace('#', '');

                // 타겟이 먹팡, 놀팡 등 팡 슬라이드 내부 요소인지 확인
                const slideIndex = slides.findIndex(slide => slide.id === targetId);

                if (slideIndex !== -1) {
                    // 모바일에서만 가로 슬라이더 조작 모드 활성화
                    if (window.matchMedia('(max-width: 768px)').matches) {
                        e.preventDefault(); // 기본 앵커 이동 방지
                        e.stopImmediatePropagation(); // 전역 Smooth Scroll 등 다른 이벤트 중지

                        // 자동 롤링 정지 후 해당 인덱스로 이동
                        manualStop = true;
                        stopAuto();
                        goToPang(slideIndex);

                        // 화면을 해당 컨테이너 뷰포트로 부드럽게 스크롤 (헤더 영역 보정)
                        const headerOffset = 70;
                        const elementPos = slider.getBoundingClientRect().top;
                        const offsetPos = elementPos + window.pageYOffset - headerOffset;

                        window.scrollTo({
                            top: offsetPos,
                            behavior: 'smooth'
                        });
                    } else {
                        // PC 모드: 가로 슬라이더 무시, 정확히 해당 섹터로 수직 스크롤
                        e.preventDefault();
                        e.stopImmediatePropagation();

                        const targetElement = document.getElementById(targetId);
                        if (targetElement) {
                            const headerOffset = 80;
                            const elementPos = targetElement.getBoundingClientRect().top;
                            const offsetPos = elementPos + window.pageYOffset - headerOffset;

                            window.scrollTo({
                                top: offsetPos,
                                behavior: 'smooth'
                            });
                        }
                    }
                }
            });
        });

        // 뷰포트 교차 관찰자: 화면 밖으로 나갔다가 돌아오면 재개
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    manualStop = false; // 상태 초기화
                    if (window.matchMedia('(max-width: 768px)').matches) {
                        startAuto();
                    }
                } else {
                    stopAuto();
                }
            });
        }, { threshold: 0.1 }); // 10% 이상 보일 때

        observer.observe(slider);

        // 모바일에서만 동작하도록 (768px 이하)
        const mediaQuery = window.matchMedia('(max-width: 768px)');

        // 견적 받기 버튼 반응형 DOM 이동
        const repositionQuoteButtons = (isMobile) => {
            document.querySelectorAll('.category-content').forEach(content => {
                const btn = content.querySelector('.btn[href="#order"]');
                const info = content.querySelector('.category-info');

                if (!btn || !info) return;

                if (isMobile) {
                    btn.classList.add('mobile-moved-btn');
                    content.appendChild(btn); // 썸네일 뒤(맨 아래)로 이동
                } else {
                    btn.classList.remove('mobile-moved-btn');
                    info.appendChild(btn); // 원상복구
                }
            });
        };

        const onMediaChange = (mq) => {
            if (mq.matches) {
                // 모바일: 슬라이더 초기화
                goToPang(currentPang, false);
                manualStop = false;
                startAuto();
            } else {
                // 데스크탑: 슬라이더 해제
                stopAuto();
                track.style.transform = '';
                track.style.transition = '';
            }
            repositionQuoteButtons(mq.matches);
        };

        mediaQuery.addEventListener('change', onMediaChange);
        onMediaChange(mediaQuery); // 초기 실행
    })();

});

/* ══════════════════════════════════════════════════════════
   AUTH MODULE — Supabase Auth 연동
   ══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function initAuth() {

    const overlay = document.getElementById('authOverlay');
    const modal = document.getElementById('authModal');
    const closeBtn = document.getElementById('authModalClose');
    const tabLogin = document.getElementById('tabLogin');
    const tabSignup = document.getElementById('tabSignup');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginError = document.getElementById('loginError');
    const signupError = document.getElementById('signupError');

    if (!overlay || !modal) return;

    /* ── 모달 열기/닫기 ─────────────────────────── */
    function openAuthModal(tab) {
        overlay.classList.add('open');
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        switchTab(tab === 'signup' ? 'signup' : 'login');
    }

    function closeAuthModal() {
        overlay.classList.remove('open');
        modal.classList.remove('open');
        document.body.style.overflow = '';
        if (loginError) loginError.textContent = '';
        if (signupError) signupError.textContent = '';
    }

    closeBtn.addEventListener('click', closeAuthModal);
    overlay.addEventListener('click', closeAuthModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAuthModal(); });

    /* ── 탭 전환 ─────────────────────────────────── */
    function switchTab(tab) {
        if (tab === 'login') {
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
            loginForm.style.display = 'flex';
            signupForm.style.display = 'none';
        } else {
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
            signupForm.style.display = 'flex';
            loginForm.style.display = 'none';
        }
    }

    tabLogin.addEventListener('click', () => switchTab('login'));
    tabSignup.addEventListener('click', () => switchTab('signup'));
    document.getElementById('goToSignup').addEventListener('click', () => switchTab('signup'));
    document.getElementById('goToLogin').addEventListener('click', () => switchTab('login'));

    /* ── 버튼으로 모달 열기 ──────────────────────── */
    ['navLoginBtn', 'mobileLoginBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => openAuthModal('login'));
    });
    ['navSignupBtn', 'mobileSignupBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => openAuthModal('signup'));
    });

    /* ── UI 반영 ────────────────────────────────── */
    function applyLoggedInUI(user) {
        const name = user.user_metadata?.name || user.email?.split('@')[0] || '사용자';
        document.getElementById('navLoginBtn').style.display = 'none';
        document.getElementById('navSignupBtn').style.display = 'none';
        document.getElementById('navUser').style.display = 'flex';
        document.getElementById('navUserName').textContent = `${name}님`;
        document.getElementById('mobileAuth').style.display = 'none';
        document.getElementById('mobileUser').style.display = 'flex';
        document.getElementById('mobileUserName').textContent = `👋 ${name}님`;
    }

    function applyLoggedOutUI() {
        document.getElementById('navLoginBtn').style.display = '';
        document.getElementById('navSignupBtn').style.display = '';
        document.getElementById('navUser').style.display = 'none';
        document.getElementById('mobileAuth').style.display = '';
        document.getElementById('mobileUser').style.display = 'none';
    }

    /* ── 회원가입 (Supabase Auth) ──────────────── */
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        signupError.textContent = '';
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        const pw = document.getElementById('signupPassword').value;
        const pw2 = document.getElementById('signupPasswordConfirm').value;

        if (pw.length < 6) { signupError.textContent = '비밀번호는 6자 이상이어야 합니다.'; return; }
        if (pw !== pw2) { signupError.textContent = '비밀번호가 일치하지 않습니다.'; return; }

        try {
            const data = await PangAuth.signUp(email, pw, name);
            if (data.user) {
                applyLoggedInUI(data.user);
                closeAuthModal();
            }
        } catch (err) {
            signupError.textContent = err.message || '회원가입에 실패했습니다.';
        }
    });

    /* ── 로그인 (Supabase Auth) ────────────────── */
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const pw = document.getElementById('loginPassword').value;

        try {
            const data = await PangAuth.signIn(email, pw);
            if (data.user) {
                applyLoggedInUI(data.user);
                closeAuthModal();
            }
        } catch (err) {
            loginError.textContent = err.message || '이메일 또는 비밀번호가 올바르지 않습니다.';
        }
    });

    /* ── 로그아웃 (Supabase Auth) ──────────────── */
    ['navLogoutBtn', 'mobileLogoutBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', async () => {
            try { await PangAuth.signOut(); } catch (e) { }
            applyLoggedOutUI();
        });
    });

    /* ── 세션 복원 (Supabase) ─────────────────── */
    (async () => {
        try {
            const user = await PangAuth.getUser();
            if (user) applyLoggedInUI(user);
            else applyLoggedOutUI();
        } catch {
            applyLoggedOutUI();
        }
    })();

    /* ── 인증 상태 변화 리스너 ────────────────── */
    PangAuth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            applyLoggedInUI(session.user);
        } else if (event === 'SIGNED_OUT') {
            applyLoggedOutUI();
        }
    });

    /* ── 동적 푸터 렌더링 (Supabase) ─────────── */
    async function renderDynamicFooter() {
        try {
            const f = await PangData.getSection('footer');
            if (!f) return;

            const logoEl = document.querySelector('.footer__logo');
            if (logoEl && f.brandName) logoEl.textContent = f.brandName;

            const sloganEl = document.querySelector('.footer__slogan');
            if (sloganEl && f.slogan) {
                sloganEl.innerHTML = f.slogan.replace(/\n/g, '<br class="mobile-break">');
            }

            const snsLinks = document.querySelectorAll('.footer__social a');
            if (snsLinks.length >= 3) {
                if (f.sns?.instagram) snsLinks[0].href = f.sns.instagram;
                if (f.sns?.youtube) snsLinks[1].href = f.sns.youtube;
                if (f.sns?.tiktok) snsLinks[2].href = f.sns.tiktok;
            }

            const gridDivs = document.querySelectorAll('.footer__grid > div');
            if (gridDivs.length >= 3 && f.companyLinks && f.companyLinks.length > 0) {
                const companyUl = gridDivs[2].querySelector('.footer__links');
                if (companyUl) {
                    companyUl.innerHTML = f.companyLinks.map(link =>
                        `<li><a href="${link.url}">${link.label}</a></li>`
                    ).join('');
                }
            }

            const contactUl = document.querySelector('.footer__contact');
            if (contactUl && f.contact) {
                contactUl.innerHTML = `
                    <li><i class="ri-kakao-talk-fill"></i> ${f.contact.kakao || ''}</li>
                    <li><i class="ri-mail-line"></i> <a href="mailto:${f.contact.email}" style="color:inherit;">${f.contact.email || ''}</a></li>
                    <li><i class="ri-time-line"></i> ${f.contact.time || ''}</li>
                `;
            }
        } catch (err) {
            console.error('푸터 데이터 렌더링 실패:', err);
        }
    }

    renderDynamicFooter();
});


