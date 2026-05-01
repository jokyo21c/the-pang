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

        // ── 중복 이메일 감지 ──────────────────────────────────
        // Supabase는 이미 가입된 이메일로 signUp 시 에러 대신
        // identities 배열이 비어있는 user를 반환합니다.
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
            throw new Error('User already registered');
        }

        // ── members 테이블 삽입 ───────────────────────────────
        // 이메일 확인이 필요한 경우: session이 null이어서 RLS(auth.uid())가 통과 안 됨.
        // 따라서 세션이 있을 때만 insert 시도하고, 없으면 onAuthStateChange에서 처리.
        if (data.user && data.session) {
            // 이메일 확인 불필요 설정 or 즉시 세션 발급된 경우
            const { error: insertErr } = await _supabaseClient.from('members').insert({
                user_id: data.user.id,
                name: name,
                email: email
            });
            if (insertErr && !insertErr.message.includes('duplicate')) {
                console.warn('[PangAuth] members 테이블 삽입 실패:', insertErr.message);
            }
        } else if (data.user && !data.session) {
            // 이메일 확인 대기 중 → pending 정보를 localStorage에 저장
            // SIGNED_IN 이벤트 시 insert 처리
            try {
                localStorage.setItem('_pangPendingMember', JSON.stringify({
                    user_id: data.user.id,
                    name: name,
                    email: email
                }));
            } catch(e) {}
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
        const user = await PangAuth.getUser();
        if (!user) return [];

        const { data, error } = await _supabaseClient
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
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
    },

    /** 견적 요청 취소 (quote_pending 상태만 삭제 가능) */
    async cancelOrder(orderId) {
        const { error } = await _supabaseClient
            .from('orders')
            .delete()
            .eq('id', orderId)
            .eq('status', 'quote_pending');

        if (error) throw error;
    },

    /** 전자서명 저장 (contract_data에 병합) */
    async saveSignature(orderId, signatureDataUrl) {
        const { data: current } = await _supabaseClient
            .from('orders').select('contract_data').eq('id', orderId).single();
        const merged = { ...(current?.contract_data || {}), customer_signature: signatureDataUrl };
        const { error } = await _supabaseClient
            .from('orders')
            .update({ contract_data: merged })
            .eq('id', orderId);
        if (error) throw error;
    }
};

// Global export
window.PangData = PangData;
window.PangAuth = PangAuth;
window.PangOrders = PangOrders;
window._supabaseClient = _supabaseClient;

/* ── 조기 PASSWORD_RECOVERY 감지 (DOMContentLoaded 전) ──── */
window._pangRecoveryDetected = false;
_supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        window._pangRecoveryDetected = true;
    }

    // ── 이메일 확인 후 첫 로그인 시 members 테이블 삽입 ────────
    if (event === 'SIGNED_IN' && session?.user) {
        try {
            const pending = localStorage.getItem('_pangPendingMember');
            if (pending) {
                const m = JSON.parse(pending);
                // user_id가 일치하는지 확인
                if (m.user_id === session.user.id) {
                    const { error: insertErr } = await _supabaseClient.from('members').insert({
                        user_id: m.user_id,
                        name: m.name,
                        email: m.email
                    });
                    if (!insertErr || insertErr.message.includes('duplicate')) {
                        localStorage.removeItem('_pangPendingMember');
                    } else {
                        console.warn('[PangAuth] pending member insert 실패:', insertErr.message);
                    }
                }
            }
        } catch(e) {
            console.warn('[PangAuth] pending member 처리 실패:', e);
        }
    }
});
