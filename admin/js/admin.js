/* ══════════════════════════════════════════════════════════
   THE PANG Admin — Controller (admin.js)
   Supabase 연동 버전
   ══════════════════════════════════════════════════════════ */

// ── Auth Guard ──────────────────────────────────────────
// Supabase 세션 확인 (비동기)
(async () => {
    try {
        const isAdmin = await AdminAuth.isAdmin();
        if (!isAdmin) {
            window.location.href = '/admin/index.html';
            return;
        }
        // 인증 성공 후 초기화
        await initApp();
    } catch (e) {
        console.error('Auth check failed:', e);
        window.location.href = '/admin/index.html';
    }
})();

// ── State ───────────────────────────────────────────────
let content = null;
let portfolioData = []; // Supabase에서 로드한 포트폴리오 (id 포함)

const CATEGORY_LABELS = {
    meokpang:  { name: '먹팡',  icon: '🍖', color: 'rgba(230,57,70,0.15)' },
    nolpang:   { name: '놀팡',  icon: '🎢', color: 'rgba(123,47,255,0.15)' },
    swimpang:  { name: '쉼팡',  icon: '🌿', color: 'rgba(34,197,94,0.12)' },
    salpang:   { name: '살팡',  icon: '🛍️', color: 'rgba(255,94,0,0.15)' },
    meotpang:  { name: '멋팡',  icon: '✨', color: 'rgba(123,47,255,0.12)' },
};

const PLAN_STYLES = ['starter', 'standard', 'premium', 'enterprise'];

// ── 앱 초기화 (비동기) ───────────────────────────────────
async function initApp() {
    // 로딩 표시
    showToast('데이터 로딩 중...');

    try {
        content = await ContentStore.get();
    } catch (e) {
        console.error('콘텐츠 로드 실패:', e);
        content = ContentStore.reset();
    }

    loadHero();
    renderPortfolioEditor();
    renderTestimonialEditor();
    renderPricingEditor();
    renderAddonsEditor();
    loadFooter();
    updateStats();

    // 초기 진입 시 해시 확인해서 패널 열어주기
    const initialPanel = window.location.hash ? window.location.hash.replace('#', '') : 'dashboard';
    history.replaceState({ panelId: initialPanel }, '', '#' + initialPanel);
    showPanel(initialPanel, false);

    showToast('데이터를 불러왔습니다.');
}

// ── Panel Navigation ─────────────────────────────────────
function showPanel(panelId, pushState = true) {
    document.querySelectorAll('.editor-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const panel = document.getElementById(`panel-${panelId}`);
    if (panel) panel.classList.add('active');
    
    const navItem = document.querySelector(`[data-panel="${panelId}"]`);
    if (navItem) {
        navItem.classList.add('active');
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
        orders:      '주문/견적 관리',
        members:     '회원 관리',
        withdrawn:   '탈퇴회원 관리',
        settings:    '계정 설정',
    };
    const topTitle = document.getElementById('topbarTitle');
    if (topTitle) topTitle.textContent = titles[panelId] || panelId;

    if (panelId === 'members') initMembersPanel();
    if (panelId === 'orders') loadOrders();
    if (panelId === 'withdrawn') initWithdrawnPanel();
    if (panelId === 'dashboard') { updateMemberStat(); updateOrderStat(); updateWithdrawnStat(); }
    if (panelId === 'settings') loadAccountSettings();

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
}

/* ── Hero Media Upload (Drag & Drop + Supabase Storage) ── */
const heroUploadZone = document.getElementById('hero-upload-zone');
const heroMediaInput = document.getElementById('hero-media-input');
const heroPreviewWrap = document.getElementById('hero-preview-wrap');
const heroMediaPreview = document.getElementById('hero-media-preview');
const heroMediaRemove = document.getElementById('hero-media-remove');

if (heroUploadZone) {
    heroUploadZone.addEventListener('click', () => heroMediaInput.click());

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

    heroMediaInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleHeroMediaFile(e.target.files[0]);
        }
    });
}

async function handleHeroMediaFile(file) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert('이미지 또는 비디오 파일만 업로드 가능합니다.');
        return;
    }

    showToast('히어로 미디어 업로드 중...');

    try {
        let result;
        const isVideo = file.type.startsWith('video/');

        if (isVideo && AdminStorage.uploadFileWithProgress) {
            // 영상: 진행률 표시 업로드 (Supabase Storage XHR)
            result = await AdminStorage.uploadFileWithProgress(file, 'hero', (percent) => {
                showToast(`히어로 영상 업로드 중... ${percent}%`);
            });
        } else {
            // 이미지: 일반 업로드 (Supabase Storage)
            result = await AdminStorage.uploadFile(file, 'hero');
        }

        const type = isVideo ? 'video' : 'image';

        content.hero.media = { type, url: result.url, path: result.path };
        renderHeroMediaPreview(content.hero.media);
        showToast('✅ 히어로 미디어가 업로드되었습니다.');
    } catch (err) {
        console.error('히어로 미디어 업로드 실패:', err);
        showToast('❌ 업로드 실패: ' + err.message);
    }
}

