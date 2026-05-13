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
    PANG_CONFIG.SUPABASE_ANON_KEY,
    {
        auth: {
            storageKey: 'pang-user-auth-token'
        }
    }
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
    async signUp(email, password, name, phone, birthday, gender, address, addressDetail) {
        const { data, error } = await _supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { name, phone, birthday, gender, address, addressDetail }
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
            const memberInsertObj = {
                user_id: data.user.id,
                name: name,
                email: email
            };
            // phone 값이 있으면 포함 (컬럼 미존재 시 재시도 대비)
            if (phone) {
                memberInsertObj.phone = phone;
            }

            const { error: insertErr } = await _supabaseClient.from('members').insert(memberInsertObj);
            if (insertErr && !insertErr.message.includes('duplicate')) {
                console.warn('[PangAuth] members 테이블 삽입 실패:', insertErr.message);
                // phone 컬럼 관련 에러면 phone 제외하고 재시도
                if (insertErr.message.includes('phone')) {
                    delete memberInsertObj.phone;
                    const { error: retryErr } = await _supabaseClient.from('members').insert(memberInsertObj);
                    if (retryErr && !retryErr.message.includes('duplicate')) {
                        console.warn('[PangAuth] members 재시도 삽입 실패:', retryErr.message);
                    }
                }
            }
        } else if (data.user && !data.session) {
            // 이메일 확인 대기 중: SIGNED_IN 이벤트 시 user_metadata를 이용해 자동 삽입됩니다.
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
        
        // 로그인 성공 후, members 테이블에서 탈퇴 여부 확인
        if (data && data.user) {
            const { data: memberData } = await _supabaseClient
                .from('members')
                .select('status')
                .eq('user_id', data.user.id)
                .single();
            
            if (memberData && memberData.status === 'withdrawn') {
                // 탈퇴한 회원이면 로그아웃 시키고 에러 반환
                await this.signOut();
                throw new Error('탈퇴한 계정입니다.');
            }

            // members에 레코드가 없으면 자동 삽입 (회원가입 시 누락 보완)
            if (!memberData) {
                const meta = data.user.user_metadata || {};
                const fallbackObj = {
                    user_id: data.user.id,
                    name: meta.name || data.user.email?.split('@')[0] || '알 수 없음',
                    email: data.user.email
                };
                if (meta.phone) fallbackObj.phone = meta.phone;

                const { error: fbErr } = await _supabaseClient.from('members').insert(fallbackObj);
                if (fbErr && fbErr.message && fbErr.message.includes('phone')) {
                    delete fallbackObj.phone;
                    await _supabaseClient.from('members').insert(fallbackObj);
                }
            }
        }
        
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
    },

    /** 사업자등록증 파일 → data URL 반환 (Storage 미사용, 직접 DB 저장) */
    async uploadBusinessLicense(file) {
        const user = await PangAuth.getUser();
        if (!user) throw new Error('로그인이 필요합니다.');

        if (file.size > 5 * 1024 * 1024) {
            throw new Error('파일 크기는 5MB 이하여야 합니다.');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                let dataUrl = reader.result;
                // 파일 확장자가 이미지(.png/.jpg)여도 실제 내용이 PDF인 경우 MIME 타입 교정
                const base64Part = dataUrl.split(';base64,')[1] || '';
                if (base64Part.startsWith('JVBER')) {
                    // %PDF 시그니처 감지 → application/pdf로 교정
                    dataUrl = 'data:application/pdf;base64,' + base64Part;
                }
                resolve(dataUrl);
            };
            reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
            reader.readAsDataURL(file);
        });
    },

    /** 계약 사업자 정보 제출 (contract_data에 병합) */
    async submitContractInfo(orderId, infoData) {
        const { data: current } = await _supabaseClient
            .from('orders').select('contract_data').eq('id', orderId).single();
        const merged = { ...(current?.contract_data || {}), ...infoData };
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
_supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        window._pangRecoveryDetected = true;
    }

    // ── 로그인 성공 시 members 테이블 삽입 보장 ────────
    // 주의: 이 콜백 안에서 await를 사용하면 SDK 내부 잠금과 데드락이
    // 발생할 수 있으므로, 비동기 작업은 별도 함수로 분리하여 fire-and-forget
    if (event === 'SIGNED_IN' && session?.user) {
        setTimeout(() => {
            const meta = session.user.user_metadata || {};
            const memberObj = {
                user_id: session.user.id,
                name: meta.name || '알 수 없음',
                email: session.user.email
            };
            
            // phone 컬럼이 존재할 경우에만 포함하도록 처리 (스키마 오류 방지)
            if (meta.phone) {
                memberObj.phone = meta.phone;
            }

            _supabaseClient.from('members').insert(memberObj).then(({ error: insertErr }) => {
                // 만약 phone 컬럼 오류로 실패하면 phone 제외하고 재시도
                if (insertErr && insertErr.message.includes('phone')) {
                    delete memberObj.phone;
                    _supabaseClient.from('members').insert(memberObj).then(({ error: retryErr }) => {
                        if (retryErr && !retryErr.message.includes('duplicate')) {
                            console.warn('[PangAuth] SIGNED_IN member 재시도 삽입 실패:', retryErr.message);
                        }
                    });
                } else if (insertErr && !insertErr.message.includes('duplicate')) {
                    console.warn('[PangAuth] SIGNED_IN member 삽입 실패:', insertErr.message);
                }
            });
        }, 0);
    }
});

/* ── 알림 발송 헬퍼 (고객/관리자 양방향) ───────────────────── */
const PangNotify = {

    /** Edge Function send-notify 호출 */
    async send(payload) {
        try {
            const supabaseUrl = PANG_CONFIG.SUPABASE_URL;
            const anonKey = PANG_CONFIG.SUPABASE_ANON_KEY;
            const url = `${supabaseUrl}/functions/v1/send-notify`;

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${anonKey}`
                },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (!json.success && json.reason !== 'already_notified') {
                console.warn('[PangNotify] 알림 발송 실패:', json);
            }
            return json;
        } catch (e) {
            // 알림 실패는 메인 프로세스에 영향 없도록 무시
            console.warn('[PangNotify] 알림 호출 에러:', e);
            return { success: false };
        }
    },

    /** 현재 고객 전화번호 조회 */
    async getMyPhone() {
        try {
            const user = await PangAuth.getUser();
            if (!user) return null;
            const { data } = await _supabaseClient
                .from('members')
                .select('phone')
                .eq('user_id', user.id)
                .single();
            return data?.phone || user.user_metadata?.phone || null;
        } catch (e) {
            return null;
        }
    },

    /** 이벤트 1: 고객 견적 요청 → 관리자에게 텔레그램 */
    async notifyQuoteRequested(order, customerName) {
        return this.send({
            event: 'quote_requested',
            orderId: order.id,
            customerName,
            planName: order.plan_name,
            planTier: order.plan_tier
        });
    },

    /** 이벤트 3: 고객 계약정보 등록 → 관리자에게 텔레그램 */
    async notifyInfoSubmitted(orderId, customerName, planName) {
        return this.send({
            event: 'info_submitted',
            orderId,
            customerName,
            planName
        });
    },

    /** 이벤트 5: 고객 서명 완료 → 관리자에게 텔레그램 */
    async notifyContractSigned(orderId, customerName, planName) {
        return this.send({
            event: 'contract_signed',
            orderId,
            customerName,
            planName
        });
    }
};

window.PangNotify = PangNotify;
