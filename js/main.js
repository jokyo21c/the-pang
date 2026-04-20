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
                    testimonialTrack.innerHTML = items.map((t, i) => `
                        <div class="testimonial-card">
                            <div class="testimonial-card__inner">
                                <div class="testimonial-card__photo">
                                    <img src="${t.photo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop'}" alt="${t.author || ''}">
                                </div>
                                <div class="testimonial-card__content">
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
            e.stopPropagation(); // 썸네일 스와이프 시 부모 팡 슬라이더로 이벤트 전달 방지
            if (isTransitioning) return;
            startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
            startY = e.type.includes('mouse') ? e.pageY : e.touches[0].clientY;
            isDragging = true;
            track.style.transition = 'none';
            prevTranslate = currentIndex * -100;
        };

        const touchMove = (e) => {
            e.stopPropagation();
            if (!isDragging) return;
            const currentPosition = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
            const diff = currentPosition - startX;
            const trackWidth = track.clientWidth || wrap.clientWidth;
            const percentageDiff = (diff / trackWidth) * 100;
            currentTranslate = prevTranslate + percentageDiff;
            track.style.transform = `translateX(${currentTranslate}%)`;
        };

        const touchEnd = (e) => {
            e.stopPropagation();
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

    // ── Portfolio Center-Focus Carousel (Mobile Only) ─────────────
    window.initPortfolioCarousel = function (wrap) {
        if (!wrap) return;

        // 이미 이벤트/기본 구조가 설정되었다면 무시
        if (wrap.dataset.carouselInit === 'true') {
            // 외부(Supabase 로드 등)에서 요소가 변경된 경우, 현재 인덱스 유지하며 아이템만 업데이트
            if (wrap._reinitItems) {
                wrap._reinitItems(false); // resetPosition=false: 현재 슬라이드 위치 유지
            }
            return;
        }

        const track = wrap.querySelector('.thumb-all-track');
        const viewport = wrap.querySelector('.thumb-all-viewport');
        const prevBtn = wrap.querySelector('.thumb-all-nav--prev');
        const nextBtn = wrap.querySelector('.thumb-all-nav--next');
        const dotsContainer = wrap.querySelector('.thumb-all-dots');

        if (!track) return;

        // ── thumb-all-page 구조라면 flat하게 변환 (팡 섹션 정적 HTML 지원) ──
        const existingPages = Array.from(track.querySelectorAll('.thumb-all-page'));
        if (existingPages.length > 0) {
            const flatItems = [];
            existingPages.forEach(page => {
                Array.from(page.querySelectorAll('.category-thumb')).forEach(thumb => {
                    const item = document.createElement('div');
                    // css 클래스를 유지하여 배경색 등이 보존되게 함
                    item.className = 'portfolio-carousel-item ' + Array.from(thumb.classList).filter(c => c !== 'category-thumb').join(' ');
                    item.style.cssText = thumb.style.cssText;

                    if (thumb.dataset.color) {
                        item.style.background = thumb.dataset.color;
                    }
                    if (!item.style.background) {
                        item.style.background = 'var(--bg-surface-elevated)';
                    }

                    item.innerHTML = thumb.innerHTML;
                    flatItems.push(item);
                });
            });
            track.innerHTML = '';
            flatItems.forEach(item => track.appendChild(item));
        }

        let items = Array.from(track.querySelectorAll('.portfolio-carousel-item'));
        if (items.length === 0) return;

        wrap.dataset.carouselInit = 'true'; // 초기화 등록

        let total = items.length;
        let currentIndex = 0;
        const MAX_DOTS = 5;

        // 풀스크린(확장) 오버레이 생성 함수
        window.openFullscreenMedia = function(src, isImage = false, originalVideoEl = null) {
            // 이전 모달이 남아있는 현상(더블클릭 등)을 방지하기 위해 강제 클리어
            document.querySelectorAll('.pang-fullscreen-overlay').forEach(el => el.remove());

            const overlay = document.createElement('div');
            overlay.className = 'pang-fullscreen-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
            overlay.style.zIndex = '99999';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.flexDirection = 'column';

            let mediaEl;
            if (isImage) {
                mediaEl = document.createElement('img');
                mediaEl.src = src;
                mediaEl.style.maxWidth = '100%';
                mediaEl.style.maxHeight = '90vh';
                mediaEl.style.objectFit = 'contain';
            } else {
                mediaEl = document.createElement('video');
                mediaEl.src = src;
                mediaEl.controls = true;
                mediaEl.autoplay = true;
                mediaEl.playsInline = true;
                mediaEl.muted = true;
                mediaEl.volume = 0.2; // 최초 음량 20%
                mediaEl.style.maxWidth = '100%';
                mediaEl.style.maxHeight = '90vh';
                mediaEl.style.outline = 'none';
            }

            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '<i class="ri-close-line"></i>';
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '20px';
            closeBtn.style.right = '20px';
            closeBtn.style.background = 'transparent';
            closeBtn.style.color = '#fff';
            closeBtn.style.border = 'none';
            closeBtn.style.fontSize = '35px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.zIndex = '1000'; // 네이티브 컨트롤보다 위에 위치

            const unmuteBtn = document.createElement('button');
            unmuteBtn.innerHTML = '<i class="ri-volume-mute-line"></i>';
            unmuteBtn.style.position = 'absolute';
            unmuteBtn.style.top = '70px';
            unmuteBtn.style.right = '20px';
            unmuteBtn.style.background = 'transparent';
            unmuteBtn.style.color = '#fff';
            unmuteBtn.style.border = 'none';
            unmuteBtn.style.fontSize = '30px';
            unmuteBtn.style.cursor = 'pointer';
            unmuteBtn.style.zIndex = '1000'; // 모바일 클릭 인식을 위한 z-index 추가

            if (!isImage) {
                // 클릭 (및 모바일 터치) 지원
                unmuteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault(); // 기본 이벤트 방지
                    if (mediaEl.muted) {
                        mediaEl.muted = false;
                        unmuteBtn.innerHTML = '<i class="ri-volume-up-line"></i>';
                    } else {
                        mediaEl.muted = true;
                        unmuteBtn.innerHTML = '<i class="ri-volume-mute-line"></i>';
                    }
                });
            }

            const isPc = window.innerWidth > 768;

            const wrap = document.createElement('div');
            wrap.style.position = 'relative';
            wrap.style.display = 'inline-block';

            if (isPc) {
                // PC: 확대영상 화면이 끝나는 우측 바로 옆(바깥쪽)으로 위치를 변경
                [closeBtn, unmuteBtn].forEach(btn => {
                    btn.style.background = 'rgba(255,255,255,0.06)';
                    btn.style.borderRadius = '50%';
                    btn.style.width = '44px';
                    btn.style.height = '44px';
                    btn.style.display = 'flex';
                    btn.style.justifyContent = 'center';
                    btn.style.alignItems = 'center';
                    btn.style.transition = 'background 0.2s';
                    btn.onmouseenter = () => btn.style.background = 'rgba(255,255,255,0.15)';
                    btn.onmouseleave = () => btn.style.background = 'rgba(255,255,255,0.06)';
                });
                
                closeBtn.style.fontSize = '30px';
                closeBtn.style.top = '0px';
                closeBtn.style.right = '-60px'; // 영상 바깥 우측으로 밀어냄
                
                unmuteBtn.style.fontSize = '24px';
                unmuteBtn.style.top = '54px';  // 닫기 버튼 아래 간격 유지
                unmuteBtn.style.right = '-60px';
            } else {
                // 모바일: 영상 영역 안쪽 우측 상단에 배치
                [closeBtn, unmuteBtn].forEach(btn => {
                    btn.style.background = 'rgba(0,0,0,0.5)';
                    btn.style.borderRadius = '50%';
                    btn.style.width = '40px';
                    btn.style.height = '40px';
                    btn.style.display = 'flex';
                    btn.style.justifyContent = 'center';
                    btn.style.alignItems = 'center';
                });
                
                closeBtn.style.fontSize = '24px';
                closeBtn.style.top = '10px';
                closeBtn.style.right = '10px';
                
                unmuteBtn.style.fontSize = '20px';
                unmuteBtn.style.top = '60px';
                unmuteBtn.style.right = '10px';
            }

            wrap.appendChild(mediaEl);
            wrap.appendChild(closeBtn);
            if (!isImage) wrap.appendChild(unmuteBtn);
            overlay.appendChild(wrap);

            // 오버레이에 DOM 추가 (버튼들이 비디오보다 나중에/혹은 z-index로 위로 오게)
            document.body.appendChild(overlay);

            // 기존 캐러셀의 해당 비디오는 잠시 일시정지
            if (!isImage) {
                if (originalVideoEl) originalVideoEl.pause();
            }

            const closeOverlay = () => {
                if (!isImage) mediaEl.pause();
                overlay.remove();
                // 닫을 때 기존 캐러셀 비디오 다시 재생
                if (!isImage) {
                    if (originalVideoEl) originalVideoEl.play().catch(e => console.warn(e));
                }
            };

            closeBtn.addEventListener('click', closeOverlay);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeOverlay();
            });
        }

        // resetPosition: true=인덱스 0으로 리셋(첫 초기화), false=현재 위치 유지(Supabase 재로드)
        wrap._reinitItems = function (resetPosition) {
            if (resetPosition === undefined) resetPosition = true;

            items = Array.from(track.querySelectorAll('.portfolio-carousel-item'));
            total = items.length;

            // 클릭 이벤트만 등록 (onended 자동이동 제거 - 무작위 점프 방지)
            items.forEach((item, i) => {
                const video = item.querySelector('video');
                // video.onended 는 등록하지 않음 (영상 끝나도 자동이동 안 함)

                item.addEventListener('click', () => {
                    if (currentIndex === i) {
                        // 중앙 아이템 클릭 시 풀스크린 오버레이 열기
                        const src = video ? video.src : (item.querySelector('img') ? item.querySelector('img').src : null);
                        if (src) window.openFullscreenMedia(src, !video, video);
                    } else {
                        // 중앙이 아닌 배경 아이템을 클릭하면 중앙으로 이동
                        updateCarousel(i);
                    }
                });
            });

            // dots 재생성 (총 개수가 변경된 경우 갱신)
            if (dotsContainer) {
                const count = Math.min(total, MAX_DOTS);
                dotsContainer.innerHTML = Array.from({ length: count }, (_, j) =>
                    `<span class="thumb-all-dot ${j === 0 ? 'active' : ''}"></span>`
                ).join('');
            }

            // 위치 리셋 여부에 따라 처리
            if (resetPosition) {
                updateCarousel(0, false); // 첫 초기화: 인덱스 0으로 이동
            } else {
                // Supabase 재로드: 현재 인덱스 유지하며 레이아웃만 재계산
                updateCarousel(currentIndex, false);
            }
        };

        // 처음 아이템 바인딩 실행 (초기화이므로 0번 인덱스로 설정)
        wrap._reinitItems(true);

        function updateDots(idx) {
            if (!dotsContainer) return;
            const dots = dotsContainer.querySelectorAll('.thumb-all-dot');
            if (!dots.length) return;
            if (total <= MAX_DOTS) {
                dots.forEach((d, i) => d.classList.toggle('active', i === idx));
            } else {
                const half = Math.floor(MAX_DOTS / 2);
                let winStart = idx - half;
                winStart = Math.max(0, Math.min(winStart, total - MAX_DOTS));
                const activeDotIdx = idx - winStart;
                dots.forEach((d, i) => d.classList.toggle('active', i === activeDotIdx));
            }
        }

        function updateCarousel(index, animate) {
            if (animate === undefined) animate = true;
            // 무한 루프
            if (index < 0) index = total - 1;
            if (index >= total) index = 0;
            currentIndex = index;

            let vw = (viewport || wrap).offsetWidth;
            // PC 팡 섹션: 그리드 레이아웃이 아직 계산되지 않아 viewport 너비가 작을 수 있음
            // threshold를 200으로 높여서 더 넓은 범위에서 폴백 적용
            if (vw < 200) {
                if (window.innerWidth > 768 && wrap.closest('.pang-slide')) {
                    // PC 팡 섹션: container의 grid 1fr 1fr 우측열 너비 추정
                    const container = wrap.closest('.container');
                    vw = container ? (container.offsetWidth - 40) / 2 : window.innerWidth / 3;
                } else {
                    const gridCol = wrap.closest('.category-thumbnails');
                    vw = gridCol ? gridCol.offsetWidth : (wrap.closest('.container') ? wrap.closest('.container').offsetWidth / 2 : window.innerWidth / 2);
                }
            }

            const itemWidth = vw / 3;

            // 모든 아이템 너비 동일하게 설정
            items.forEach(item => { item.style.width = itemWidth + 'px'; });

            // 중앙 정렬 translateX
            const translateX = vw / 2 - itemWidth * (currentIndex + 0.5);
            track.style.transition = animate
                ? 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
                : 'none';
            track.style.transform = `translateX(${translateX}px)`;

            // 아이템 상태 클래스 적용 및 영상 재생 제어
            items.forEach((item, i) => {
                let dist = Math.abs(i - currentIndex);
                // 양방향 무한 루프 고려 최단 거리 (아이템이 3개 이상일 때)
                if (total >= 3 && dist > total / 2) dist = total - dist;

                item.classList.remove('is-center', 'is-side', 'is-far');

                const video = item.querySelector('video');

                if (dist === 0) {
                    item.classList.add('is-center');
                    // 실제 모바일 기기에서 autoplay를 위해 muted + playsinline 강제 설정
                    if (video) {
                        video.muted = true;
                        video.loop = true;
                        video.setAttribute('playsinline', '');
                        video.setAttribute('webkit-playsinline', '');
                        video.play().catch(e => console.warn('Autoplay prevented:', e));
                    }
                } else {
                    if (dist === 1) item.classList.add('is-side');
                    else item.classList.add('is-far');

                    if (video) {
                        video.pause();
                        video.currentTime = 0; // 배경으로 갈 때 첫 프레임으로 초기화
                    }
                }
            });

            updateDots(currentIndex);
            wrap.dataset.slideIndex = currentIndex;
        }

        wrap._updateCarousel = updateCarousel; // 외부(재초기화) 등에서 호출할 수 있도록 노출

        // 레이아웃 후 초기화 (offsetWidth 확보)
        requestAnimationFrame(() => updateCarousel(0, false));
        // PC에서 그리드 레이아웃이 늦게 계산될 수 있으므로 지연 재계산
        setTimeout(() => updateCarousel(currentIndex, false), 300);

        // 버튼
        if (prevBtn) prevBtn.addEventListener('click', () => updateCarousel(currentIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => updateCarousel(currentIndex + 1));

        // Dots 클릭
        if (dotsContainer) {
            dotsContainer.addEventListener('click', (e) => {
                const dot = e.target.closest('.thumb-all-dot');
                if (!dot) return;
                const idx = Array.from(dotsContainer.querySelectorAll('.thumb-all-dot')).indexOf(dot);
                if (idx < 0) return;
                const half = Math.floor(MAX_DOTS / 2);
                let winStart = currentIndex - half;
                winStart = Math.max(0, Math.min(winStart, total - Math.min(total, MAX_DOTS)));
                updateCarousel(winStart + idx);
            });
        }

        // 터치 스와이프
        let touchStartX = 0;
        let touchStartY = 0;
        const touchTarget = viewport || wrap;

        touchTarget.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        touchTarget.addEventListener('touchend', (e) => {
            const diffX = e.changedTouches[0].clientX - touchStartX;
            const diffY = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(diffY) > Math.abs(diffX)) return; // 수직 스크롤 무시
            if (Math.abs(diffX) > 30) {
                if (diffX < 0) updateCarousel(currentIndex + 1);
                else updateCarousel(currentIndex - 1);
            }
        });

        // 리사이즈 시 재계산
        window.addEventListener('resize', () => updateCarousel(currentIndex, false));
    };

    // ── Dynamic Portfolio Categories from Supabase ─────────────────
    const _isVideoUrl = (url) => {
        if (!url) return false;
        if (url.startsWith('data:video/')) return true;
        if (/\.(mp4|webm|ogg|mov|avi)([\?\#].*)?$/i.test(url)) return true;
        return false;
    };

    // ── PC 전용 포트폴리오 그리드 매니저 ─────────────────────────────
    // PC 환경의 #portfolio 섹션에서만 동작. 모바일/팡 섹션과 완전히 독립.
    window.initPortfolioPcGrid = function (allItems) {
        if (window.innerWidth <= 768) return; // PC 전용

        const track = document.getElementById('portfolioTrack');
        const moreBtn = document.getElementById('portfolioMoreBtn');
        if (!track || !moreBtn) return;

        const COLS = 5;
        const INITIAL_ROWS = 2;
        const PAGE_SIZE = COLS;       // 더보기 1회당 1행(5개) 추가
        const INITIAL_COUNT = COLS * INITIAL_ROWS; // 10개
        const mediaStyle = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;border-radius:inherit;z-index:1;';

        // grid 아이템 HTML 생성 헬퍼
        function makeItemHtml(item, idx) {
            let url = item.media_url || item.url || '';
            const mType = item.media_type || item.type;
            const isVid = mType === 'video' || _isVideoUrl(url);
            if (isVid && url && !url.includes('#t=')) url += '#t=0.001';
            
            // bg 렌더링 수정: 기본값은 회색계열 배경
            const bgStyle = item.bg ? item.bg : 'var(--color-bg-subtle, #222)';

            let mediaTag = '';
            if (url) {
                // preload="auto" 추가 및 video 자체의 onmouseenter 제거 (부모 div에서 제어)
                mediaTag = isVid
                    ? `<video src="${url}" muted loop playsinline webkit-playsinline preload="auto" style="${mediaStyle}"></video>`
                    : `<img src="${url}" alt="포트폴리오 #${idx + 1}" style="${mediaStyle}">`;
            }

            // 빈 URL일때 깨진 이미지 방지 및 category-thumb 클래스 추가로 hover 효과(overlay) 연동
            // 부모(.portfolio-grid-item)에 pointer-events를 온전히 받게 하고 hover시 비디오 재생/정지
            return `<div class="portfolio-grid-item category-thumb" style="background:${bgStyle};position:relative;overflow:hidden;border-radius:var(--radius-card);cursor:pointer;" onmouseenter="const v=this.querySelector('video'); if(v) v.play().catch(e=>{});" onmouseleave="const v=this.querySelector('video'); if(v) { v.pause(); v.currentTime=0; }" onclick="event.stopPropagation(); const v=this.querySelector('video'); const url=v?v.src:(this.querySelector('img')?this.querySelector('img').src:null); if(url) window.openFullscreenMedia(url, !v, v);">
                ${mediaTag}
                <div class="category-thumb__overlay" style="z-index:2; pointer-events:none;"><i class="ri-play-circle-line"></i></div>
            </div>`;
        }

        let shownCount = 0;

        // 표시된 아이템 수 기준으로 track을 다시 렌더링
        function renderGrid(count) {
            const sliceItems = allItems.slice(0, count);
            // track을 flex wrap 모드로 사용 (CSS에서 설정)
            track.innerHTML = sliceItems.map((item, i) => makeItemHtml(item, i)).join('');
            shownCount = count;
        }

        // 더보기/초기화 버튼 가시성 업데이트
        function updateMoreBtn() {
            if (allItems.length <= INITIAL_COUNT) {
                // 전체 아이템이 10개 이하이면 버튼 숨김
                moreBtn.style.display = 'none';
                return;
            }

            if (shownCount >= allItems.length) {
                // 모든 아이템이 표시됨 → 닫기 버튼으로 전환
                moreBtn.style.display = 'inline-flex';
                moreBtn.innerHTML = '닫기 <i class="ri-refresh-line"></i>';
                moreBtn.dataset.mode = 'reset';
            } else {
                // 아직 더 있음 → 더보기 버튼
                moreBtn.style.display = 'inline-flex';
                moreBtn.innerHTML = '더보기 <i class="ri-arrow-right-line"></i>';
                moreBtn.dataset.mode = 'more';
            }
        }

        // 버튼 이벤트 (중복 등록 방지)
        if (!moreBtn.dataset.pcGridBound) {
            moreBtn.dataset.pcGridBound = 'true';
            moreBtn.addEventListener('click', () => {
                if (moreBtn.dataset.mode === 'reset') {
                    // 초기화: 처음 10개로 되돌림
                    renderGrid(INITIAL_COUNT);
                } else {
                    // 더보기: 5개씩 추가
                    const nextCount = Math.min(shownCount + PAGE_SIZE, allItems.length);
                    renderGrid(nextCount);
                }
                updateMoreBtn();
            });
        }

        // 최초 렌더링 (10개)
        renderGrid(Math.min(INITIAL_COUNT, allItems.length));
        updateMoreBtn();
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

                const isMobile = window.innerWidth <= 768;
                const isPangSection = !!section.closest('.pang-slide');
                const useCenterCarousel = isMobile || isPangSection;
                const mediaStyle = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;border-radius:inherit;z-index:1;';

                if (useCenterCarousel) {
                    // 모바일 + PC 팡 섹션: 개별 flat 아이템으로 렌더링 (센터-포커스 캐러셀)
                    let trackHtml = '';
                    catItems.forEach((catItem, idx) => {
                        let url = catItem.media_url;
                        const isVid = catItem.media_type === 'video' || _isVideoUrl(url);
                        if (isVid && url && !url.includes('#t=')) url += '#t=0.001';
                        const mediaTag = isVid
                            ? `<video src="${url}" muted loop playsinline webkit-playsinline preload="metadata" style="${mediaStyle}"></video>`
                            : `<img src="${url}" alt="${catName} #${idx + 1}" style="${mediaStyle}">`;
                        trackHtml += `<div class="portfolio-carousel-item" style="background:var(--bg-surface-elevated); position:relative; overflow:hidden;">${mediaTag}<div class="category-thumb__overlay" style="z-index:2;"><i class="ri-play-circle-line"></i></div></div>`;
                    });
                    track.innerHTML = trackHtml;
                    dotsContainer.innerHTML = ''; // initPortfolioCarousel에서 생성
                } // (팡 섹션 데스크톱 분기는 센터 캐러셀로 이미 처리됨)
            });

            // PC 포트폴리오 섹션 전용 그리드 렌더링 (팡 섹션과 별개)
            if (window.innerWidth > 768) {
                window.initPortfolioPcGrid(items); // 전체 아이템(카테고리 미분류) 전달
            }

            // 슬라이더 재초기화 (모바일/팡 섹션만 — PC 포트폴리오 섹션 제외)
            document.querySelectorAll('.thumb-all-wrap').forEach(wrap => {
                const isPang = wrap.closest('.pang-slide') !== null;
                const isPortfolioSection = wrap.id === 'portfolioSlideWrap';
                if (isPortfolioSection && window.innerWidth > 768) return; // PC 포트폴리오는 그리드로 처리
                if (window.innerWidth <= 768 || isPang) {
                    window.initPortfolioCarousel(wrap);
                } else {
                    window.initThumbAllSlide(wrap);
                }
            });
        } catch (err) {
            console.error('Supabase 포트폴리오 로드 실패:', err);
        }
    }

    // Supabase에서 비동기 로드 (기본 썸네일은 HTML에 유지)
    loadPortfolioFromSupabase();

    // Initialize all existing sliders (모바일/데스크톱 분기 — PC 포트폴리오 섹션 제외)
    document.querySelectorAll('.thumb-all-wrap').forEach(wrap => {
        const isPangSection = wrap.closest('.pang-slide') !== null;
        const isPortfolioSection = wrap.id === 'portfolioSlideWrap';
        // PC 환경의 #portfolio 섹션은 그리드 방식으로 처리 (Supabase 로드 후 initPortfolioPcGrid 호출)
        if (isPortfolioSection && window.innerWidth > 768) return;
        if (window.innerWidth <= 768 || isPangSection) {
            window.initPortfolioCarousel(wrap);
        } else {
            window.initThumbAllSlide(wrap);
        }
    });


    // ── Pang Section Slider (Mobile: 먹팡~멋팡 수평 슬라이더) ──
    (function initPangSectionSlider() {
        const slider = document.getElementById('pangSectionSlider');
        const track = document.getElementById('pangSliderTrack');
        const slides = slider ? Array.from(slider.querySelectorAll('.pang-slide')) : [];

        if (!slider || !track || slides.length === 0) return;

        let currentPang = 0;
        let autoTimer = null;
        let manualStop = false;    // 수동 조작으로 인한 일시 중지 플래그
        let navJustClicked = false; // 네비 클릭 직후 스크롤 중 자동 재개 방지 플래그
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
            // PC 환경에서는 수평 슬라이더 애니메이션을 동작시키지 않음
            if (window.innerWidth > 768) {
                track.style.transform = '';
                return;
            }

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
            if (manualStop || window.innerWidth > 768) return; // 수동으로 중지된 상태거나 PC 환경이면 무시
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
                if (!manualStop) startAuto(); // manualStop 상태면 재개 안 함
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

        // ── 사이드바 모든 링크 클릭 통합 처리 (모바일/PC 공통) ──────────────────
        // nav.js의 이중 리스너 제거 후 이곳에서 단일 처리 (이벤트 순서 충돌 방지)
        const allSidebarLinks = document.querySelectorAll('.floating-sidebar__link');
        allSidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href') || '';
                const isExternal = !href.startsWith('#');
                const isKakao = link.closest('.floating-sidebar__item--kakao');

                // 카카오(외부 링크)는 기본 동작 유지
                if (isKakao || isExternal) return;

                const targetId = href.replace('#', '');

                // ── Active 상태 업데이트 (카카오 제외) ─────────────
                document.querySelectorAll('.floating-sidebar__link').forEach(l => {
                    if (!l.closest('.floating-sidebar__item--kakao')) {
                        l.classList.remove('active');
                    }
                });
                link.classList.add('active');

                // ── 팡 슬라이드 (먹팡~멋팡) 처리 ────────────────────
                const slideIndex = slides.findIndex(slide => slide.id === targetId);
                if (slideIndex !== -1 && window.matchMedia('(max-width: 768px)').matches) {
                    e.preventDefault(); // 앵커 기본 이동 완전 차단
                    e.stopImmediatePropagation();

                    // 자동 슬라이드 즉시 정지 (navJustClicked로 IntersectionObserver 재개도 방지)
                    manualStop = true;
                    navJustClicked = true;
                    stopAuto();

                    // 슬라이드 이동
                    goToPang(slideIndex);

                    // 팡 섹션이 화면에 보이도록 스크롤
                    const headerOffset = 70;
                    const elementPos = slider.getBoundingClientRect().top;
                    const offsetPos = elementPos + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: offsetPos, behavior: 'smooth' });

                    // smooth scroll 완료(약 800ms) 후 플래그 해제 → 이후 이탈+재진입 시 정상 재개
                    setTimeout(() => { navJustClicked = false; }, 900);
                    return;
                }

                // ── 팡 슬라이드 (먹팡~멋팡) 처리 (PC) ─────────────────
                if (slideIndex !== -1 && window.innerWidth > 768) {
                    e.preventDefault();
                    
                    // 1. PC 팡 탭 상태 동기화
                    const pcPangTabs = document.querySelectorAll('.pc-pang-tabs-wrapper .pc-pang-tab-btn');
                    pcPangTabs.forEach(t => {
                        t.classList.remove('active');
                        if (t.getAttribute('data-target') === targetId) {
                            t.classList.add('active');
                        }
                    });

                    // 2. 팡 섹션 노출 토글
                    const pcPangSections = [
                        document.getElementById('meokpang'),
                        document.getElementById('nolpang'),
                        document.getElementById('swimpang'),
                        document.getElementById('salpang'),
                        document.getElementById('meotpang')
                    ];
                    pcPangSections.forEach(sec => {
                        if (sec) {
                            if (sec.id === targetId) {
                                sec.classList.remove('pang-slide-pc-hidden');
                                setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 50);
                            } else {
                                sec.classList.add('pang-slide-pc-hidden');
                            }
                        }
                    });

                    // 3. 부드러운 스크롤 이동 (팡 통합 슬라이더 래퍼 기준)
                    const sliderNode = document.getElementById('pangSectionSlider');
                    if (sliderNode) {
                        const top = sliderNode.getBoundingClientRect().top + window.pageYOffset - 70;
                        window.scrollTo({ top: top, behavior: 'smooth' });
                    }
                    return;
                }
                // ── 일반 앵커(홈, 기타 섹션) 처리 ───────────────────
                e.preventDefault();
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    const headerOffset = 70;
                    const offsetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: offsetPos, behavior: 'smooth' });
                }
            });
        });


        // 뷰포트 교차 관찰자 — 화면 밖으로 나갔다가 돌아오면 자동 재개 (manualStop 리셋)
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 네비 클릭 직후 스크롤 중이면 자동 재개 건너뜀
                    if (navJustClicked) return;
                    // 스크롤로 다시 진입하면 상태 리셋 후 자동 재개
                    manualStop = false;
                    if (window.matchMedia('(max-width: 768px)').matches) {
                        startAuto();
                    }
                } else {
                    // 화면에서 이탈 시 자동 정지
                    stopAuto();
                }
            });
        }, { threshold: 0.1 });

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
                    companyUl.innerHTML = f.companyLinks.map(link => {
                        if (link.label.includes('회사소개')) {
                            return `<li><a href="javascript:void(0)" onclick="document.getElementById('companyIntroModal').style.display='flex'">${link.label}</a></li>`;
                        } else if (link.label.includes('이용약관')) {
                            return `<li><a href="javascript:void(0)" onclick="document.getElementById('termsModal').style.display='flex'">${link.label}</a></li>`;
                        } else if (link.label.includes('개인정보')) {
                            return `<li><a href="javascript:void(0)" onclick="document.getElementById('privacyModal').style.display='flex'">${link.label}</a></li>`;
                        } else if (link.label.includes('공지사항')) {
                            return `<li><a href="javascript:void(0)" onclick="document.getElementById('noticeModal').style.display='flex'">${link.label}</a></li>`;
                        }
                        return `<li><a href="${link.url}">${link.label}</a></li>`;
                    }).join('');
                }
            }

            const contactUl = document.querySelector('.footer__contact');
            if (contactUl && f.contact) {
                contactUl.innerHTML = `
                    <li><a href="https://pf.kakao.com/_CCxcCX" target="_blank"><i class="ri-kakao-talk-fill"></i> ${f.contact.kakao || '카카오톡 채널'}</a></li>
                    <li><i class="ri-mail-line"></i> <a href="mailto:${f.contact.email || 'thepang2026@gmail.com'}" style="color:inherit;">${f.contact.email || 'thepang2026@gmail.com'}</a></li>
                    <li><i class="ri-time-line"></i> ${f.contact.time || '평일 09:00-18:00'}</li>
                `;
            }
        } catch (err) {
            console.error('푸터 데이터 렌더링 실패:', err);
        }
    }

    // ── PC 전용 팡 섹션 탭 로직 ──────────────────────────────────────
    const pcPangTabs = document.querySelectorAll('.pc-pang-tabs-wrapper .pc-pang-tab-btn');
    const pcPangSections = [
        document.getElementById('meokpang'),
        document.getElementById('nolpang'),
        document.getElementById('swimpang'),
        document.getElementById('salpang'),
        document.getElementById('meotpang')
    ];

    if (pcPangTabs.length > 0) {
        // 초기 렌더링 시 첫 번째 섹션(먹팡)을 제외하고 모두 PC 환경에서 가림 처리
        pcPangSections.forEach(sec => {
            if (sec && sec.id !== 'meokpang') sec.classList.add('pang-slide-pc-hidden');
        });

        pcPangTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.getAttribute('data-target');
                
                // 버튼 활성화 상태 토글 (모든 영역의 동일 타겟 탭들을 활성화)
                pcPangTabs.forEach(t => {
                    t.classList.remove('active');
                    if (t.getAttribute('data-target') === targetId) {
                        t.classList.add('active');
                    }
                });

                // 사이드바 네비게이션 아이콘 연동 동기화 (PC)
                if (window.innerWidth > 768) {
                    document.querySelectorAll('.floating-sidebar__link').forEach(link => {
                        if (!link.closest('.floating-sidebar__item--kakao')) {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${targetId}`) {
                                link.classList.add('active');
                            }
                        }
                    });
                }

                // 해당되는 팡 섹션만 노출 (클래스 토글)
                pcPangSections.forEach(sec => {
                    if (sec) {
                        if (sec.id === targetId) {
                            sec.classList.remove('pang-slide-pc-hidden');
                        } else {
                            sec.classList.add('pang-slide-pc-hidden');
                        }
                    }
                });

                // 숨겨져 있던 슬라이더(캐러셀)가 나타날 때 width/height 측정 오류로 깨지는 현상 방지. 강제 리사이즈 이벤트 트리거
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 50);
            });
        });
    }

    // ── 외부 접근용 글로벌 팡 네비게이션 함수 (푸터, 기타 외부 링크용) ──
    // PC: 탭 전환 + 스크롤, 모바일: 슬라이드 이동 + 스크롤
    window.navigateToPang = function(pangId) {
        const pangIdMap = ['meokpang', 'nolpang', 'swimpang', 'salpang', 'meotpang'];
        const slideIndex = pangIdMap.indexOf(pangId);
        if (slideIndex === -1) return;

        if (window.innerWidth > 768) {
            // PC: 탭 전환 로직
            const pcPangTabs = document.querySelectorAll('.pc-pang-tabs-wrapper .pc-pang-tab-btn');
            pcPangTabs.forEach(t => {
                t.classList.remove('active');
                if (t.getAttribute('data-target') === pangId) t.classList.add('active');
            });
            const pcPangSections = ['meokpang','nolpang','swimpang','salpang','meotpang'].map(id => document.getElementById(id));
            pcPangSections.forEach(sec => {
                if (sec) {
                    if (sec.id === pangId) sec.classList.remove('pang-slide-pc-hidden');
                    else sec.classList.add('pang-slide-pc-hidden');
                }
            });
            // 사이드바 동기화
            document.querySelectorAll('.floating-sidebar__link').forEach(link => {
                if (!link.closest('.floating-sidebar__item--kakao')) {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${pangId}`) link.classList.add('active');
                }
            });
            setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 50);
            // 팡 슬라이더 영역으로 스크롤
            const sliderNode = document.getElementById('pangSectionSlider');
            if (sliderNode) {
                const top = sliderNode.getBoundingClientRect().top + window.pageYOffset - 70;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        } else {
            // 모바일: 슬라이드 이동 로직
            const track = document.getElementById('pangSliderTrack');
            const slider = document.getElementById('pangSectionSlider');
            if (track) {
                track.style.transition = 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)';
                track.style.transform = `translateX(-${slideIndex * 20}%)`;
                // dot 동기화
                document.querySelectorAll('.pang-nav-dot').forEach(dot => {
                    dot.classList.toggle('active', parseInt(dot.dataset.index, 10) === slideIndex);
                });
                // 사이드바 동기화
                document.querySelectorAll('.floating-sidebar__link[href^="#"]').forEach(link => {
                    if (link.closest('.floating-sidebar__item--kakao')) return;
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${pangId}`) link.classList.add('active');
                });
            }
            // 팡 슬라이더 영역으로 스크롤
            if (slider) {
                const top = slider.getBoundingClientRect().top + window.pageYOffset - 70;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        }
    };

    renderDynamicFooter();
});


