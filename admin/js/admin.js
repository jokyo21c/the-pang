/* ══════════════════════════════════════════════════════════
   THE PANG Admin — Controller (admin.js)
   ══════════════════════════════════════════════════════════ */

// ── Auth Guard ──────────────────────────────────────────
if (sessionStorage.getItem('pang_admin_auth') !== 'true') {
    window.location.href = 'index.html';
}

// ── State ───────────────────────────────────────────────
let content = ContentStore.get();

const CATEGORY_LABELS = {
    meokpang:  { name: '먹팡',  icon: '🍖', color: 'rgba(230,57,70,0.15)' },
    nolpang:   { name: '놀팡',  icon: '🎢', color: 'rgba(123,47,255,0.15)' },
    swimpang:  { name: '쉼팡',  icon: '🌿', color: 'rgba(34,197,94,0.12)' },
    salpang:   { name: '살팡',  icon: '🛍️', color: 'rgba(255,94,0,0.15)' },
    meotpang:  { name: '멋팡',  icon: '✨', color: 'rgba(123,47,255,0.12)' },
};

const PLAN_STYLES = ['starter', 'standard', 'premium', 'enterprise'];

// ── Panel Navigation ─────────────────────────────────────
function showPanel(panelId, pushState = true) {
    document.querySelectorAll('.editor-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const panel = document.getElementById(`panel-${panelId}`);
    if (panel) panel.classList.add('active');
    
    const navItem = document.querySelector(`[data-panel="${panelId}"]`);
    if (navItem) {
        navItem.classList.add('active');
        // 모바일: 해당 항목이 속한 어코디언 자동 열기
        if (window.innerWidth <= 768) {
            const parentSection = navItem.closest('.accordion-section');
            if (parentSection) {
                document.querySelectorAll('.accordion-section').forEach(s => s.classList.remove('open'));
                parentSection.classList.add('open');
            }
        }
    }

    const titles = {
        dashboard:   '대시보드',
        hero:        '히어로 섹션',
        portfolio:   '포트폴리오 관리',
        testimonial: '사장님 후기',
        pricing:     '가격표 관리',
        footer:      '푸터 관리',
        members:     '회원 관리',
    };
    const topTitle = document.getElementById('topbarTitle');
    if (topTitle) topTitle.textContent = titles[panelId] || panelId;

    // 회원 패널 진입 시 자동 로드
    if (panelId === 'members') initMembersPanel();
    // 대시보드 진입 시 회원 수 업데이트
    if (panelId === 'dashboard') updateMemberStat();

    // History API 연동
    if (pushState) {
        history.pushState({ panelId: panelId }, '', '#' + panelId);
    }
}

// 브라우저 뒤로가기/앞으로가기 처리
window.addEventListener('popstate', (e) => {
    let panelId = 'dashboard';
    if (e.state && e.state.panelId) {
        panelId = e.state.panelId;
    } else if (window.location.hash) {
        panelId = window.location.hash.replace('#', '');
    }
    showPanel(panelId, false);
});


// ── Hero ─────────────────────────────────────────────────
function loadHero() {
    document.getElementById('hero-title').value    = content.hero.title || '';
    document.getElementById('hero-subtitle').value = content.hero.subtitle || '';
    document.getElementById('hero-cta').value      = content.hero.ctaText || '';
    document.getElementById('hero-cta-sub').value  = content.hero.ctaSubText || '';
    
    // 미디어 렌더링
    if (content.hero.media && content.hero.media.url) {
        renderHeroMediaPreview(content.hero.media);
    } else {
        clearHeroMediaPreview();
    }
}

function saveHero() {
    content.hero.title      = document.getElementById('hero-title').value;
    content.hero.subtitle   = document.getElementById('hero-subtitle').value;
    content.hero.ctaText    = document.getElementById('hero-cta').value;
    content.hero.ctaSubText = document.getElementById('hero-cta-sub').value;
    // media는 업로드 즉시 content.hero.media에 반영되므로 따로 저장 불필요
}

/* ── Hero Media Upload (Drag & Drop) ── */
const heroUploadZone = document.getElementById('hero-upload-zone');
const heroMediaInput = document.getElementById('hero-media-input');
const heroPreviewWrap = document.getElementById('hero-preview-wrap');
const heroMediaPreview = document.getElementById('hero-media-preview');
const heroMediaRemove = document.getElementById('hero-media-remove');

// 클릭으로 업로드
if (heroUploadZone) {
    heroUploadZone.addEventListener('click', () => heroMediaInput.click());

    // 드래그 앤 드롭 이벤트
    heroUploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        heroUploadZone.classList.add('dragover');
    });
    heroUploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        heroUploadZone.classList.remove('dragover');
    });
    heroUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        heroUploadZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleHeroMediaFile(e.dataTransfer.files[0]);
        }
    });

    // input change 이벤트
    heroMediaInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleHeroMediaFile(e.target.files[0]);
        }
    });
}

