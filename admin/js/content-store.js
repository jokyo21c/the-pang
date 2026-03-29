/* ══════════════════════════════════════════════════════════
   THE PANG Admin — Content Store (localStorage)
   ══════════════════════════════════════════════════════════ */

const STORE_KEY = 'pang_cms_content';

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
            text: '먹팡 촬영 후 매출이 30% 올랐어요. 영상 퀄리티가 정말 미쳤습니다. 강력 추천합니다!',
            author: '강남 OO 레스토랑 사장님',
            badge: '먹팡',
            badgeColor: '#7b2fff',
            photo: 'https://picsum.photos/seed/pang1/200/200',
        },
        {
            stars: 5,
            text: '이렇게 결과물이 좋을 줄 몰랐어요. 틱톡에서 조회수 50만 찍었습니다. 가성비 최고!',
            author: '홍대 OO 카페 대표님',
            badge: '먹팡',
            badgeColor: '#7b2fff',
            photo: 'https://picsum.photos/seed/pang2/200/200',
        },
        {
            stars: 5,
            text: '전담 PD가 친절하고 빠르게 납품해줘서 대만족입니다. 다음 달도 또 맡기려고요!',
            author: '판교 OO 네일샵 원장님',
            badge: '멋팡',
            badgeColor: '#7b2fff',
            photo: 'https://picsum.photos/seed/pang3/200/200',
        },
        {
            stars: 5,
            text: 'VR체험 영상이 숏츠에서 터지면서 주말 예약이 3배나 늘었어요. THE PANG 없이는 못합니다!',
            author: '잠실 OO 체험관 대표님',
            badge: '놀팡',
            badgeColor: '#e63946',
            photo: 'https://picsum.photos/seed/pang4/200/200',
        },
    ],
    pricing: [
        {
            name: 'PANG-S',
            tier: 'STARTER',
            price: '190,000',
            period: '1회 기준',
            features: ['현장 1회 2시간 촬영', '30초 숏츠 1편', 'AI 자막 + 색보정', '수정 1회', '납기 5영업일', '3플랫폼 공통 1포맷'],
            btnText: '시작하기',
        },
        {
            name: 'PANG-M',
            tier: 'STANDARD',
            price: '490,000',
            period: '1회 기준',
            features: ['현장 1회 3시간 촬영', '30초 숏츠 3편', 'AI 자막 + 색보정 + BGM', '수정 편당 2회', '납기 4영업일', '플랫폼별 최적화 3포맷', '전담 PD 1인', 'SNS 썸네일 3장'],
            btnText: '지금 시작',
        },
        {
            name: 'PANG-L',
            tier: 'PREMIUM',
            price: '890,000',
            period: '1회 기준',
            features: ['현장 2회 (회당 4시간) 촬영', '30초 숏츠 5편 (A/B테스트)', 'AI 자막 + 색보정 + CG + 썸네일', '수정 편당 3회 + 최종확인', '납기 3영업일', '전플랫폼 + 가로형(16:9)', '전담 PD + 마케터 2인', '해시태그/캡션 + 성과 리포트'],
            btnText: '프리미엄 시작',
        },
        {
            name: 'PANG-X',
            tier: 'BRAND SUBSCRIPTION',
            price: '1,490,000',
            period: '월 정기 구독',
            features: ['월 2회 정기 현장촬영', '월 8편 숏츠 제작', '풀 AI 후보정 + 브랜드 AI모델', '수정 무제한', '편당 2영업일 납기', 'PD + 마케터 + 기획자 3인', '월간 콘텐츠 전략 리포트', 'SNS 채널 운영 컨설팅'],
            btnText: '구독 시작하기',
        },
    ],
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
        sns: {
            instagram: '#',
            youtube: '#',
            tiktok: '#'
        },
        companyLinks: [
            { label: '회사소개', url: '#' },
            { label: '이용약관', url: '#' },
            { label: '개인정보처리방침', url: '#' },
            { label: '공지사항', url: '#' }
        ],
        contact: {
            kakao: '카카오톡 채널',
            email: 'hello@thepang.kr',
            time: '평일 09:00-18:00'
        }
    }
};

const ContentStore = {
    get() {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return JSON.parse(JSON.stringify(DEFAULT_CONTENT));
        try {
            const stored = JSON.parse(raw);
            // Deep merge with defaults to handle new fields
            return this._merge(JSON.parse(JSON.stringify(DEFAULT_CONTENT)), stored);
        } catch {
            return JSON.parse(JSON.stringify(DEFAULT_CONTENT));
        }
    },

    save(data) {
        localStorage.setItem(STORE_KEY, JSON.stringify(data));
    },

    reset() {
        localStorage.removeItem(STORE_KEY);
        return JSON.parse(JSON.stringify(DEFAULT_CONTENT));
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
