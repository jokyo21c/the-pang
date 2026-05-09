/* ════════════════════════════════════════════════════════
   THE PANG PDF Template Functions (pdf-templates.js)
   마이페이지와 관리자 페이지가 공유하는 PDF 템플릿 함수
   ════════════════════════════════════════════════════════ */

function _pdfExtractNum(str) {
    if (!str) return 0;
    return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;
}

/* ── 견적서 HTML 생성 ── */
function buildQuotePdfHtml(order) {
    const quoteDate = order.quote_data?.issuedAt
        ? new Date(order.quote_data.issuedAt).toLocaleDateString('ko-KR') : '-';
    const basePrice = order.plan_price || '-';
    let basePriceClean, basePriceNum = 0;
    if (basePrice.includes('|')) {
        const p = basePrice.split('|');
        basePriceClean = (p[2] || p[0]) + '원';
        basePriceNum = _pdfExtractNum(p[2] || p[0]);
    } else {
        basePriceClean = basePrice + '원';
        basePriceNum = _pdfExtractNum(basePrice);
    }
    let addonsRows = '', addonsTotalNum = 0;
    if (order.addons && order.addons.length > 0) {
        addonsRows = order.addons.map(a => {
            addonsTotalNum += _pdfExtractNum(a.price || '');
            return `<tr><td style="padding:6px 10px;border:1px solid #ddd;">${a.name}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${a.price || '-'}</td></tr>`;
        }).join('');
    }
    const adminReply = order.quote_data?.admin_reply || '';
    const supply = basePriceNum + addonsTotalNum;
    const vat = Math.floor(supply * 0.1);
    const total = supply + vat;

    const breakdown = `<table style="width:100%;border-collapse:collapse;margin-top:20px;margin-bottom:8px;">
        <tr style="background:#f9f9f9;"><td style="padding:8px 12px;border:1px solid #ddd;font-weight:600;width:60%;">기본 가격</td><td style="padding:8px 12px;border:1px solid #ddd;text-align:right;">${basePriceNum.toLocaleString('ko-KR')}원</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:600;">추가 옵션 소계</td><td style="padding:8px 12px;border:1px solid #ddd;text-align:right;">${addonsTotalNum.toLocaleString('ko-KR')}원</td></tr>
        <tr style="background:#f9f9f9;"><td style="padding:8px 12px;border:1px solid #ddd;font-weight:600;">공급가액 (VAT 별도)</td><td style="padding:8px 12px;border:1px solid #ddd;text-align:right;font-weight:600;">${supply.toLocaleString('ko-KR')}원</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:600;">부가세 (VAT 10%)</td><td style="padding:8px 12px;border:1px solid #ddd;text-align:right;color:#111;">${vat.toLocaleString('ko-KR')}원</td></tr>
        <tr style="background:#f5f0ff;"><td style="padding:10px 12px;border:1px solid #e0d4f5;font-weight:700;color:#7b2fff;font-size:14px;">합계 (VAT 포함)</td><td style="padding:10px 12px;border:1px solid #e0d4f5;text-align:right;font-weight:700;color:#e53c11;font-size:16px;">${total.toLocaleString('ko-KR')}원</td></tr>
    </table>`;

    return `<div id="quotePdfContent" style="width:794px;padding:60px 70px;font-family:'Pretendard Variable','Malgun Gothic',sans-serif;color:#111;font-size:13px;line-height:1.8;background:#fff;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #7b2fff;">
        <div><div style="font-size:24px;font-weight:700;letter-spacing:2px;">THE PANG</div><div style="font-size:11px;color:#888;margin-top:4px;">넥스온 | 사업자번호: 686-46-01233</div><div style="font-size:11px;color:#888;">충남 아산시 탕정면 탕정면로109번길 46-1 | 대표: 조교선</div></div>
        <div style="text-align:right;"><div style="font-size:22px;font-weight:700;color:#7b2fff;letter-spacing:3px;">견 적 서</div><div style="font-size:12px;color:#888;margin-top:4px;">발행일: ${quoteDate}</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:8px 12px;border:1px solid #ddd;background:#f9f9f9;width:120px;font-weight:600;">플랜</td><td style="padding:8px 12px;border:1px solid #ddd;">${order.plan_name} (${order.plan_tier || ''})</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #ddd;background:#f9f9f9;font-weight:600;">기본 가격</td><td style="padding:8px 12px;border:1px solid #ddd;">${basePriceClean}</td></tr>
    </table>
    ${addonsRows ? `<h3 style="font-size:14px;margin-bottom:8px;color:#7b2fff;">추가 옵션</h3><table style="width:100%;border-collapse:collapse;margin-bottom:20px;"><tr style="background:#f9f9f9;"><th style="padding:6px 10px;border:1px solid #ddd;text-align:left;">옵션명</th><th style="padding:6px 10px;border:1px solid #ddd;text-align:right;">금액</th></tr>${addonsRows}</table>` : ''}
    ${breakdown}
    ${order.memo ? `<div style="margin-top:24px;padding:14px;background:#fafafa;border:1px solid #eee;border-radius:8px;"><div style="font-size:12px;font-weight:700;color:#7b2fff;margin-bottom:6px;">고객 요청사항</div><div style="font-size:13px;color:#333;white-space:pre-wrap;">${order.memo}</div></div>` : ''}
    ${adminReply ? `<div style="margin-top:12px;padding:14px;background:#f5f0ff;border:1px solid #e0d4f5;border-radius:8px;"><div style="font-size:12px;font-weight:700;color:#e53c11;margin-bottom:6px;">답변</div><div style="font-size:13px;color:#333;white-space:pre-wrap;">${adminReply}</div></div>` : ''}
</div>`;
}

