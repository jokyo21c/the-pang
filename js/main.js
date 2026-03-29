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
    const track = document.getElementById('testimonialTrack');
    const dotsContainer = document.getElementById('sliderDots');
    
    try {
        const raw = localStorage.getItem('pang_cms_content');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.testimonials && parsed.testimonials.length > 0) {
                // Update Track
                track.innerHTML = parsed.testimonials.map(t => `
                    <div class="testimonial-card">
                        <div class="testimonial-card__inner">
                            <div class="testimonial-card__photo">
                                <img src="${t.photo}" alt="${t.author}">
                            </div>
                            <div class="testimonial-card__stars" style="letter-spacing:4px;color:var(--color-brand-orange);margin-bottom:20px;">${'★'.repeat(t.stars || 5)}</div>
                            <p class="testimonial-card__text">"${t.text}"</p>
                            <div class="testimonial-card__footer">
                                <div class="testimonial-card__info">
                                    <p class="testimonial-card__author">${t.author}</p>
                                    <span class="testimonial-card__badge" style="background:${t.badgeColor || 'var(--color-brand-purple)'}">${t.badge}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                // Update Dots
                if (dotsContainer) {
                    dotsContainer.innerHTML = parsed.testimonials.map((_, i) => `
                        <span class="slider-dot ${i===0 ? 'active' : ''}" data-index="${i}"></span>
                    `).join('');
                }
            }
        }
    } catch (err) {
        console.error('후기 데이터 로드 실패:', err);
    }

    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    let dots = document.querySelectorAll('.slider-dot');
    let currentSlide = 0;
    let totalSlides = document.querySelectorAll('.testimonial-card').length;
    let autoSlideInterval;

    const goToSlide = (index) => {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        currentSlide = index;
        track.style.transform = `translateX(-${currentSlide * 100}%)`;

        dots.forEach(dot => dot.classList.remove('active'));
        dots[currentSlide].classList.add('active');
    };

    const startAutoSlide = () => {
        autoSlideInterval = setInterval(() => {
            goToSlide(currentSlide + 1);
        }, 3000);
    };

    const stopAutoSlide = () => {
        clearInterval(autoSlideInterval);
    };

    prevBtn.addEventListener('click', () => {
        stopAutoSlide();
        goToSlide(currentSlide - 1);
        startAutoSlide();
    });

    nextBtn.addEventListener('click', () => {
        stopAutoSlide();
        goToSlide(currentSlide + 1);
        startAutoSlide();
    });

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            stopAutoSlide();
            goToSlide(parseInt(dot.dataset.index));
            startAutoSlide();
        });
    });

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

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            if (scrollTopParent) scrollTopParent.classList.add('visible');
            else if (scrollTopBtn) scrollTopBtn.classList.add('visible');
        } else {
            if (scrollTopParent) scrollTopParent.classList.remove('visible');
            else if (scrollTopBtn) scrollTopBtn.classList.remove('visible');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });


    // ── Smooth Scroll for Anchor Links ──────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                const offset = 80;
                const top = target.offsetTop - offset;
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

            // 첫 번째 도장 효과 제거하고 일반 롤링 상태로 전환 (스무스한 퇴장 준비)
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

        // Optional: Dynamic speed adjustment based on number of items
        const itemCount = platformTrack.children.length; // Now it's original * 2
        const baseDuration = itemCount * 2; // 2 seconds per item
        platformTrack.style.setProperty('animation-duration', `${baseDuration}s`);
    }

    // ── Thumb All Slider (Infinite Loop) ─────────────────────
    window.initThumbAllSlide = function(wrap) {
        const track = wrap.querySelector('.thumb-all-track');
        let pages = Array.from(wrap.querySelectorAll('.thumb-all-page'));
        const dots = wrap.querySelectorAll('.thumb-all-dot');
        const prevBtn = wrap.querySelector('.thumb-all-nav--prev');
        const nextBtn = wrap.querySelector('.thumb-all-nav--next');
        
        if (!track || pages.length <= 1) return; // No need to slide if 1 or 0 pages

        // To prevent multiple initializations
        if (wrap.dataset.initialized === 'true') {
            // Remove cloned nodes to reset before re-initializing (e.g., from portfolio-filter)
            const clones = track.querySelectorAll('.clone');
            clones.forEach(c => c.remove());
            pages = Array.from(wrap.querySelectorAll('.thumb-all-page:not(.clone)'));
        }
        wrap.dataset.initialized = 'true';

        let currentIndex = 1; // 1-based because of the front clone
        const totalPages = pages.length;

        // Clone first and last pages
        const firstClone = pages[0].cloneNode(true);
        const lastClone = pages[totalPages - 1].cloneNode(true);
        
        firstClone.classList.add('clone');
        lastClone.classList.add('clone');

        track.appendChild(firstClone);
        track.insertBefore(lastClone, pages[0]);

        // Updated elements
        const allPages = Array.from(wrap.querySelectorAll('.thumb-all-page'));
        
        let isTransitioning = false;
        let slideInterval;

        const setTransform = (index, transition = true) => {
            track.style.transition = transition ? 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
            track.style.transform = `translateX(-${index * 100}%)`;
        };

        const updateDots = (index) => {
            if (!dots.length) return;
            dots.forEach(dot => dot.classList.remove('active'));
            // Map currentIndex back to dot index
            let dotIndex = index - 1;
            if (dotIndex < 0) dotIndex = totalPages - 1;
            if (dotIndex >= totalPages) dotIndex = 0;
            if (dots[dotIndex]) dots[dotIndex].classList.add('active');
        };

        const goToSlide = (index) => {
            if (isTransitioning) return;
            isTransitioning = true;
            currentIndex = index;

            // 클릭/방향키 연타 시 범위를 벗어나 빈 공간으로 발산하지 않게 제한
            if (currentIndex > totalPages + 1) currentIndex = totalPages + 1;
            if (currentIndex < 0) currentIndex = 0;

            setTransform(currentIndex);
            updateDots(currentIndex);
            wrap.dataset.slideIndex = currentIndex - 1;

            // 모바일 환경 등에서 transitionend 이벤트 유실로 무한루프 및 스와이프가 영구 정지되는 현상 방지용 Fallback
            // (CSS transition 0.4s 이므로, 0.45s 즈음에 확실하게 Seamless jump 실행)
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


        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                goToSlide(currentIndex - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                goToSlide(currentIndex + 1);
            });
        }

        dots.forEach((dot, idx) => {
            dot.addEventListener('click', () => {
                goToSlide(idx + 1);
            });
        });

        // Touch/Swipe functionality
        let startX = 0;
        let startY = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;
        let isDragging = false;
        let animationID;

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
            // Convert diff to percentage
            const trackWidth = track.clientWidth || wrap.clientWidth;
            const percentageDiff = (diff / trackWidth) * 100;
            currentTranslate = prevTranslate + percentageDiff;
            track.style.transform = `translateX(${currentTranslate}%)`;
        };

        const touchEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            
            // X, Y 이동량 비교 (수직 스크롤 방어)
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
        touchTarget.addEventListener('mouseleave', () => { if(isDragging) touchEnd(); });
        touchTarget.addEventListener('mousedown', touchStart);
        touchTarget.addEventListener('mousemove', touchMove);
        touchTarget.addEventListener('mouseup', touchEnd);
    };

    // Initialize all existing sliders
    document.querySelectorAll('.thumb-all-wrap').forEach(wrap => {
        window.initThumbAllSlide(wrap);
    });


    // ── Pang Section Slider (Mobile: 먹팡~멋팡 수평 슬라이더) ──
    (function initPangSectionSlider() {
        const slider = document.getElementById('pangSectionSlider');
        const track = document.getElementById('pangSliderTrack');
        const slides = slider ? Array.from(slider.querySelectorAll('.pang-slide')) : [];
        const nextPreviewCards = document.querySelectorAll('.pang-next-preview');

        if (!slider || !track || slides.length === 0) return;

        let currentPang = 0;
        let autoTimer = null;
        let manualStop = false; // ★ 터치로 인한 수동 중지 플래그
        const TOTAL = slides.length;
        const AUTO_INTERVAL = 4000; // 4초간 대기 (사용자 수정 요청)

        // 슬라이더 이동
        const goToPang = (index, smooth = true) => {
            // 무한 루프 처리
            if (index < 0) index = TOTAL - 1;
            if (index >= TOTAL) index = 0;

            currentPang = index;

            // CSS transform으로 500% 너비의 트랙 이동 (한 슬라이드당 20%)
            track.style.transition = smooth ? 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
            track.style.transform = `translateX(-${currentPang * 20}%)`;
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

        // 다음 팡 미리보기 카드 클릭 및 호버
        nextPreviewCards.forEach(card => {
            card.addEventListener('click', () => {
                const nextIdx = parseInt(card.dataset.next, 10);
                manualStop = true; // 유저 조작 발생
                stopAuto();
                goToPang(nextIdx);
            });
            // 데스크탑/모바일 호버/조작 시 자동 롤링 정지
            card.addEventListener('mouseenter', () => { manualStop = true; stopAuto(); });
            card.addEventListener('mouseleave', startAuto);
        });

        // 영상 썸네일 영역 호버/조작 시 자동 롤링 정지 (사용자 스크린샷 요구사항)
        const thumbWraps = slider.querySelectorAll('.thumb-all-wrap');
        thumbWraps.forEach(wrap => {
            wrap.addEventListener('mouseenter', () => { manualStop = true; stopAuto(); });
            wrap.addEventListener('mouseleave', startAuto);
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
                    e.preventDefault(); // 기본 앵커 이동 방지 (가로 컨테이너 스크롤 오작동 방지)
                    
                    // 자동 롤링 정지 후 해당 인덱스로 이동
                    manualStop = true;
                    stopAuto();
                    goToPang(slideIndex);
                    
                    // 화면을 해당 섹터 뷰포트로 부드럽게 스크롤 (헤더 높이 약 60px 보정)
                    const headerOffset = 70;
                    const elementPos = slider.getBoundingClientRect().top;
                    const offsetPos = elementPos + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPos,
                        behavior: 'smooth'
                    });
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
        };

        mediaQuery.addEventListener('change', onMediaChange);
        onMediaChange(mediaQuery); // 초기 실행
    })();

});

/* ══════════════════════════════════════════════════════════
   AUTH MODULE — 로그인 / 회원가입
   ══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function initAuth() {

    const overlay    = document.getElementById('authOverlay');
    const modal      = document.getElementById('authModal');
    const closeBtn   = document.getElementById('authModalClose');
    const tabLogin   = document.getElementById('tabLogin');
    const tabSignup  = document.getElementById('tabSignup');
    const loginForm  = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginError  = document.getElementById('loginError');
    const signupError = document.getElementById('signupError');

    if (!overlay || !modal) return; // 모달 없으면 중단

    /* ── 모달 열기/닫기 ─────────────────────────── */
    function openModal(tab) {
        overlay.classList.add('open');
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        switchTab(tab === 'signup' ? 'signup' : 'login');
    }

    function closeModal() {
        overlay.classList.remove('open');
        modal.classList.remove('open');
        document.body.style.overflow = '';
        if (loginError)  loginError.textContent  = '';
        if (signupError) signupError.textContent = '';
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    /* ── 탭 전환 ─────────────────────────────────── */
    function switchTab(tab) {
        if (tab === 'login') {
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
            loginForm.style.display  = 'flex';
            signupForm.style.display = 'none';
        } else {
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
            signupForm.style.display = 'flex';
            loginForm.style.display  = 'none';
        }
    }

    tabLogin.addEventListener('click',  () => switchTab('login'));
    tabSignup.addEventListener('click', () => switchTab('signup'));
    document.getElementById('goToSignup').addEventListener('click', () => switchTab('signup'));
    document.getElementById('goToLogin').addEventListener('click',  () => switchTab('login'));

    /* ── 버튼으로 모달 열기 ──────────────────────── */
    ['navLoginBtn', 'mobileLoginBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => openModal('login'));
    });
    ['navSignupBtn', 'mobileSignupBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => openModal('signup'));
    });

    /* ── localStorage 유틸 ──────────────────────── */
    const USERS_KEY   = 'pang_users';
    const SESSION_KEY = 'pang_session';
    const getUsers    = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; } };
    const saveUsers   = u => localStorage.setItem(USERS_KEY, JSON.stringify(u));
    const getSession  = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } };
    const saveSession = u => localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    const clearSession = () => localStorage.removeItem(SESSION_KEY);

    /* ── UI 반영 ────────────────────────────────── */
    function applyLoggedInUI(user) {
        document.getElementById('navLoginBtn').style.display  = 'none';
        document.getElementById('navSignupBtn').style.display = 'none';
        document.getElementById('navUser').style.display      = 'flex';
        document.getElementById('navUserName').textContent    = `${user.name}님`;
        document.getElementById('mobileAuth').style.display   = 'none';
        document.getElementById('mobileUser').style.display   = 'flex';
        document.getElementById('mobileUserName').textContent = `👋 ${user.name}님`;
    }

    function applyLoggedOutUI() {
        document.getElementById('navLoginBtn').style.display  = '';
        document.getElementById('navSignupBtn').style.display = '';
        document.getElementById('navUser').style.display      = 'none';
        document.getElementById('mobileAuth').style.display   = '';
        document.getElementById('mobileUser').style.display   = 'none';
    }

    /* ── 회원가입 ───────────────────────────────── */
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        const pw  = document.getElementById('signupPassword').value;
        const pw2 = document.getElementById('signupPasswordConfirm').value;

        if (pw.length < 6) { signupError.textContent = '비밀번호는 6자 이상이어야 합니다.'; return; }
        if (pw !== pw2)    { signupError.textContent = '비밀번호가 일치하지 않습니다.'; return; }

        const users = getUsers();
        if (users.find(u => u.email === email)) { signupError.textContent = '이미 사용 중인 이메일입니다.'; return; }

        users.push({ name, email, pw });
        saveUsers(users);
        saveSession({ name, email });
        applyLoggedInUI({ name, email });
        closeModal();
    });

    /* ── 로그인 ─────────────────────────────────── */
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const pw    = document.getElementById('loginPassword').value;
        const user  = getUsers().find(u => u.email === email && u.pw === pw);

        if (!user) { loginError.textContent = '이메일 또는 비밀번호가 올바르지 않습니다.'; return; }

        saveSession({ name: user.name, email: user.email });
        applyLoggedInUI({ name: user.name, email: user.email });
        closeModal();
    });

    /* ── 로그아웃 ───────────────────────────────── */
    ['navLogoutBtn', 'mobileLogoutBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => { clearSession(); applyLoggedOutUI(); });
    });

    /* ── 세션 복원 ──────────────────────────────── */
    const session = getSession();
    if (session) applyLoggedInUI(session);
    else         applyLoggedOutUI();

    /* ── 동적 푸터 렌더링 ──────────────────────── */
    function renderDynamicFooter() {
        try {
            const raw = localStorage.getItem('pang_cms_content');
            if (!raw) return;
            const content = JSON.parse(raw);
            if (!content.footer) return;

            const f = content.footer;

            // Brand & Slogan
            const logoEl = document.querySelector('.footer__logo');
            if (logoEl && f.brandName) logoEl.textContent = f.brandName;

            const sloganEl = document.querySelector('.footer__slogan');
            if (sloganEl && f.slogan) {
                sloganEl.innerHTML = f.slogan.replace(/\n/g, '<br class="mobile-break">');
            }

            // SNS Links
            const snsLinks = document.querySelectorAll('.footer__social a');
            if (snsLinks.length >= 3) {
                if (f.sns?.instagram) snsLinks[0].href = f.sns.instagram;
                if (f.sns?.youtube)   snsLinks[1].href = f.sns.youtube;
                if (f.sns?.tiktok)    snsLinks[2].href = f.sns.tiktok;
            }

            // Company Links (3번째 컬럼 .footer__links)
            const gridDivs = document.querySelectorAll('.footer__grid > div');
            if (gridDivs.length >= 3 && f.companyLinks && f.companyLinks.length > 0) {
                const companyUl = gridDivs[2].querySelector('.footer__links');
                if (companyUl) {
                    companyUl.innerHTML = f.companyLinks.map(link => 
                        `<li><a href="${link.url}">${link.label}</a></li>`
                    ).join('');
                }
            }

            // Contact Info
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


