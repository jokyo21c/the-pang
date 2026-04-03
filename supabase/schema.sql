-- ══════════════════════════════════════════════════════════
--  THE PANG — Supabase Database Schema
--  더팡.store 호스팅 연동용
-- ══════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────
--  1. site_content — 히어로, 푸터 등 단일 섹션 콘텐츠
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_content (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    section_key   TEXT UNIQUE NOT NULL,          -- 'hero', 'footer' 등
    content_json  JSONB NOT NULL DEFAULT '{}',
    updated_at    TIMESTAMPTZ DEFAULT now(),
    updated_by    UUID REFERENCES auth.users(id)
);

-- 기본 데이터 삽입
INSERT INTO site_content (section_key, content_json) VALUES
('hero', '{
    "title": "숏폼 하나로\n매출이 달라집니다",
    "subtitle": "먹팡·놀팡·쉼팡·살팡·멋팡 — 업종별 맞춤 숏츠로 SNS를 장악하세요",
    "ctaText": "무료 상담 신청",
    "ctaSubText": "지금 시작하기"
}'::jsonb),
('footer', '{
    "brandName": "THE PANG",
    "slogan": "숏츠 광고, \n한방으로 바이럴",
    "sns": { "instagram": "#", "youtube": "#", "tiktok": "#" },
    "companyLinks": [
        { "label": "회사소개", "url": "#" },
        { "label": "이용약관", "url": "#" },
        { "label": "개인정보처리방침", "url": "#" },
        { "label": "공지사항", "url": "#" }
    ],
    "contact": {
        "kakao": "카카오톡 채널",
        "email": "hello@thepang.kr",
        "time": "평일 09:00-18:00"
    }
}'::jsonb)
ON CONFLICT (section_key) DO NOTHING;


