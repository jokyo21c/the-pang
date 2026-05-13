# THE PANG 알림 시스템 — Supabase 환경변수 설정 가이드

## 1. Supabase Dashboard → Settings → Edge Functions → Environment Variables

아래 환경변수를 **모두** 설정해야 합니다.

---

### 텔레그램 관리자 알림 (필수)

| 변수명 | 값 | 설명 |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | `7xxxxxxxx:AAxxxxxxx...` | BotFather에서 발급한 봇 토큰 |
| `TELEGRAM_CHAT_ID` | `-100xxxxxxxxxx` | 알림 받을 채널/그룹 Chat ID |

> **텔레그램 봇 생성 방법:**
> 1. 텔레그램 앱에서 `@BotFather` 검색
> 2. `/newbot` 명령 후 봇 이름 설정
> 3. 발급된 토큰을 위에 입력
> 
> **Chat ID 확인 방법:**
> 1. 봇을 관리자 채널/그룹에 초대
> 2. `https://api.telegram.org/bot{TOKEN}/getUpdates` 접속
> 3. `chat.id` 값 확인

---

### 솔라피 카카오 알림톡 (고객 발송용)

| 변수명 | 값 | 설명 |
|---|---|---|
| `SOLAPI_API_KEY` | `NCS...` | 솔라피 API Key |
| `SOLAPI_API_SECRET` | `...` | 솔라피 API Secret |
| `SOLAPI_SENDER_PHONE` | `01012345678` | 발신 번호 (하이픈 없이) |
| `SOLAPI_KAKAO_PF_ID` | `KA01...` | 카카오 비즈니스 채널 플러스친구 ID |

---

### 카카오 알림톡 템플릿 ID (솔라피에서 등록 후 입력)

| 변수명 | 설명 |
|---|---|
| `ALIMTALK_TPL_QUOTE_ISSUED` | 견적서 발행 알림 템플릿 ID |
| `ALIMTALK_TPL_CONTRACT_ISSUED` | 계약서 발행 알림 템플릿 ID |
| `ALIMTALK_TPL_CONTRACT_COMPLETED` | 계약 체결 완료 알림 템플릿 ID |
| `ALIMTALK_TPL_PAYMENT_COMPLETED` | 결제 완료 알림 템플릿 ID |
| `ALIMTALK_TPL_REFUND_COMPLETED` | 환불 완료 알림 템플릿 ID |

> 템플릿 미등록 시 SMS로 자동 대체 발송됩니다.

---

## 2. DB 마이그레이션 실행

Supabase Dashboard → SQL Editor에서 아래 파일 내용 실행:

```
supabase/migration_notify.sql
```

---

## 3. Edge Function 배포

```bash
# Supabase CLI 설치 후
supabase functions deploy send-notify
```

또는 Supabase Dashboard → Edge Functions → New Function → 코드 붙여넣기

---

## 4. 카카오 알림톡 템플릿 등록 (솔라피)

solapi.com 접속 → 카카오 알림톡 → 템플릿 관리 → 새 템플릿 등록

### 견적서 발행 템플릿 예시:
```
[THE PANG] 견적서가 발행되었습니다.

안녕하세요, #{고객명}님!

플랜: #{플랜명}
확정 금액: #{금액}원
발행일: #{날짜}

마이페이지에서 견적서를 확인하고
결제를 진행해 주세요.

감사합니다.
```

### 계약서 발행 템플릿 예시:
```
[THE PANG] 계약서가 발행되었습니다.

안녕하세요, #{고객명}님!

플랜: #{플랜명}
발행일: #{날짜}

마이페이지 > 계약서 보기를 클릭하여
대표자(또는 계약 책임자)의 서명 후
[서명 저장]을 눌러 주세요.

서명 완료 후 최종 체결 처리됩니다.
```

---

## 5. 테스트 순서

1. 텔레그램 봇 토큰/Chat ID 설정 → 견적 요청 테스트 (이벤트 1)
2. 솔라피 API Key/Secret 설정 → 견적서 발행 테스트 (이벤트 2)
3. 나머지 이벤트 순차 테스트