/* ── 계약서 1페이지 HTML 생성 ── */
function buildContractPage1Html(order) {
    const cd = order.contract_data?.issuedAt ? new Date(order.contract_data.issuedAt) : new Date();
    const year = cd.getFullYear(), month = cd.getMonth()+1, day = cd.getDate();
    const totalAmt = order.total_amount ? (() => { const n = _pdfExtractNum(String(order.total_amount)); return (n + Math.floor(n*0.1)).toLocaleString('ko-KR'); })() : '0';
    const sig = order.contract_data?.customer_signature || '';
    const custBiz = order.contract_data?.customer_business || {};
    const cd2 = order.contract_data || {};
    const member = order._member || order.members || {};
    const customerName = order.user_name || order.plan_name || '고객';
    const bizCompany = custBiz.company_name || cd2.company_name || member.company || member.company_name || customerName;
    const bizCeo = custBiz.ceo_name || cd2.ceo_name || member.name || '';
    const bizNum = custBiz.biz_number || cd2.biz_number || '';
    const bizAddr = custBiz.address || cd2.address || '';

    return `<div id="pdfContractP1" style="width:794px;height:1123px;padding:44px 60px;font-family:'Pretendard Variable','Malgun Gothic',sans-serif;color:#111;font-size:11.5px;line-height:1.6;background:#fff;box-sizing:border-box;overflow:hidden;">
    <h1 style="text-align:center;font-size:19px;font-weight:700;margin-bottom:3px;letter-spacing:2px;">광고 마케팅 업무 표준 계약서</h1>
    <div style="text-align:center;font-size:10px;color:#888;margin-bottom:14px;">THE PANG by NEXON</div>
    <p style="margin-bottom:10px;">공급자 넥스온(이하 "동"이라 한다)과 공급받는 자 ${bizCompany}(이하 "행"이라 한다)은 "행"의 상품 및 브랜드 홍보를 위한 광고 마케팅 업무를 수행함에 있어 상호 신뢰를 바탕으로 다음과 같이 계약을 체결한다.</p>
    <h3 style="margin-top:10px;font-size:12px;font-weight:700;">제1조 (목적)</h3><p style="margin:2px 0 8px;">본 계약은 "행"이 의뢰한 광고 마케팅 업무를 "동"이 수행함에 있어 필요한 제반 사항과 양 당사자의 권리 및 의무를 규정함을 목적으로 한다.</p>
    <h3 style="margin-top:8px;font-size:12px;font-weight:700;">제2조 (업무의 범위 및 내용)</h3><p style="margin:2px 0 8px;">① "동"이 수행할 구체적인 업무 범위와 실행 내용은 양 당사자가 사전에 합의한 [별첨: 견적서]를 원칙으로 한다.<br>② 추가 업무 발생 시 양 당사자는 서면(전자문서 포함) 합의를 통해 업무 범위와 비용을 조정한다.</p>
    <h3 style="margin-top:8px;font-size:12px;font-weight:700;">제3조 (계약 기간)</h3><p style="margin:2px 0 8px;">본 계약 기간은 "행"이 결제를 완료한 날로부터 양 당사자가 합의한 납기 예정일까지로 하며, 납기 예정일은 담당 PD와 별도 협의를 통해 확정된다. 연장이 필요한 경우 종료 전 상호 협의하여 결정한다.</p>
    <h3 style="margin-top:8px;font-size:12px;font-weight:700;">제4조 (계약 금액 및 결제 방식)</h3><p style="margin:2px 0 8px;">① 본 업무의 총 계약 금액은 금 <strong>${totalAmt}원 (VAT 포함)</strong>으로 한다.<br>② "행"은 "동"이 제공하는 온라인 결제 시스템을 통하여 선결제 완료 후 작업이 착수되며, 지출 증빙은 결제 수단에 따라 발행된다.</p>
    <h3 style="margin-top:8px;font-size:12px;font-weight:700;">제5조 (계약의 성립)</h3><p style="margin:2px 0 8px;">본 계약은 "행"이 결제를 완료하고, "동"이 본 계약서를 전자적 방식으로 발송한 시점부터 효력이 발생하며, 결제 행위는 본 계약 내용에 동의한 것으로 간주한다.</p>
    <h3 style="margin-top:8px;font-size:12px;font-weight:700;">제6조 (업무의 수행 및 협조)</h3><p style="margin:2px 0 8px;">"동"은 신의성실의 원칙에 따라 업무를 수행하며, "행"의 자료 제공 지연으로 인한 일정 차질은 "동"의 책임으로 보지 않는다.</p>
    <h3 style="margin-top:8px;font-size:12px;font-weight:700;">제7조 (권리의 귀속 및 성과물 활용)</h3><p style="margin:2px 0 8px;">① 최종 성과물의 저작재산권은 "행"이 대금을 완납한 시점에 "행"에게 귀속된다.<br>② "행"은 "동"이 해당 성과물을 "동"의 포트폴리오 및 자체 광고·마케팅 목적으로 활용하는 것에 동의한다.<br>③ "행"이 제공하는 원본 소재(사진, 영상, 로고, 음원 등)에 대한 저작권 및 제3자 저작권 침해 관련 모든 책임은 "행"에게 있다.</p>
    <h3 style="margin-top:8px;font-size:12px;font-weight:700;">제8조 (비밀유지)</h3><p style="margin:2px 0 8px;">양 당사자는 본 계약과 관련하여 취득한 영업비밀 및 개인정보를 제3자에게 누설하거나 목적 외로 사용해서는 안 된다.</p>
    <h3 style="margin-top:8px;font-size:12px;font-weight:700;">제9조 (계약 해지 및 환불)</h3><p style="margin:2px 0 8px;">의무 위반 시 7일 이내 시정되지 않으면 계약을 해지할 수 있으며, 환불 기준은 이용약관 제9조에 따르고, "행"은 계약 체결 시 이를 사전에 동의한 것으로 간주한다.</p>
    <h3 style="margin-top:8px;font-size:12px;font-weight:700;">제10조 (손해배상 및 관할 법원)</h3><p style="margin:2px 0 8px;">본 계약 위반으로 발생한 손해는 위반 당사자가 배상하며, 분쟁 발생 시 "동"의 본점 소재지 관할 법원을 제1심 합의 관할 법원으로 한다.</p>
    <h3 style="margin-top:8px;font-size:12px;font-weight:700;">제11조 (전자서명의 효력)</h3><p style="margin:2px 0 8px;">본 계약에 사용된 온라인 동의 및 전자서명은 「전자서명법」 제3조에 따라 서면 서명과 동일한 법적 효력을 가진다.</p>
    <div style="margin-top:18px;text-align:center;font-size:12px;font-weight:600;">계약일자: ${year}년 ${month}월 ${day}일</div>
    <div style="display:flex;justify-content:space-between;margin-top:16px;gap:30px;">
        <div style="flex:1;border:1px solid #ddd;border-radius:6px;padding:12px;">
            <div style="font-size:11px;font-weight:700;color:#7b2fff;margin-bottom:8px;">[동] 공급자</div>
            <table style="font-size:11px;width:100%;border-collapse:collapse;">
                <tr><td style="padding:3px 0;color:#666;width:65px;">업체명</td><td style="padding:3px 0;font-weight:600;"><div style="position:relative;display:inline-block;">넥스온<img src="/assets/images/nexon_seal.png" style="position:absolute;top:-52px;left:90px;height:120px;max-width:none;z-index:1;" alt="(직인)"></div></td></tr>
                <tr><td style="padding:3px 0;color:#666;">사업자번호</td><td style="padding:3px 0;">686-46-01233</td></tr>
                <tr><td style="padding:3px 0;color:#666;">주소</td><td style="padding:3px 0;">충남 아산시 탕정면 탕정면로109번길 46-1</td></tr>
                <tr><td style="padding:3px 0;color:#666;">대표자</td><td style="padding:3px 0;font-weight:600;"><div style="position:relative;display:inline-block;">조교선<img src="/assets/images/ceo_signature.png" style="position:absolute;top:0px;left:40px;height:34px;max-width:none;z-index:1;" alt="(서명)" onerror="this.style.display='none'"></div></td></tr>
            </table>
        </div>
        <div style="flex:1;border:1px solid #ddd;border-radius:6px;padding:12px;">
            <div style="font-size:11px;font-weight:700;color:#e53c11;margin-bottom:8px;">[행] 공급받는자</div>
            <table style="font-size:11px;width:100%;border-collapse:collapse;">
                <tr><td style="padding:3px 0;color:#666;width:65px;vertical-align:middle;">업체명</td><td style="padding:3px 0;font-weight:600;vertical-align:middle;">${bizCompany}</td></tr>
                <tr><td style="padding:3px 0;color:#666;vertical-align:middle;">사업자번호</td><td style="padding:3px 0;vertical-align:middle;">${bizNum || '-'}</td></tr>
                <tr><td style="padding:3px 0;color:#666;vertical-align:middle;">주소</td><td style="padding:3px 0;vertical-align:middle;">${bizAddr || '-'}</td></tr>
                <tr><td style="padding:3px 0;color:#666;vertical-align:middle;">대표자</td><td style="padding:3px 0;font-weight:600;vertical-align:middle;"><div style="position:relative;display:inline-block;">${bizCeo || '(온라인 결제 동의로 갈음)'}${sig ? `<img src="${sig}" style="position:absolute;top:-4px;left:100%;margin-left:10px;height:24px;max-width:none;z-index:1;" alt="(서명)">` : ''}</div></td></tr>
            </table>
        </div>
    </div>
</div>`;
}

