/* ══════════════════════════════════════════════════════════
   THE PANG Admin — Content Store (Supabase 연동)
   ══════════════════════════════════════════════════════════
   기존 localStorage 기반에서 Supabase DB 기반으로 마이그레이션.
   AdminContent / AdminStorage API를 활용합니다.
   ══════════════════════════════════════════════════════════ */

const STORE_KEY = 'pang_cms_content'; // localStorage fallback 용

const DEFAULT_CONTENT = {
    hero: {
        title: '숏폼 하나로\n매출이 달라집니다',
        subtitle: '먹팡·놀팡·쉼팡·살팡·멋팡 — 업종별 맞춤 숏츠로 SNS를 장악하세요',
        ctaText: '무료 상담 신청',
        ctaSubText: '지금 시작하기',
    },
    testimonials: [],
    pricing: [],
    portfolio: {
        meokpang: [],
        nolpang: [],
        swimpang: [],
        salpang: [],
        meotpang: [],
    },
    footer: {
        brandName: 'THE PANG',
        slogan: '숏츠 광고, \n한방으로 바이럴',
        sns: { instagram: '#', youtube: '#', tiktok: '#' },
        companyLinks: [
            { label: '회사소개', url: '#' },
            { label: '이용약관', url: '#' },
            { label: '개인정보처리방침', url: '#' },
            { label: '공지사항', url: '#' }
        ],
        contact: {
            kakao: 'https://pf.kakao.com/_CCxcCX',
            email: 'hello@thepang.kr',
            time: '평일 09:00-18:00'
        }
    }
};

const ContentStore = {

    /**
     * Supabase에서 모든 콘텐츠를 로드하여 통합 객체로 반환
     * 실패 시 localStorage fallback → 기본값
     */
    async get() {
        try {
            // 병렬로 모든 데이터 로드
            const [hero, footer, testimonials, pricing, portfolioItems] = await Promise.all([
                AdminContent.getSection('hero'),
                AdminContent.getSection('footer'),
                AdminContent.getTestimonials(),
                AdminContent.getPricing(),
                AdminContent.getPortfolio()
            ]);

            // 포트폴리오를 카테고리별로 그룹화
            const portfolio = {
                meokpang: [], nolpang: [], swimpang: [],
                salpang: [], meotpang: []
            };
            (portfolioItems || []).forEach(item => {
                if (portfolio[item.category]) {
                    portfolio[item.category].push({
                        id: item.id,
                        url: item.media_url,
                        type: item.media_type,
                        order_index: item.order_index
                    });
                }
            });

            // 후기 포맷 통일
            const formattedTestimonials = (testimonials || []).map(t => ({
                id: t.id,
                stars: t.stars,
                text: t.text,
                author: t.author,
                badge: t.badge,
                badgeColor: t.badge_color,
                photo: t.photo_url,
                order_index: t.order_index
            }));

            // 가격표 포맷 통일
            const formattedPricing = (pricing || []).map(p => ({
                id: p.id,
                name: p.name,
                tier: p.tier,
                price: p.price,
                period: p.period,
                features: Array.isArray(p.features) ? p.features : [],
                btnText: p.btn_text,
                order_index: p.order_index
            }));

            const content = {
                hero: hero || DEFAULT_CONTENT.hero,
                footer: footer || DEFAULT_CONTENT.footer,
                testimonials: formattedTestimonials.length ? formattedTestimonials : DEFAULT_CONTENT.testimonials,
                pricing: formattedPricing.length ? formattedPricing : DEFAULT_CONTENT.pricing,
                portfolio
            };

            // localStorage에도 캐시 (오프라인 fallback)
            try { localStorage.setItem(STORE_KEY, JSON.stringify(content)); } catch(e) {}

            return content;

        } catch (err) {
            console.warn('[ContentStore] Supabase 로드 실패, localStorage fallback:', err.message);
            return this._getFromLocalStorage();
        }
    },

    /**
     * Supabase에 모든 콘텐츠 저장
     */
    async save(data) {
        try {
            await Promise.all([
                AdminContent.saveSection('hero', data.hero),
                AdminContent.saveSection('footer', data.footer),
                AdminContent.saveTestimonials(data.testimonials),
                AdminContent.savePricing(data.pricing)
            ]);
            // 포트폴리오는 개별 CRUD로 처리되므로 여기서는 저장하지 않음

            // localStorage 캐시 갱신
            try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch(e) {}

        } catch (err) {
            console.error('[ContentStore] Supabase 저장 실패:', err.message);
            // fallback: localStorage에라도 저장
            try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch(e) {}
            throw err; // 상위에서 에러 UI 처리
        }
    },

    /**
     * 기본값으로 리셋
     */
    reset() {
        localStorage.removeItem(STORE_KEY);
        return JSON.parse(JSON.stringify(DEFAULT_CONTENT));
    },

    /**
     * localStorage에서 읽기 (오프라인 fallback)
     */
    _getFromLocalStorage() {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return JSON.parse(JSON.stringify(DEFAULT_CONTENT));
        try {
            const stored = JSON.parse(raw);
            return this._merge(JSON.parse(JSON.stringify(DEFAULT_CONTENT)), stored);
        } catch {
            return JSON.parse(JSON.stringify(DEFAULT_CONTENT));
        }
    },

    _merge(base, override) {
        for (const key in override) {
            if (override[key] !== null && typeof override[key] === 'object' && !Array.isArray(override[key])) {
                if (!base[key]) base[key] = {};
                this._merge(base[key], override[key]);
            } else {
                base[key] = override[key];
            }
        }
        return base;
    }
};

// Export for use in other scripts
window.ContentStore = ContentStore;
