-- ══════════════════════════════════════════════════════════
--  THE PANG — Orders Table (주문/견적/계약 프로세스)
--  회원가입 → 견적담기 → 견적서발행 → 결제확인 → 계약서발행 → 체결완료
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS orders (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id             BIGINT REFERENCES pricing_plans(id),
    plan_name           TEXT NOT NULL,                          -- 선택 플랜명 (PANG-S/M/L/X)
    plan_tier           TEXT,                                    -- STARTER/STANDARD/PREMIUM/HIGH-END
    plan_price          TEXT,                                    -- 플랜 기본 가격
    addons              JSONB NOT NULL DEFAULT '[]',            -- 추가 옵션 [{name, price}]
    memo                TEXT DEFAULT '',                         -- 고객 요청사항
    status              TEXT NOT NULL DEFAULT 'quote_pending'
                        CHECK (status IN (
                            'quote_pending',      -- 견적 대기
                            'quote_issued',       -- 견적서 발행됨
                            'paid',               -- 결제 확인됨
                            'contract_issued',    -- 계약서 발행됨
                            'completed'           -- 계약 체결 완료
                        )),
    total_amount        TEXT DEFAULT '',                         -- 최종 금액 (관리자 확정)
    quote_data          JSONB DEFAULT NULL,                     -- 견적서 데이터
    contract_data       JSONB DEFAULT NULL,                     -- 계약서 데이터
    quote_issued_at     TIMESTAMPTZ DEFAULT NULL,
    paid_at             TIMESTAMPTZ DEFAULT NULL,
    contract_issued_at  TIMESTAMPTZ DEFAULT NULL,
    completed_at        TIMESTAMPTZ DEFAULT NULL,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status  ON orders(status);

-- ── RLS (Row Level Security) ────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 고객: 자기 주문만 조회
CREATE POLICY "orders_read_self"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

-- 고객: 자기 주문만 생성
CREATE POLICY "orders_insert_self"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 관리자: 모든 주문 조회
CREATE POLICY "orders_read_admin"
    ON orders FOR SELECT
    USING (is_admin());

-- 관리자: 모든 주문 수정 (상태 변경, 견적서/계약서 발행 등)
CREATE POLICY "orders_update_admin"
    ON orders FOR UPDATE
    USING (is_admin());

-- 관리자: 주문 삭제
CREATE POLICY "orders_delete_admin"
    ON orders FOR DELETE
    USING (is_admin());
