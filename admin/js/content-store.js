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
    testimonials: [
        {
            stars: 5,
            text: "먹팡 촬영 후 매출이 30% 올랐어요. 영상 퀄리티가 정말 미쳤습니다. 강력 추천합니다!",
            author: "강남 OO 레스토랑 사장님",
            badge: "먹팡",
            badgeColor: "rgba(230,57,70,0.15)",
            photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop"
        },
        {
            stars: 5,
            text: "이렇게 결과물이 좋을 줄 몰랐어요. 틱톡에서 조회수 50만 찍었습니다. 가성비 최고!",
            author: "홍대 OO 카페 대표님",
            badge: "먹팡",
            badgeColor: "rgba(230,57,70,0.15)",
            photo: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop"
        },
        {
            stars: 5,
            text: "전담 PD가 친절하고 빠르게 납품해줘서 대만족입니다. 다음 달도 또 맡기려고요!",
            author: "판교 OO 네일샵 원장님",
            badge: "멋팡",
            badgeColor: "rgba(123,47,255,0.12)",
            photo: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop"
        },
        {
            stars: 5,
            text: "VR체험 영상이 숏츠에서 터지면서 주말 예약이 3배나 늘었어요. THE PANG 없이는 못합니다!",
            author: "잠실 OO 체험관 대표님",
            badge: "놀팡",
            badgeColor: "rgba(123,47,255,0.15)",
            photo: "https://images.unsplash.com/photo-1592478411210-911b3bc2b9c7?q=80&w=600&auto=format&fit=crop"
        }
    ],
    pricing: [],
    portfolio: {
        meokpang: [],
        nolpang: [],
        swimpang: [],
        salpang: [],
        meotpang: [],
    },
    addons: [
        { name: '드론 촬영 추가', price: '+150,000원/회' },
        { name: '다국어 자막 (영어)', price: '+50,000원/편' },
        { name: 'AI 가상 모델 생성', price: '+80,000원/편' },
        { name: 'SNS 직접 업로드 대행', price: '+100,000원/월' },
        { name: '광고 집행 세팅 대행', price: '+200,000원/회' },
        { name: '모델 섭외 (일반)', price: '+300,000원~' },
        { name: '모델 섭외 (인플루언서)', price: '별도 견적' }
    ],
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
            const [hero, footer, testimonials, pricing, portfolioItems, addons] = await Promise.all([
                AdminContent.getSection('hero'),
                AdminContent.getSection('footer'),
                AdminContent.getTestimonials(),
                AdminContent.getPricing(),
                AdminContent.getPortfolio(),
                AdminContent.getSection('addons')
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
                addons: addons || DEFAULT_CONTENT.addons,
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
                AdminContent.savePricing(data.pricing),
                AdminContent.saveSection('addons', data.addons)
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
