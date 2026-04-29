/* ══════════════════════════════════════════════════════════
   THE PANG — Configuration
   ══════════════════════════════════════════════════════════
   Supabase anon key는 클라이언트에서 공개해도 안전합니다.
   보안은 RLS(Row Level Security) 정책으로 관리됩니다.
   
   ⚠️ 아래 값을 실제 Supabase 프로젝트 정보로 교체하세요.
   ══════════════════════════════════════════════════════════ */

const PANG_CONFIG = {
    SUPABASE_URL:  'https://trrbnqsoonntafpeamkf.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycmJucXNvb25udGFmcGVhbWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODkxMDIsImV4cCI6MjA5MDc2NTEwMn0.4ePv08u88njYJojFivO8zbz9DH68iGbrPbtozQ5m1xc',

    // Supabase Storage (파일 저장소 — 원본 보관)
    STORAGE_BUCKET: 'media',

    // Bunny.net CDN (트래픽 전달 — Supabase Storage를 Origin으로 사용)
    BUNNY_STORAGE_ZONE: 'the-pang',
    BUNNY_API_KEY: '78beea97-9596-4b51-8186f73a204d-3ae5-443f',
    BUNNY_PULL_ZONE_URL: 'https://the-pang.b-cdn.net',

    // 사이트 정보
    SITE_NAME: 'THE PANG',
    SITE_URL:  'https://xn--9m1b261d.store',
};

// Global export
window.PANG_CONFIG = PANG_CONFIG;