function handleHeroMediaFile(file) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert('이미지 또는 비디오 파일만 업로드 가능합니다.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const url = e.target.result;
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        
        content.hero.media = { type, url };
        renderHeroMediaPreview(content.hero.media);
    };
    reader.readAsDataURL(file);
}

function renderHeroMediaPreview(media) {
    heroUploadZone.style.display = 'none';
    heroPreviewWrap.style.display = 'block';
    
    if (media.type === 'image') {
        heroMediaPreview.innerHTML = `<img src="${media.url}" alt="Hero Media bg"\u003e`;
    } else if (media.type === 'video') {
        heroMediaPreview.innerHTML = `<video src="${media.url}" autoplay loop muted playsinline\u003e</video\u003e`;
    }
}

function clearHeroMediaPreview() {
    heroPreviewWrap.style.display = 'none';
    heroMediaPreview.innerHTML = '';
    heroUploadZone.style.display = 'block';
    heroMediaInput.value = '';
    content.hero.media = null;
}

if (heroMediaRemove) {
    heroMediaRemove.addEventListener('click', clearHeroMediaPreview);
}

// ── Portfolio ────────────────────────────────────────────
function isVideoUrl(url) {
    if (!url) return false;
    if (url.startsWith('data:video/')) return true;
    if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return true;
    return false;
}

function renderPortfolioEditor() {
    const container = document.getElementById('portfolio-categories');
    container.innerHTML = '';

    Object.entries(CATEGORY_LABELS).forEach(([key, meta]) => {
        const items = content.portfolio[key] || [];
        const card = document.createElement('div');
        card.className = 'editor-card';
        card.innerHTML = `
            <div class="editor-card__title" style="background:${meta.color};border-radius:8px;padding:8px 12px;margin:-4px 0 16px;">
                ${meta.icon} ${meta.name} <span class="tag tag--purple" style="margin-left:auto;">${items.length}개</span>
            </div>
            <div class="image-grid" id="img-grid-${key}">
                ${items.map((url, i) => {
                    const isVid = isVideoUrl(url);
                    const mediaTag = isVid 
                        ? `<video src="${url}" autoplay loop muted playsinline style="width:100%;height:100%;object-fit:cover;"></video>`
                        : `<img src="${url}" alt="${meta.name} ${i+1}" onerror="this.src='https://picsum.photos/seed/${key}${i}/200/355'">`;
                    return `
                        <div class="image-card">
                            ${mediaTag}
                            <div class="image-card__del" onclick="removePortfolioItem('${key}', ${i})">
                                <i class="ri-close-line"></i>
                            </div>
                        </div>
                    `;
                }).join('')}
                
                <label class="image-add-btn upload-zone-mini" 
                       ondragover="handlePortfolioDragOver(event)" 
                       ondragleave="handlePortfolioDragLeave(event)" 
                       ondrop="handlePortfolioDrop(event, '${key}')">
                    <i class="ri-upload-cloud-2-line"></i>
                    <span>미디어 추가</span>
                    <input type="file" multiple accept="image/*,video/*" hidden onchange="handlePortfolioUpload(event, '${key}')">
                </label>
            </div>
        `;
        container.appendChild(card);
    });

    updateStats();
}

// Global Handlers for inline HTML execution
window.handlePortfolioDragOver = function(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
};
window.handlePortfolioDragLeave = function(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
};
window.handlePortfolioDrop = function(e, category) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processPortfolioFiles(e.dataTransfer.files, category);
    }
};
window.handlePortfolioUpload = function(e, category) {
    if (e.target.files && e.target.files.length > 0) {
        processPortfolioFiles(e.target.files, category);
    }
    e.target.value = ''; // Reset input
};

function processPortfolioFiles(files, category) {
    if (!content.portfolio[category]) content.portfolio[category] = [];
    
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            content.portfolio[category].push(e.target.result);
            renderPortfolioEditor();
        };
        reader.readAsDataURL(file);
    });
}


function removePortfolioItem(category, index) {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
        content.portfolio[category].splice(index, 1);
        renderPortfolioEditor();
    }
}

