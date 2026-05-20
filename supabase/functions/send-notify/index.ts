/* ═══════════════════════════════════════════════════════════
   THE PANG — send-notify Edge Function
   관리자: 텔레그램 봇 / 고객: 솔라피 카카오 알림톡
   ═══════════════════════════════════════════════════════════ */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── HMAC-SHA256 서명 생성 (솔라피 인증용) ─────────────────────
async function hmacSHA256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData,
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── 솔라피 Authorization 헤더 생성 ───────────────────────────
async function getSolapiAuthHeader(): Promise<string> {
  const apiKey = Deno.env.get("SOLAPI_API_KEY") || "";
  const apiSecret = Deno.env.get("SOLAPI_API_SECRET") || "";
  const date = new Date().toISOString();
  const salt = crypto.randomUUID().replace(/-/g, "");
  const signature = await hmacSHA256(apiSecret, date + salt);
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

// ── 텔레그램 봇 메시지 발송 (관리자용) ───────────────────────
async function sendTelegram(message: string): Promise<boolean> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID") || "";
  if (!botToken || !chatId) {
    console.warn("[notify] 텔레그램 환경변수 미설정");
    return false;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    const json = await res.json();
    if (!json.ok) {
      console.error("[notify] 텔레그램 발송 실패:", json);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[notify] 텔레그램 에러:", e);
    return false;
  }
}

// ── 솔라피 카카오 알림톡 발송 (고객용) ───────────────────────
async function sendAlimtalk(
  to: string,
  templateId: string,
  variables: Record<string, string>,
  fallbackText: string
): Promise<boolean> {
  const fromPhone = Deno.env.get("SOLAPI_SENDER_PHONE") || "";
  const pfId = Deno.env.get("SOLAPI_KAKAO_PF_ID") || "";
  if (!fromPhone || !pfId) {
    console.warn("[notify] 솔라피 환경변수 미설정");
    return false;
  }

  // 전화번호 정규화 (숫자 이외 문자 모두 제거)
  const toClean = to.replace(/[^0-9]/g, "");

  try {
    const authHeader = await getSolapiAuthHeader();
    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        message: {
          to: toClean,
          from: fromPhone,
          kakaoOptions: {
            pfId,
            templateId,
            variables,
            disableSms: false, // 실패 시 SMS 대체 발송
          },
          text: fallbackText, // SMS 대체 발송용 텍스트
        },
      }),
    });

    const json = await res.json();
    if (json.errorCode) {
      console.error("[notify] 솔라피 발송 실패:", json);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[notify] 솔라피 에러:", e);
    return false;
  }
}

// ── 알림 내용 정의 ────────────────────────────────────────────
type NotifyEvent =
  | "quote_requested"      // 이벤트 1: 고객 견적 요청
  | "quote_issued"         // 이벤트 2: 관리자 견적서 발행
  | "info_submitted"       // 이벤트 3: 고객 계약정보 등록 완료
  | "contract_issued"      // 이벤트 4: 관리자 계약서 발행
  | "contract_signed"      // 이벤트 5: 고객 서명 완료
  | "contract_completed"   // 이벤트 6: 관리자 체결 완료 (양측)
  | "payment_completed"    // 이벤트 7/8: 결제/입금 완료 (양측)
  | "refund_completed";    // 이벤트 9: 환불 처리 완료 (양측)

interface NotifyPayload {
  event: NotifyEvent;
  orderId: number;
  customerName?: string;
  planName?: string;
  planTier?: string;
  totalAmount?: string;
  contactPhone?: string; // 고객 알림톡 수신 번호
  refundAmount?: string;
  refundReason?: string;
  adminPageUrl?: string;
  mypageUrl?: string;
}

