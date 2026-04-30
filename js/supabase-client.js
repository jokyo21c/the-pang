/* ══════════════════════════════════════════════════════════
   THE PANG — Supabase Client (메인 사이트용)
   ══════════════════════════════════════════════════════════
   config.js 가 먼저 로드되어야 합니다.
   ══════════════════════════════════════════════════════════ */

// Supabase JS SDK는 CDN으로 로드 (index.html에서)
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>

const { createClient } = supabase;

const _supabaseClient = createClient(
    PANG_CONFIG.SUPABASE_URL,
    PANG_CONFIG.SUPABASE_ANON_KEY
);

/* ── 콘텐츠 읽기 (메인사이트 공용) ────────────────────── */
const PangData = {

    /** 섹션 콘텐츠 가져오기 (hero, footer 등) */
    async getSection(sectionKey) {
        const { data, error } = await _supabaseClient
            .from('site_content')
            .select('content_json')
            .eq('section_key', sectionKey)
            .single();

        if (error) {
            console.warn(`[PangData] getSection('${sectionKey}') failed:`, error.message);
            return null;
        }
        return data?.content_json || null;
    },

    /** 포트폴리오 항목 가져오기 */
    async getPortfolio(category = null) {
        let query = _supabaseClient
            .from('portfolio_items')
            .select('*')
            .order('order_index', { ascending: true });

        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) {
            console.warn('[PangData] getPortfolio() failed:', error.message);
            return [];
        }
        return data || [];
    },

    /** 후기 가져오기 */
    async getTestimonials() {
        const { data, error } = await _supabaseClient
            .from('testimonials')
            .select('*')
            .order('order_index', { ascending: true });

        if (error) {
            console.warn('[PangData] getTestimonials() failed:', error.message);
            return [];
        }
        return data || [];
    },

    /** 가격표 가져오기 */
    async getPricing() {
        const { data, error } = await _supabaseClient
            .from('pricing_plans')
            .select('*')
            .order('order_index', { ascending: true });

        if (error) {
            console.warn('[PangData] getPricing() failed:', error.message);
            return [];
        }
        return data || [];
    },

    /** 미디어 공개 URL 가져오기 (Bunny CDN 경유) */
    getMediaUrl(path) {
        if (!path) return '';
        // 이미 절대 URL이면 그대로 반환 (기존 데이터 호환)
        if (path.startsWith('http')) return path;
        return `${PANG_CONFIG.BUNNY_PULL_ZONE_URL}/${path}`;
    }
};

/* ── 회원 인증 ──────────────────────────────────────────── */
const PangAuth = {

    /** 현재 세션 */
    async getSession() {
        const { data: { session } } = await _supabaseClient.auth.getSession();
        return session;
    },

    /** 현재 유저 */
    async getUser() {
        const { data: { user } } = await _supabaseClient.auth.getUser();
        return user;
    },

    /** 이메일/비밀번호 회원가입 */
    async signUp(email, password, name) {
        const { data, error } = await _supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });

        if (error) throw error;

        // members 테이블에도 삽입 (실패해도 회원가입 자체는 성공 처리)
        if (data.user) {
            const { error: insertErr } = await _supabaseClient.from('members').insert({
                user_id: data.user.id,
                name: name,
                email: email
            });
            if (insertErr) {
                console.warn('[PangAuth] members 테이블 삽입 실패 (auth는 성공):', insertErr.message);
            }
        }
        return data;
    },

    /** 이메일/비밀번호 로그인 */
    async signIn(email, password) {
        const { data, error } = await _supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    /** 비밀번호 재설정 이메일 발송 */
    async resetPasswordForEmail(email) {
        const { data, error } = await _supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: PANG_CONFIG.SITE_URL + '/#reset-password'
        });
        if (error) throw error;
        return data;
    },

    /** 로그아웃 */
    async signOut() {
        const { error } = await _supabaseClient.auth.signOut();
        if (error) throw error;
    },

    /** 인증 상태 변화 리스너 */
    onAuthStateChange(callback) {
        return _supabaseClient.auth.onAuthStateChange(callback);
    }
};

/* ── 주문/견적 (고객용) ─────────────────────────────────── */
const PangOrders = {

    /** 견적 담기 (새 주문 생성) */
    async createOrder({ planId, planName, planTier, planPrice, addons, memo }) {
        const user = await PangAuth.getUser();
        if (!user) throw new Error('로그인이 필요합니다.');

        const { data, error } = await _supabaseClient
            .from('orders')
            .insert({
                user_id: user.id,
                plan_name: planName,
                plan_tier: planTier || '',
                plan_price: planPrice || '',
                addons: addons || [],
                memo: memo || '',
                status: 'quote_pending'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /** 내 주문 목록 조회 */
    async getMyOrders() {
        const { data, error } = await _supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('[PangOrders] getMyOrders() failed:', error.message);
            return [];
        }
        return data || [];
    },

    /** 단일 주문 조회 */
    async getOrder(orderId) {
        const { data, error } = await _supabaseClient
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (error) throw error;
        return data;
    }
};

// Global export
window.PangData = PangData;
window.PangAuth = PangAuth;
window.PangOrders = PangOrders;
window._supabaseClient = _supabaseClient;

/* ── 조기 PASSWORD_RECOVERY 감지 (DOMContentLoaded 전) ──── */
window._pangRecoveryDetected = false;
_supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
        window._pangRecoveryDetected = true;
    }
});