function renderHeroMediaPreview(media) {
    heroUploadZone.style.display = 'none';
    heroPreviewWrap.style.display = 'block';
    
    if (media.type === 'image') {
        heroMediaPreview.innerHTML = `<img src="${media.url}" alt="Hero Media bg">`;
    } else if (media.type === 'video') {
        const vidUrl = media.url.includes('#') ? media.url : media.url + '#t=0.001';
        heroMediaPreview.innerHTML = `<video src="${vidUrl}" loop muted playsinline onmouseenter="this.play()" onmouseleave="this.pause()" style="width:100%;height:100%;object-fit:cover;"></video>`;
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
    heroMediaRemove.addEventListener('click', async () => {
        // Storage에서도 삭제
        if (content.hero.media?.path) {
            try {
                await AdminStorage.deleteFile(content.hero.media.path);
            } catch (e) {
                console.warn('히어로 미디어 Storage 삭제 실패:', e);
            }
        }
        clearHeroMediaPreview();
    });
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
                ${items.map((item, i) => {
                    const url = typeof item === 'string' ? item : item.url;
                    const itemId = typeof item === 'object' ? item.id : null;
                    const isVid = isVideoUrl(url) || (typeof item === 'object' && item.type === 'video');
                    // 관리자 미리보기: 업로드 직후 blob URL 우선 사용 (CDN 캐시 대기 없이 즉시 표시)
                    const displayUrl = (typeof item === 'object' && item.previewUrl) ? item.previewUrl : url;
                    const vidUrl = isVid && !displayUrl.includes('#') && !displayUrl.startsWith('blob:') ? displayUrl + '#t=0.001' : displayUrl;
                    const mediaTag = isVid 
                        ? `<video src="${vidUrl}" loop muted playsinline style="width:100%;height:100%;object-fit:cover; transition: transform 0.3s;" onmouseenter="this.play()" onmouseleave="this.pause()"></video>`
                        : `<img src="${displayUrl}" alt="${meta.name} ${i+1}" onerror="this.src='https://picsum.photos/seed/${key}${i}/200/355'">`;

                    return `
                        <div class="image-card">
                            ${mediaTag}
                            <div class="image-card__del" onclick="removePortfolioItem('${key}', ${i}, ${itemId})">
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
    e.target.value = '';
};

async function processPortfolioFiles(files, category) {
    if (!content.portfolio[category]) content.portfolio[category] = [];

    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (fileArray.length === 0) return;

    let uploadedCount = 0;
    const totalFiles = fileArray.length;

    showToast(`파일 업로드 시작... (0/${totalFiles})`);

    for (const file of fileArray) {
        try {
            let result;
            const isVideo = file.type.startsWith('video/');

            if (isVideo && AdminStorage.uploadFileWithProgress) {
                // 영상: 진행률 표시 업로드 (Supabase Storage XHR)
                result = await AdminStorage.uploadFileWithProgress(file, `portfolio/${category}`, (percent) => {
                    showToast(`영상 업로드 중... ${percent}% (${uploadedCount + 1}/${totalFiles})`);
                });
            } else {
                // 이미지: 일반 업로드 (Supabase Storage)
                result = await AdminStorage.uploadFile(file, `portfolio/${category}`);
            }

            // 관리자 미리보기용 Blob URL 생성 (CDN 캐시 대기 없이 즉시 표시)
            const previewUrl = URL.createObjectURL(file);

            // DB에 항목 추가 (Bunny CDN URL 저장)
            const dbItem = await AdminContent.addPortfolioItem(category, result.url, result.type);

            content.portfolio[category].push({
                id: dbItem.id,
                url: result.url,        // Bunny CDN URL (DB 저장용, 메인 사이트용)
                previewUrl: previewUrl, // Blob URL (관리자 미리보기 전용, 새로고침 시 소멸)
                type: result.type,
                order_index: dbItem.order_index
            });

            uploadedCount++;
            showToast(`파일 업로드 중... (${uploadedCount}/${totalFiles})`);

        } catch (err) {
            console.error('포트폴리오 업로드 오류:', err);
            showToast(`❌ 업로드 실패 (${file.name}): ${err.message}`);
        }
    }

    if (uploadedCount > 0) {
        renderPortfolioEditor();
        showToast(`✅ ${uploadedCount}/${totalFiles}개 파일이 업로드되었습니다.`);
    }
}

async function removePortfolioItem(category, index, itemId) {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
        try {
            // Supabase DB에서 삭제
            if (itemId) {
                await AdminContent.removePortfolioItem(itemId);
            }
            
            content.portfolio[category].splice(index, 1);
            renderPortfolioEditor();
            showToast('항목이 삭제되었습니다.');
        } catch (err) {
            console.error('삭제 실패:', err);
            showToast('❌ 삭제 실패: ' + err.message);
        }
    }
}

// ── Testimonial ──────────────────────────────────────────
function renderTestimonialEditor() {
    const container = document.getElementById('testimonial-editor');
    container.innerHTML = content.testimonials.map((t, i) => {
        const photoVal = t.photo || t.photo_url || '';
        const imgSrc = photoVal ? (photoVal.startsWith('http') || photoVal.startsWith('data:') || photoVal.startsWith('/') ? photoVal : '/' + photoVal) : '';
        return `
        <div class="testimonial-item editor-card" style="position:relative; margin-bottom: 20px;">
            <div style="font-size:14px;font-weight:700;color:var(--text-primary);
                        margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border);
                        display:flex; justify-content:space-between; align-items:center;">
                <span>💬 후기 ${i + 1}</span>
                <button class="btn-remove-media" style="position:static; padding: 4px 8px; border-radius: 4px; background: rgba(239,68,68,0.1); color: #ef4444;" onclick="removeTestimonialEditor(${i})" title="삭제">
                    <i class="ri-delete-bin-line"></i> 삭제
                </button>
            </div>
            
            <div class="editor-row">
                <label>고객 사진 (정방형 권장)</label>
                <div style="display:flex; gap:16px; align-items:flex-start;">
                     <div style="flex-shrink:0; position:relative;" 
                          id="testi-dropzone-${i}"
                          ondragover="handleTestimonialDragOver(event)" 
                          ondragleave="handleTestimonialDragLeave(event)" 
                          ondrop="handleTestimonialDrop(event, ${i})">
                         <img src="${imgSrc}" style="width:100px;height:100px;border-radius:8px;object-fit:cover;border:1px solid var(--border); background: var(--bg-secondary); display: ${photoVal ? 'block' : 'none'}; pointer-events:none;" id="testi-preview-${i}">
                         ${!photoVal ? `<div style="width:100px;height:100px;border-radius:8px;border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-secondary);font-size:24px; pointer-events:none;" id="testi-empty-${i}"><i class="ri-image-add-line"></i></div>` : ''}
                     </div>
                     <div style="flex-grow:1;">
                         <input type="url" class="form-control" id="testi-photo-${i}" value="${photoVal}" placeholder="이미지 URL 직접 입력 또는 파일 업로드" style="margin-bottom: 8px;">
                         <label class="btn-preview" id="testi-upload-btn-${i}" style="display:inline-flex; align-items:center; gap:4px; padding:8px 12px; border-radius:6px; cursor:pointer; background:var(--bg-secondary); border:1px solid var(--border); color:var(--text-primary); font-size:13px; font-weight:500; width:auto; white-space:nowrap;">
                             <i class="ri-upload-cloud-2-line"></i> 직접 사진 업로드
                             <input type="file" accept="image/*" hidden onchange="handleTestimonialUpload(event, ${i})">
                         </label>
                     </div>
                </div>
            </div>
            
            <div class="editor-row">
                <label>별점 (1~5)</label>
                <input type="number" class="form-control" id="testi-stars-${i}" value="${t.stars || 5}" min="1" max="5">
            </div>
            <div class="editor-row">
                <label>후기 내용</label>
                <textarea class="form-control" id="testi-text-${i}" rows="3">${t.text}</textarea>
            </div>
            <div style="display:flex; gap:16px;">
                <div class="editor-row" style="flex:1;">
                    <label>작성자 이름</label>
                    <input type="text" class="form-control" id="testi-author-${i}" value="${t.author}">
                </div>
                <div class="editor-row" style="flex:1;">
                    <label>배지 이름 (예: 먹팡)</label>
                    <input type="text" class="form-control" id="testi-badge-${i}" value="${t.badge || ''}">
                </div>
            </div>
        </div>
    `}).join('') + `
        <button class="btn-save" style="width:100%; background: transparent; color: var(--text-primary); border: 2px dashed var(--border); box-shadow: none;" onclick="addTestimonialEditor()">
            <i class="ri-add-line"></i> 새 후기 추가
        </button>
    `;

    // Live photo preview
    content.testimonials.forEach((_, i) => {
        const photoInput = document.getElementById(`testi-photo-${i}`);
        if (photoInput) {
            photoInput.addEventListener('input', () => {
                const preview = document.getElementById(`testi-preview-${i}`);
                const emptySlot = document.getElementById(`testi-empty-${i}`);
                if (photoInput.value) {
                    const val = photoInput.value;
                    preview.src = val.startsWith('http') || val.startsWith('data:') || val.startsWith('/') ? val : '/' + val;
                    preview.style.display = 'block';
                    if (emptySlot) emptySlot.style.display = 'none';
                } else {
                    preview.style.display = 'none';
                    if (emptySlot) emptySlot.style.display = 'flex';
                }
            });
        }
    });

    updateStats();
}

function saveTestimonials() {
    content.testimonials = content.testimonials.map((t, i) => {
        const starsEl = document.getElementById(`testi-stars-${i}`);
        if (!starsEl) return t; // Skip if DOM is missing during transition
        return {
            ...t,
            stars:  parseInt(starsEl.value) || t.stars || 5,
            text:   document.getElementById(`testi-text-${i}`)?.value   || t.text,
            author: document.getElementById(`testi-author-${i}`)?.value || t.author,
            badge:  document.getElementById(`testi-badge-${i}`)?.value  || t.badge,
            photo:  document.getElementById(`testi-photo-${i}`)?.value  || t.photo,
        };
    });
}

// Global hooks for dynamic testimonial actions
window.addTestimonialEditor = function() {
    saveTestimonials();
    content.testimonials.push({
        stars: 5,
        text: '',
        author: '',
        badge: '먹팡',
        photo: ''
    });
    renderTestimonialEditor();
};

window.removeTestimonialEditor = function(index) {
    if (confirm('이 후기를 삭제하시겠습니까?')) {
        saveTestimonials();
        content.testimonials.splice(index, 1);
        renderTestimonialEditor();
    }
};

window.handleTestimonialDragOver = function(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = 'var(--purple)';
    e.currentTarget.style.backgroundColor = 'rgba(123,47,255,0.05)';
};

window.handleTestimonialDragLeave = function(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = 'var(--border)';
    e.currentTarget.style.backgroundColor = 'transparent';
};

window.handleTestimonialDrop = function(e, index) {
    e.preventDefault();
    e.currentTarget.style.borderColor = 'var(--border)';
    e.currentTarget.style.backgroundColor = 'transparent';
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processTestimonialFile(e.dataTransfer.files[0], index);
    }
};

window.handleTestimonialUpload = function(event, index) {
    const file = event.target.files[0];
    if (file) {
        processTestimonialFile(file, index);
    }
    event.target.value = '';
};

async function processTestimonialFile(file, index) {
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
    }

    showToast('사진 설정 업로드 중...');
    const btnParams = document.getElementById(`testi-upload-btn-${index}`);
    const oldText = btnParams ? btnParams.innerHTML : '';
    if (btnParams) {
        btnParams.innerHTML = '<i class="ri-loader-4-line" style="animation:spin .6s linear infinite;display:inline-block;"></i> 업로드 중...';
        btnParams.style.pointerEvents = 'none';
    }

    try {
        const result = await AdminStorage.uploadFile(file, 'testimonials');
        saveTestimonials(); 
        content.testimonials[index].photo = result.url;
        renderTestimonialEditor();
        // 포트폴리오와 동일하게 DB에 즉시 저장 (저장 버튼 안 눌러도 유실 방지)
        try { await ContentStore.save(content); } catch(e) { console.warn('후기 자동저장 실패:', e); }
        showToast('사진이 업로드되었습니다!');
    } catch (err) {
        console.error('후기 사진 업로드 실패:', err);
        showToast('❌ 업로드 실패: ' + err.message);
        if (btnParams) {
            btnParams.innerHTML = oldText;
            btnParams.style.pointerEvents = 'auto';
        }
    }
}

// ── Pricing ──────────────────────────────────────────────
function renderPricingEditor() {
    const container = document.getElementById('pricing-editor');
    container.innerHTML = content.pricing.map((plan, i) => {
        let basePrice = plan.price;
        let discountReason = '';
        let discountedPrice = '';

        if (plan.price && plan.price.includes('|')) {
            const parts = plan.price.split('|');
            basePrice = parts[0] || '';
            discountReason = parts[1] || '';
            discountedPrice = parts[2] || '';
        }

        return `
        <div class="plan-editor">
            <div class="plan-editor__header">
                <span style="font-size:15px;font-weight:700;">${plan.name}</span>
                <span class="plan-badge plan-badge--${PLAN_STYLES[i]}">${plan.tier === 'BRAND SUBSCRIPTION' ? 'HIGH-END' : plan.tier}</span>
            </div>
            <div class="editor-row">
                <label>플랜 이름</label>
                <input type="text" class="form-control" id="plan-name-${i}" value="${plan.name}">
            </div>
            <div class="editor-row" style="background: rgba(229,60,17,0.05); padding: 12px; border-radius: 8px; border: 1px dashed rgba(229,60,17,0.3);">
                <label style="color: #e53c11; font-weight: 600;">할인 이유 (예: 오픈 특가)</label>
                <input type="text" class="form-control" id="plan-discount-reason-${i}" value="${discountReason}" placeholder="입력 시 할인가가 표시됩니다">

                <label style="margin-top: 12px;">기본 가격 (숫자만, 예: 190,000)</label>
                <input type="text" class="form-control" id="plan-price-${i}" value="${basePrice}">
                
                <label style="color: #e53c11; font-weight: 600; margin-top: 12px;">할인 된 가격 (예: 150,000)</label>
                <input type="text" class="form-control" id="plan-discount-price-${i}" value="${discountedPrice}" placeholder="할인된 최종 가격">
            </div>
            <div class="editor-row" style="margin-top: 16px;">
                <label>기간 텍스트 (예: 1회 기준)</label>
                <input type="text" class="form-control" id="plan-period-${i}" value="${plan.period}">
            </div>
            <div class="editor-row">
                <label>기능 목록 (한 줄에 하나씩)</label>
                <textarea class="feature-list-input" id="plan-features-${i}">${Array.isArray(plan.features) ? plan.features.join('\n') : ''}</textarea>
            </div>
            <div class="editor-row">
                <label>버튼 텍스트</label>
                <input type="text" class="form-control" id="plan-btn-${i}" value="${plan.btnText || plan.btn_text || ''}">
            </div>
        </div>
    `}).join('');
}

function savePricing() {
    content.pricing = content.pricing.map((plan, i) => {
        const basePrice = document.getElementById(`plan-price-${i}`)?.value || '';
        const discountReason = document.getElementById(`plan-discount-reason-${i}`)?.value || '';
        const discountPrice = document.getElementById(`plan-discount-price-${i}`)?.value || '';
        
        let finalPrice = basePrice;
        if (discountReason.trim() !== '' || discountPrice.trim() !== '') {
            finalPrice = `${basePrice}|${discountReason}|${discountPrice}`;
        }

        return {
            ...plan,
            tier:     plan.tier === 'BRAND SUBSCRIPTION' ? 'HIGH-END' : plan.tier,
            name:     document.getElementById(`plan-name-${i}`)?.value     || plan.name,
            price:    finalPrice || plan.price,
            period:   document.getElementById(`plan-period-${i}`)?.value   ?? plan.period,
            features: (document.getElementById(`plan-features-${i}`)?.value || '')
                        .split('\n').map(s => s.trim()).filter(Boolean),
            btnText:  document.getElementById(`plan-btn-${i}`)?.value      || plan.btnText,
        };
    });
}

// ── Addons (추가 옵션) ──────────────────────────────────
function renderAddonsEditor() {
    const container = document.getElementById('addons-editor');
    if (!container) return;
    
    if (!content.addons) {
        content.addons = [];
    }

    container.innerHTML = content.addons.map((addon, i) => `
        <div class="editor-row" style="background: rgba(255,255,255,0.02); padding: 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 12px; display: flex; gap: 12px; align-items: flex-end;">
            <div style="flex: 1;">
                <label>옵션명 (Shift+Enter로 줄바꿈)</label>
                <textarea class="form-control" id="addon-name-${i}" rows="2" style="resize:vertical;">${addon.name || ''}</textarea>
            </div>
            <div style="flex: 1;">
                <label>가격 (Shift+Enter로 줄바꿈)</label>
                <textarea class="form-control" id="addon-price-${i}" rows="2" style="resize:vertical;">${addon.price || ''}</textarea>
            </div>
            <button class="btn" style="background: rgba(230,57,70,0.1); color: #e63946; padding: 12px; border-radius: 8px;" onclick="removeAddon(${i})" title="삭제">
                <i class="ri-delete-bin-line"></i>
            </button>
        </div>
    `).join('');
}

function addAddon() {
    saveAddons(); // 현재 입력된 값 보존
    content.addons.push({ name: '', price: '' });
    renderAddonsEditor();
}

function removeAddon(index) {
    if(confirm('이 추가 옵션을 삭제하시겠습니까?')) {
        saveAddons();
        content.addons.splice(index, 1);
        renderAddonsEditor();
    }
}

function saveAddons() {
    if (!content.addons) return;
    content.addons = content.addons.map((addon, i) => ({
        name: document.getElementById(`addon-name-${i}`)?.value || addon.name,
        price: document.getElementById(`addon-price-${i}`)?.value || addon.price
    }));
}

// ── Footer ──────────────────────────────────────────────
function loadFooter() {
    if(!content.footer) content.footer = { sns: {}, contact: {}, companyLinks: [], biz: {}, modals: {} };
    
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

    document.getElementById('footer-biz-companyName').value = content.footer.biz?.companyName || '';
    document.getElementById('footer-biz-ceo').value = content.footer.biz?.ceo || '';
    document.getElementById('footer-biz-num').value = content.footer.biz?.bizNum || '';

    document.getElementById('footer-modal-companyIntro').value = content.footer.modals?.companyIntro || '';
    document.getElementById('footer-modal-terms').value = content.footer.modals?.terms || '';
    document.getElementById('footer-modal-privacy').value = content.footer.modals?.privacy || '';
    document.getElementById('footer-modal-notice').value = content.footer.modals?.notice || '';
}

function saveFooter() {
    if(!content.footer) content.footer = { sns: {}, contact: {}, companyLinks: [], biz: {}, modals: {} };
    
    content.footer.brandName = document.getElementById('footer-brand').value;
    content.footer.slogan = document.getElementById('footer-slogan').value;
    
    if (!content.footer.sns) content.footer.sns = {};
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

    if (!content.footer.contact) content.footer.contact = {};
    content.footer.contact.kakao = document.getElementById('footer-contact-kakao').value;
    content.footer.contact.email = document.getElementById('footer-contact-email').value;
    content.footer.contact.time = document.getElementById('footer-contact-time').value;

    if (!content.footer.biz) content.footer.biz = {};
    content.footer.biz.companyName = document.getElementById('footer-biz-companyName').value;
    content.footer.biz.ceo = document.getElementById('footer-biz-ceo').value;
    content.footer.biz.bizNum = document.getElementById('footer-biz-num').value;

    if (!content.footer.modals) content.footer.modals = {};
    content.footer.modals.companyIntro = document.getElementById('footer-modal-companyIntro').value;
    content.footer.modals.terms = document.getElementById('footer-modal-terms').value;
    content.footer.modals.privacy = document.getElementById('footer-modal-privacy').value;
    content.footer.modals.notice = document.getElementById('footer-modal-notice').value;
}

// ── Stats ────────────────────────────────────────────────
function updateStats() {
    const total = Object.values(content.portfolio).reduce((sum, arr) => sum + arr.length, 0);
    const statEl = document.getElementById('stat-portfolio');
    if (statEl) statEl.textContent = total;

    // [FIX] Testimonial 실제 수 Supabase에서 로드
    const tsEl = document.getElementById('stat-testimonials');
    if (tsEl && window.AdminContent && AdminContent.getTestimonials) {
        AdminContent.getTestimonials().then(items => {
            if (tsEl) tsEl.textContent = items?.length ?? content.testimonials.length;
        }).catch(() => {
            tsEl.textContent = content.testimonials.length;
        });
    } else if (tsEl) {
        tsEl.textContent = content.testimonials.length;
    }
}

// ── Save All (Supabase) ──────────────────────────────────
async function saveAll() {
    saveHero();
    saveTestimonials();
    savePricing();
    saveAddons();
    saveFooter();

    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line" style="animation:spin .6s linear infinite;display:inline-block;"></i> 저장 중...';

    try {
        await ContentStore.save(content);
        showToast('✅ 모든 변경사항이 저장되었습니다!');

        btn.classList.add('saved');
        btn.innerHTML = '<i class="ri-checkbox-circle-line"></i> 저장됨';
        setTimeout(() => {
            btn.classList.remove('saved');
            btn.innerHTML = '<i class="ri-save-line"></i> 저장';
            btn.disabled = false;
        }, 2000);
    } catch (e) {
        console.error('저장 실패:', e);
        showToast('❌ 저장 실패: ' + e.message);
        btn.innerHTML = '<i class="ri-save-line"></i> 저장';
        btn.disabled = false;
    }
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

// ── Logout (Supabase) ────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await AdminAuth.logout();
    } catch (e) {
        console.warn('로그아웃 오류:', e);
    }
    window.location.href = '/admin/index.html';
});

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

// [FIX] 모바일 사이드바 닫기 (중복 등록 제거 → 모바일에서만닫기)
document.querySelectorAll('.nav-item[data-panel]').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768) closeSidebar();
    });
});

// ── Accordion ─────────────────────────────────────────────
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
        if (window.innerWidth > 768) return;
        const section  = trigger.closest('.accordion-section');
        const isOpen   = section.classList.contains('open');
        document.querySelectorAll('.accordion-section').forEach(s => s.classList.remove('open'));
        if (!isOpen) section.classList.add('open');
    });
});

function openActiveAccordion() {
    if (window.innerWidth > 768) return;
    const activeItem = document.querySelector('.nav-item.active[data-panel]');
    if (!activeItem) return;
    const parentSection = activeItem.closest('.accordion-section');
    if (parentSection) parentSection.classList.add('open');
}

openActiveAccordion();

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeSidebar();
});


/* ════════════════════════════════════════════════════════
   회원 관리 — Supabase 연동
   ════════════════════════════════════════════════════════ */

// 대시보드 통계 카드 업데이트
async function updateMemberStat() {
    try {
        const members = await AdminContent.getMembers();
        const el = document.getElementById('stat-members');
        if (el) el.textContent = members.length;
    } catch (e) {
        console.warn('회원 통계 로드 실패:', e);
    }
}

// 회원 패널 초기화
async function initMembersPanel() {
    try {
        const members = await AdminContent.getMembers();
        const totalEl = document.getElementById('memberTotalCount');
        if (totalEl) totalEl.textContent = members.length;
        const statEl = document.getElementById('stat-members');
        if (statEl) statEl.textContent = members.length;
        renderMembers(members);
    } catch (e) {
        console.error('회원 목록 로드 실패:', e);
        showToast('❌ 회원 목록 로드 실패');
    }
}

// 테이블 렌더링
function renderMembers(members) {
    const tbody  = document.getElementById('membersTableBody');
    const empty  = document.getElementById('membersEmpty');

    if (!members.length) {
        tbody.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = members.map((m, i) => {
        const statusBadge = m.status === 'active'
            ? '<span class="member-badge member-badge--online">활성</span>'
            : '<span class="member-badge member-badge--normal">비활성</span>';

        return `
        <tr class="member-row" data-id="${m.id}">
            <td class="member-num">${i + 1}</td>
            <td>
                <div class="member-name-cell">
                    <div class="member-avatar">${(m.name || '?').charAt(0)}</div>
                    <span>${m.name}</span>
                </div>
            </td>
            <td class="member-email">${m.email}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn-member-delete" style="background:rgba(123,47,255,0.1); color:#7b2fff;" onclick="openMemberDetail('${m.user_id}', '${m.name}', '${m.email}', '${m.status}', '${m.created_at}')" title="상세">
                    <i class="ri-eye-line"></i>
                </button>
                <button class="btn-member-delete" onclick="openMemberDeleteModal(${m.id}, '${m.name}', '${m.email}')" title="삭제" style="margin-left:4px;">
                    <i class="ri-delete-bin-6-line"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

// 검색 필터
async function filterMembers() {
    const q = document.getElementById('memberSearchInput').value.trim().toLowerCase();
    try {
        const all = await AdminContent.getMembers();
        const filtered = q
            ? all.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
            : all;

        document.getElementById('memberTotalCount').textContent = all.length;
        renderMembers(filtered);
    } catch (e) {
        console.error('회원 검색 실패:', e);
    }
}

// 삭제 모달
let _deleteTargetId = null;

function openMemberDeleteModal(id, name, email) {
    _deleteTargetId = id;
    document.getElementById('memberDeleteMsg').textContent = `「${name}」 (${email}) 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`;
    document.getElementById('memberDeleteModal').style.display = 'flex';
    document.getElementById('memberDeleteConfirm').onclick = confirmDeleteMember;
}

function closeMemberDeleteModal() {
    document.getElementById('memberDeleteModal').style.display = 'none';
    _deleteTargetId = null;
}

async function confirmDeleteMember() {
    if (!_deleteTargetId) return;

    try {
        await AdminContent.deleteMember(_deleteTargetId);
        closeMemberDeleteModal();
        showToast('회원이 삭제되었습니다.');
        await initMembersPanel();
    } catch (e) {
        console.error('회원 삭제 실패:', e);
        showToast('❌ 회원 삭제 실패: ' + e.message);
    }
}

/* ── 회원 상세 보기 ── */
async function openMemberDetail(userId, name, email, status, createdAt) {
    const modal = document.getElementById('memberDetailModal');
    const body = document.getElementById('memberDetailBody');

    const statusLabel = status === 'active' ? '<span style="color:#22c55e;">활성</span>' : '<span style="color:#888;">비활성</span>';
    const joinDate = createdAt ? new Date(createdAt).toLocaleString('ko-KR') : '-';

    let ordersHtml = '<div style="text-align:center; color:var(--text-muted); padding:20px; font-size:13px;">주문 이력을 불러오는 중...</div>';

    body.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
            <div><small style="color:var(--text-muted); font-size:11px;">이름</small><br><strong style="color:var(--text-primary); font-size:15px;">${name}</strong></div>
            <div><small style="color:var(--text-muted); font-size:11px;">상태</small><br>${statusLabel}</div>
            <div><small style="color:var(--text-muted); font-size:11px;">이메일</small><br><span style="color:var(--text-secondary); font-size:13px;">${email}</span></div>
            <div><small style="color:var(--text-muted); font-size:11px;">가입일</small><br><span style="color:var(--text-secondary); font-size:13px;">${joinDate}</span></div>
        </div>
        <div style="border-top:1px solid var(--border); padding-top:16px;">
            <h4 style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:12px;">📋 주문/견적 이력</h4>
            <div id="memberOrdersList">${ordersHtml}</div>
        </div>
    `;
    modal.style.display = 'flex';
    if (window.innerWidth >= 768) {
        const pcBtn = document.getElementById('adminModalClosePc');
        if (pcBtn) { pcBtn.style.display = 'flex'; pcBtn.onclick = closeMemberDetail; }
    }

    // 주문 이력 비동기 로드
    try {
        const orders = await AdminContent.getOrdersByUser(userId);
        const listEl = document.getElementById('memberOrdersList');
        if (!orders.length) {
            listEl.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px; font-size:13px;">주문 내역이 없습니다.</div>';
        } else {
            listEl.innerHTML = orders.map(o => {
                const s = ORDER_STATUS_MAP[o.status] || ORDER_STATUS_MAP['quote_pending'];
                const date = new Date(o.created_at).toLocaleDateString('ko-KR');
                return `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg-panel); border:1px solid var(--border); border-radius:8px; margin-bottom:8px; cursor:pointer;" onclick="closeMemberDetail(); openOrderDetail(${o.id})">
                    <div><strong style="font-size:13px; color:var(--text-primary);">${o.plan_name}</strong> <span style="font-size:11px; color:var(--text-muted);">${date}</span></div>
                    <span style="font-size:12px; font-weight:600; color:var(--purple-light);">${s.icon} ${s.label}</span>
                </div>`;
            }).join('');
        }
    } catch (e) {
        document.getElementById('memberOrdersList').innerHTML = '<div style="color:#e53c11; font-size:12px;">주문 이력 로드 실패</div>';
    }
}

function closeMemberDetail() {
    document.getElementById('memberDetailModal').style.display = 'none';
    const pcBtn = document.getElementById('adminModalClosePc');
    if (pcBtn) pcBtn.style.display = 'none';
}

/* ── 주문 상세에서 사업자 정보 관리자 대리 입력 저장 ── */
async function saveAdminBizInfo(orderId) {
    const company = document.getElementById('adminBizCompany')?.value?.trim() || '';
    const ceo = document.getElementById('adminBizCeo')?.value?.trim() || '';
    const bizNum = document.getElementById('adminBizNum')?.value?.trim() || '';
    const address = document.getElementById('adminBizAddr')?.value?.trim() || '';
    const phone = document.getElementById('adminBizPhone')?.value?.trim() || '';
    const email = document.getElementById('adminBizEmail')?.value?.trim() || '';

    if (!company) { showToast('업체명을 입력해주세요.'); return; }

    try {
        await AdminContent.updateContractBizInfo(orderId, {
            company_name: company,
            ceo_name: ceo,
            biz_number: bizNum,
            address: address,
            contact_phone: phone,
            contact_email: email
        });
        showToast('✅ 사업자 정보가 저장되었습니다.');
        openOrderDetail(orderId); // 새로고침
    } catch (e) {
        showToast('❌ 저장 실패: ' + e.message);
    }
}

// CSS animation for spinner
const styleEl = document.createElement('style');
styleEl.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(styleEl);

/* ════════════════════════════════════════════════════════
   계정 설정 (이메일/비밀번호 변경)
   ════════════════════════════════════════════════════════ */

// 계정 설정 초기화
async function loadAccountSettings() {
    try {
        const user = await AdminAuth.getCurrentUser();
        const currentEmailInput = document.getElementById('settings-current-email');
        if (currentEmailInput && user) {
            currentEmailInput.value = user.email || '';
        }
    } catch (e) {
        console.error('계정 정보 로드 실패:', e);
    }
}

// 이메일 변경
document.getElementById('btn-update-email')?.addEventListener('click', async () => {
    const newEmail = document.getElementById('settings-new-email').value.trim();
    if (!newEmail) return alert('새 이메일 주소를 입력해주세요.');

    const btn = document.getElementById('btn-update-email');
    try {
        btn.disabled = true;
        btn.textContent = '업데이트 중...';
        
        await AdminAuth.updateEmail(newEmail);
        showToast('이메일 변경 요청이 전송되었습니다. 확인 메일을 확인해주세요.');
        document.getElementById('settings-new-email').value = '';
        
    } catch (e) {
        console.error('이메일 변경 오류:', e);
        showToast('❌ 이메일 변경 실패: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '이메일 업데이트';
    }
});

// 비밀번호 변경
document.getElementById('btn-update-password')?.addEventListener('click', async () => {
    const newPassword = document.getElementById('settings-new-password').value;
    const confirmPassword = document.getElementById('settings-confirm-password').value;

    if (!newPassword) return alert('새 비밀번호를 입력해주세요.');
    if (newPassword.length < 6) return alert('비밀번호는 최소 6자리 이상이어야 합니다.');
    if (newPassword !== confirmPassword) return alert('비밀번호 확인이 일치하지 않습니다.');

    const btn = document.getElementById('btn-update-password');
    try {
        btn.disabled = true;
        btn.textContent = '변경 중...';
        
        await AdminAuth.updatePassword(newPassword);
        showToast('비밀번호가 성공적으로 변경되었습니다.');
        document.getElementById('settings-new-password').value = '';
        document.getElementById('settings-confirm-password').value = '';
        
    } catch (e) {
        console.error('비밀번호 변경 오류:', e);
        showToast('❌ 비밀번호 변경 실패: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '비밀번호 변경';
    }
});


/* ════════════════════════════════════════════════════════
   주문/견적 관리 — Supabase 연동
   ════════════════════════════════════════════════════════ */

const ORDER_STATUS_MAP = {
    'quote_pending':    { label: '견적 대기', badge: 'warning', icon: '⏳' },
    'quote_issued':     { label: '견적서 발행', badge: 'info', icon: '📋' },
    'paid':             { label: '결제 완료', badge: 'success', icon: '💰' },
    'contract_issued':  { label: '계약서 발행', badge: 'primary', icon: '📄' },
    'completed':        { label: '체결 완료', badge: 'complete', icon: '🎉' }
};

function formatOrderPrice(priceStr) {
    if (!priceStr) return '-';
    if (priceStr.includes('|')) {
        const parts = priceStr.split('|');
        const base = parts[0] || '';
        const reason = parts[1] || '';
        const discounted = parts[2] || '';
        if (discounted) {
            return `<span style="text-decoration:line-through; color:#999; font-size:12px;">${base}원</span> ${reason ? `<span style="color:#e53c11; font-size:11px;">${reason}</span>` : ''} <strong>${discounted}원</strong>`;
        }
        return `${base}원`;
    }
    return `${priceStr}원`;
}

// 가격 숫자 추출 (쉼표 제거 후 첫 숫자)
function extractOrderNumber(str) {
    if (!str) return 0;
    const cleaned = str.replace(/,/g, '');
    const match = cleaned.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

// 기본가 + 추가옵션 합계 계산
function calcOrderEstimatedTotal(order) {
    let baseAmount = 0;
    if (order.plan_price) {
        if (order.plan_price.includes('|')) {
            const parts = order.plan_price.split('|');
            const discounted = parts[2] || '';
            baseAmount = discounted ? extractOrderNumber(discounted) : extractOrderNumber(parts[0]);
        } else {
            baseAmount = extractOrderNumber(order.plan_price);
        }
    }
    let addonsTotal = 0;
    if (order.addons && Array.isArray(order.addons)) {
        order.addons.forEach(a => {
            addonsTotal += extractOrderNumber(a.price || '');
        });
    }
    return baseAmount + addonsTotal;
}

async function updateOrderStat() {
    try {
        const orders = await AdminContent.getOrders();
        const el = document.getElementById('stat-orders');
        if (el) el.textContent = orders.length;
    } catch (e) {
        console.warn('주문 통계 로드 실패:', e);
    }
}

async function loadOrders() {
    const filter = document.getElementById('orderStatusFilter')?.value || 'all';
    const tbody = document.getElementById('ordersTableBody');
    const emptyEl = document.getElementById('ordersEmpty');
    const totalEl = document.getElementById('orderTotalCount');

    try {
        const orders = await AdminContent.getOrders(filter === 'all' ? null : filter);
        if (totalEl) totalEl.textContent = orders.length;
        const statEl = document.getElementById('stat-orders');
        if (statEl) statEl.textContent = orders.length;

        if (!orders.length) {
            tbody.innerHTML = '';
            emptyEl.style.display = 'flex';
            return;
        }
        emptyEl.style.display = 'none';

        tbody.innerHTML = orders.map((o, i) => {
            const s = ORDER_STATUS_MAP[o.status] || ORDER_STATUS_MAP['quote_pending'];
            const customerName = o._member?.name || o.members?.name || o.user_id?.substring(0, 8) || '-';
            const date = new Date(o.created_at).toLocaleDateString('ko-KR');

            return `
            <tr class="member-row">
                <td class="member-num">${i + 1}</td>
                <td>${customerName}</td>
                <td>${o.plan_name}</td>
                <td><span class="member-badge member-badge--${s.badge === 'warning' ? 'normal' : 'online'}">${s.icon} ${s.label}</span></td>
                <td class="member-email">${date}</td>
                <td>
                    <button class="btn-member-delete" style="background:rgba(123,47,255,0.1); color:#7b2fff;" onclick="openOrderDetail(${o.id})" title="상세">
                        <i class="ri-eye-line"></i>
                    </button>
                    <button class="btn-member-delete" onclick="actionDeleteOrder(${o.id})" title="삭제" style="margin-left:4px;">
                        <i class="ri-delete-bin-6-line"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    } catch (e) {
        console.error('주문 목록 로드 실패:', e);
        showToast('❌ 주문 목록 로드 실패');
    }
}

async function openOrderDetail(orderId) {
    const modal = document.getElementById('orderDetailModal');
    const body = document.getElementById('orderDetailBody');
    const actions = document.getElementById('orderDetailActions');

    try {
        const order = await AdminContent.getOrder(orderId);
        const s = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP['quote_pending'];

        let addonsHtml = '';
        if (order.addons && Array.isArray(order.addons) && order.addons.length > 0) {
            addonsHtml = `
                <div style="margin-top:16px;">
                    <strong style="font-size:13px; color:var(--text-secondary);">추가 옵션</strong>
                    <div style="margin-top:8px; display:flex; flex-direction:column; gap:6px;">
                        ${order.addons.map(a => `<div style="background:rgba(123,47,255,0.05); border:1px solid rgba(123,47,255,0.15); color:var(--text-primary); padding:8px 12px; border-radius:6px; font-size:13px; display:flex; justify-content:space-between; align-items:center;"><span>${a.name}</span><span style="color:var(--purple-light); font-weight:600;">${a.price || ''}</span></div>`).join('')}
                    </div>
                </div>
            `;
        }

        // 합계액 계산
        const estimatedTotal = calcOrderEstimatedTotal(order);
        const totalHtml = estimatedTotal > 0 ? `
            <div style="margin-top:16px; padding:12px 16px; background:rgba(123,47,255,0.06); border:1px solid rgba(123,47,255,0.15); border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13px; color:var(--purple-light);">예상 합계 (기본가 + 추가옵션)</span>
                <strong style="font-size:16px; color:var(--purple);">${estimatedTotal.toLocaleString('ko-KR')}원</strong>
            </div>` : '';

        // 확정 금액 (예상 합계 아래에 크게 표시)
        const confirmedTotalHtml = order.total_amount ? `
            <div style="margin-top:12px; padding:16px; background:rgba(229,60,17,0.08); border:1px solid rgba(229,60,17,0.2); border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:14px; font-weight:600; color:var(--text-primary);">확정 금액</span>
                <strong style="font-size:22px; color:#e53c11;">${order.total_amount}원</strong>
            </div>` : '';

        body.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
                <div><small style="color:var(--text-muted); font-size:11px;">상태</small><br><strong style="color:var(--text-primary);">${s.label}</strong></div>
                <div><small style="color:var(--text-muted); font-size:11px;">플랜</small><br><strong style="color:var(--text-primary);">${order.plan_name}</strong></div>
                <div><small style="color:var(--text-muted); font-size:11px;">티어</small><br><span style="color:var(--text-secondary);">${order.plan_tier || '-'}</span></div>
                <div><small style="color:var(--text-muted); font-size:11px;">기본 가격</small><br><span style="color:var(--text-primary);">${formatOrderPrice(order.plan_price)}</span></div>
                <div><small style="color:var(--text-muted); font-size:11px;">신청일</small><br><span style="color:var(--text-secondary);">${new Date(order.created_at).toLocaleString('ko-KR')}</span></div>
            </div>
            ${addonsHtml}
            ${totalHtml}
            ${confirmedTotalHtml}
            ${order.memo ? `<div style="margin-top:16px; padding:12px; background:var(--bg-panel); border:1px solid var(--border); border-radius:8px; font-size:13px; color:var(--text-secondary); line-height:1.5;"><strong style="color:var(--text-primary);">고객 요청사항</strong><br>${order.memo}</div>` : ''}
            <div style="margin-top:12px;">
                <label style="display:block; font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:6px;">관리자 답변</label>
                <textarea id="adminReplyInput" class="form-control" rows="3" placeholder="고객 요청사항에 대한 답변을 입력하세요..." style="width:100%; font-size:13px; resize:vertical;">${order.quote_data?.admin_reply || ''}</textarea>
                <button onclick="saveAdminReply(${orderId})" class="btn-preview" style="margin-top:8px; height:40px; padding:0 16px; font-size:13px; border-radius:8px; font-weight:600;">답변 저장</button>
            </div>
            ${(() => {
                // 사업자 정보 섹션
                const bizUrl = order.contract_data?.biz_license_url || '';
                const custBiz = order.contract_data?.customer_business || {};
                const cd = order.contract_data || {};
                // customer_business 내부 값을 우선 사용하되, 없으면 contract_data 루트(간편 첨부 시 저장 위치)에서 폴백
                const bizInfo = {
                    company_name: custBiz.company_name || cd.company_name || '',
                    ceo_name: custBiz.ceo_name || cd.ceo_name || '',
                    biz_number: custBiz.biz_number || cd.biz_number || '',
                    address: custBiz.address || cd.address || '',
                    contact_phone: custBiz.contact_phone || cd.contact_phone || '',
                    contact_email: custBiz.contact_email || cd.contact_email || '',
                    biz_type: custBiz.biz_type || cd.biz_type || '',
                    contact_name: custBiz.contact_name || cd.contact_name || ''
                };
                const hasBizInfo = bizInfo.company_name || bizInfo.contact_phone || bizInfo.contact_email;
                let bizHtml = '<div style="margin-top:16px; border-top:1px solid var(--border); padding-top:16px;"><div style="font-size:13px; font-weight:700; color:var(--text-primary); margin-bottom:12px;">📋 고객 사업자 정보</div>';

                if (bizUrl) {
                    bizHtml += `<div style="margin-bottom:12px;"><div style="font-size:11px; color:var(--text-muted); margin-bottom:6px;">첨부된 사업자등록증</div><div id="bizLicensePreview" style="display:inline-block; max-width:100%;"><span style="color:#888; font-size:12px;">이미지 로딩 중...</span></div></div>`;
                }

                if (hasBizInfo) {
                    bizHtml += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px;">
                        <div><span style="color:var(--text-muted);">업체명</span><br><strong style="color:var(--text-primary);">${bizInfo.company_name || '-'}</strong></div>
                        <div><span style="color:var(--text-muted);">대표자</span><br><strong style="color:var(--text-primary);">${bizInfo.ceo_name || '-'}</strong></div>
                        <div><span style="color:var(--text-muted);">사업자번호</span><br><span style="color:var(--text-secondary);">${bizInfo.biz_number || '-'}</span></div>
                        <div><span style="color:var(--text-muted);">주소</span><br><span style="color:var(--text-secondary);">${bizInfo.address || '-'}</span></div>
                        <div><span style="color:var(--text-muted);">연락처</span><br><span style="color:var(--text-secondary);">${bizInfo.contact_phone || '-'}</span></div>
                        <div><span style="color:var(--text-muted);">이메일</span><br><span style="color:var(--text-secondary);">${bizInfo.contact_email || '-'}</span></div>
                    </div>`;
                }

                // 관리자 대리 입력 폼 (항상 표시 - 기존 정보 수정 가능)
                const inputStyle = 'width:100%; padding:6px 10px; border-radius:6px; border:1px solid var(--border); background:var(--bg-secondary); color:var(--text-primary); font-size:12px;';
                bizHtml += `<div style="margin-top:12px; padding:12px; background:rgba(123,47,255,0.04); border:1px solid rgba(123,47,255,0.12); border-radius:8px;">
                    <div style="font-size:11px; font-weight:600; color:var(--purple-light); margin-bottom:10px;">${hasBizInfo ? '✏️ 사업자 정보 수정' : '✏️ 사업자 정보 대리 입력'}</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <div><label style="font-size:10px; color:var(--text-muted);">업체명 *</label><input id="adminBizCompany" style="${inputStyle}" value="${bizInfo.company_name || ''}" placeholder="업체명"></div>
                        <div><label style="font-size:10px; color:var(--text-muted);">대표자</label><input id="adminBizCeo" style="${inputStyle}" value="${bizInfo.ceo_name || ''}" placeholder="대표자"></div>
                        <div><label style="font-size:10px; color:var(--text-muted);">사업자번호</label><input id="adminBizNum" style="${inputStyle}" value="${bizInfo.biz_number || ''}" placeholder="000-00-00000" oninput="this.value = formatBizNumber(this.value)"></div>
                        <div><label style="font-size:10px; color:var(--text-muted);">주소</label><input id="adminBizAddr" style="${inputStyle}" value="${bizInfo.address || ''}" placeholder="주소"></div>
                        <div><label style="font-size:10px; color:var(--text-muted);">연락처</label><input id="adminBizPhone" style="${inputStyle}" value="${bizInfo.contact_phone || ''}" placeholder="010-0000-0000" oninput="this.value = formatPhoneNumber(this.value)"></div>
                        <div><label style="font-size:10px; color:var(--text-muted);">이메일</label><input id="adminBizEmail" style="${inputStyle}" value="${bizInfo.contact_email || ''}" placeholder="email@example.com"></div>
                    </div>
                    <button onclick="saveAdminBizInfo(${orderId})" class="btn-save" style="margin-top:10px; height:34px; font-size:12px; width:100%;">사업자 정보 저장</button>
                </div>`;

                bizHtml += '</div>';
                return (bizUrl || hasBizInfo || ['contract_issued','completed'].includes(order.status)) ? bizHtml : '';
            })()}
        `;

        const btnStyle = 'height:40px; padding:0 12px; font-size:12px; border-radius:8px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:4px; flex:1; min-width:0; white-space:nowrap;';

        // PDF 다운로드 버튼 (상태에 따라)
        let pdfBtns = '';
        if (['quote_issued','paid','contract_issued','completed'].includes(order.status)) {
            pdfBtns += `<button onclick="adminDownloadQuotePDF(${orderId})" class="btn-preview" style="${btnStyle}">견적서 PDF</button>`;
        }
        if (['contract_issued','completed'].includes(order.status)) {
            pdfBtns += `<button onclick="adminDownloadContractPDF(${orderId})" class="btn-preview" style="${btnStyle}">계약서 PDF</button>`;
        }

        // 액션 버튼
        let actionsHtml = '';
        if (order.status === 'quote_pending') {
            actionsHtml = `
                <button onclick="actionIssueQuote(${orderId})" class="btn-save" style="${btnStyle}">견적서 발행</button>
            `;
        } else if (order.status === 'quote_issued') {
            // 고객이 계약정보를 등록했는지 확인
            const hasBizInfo = order.contract_data?.customer_business || order.contract_data?.biz_license_url;
            if (hasBizInfo) {
                actionsHtml = `<button onclick="actionConfirmPayment(${orderId})" class="btn-save" style="${btnStyle}">결제 확인</button>`;
            } else {
                actionsHtml = `<button disabled class="btn-save" style="${btnStyle} opacity:0.4; cursor:not-allowed;" title="고객이 계약 정보를 등록한 후 활성화됩니다">결제 확인 (대기 중)</button>`;
            }
        } else if (order.status === 'paid') {
            actionsHtml = `<button onclick="actionIssueContract(${orderId})" class="btn-save" style="${btnStyle}">계약서 발행</button>`;
        } else if (order.status === 'contract_issued') {
            const hasSigned = !!(order.contract_data?.customer_signature);
            if (hasSigned) {
                actionsHtml = `<button onclick="actionCompleteOrder(${orderId})" class="btn-save" style="${btnStyle} background:#e53c11; color:#fff; border-color:#e53c11;">체결 완료</button>`;
            } else {
                actionsHtml = `<span title="고객이 마이페이지에서 전자서명을 완료한 후 활성화됩니다." style="display:flex; flex:1;"><button disabled class="btn-save" style="${btnStyle} background:#ddd; color:#999; border-color:#ddd; cursor:not-allowed; opacity:0.7; pointer-events:none; width:100%;">체결 완료 (고객 서명 대기중)</button></span>`;
            }
        }
        actions.innerHTML = `<div style="display:flex; flex-wrap:wrap; gap:8px;">${pdfBtns}${actionsHtml}</div>`;

        modal.style.display = 'flex';
        if (window.innerWidth >= 768) {
            const pcBtn = document.getElementById('adminModalClosePc');
            if (pcBtn) { pcBtn.style.display = 'flex'; pcBtn.onclick = closeOrderDetail; }
        }

        // 사업자등록증 표시 (PDF/이미지 자동 감지)
        const bizLicenseUrl = order.contract_data?.biz_license_url || '';
        const previewContainer = document.getElementById('bizLicensePreview');
        if (previewContainer && bizLicenseUrl) {
            previewContainer.innerHTML = '';

            // PDF 감지: MIME 타입 또는 base64 내용으로 판단
            const isPdf = bizLicenseUrl.includes('application/pdf') ||
                          bizLicenseUrl.includes(';base64,JVBER');

            // 기존 데이터 중 image/jpeg로 잘못 저장된 PDF도 교정
            let displayUrl = bizLicenseUrl;
            if (isPdf && !bizLicenseUrl.includes('application/pdf')) {
                const base64 = bizLicenseUrl.split(';base64,')[1] || '';
                displayUrl = 'data:application/pdf;base64,' + base64;
            }

            if (isPdf) {
                // PDF → iframe으로 표시
                const iframe = document.createElement('iframe');
                iframe.src = displayUrl;
                iframe.style.cssText = 'width:100%; height:350px; border-radius:8px; border:1px solid var(--border);';
                previewContainer.appendChild(iframe);

                // PDF 새 창에서 보기 버튼
                const btn = document.createElement('button');
                btn.textContent = '📄 PDF 새 창에서 보기';
                btn.className = 'btn-preview';
                btn.style.cssText = 'margin-top:8px; font-size:11px; padding:4px 12px; cursor:pointer;';
                btn.onclick = () => {
                    const w = window.open('', '_blank');
                    if (!w) { alert('팝업이 차단되었습니다.'); return; }
                    const pdfIframe = w.document.createElement('iframe');
                    pdfIframe.src = displayUrl;
                    pdfIframe.style.cssText = 'width:100%; height:100%; border:none;';
                    w.document.body.style.cssText = 'margin:0; overflow:hidden;';
                    w.document.body.appendChild(pdfIframe);
                    w.document.title = '사업자등록증';
                };
                previewContainer.appendChild(btn);
            } else {
                // 이미지 → img 엘리먼트
                const img = document.createElement('img');
                img.alt = '사업자등록증';
                img.style.cssText = 'max-width:100%; max-height:250px; border-radius:8px; border:1px solid var(--border); cursor:pointer;';
                img.title = '클릭하면 새 창에서 볼 수 있습니다';
                img.onload = () => {
                    img.onclick = () => {
                        const w = window.open('', '_blank');
                        if (!w) { alert('팝업이 차단되었습니다.'); return; }
                        w.document.title = '사업자등록증';
                        w.document.body.style.cssText = 'margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#111;';
                        const popupImg = w.document.createElement('img');
                        popupImg.style.cssText = 'max-width:100%; max-height:100vh;';
                        popupImg.src = displayUrl;
                        w.document.body.appendChild(popupImg);
                    };
                };
                img.onerror = () => {
                    previewContainer.innerHTML = '<span style="color:#888; font-size:12px;">📎 파일을 표시할 수 없습니다</span>';
                };
                previewContainer.appendChild(img);
                img.src = displayUrl;
            }
        }
    } catch (e) {
        console.error('주문 상세 로드 실패:', e);
        showToast('❌ 주문 상세를 불러올 수 없습니다.');
    }
}

function closeOrderDetail() {
    document.getElementById('orderDetailModal').style.display = 'none';
    const pcBtn = document.getElementById('adminModalClosePc');
    if (pcBtn) pcBtn.style.display = 'none';
}

// 천 단위 쉼표 포맷 함수
function formatNumberWithCommas(value) {
    const num = value.replace(/[^0-9]/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 사업자번호 포맷 함수
function formatBizNumber(value) {
    let str = value.replace(/[^0-9]/g, '');
    if (str.length > 10) str = str.slice(0, 10);
    let res = '';
    if (str.length < 4) res = str;
    else if (str.length < 6) res = str.slice(0, 3) + '-' + str.slice(3);
    else res = str.slice(0, 3) + '-' + str.slice(3, 5) + '-' + str.slice(5);
    return res;
}

// 연락처 포맷 함수
function formatPhoneNumber(value) {
    let str = value.replace(/[^0-9]/g, '');
    let res = '';
    if (str.startsWith('02')) {
        if (str.length > 10) str = str.slice(0, 10);
        if (str.length < 3) res = str;
        else if (str.length < 6) res = str.slice(0, 2) + '-' + str.slice(2);
        else if (str.length < 10) res = str.slice(0, 2) + '-' + str.slice(2, 5) + '-' + str.slice(5);
        else res = str.slice(0, 2) + '-' + str.slice(2, 6) + '-' + str.slice(6);
    } else {
        if (str.length > 11) str = str.slice(0, 11);
        if (str.length < 4) res = str;
        else if (str.length < 7) res = str.slice(0, 3) + '-' + str.slice(3);
        else if (str.length < 11) res = str.slice(0, 3) + '-' + str.slice(3, 6) + '-' + str.slice(6);
        else res = str.slice(0, 3) + '-' + str.slice(3, 7) + '-' + str.slice(7);
    }
    return res;
}

// 견적서 발행
async function actionIssueQuote(orderId) {
    const actions = document.getElementById('orderDetailActions');
    // 이미 입력 UI가 있으면 무시
    if (document.getElementById('quoteAmountInput')) return;

    actions.innerHTML = `
        <div style="width:100%;">
            <label style="display:block; font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:6px;">확정 금액 입력</label>
            <div style="display:flex; gap:8px; align-items:center;">
                <input type="text" id="quoteAmountInput" class="form-control" placeholder="예: 190,000" style="flex:1; font-size:16px; font-weight:600;" oninput="this.value = formatNumberWithCommas(this.value)">
                <span style="color:var(--text-secondary); font-weight:600;">원</span>
            </div>
            <div style="display:flex; gap:8px; margin-top:10px;">
                <button onclick="confirmIssueQuote(${orderId})" class="btn-save" style="flex:1; height:38px;">확인</button>
                <button onclick="openOrderDetail(${orderId})" class="btn-preview" style="height:38px; width:auto; padding:0 16px;">취소</button>
            </div>
        </div>
    `;
    // 자동 포커스
    document.getElementById('quoteAmountInput')?.focus();
}

// 견적 발행 확인
async function confirmIssueQuote(orderId) {
    const input = document.getElementById('quoteAmountInput');
    const totalAmount = input?.value?.trim();
    if (!totalAmount) { showToast('금액을 입력해주세요.'); return; }

    try {
        await AdminContent.issueQuote(orderId, {
            totalAmount: totalAmount,
            issuedAt: new Date().toISOString()
        });
        showToast('✅ 견적서가 발행되었습니다.');
        closeOrderDetail();
        loadOrders();
    } catch (e) {
        showToast('❌ 견적서 발행 실패: ' + e.message);
    }
}

async function actionConfirmPayment(orderId) {
    if (!confirm('결제가 확인되었습니까?')) return;
    try {
        await AdminContent.confirmPayment(orderId);
        showToast('✅ 결제가 확인되었습니다.');
        loadOrders();
        // 모달 닫지 않고 바로 계약서 발행 버튼 표시
        const actions = document.getElementById('orderDetailActions');
        const btnStyle = 'height:40px; padding:0 12px; font-size:12px; border-radius:8px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:4px; flex:1; min-width:0; white-space:nowrap;';
        let pdfBtns = `<button onclick="adminDownloadQuotePDF(${orderId})" class="btn-preview" style="${btnStyle}">견적서 PDF</button>`;
        actions.innerHTML = `<div style="display:flex; flex-wrap:wrap; gap:8px;">${pdfBtns}<button onclick="actionIssueContract(${orderId})" class="btn-save" style="${btnStyle}">계약서 발행</button></div>`;
    } catch (e) {
        showToast('❌ 결제 확인 실패: ' + e.message);
    }
}

async function actionIssueContract(orderId) {
    if (!confirm('계약서를 발행하시겠습니까?')) return;
    try {
        await AdminContent.issueContract(orderId, {
            issuedAt: new Date().toISOString()
        });
        showToast('✅ 계약서가 발행되었습니다.');
        loadOrders();
        // 모달 닫지 않고 바로 체결 완료 버튼 표시
        const actions = document.getElementById('orderDetailActions');
        const btnStyle = 'height:40px; padding:0 12px; font-size:12px; border-radius:8px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:4px; flex:1; min-width:0; white-space:nowrap;';
        let pdfBtns = `<button onclick="adminDownloadQuotePDF(${orderId})" class="btn-preview" style="${btnStyle}">견적서 PDF</button>`;
        pdfBtns += `<button onclick="adminDownloadContractPDF(${orderId})" class="btn-preview" style="${btnStyle}">계약서 PDF</button>`;
        actions.innerHTML = `<div style="display:flex; flex-wrap:wrap; gap:8px;">${pdfBtns}<span title="고객이 마이페이지에서 전자서명을 완료한 후 활성화됩니다." style="display:flex; flex:1;"><button disabled class="btn-save" style="${btnStyle} background:#ddd; color:#999; border-color:#ddd; cursor:not-allowed; opacity:0.7; pointer-events:none; width:100%;">체결 완료 (고객 서명 대기중)</button></span></div>`;
    } catch (e) {
        showToast('❌ 계약서 발행 실패: ' + e.message);
    }
}

async function actionCompleteOrder(orderId) {
    if (!confirm('계약 체결을 완료 처리하시겠습니까?')) return;
    try {
        await AdminContent.completeOrder(orderId);
        showToast('🎉 계약 체결이 완료되었습니다.');
        closeOrderDetail();
        loadOrders();
    } catch (e) {
        showToast('❌ 완료 처리 실패: ' + e.message);
    }
}

async function saveAdminReply(orderId) {
    const text = document.getElementById('adminReplyInput')?.value?.trim();
    if (!text) { showToast('답변 내용을 입력해주세요.'); return; }
    try {
        await AdminContent.saveAdminReply(orderId, text);
        showToast('✅ 답변이 저장되었습니다.');
    } catch (e) {
        showToast('❌ 답변 저장 실패: ' + e.message);
    }
}

async function actionDeleteOrder(orderId) {
    if (!confirm('이 주문을 삭제하시겠습니까? 되돌릴 수 없습니다.')) return;
    try {
        await AdminContent.deleteOrder(orderId);
        showToast('주문이 삭제되었습니다.');
        closeOrderDetail();
        loadOrders();
    } catch (e) {
        showToast('❌ 주문 삭제 실패: ' + e.message);
    }
}

/* ── 관리자: 견적서 PDF 다운로드 ── */
async function adminDownloadQuotePDF(orderId) {
    try {
        const order = await AdminContent.getOrder(orderId);
        const quoteDate = order.quote_data?.issuedAt ? new Date(order.quote_data.issuedAt).toLocaleDateString('ko-KR') : '-';
        const totalAmount = order.total_amount || '-';
        const basePrice = order.plan_price || '-';
        let basePriceClean = basePrice;
        if (basePrice.includes('|')) { const p = basePrice.split('|'); basePriceClean = (p[2] || p[0]) + '원'; }
        else { basePriceClean = basePrice + '원'; }
        let addonsRows = '';
        if (order.addons && order.addons.length > 0) {
            addonsRows = order.addons.map(a => `<tr><td style="padding:6px 10px; border:1px solid #ddd;">${a.name}</td><td style="padding:6px 10px; border:1px solid #ddd; text-align:right;">${a.price || '-'}</td></tr>`).join('');
        }
        const adminReply = order.quote_data?.admin_reply || '';
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:fixed; left:-9999px; top:0; z-index:99999; background:#fff;';
        wrapper.innerHTML = `
<div id="adminQuotePdf" style="width:794px; padding:60px 70px; font-family:'Pretendard Variable','Malgun Gothic',sans-serif; color:#111; font-size:13px; line-height:1.8; background:#fff;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid #7b2fff;">
        <div><div style="font-size:24px; font-weight:700; letter-spacing:2px;">THE PANG</div><div style="font-size:11px; color:#888; margin-top:4px;">넥스온 | 사업자번호: 686-46-01233</div><div style="font-size:11px; color:#888;">충남 아산시 탕정면 탕정면로109번길 46-1 | 대표: 조교선</div></div>
        <div style="text-align:right;"><div style="font-size:22px; font-weight:700; color:#7b2fff; letter-spacing:3px;">견 적 서</div><div style="font-size:12px; color:#888; margin-top:4px;">발행일: ${quoteDate}</div></div>
    </div>
    <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
        <tr><td style="padding:8px 12px; border:1px solid #ddd; background:#f9f9f9; width:120px; font-weight:600;">플랜</td><td style="padding:8px 12px; border:1px solid #ddd;">${order.plan_name} (${order.plan_tier || ''})</td></tr>
        <tr><td style="padding:8px 12px; border:1px solid #ddd; background:#f9f9f9; font-weight:600;">기본 가격</td><td style="padding:8px 12px; border:1px solid #ddd;">${basePriceClean}</td></tr>
    </table>
    ${addonsRows ? `<h3 style="font-size:14px; margin-bottom:8px; color:#7b2fff;">추가 옵션</h3><table style="width:100%; border-collapse:collapse; margin-bottom:20px;"><tr style="background:#f9f9f9;"><th style="padding:6px 10px; border:1px solid #ddd; text-align:left;">옵션명</th><th style="padding:6px 10px; border:1px solid #ddd; text-align:right;">금액</th></tr>${addonsRows}</table>` : ''}
    <div style="text-align:right; font-size:18px; font-weight:700; margin-top:20px; padding:16px; background:#f0f0ff; border-radius:8px;">확정 금액: ${totalAmount}원 <span style="font-size:12px; color:#888;">(VAT 별도)</span></div>
    ${order.memo ? `<div style="margin-top:24px; padding:14px; background:#fafafa; border:1px solid #eee; border-radius:8px;"><div style="font-size:12px; font-weight:700; color:#7b2fff; margin-bottom:6px;">💬 고객 요청사항</div><div style="font-size:13px; color:#333; white-space:pre-wrap;">${order.memo}</div></div>` : ''}
    ${adminReply ? `<div style="margin-top:12px; padding:14px; background:#f5f0ff; border:1px solid #e0d4f5; border-radius:8px;"><div style="font-size:12px; font-weight:700; color:#e53c11; margin-bottom:6px;">📝 답변</div><div style="font-size:13px; color:#333; white-space:pre-wrap;">${adminReply}</div></div>` : ''}
</div>`;
        document.body.appendChild(wrapper);
        const el = document.getElementById('adminQuotePdf');
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pW = pdf.internal.pageSize.getWidth() - 20;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, pW, (canvas.height * pW) / canvas.width);
        pdf.save('견적서_' + order.plan_name + '_' + orderId + '.pdf');
        document.body.removeChild(wrapper);
        showToast('📋 견적서 PDF가 다운로드되었습니다.');
    } catch (e) { showToast('❌ 견적서 PDF 생성 실패: ' + e.message); }
}

/* ── 관리자: 계약서 PDF 다운로드 (2페이지: 본문 + 별지) ── */
async function adminDownloadContractPDF(orderId) {
    try {
        const order = await AdminContent.getOrder(orderId);
        const cd = order.contract_data?.issuedAt ? new Date(order.contract_data.issuedAt) : new Date();
        const y = cd.getFullYear(), m = cd.getMonth()+1, d = cd.getDate();
        const totalAmount = order.total_amount || '0';
        const customerName = order.user_name || order.plan_name || '고객';
        const adminReply = order.quote_data?.admin_reply || '';
        const customerSignature = order.contract_data?.customer_signature || '';
        const custBiz = order.contract_data?.customer_business || {};
        const cd2 = order.contract_data || {};
        const member = order._member || order.members || {};
        const bizCompany = custBiz.company_name || cd2.company_name || member.company || member.company_name || customerName;
        const bizCeo = custBiz.ceo_name || cd2.ceo_name || member.name || '';
        const bizNum = custBiz.biz_number || cd2.biz_number || '';
        const bizAddr = custBiz.address || cd2.address || '';

        const basePrice = order.plan_price || '-';
        let basePriceClean = basePrice;
        if (basePrice.includes('|')) { const p = basePrice.split('|'); basePriceClean = (p[2] || p[0]) + '원'; }
        else { basePriceClean = basePrice + '원'; }
        let addonsRows = '';
        if (order.addons && order.addons.length > 0) {
            addonsRows = order.addons.map(a => `<tr><td style="padding:6px 10px; border:1px solid #ddd;">${a.name}</td><td style="padding:6px 10px; border:1px solid #ddd; text-align:right;">${a.price || '-'}</td></tr>`).join('');
        }
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:fixed; left:-9999px; top:0; z-index:99999; background:#fff;';
        wrapper.innerHTML = `
<div id="adminContractP1" style="width:794px; height:1123px; padding:50px 65px; font-family:'Pretendard Variable','Malgun Gothic',sans-serif; color:#111; font-size:12px; line-height:1.7; background:#fff; box-sizing:border-box; overflow:hidden;">
    <h1 style="text-align:center; font-size:20px; font-weight:700; margin-bottom:4px; letter-spacing:2px;">광고 마케팅 업무 표준 계약서</h1>
    <div style="text-align:center; font-size:10px; color:#888; margin-bottom:20px;">THE PANG by NEXON</div>
    <p style="margin-bottom:14px;">${bizCompany}(이하 "행"이라 한다)과 넥스온(이하 "동"이라 한다)은 "행"의 상품 및 브랜드 홍보를 위한 광고 마케팅 업무를 수행함에 있어 상호 신뢰를 바탕으로 다음과 같이 계약을 체결한다.</p>
    <h3 style="margin-top:14px; font-size:13px; font-weight:700;">제1조 (목적)</h3><p>본 계약은 "행"이 의뢰한 광고 마케팅 업무를 "동"이 수행함에 있어 필요한 제반 사항과 양 당사자의 권리 및 의무를 규정함을 목적으로 한다.</p>
    <h3 style="margin-top:14px; font-size:13px; font-weight:700;">제2조 (업무의 범위 및 내용)</h3><p>① "동"이 수행할 구체적인 업무 범위와 실행 내용은 양 당사자가 사전에 합의한 [별첨: 견적서]를 원칙으로 한다.<br>② 추가 업무 발생 시 양 당사자는 서면(전자문서 포함) 합의를 통해 업무 범위와 비용을 조정한다.</p>
    <h3 style="margin-top:14px; font-size:13px; font-weight:700;">제3조 (계약 기간)</h3><p>본 계약 기간은 계약 체결일로부터 프로젝트 완료일까지로 하며, 연장 필요시 종료 전 상호 협의하여 결정한다.</p>
    <h3 style="margin-top:14px; font-size:13px; font-weight:700;">제4조 (계약 금액 및 결제 방식)</h3><p>① 본 업무의 총 계약 금액은 금 <strong>${totalAmount}원 (VAT 별도)</strong>으로 한다.<br>② "행"은 "동"이 제공하는 온라인 결제 시스템을 통하여 결제하며, 지출 증빙은 결제 수단에 따라 발행된다.</p>
    <h3 style="margin-top:14px; font-size:13px; font-weight:700;">제5조 (계약의 성립)</h3><p>본 계약은 "행"이 결제를 완료하고, "동"이 본 계약서를 전자적 방식으로 발송한 시점부터 효력이 발생하며, 결제 행위는 본 계약 내용에 동의한 것으로 간주한다.</p>
    <h3 style="margin-top:14px; font-size:13px; font-weight:700;">제6조 (업무의 수행 및 협조)</h3><p>"동"은 신의성실의 원칙에 따라 업무를 수행하며, "행"의 자료 제공 지연으로 인한 일정 차질은 "동"의 책임으로 보지 않는다.</p>
    <h3 style="margin-top:14px; font-size:13px; font-weight:700;">제7조 (권리의 귀속 및 성과물 활용)</h3><p>① 최종 성과물의 사용권 및 지식재산권은 "행"에게 귀속된다.<br>② "행"은 "동"이 해당 성과물을 "동"의 포트폴리오 및 자체 광고·마케팅 목적으로 활용하는 것에 동의한다.<br>③ "동"의 성과물 활용은 "행"의 브랜드 및 상품에 대한 2차 광고 효과를 창출할 수 있으므로, 양 당사자는 이를 상호 이익이 되는 방향으로 적극 활용함에 동의한다.</p>
    <h3 style="margin-top:14px; font-size:13px; font-weight:700;">제8조 (비밀유지)</h3><p>양 당사자는 본 계약과 관련하여 취득한 영업비밀 및 개인정보를 제3자에게 누설하거나 목적 외로 사용해서는 안 된다.</p>
    <h3 style="margin-top:14px; font-size:13px; font-weight:700;">제9조 (계약 해지 및 환불)</h3><p>의무 위반 시 7일 이내 시정되지 않으면 계약을 해지할 수 있으며, 환불 시 기진행된 업무 비율 및 투입 리소스 비용을 공제하고 환불한다.</p>
    <h3 style="margin-top:14px; font-size:13px; font-weight:700;">제10조 (손해배상 및 관할 법원)</h3><p>본 계약 위반으로 발생한 손해는 위반 당사자가 배상하며, 분쟁 발생 시 "동"의 본점 소재지 관할 법원을 제1심 합의 관할 법원으로 한다.</p>
    <div style="margin-top:28px; text-align:center; font-size:13px; font-weight:600;">계약일자: ${y}년 ${m}월 ${d}일</div>
    <div style="display:flex; justify-content:space-between; margin-top:24px; gap:30px;">
        <div style="flex:1; border:1px solid #ddd; border-radius:6px; padding:14px;"><div style="font-size:11px; font-weight:700; color:#7b2fff; margin-bottom:8px;">[동] 공급자</div><table style="font-size:11px; width:100%; border-collapse:collapse;"><tr><td style="padding:3px 0; color:#666; width:65px;">업체명</td><td style="padding:3px 0; font-weight:600;"><div style="position:relative; display:inline-block;">넥스온<img src="/assets/images/nexon_seal.png" style="position:absolute; top:-52px; left:90px; height:120px; max-width:none; z-index:1;" alt="(직인)"></div></td></tr><tr><td style="padding:3px 0; color:#666;">사업자번호</td><td style="padding:3px 0;">686-46-01233</td></tr><tr><td style="padding:3px 0; color:#666;">주소</td><td style="padding:3px 0;">충남 아산시 탕정면 탕정면로109번길 46-1</td></tr><tr><td style="padding:3px 0; color:#666;">대표자</td><td style="padding:3px 0; font-weight:600;"><div style="position:relative; display:inline-block;">조교선<img src="/assets/images/ceo_signature.png" style="position:absolute; top:0px; left:40px; height:34px; max-width:none; z-index:1;" alt="(서명)" onerror="this.style.display='none'"></div></td></tr></table></div>
        <div style="flex:1; border:1px solid #ddd; border-radius:6px; padding:14px;">
            <div style="font-size:11px; font-weight:700; color:#e53c11; margin-bottom:8px;">[행] 공급받는자</div>
            <table style="font-size:11px; width:100%; border-collapse:collapse;">
                <tr><td style="padding:3px 0; color:#666; width:65px; vertical-align:middle;">업체명</td><td style="padding:3px 0; font-weight:600; vertical-align:middle;">${bizCompany}</td></tr>
                <tr><td style="padding:3px 0; color:#666; vertical-align:middle;">사업자번호</td><td style="padding:3px 0; vertical-align:middle;">${bizNum || '-'}</td></tr>
                <tr><td style="padding:3px 0; color:#666; vertical-align:middle;">주소</td><td style="padding:3px 0; vertical-align:middle;">${bizAddr || '-'}</td></tr>
                <tr><td style="padding:3px 0; color:#666; vertical-align:middle;">대표자</td><td style="padding:3px 0; font-weight:600; vertical-align:middle;"><div style="position:relative; display:inline-block;">${bizCeo || '(온라인 결제 동의로 갈음)'}${customerSignature ? `<img src="${customerSignature}" style="position:absolute; top:-4px; left:100%; margin-left:10px; height:24px; max-width:none; z-index:1;" alt="(서명)">` : ''}</div></td></tr>
            </table>
        </div>
    </div>
</div>
<div id="adminContractP2" style="width:794px; padding:50px 65px; font-family:'Pretendard Variable','Malgun Gothic',sans-serif; color:#111; font-size:12px; line-height:1.7; background:#fff; box-sizing:border-box;">
    <h2 style="text-align:center; font-size:18px; font-weight:700; margin-bottom:4px; letter-spacing:1px;">[별 첨] 계약 상세 내역</h2>
    <div style="text-align:center; font-size:10px; color:#888; margin-bottom:24px;">본 문서는 광고 마케팅 업무 표준 계약서의 별첨 자료입니다.</div>
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; padding-bottom:14px; border-bottom:2px solid #7b2fff;"><div><div style="font-size:18px; font-weight:700;">THE PANG</div><div style="font-size:10px; color:#888; margin-top:2px;">넥스온 | 686-46-01233 | 충남 아산시 탕정면 탕정면로109번길 46-1</div></div><div style="text-align:right; font-size:11px; color:#888;">계약일: ${y}년 ${m}월 ${d}일</div></div>
    <table style="width:100%; border-collapse:collapse; margin-bottom:16px;"><tr><td style="padding:8px 12px; border:1px solid #ddd; background:#f9f9f9; width:110px; font-weight:600;">고객명</td><td style="padding:8px 12px; border:1px solid #ddd;">${customerName}</td></tr><tr><td style="padding:8px 12px; border:1px solid #ddd; background:#f9f9f9; font-weight:600;">플랜</td><td style="padding:8px 12px; border:1px solid #ddd;">${order.plan_name} (${order.plan_tier || ''})</td></tr><tr><td style="padding:8px 12px; border:1px solid #ddd; background:#f9f9f9; font-weight:600;">기본 가격</td><td style="padding:8px 12px; border:1px solid #ddd;">${basePriceClean}</td></tr></table>
    ${addonsRows ? `<h3 style="font-size:13px; margin-bottom:6px; color:#7b2fff;">추가 옵션</h3><table style="width:100%; border-collapse:collapse; margin-bottom:16px;"><tr style="background:#f9f9f9;"><th style="padding:6px 10px; border:1px solid #ddd; text-align:left;">옵션명</th><th style="padding:6px 10px; border:1px solid #ddd; text-align:right;">금액</th></tr>${addonsRows}</table>` : ''}
    <div style="text-align:right; font-size:16px; font-weight:700; padding:14px; background:#f0f0ff; border-radius:8px; margin-bottom:20px;">확정 금액: ${totalAmount}원 <span style="font-size:11px; color:#888;">(VAT 별도)</span></div>
    ${order.memo ? `<div style="padding:14px; background:#fafafa; border:1px solid #eee; border-radius:8px; margin-bottom:12px;"><div style="font-size:12px; font-weight:700; color:#7b2fff; margin-bottom:6px;">💬 고객 요청사항</div><div style="font-size:12px; color:#333; white-space:pre-wrap;">${order.memo}</div></div>` : ''}
    ${adminReply ? `<div style="padding:14px; background:#f5f0ff; border:1px solid #e0d4f5; border-radius:8px; margin-bottom:12px;"><div style="font-size:12px; font-weight:700; color:#e53c11; margin-bottom:6px;">📝 답변</div><div style="font-size:12px; color:#333; white-space:pre-wrap;">${adminReply}</div></div>` : ''}
    <div style="margin-top:30px; text-align:center; font-size:10px; color:#aaa;">본 별첨은 계약서와 동일한 효력을 가집니다.</div>
</div>`;
        document.body.appendChild(wrapper);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();
        const imgW = pdfW - 20;
        const c1 = await html2canvas(document.getElementById('adminContractP1'), { scale: 2, useCORS: true, backgroundColor: '#fff' });
        pdf.addImage(c1.toDataURL('image/png'), 'PNG', 10, 10, imgW, Math.min((c1.height * imgW) / c1.width, pdfH - 20));
        pdf.addPage();
        const c2 = await html2canvas(document.getElementById('adminContractP2'), { scale: 2, useCORS: true, backgroundColor: '#fff' });
        pdf.addImage(c2.toDataURL('image/png'), 'PNG', 10, 10, imgW, Math.min((c2.height * imgW) / c2.width, pdfH - 20));
        pdf.save('계약서_' + order.plan_name + '_' + orderId + '.pdf');
        document.body.removeChild(wrapper);
        showToast('📄 계약서 PDF가 다운로드되었습니다.');
    } catch (e) { showToast('❌ 계약서 PDF 생성 실패: ' + e.message); }
}


/* ════════════════════════════════════════════════════════
   탈퇴회원 관리 패널 (열람 전용)
   ════════════════════════════════════════════════════════ */

let _withdrawnMembers = [];

async function updateWithdrawnStat() {
    try {
        const withdrawn = await AdminContent.getWithdrawnMembers();
        const el = document.getElementById('stat-withdrawn');
        if (el) el.textContent = withdrawn.length;
    } catch(e) { console.warn('withdrawn stat fail:', e); }
}

async function initWithdrawnPanel() {
    try {
        _withdrawnMembers = await AdminContent.getWithdrawnMembers();
        document.getElementById('withdrawnTotalCount').textContent = _withdrawnMembers.length;
        const statEl = document.getElementById('stat-withdrawn');
        if (statEl) statEl.textContent = _withdrawnMembers.length;

        // 각 회원별 주문 건수 조회
        for (const m of _withdrawnMembers) {
            try {
                const orders = await AdminContent.getOrdersByUser(m.user_id);
                m._orderCount = orders.length;
            } catch(e) { m._orderCount = 0; }
        }

        renderWithdrawnMembers(_withdrawnMembers);
    } catch (e) {
        console.error('탈퇴회원 로드 실패:', e);
        showToast('❌ 탈퇴회원 로드 실패');
    }
}

function renderWithdrawnMembers(members) {
    const tbody = document.getElementById('withdrawnTableBody');
    const empty = document.getElementById('withdrawnEmpty');

    if (!members.length) {
        tbody.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = members.map((m, i) => {
        const wDate = m.withdrawn_at ? new Date(m.withdrawn_at).toLocaleDateString('ko-KR') : '-';
        const orderCount = m._orderCount || 0;
        const countBadge = orderCount > 0
            ? `<span style="background:rgba(229,60,17,0.12); color:#e53c11; padding:2px 8px; border-radius:10px; font-size:12px; font-weight:600;">${orderCount}건</span>`
            : `<span style="color:var(--text-muted); font-size:12px;">없음</span>`;

        const safeName = (m.name || '').replace(/'/g, "\\'");
        const safeEmail = (m.email || '').replace(/'/g, "\\'");

        return `
        <tr class="member-row">
            <td class="member-num">${i + 1}</td>
            <td>
                <div class="member-name-cell">
                    <div class="member-avatar" style="background:rgba(229,60,17,0.15); color:#e53c11;">${(m.name || '?').charAt(0)}</div>
                    <span>${m.name || '-'}</span>
                </div>
            </td>
            <td class="member-email">${m.email || '-'}</td>
            <td style="font-size:12px; color:var(--text-secondary);">${wDate}</td>
            <td>${countBadge}</td>
            <td>
                <button class="btn-member-delete" style="background:rgba(123,47,255,0.1); color:#7b2fff;" onclick="openWithdrawnDetail('${m.user_id}', '${safeName}', '${safeEmail}', '${m.created_at||''}', '${m.withdrawn_at||''}')" title="상세 보기">
                    <i class="ri-eye-line"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

async function filterWithdrawnMembers() {
    const q = document.getElementById('withdrawnSearchInput').value.trim().toLowerCase();
    const filtered = q
        ? _withdrawnMembers.filter(m => (m.name||'').toLowerCase().includes(q) || (m.email||'').toLowerCase().includes(q))
        : _withdrawnMembers;
    renderWithdrawnMembers(filtered);
}

async function openWithdrawnDetail(userId, name, email, createdAt, withdrawnAt) {
    const modal = document.getElementById('withdrawnDetailModal');
    const body = document.getElementById('withdrawnDetailBody');

    const joinDate = createdAt ? new Date(createdAt).toLocaleString('ko-KR') : '-';
    const wDate = withdrawnAt ? new Date(withdrawnAt).toLocaleString('ko-KR') : '-';

    body.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
            <div><small style="color:var(--text-muted); font-size:11px;">이름</small><br><strong style="color:var(--text-primary); font-size:15px;">${name}</strong></div>
            <div><small style="color:var(--text-muted); font-size:11px;">상태</small><br><span style="color:#e53c11; font-weight:600;">탈퇴</span></div>
            <div><small style="color:var(--text-muted); font-size:11px;">이메일</small><br><span style="color:var(--text-secondary); font-size:13px;">${email}</span></div>
            <div><small style="color:var(--text-muted); font-size:11px;">가입일</small><br><span style="color:var(--text-secondary); font-size:13px;">${joinDate}</span></div>
            <div style="grid-column:1/-1;"><small style="color:var(--text-muted); font-size:11px;">탈퇴일</small><br><span style="color:#e53c11; font-size:13px; font-weight:600;">${wDate}</span></div>
        </div>
        <div style="border-top:1px solid var(--border); padding-top:16px;">
            <h4 style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:12px;">📋 계약/견적 이력 (증빙 보관용)</h4>
            <div id="withdrawnOrdersList" style="text-align:center; color:var(--text-muted); padding:20px; font-size:13px;">이력을 불러오는 중...</div>
        </div>
    `;
    modal.style.display = 'flex';
    if (window.innerWidth >= 768) {
        const pcBtn = document.getElementById('adminModalClosePc');
        if (pcBtn) { pcBtn.style.display = 'flex'; pcBtn.onclick = closeWithdrawnDetail; }
    }

    // 주문 이력 로드
    try {
        const orders = await AdminContent.getOrdersByUser(userId);
        const listEl = document.getElementById('withdrawnOrdersList');
        if (!orders.length) {
            listEl.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px; font-size:13px;">계약/견적 이력이 없습니다.</div>';
        } else {
            listEl.innerHTML = orders.map(o => {
                const s = ORDER_STATUS_MAP[o.status] || ORDER_STATUS_MAP['quote_pending'];
                const date = new Date(o.created_at).toLocaleDateString('ko-KR');
                return `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg-panel); border:1px solid var(--border); border-radius:8px; margin-bottom:8px; cursor:pointer;" onclick="closeWithdrawnDetail(); openOrderDetail(${o.id})">
                    <div><strong style="font-size:13px; color:var(--text-primary);">${o.plan_name}</strong> <span style="font-size:11px; color:var(--text-muted);">${date}</span></div>
                    <span style="font-size:12px; font-weight:600; color:var(--purple-light);">${s.icon} ${s.label}</span>
                </div>`;
            }).join('');
        }
    } catch (e) {
        document.getElementById('withdrawnOrdersList').innerHTML = '<div style="color:#e53c11; font-size:12px;">이력 로드 실패</div>';
    }
}

function closeWithdrawnDetail() {
    document.getElementById('withdrawnDetailModal').style.display = 'none';
    const pcBtn = document.getElementById('adminModalClosePc');
    if (pcBtn) pcBtn.style.display = 'none';
}