// ── Testimonial ──────────────────────────────────────────
function renderTestimonialEditor() {
    const container = document.getElementById('testimonial-editor');
    container.innerHTML = content.testimonials.map((t, i) => `
        <div class="testimonial-item">
            <div style="font-size:13px;font-weight:600;color:var(--text-secondary);
                        margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border);">
                후기 ${i + 1}
            </div>
            <div class="editor-row">
                <label>사진 URL (1:1 비율 권장)</label>
                <input type="url" class="form-control" id="testi-photo-${i}" value="${t.photo}">
            </div>
            <div style="margin-bottom:16px;">
                <img src="${t.photo}" style="width:224px;height:224px;border-radius:10px;object-fit:cover;border:1px solid var(--border);"
                     id="testi-preview-${i}" onerror="this.style.display='none'">
            </div>
            <div class="editor-row">
                <label>별점 (1~5)</label>
                <input type="number" class="form-control" id="testi-stars-${i}" value="${t.stars || 5}" min="1" max="5">
            </div>
            <div class="editor-row">
                <label>후기 내용</label>
                <textarea class="form-control" id="testi-text-${i}" rows="4">${t.text}</textarea>
            </div>
            <div class="editor-row">
                <label>작성자 이름</label>
                <input type="text" class="form-control" id="testi-author-${i}" value="${t.author}">
            </div>
            <div class="editor-row">
                <label>배지 (먹팡/놀팡/쉼팡/살팡/멋팡)</label>
                <input type="text" class="form-control" id="testi-badge-${i}" value="${t.badge}">
            </div>
        </div>
    `).join('');

    // Live photo preview
    content.testimonials.forEach((_, i) => {
        const photoInput = document.getElementById(`testi-photo-${i}`);
        photoInput.addEventListener('input', () => {
            const preview = document.getElementById(`testi-preview-${i}`);
            preview.src = photoInput.value;
            preview.style.display = 'block';
        });
    });
}

function saveTestimonials() {
    content.testimonials = content.testimonials.map((t, i) => ({
        ...t,
        stars:  parseInt(document.getElementById(`testi-stars-${i}`)?.value) || t.stars || 5,
        text:   document.getElementById(`testi-text-${i}`)?.value   || t.text,
        author: document.getElementById(`testi-author-${i}`)?.value || t.author,
        badge:  document.getElementById(`testi-badge-${i}`)?.value  || t.badge,
        photo:  document.getElementById(`testi-photo-${i}`)?.value  || t.photo,
    }));
}

// ── Pricing ──────────────────────────────────────────────
function renderPricingEditor() {
    const container = document.getElementById('pricing-editor');
    container.innerHTML = content.pricing.map((plan, i) => `
        <div class="plan-editor">
            <div class="plan-editor__header">
                <span style="font-size:15px;font-weight:700;">${plan.name}</span>
                <span class="plan-badge plan-badge--${PLAN_STYLES[i]}">${plan.tier}</span>
            </div>
            <div class="editor-row">
                <label>플랜 이름</label>
                <input type="text" class="form-control" id="plan-name-${i}" value="${plan.name}">
            </div>
            <div class="editor-row">
                <label>가격 (숫자만, 예: 190,000)</label>
                <input type="text" class="form-control" id="plan-price-${i}" value="${plan.price}">
            </div>
            <div class="editor-row">
                <label>기간 텍스트 (예: 1회 기준)</label>
                <input type="text" class="form-control" id="plan-period-${i}" value="${plan.period}">
            </div>
            <div class="editor-row">
                <label>기능 목록 (한 줄에 하나씩)</label>
                <textarea class="feature-list-input" id="plan-features-${i}">${plan.features.join('\n')}</textarea>
            </div>
            <div class="editor-row">
                <label>버튼 텍스트</label>
                <input type="text" class="form-control" id="plan-btn-${i}" value="${plan.btnText}">
            </div>
        </div>
    `).join('');
}

function savePricing() {
    content.pricing = content.pricing.map((plan, i) => ({
        ...plan,
        name:     document.getElementById(`plan-name-${i}`)?.value     || plan.name,
        price:    document.getElementById(`plan-price-${i}`)?.value    || plan.price,
        period:   document.getElementById(`plan-period-${i}`)?.value   || plan.period,
        features: (document.getElementById(`plan-features-${i}`)?.value || plan.features.join('\n'))
                    .split('\n').map(s => s.trim()).filter(Boolean),
        btnText:  document.getElementById(`plan-btn-${i}`)?.value      || plan.btnText,
    }));
}

