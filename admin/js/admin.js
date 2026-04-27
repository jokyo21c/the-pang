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
        members:     '회원 관리',
        settings:    '계정 설정',
    };
    const topTitle = document.getElementById('topbarTitle');
    if (topTitle) topTitle.textContent = titles[panelId] || panelId;

    if (panelId === 'members') initMembersPanel();
    if (panelId === 'dashboard') updateMemberStat();
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
                <span class="plan-badge plan-badge--${PLAN_STYLES[i]}">${plan.tier}</span>
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
            name:     document.getElementById(`plan-name-${i}`)?.value     || plan.name,
            price:    finalPrice || plan.price,
            period:   document.getElementById(`plan-period-${i}`)?.value   || plan.period,
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
                <label>옵션명 (예: 드론 촬영 추가)</label>
                <input type="text" class="form-control" id="addon-name-${i}" value="${addon.name || ''}">
            </div>
            <div style="flex: 1;">
                <label>가격 (예: +150,000원/회)</label>
                <input type="text" class="form-control" id="addon-price-${i}" value="${addon.price || ''}">
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
    if(!content.footer) content.footer = { sns: {}, contact: {}, companyLinks: [] };
    
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
                <button class="btn-member-delete" onclick="openMemberDeleteModal(${m.id}, '${m.name}', '${m.email}')" title="삭제">
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
