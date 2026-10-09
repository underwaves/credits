// ========================================================
// SUNFZENITH - Public Credit & Reviews Viewer
// Customer-Facing with +1 / -1 Review System
// ========================================================

const state = {
  credits: [],
  reviews: [],
  reviewCounts: { positive: 0, negative: 0, total: 0 },
  currentTab: 'all', // 'all', '+1', '-1'
  settings: {},
  searchQuery: '',
  reviewFiles: [],
  lightbox: {
    item: null,
    currentImageIndex: 0
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  await fetchSettings();
  await Promise.all([fetchCredits(), fetchReviews()]);

  // Check deep-link ?credit=id
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const creditIdParam = urlParams.get('credit');
    if (creditIdParam) {
      openLightbox(creditIdParam);
    }
  } catch (e) {}

  updateIcons();
});

// Helper to refresh Lucide icons
function updateIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Show Toast Notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass = type === 'error' ? 'bg-rose-950 border-rose-600/50 text-rose-200' : 'bg-slate-900 border-amber-500/50 text-slate-100';
  const icon = type === 'error' ? 'alert-circle' : 'check-circle-2';

  toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs sm:text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 ${bgClass}`;
  toast.innerHTML = `
    <i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  updateIcons();

  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Fetch public settings
async function fetchSettings() {
  try {
    const res = await fetch('/api/public/settings');
    const data = await res.json();
    if (data.success) {
      state.settings = data.settings || {};
      renderSettings();
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

// Fetch credits
async function fetchCredits() {
  const loading = document.getElementById('loading-state');
  const empty = document.getElementById('empty-state');
  const errorEl = document.getElementById('error-state');
  const grid = document.getElementById('credits-grid');

  if (state.currentTab === 'all') {
    if (loading) loading.classList.remove('hidden');
    if (empty) empty.classList.add('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (grid) grid.innerHTML = '';
  }

  try {
    const params = new URLSearchParams();
    if (state.searchQuery) {
      params.append('search', state.searchQuery);
    }

    const res = await fetch(`/api/public/credits?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();

    if (data.success) {
      state.credits = data.credits || [];
      if (errorEl) errorEl.classList.add('hidden');
      if (state.currentTab === 'all') {
        renderFeed();
      }
    } else {
      throw new Error(data.message || 'Failed to load credits');
    }
  } catch (err) {
    console.error('Error fetching credits:', err);
    if (state.currentTab === 'all') {
      if (grid) grid.innerHTML = '';
      if (empty) empty.classList.add('hidden');
      if (errorEl) errorEl.classList.remove('hidden');
    }
    showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง', 'error');
  } finally {
    if (loading) loading.classList.add('hidden');
  }
}

// Fetch reviews (+1 and -1)
async function fetchReviews() {
  const errorEl = document.getElementById('error-state');
  const empty = document.getElementById('empty-state');
  const grid = document.getElementById('credits-grid');

  try {
    const res = await fetch('/api/public/reviews');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    if (data.success) {
      state.reviews = data.reviews || [];
      state.reviewCounts = data.counts || { positive: 0, negative: 0, total: 0 };
      updateReviewBadges();
      if (errorEl && state.currentTab !== 'all') errorEl.classList.add('hidden');
      if (state.currentTab !== 'all') {
        renderFeed();
      }
    }
  } catch (err) {
    console.error('Failed to load reviews:', err);
    if (state.currentTab !== 'all') {
      if (grid) grid.innerHTML = '';
      if (empty) empty.classList.add('hidden');
      if (errorEl) errorEl.classList.remove('hidden');
    }
  }
}

// Retry fetch all data
async function retryFetchAll() {
  const errorEl = document.getElementById('error-state');
  const loading = document.getElementById('loading-state');
  if (errorEl) errorEl.classList.add('hidden');
  if (loading) loading.classList.remove('hidden');

  await fetchSettings();
  await Promise.all([fetchCredits(), fetchReviews()]);
  updateIcons();
}

function updateReviewBadges() {
  const posEl = document.getElementById('stat-positive-count');
  const negEl = document.getElementById('stat-negative-count');
  const tabPos = document.getElementById('tab-badge-plus');
  const tabNeg = document.getElementById('tab-badge-minus');

  if (posEl) posEl.textContent = state.reviewCounts.positive || 0;
  if (negEl) negEl.textContent = state.reviewCounts.negative || 0;
  if (tabPos) tabPos.textContent = state.reviewCounts.positive || 0;
  if (tabNeg) tabNeg.textContent = state.reviewCounts.negative || 0;
}

// Helper to format relative time
function formatRelativeTime(dateStr) {
  if (!dateStr) return 'เมื่อสักครู่';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 5) return 'เมื่อสักครู่';
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    if (diffHour < 24) return `${diffHour} ชม. ที่แล้ว`;
    if (diffDay === 1) return 'เมื่อวานนี้';
    if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

// Render settings
function renderSettings() {
  const { shopName, tagline, announcement, socials } = state.settings;

  const currentShop = shopName || 'SUNFZENITH';
  document.title = `${currentShop} - รวมเครดิตการซื้อขาย`;

  const navName = document.getElementById('nav-shop-name');
  const footerName = document.getElementById('footer-shop-name');
  if (navName) navName.textContent = currentShop;
  if (footerName) footerName.textContent = currentShop;

  if (tagline) {
    const heroTag = document.getElementById('hero-tagline');
    if (heroTag) heroTag.textContent = tagline;
  }

  if (announcement) {
    const annText = document.getElementById('announcement-text');
    if (annText) annText.textContent = announcement;
  }

  const headerTotal = document.getElementById('header-total-count');
  if (headerTotal) headerTotal.textContent = state.credits.length;

  // Social Links
  const socialContainer = document.getElementById('social-links-container');
  if (socialContainer && socials) {
    let html = '';
    if (socials.line && socials.line.enabled && socials.line.url) {
      const safeUrl = sanitizeUrl(socials.line.url);
      if (safeUrl !== '#') {
        html += `
          <a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener" class="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 text-slate-700 font-medium text-xs flex items-center gap-1.5 shadow-sm transition">
            <i data-lucide="message-circle" class="w-3.5 h-3.5 text-emerald-500"></i>
            <span>${escapeHtml(socials.line.label || 'LINE')}</span>
          </a>
        `;
      }
    }
    if (socials.facebook && socials.facebook.enabled && socials.facebook.url) {
      const safeUrl = sanitizeUrl(socials.facebook.url);
      if (safeUrl !== '#') {
        html += `
          <a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener" class="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-medium text-xs flex items-center gap-1.5 shadow-sm transition">
            <i data-lucide="facebook" class="w-3.5 h-3.5 text-blue-500"></i>
            <span>${escapeHtml(socials.facebook.label || 'Facebook')}</span>
          </a>
        `;
      }
    }
    if (socials.discord && socials.discord.enabled && socials.discord.url) {
      const safeUrl = sanitizeUrl(socials.discord.url);
      if (safeUrl !== '#') {
        html += `
          <a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener" class="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 font-medium text-xs flex items-center gap-1.5 shadow-sm transition">
            <i data-lucide="disc" class="w-3.5 h-3.5 text-indigo-500"></i>
            <span>${escapeHtml(socials.discord.label || 'Discord')}</span>
          </a>
        `;
      }
    }
    socialContainer.innerHTML = html;
  }
}

// Switch between Feed Tabs ('all', '+1', '-1')
function switchFeedTab(tab) {
  state.currentTab = tab;

  const btnAll = document.getElementById('feed-tab-all');
  const btnPlus = document.getElementById('feed-tab-plus');
  const btnMinus = document.getElementById('feed-tab-minus');

  const activeClass = 'bg-slate-900 text-white shadow-sm font-bold border-transparent';
  const inactiveClass = 'bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50';

  if (btnAll) {
    btnAll.className = `px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 ${tab === 'all' ? activeClass : inactiveClass}`;
  }
  if (btnPlus) {
    btnPlus.className = `px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 ${tab === '+1' ? 'bg-emerald-600 text-white shadow-sm font-bold border-transparent' : inactiveClass}`;
  }
  if (btnMinus) {
    btnMinus.className = `px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 ${tab === '-1' ? 'bg-rose-600 text-white shadow-sm font-bold border-transparent' : inactiveClass}`;
  }

  renderFeed();
}

// Master Render Feed (Credits or Reviews)
function renderFeed() {
  const grid = document.getElementById('credits-grid');
  const empty = document.getElementById('empty-state');
  const countLabel = document.getElementById('result-count-label');
  const headerTotal = document.getElementById('header-total-count');

  if (headerTotal) headerTotal.textContent = state.credits.length;
  if (!grid) return;

  if (state.currentTab === 'all') {
    // 1. RENDER STORE CREDITS
    const items = state.credits || [];
    if (countLabel) countLabel.textContent = `เครดิตทั้งหมด: ${items.length} รายการ`;

    if (items.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    grid.innerHTML = items.map(credit => {
      const rawImage = (credit.images && credit.images.length > 0) ? credit.images[0] : '/images/placeholder-credit.svg';
      const mainImage = sanitizeImageUrl(rawImage);
      const imageCount = credit.images ? credit.images.length : 1;
      const formattedPrice = credit.price ? `฿${Number(credit.price).toLocaleString('th-TH')}` : '';
      const displayTime = formatRelativeTime(credit.date || credit.createdAt);
      const customerName = credit.customer ? escapeHtml(credit.customer) : 'ลูกค้า';

      return `
        <div class="clean-card overflow-hidden flex flex-col justify-between group">
          <div
            onclick="openLightbox('${credit.id}')"
            class="relative w-full h-64 sm:h-72 bg-slate-100 cursor-pointer overflow-hidden"
          >
            <img
              src="${escapeHtml(mainImage)}"
              alt="${escapeHtml(credit.title)}"
              class="w-full h-full object-cover zoomable-thumb"
              loading="lazy"
              onerror="this.src='/images/placeholder-credit.svg'"
            >
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition flex items-center justify-center">
              <span class="opacity-0 group-hover:opacity-100 transition px-3 py-1.5 bg-white/95 text-slate-800 text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5">
                <i data-lucide="maximize-2" class="w-3.5 h-3.5 text-amber-500"></i> คลิกดูรูปเต็ม
              </span>
            </div>

            ${credit.isPinned ? `
              <span class="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-500 text-white shadow-sm flex items-center gap-1">
                <i data-lucide="star" class="w-3.5 h-3.5 fill-white text-white"></i> ปักหมุด
              </span>
            ` : ''}

            ${imageCount > 1 ? `
              <span class="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs font-semibold backdrop-blur-sm">
                ${imageCount} รูป
              </span>
            ` : ''}
          </div>

          <div class="p-4 flex-grow flex flex-col justify-between bg-white">
            <div>
              <h3 class="font-heading font-bold text-sm sm:text-base text-slate-900 mb-1.5 group-hover:text-amber-600 transition-colors">
                ${escapeHtml(credit.title)}
              </h3>
              ${credit.description ? `
                <p class="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                  "${escapeHtml(credit.description)}"
                </p>
              ` : ''}
            </div>

            <div>
              <div class="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div class="flex items-center gap-1.5 truncate">
                  <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
                  <span class="font-semibold text-slate-800 truncate">${customerName}</span>
                  <span class="text-slate-300">•</span>
                  <span class="text-slate-400 text-[11px] shrink-0">${displayTime}</span>
                </div>
                ${formattedPrice ? `
                  <div class="font-heading font-black text-base text-slate-900 shrink-0 ml-2">
                    ${formattedPrice}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } else {
    // 2. RENDER CUSTOMER REVIEWS (+1 or -1)
    const targetType = state.currentTab; // '+1' or '-1'
    let filtered = (state.reviews || []).filter(r => r.type === targetType);

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.message && r.message.toLowerCase().includes(q))
      );
    }

    if (countLabel) {
      countLabel.textContent = targetType === '+1'
        ? `รีวิว +1 จากลูกค้า: ${filtered.length} รายการ`
        : `รายงาน -1 พร้อมหลักฐาน: ${filtered.length} รายการ`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (empty) {
        empty.classList.remove('hidden');
        const emptyTitle = empty.querySelector('h3');
        if (emptyTitle) {
          emptyTitle.textContent = targetType === '+1'
            ? 'ยังไม่มีรีวิว +1 จากลูกค้า (เป็นคนแรกที่กดให้ร้านได้เลย!)'
            : 'ไม่มีรายงาน -1 (ร้านนี้ประวัติดี 100% ปลอดภัย)';
        }
      }
      return;
    }
    if (empty) empty.classList.add('hidden');

    grid.innerHTML = filtered.map(rev => {
      const isPlus = (rev.type === '+1');
      const hasImages = rev.images && rev.images.length > 0;
      const mainImg = hasImages ? sanitizeImageUrl(rev.images[0]) : null;
      const initial = (rev.customerName || 'ล').charAt(0).toUpperCase();

      return `
        <div class="clean-card overflow-hidden flex flex-col justify-between group ${isPlus ? 'border-emerald-100 hover:border-emerald-300' : 'border-rose-200 hover:border-rose-300'}">

          ${hasImages ? `
            <div
              onclick="openLightbox('${rev.id}')"
              class="relative w-full h-60 sm:h-64 bg-slate-100 cursor-pointer overflow-hidden"
            >
              <img
                src="${escapeHtml(mainImg)}"
                alt="หลักฐานรีวิว"
                class="w-full h-full object-cover zoomable-thumb"
                loading="lazy"
              >
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition flex items-center justify-center">
                <span class="opacity-0 group-hover:opacity-100 transition px-3 py-1.5 bg-white/95 text-slate-800 text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5">
                  <i data-lucide="maximize-2" class="w-3.5 h-3.5 ${isPlus ? 'text-emerald-600' : 'text-rose-600'}"></i> คลิกดูรูปหลักฐาน
                </span>
              </div>
              <span class="absolute top-3 left-3 px-2.5 py-1 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1 ${isPlus ? 'bg-emerald-600' : 'bg-rose-600'}">
                ${isPlus ? '👍 +1 เครดิตร้าน' : '⚠️ -1 รายงานปัญหา'}
              </span>
              ${rev.images.length > 1 ? `
                <span class="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-black/70 text-white text-[11px] font-semibold backdrop-blur-sm">
                  ${rev.images.length} รูป
                </span>
              ` : ''}
            </div>
          ` : `
            <div class="p-4 pb-0 flex items-center justify-between">
              <span class="px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${isPlus ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}">
                ${isPlus ? '👍 +1 เครดิตร้าน' : '⚠️ -1 รายงานปัญหา'}
              </span>
              <span class="text-[11px] text-slate-400">${formatRelativeTime(rev.createdAt)}</span>
            </div>
          `}

          <div class="p-4 flex-grow flex flex-col justify-between bg-white">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <div class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isPlus ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                  ${initial}
                </div>
                <div class="truncate">
                  <span class="font-heading font-bold text-sm text-slate-900 block truncate">${escapeHtml(rev.customerName || 'ลูกค้าทั่วไป')}</span>
                </div>
              </div>

              ${rev.message ? `
                <p class="text-xs p-3 rounded-xl border leading-relaxed ${isPlus ? 'text-slate-700 bg-emerald-50/40 border-emerald-100' : 'text-rose-900 bg-rose-50 border-rose-100 font-medium'}">
                  "${escapeHtml(rev.message)}"
                </p>
              ` : `
                <p class="text-xs text-slate-400 italic p-2">
                  (ผู้ใช้ไม่ได้ระบุข้อความเพิ่มเติม)
                </p>
              `}
            </div>

            <div class="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span class="flex items-center gap-1 ${isPlus ? 'text-emerald-700' : 'text-rose-600 font-semibold'}">
                <i data-lucide="${isPlus ? 'check-circle-2' : 'shield-alert'}" class="w-3.5 h-3.5"></i>
                ${isPlus ? 'รีวิวจากลูกค้าจริง' : 'มีหลักฐานยืนยัน'}
              </span>
              <span>${formatRelativeTime(rev.createdAt)}</span>
            </div>
          </div>

        </div>
      `;
    }).join('');
  }

  updateIcons();
}

// Search handling
let searchTimeout = null;

function handleSearchSubmit(e) {
  if (e) e.preventDefault();
  clearTimeout(searchTimeout);
  const input = document.getElementById('search-input');
  if (input) {
    state.searchQuery = input.value.trim();
  }
  if (state.currentTab === 'all') {
    fetchCredits();
  } else {
    renderFeed();
  }
}

function handleSearchInput(e) {
  const val = e.target.value;
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) {
    if (val) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.searchQuery = val.trim();
    if (state.currentTab === 'all') {
      fetchCredits();
    } else {
      renderFeed();
    }
  }, 300);
}

function clearSearch() {
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) clearBtn.classList.add('hidden');
  state.searchQuery = '';
  if (state.currentTab === 'all') {
    fetchCredits();
  } else {
    renderFeed();
  }
}

// ========================
// CUSTOMER REVIEW MODAL (+1 / -1)
// ========================

function openReviewModal(defaultType = '+1') {
  const modal = document.getElementById('review-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setReviewType(defaultType);
  }
}

function closeReviewModal() {
  const modal = document.getElementById('review-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
  state.reviewFiles = [];
  const form = document.getElementById('customer-review-form');
  if (form) form.reset();
  const preview = document.getElementById('review-preview-container');
  if (preview) {
    preview.innerHTML = '';
    preview.classList.add('hidden');
  }
}

function setReviewType(type) {
  const isPlus = (type === '+1');
  const typeInput = document.getElementById('review-type-input');
  if (typeInput) typeInput.value = isPlus ? '+1' : '-1';

  const btnPlus = document.getElementById('btn-type-plus');
  const btnMinus = document.getElementById('btn-type-minus');
  const noticeBox = document.getElementById('review-notice-box');
  const noticeText = document.getElementById('review-notice-text');
  const submitBtn = document.getElementById('btn-submit-review');
  const submitText = document.getElementById('btn-submit-text');
  const msgReq = document.getElementById('message-required-indicator');
  const imgReq = document.getElementById('image-required-indicator');

  if (btnPlus && btnMinus) {
    if (isPlus) {
      btnPlus.className = 'py-3 px-4 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm';
      btnMinus.className = 'py-3 px-4 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-700';
    } else {
      btnPlus.className = 'py-3 px-4 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700';
      btnMinus.className = 'py-3 px-4 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer bg-rose-50 border-rose-500 text-rose-800 shadow-sm';
    }
  }

  if (noticeBox && noticeText) {
    if (isPlus) {
      noticeBox.className = 'p-3 rounded-2xl text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2';
      noticeText.textContent = 'กด +1 พร้อมพิมพ์ข้อความรีวิวเองได้ถ้ามี และแนบหลักฐานการซื้อขายเพื่อกันสแปมครับ';
    } else {
      noticeBox.className = 'p-3 rounded-2xl text-xs bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2';
      noticeText.textContent = '⚠️ เพื่อความยุติธรรมและโปร่งใส การกด -1 จำเป็นต้องแนบหลักฐาน (ภาพแชทหรือสลิป) และระบุปัญหาที่พบ';
    }
  }

  if (msgReq) {
    msgReq.textContent = isPlus ? '(ไม่บังคับ)' : '* (จำเป็น)';
    msgReq.className = isPlus ? 'text-slate-400 font-normal text-[11px]' : 'text-rose-600 font-bold text-[11px]';
  }
  if (imgReq) {
    imgReq.textContent = '* (จำเป็นต้องแนบหลักฐาน)';
    imgReq.className = 'text-rose-600 font-bold text-[11px]';
  }

  if (submitBtn && submitText) {
    if (isPlus) {
      submitBtn.className = 'w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-2xl text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer';
      submitText.textContent = 'ส่งรีวิว +1 พร้อมหลักฐาน';
    } else {
      submitBtn.className = 'w-full py-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold rounded-2xl text-sm shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2 cursor-pointer';
      submitText.textContent = 'ส่งรายงาน -1 พร้อมหลักฐาน';
    }
  }

  updateIcons();
}

function handleReviewFileChange(e) {
  const files = Array.from(e.target.files);
  if (!files || files.length === 0) return;

  state.reviewFiles = [...state.reviewFiles, ...files].slice(0, 5);
  renderReviewPreviews();
}

function renderReviewPreviews() {
  const preview = document.getElementById('review-preview-container');
  if (!preview) return;

  if (state.reviewFiles.length === 0) {
    preview.innerHTML = '';
    preview.classList.add('hidden');
    return;
  }

  preview.classList.remove('hidden');
  preview.innerHTML = state.reviewFiles.map((file, idx) => {
    const url = URL.createObjectURL(file);
    return `
      <div class="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
        <img src="${url}" class="w-full h-full object-cover">
        <button
          type="button"
          onclick="removeReviewFile(${idx})"
          class="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-xs transition cursor-pointer"
        >
          &times;
        </button>
      </div>
    `;
  }).join('');
}

function removeReviewFile(idx) {
  state.reviewFiles.splice(idx, 1);
  renderReviewPreviews();
}

let isSubmittingReview = false;

async function submitCustomerReview(e) {
  e.preventDefault();
  if (isSubmittingReview) return; // Prevent double submit

  const type = document.getElementById('review-type-input')?.value || '+1';
  const name = document.getElementById('review-name-input')?.value?.trim();
  const message = document.getElementById('review-message-input')?.value?.trim();
  const btn = document.getElementById('btn-submit-review');
  const btnText = document.getElementById('btn-submit-text');

  // Strict Validation: Both +1 and -1 require proof photo to prevent spam!
  if (!state.reviewFiles || state.reviewFiles.length === 0) {
    showToast(type === '+1'
      ? 'การกด +1 จำเป็นต้องแนบรูปภาพหลักฐานการซื้อขาย (สลิปหรือภาพแชท) เพื่อป้องกันสแปม'
      : 'การกด -1 จำเป็นต้องแนบรูปภาพหลักฐานอย่างน้อย 1 รูป', 'error');
    return;
  }

  if (type === '-1' && !message) {
    showToast('กรุณากรอกข้อความระบุปัญหาที่พบสำหรับการรายงาน -1', 'error');
    return;
  }

  isSubmittingReview = true;
  const originalBtnContent = btnText ? btnText.textContent : 'ส่งข้อมูล';
  if (btn) {
    btn.disabled = true;
    btn.classList.add('opacity-75', 'cursor-not-allowed');
    if (btnText) btnText.textContent = 'กำลังส่งข้อมูล... กรุณารอสักครู่';
  }

  try {
    const fd = new FormData();
    fd.append('type', type);
    fd.append('customerName', name || 'ลูกค้าทั่วไป');
    fd.append('message', message || '');
    state.reviewFiles.forEach(f => fd.append('images', f));

    const res = await fetch('/api/public/reviews', {
      method: 'POST',
      body: fd
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message || 'ส่งรีวิวเรียบร้อยแล้ว!', 'success');
      closeReviewModal();
      await fetchReviews();
      switchFeedTab(type); // automatically switch to that tab to view it!
    } else {
      showToast(data.message || 'ไม่สามารถส่งรีวิวได้', 'error');
    }
  } catch (err) {
    console.error('Error submitting review:', err);
    showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง', 'error');
  } finally {
    isSubmittingReview = false;
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
      if (btnText) btnText.textContent = originalBtnContent;
    }
  }
}

// Modal Backdrop Click Handlers
function handleLightboxBackdropClick(e) {
  if (e.target.id === 'lightbox-modal') {
    closeLightbox();
  }
}

function handleReviewBackdropClick(e) {
  if (e.target.id === 'review-modal') {
    closeReviewModal();
  }
}

// ========================
// LIGHTBOX MODAL
// ========================

function openLightbox(id) {
  // Find in credits or reviews
  const credit = state.credits.find(c => c.id === id);
  const review = state.reviews.find(r => r.id === id);
  const item = credit || review;

  if (!item) return;

  state.lightbox.item = item;
  state.lightbox.currentImageIndex = 0;

  const modal = document.getElementById('lightbox-modal');
  const title = document.getElementById('lightbox-title');
  const desc = document.getElementById('lightbox-description');
  const price = document.getElementById('lightbox-price');
  const customer = document.getElementById('lightbox-customer');
  const date = document.getElementById('lightbox-date');

  if (credit) {
    if (title) title.textContent = credit.title;
    if (desc) desc.textContent = credit.description || 'ไม่มีคำอธิบายเพิ่มเติม';
    if (price) price.textContent = credit.price ? `฿${Number(credit.price).toLocaleString('th-TH')}` : '';
    if (customer) customer.textContent = credit.customer || 'ลูกค้าไม่ระบุชื่อ';
    if (date) date.textContent = credit.date || '-';
  } else if (review) {
    const isPlus = (review.type === '+1');
    if (title) title.textContent = isPlus ? 'รีวิว +1 จากลูกค้า' : 'รายงาน -1 พร้อมหลักฐาน';
    if (desc) desc.textContent = review.message || '(ไม่มีข้อความเพิ่มเติม)';
    if (price) price.textContent = isPlus ? '+1 เครดิต' : '-1 รายงาน';
    if (customer) customer.textContent = review.customerName || 'ลูกค้าทั่วไป';
    if (date) date.textContent = formatRelativeTime(review.createdAt);
  }

  updateLightboxImage();
  if (modal) modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Deep-link URL sync
  try {
    const url = new URL(window.location);
    url.searchParams.set('credit', id);
    window.history.replaceState({}, '', url);
  } catch (e) {}

  updateIcons();
}

function updateLightboxImage() {
  const item = state.lightbox.item;
  if (!item || !item.images || item.images.length === 0) return;

  const currentIdx = state.lightbox.currentImageIndex;
  const currentSrc = sanitizeImageUrl(item.images[currentIdx]);

  const imgEl = document.getElementById('lightbox-img');
  const openExt = document.getElementById('lightbox-open-external');
  const prevBtn = document.getElementById('lightbox-prev-btn');
  const nextBtn = document.getElementById('lightbox-next-btn');
  const thumbStrip = document.getElementById('lightbox-thumbnails');

  if (imgEl) {
    imgEl.src = currentSrc;
    imgEl.style.transform = 'scale(1)';
  }
  if (openExt) {
    const safeExt = sanitizeUrl(currentSrc);
    openExt.href = safeExt !== '#' ? safeExt : '#';
  }

  // Multiple images navigation
  if (item.images.length > 1) {
    if (prevBtn) prevBtn.classList.remove('hidden');
    if (nextBtn) nextBtn.classList.remove('hidden');

    if (thumbStrip) {
      thumbStrip.classList.remove('hidden');
      thumbStrip.innerHTML = item.images.map((img, i) => `
        <img
          src="${escapeHtml(sanitizeImageUrl(img))}"
          onclick="setLightboxImageIndex(${i})"
          class="w-12 h-12 rounded-lg object-cover cursor-pointer border-2 transition ${i === currentIdx ? 'border-amber-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}"
        >
      `).join('');
    }
  } else {
    if (prevBtn) prevBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');
    if (thumbStrip) thumbStrip.classList.add('hidden');
  }
}

function prevLightboxImage() {
  const images = state.lightbox.item?.images || [];
  if (images.length <= 1) return;
  state.lightbox.currentImageIndex = (state.lightbox.currentImageIndex - 1 + images.length) % images.length;
  updateLightboxImage();
}

function nextLightboxImage() {
  const images = state.lightbox.item?.images || [];
  if (images.length <= 1) return;
  state.lightbox.currentImageIndex = (state.lightbox.currentImageIndex + 1) % images.length;
  updateLightboxImage();
}

function setLightboxImageIndex(idx) {
  state.lightbox.currentImageIndex = idx;
  updateLightboxImage();
}

function toggleZoomImage(el) {
  if (el.style.transform === 'scale(1.6)') {
    el.style.transform = 'scale(1)';
    el.style.cursor = 'zoom-in';
  } else {
    el.style.transform = 'scale(1.6)';
    el.style.cursor = 'zoom-out';
  }
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';

  try {
    const url = new URL(window.location);
    url.searchParams.delete('credit');
    window.history.replaceState({}, '', url);
  } catch (e) {}
}

function copyCreditLink() {
  const url = window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('คัดลอกลิงก์เรียบร้อยแล้ว!');
    }).catch(() => {
      prompt('คัดลอกลิงก์:', url);
    });
  } else {
    prompt('คัดลอกลิงก์:', url);
  }
}

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
    closeReviewModal();
  } else if (e.key === 'ArrowLeft') {
    prevLightboxImage();
  } else if (e.key === 'ArrowRight') {
    nextLightboxImage();
  }
});

// Utility: HTML Escaping & URL Sanitization
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeUrl(rawUrl, fallback = '#') {
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed || /[\u0000-\u001F\u007F-\u009F]/.test(trimmed)) return fallback;
  if (trimmed.startsWith('#')) return /^#[a-zA-Z0-9_\-\u0E00-\u0E7F]*$/.test(trimmed) ? trimmed : fallback;
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return fallback;
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.href;
    return fallback;
  } catch {
    return fallback;
  }
}

function sanitizeImageUrl(rawUrl, fallback = '/images/placeholder-credit.svg') {
  const safe = sanitizeUrl(rawUrl, fallback);
  return (safe === '#' || !safe) ? fallback : safe;
}