-- ────────────────────────────────────────────────────────
--  2. portfolio_items — 포트폴리오 미디어 항목
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_items (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category     TEXT NOT NULL CHECK (category IN ('meokpang','nolpang','swimpang','salpang','meotpang')),
    media_url    TEXT NOT NULL,
    media_type   TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video')),
    order_index  INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portfolio_category ON portfolio_items(category, order_index);


-- ────────────────────────────────────────────────────────
--  3. testimonials — 사장님 후기
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stars        INT NOT NULL DEFAULT 5 CHECK (stars BETWEEN 1 AND 5),
    text         TEXT NOT NULL,
    author       TEXT NOT NULL,
    badge        TEXT NOT NULL DEFAULT '먹팡',
    badge_color  TEXT NOT NULL DEFAULT '#7b2fff',
    photo_url    TEXT,
    order_index  INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- 기본 후기 데이터
INSERT INTO testimonials (stars, text, author, badge, badge_color, photo_url, order_index) VALUES
(5, '먹팡 촬영 후 매출이 30% 올랐어요. 영상 퀄리티가 정말 미쳤습니다. 강력 추천합니다!', '강남 OO 레스토랑 사장님', '먹팡', '#7b2fff', 'https://picsum.photos/seed/pang1/200/200', 0),
(5, '이렇게 결과물이 좋을 줄 몰랐어요. 틱톡에서 조회수 50만 찍었습니다. 가성비 최고!', '홍대 OO 카페 대표님', '먹팡', '#7b2fff', 'https://picsum.photos/seed/pang2/200/200', 1),
(5, '전담 PD가 친절하고 빠르게 납품해줘서 대만족입니다. 다음 달도 또 맡기려고요!', '판교 OO 네일샵 원장님', '멋팡', '#7b2fff', 'https://picsum.photos/seed/pang3/200/200', 2),
(5, 'VR체험 영상이 숏츠에서 터지면서 주말 예약이 3배나 늘었어요. THE PANG 없이는 못합니다!', '잠실 OO 체험관 대표님', '놀팡', '#e63946', 'https://picsum.photos/seed/pang4/200/200', 3)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────
--  4. pricing_plans — 가격표
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_plans (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name         TEXT NOT NULL,
    tier         TEXT NOT NULL,
    price        TEXT NOT NULL,
    period       TEXT NOT NULL DEFAULT '1회 기준',
    features     JSONB NOT NULL DEFAULT '[]',     -- TEXT[] 대신 JSONB 배열
    btn_text     TEXT NOT NULL DEFAULT '시작하기',
    order_index  INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- 기본 가격표 데이터
INSERT INTO pricing_plans (name, tier, price, period, features, btn_text, order_index) VALUES
('PANG-S', 'STARTER', '190,000', '1회 기준',
 '["현장 1회 2시간 촬영","30초 숏츠 1편","AI 자막 + 색보정","수정 1회","납기 5영업일","3플랫폼 공통 1포맷"]'::jsonb,
 '시작하기', 0),
('PANG-M', 'STANDARD', '490,000', '1회 기준',
 '["현장 1회 3시간 촬영","30초 숏츠 3편","AI 자막 + 색보정 + BGM","수정 편당 2회","납기 4영업일","플랫폼별 최적화 3포맷","전담 PD 1인","SNS 썸네일 3장"]'::jsonb,
 '지금 시작', 1),
('PANG-L', 'PREMIUM', '890,000', '1회 기준',
 '["현장 2회 (회당 4시간) 촬영","30초 숏츠 5편 (A/B테스트)","AI 자막 + 색보정 + CG + 썸네일","수정 편당 3회 + 최종확인","납기 3영업일","전플랫폼 + 가로형(16:9)","전담 PD + 마케터 2인","해시태그/캡션 + 성과 리포트"]'::jsonb,
 '프리미엄 시작', 2),
('PANG-X', 'BRAND SUBSCRIPTION', '1,490,000', '월 정기 구독',
 '["월 2회 정기 현장촬영","월 8편 숏츠 제작","풀 AI 후보정 + 브랜드 AI모델","수정 무제한","편당 2영업일 납기","PD + 마케터 + 기획자 3인","월간 콘텐츠 전략 리포트","SNS 채널 운영 컨설팅"]'::jsonb,
 '구독 시작하기', 3)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────
--  5. members — 회원 정보 (메인사이트 가입)
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    email        TEXT UNIQUE NOT NULL,
    status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted')),
    created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_members_email ON members(email);


-- ────────────────────────────────────────────────────────
--  6. admin_profiles — 관리자 프로필
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_profiles (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role         TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','super_admin')),
    created_at   TIMESTAMPTZ DEFAULT now()
);


-- ══════════════════════════════════════════════════════════
--  Row Level Security (RLS) Policies
-- ══════════════════════════════════════════════════════════

-- Helper function: 현재 유저가 관리자인지 확인
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_profiles
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── site_content ─────────────────────────────────────────
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_content_read_all"  ON site_content FOR SELECT USING (true);
CREATE POLICY "site_content_write_admin" ON site_content FOR ALL USING (is_admin());


-- ── portfolio_items ──────────────────────────────────────
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio_read_all"  ON portfolio_items FOR SELECT USING (true);
CREATE POLICY "portfolio_write_admin" ON portfolio_items FOR ALL USING (is_admin());


-- ── testimonials ─────────────────────────────────────────
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "testimonials_read_all"  ON testimonials FOR SELECT USING (true);
CREATE POLICY "testimonials_write_admin" ON testimonials FOR ALL USING (is_admin());


-- ── pricing_plans ────────────────────────────────────────
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing_read_all"  ON pricing_plans FOR SELECT USING (true);
CREATE POLICY "pricing_write_admin" ON pricing_plans FOR ALL USING (is_admin());


-- ── members ──────────────────────────────────────────────
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_admin" ON members FOR SELECT USING (is_admin());
CREATE POLICY "members_write_admin" ON members FOR ALL USING (is_admin());
CREATE POLICY "members_insert_self" ON members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members_read_self" ON members FOR SELECT USING (auth.uid() = user_id);


-- ── admin_profiles ───────────────────────────────────────
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_profiles_read_self" ON admin_profiles FOR SELECT USING (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════
--  Storage Bucket 설정 (Supabase Dashboard에서 실행)
-- ══════════════════════════════════════════════════════════
-- 1. Supabase Dashboard → Storage → Create Bucket
--    Name: media
--    Public: ON (공개 읽기)
--    File size limit: 52428800 (50MB)
--    Allowed MIME types: image/*, video/*
--
-- 2. Storage Policy (SQL):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: 누구나 읽기, 관리자만 업로드/삭제
CREATE POLICY "media_read_all" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "media_write_admin" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND is_admin());
CREATE POLICY "media_delete_admin" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND is_admin());
