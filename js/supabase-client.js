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

// Global export
window.PangData = PangData;
window.PangAuth = PangAuth;
window._supabaseClient = _supabaseClient;
