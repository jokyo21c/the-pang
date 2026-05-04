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

window.formatPhone = function(el) {
    let val = el.value.replace(/[^0-9]/g, '');
    let res = '';
    if(val.length < 4) {
        res = val;
    } else if(val.startsWith('02')) {
        if(val.length < 6) res = val.substr(0, 2) + '-' + val.substr(2);
        else if(val.length < 10) res = val.substr(0, 2) + '-' + val.substr(2, 3) + '-' + val.substr(5);
        else res = val.substr(0, 2) + '-' + val.substr(2, 4) + '-' + val.substr(6, 4);
    } else {
        if(val.length < 7) res = val.substr(0, 3) + '-' + val.substr(3);
        else if(val.length < 11) res = val.substr(0, 3) + '-' + val.substr(3, 3) + '-' + val.substr(6);
        else res = val.substr(0, 3) + '-' + val.substr(3, 4) + '-' + val.substr(7, 4);
    }
    el.value = res;
};

window.formatBizNum = function(el) {
    let val = el.value.replace(/[^0-9]/g, '');
    let res = '';
    if(val.length < 4) {
        res = val;
    } else if(val.length < 6) {
        res = val.substr(0, 3) + '-' + val.substr(3);
    } else {
        res = val.substr(0, 3) + '-' + val.substr(3, 2) + '-' + val.substr(5, 5);
    }
    el.value = res;
};
