-- ══════════════════════════════════════════════════════════
--  THE PANG — 알림 시스템 마이그레이션
--  Supabase SQL Editor에서 실행하세요.
-- ══════════════════════════════════════════════════════════

-- 1. orders 테이블에 status 추가값 포함
--    (기존 CHECK 제약 조건이 있으면 먼저 제거 후 재생성)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN (
        'quote_pending',      -- 견적 대기
        'quote_issued',       -- 견적서 발행됨
        'paid',               -- 결제 확인됨
        'contract_issued',    -- 계약서 발행됨
        'completed',          -- 계약 체결 완료
        'refunded'            -- 환불 완료
    ));

-- 2. 결제 알림 중복 방지 플래그 컬럼 추가
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_notified BOOLEAN DEFAULT false;

-- 3. 관리자 정책: orders 테이블 payment_notified 업데이트 허용
--    (service_role key로 Edge Function이 직접 업데이트하므로 RLS 우회됨)
--    별도 정책 불필요

-- ── members 테이블에 phone 컬럼이 없다면 추가 ────────────────
--    (알림톡 발송을 위해 전화번호가 필요합니다)
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone TEXT;

-- ── 인덱스 ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_payment_notified ON orders(payment_notified) WHERE payment_notified = false;