// ── Footer ──────────────────────────────────────────────
function loadFooter() {
    if(!content.footer) content.footer = ContentStore.get().footer;
    
    document.getElementById('footer-brand').value = content.footer.brandName || '';
    document.getElementById('footer-slogan').value = content.footer.slogan || '';
    
    document.getElementById('footer-sns-insta').value = content.footer.sns?.instagram || '';
    document.getElementById('footer-sns-youtube').value = content.footer.sns?.youtube || '';
    document.getElementById('footer-sns-tiktok').value = content.footer.sns?.tiktok || '';
    
    const companyText = (content.footer.companyLinks || []).map(link => `${link.label}, ${link.url}`).join('\n');
    document.getElementById('footer-company-links').value = companyText;
    
    document.getElementById('footer-contact-kakao').value = content.footer.contact?.kakao || '';
    document.getElementById('footer-contact-email').value = content.footer.contact?.email || '';
    document.getElementById('footer-contact-time').value = content.footer.contact?.time || '';
}

function saveFooter() {
    if(!content.footer) content.footer = { sns: {}, contact: {}, companyLinks: [] };
    
    content.footer.brandName = document.getElementById('footer-brand').value;
    content.footer.slogan = document.getElementById('footer-slogan').value;
    
    content.footer.sns.instagram = document.getElementById('footer-sns-insta').value;
    content.footer.sns.youtube = document.getElementById('footer-sns-youtube').value;
    content.footer.sns.tiktok = document.getElementById('footer-sns-tiktok').value;
    
    content.footer.companyLinks = document.getElementById('footer-company-links').value.split('\n')
        .map(line => {
            const parts = line.split(',');
            if (parts.length >= 2) {
                return { label: parts[0].trim(), url: parts.slice(1).join(',').trim() };
            }
            return null;
        }).filter(Boolean);
        
    content.footer.contact.kakao = document.getElementById('footer-contact-kakao').value;
    content.footer.contact.email = document.getElementById('footer-contact-email').value;
    content.footer.contact.time = document.getElementById('footer-contact-time').value;
}

// ── Stats ────────────────────────────────────────────────
function updateStats() {
    const total = Object.values(content.portfolio).reduce((sum, arr) => sum + arr.length, 0);
    const statEl = document.getElementById('stat-portfolio');
    if (statEl) statEl.textContent = total;

    const tsEl = document.getElementById('stat-testimonials');
    if (tsEl) tsEl.textContent = content.testimonials.length;
}

// ── Save All ─────────────────────────────────────────────
function saveAll() {
    // Hero
    saveHero();
    // Testimonials
    saveTestimonials();
    // Pricing
    savePricing();
    // Footer
    saveFooter();
    // Portfolio already live-updated

    ContentStore.save(content);
    showToast('모든 변경사항이 저장되었습니다!');

    const btn = document.getElementById('saveBtn');
    btn.classList.add('saved');
    btn.innerHTML = '<i class="ri-checkbox-circle-line"></i> 저장됨';
    setTimeout(() => {
        btn.classList.remove('saved');
        btn.innerHTML = '<i class="ri-save-line"></i> 저장';
    }, 2000);
}

// ── Toast ────────────────────────────────────────────────
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Nav Item Click ────────────────────────────────────────
document.querySelectorAll('.nav-item[data-panel]').forEach(item => {
    item.addEventListener('click', () => showPanel(item.dataset.panel));
});

// ── Save Button ───────────────────────────────────────────
document.getElementById('saveBtn').addEventListener('click', saveAll);

// ── Logout ───────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('pang_admin_auth');
    window.location.href = 'index.html';
});

// ── Init ──────────────────────────────────────────────────
loadHero();
renderPortfolioEditor();
renderTestimonialEditor();
renderPricingEditor();
loadFooter();
updateStats();

// 초기 진입 시 해시 확인해서 패널 열어주기
const initialPanel = window.location.hash ? window.location.hash.replace('#', '') : 'dashboard';
history.replaceState({ panelId: initialPanel }, '', '#' + initialPanel);
showPanel(initialPanel, false);

// ── Mobile Sidebar ────────────────────────────────────────
const sidebar        = document.getElementById('sidebar');
const hamburgerBtn   = document.getElementById('hamburgerBtn');
const sidebarClose   = document.getElementById('sidebarClose');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

hamburgerBtn.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// 모바일에서 메뉴 선택 후 사이드바 자동 닫기
document.querySelectorAll('.nav-item[data-panel]').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768) closeSidebar();
    });
});

// ── Accordion ─────────────────────────────────────────────
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
        // 모바일에서만 어코디언 동작
        if (window.innerWidth > 768) return;

        const targetId = trigger.dataset.target;
        const section  = trigger.closest('.accordion-section');
        const isOpen   = section.classList.contains('open');

        // 모든 섹션 닫기
        document.querySelectorAll('.accordion-section').forEach(s => s.classList.remove('open'));

        // 클릭된 섹션이 닫혀 있었으면 열기
        if (!isOpen) section.classList.add('open');
    });
});

