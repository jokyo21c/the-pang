/* ══════════════════════════════════════════════════════════
   THE PANG Admin — Supabase Admin Client
   ══════════════════════════════════════════════════════════
   관리자 페이지 전용 Supabase API 래퍼.
   config.js, supabase SDK가 먼저 로드되어야 합니다.
   ══════════════════════════════════════════════════════════ */

const { createClient: _createClient } = supabase;

const _adminSupabase = _createClient(
    PANG_CONFIG.SUPABASE_URL,
    PANG_CONFIG.SUPABASE_ANON_KEY
);

/* ═══════════════════════════════════════════════════════
   관리자 인증
   ═══════════════════════════════════════════════════════ */
const AdminAuth = {

    /** 관리자 로그인 */
    async login(email, password) {
        const { data, error } = await _adminSupabase.auth.signInWithPassword({
            email, password
        });
        if (error) throw error;

        // 관리자 권한 확인
        const { data: profile, error: profileError } = await _adminSupabase
            .from('admin_profiles')
            .select('role')
            .eq('user_id', data.user.id)
            .single();

        if (profileError || !profile) {
            await _adminSupabase.auth.signOut();
            throw new Error('관리자 권한이 없습니다.');
        }

        return { user: data.user, role: profile.role };
    },

    /** 로그아웃 */
    async logout() {
        await _adminSupabase.auth.signOut();
    },

    /** 현재 세션 확인 */
    async getSession() {
        const { data: { session } } = await _adminSupabase.auth.getSession();
        return session;
    },

    /** 관리자 권한 확인 */
    async isAdmin() {
        const { data: { user } } = await _adminSupabase.auth.getUser();
        if (!user) return false;

        const { data: profile } = await _adminSupabase
            .from('admin_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        return !!profile;
    },

    /** 현재 계정 정보 조회 */
    async getCurrentUser() {
        const { data: { user }, error } = await _adminSupabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    /** 이메일 재설정 */
    async updateEmail(newEmail) {
        const { data, error } = await _adminSupabase.auth.updateUser({ email: newEmail });
        if (error) throw error;
        return data; // 이메일 변경 확인 메일이 양쪽(기존/새)으로 발송될 수 있음
    },

    /** 비밀번호 재설정 */
    async updatePassword(newPassword) {
        const { data, error } = await _adminSupabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        return data;
    }
};


/* ═══════════════════════════════════════════════════════
   콘텐츠 관리 (CRUD)
   ═══════════════════════════════════════════════════════ */
const AdminContent = {

    /* ── 섹션 콘텐츠 (hero, footer) ─────────────────────── */

    async getSection(sectionKey) {
        const { data, error } = await _adminSupabase
            .from('site_content')
            .select('content_json')
            .eq('section_key', sectionKey)
            .single();
        if (error) throw error;
        return data?.content_json || {};
    },

    async saveSection(sectionKey, contentJson) {
        const { data: { user } } = await _adminSupabase.auth.getUser();
        const { error } = await _adminSupabase
            .from('site_content')
            .upsert({
                section_key: sectionKey,
                content_json: contentJson,
                updated_at: new Date().toISOString(),
                updated_by: user?.id
            }, { onConflict: 'section_key' });
        if (error) throw error;
    },


    /* ── 포트폴리오 ─────────────────────────────────────── */

    async getPortfolio() {
        const { data, error } = await _adminSupabase
            .from('portfolio_items')
            .select('*')
            .order('category')
            .order('order_index', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async addPortfolioItem(category, mediaUrl, mediaType = 'image') {
        // 다음 order_index 계산
        const { data: existing } = await _adminSupabase
            .from('portfolio_items')
            .select('order_index')
            .eq('category', category)
            .order('order_index', { ascending: false })
            .limit(1);

        const nextIndex = (existing?.[0]?.order_index ?? -1) + 1;

        const { data, error } = await _adminSupabase
            .from('portfolio_items')
            .insert({
                category,
                media_url: mediaUrl,
                media_type: mediaType,
                order_index: nextIndex
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async removePortfolioItem(id) {
        const { error } = await _adminSupabase
            .from('portfolio_items')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },


    /* ── 후기 ───────────────────────────────────────────── */

    async getTestimonials() {
        const { data, error } = await _adminSupabase
            .from('testimonials')
            .select('*')
            .order('order_index', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async saveTestimonials(testimonials) {
        // 전체 교체 전략: 삭제 후 재삽입
        const { error: delError } = await _adminSupabase
            .from('testimonials')
            .delete()
            .gte('id', 0); // 모든 행 삭제

        if (delError) throw delError;

        const rows = testimonials.map((t, i) => ({
            stars: t.stars || 5,
            text: t.text,
            author: t.author,
            badge: t.badge,
            badge_color: t.badge_color || t.badgeColor || '#7b2fff',
            photo_url: t.photo_url || t.photo,
            order_index: i
        }));

        const { error: insError } = await _adminSupabase
            .from('testimonials')
            .insert(rows);

        if (insError) throw insError;
    },


    /* ── 가격표 ─────────────────────────────────────────── */

    async getPricing() {
        const { data, error } = await _adminSupabase
            .from('pricing_plans')
            .select('*')
            .order('order_index', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async savePricing(plans) {
        // 전체 교체 전략
        const { error: delError } = await _adminSupabase
            .from('pricing_plans')
            .delete()
            .gte('id', 0);

        if (delError) throw delError;

        const rows = plans.map((p, i) => ({
            name: p.name,
            tier: p.tier,
            price: p.price,
            period: p.period,
            features: p.features,
            btn_text: p.btn_text || p.btnText,
            order_index: i
        }));

        const { error: insError } = await _adminSupabase
            .from('pricing_plans')
            .insert(rows);

        if (insError) throw insError;
    },


    /* ── 회원 관리 ──────────────────────────────────────── */

    async getMembers() {
        const { data, error } = await _adminSupabase
            .from('members')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async deleteMember(id) {
        const { error } = await _adminSupabase
            .from('members')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};


/* ═══════════════════════════════════════════════════════
   미디어 업로드 (Supabase Storage)
   ═══════════════════════════════════════════════════════ */
const AdminStorage = {

    /** 파일 업로드 → 공개 URL 반환 */
    async uploadFile(file, folder = 'portfolio') {
        const ext = file.name.split('.').pop();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const filePath = `${folder}/${timestamp}_${random}.${ext}`;

        const { data, error } = await _adminSupabase.storage
            .from(PANG_CONFIG.STORAGE_BUCKET)
            .upload(filePath, file, {
                cacheControl: '31536000',   // 1년 캐시
                upsert: false
            });

        if (error) throw error;

        // 공개 URL 반환
        const { data: urlData } = _adminSupabase.storage
            .from(PANG_CONFIG.STORAGE_BUCKET)
            .getPublicUrl(data.path);

        return {
            path: data.path,
            url: urlData.publicUrl,
            type: file.type.startsWith('video/') ? 'video' : 'image'
        };
    },

    /** 파일 삭제 */
    async deleteFile(path) {
        const { error } = await _adminSupabase.storage
            .from(PANG_CONFIG.STORAGE_BUCKET)
            .remove([path]);
        if (error) throw error;
    },

    /** Data URL → File 객체 변환 후 업로드 */
    async uploadDataUrl(dataUrl, filename, folder = 'portfolio') {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: blob.type });
        return this.uploadFile(file, folder);
    }
};

// Global export
window.AdminAuth = AdminAuth;
window.AdminContent = AdminContent;
window.AdminStorage = AdminStorage;
window._adminSupabase = _adminSupabase;