/* ── 계약서 2페이지(별첨) HTML 생성 ── */
function buildContractPage2Html(order) {
    const cd = order.contract_data?.issuedAt ? new Date(order.contract_data.issuedAt) : new Date();
    const year = cd.getFullYear(), month = cd.getMonth()+1, day = cd.getDate();
    const customerName = order.user_name || order.plan_name || '고객';
    const adminReply = order.quote_data?.admin_reply || '';
    const basePrice = order.plan_price || '-';
    let basePriceClean, basePriceNum = 0;
    if (basePrice.includes('|')) {
        const p = basePrice.split('|');
        basePriceClean = (p[2] || p[0]) + '원';
        basePriceNum = _pdfExtractNum(p[2] || p[0]);
    } else {
        basePriceClean = basePrice + '원';
        basePriceNum = _pdfExtractNum(basePrice);
    }
    let addonsRows = '', addonsTotalNum = 0;
    if (order.addons && order.addons.length > 0) {
        addonsRows = order.addons.map(a => {
            addonsTotalNum += _pdfExtractNum(a.price || '');
            return `<tr><td style="padding:6px 10px;border:1px solid #ddd;">${a.name}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${a.price || '-'}</td></tr>`;
        }).join('');
    }
    const supply2 = basePriceNum + addonsTotalNum;
    const vat2 = Math.floor(supply2 * 0.1);
    const total2 = supply2 + vat2;

    const breakdown2 = `<table style="width:100%;border-collapse:collapse;margin-top:16px;margin-bottom:8px;">
        <tr style="background:#f9f9f9;"><td style="padding:7px 12px;border:1px solid #ddd;font-weight:600;width:60%;font-size:11px;">기본 가격</td><td style="padding:7px 12px;border:1px solid #ddd;text-align:right;font-size:11px;">${basePriceNum.toLocaleString('ko-KR')}원</td></tr>
        <tr><td style="padding:7px 12px;border:1px solid #ddd;font-weight:600;font-size:11px;">추가 옵션 소계</td><td style="padding:7px 12px;border:1px solid #ddd;text-align:right;font-size:11px;">${addonsTotalNum.toLocaleString('ko-KR')}원</td></tr>
        <tr style="background:#f9f9f9;"><td style="padding:7px 12px;border:1px solid #ddd;font-weight:600;font-size:11px;">공급가액 (VAT 별도)</td><td style="padding:7px 12px;border:1px solid #ddd;text-align:right;font-weight:600;font-size:11px;">${supply2.toLocaleString('ko-KR')}원</td></tr>
        <tr><td style="padding:7px 12px;border:1px solid #ddd;font-weight:600;font-size:11px;">부가세 (VAT 10%)</td><td style="padding:7px 12px;border:1px solid #ddd;text-align:right;color:#000;font-size:11px;">${vat2.toLocaleString('ko-KR')}원</td></tr>
        <tr style="background:#f5f0ff;"><td style="padding:9px 12px;border:1px solid #e0d4f5;font-weight:700;color:#111;font-size:12px;">합계 (VAT 포함)</td><td style="padding:9px 12px;border:1px solid #e0d4f5;text-align:right;font-weight:700;color:#e53c11;font-size:14px;">${total2.toLocaleString('ko-KR')}원</td></tr>
    </table>`;

    return `<div id="pdfContractP2" style="width:794px;padding:50px 65px;font-family:'Pretendard Variable','Malgun Gothic',sans-serif;color:#111;font-size:12px;line-height:1.7;background:#fff;box-sizing:border-box;">
    <h2 style="text-align:center;font-size:18px;font-weight:700;margin-bottom:4px;letter-spacing:1px;">[별 첨] 계약 상세 내역</h2>
    <div style="text-align:center;font-size:10px;color:#888;margin-bottom:24px;">본 문서는 광고 마케팅 업무 표준 계약서의 별첨 자료입니다.</div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #7b2fff;">
        <div><div style="font-size:18px;font-weight:700;">THE PANG</div><div style="font-size:10px;color:#888;margin-top:2px;">넥스온 | 686-46-01233 | 충남 아산시 탕정면 탕정면로109번길 46-1</div></div>
        <div style="text-align:right;font-size:11px;color:#888;">계약일: ${year}년 ${month}월 ${day}일</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tr><td style="padding:8px 12px;border:1px solid #ddd;background:#f9f9f9;width:110px;font-weight:600;">고객명</td><td style="padding:8px 12px;border:1px solid #ddd;">${customerName}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #ddd;background:#f9f9f9;font-weight:600;">플랜</td><td style="padding:8px 12px;border:1px solid #ddd;">${order.plan_name} (${order.plan_tier || ''})</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #ddd;background:#f9f9f9;font-weight:600;">기본 가격</td><td style="padding:8px 12px;border:1px solid #ddd;">${basePriceClean}</td></tr>
    </table>
    ${addonsRows ? `<h3 style="font-size:13px;margin-bottom:6px;color:#7b2fff;">추가 옵션</h3><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr style="background:#f9f9f9;"><th style="padding:6px 10px;border:1px solid #ddd;text-align:left;">옵션명</th><th style="padding:6px 10px;border:1px solid #ddd;text-align:right;">금액</th></tr>${addonsRows}</table>` : ''}
    ${breakdown2}
    ${order.memo ? `<div style="padding:14px;background:#fafafa;border:1px solid #eee;border-radius:8px;margin-bottom:12px;"><div style="font-size:12px;font-weight:700;color:#7b2fff;margin-bottom:6px;">고객 요청사항</div><div style="font-size:12px;color:#333;white-space:pre-wrap;">${order.memo}</div></div>` : ''}
    ${adminReply ? `<div style="padding:14px;background:#f5f0ff;border:1px solid #e0d4f5;border-radius:8px;margin-bottom:12px;"><div style="font-size:12px;font-weight:700;color:#e53c11;margin-bottom:6px;">답변</div><div style="font-size:12px;color:#333;white-space:pre-wrap;">${adminReply}</div></div>` : ''}
    <div style="margin-top:30px;text-align:center;font-size:10px;color:#aaa;">본 별첨은 계약서와 동일한 효력을 가집니다.</div>
</div>`;
}