// 페이지 로드 시: 활성 패널이 속한 어코디언 자동 열기 (모바일)
function openActiveAccordion() {
    if (window.innerWidth > 768) return;
    const activeItem = document.querySelector('.nav-item.active[data-panel]');
    if (!activeItem) return;
    const parentSection = activeItem.closest('.accordion-section');
    if (parentSection) parentSection.classList.add('open');
}

openActiveAccordion();

// 리사이즈 시 사이드바 리셋
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        closeSidebar();
    }
});


/* ════════════════════════════════════════════════════════
   회원 관리 맴 — localStorage 연동
   ════════════════════════════════════════════════════════ */

const PANG_USERS_KEY   = 'pang_users';
const PANG_SESSION_KEY = 'pang_session';

function getMembers() {
    try { return JSON.parse(localStorage.getItem(PANG_USERS_KEY)) || []; }
    catch { return []; }
}

function saveMembers(users) {
    localStorage.setItem(PANG_USERS_KEY, JSON.stringify(users));
}

function getCurrentSession() {
    try { return JSON.parse(localStorage.getItem(PANG_SESSION_KEY)); }
    catch { return null; }
}

// 대시보드 통계 카드 업데이트
function updateMemberStat() {
    const el = document.getElementById('stat-members');
    if (el) el.textContent = getMembers().length;
}

// 회원 패널 하시범 초기화
function initMembersPanel() {
    const members = getMembers();
    const totalEl = document.getElementById('memberTotalCount');
    if (totalEl) totalEl.textContent = members.length;
    // 대시보드 통계도 동시 업데이트
    const statEl = document.getElementById('stat-members');
    if (statEl) statEl.textContent = members.length;

    renderMembers(members);
}

// 테이블 렌더링
function renderMembers(members) {
    const tbody  = document.getElementById('membersTableBody');
    const empty  = document.getElementById('membersEmpty');
    const session = getCurrentSession();

    if (!members.length) {
        tbody.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = members.map((m, i) => {
        const isOnline = session && session.email === m.email;
        const badge = isOnline
            ? '<span class="member-badge member-badge--online"\u003e로그인 중</span\u003e'
            : '<span class="member-badge member-badge--normal"\u003e일반</span\u003e';

        return `
        <tr class="member-row" data-email="${m.email}"\u003e
            <td class="member-num"\u003e${i + 1}</td\u003e
            <td\u003e
                <div class="member-name-cell"\u003e
                    <div class="member-avatar"\u003e${m.name.charAt(0)}</div\u003e
                    <span\u003e${m.name}</span\u003e
                </div\u003e
            </td\u003e
            <td class="member-email"\u003e${m.email}</td\u003e
            <td\u003e${badge}</td\u003e
            <td\u003e
                <button class="btn-member-delete" onclick="openMemberDeleteModal('${m.email}', '${m.name}')" title="삭제"\u003e
                    <i class="ri-delete-bin-6-line"\u003e</i\u003e
                </button\u003e
            </td\u003e
        </tr\u003e`;
    }).join('');
}

// 검색 필터
function filterMembers() {
    const q = document.getElementById('memberSearchInput').value.trim().toLowerCase();
    const all = getMembers();
    const filtered = q
        ? all.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
        : all;

    document.getElementById('memberTotalCount').textContent = all.length;
    renderMembers(filtered);
}

// 삭제 모달
let _deleteTargetEmail = null;

function openMemberDeleteModal(email, name) {
    _deleteTargetEmail = email;
    document.getElementById('memberDeleteMsg').textContent = `「${name}」 (${email}) 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`;
    document.getElementById('memberDeleteModal').style.display = 'flex';
    document.getElementById('memberDeleteConfirm').onclick = confirmDeleteMember;
}

function closeMemberDeleteModal() {
    document.getElementById('memberDeleteModal').style.display = 'none';
    _deleteTargetEmail = null;
}

function confirmDeleteMember() {
    if (!_deleteTargetEmail) return;

    let users = getMembers().filter(u => u.email !== _deleteTargetEmail);
    saveMembers(users);

    // 삭제된 회원이 현재 로그인 중이면 세션도 제거
    const session = getCurrentSession();
    if (session && session.email === _deleteTargetEmail) {
        localStorage.removeItem(PANG_SESSION_KEY);
    }

    closeMemberDeleteModal();
    showToast('회원이 삭제되었습니다.');
    initMembersPanel();
}

// 대시보드 로드 시 회원 수 반영
updateMemberStat();