// ── 이벤트별 메시지 생성 ──────────────────────────────────────
function buildTelegramMessage(payload: NotifyPayload): string | null {
  const {
    event, orderId, customerName = "고객", planName = "-",
    totalAmount = "-", refundAmount = "-", refundReason = "-",
    adminPageUrl = "https://the-pang.vercel.app/admin/dashboard.html",
  } = payload;

  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  switch (event) {
    case "quote_requested":
      return (
        `🔔 <b>새 견적 요청이 접수되었습니다</b>\n\n` +
        `👤 고객명: ${customerName}\n` +
        `📦 플랜: ${planName}\n` +
        `📅 요청일시: ${now}\n\n` +
        `👉 <a href="${adminPageUrl}#orders">관리자 페이지에서 확인하기</a>`
      );

    case "info_submitted":
      return (
        `📋 <b>계약정보 등록이 완료되었습니다</b>\n\n` +
        `👤 고객명: ${customerName}\n` +
        `📦 플랜: ${planName}\n` +
        `📅 제출일시: ${now}\n\n` +
        `⚡ 결제 확인 후 계약서를 발행해 주세요.\n` +
        `👉 <a href="${adminPageUrl}#orders">관리자 페이지에서 확인하기</a>`
      );

    case "contract_signed":
      return (
        `✍️ <b>계약서 전자서명이 완료되었습니다</b>\n\n` +
        `👤 고객명: ${customerName}\n` +
        `📦 플랜: ${planName}\n` +
        `🕐 서명일시: ${now}\n\n` +
        `⚡ 체결완료 버튼을 눌러 계약을 확정해 주세요.\n` +
        `👉 <a href="${adminPageUrl}#orders">관리자 페이지에서 확인하기</a>`
      );

    case "contract_completed":
      return (
        `🎉 <b>계약이 최종 체결되었습니다!</b>\n\n` +
        `👤 고객명: ${customerName}\n` +
        `📦 플랜: ${planName}\n` +
        `💰 계약금액: ${totalAmount}원\n` +
        `📅 체결일시: ${now}`
      );

    case "payment_completed":
      return (
        `💳 <b>결제가 확인되었습니다</b>\n\n` +
        `👤 고객명: ${customerName}\n` +
        `📦 플랜: ${planName}\n` +
        `💰 금액: ${totalAmount}원\n` +
        `📅 확인일시: ${now}`
      );

    case "refund_completed":
      return (
        `💸 <b>환불 처리가 완료되었습니다</b>\n\n` +
        `👤 고객명: ${customerName}\n` +
        `📦 플랜: ${planName}\n` +
        `💰 환불 금액: ${refundAmount}원\n` +
        `📝 환불 사유: ${refundReason}\n` +
        `📅 처리일시: ${now}`
      );

    default:
      return null; // 관리자 알림 불필요한 이벤트
  }
}

interface AlimtalkSpec {
  templateId: string;
  variables: Record<string, string>;
  fallback: string;
}

function buildAlimtalkMessage(payload: NotifyPayload): AlimtalkSpec | null {
  const {
    event, customerName = "고객", planName = "-",
    totalAmount = "-", refundAmount = "-", refundReason = "-",
    mypageUrl = "https://the-pang.vercel.app/mypage.html",
  } = payload;

  const today = new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });

  switch (event) {
    case "quote_issued":
      return {
        // 솔라피 템플릿 등록 후 실제 templateId로 교체 필요
        templateId: Deno.env.get("ALIMTALK_TPL_QUOTE_ISSUED") || "TPL_QUOTE_ISSUED",
        variables: {
          "#{고객명}": customerName,
          "#{플랜명}": planName,
          "#{금액}": totalAmount,
          "#{날짜}": today,
        },
        fallback:
          `[THE PANG] 견적서가 발행되었습니다.\n` +
          `안녕하세요, ${customerName}님!\n` +
          `플랜: ${planName}\n금액: ${totalAmount}원\n` +
          `마이페이지에서 확인해 주세요.`,
      };

    case "contract_issued":
      return {
        templateId: Deno.env.get("ALIMTALK_TPL_CONTRACT_ISSUED") || "TPL_CONTRACT_ISSUED",
        variables: {
          "#{고객명}": customerName,
          "#{플랜명}": planName,
          "#{날짜}": today,
        },
        fallback:
          `[THE PANG] 계약서가 발행되었습니다.\n` +
          `안녕하세요, ${customerName}님!\n` +
          `계약서를 확인하고 서명해 주세요.\n` +
          `대표자(또는 계약책임자) 서명 후 [서명 저장]을 눌러 주세요.\n` +
          `마이페이지에서 확인해 주세요.`,
      };

    case "contract_completed":
      return {
        templateId: Deno.env.get("ALIMTALK_TPL_CONTRACT_COMPLETED") || "TPL_CONTRACT_COMPLETED",
        variables: {
          "#{고객명}": customerName,
          "#{플랜명}": planName,
          "#{금액}": totalAmount,
          "#{날짜}": today,
        },
        fallback:
          `[THE PANG] 계약이 최종 체결되었습니다! 🎉\n` +
          `안녕하세요, ${customerName}님!\n` +
          `플랜: ${planName}\n금액: ${totalAmount}원\n` +
          `담당 PD가 곧 연락드릴 예정입니다. 감사합니다.`,
      };

    case "payment_completed":
      return {
        templateId: Deno.env.get("ALIMTALK_TPL_PAYMENT_COMPLETED") || "TPL_PAYMENT_COMPLETED",
        variables: {
          "#{고객명}": customerName,
          "#{플랜명}": planName,
          "#{금액}": totalAmount,
          "#{날짜}": today,
        },
        fallback:
          `[THE PANG] 결제가 확인되었습니다.\n` +
          `안녕하세요, ${customerName}님!\n` +
          `플랜: ${planName}\n금액: ${totalAmount}원\n` +
          `결제가 정상 처리되었습니다. 감사합니다.`,
      };

    case "refund_completed":
      return {
        templateId: Deno.env.get("ALIMTALK_TPL_REFUND_COMPLETED") || "TPL_REFUND_COMPLETED",
        variables: {
          "#{고객명}": customerName,
          "#{환불금액}": refundAmount,
          "#{환불사유}": refundReason,
          "#{날짜}": today,
        },
        fallback:
          `[THE PANG] 환불이 완료되었습니다.\n` +
          `안녕하세요, ${customerName}님!\n` +
          `환불 금액: ${refundAmount}원\n환불 사유: ${refundReason}\n` +
          `3~5 영업일 내 계좌로 입금됩니다. 감사합니다.`,
      };

    default:
      return null; // 고객 알림 불필요한 이벤트
  }
}

// ── 중복 발송 방지: notification_sent 플래그 확인/업데이트 ──
async function checkAndMarkNotified(
  supabase: ReturnType<typeof createClient>,
  orderId: number,
  event: NotifyEvent
): Promise<boolean> {
  // 결제 관련 이벤트만 중복 방지 플래그 사용
  if (event !== "payment_completed") return false; // 중복 아님

  const { data } = await supabase
    .from("orders")
    .select("payment_notified")
    .eq("id", orderId)
    .single();

  if (data?.payment_notified === true) {
    return true; // 이미 발송됨 → 중복
  }
  return false;
}

async function markPaymentNotified(
  supabase: ReturnType<typeof createClient>,
  orderId: number
): Promise<void> {
  await supabase
    .from("orders")
    .update({ payment_notified: true })
    .eq("id", orderId);
}

// ── 메인 핸들러 ───────────────────────────────────────────────
serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload: NotifyPayload = await req.json();
    const { event, orderId, contactPhone } = payload;

    // Supabase 클라이언트 (service_role 사용)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ── 서버측 고객 정보 보완 (RLS 우회) ─────────────────────
    if (orderId) {
      try {
        const { data: orderRow } = await supabase
          .from("orders")
          .select("user_id, plan_name, total_amount")
          .eq("id", orderId)
          .single();

        if (orderRow) {
          if (!payload.planName || payload.planName === "-") {
            payload.planName = orderRow.plan_name || payload.planName;
          }
          if (!payload.totalAmount || payload.totalAmount === "-") {
            payload.totalAmount = orderRow.total_amount || payload.totalAmount;
          }

          if (orderRow.user_id) {
            const { data: memberRow } = await supabase
              .from("members")
              .select("name, phone")
              .eq("user_id", orderRow.user_id)
              .single();

            if (memberRow) {
              if (!payload.contactPhone) {
                payload.contactPhone = memberRow.phone || "";
              }
              if (!payload.customerName || payload.customerName === "고객") {
                payload.customerName = memberRow.name || payload.customerName;
              }
            }
          }
        }
      } catch (resolveErr) {
        console.warn("[send-notify] 고객 정보 서버측 조회 실패(무시):", resolveErr);
      }
    }

    // ── 중복 발송 방지 (결제 이벤트) ─────────────────────────
    const isDuplicate = await checkAndMarkNotified(supabase, orderId, event);
    if (isDuplicate) {
      return new Response(
        JSON.stringify({ success: false, reason: "already_notified" }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const results: Record<string, boolean> = {};

    // ── 관리자 → 텔레그램 ────────────────────────────────────
    const tgMsg = buildTelegramMessage(payload);
    if (tgMsg) {
      results.telegram = await sendTelegram(tgMsg);
    }

    // ── 고객 → 카카오 알림톡 ─────────────────────────────────
    const alimtalkSpec = buildAlimtalkMessage(payload);
    if (alimtalkSpec && payload.contactPhone) {
      results.alimtalk = await sendAlimtalk(
        payload.contactPhone,
        alimtalkSpec.templateId,
        alimtalkSpec.variables,
        alimtalkSpec.fallback
      );
    }

    // ── 결제 완료 시 중복 방지 플래그 체크 ───────────────────
    if (event === "payment_completed") {
      await markPaymentNotified(supabase, orderId);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[send-notify] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
