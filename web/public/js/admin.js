// ========================================================
// SUNFZ - Dedicated Admin Web App Logic
// Handles PIN auth, credit CRUD, image upload, settings & backup
// ========================================================

const adminState = {
  isAuthenticated: false,
  shopSlug: 'sunfz',
  shopName: 'SUNFZENITH',
  content: null,
  credits: [],
  portfolio: [],
  portfolioFilter: 'all',
  portfolioSearch: '',
  selectedPortfolioFile: null,
  reviews: [],
  reviewFilter: 'all',
  settings: {},
  activeTab: 'home',
  selectedFiles: [],
  // Edit mode state
  editingCredit: null,
  editNewFiles: [],
  editRemainingImages: []
};

// Detect shop from URL
function detectShopSlug() {
  const pathParts = window.location.pathname.split('/');
  if (pathParts[1] === 's' && pathParts[2]) {
    return pathParts[2].split('?')[0].toLowerCase();
  }
  const urlParams = new URLSearchParams(window.location.search);
  const shopParam = urlParams.get('shop');
  if (shopParam) return shopParam.toLowerCase();
  return 'sunfz';
}

// Initialize Admin App
document.addEventListener('DOMContentLoaded', async () => {
  setupUploadDropzone();
  
  // Pre-fill shop slug if in URL
  const slugInput = document.getElementById('login-shop-slug');
  const detected = detectShopSlug();
  if (slugInput && detected) {
    slugInput.value = detected;
  }
  
  await checkSession();
  updateIcons();
});

// Helper for Lucide icons
function updateIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Toast Notifications
function showAdminToast(message, type = 'success') {
  const container = document.getElementById('admin-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass = type === 'error' ? 'bg-rose-900 border-rose-700 text-rose-100' : 'bg-slate-900 border-amber-500/40 text-slate-100';
  const icon = type === 'error' ? 'alert-circle' : 'check-circle-2';

  toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl text-xs sm:text-sm font-semibold transition-all duration-300 transform translate-y-2 opacity-0 ${bgClass}`;
  toast.innerHTML = `
    <i data-lucide="${icon}" class="w-4 h-4 shrink-0 ${type === 'error' ? 'text-rose-400' : 'text-amber-400'}"></i>
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

// Admin API Headers helper
function getAdminHeaders(extra = {}) {
  const token = localStorage.getItem('admin_token');
  const headers = { ...extra };
  if (token) {
    headers['x-admin-token'] = token;
  }
  return headers;
}

// Check session
async function checkSession() {
  try {
    const res = await fetch('/api/admin/check', {
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (data.success && data.isAdmin) {
      adminState.shopSlug = data.shopSlug || 'sunfz';
      adminState.shopName = data.shopName || 'SUNFZ';
      showDashboardView();
      await loadDashboardData();
    } else {
      showLoginView();
    }
  } catch (err) {
    showLoginView();
  }
}

// Switch between Login and Dashboard screens
function showLoginView() {
  adminState.isAuthenticated = false;
  document.getElementById('login-view').classList.remove('hidden');
  document.getElementById('dashboard-view').classList.add('hidden');
  const pinInput = document.getElementById('login-pin-input');
  if (pinInput) {
    pinInput.value = '';
    setTimeout(() => pinInput.focus(), 150);
  }
  updateIcons();
}

function showDashboardView() {
  adminState.isAuthenticated = true;
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('dashboard-view').classList.remove('hidden');

  // Update navbar shop name & public link
  const navName = document.getElementById('admin-nav-shop-name');
  const pubLink = document.getElementById('admin-public-link');
  if (navName) navName.textContent = 'SUNFZ';
  if (pubLink) pubLink.href = '/';

  updateIcons();
}

// Handle Login Submission
async function handleLoginSubmit(e) {
  e.preventDefault();
  const pinInput = document.getElementById('login-pin-input');
  const errorAlert = document.getElementById('login-error-alert');
  const errorText = document.getElementById('login-error-text');
  const submitBtn = document.getElementById('btn-login');

  const pin = pinInput.value.trim();
  if (!pin) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>กำลังตรวจสอบ...</span>`;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, shopSlug: 'sunfz' })
    });
    const data = await res.json();

    if (data.success) {
      if (data.token) {
        localStorage.setItem('admin_token', data.token);
      }
      adminState.shopSlug = data.shopSlug;
      adminState.shopName = data.shopName;
      errorAlert.classList.add('hidden');
      showAdminToast(`เข้าสู่ระบบร้าน "${data.shopName}" สำเร็จ!`);
      showDashboardView();
      await loadDashboardData();
    } else {
      errorText.textContent = data.message || 'รหัส PIN ไม่ถูกต้อง';
      errorAlert.classList.remove('hidden');
      pinInput.select();
    }
  } catch (err) {
    errorText.textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
    errorAlert.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <i data-lucide="log-in" class="w-4 h-4"></i>
      <span>เข้าสู่ระบบแอดมิน</span>
    `;
    updateIcons();
  }
}

// Handle Logout
async function handleLogout() {
  if (!confirm('ต้องการออกจากระบบแอดมินใช่หรือไม่?')) return;
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      headers: getAdminHeaders()
    });
  } catch (e) {}
  localStorage.removeItem('admin_token');
  showLoginView();
  showAdminToast('ออกจากระบบเรียบร้อยแล้ว');
}

// Load all Dashboard data
async function loadDashboardData() {
  await Promise.all([
    fetchAdminContent(),
    fetchAdminCredits(),
    fetchAdminSettings(),
    fetchAdminReviews(),
    fetchAdminPortfolio()
  ]);
  updateDashboardStats();
}

// Fetch site CMS content (branding, services, pricing, socials)
async function fetchAdminContent() {
  try {
    const res = await fetch('/api/admin/content', {
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (data.success && data.content) {
      adminState.content = data.content;
      populateGeneralForm();
      populateSocialsForm();
      renderAdminServices();
      renderAdminPricing();

      const srvCount = document.getElementById('tab-services-count');
      const prcCount = document.getElementById('tab-pricing-count');
      if (srvCount) srvCount.textContent = (data.content.services || []).length;
      if (prcCount) prcCount.textContent = (data.content.pricing || []).length;
    }
  } catch (err) {
    console.error('Failed to load admin site content:', err);
  }
}

// Fetch all credits for this shop
async function fetchAdminCredits() {
  try {
    const res = await fetch(`/api/public/credits?shop=${encodeURIComponent(adminState.shopSlug)}`);
    const data = await res.json();
    if (data.success) {
      adminState.credits = data.credits || [];
      renderCreditsList();
      updateDashboardStats();
    }
  } catch (err) {
    console.error('Failed to load credits:', err);
  }
}

// Fetch shop settings for this shop
async function fetchAdminSettings() {
  try {
    const res = await fetch(`/api/public/settings?shop=${encodeURIComponent(adminState.shopSlug)}`);
    const data = await res.json();
    if (data.success) {
      adminState.settings = data.settings || {};
      adminState.shopName = data.settings.shopName || adminState.shopName;
      populateSettingsForm();
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

// Update Overview Stats
function updateDashboardStats() {
  const credits = adminState.credits;
  const totalCount = credits.length;
  const totalSales = credits.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
  const pinnedCount = credits.filter(c => c.isPinned).length;

  const statCredits = document.getElementById('stat-total-credits');
  const statSales = document.getElementById('stat-total-sales');
  const statPinned = document.getElementById('stat-pinned-count');
  const tabListCount = document.getElementById('tab-list-count');

  if (statCredits) statCredits.textContent = totalCount.toLocaleString('th-TH');
  if (statSales) statSales.textContent = `฿${totalSales.toLocaleString('th-TH')}`;
  if (statPinned) statPinned.textContent = pinnedCount.toLocaleString('th-TH');
  if (tabListCount) tabListCount.textContent = totalCount;
}

// Tab Switching
function switchTab(tabId) {
  adminState.activeTab = tabId;

  // Toggle button styles
  const tabs = ['home', 'services', 'pricing', 'portfolio', 'socials', 'add', 'list', 'reviews', 'settings'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const content = document.getElementById(`tab-content-${t}`);
    if (t === tabId) {
      if (btn) {
        btn.classList.add('bg-slate-900', 'text-white', 'shadow-sm');
        btn.classList.remove('text-slate-600', 'hover:text-slate-900');
      }
      if (content) content.classList.remove('hidden');
    } else {
      if (btn) {
        btn.classList.remove('bg-slate-900', 'text-white', 'shadow-sm');
        btn.classList.add('text-slate-600', 'hover:text-slate-900');
      }
      if (content) content.classList.add('hidden');
    }
  });

  if (tabId === 'home') {
    populateGeneralForm();
  } else if (tabId === 'services') {
    renderAdminServices();
  } else if (tabId === 'pricing') {
    renderAdminPricing();
  } else if (tabId === 'socials') {
    populateSocialsForm();
  } else if (tabId === 'list') {
    renderCreditsList();
  } else if (tabId === 'portfolio') {
    fetchAdminPortfolio();
  } else if (tabId === 'reviews') {
    fetchAdminReviews();
  }

  updateIcons();
}

// Fetch and render customer reviews in admin
async function fetchAdminReviews() {
  try {
    const res = await fetch('/api/public/reviews');
    const data = await res.json();
    if (data.success) {
      adminState.reviews = data.reviews || [];
      const posCount = (data.counts && data.counts.positive) || 0;
      const negCount = (data.counts && data.counts.negative) || 0;

      const tabCount = document.getElementById('tab-reviews-count');
      const countPlus = document.getElementById('admin-count-plus');
      const countMinus = document.getElementById('admin-count-minus');

      if (tabCount) tabCount.textContent = adminState.reviews.length;
      if (countPlus) countPlus.textContent = posCount;
      if (countMinus) countMinus.textContent = negCount;

      renderAdminReviews();
    }
  } catch (err) {
    console.error('Failed to load admin reviews:', err);
  }
}

function filterAdminReviews(filterType) {
  adminState.reviewFilter = filterType;

  const btnAll = document.getElementById('admin-rev-filter-all');
  const btnPlus = document.getElementById('admin-rev-filter-plus');
  const btnMinus = document.getElementById('admin-rev-filter-minus');

  if (btnAll && btnPlus && btnMinus) {
    btnAll.className = `px-3 py-1 rounded-lg transition cursor-pointer ${filterType === 'all' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-700'}`;
    btnPlus.className = `px-3 py-1 rounded-lg transition cursor-pointer ${filterType === '+1' ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`;
    btnMinus.className = `px-3 py-1 rounded-lg transition cursor-pointer ${filterType === '-1' ? 'bg-rose-600 text-white font-bold' : 'bg-rose-50 text-rose-800 border border-rose-200'}`;
  }

  renderAdminReviews();
}

function renderAdminReviews() {
  const container = document.getElementById('admin-reviews-list');
  if (!container) return;

  const filter = adminState.reviewFilter || 'all';
  let list = adminState.reviews || [];
  if (filter !== 'all') {
    list = list.filter(r => r.type === filter);
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="clean-card p-8 text-center text-slate-400">
        <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
        <p class="text-xs">ยังไม่มีรีวิวในหมวดหมู่นี้</p>
      </div>
    `;
    updateIcons();
    return;
  }

  container.innerHTML = list.map(r => {
    const isPlus = (r.type === '+1');
    const images = Array.isArray(r.images) ? r.images : [];
    return `
      <div class="clean-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 border ${isPlus ? 'border-emerald-100' : 'border-rose-200'}">
        <div class="space-y-2 flex-grow">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold ${isPlus ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
              ${isPlus ? '👍 +1 เครดิต' : '⚠️ -1 รายงานปัญหา'}
            </span>
            <span class="font-bold text-slate-900 text-sm">${escapeHtml(r.customerName || 'ลูกค้าทั่วไป')}</span>
            <span class="text-xs text-slate-400">• ${new Date(r.createdAt).toLocaleString('th-TH')}</span>
          </div>

          <p class="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
            "${escapeHtml(r.message || '(ไม่มีข้อความเพิ่มเติม)')}"
          </p>

          ${images.length > 0 ? `
            <div class="flex flex-wrap items-center gap-2 pt-1">
              <span class="text-[11px] font-semibold text-slate-500">รูปภาพหลักฐาน (${images.length}):</span>
              ${images.map(img => `
                <a href="${img}" target="_blank" class="block w-14 h-14 rounded-lg overflow-hidden border border-slate-200 hover:border-amber-500 transition">
                  <img src="${img}" class="w-full h-full object-cover">
                </a>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div class="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
          <button 
            onclick="deleteAdminReview('${r.id}')"
            class="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="ลบรีวิวนี้"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>ลบรีวิว</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  updateIcons();
}

async function deleteAdminReview(id) {
  if (!confirm('คุณต้องการลบรีวิวนี้ใช่หรือไม่?')) return;

  try {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast('ลบรีวิวเรียบร้อยแล้ว');
      await fetchAdminReviews();
    } else {
      showAdminToast(data.message || 'ไม่สามารถลบรีวิวได้', 'error');
    }
  } catch (err) {
    showAdminToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
  }
}

// ========================
// FILE DRAG & DROP FOR ADD
// ========================
function setupUploadDropzone() {
  const dropzone = document.getElementById('upload-dropzone');
  if (!dropzone) return;

  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('border-amber-500', 'bg-amber-50/40');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('border-amber-500', 'bg-amber-50/40');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    addSelectedFiles(files);
  });
}

function handleFilesSelected(e) {
  addSelectedFiles(e.target.files);
}

function addSelectedFiles(files) {
  if (!files || files.length === 0) return;
  const remainingSlots = 5 - adminState.selectedFiles.length;
  if (remainingSlots <= 0) {
    showAdminToast('เลือกรูปภาพได้สูงสุด 5 รูปต่อครั้ง', 'error');
    return;
  }

  const validFiles = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, remainingSlots);
  adminState.selectedFiles = [...adminState.selectedFiles, ...validFiles];
  renderUploadPreviews();
}

function removeSelectedFile(index) {
  adminState.selectedFiles.splice(index, 1);
  renderUploadPreviews();
}

function renderUploadPreviews() {
  const container = document.getElementById('upload-preview-container');
  if (!container) return;

  if (adminState.selectedFiles.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = adminState.selectedFiles.map((file, idx) => {
    const objectUrl = URL.createObjectURL(file);
    return `
      <div class="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-sm">
        <img src="${objectUrl}" class="w-full h-full object-cover">
        <button 
          type="button" 
          onclick="removeSelectedFile(${idx})" 
          class="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow transition"
          title="ลบรูปนี้"
        >
          <i data-lucide="x" class="w-3 h-3"></i>
        </button>
      </div>
    `;
  }).join('');

  updateIcons();
}

// ========================
// CREATE NEW CREDIT
// ========================
async function handleCreateCredit(e) {
  e.preventDefault();

  const titleInput = document.getElementById('input-title');
  const priceInput = document.getElementById('input-price');
  const customerInput = document.getElementById('input-customer');
  const descInput = document.getElementById('input-description');
  const isPinnedInput = document.getElementById('input-is-pinned');
  const submitBtn = document.getElementById('btn-submit-credit');

  const title = titleInput.value.trim();
  if (!title) {
    showAdminToast('กรุณากรอกชื่อสินค้า / สิ่งที่ขาย', 'error');
    return;
  }

  if (adminState.selectedFiles.length === 0) {
    showAdminToast('กรุณาเลือกรูปภาพสลิปหรือหลักฐานอย่างน้อย 1 รูป', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>กำลังอัปโหลดและบันทึก...</span>`;

  try {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('game', 'ทั่วไป'); // Default to flexible category
    if (priceInput.value) formData.append('price', priceInput.value);
    if (customerInput.value) formData.append('customer', customerInput.value);
    if (descInput.value) formData.append('description', descInput.value);
    formData.append('isPinned', isPinnedInput.checked);

    adminState.selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    const res = await fetch('/api/admin/credits', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      showAdminToast('✨ เพิ่มและโพสต์เครดิตสำเร็จเรียบร้อย!');
      
      // Reset form
      document.getElementById('new-credit-form').reset();
      adminState.selectedFiles = [];
      renderUploadPreviews();

      // Refresh credits and switch to list tab
      await fetchAdminCredits();
      switchTab('list');
    } else {
      showAdminToast(data.message || 'บันทึกไม่สำเร็จ', 'error');
    }
  } catch (err) {
    showAdminToast('เกิดข้อผิดพลาดในการบันทึกเครดิต', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <i data-lucide="check-circle" class="w-4 h-4"></i>
      <span>บันทึกและโพสต์เครดิต</span>
    `;
    updateIcons();
  }
}

// ========================
// MANAGE CREDITS LIST
// ========================
let adminSearchQuery = '';
function handleAdminSearch(e) {
  adminSearchQuery = e.target.value.toLowerCase().trim();
  renderCreditsList();
}

function renderCreditsList() {
  const container = document.getElementById('admin-credits-container');
  const countLabel = document.getElementById('admin-filtered-count');
  if (!container) return;

  let filtered = [...adminState.credits];
  if (adminSearchQuery) {
    filtered = filtered.filter(c => 
      (c.title && c.title.toLowerCase().includes(adminSearchQuery)) ||
      (c.customer && c.customer.toLowerCase().includes(adminSearchQuery)) ||
      (c.description && c.description.toLowerCase().includes(adminSearchQuery)) ||
      (c.price && c.price.toString().includes(adminSearchQuery))
    );
  }

  if (countLabel) countLabel.textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="clean-card p-12 text-center">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-2">
          <i data-lucide="inbox" class="w-6 h-6"></i>
        </div>
        <p class="text-sm font-semibold text-slate-700">ไม่พบรายการเครดิต</p>
        <p class="text-xs text-slate-400 mt-0.5">ลองค้นหาด้วยคำอื่น หรือกดปุ่ม "เพิ่มเครดิต" ด้านบน</p>
      </div>
    `;
    updateIcons();
    return;
  }

  container.innerHTML = filtered.map(credit => {
    const mainImg = (credit.images && credit.images.length > 0) ? credit.images[0] : '/images/placeholder-credit.svg';
    const imgCount = credit.images ? credit.images.length : 1;
    const formattedPrice = credit.price ? `฿${Number(credit.price).toLocaleString('th-TH')}` : 'ไม่ระบุราคา';
    const customer = credit.customer ? escapeHtml(credit.customer) : 'ลูกค้า';
    const dateStr = credit.date || credit.createdAt?.split('T')[0] || '-';

    return `
      <div class="clean-card p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:border-slate-300">
        
        <!-- Thumbnail & Info -->
        <div class="flex items-center gap-3.5 min-w-0 w-full sm:w-auto flex-grow">
          <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
            <img 
              src="${mainImg}" 
              alt="${escapeHtml(credit.title)}" 
              class="w-full h-full object-cover"
              onerror="this.src='/images/placeholder-credit.svg'"
            >
            ${imgCount > 1 ? `
              <span class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                ${imgCount}
              </span>
            ` : ''}
          </div>

          <div class="min-w-0 flex-grow">
            <div class="flex items-center gap-2 mb-1">
              ${credit.isPinned ? `
                <span class="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 flex items-center gap-0.5 shrink-0">
                  <i data-lucide="star" class="w-3 h-3 fill-amber-500 text-amber-500"></i> ปักหมุด
                </span>
              ` : ''}
              <h4 class="font-heading font-bold text-sm sm:text-base text-slate-900 truncate">
                ${escapeHtml(credit.title)}
              </h4>
            </div>

            <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span class="font-semibold text-slate-700">${customer}</span>
              <span class="text-slate-300">•</span>
              <span class="font-bold text-emerald-600">${formattedPrice}</span>
              <span class="text-slate-300">•</span>
              <span class="text-slate-400">${dateStr}</span>
            </div>

            ${credit.description ? `
              <p class="text-xs text-slate-500 truncate mt-1 max-w-md">
                "${escapeHtml(credit.description)}"
              </p>
            ` : ''}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-1.5 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
          <button 
            onclick="togglePin('${credit.id}')" 
            class="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-xs font-semibold flex items-center gap-1 transition ${credit.isPinned ? 'text-amber-600 bg-amber-50 border-amber-300' : 'text-slate-600'}"
            title="${credit.isPinned ? 'ยกเลิกปักหมุด' : 'ปักหมุดขึ้นบนสุด'}"
          >
            <i data-lucide="star" class="w-3.5 h-3.5 ${credit.isPinned ? 'fill-amber-500 text-amber-500' : ''}"></i>
            <span>${credit.isPinned ? 'ปักหมุดแล้ว' : 'ปักหมุด'}</span>
          </button>

          <button 
            onclick="openEditModal('${credit.id}')" 
            class="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 text-xs font-semibold flex items-center gap-1 transition"
            title="แก้ไขรายละเอียด"
          >
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            <span>แก้ไข</span>
          </button>

          <button 
            onclick="deleteCredit('${credit.id}')" 
            class="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-1 transition"
            title="ลบเครดิตนี้"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>ลบ</span>
          </button>
        </div>

      </div>
    `;
  }).join('');

  updateIcons();
}

// Toggle Pin
async function togglePin(creditId) {
  try {
    const res = await fetch(`/api/admin/credits/${creditId}/pin`, {
      method: 'PUT',
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(data.message || 'อัปเดตการปักหมุดแล้ว');
      await fetchAdminCredits();
    }
  } catch (err) {
    showAdminToast('เกิดข้อผิดพลาดในการปักหมุด', 'error');
  }
}

// Delete Credit
async function deleteCredit(creditId) {
  const target = adminState.credits.find(c => c.id === creditId);
  const title = target ? `"${target.title}"` : 'รายการนี้';
  if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบเครดิต ${title}? (ลบแล้วไม่สามารถกู้คืนได้)`)) return;

  try {
    const res = await fetch(`/api/admin/credits/${creditId}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast('ลบเครดิตสำเร็จเรียบร้อยแล้ว');
      await fetchAdminCredits();
    } else {
      showAdminToast(data.message || 'ลบไม่สำเร็จ', 'error');
    }
  } catch (err) {
    showAdminToast('เกิดข้อผิดพลาดในการลบเครดิต', 'error');
  }
}

// ========================
// EDIT CREDIT MODAL
// ========================
function openEditModal(creditId) {
  const credit = adminState.credits.find(c => c.id === creditId);
  if (!credit) return;

  adminState.editingCredit = credit;
  adminState.editNewFiles = [];
  adminState.editRemainingImages = [...(credit.images || [])];

  document.getElementById('edit-credit-id').value = credit.id;
  document.getElementById('edit-title').value = credit.title || '';
  document.getElementById('edit-price').value = credit.price || '';
  document.getElementById('edit-customer').value = credit.customer || '';
  document.getElementById('edit-description').value = credit.description || '';
  document.getElementById('edit-is-pinned').checked = !!credit.isPinned;

  renderEditImagesPreview();

  const modal = document.getElementById('edit-credit-modal');
  modal.classList.remove('hidden');
  updateIcons();
}

function closeEditModal() {
  const modal = document.getElementById('edit-credit-modal');
  modal.classList.add('hidden');
  adminState.editingCredit = null;
  adminState.editNewFiles = [];
  adminState.editRemainingImages = [];
}

function renderEditImagesPreview() {
  const container = document.getElementById('edit-images-preview');
  if (!container) return;

  let html = '';

  // Existing images
  adminState.editRemainingImages.forEach((src, idx) => {
    html += `
      <div class="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
        <img src="${src}" class="w-full h-full object-cover">
        <button 
          type="button" 
          onclick="removeEditRemainingImage(${idx})" 
          class="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow"
          title="ลบรูปนี้"
        >
          <i data-lucide="x" class="w-2.5 h-2.5"></i>
        </button>
      </div>
    `;
  });

  // Newly selected files for edit
  adminState.editNewFiles.forEach((file, idx) => {
    const url = URL.createObjectURL(file);
    html += `
      <div class="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-400 bg-slate-100 shadow-sm">
        <img src="${url}" class="w-full h-full object-cover">
        <span class="absolute bottom-0 left-0 right-0 bg-amber-500 text-white text-[9px] text-center font-bold">ใหม่</span>
        <button 
          type="button" 
          onclick="removeEditNewFile(${idx})" 
          class="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow"
          title="ยกเลิกรูปนี้"
        >
          <i data-lucide="x" class="w-2.5 h-2.5"></i>
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
  updateIcons();
}

function removeEditRemainingImage(idx) {
  adminState.editRemainingImages.splice(idx, 1);
  renderEditImagesPreview();
}

function removeEditNewFile(idx) {
  adminState.editNewFiles.splice(idx, 1);
  renderEditImagesPreview();
}

function handleEditFilesSelected(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  adminState.editNewFiles = [...adminState.editNewFiles, ...Array.from(files)];
  renderEditImagesPreview();
}

async function handleSaveEditCredit(e) {
  e.preventDefault();
  const id = document.getElementById('edit-credit-id').value;
  const title = document.getElementById('edit-title').value.trim();
  const price = document.getElementById('edit-price').value;
  const customer = document.getElementById('edit-customer').value.trim();
  const description = document.getElementById('edit-description').value.trim();
  const isPinned = document.getElementById('edit-is-pinned').checked;
  const saveBtn = document.getElementById('btn-save-edit');

  if (!title) {
    showAdminToast('กรุณากรอกชื่อสินค้า / สิ่งที่ขาย', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'กำลังบันทึก...';

  try {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('game', 'ทั่วไป');
    formData.append('price', price || 0);
    formData.append('customer', customer || '');
    formData.append('description', description || '');
    formData.append('isPinned', isPinned);

    if (adminState.editNewFiles.length > 0) {
      adminState.editNewFiles.forEach(file => {
        formData.append('images', file);
      });
      formData.append('keepExistingImages', adminState.editRemainingImages.length > 0);
    }

    const res = await fetch(`/api/admin/credits/${id}`, {
      method: 'PUT',
      headers: getAdminHeaders(),
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      showAdminToast('อัปเดตข้อมูลเครดิตเรียบร้อยแล้ว!');
      closeEditModal();
      await fetchAdminCredits();
    } else {
      showAdminToast(data.message || 'อัปเดตไม่สำเร็จ', 'error');
    }
  } catch (err) {
    showAdminToast('เกิดข้อผิดพลาดในการอัปเดต', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `
      <i data-lucide="check" class="w-3.5 h-3.5"></i>
      <span>บันทึกการแก้ไข</span>
    `;
    updateIcons();
  }
}

// ========================
// SETTINGS & PIN MANAGEMENT
// ========================
function populateSettingsForm() {
  const { shopName, tagline, announcement, socials } = adminState.settings;

  const nameEl = document.getElementById('setting-shop-name');
  const tagEl = document.getElementById('setting-tagline');
  const annEl = document.getElementById('setting-announcement');
  const lineEl = document.getElementById('setting-line-url');
  const fbEl = document.getElementById('setting-fb-url');

  if (nameEl) nameEl.value = shopName || 'SUNFZENITH';
  if (tagEl) tagEl.value = tagline || '';
  if (annEl) annEl.value = announcement || '';
  if (lineEl && socials?.line) lineEl.value = socials.line.url || '';
  if (fbEl && socials?.facebook) fbEl.value = socials.facebook.url || '';
}

async function saveShopSettings() {
  const shopName = document.getElementById('setting-shop-name').value.trim();
  const tagline = document.getElementById('setting-tagline').value.trim();
  const announcement = document.getElementById('setting-announcement').value.trim();
  const lineUrl = document.getElementById('setting-line-url').value.trim();
  const fbUrl = document.getElementById('setting-fb-url').value.trim();

  try {
    const payload = {
      shopName,
      tagline,
      announcement,
      socials: {
        line: { label: 'Line ID: luvxawrnrkc', url: lineUrl, enabled: !!lineUrl },
        facebook: { label: 'Facebook', url: fbUrl, enabled: !!fbUrl },
        discord: { label: 'Discord Server', url: '', enabled: false },
        tiktok: { label: 'TikTok Shop', url: '', enabled: false }
      }
    };

    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showAdminToast('บันทึกข้อมูลหน้าร้านค้าเรียบร้อยแล้ว!');
      await fetchAdminSettings();
    } else {
      showAdminToast(data.message || 'บันทึกไม่สำเร็จ', 'error');
    }
  } catch (err) {
    showAdminToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'error');
  }
}

async function handleChangePin() {
  const currentPin = document.getElementById('input-current-pin').value;
  const newPin = document.getElementById('input-new-pin').value;

  if (!currentPin || !newPin) {
    showAdminToast('กรุณากรอกทั้ง PIN ปัจจุบันและ PIN ใหม่', 'error');
    return;
  }

  if (newPin.length < 4) {
    showAdminToast('PIN ใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร', 'error');
    return;
  }

  try {
    const res = await fetch('/api/admin/change-pin', {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ currentPin, newPin })
    });
    const data = await res.json();

    if (data.success) {
      showAdminToast('เปลี่ยนรหัส PIN แอดมินสำเร็จแล้ว!');
      document.getElementById('input-current-pin').value = '';
      document.getElementById('input-new-pin').value = '';
    } else {
      showAdminToast(data.message || 'เปลี่ยน PIN ไม่สำเร็จ', 'error');
    }
  } catch (err) {
    showAdminToast('เกิดข้อผิดพลาดในการเปลี่ยน PIN', 'error');
  }
}

// Download Backup JSON
async function downloadBackupFile() {
  try {
    const res = await fetch('/api/admin/export', {
      headers: getAdminHeaders()
    });
    if (!res.ok) throw new Error('ไม่สามารถดาวน์โหลดไฟล์ได้');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sunfz-credits-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    showAdminToast('ดาวน์โหลดไฟล์สำรองข้อมูลเรียบร้อยแล้ว!');
  } catch (err) {
    showAdminToast('เกิดข้อผิดพลาดในการดาวน์โหลด', 'error');
  }
}

// Restore Backup JSON
async function handleRestoreBackupFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!confirm('การกู้คืนข้อมูลจะเขียนทับข้อมูลเครดิตและการตั้งค่าปัจจุบันทั้งหมด ยืนยันดำเนินการต่อหรือไม่?')) {
    e.target.value = '';
    return;
  }

  const formData = new FormData();
  formData.append('backupFile', file);

  try {
    const res = await fetch('/api/admin/import', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      showAdminToast('กู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว!');
      await loadDashboardData();
    } else {
      showAdminToast(data.message || 'กู้คืนข้อมูลไม่สำเร็จ', 'error');
    }
  } catch (err) {
    showAdminToast('เกิดข้อผิดพลาดในการกู้คืนข้อมูล', 'error');
  } finally {
    e.target.value = '';
  }
}

// ========================================================
// Portfolio Management
// ========================================================

async function fetchAdminPortfolio() {
  try {
    const res = await fetch('/api/admin/portfolio', {
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (data.success) {
      adminState.portfolio = data.portfolio || [];
      updatePortfolioCounts();
      renderAdminPortfolio();
    }
  } catch (err) {
    console.error('Failed to load admin portfolio:', err);
  }
}

function updatePortfolioCounts() {
  const list = adminState.portfolio || [];
  const tabCount = document.getElementById('tab-portfolio-count');
  if (tabCount) tabCount.textContent = list.length;

  const countAll = document.getElementById('admin-port-count-all');
  const countWeb = document.getElementById('admin-port-count-website');
  const countCode = document.getElementById('admin-port-count-coding');
  const countDesign = document.getElementById('admin-port-count-design');
  const countPres = document.getElementById('admin-port-count-presentation');

  if (countAll) countAll.textContent = list.length;
  if (countWeb) countWeb.textContent = list.filter(p => p.category === 'website').length;
  if (countCode) countCode.textContent = list.filter(p => p.category === 'coding').length;
  if (countDesign) countDesign.textContent = list.filter(p => p.category === 'design').length;
  if (countPres) countPres.textContent = list.filter(p => p.category === 'presentation').length;
}

function filterAdminPortfolio(category) {
  adminState.portfolioFilter = category;

  const filters = ['all', 'website', 'coding', 'design', 'presentation'];
  filters.forEach(cat => {
    const btn = document.getElementById(`admin-port-filter-${cat}`);
    if (!btn) return;
    if (cat === category) {
      btn.className = 'px-3 py-1.5 rounded-xl font-bold bg-slate-900 text-white cursor-pointer transition';
    } else {
      btn.className = 'px-3 py-1.5 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition';
    }
  });

  renderAdminPortfolio();
}

function handleAdminPortfolioSearch(e) {
  adminState.portfolioSearch = (e.target.value || '').trim().toLowerCase();
  renderAdminPortfolio();
}

function renderAdminPortfolio() {
  const container = document.getElementById('admin-portfolio-container');
  if (!container) return;

  let list = adminState.portfolio || [];

  // Filter by category
  if (adminState.portfolioFilter !== 'all') {
    list = list.filter(p => p.category === adminState.portfolioFilter);
  }

  // Filter by search
  if (adminState.portfolioSearch) {
    const q = adminState.portfolioSearch;
    list = list.filter(p => {
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchDesc = (p.desc || '').toLowerCase().includes(q);
      const matchTech = (Array.isArray(p.tech) ? p.tech.join(' ') : (p.tech || '')).toLowerCase().includes(q);
      return matchTitle || matchDesc || matchTech;
    });
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="col-span-full clean-card p-12 text-center text-slate-400">
        <i data-lucide="folder-search" class="w-12 h-12 mx-auto mb-3 opacity-30"></i>
        <p class="text-sm font-semibold text-slate-600">ไม่พบรายการผลงานตามเงื่อนไขที่เลือก</p>
        <p class="text-xs text-slate-400 mt-1">คลิกปุ่ม "+ เพิ่มผลงานใหม่" ด้านบนเพื่อเพิ่มผลงานได้ทันที</p>
      </div>
    `;
    updateIcons();
    return;
  }

  const catBadgeColors = {
    website: 'bg-blue-50 text-blue-700 border-blue-200',
    coding: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    design: 'bg-purple-50 text-purple-700 border-purple-200',
    presentation: 'bg-amber-50 text-amber-700 border-amber-200'
  };

  container.innerHTML = list.map(item => {
    const techArray = Array.isArray(item.tech) ? item.tech : (item.tech ? String(item.tech).split(',') : []);
    const badgeColor = catBadgeColors[item.category] || 'bg-slate-100 text-slate-700 border-slate-200';
    const hasDemo = item.demoUrl && item.demoUrl !== '#';

    return `
      <div class="clean-card overflow-hidden flex flex-col group hover:shadow-lg transition">
        <!-- Thumbnail -->
        <div class="relative aspect-video bg-slate-100 overflow-hidden border-b border-slate-100">
          <img 
            src="${escapeHtml(item.image)}" 
            alt="${escapeHtml(item.title)}" 
            class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onerror="this.src='/images/placeholder-credit.svg'"
          >
          <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span class="px-2.5 py-0.5 rounded-lg text-[11px] font-bold border backdrop-blur-md ${badgeColor}">
              ${escapeHtml(item.categoryLabel || item.category)}
            </span>
            ${item.isReal ? `
              <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/90 text-white shadow-sm">
                ⚡ งานจริง
              </span>
            ` : ''}
          </div>
        </div>

        <!-- Body -->
        <div class="p-4 flex-grow flex flex-col justify-between space-y-3">
          <div class="space-y-1.5">
            <h4 class="font-heading font-bold text-sm text-slate-900 line-clamp-1" title="${escapeHtml(item.title)}">
              ${escapeHtml(item.title)}
            </h4>
            <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              ${escapeHtml(item.desc || 'ไม่มีรายละเอียด')}
            </p>
          </div>

          <!-- Tech tags -->
          <div class="flex flex-wrap gap-1">
            ${techArray.slice(0, 4).map(t => `
              <span class="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                ${escapeHtml(t.trim())}
              </span>
            `).join('')}
            ${techArray.length > 4 ? `
              <span class="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-400">
                +${techArray.length - 4}
              </span>
            ` : ''}
          </div>

          <!-- Footer Actions -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            ${hasDemo ? `
              <a 
                href="${escapeHtml(item.demoUrl)}" 
                target="_blank" 
                rel="noopener"
                class="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <i data-lucide="external-link" class="w-3 h-3"></i>
                <span class="truncate max-w-[120px]">${escapeHtml(item.demoLabel || 'เปิดดู')}</span>
              </a>
            ` : `<div></div>`}

            <div class="flex items-center gap-1.5">
              <button 
                type="button" 
                onclick="openEditPortfolioModal('${item.id}')"
                class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                title="แก้ไขผลงานนี้"
              >
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                <span>แก้ไข</span>
              </button>
              <button 
                type="button" 
                onclick="deletePortfolioItem('${item.id}', '${escapeHtml(item.title)}')"
                class="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                title="ลบผลงานนี้"
              >
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>ลบ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  updateIcons();
}

function handlePortCategoryChange(val) {
  const catLabelInput = document.getElementById('port-form-cat-label');
  const demoLabelInput = document.getElementById('port-form-demo-label');
  if (!catLabelInput) return;

  const defaultLabels = {
    website: 'Web Application',
    coding: 'Coding & AI',
    design: 'Graphic & Banner',
    presentation: 'Slide Deck'
  };

  const defaultDemoLabels = {
    website: 'เข้าชมเว็บไซต์จริง',
    coding: 'ดูสถาปัตยกรรมระบบ',
    design: 'ดูภาพผลงานเต็ม',
    presentation: 'ดูตัวอย่างสไลด์'
  };

  if (!catLabelInput.value || Object.values(defaultLabels).includes(catLabelInput.value)) {
    catLabelInput.value = defaultLabels[val] || '';
  }

  if (demoLabelInput && (!demoLabelInput.value || Object.values(defaultDemoLabels).includes(demoLabelInput.value))) {
    demoLabelInput.value = defaultDemoLabels[val] || '';
  }
}

function openCreatePortfolioModal() {
  const modal = document.getElementById('portfolio-modal');
  const title = document.getElementById('portfolio-modal-title');
  const form = document.getElementById('portfolio-form');
  if (!modal || !form) return;

  form.reset();
  document.getElementById('port-form-id').value = '';
  document.getElementById('port-form-is-real').checked = true;
  adminState.selectedPortfolioFile = null;

  clearPortfolioImage();
  handlePortCategoryChange('design');

  if (title) title.textContent = 'เพิ่มผลงานใหม่';
  modal.classList.remove('hidden');
  updateIcons();
}

function openEditPortfolioModal(id) {
  const item = (adminState.portfolio || []).find(p => p.id === id);
  if (!item) return;

  const modal = document.getElementById('portfolio-modal');
  const title = document.getElementById('portfolio-modal-title');
  if (!modal) return;

  document.getElementById('port-form-id').value = item.id;
  document.getElementById('port-form-title').value = item.title || '';
  document.getElementById('port-form-category').value = item.category || 'design';
  document.getElementById('port-form-cat-label').value = item.categoryLabel || '';
  document.getElementById('port-form-desc').value = item.desc || '';
  document.getElementById('port-form-tech').value = Array.isArray(item.tech) ? item.tech.join(', ') : (item.tech || '');
  document.getElementById('port-form-image-url').value = item.image && !item.image.startsWith('/images/uploads/') ? item.image : '';
  document.getElementById('port-form-demo-url').value = item.demoUrl || '';
  document.getElementById('port-form-demo-label').value = item.demoLabel || '';
  document.getElementById('port-form-is-real').checked = item.isReal !== false;

  adminState.selectedPortfolioFile = null;

  // Set image preview
  if (item.image) {
    showPortfolioPreview(item.image);
  } else {
    clearPortfolioImage();
  }

  if (title) title.textContent = 'แก้ไขผลงาน: ' + item.title;
  modal.classList.remove('hidden');
  updateIcons();
}

function closePortfolioModal() {
  const modal = document.getElementById('portfolio-modal');
  if (modal) modal.classList.add('hidden');
  adminState.selectedPortfolioFile = null;
}

function showPortfolioPreview(url) {
  const box = document.getElementById('port-img-preview-box');
  const tag = document.getElementById('port-img-preview-tag');
  if (box && tag) {
    tag.src = url;
    box.classList.remove('hidden');
  }
}

function clearPortfolioImage() {
  const box = document.getElementById('port-img-preview-box');
  const tag = document.getElementById('port-img-preview-tag');
  const fileInput = document.getElementById('port-file-input');
  const urlInput = document.getElementById('port-form-image-url');
  const hint = document.getElementById('port-file-name-hint');

  if (box) box.classList.add('hidden');
  if (tag) tag.src = '';
  if (fileInput) fileInput.value = '';
  if (urlInput) urlInput.value = '';
  if (hint) hint.textContent = 'ขนาดไม่เกิน 5MB';
  adminState.selectedPortfolioFile = null;
}

function handlePortfolioFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showAdminToast('ขนาดไฟล์รูปภาพเกิน 5MB', 'error');
    e.target.value = '';
    return;
  }

  adminState.selectedPortfolioFile = file;
  const hint = document.getElementById('port-file-name-hint');
  if (hint) hint.textContent = `เลือกไฟล์: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;

  const reader = new FileReader();
  reader.onload = (event) => {
    showPortfolioPreview(event.target.result);
  };
  reader.readAsDataURL(file);
}

function handlePortfolioUrlInput(e) {
  const url = (e.target.value || '').trim();
  if (url) {
    showPortfolioPreview(url);
  } else if (!adminState.selectedPortfolioFile) {
    const box = document.getElementById('port-img-preview-box');
    if (box) box.classList.add('hidden');
  }
}

async function handlePortfolioSubmit(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('btn-save-portfolio');
  const id = document.getElementById('port-form-id').value;
  const isEditing = Boolean(id);

  const title = document.getElementById('port-form-title').value.trim();
  const category = document.getElementById('port-form-category').value;
  const categoryLabel = document.getElementById('port-form-cat-label').value.trim();
  const desc = document.getElementById('port-form-desc').value.trim();
  const tech = document.getElementById('port-form-tech').value.trim();
  const imageUrl = document.getElementById('port-form-image-url').value.trim();
  const demoUrl = document.getElementById('port-form-demo-url').value.trim();
  const demoLabel = document.getElementById('port-form-demo-label').value.trim();
  const isReal = document.getElementById('port-form-is-real').checked;

  if (!title) {
    showAdminToast('กรุณากรอกชื่อผลงาน', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  formData.append('categoryLabel', categoryLabel);
  formData.append('desc', desc);
  formData.append('tech', tech);
  formData.append('imageUrl', imageUrl);
  formData.append('demoUrl', demoUrl);
  formData.append('demoLabel', demoLabel);
  formData.append('isReal', isReal);

  if (adminState.selectedPortfolioFile) {
    formData.append('image', adminState.selectedPortfolioFile);
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span>กำลังบันทึก...</span>`;
  }

  try {
    const url = isEditing ? `/api/admin/portfolio/${id}` : '/api/admin/portfolio';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getAdminHeaders(),
      body: formData
    });

    const data = await res.json();
    if (data.success) {
      showAdminToast(data.message || (isEditing ? 'แก้ไขผลงานเรียบร้อยแล้ว!' : 'เพิ่มผลงานสำเร็จ!'));
      closePortfolioModal();
      await fetchAdminPortfolio();
    } else {
      showAdminToast(data.message || 'บันทึกผลงานไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error('Portfolio submit error:', err);
    showAdminToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `
        <i data-lucide="check" class="w-3.5 h-3.5"></i>
        <span>บันทึกผลงาน</span>
      `;
      updateIcons();
    }
  }
}

async function deletePortfolioItem(id, title) {
  if (!confirm(`คุณต้องการลบผลงาน "${title}" ใช่หรือไม่?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) {
    return;
  }

  try {
    const res = await fetch(`/api/admin/portfolio/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    });

    const data = await res.json();
    if (data.success) {
      showAdminToast(data.message || 'ลบผลงานเรียบร้อยแล้ว!');
      await fetchAdminPortfolio();
    } else {
      showAdminToast(data.message || 'ลบผลงานไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error('Delete portfolio error:', err);
    showAdminToast('เกิดข้อผิดพลาดในการลบผลงาน', 'error');
  }
}

// ========================================================
// Site Content & CMS Management (Branding, Services, Pricing, Socials)
// ========================================================

function populateGeneralForm() {
  if (!adminState.content?.general) return;
  const g = adminState.content.general;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  };
  const setCheck = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(val);
  };

  setVal('home-shop-name', g.shopName);
  setVal('home-shop-status', g.shopStatus);
  setVal('home-tagline', g.tagline);
  setCheck('home-show-announcement', Boolean(g.showAnnouncement));
  setVal('home-announcement', g.announcement);
  setVal('home-hero-lead', g.heroTitleLead);
  setVal('home-hero-high1', g.heroTitleHighlight1);
  setVal('home-hero-mid', g.heroTitleMid);
  setVal('home-hero-high2', g.heroTitleHighlight2);
  setVal('home-hero-desc', g.heroDesc);
  setVal('home-trust1-title', g.trustBadge1Title);
  setVal('home-trust1-sub', g.trustBadge1Sub);
  setVal('home-trust2-title', g.trustBadge2Title);
  setVal('home-trust2-sub', g.trustBadge2Sub);
  setVal('home-mascot-motto', g.mascotMotto);
}

async function handleSaveGeneralSettings(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-general');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>กำลังบันทึก...</span>';
  }

  const payload = {
    shopName: document.getElementById('home-shop-name')?.value.trim() || 'SUNFZENITH',
    shopStatus: document.getElementById('home-shop-status')?.value.trim() || '',
    tagline: document.getElementById('home-tagline')?.value.trim() || '',
    showAnnouncement: document.getElementById('home-show-announcement')?.checked ?? true,
    announcement: document.getElementById('home-announcement')?.value.trim() || '',
    heroTitleLead: document.getElementById('home-hero-lead')?.value.trim() || '',
    heroTitleHighlight1: document.getElementById('home-hero-high1')?.value.trim() || '',
    heroTitleMid: document.getElementById('home-hero-mid')?.value.trim() || '',
    heroTitleHighlight2: document.getElementById('home-hero-high2')?.value.trim() || '',
    heroDesc: document.getElementById('home-hero-desc')?.value.trim() || '',
    trustBadge1Title: document.getElementById('home-trust1-title')?.value.trim() || '',
    trustBadge1Sub: document.getElementById('home-trust1-sub')?.value.trim() || '',
    trustBadge2Title: document.getElementById('home-trust2-title')?.value.trim() || '',
    trustBadge2Sub: document.getElementById('home-trust2-sub')?.value.trim() || '',
    mascotMotto: document.getElementById('home-mascot-motto')?.value.trim() || ''
  };

  try {
    const res = await fetch('/api/admin/content/general', {
      method: 'PUT',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      if (adminState.content) adminState.content.general = data.general;
      showAdminToast('บันทึกข้อมูลหน้าแรกและแบรนด์เรียบร้อยแล้ว ✨');
    } else {
      showAdminToast(data.message || 'บันทึกข้อมูลไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error('Save general error:', err);
    showAdminToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <i data-lucide="check-circle" class="w-4 h-4"></i>
        <span>บันทึกข้อมูลหน้าแรกทั้งหมด ✨</span>
      `;
      updateIcons();
    }
  }
}

function populateSocialsForm() {
  if (!adminState.content?.socials) return;
  const s = adminState.content.socials;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  };
  const setCheck = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(val);
  };

  setCheck('social-line-enabled', s.line?.enabled);
  setVal('social-line-id', s.line?.label);
  setVal('social-line-url', s.line?.url);

  setCheck('social-fb-enabled', s.facebook?.enabled);
  setVal('social-fb-label', s.facebook?.label);
  setVal('social-fb-url', s.facebook?.url);

  setCheck('social-discord-enabled', s.discord?.enabled);
  setVal('social-discord-label', s.discord?.label);
  setVal('social-discord-url', s.discord?.url);

  setCheck('social-tiktok-enabled', s.tiktok?.enabled);
  setVal('social-tiktok-label', s.tiktok?.label);
  setVal('social-tiktok-url', s.tiktok?.url);

  setCheck('social-instagram-enabled', s.instagram?.enabled);
  setVal('social-instagram-label', s.instagram?.label);
  setVal('social-instagram-url', s.instagram?.url);
}

async function handleSaveSocialsSettings(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-socials');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>กำลังบันทึก...</span>';
  }

  const payload = {
    line: {
      enabled: document.getElementById('social-line-enabled')?.checked ?? true,
      label: document.getElementById('social-line-id')?.value.trim() || '',
      url: document.getElementById('social-line-url')?.value.trim() || ''
    },
    facebook: {
      enabled: document.getElementById('social-fb-enabled')?.checked ?? true,
      label: document.getElementById('social-fb-label')?.value.trim() || '',
      url: document.getElementById('social-fb-url')?.value.trim() || ''
    },
    discord: {
      enabled: document.getElementById('social-discord-enabled')?.checked ?? false,
      label: document.getElementById('social-discord-label')?.value.trim() || '',
      url: document.getElementById('social-discord-url')?.value.trim() || ''
    },
    tiktok: {
      enabled: document.getElementById('social-tiktok-enabled')?.checked ?? false,
      label: document.getElementById('social-tiktok-label')?.value.trim() || '',
      url: document.getElementById('social-tiktok-url')?.value.trim() || ''
    },
    instagram: {
      enabled: document.getElementById('social-instagram-enabled')?.checked ?? false,
      label: document.getElementById('social-instagram-label')?.value.trim() || '',
      url: document.getElementById('social-instagram-url')?.value.trim() || ''
    }
  };

  try {
    const res = await fetch('/api/admin/content/socials', {
      method: 'PUT',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      if (adminState.content) adminState.content.socials = data.socials;
      showAdminToast('บันทึกข้อมูลช่องทางติดต่อเรียบร้อยแล้ว ✨');
    } else {
      showAdminToast(data.message || 'บันทึกไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error('Save socials error:', err);
    showAdminToast('เกิดข้อผิดพลาดในการบันทึกช่องทางติดต่อ', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <i data-lucide="save" class="w-4 h-4"></i>
        <span>บันทึกช่องทางติดต่อทั้งหมด ✨</span>
      `;
      updateIcons();
    }
  }
}

// ---------------- Services Management ----------------
function renderAdminServices() {
  const container = document.getElementById('admin-services-container');
  if (!container) return;

  const services = adminState.content?.services || [];
  if (services.length === 0) {
    container.innerHTML = `
      <div class="col-span-full clean-card p-10 text-center text-slate-400">
        <i data-lucide="wrench" class="w-10 h-10 mx-auto mb-2 opacity-30"></i>
        <p class="text-xs font-semibold text-slate-600">ยังไม่มีรายการบริการ</p>
        <p class="text-[11px] text-slate-400 mt-1">คลิกปุ่ม "+ เพิ่มบริการใหม่" เพื่อเริ่มสร้าง</p>
      </div>
    `;
    updateIcons();
    return;
  }

  container.innerHTML = services.map(s => {
    const bullets = Array.isArray(s.features) ? s.features : [];
    return `
      <div class="clean-card p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition">
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-xl flex items-center justify-center shrink-0">
                ${escapeHtml(s.icon || '✨')}
              </span>
              <div>
                <h4 class="font-heading font-bold text-sm text-slate-900 leading-snug">
                  ${escapeHtml(s.title || 'ไม่มีชื่อบริการ')}
                </h4>
                ${s.badge ? `
                  <span class="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100/80 text-amber-800">
                    ${escapeHtml(s.badge)}
                  </span>
                ` : ''}
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-black text-xs shrink-0">
              ${escapeHtml(s.startingPrice || 'ติดต่อสอบถาม')}
            </span>
          </div>

          <p class="text-xs text-slate-600 leading-relaxed">
            ${escapeHtml(s.desc || '')}
          </p>

          ${bullets.length > 0 ? `
            <ul class="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
              ${bullets.map(b => `
                <li class="flex items-center gap-1.5">
                  <span class="text-amber-500 font-bold">•</span>
                  <span>${escapeHtml(b)}</span>
                </li>
              `).join('')}
            </ul>
          ` : ''}
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button 
            type="button" 
            onclick="openEditServiceModal('${s.id}')"
            class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            <span>แก้ไข</span>
          </button>
          <button 
            type="button" 
            onclick="deleteServiceItem('${s.id}', '${escapeHtml(s.title || '')}')"
            class="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>ลบ</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  updateIcons();
}

function openCreateServiceModal() {
  const modal = document.getElementById('service-modal');
  const title = document.getElementById('service-modal-title');
  const form = document.getElementById('service-form');
  if (!modal || !form) return;

  form.reset();
  document.getElementById('service-form-id').value = '';
  document.getElementById('service-form-icon').value = '✨';

  if (title) title.textContent = 'เพิ่มบริการใหม่';
  modal.classList.remove('hidden');
  updateIcons();
}

function openEditServiceModal(id) {
  const s = (adminState.content?.services || []).find(x => x.id === id);
  if (!s) return;

  const modal = document.getElementById('service-modal');
  const title = document.getElementById('service-modal-title');
  if (!modal) return;

  document.getElementById('service-form-id').value = s.id;
  document.getElementById('service-form-icon').value = s.icon || '✨';
  document.getElementById('service-form-badge').value = s.badge || '';
  document.getElementById('service-form-title').value = s.title || '';
  document.getElementById('service-form-starting-price').value = s.startingPrice || '';
  document.getElementById('service-form-desc').value = s.desc || '';
  document.getElementById('service-form-bullets').value = Array.isArray(s.features) ? s.features.join('\n') : '';

  if (title) title.textContent = 'แก้ไขบริการ: ' + (s.title || '');
  modal.classList.remove('hidden');
  updateIcons();
}

function closeServiceModal() {
  const modal = document.getElementById('service-modal');
  if (modal) modal.classList.add('hidden');
}

async function handleServiceSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('service-form-id')?.value;
  const isEditing = Boolean(id);
  const btn = document.getElementById('btn-save-service');

  const title = document.getElementById('service-form-title')?.value.trim();
  const icon = document.getElementById('service-form-icon')?.value.trim() || '✨';
  const badge = document.getElementById('service-form-badge')?.value.trim() || '';
  const startingPrice = document.getElementById('service-form-starting-price')?.value.trim() || 'ติดต่อสอบถาม';
  const desc = document.getElementById('service-form-desc')?.value.trim() || '';
  const bulletsText = document.getElementById('service-form-bullets')?.value || '';
  const features = bulletsText.split('\n').map(b => b.trim()).filter(Boolean);

  if (!title) {
    showAdminToast('กรุณากรอกชื่อบริการ', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>กำลังบันทึก...</span>';
  }

  try {
    const url = isEditing ? `/api/admin/services/${id}` : '/api/admin/services';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title, icon, badge, startingPrice, desc, features })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(data.message || (isEditing ? 'แก้ไขบริการเรียบร้อยแล้ว!' : 'เพิ่มบริการใหม่สำเร็จ!'));
      closeServiceModal();
      await fetchAdminContent();
    } else {
      showAdminToast(data.message || 'บันทึกบริการไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error('Service submit error:', err);
    showAdminToast('เกิดข้อผิดพลาดในการบันทึกบริการ', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <i data-lucide="check" class="w-3.5 h-3.5"></i>
        <span>บันทึกบริการ</span>
      `;
      updateIcons();
    }
  }
}

async function deleteServiceItem(id, title) {
  if (!confirm(`คุณต้องการลบบริการ "${title}" ใช่หรือไม่?`)) return;

  try {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(data.message || 'ลบบริการเรียบร้อยแล้ว!');
      await fetchAdminContent();
    } else {
      showAdminToast(data.message || 'ลบบริการไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error('Delete service error:', err);
    showAdminToast('เกิดข้อผิดพลาดในการลบบริการ', 'error');
  }
}

// ---------------- Pricing Packages Management ----------------
function renderAdminPricing() {
  const container = document.getElementById('admin-pricing-container');
  if (!container) return;

  const list = adminState.content?.pricing || [];
  if (list.length === 0) {
    container.innerHTML = `
      <div class="col-span-full clean-card p-10 text-center text-slate-400">
        <i data-lucide="badge-dollar-sign" class="w-10 h-10 mx-auto mb-2 opacity-30"></i>
        <p class="text-xs font-semibold text-slate-600">ยังไม่มีแพ็กเกจราคา</p>
        <p class="text-[11px] text-slate-400 mt-1">คลิกปุ่ม "+ เพิ่มแพ็กเกจราคาใหม่" เพื่อเริ่มสร้าง</p>
      </div>
    `;
    updateIcons();
    return;
  }

  container.innerHTML = list.map(p => {
    const features = Array.isArray(p.features) ? p.features : [];
    return `
      <div class="clean-card p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition relative ${p.isHighlight ? 'ring-2 ring-amber-400 bg-amber-50/20' : ''}">
        ${p.isHighlight ? `
          <div class="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px] shadow-sm">
            ⭐ ยอดนิยม
          </div>
        ` : ''}

        <div class="space-y-3">
          <div>
            ${p.badge ? `
              <span class="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 mb-1">
                ${escapeHtml(p.badge)}
              </span>
            ` : ''}
            <h4 class="font-heading font-extrabold text-base text-slate-900 leading-snug">
              ${escapeHtml(p.title || 'แพ็กเกจ')}
            </h4>
            <div class="mt-1 flex items-baseline gap-1">
              <span class="font-heading font-black text-xl text-slate-900">${escapeHtml(p.price || 'ราคาคุยกันได้')}</span>
            </div>
          </div>

          <p class="text-xs text-slate-600 leading-relaxed">
            ${escapeHtml(p.desc || '')}
          </p>

          ${features.length > 0 ? `
            <ul class="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
              ${features.map(f => `
                <li class="flex items-center gap-1.5">
                  <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-500 shrink-0"></i>
                  <span>${escapeHtml(f)}</span>
                </li>
              `).join('')}
            </ul>
          ` : ''}
        </div>

        <div class="space-y-2 pt-3 border-t border-slate-100">
          <div class="text-[11px] text-slate-500 truncate flex items-center gap-1">
            <span class="font-semibold text-slate-700">ปุ่ม:</span>
            <span>${escapeHtml(p.actionText || 'ปรึกษาฟรี')}</span>
            <span class="text-slate-400 font-mono text-[10px]">(${escapeHtml(p.actionUrl || '#contact')})</span>
          </div>

          <div class="flex items-center justify-end gap-2">
            <button 
              type="button" 
              onclick="openEditPricingModal('${p.id}')"
              class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              <span>แก้ไข</span>
            </button>
            <button 
              type="button" 
              onclick="deletePricingItem('${p.id}', '${escapeHtml(p.title || '')}')"
              class="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              <span>ลบ</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  updateIcons();
}

function openCreatePricingModal() {
  const modal = document.getElementById('pricing-modal');
  const title = document.getElementById('pricing-modal-title');
  const form = document.getElementById('pricing-form');
  if (!modal || !form) return;

  form.reset();
  document.getElementById('pricing-form-id').value = '';
  document.getElementById('pricing-form-popular').checked = false;
  document.getElementById('pricing-form-cta-text').value = 'ทักปรึกษาฟรี';
  document.getElementById('pricing-form-cta-url').value = '#contact';

  if (title) title.textContent = 'เพิ่มแพ็กเกจราคาใหม่';
  modal.classList.remove('hidden');
  updateIcons();
}

function openEditPricingModal(id) {
  const p = (adminState.content?.pricing || []).find(x => x.id === id);
  if (!p) return;

  const modal = document.getElementById('pricing-modal');
  const title = document.getElementById('pricing-modal-title');
  if (!modal) return;

  document.getElementById('pricing-form-id').value = p.id;
  document.getElementById('pricing-form-title').value = p.title || '';
  document.getElementById('pricing-form-badge').value = p.badge || '';
  document.getElementById('pricing-form-price').value = p.price || '';
  document.getElementById('pricing-form-desc').value = p.desc || '';
  document.getElementById('pricing-form-features').value = Array.isArray(p.features) ? p.features.join('\n') : '';
  document.getElementById('pricing-form-cta-text').value = p.actionText || '';
  document.getElementById('pricing-form-cta-url').value = p.actionUrl || '';
  document.getElementById('pricing-form-popular').checked = Boolean(p.isHighlight);

  if (title) title.textContent = 'แก้ไขแพ็กเกจราคา: ' + (p.title || '');
  modal.classList.remove('hidden');
  updateIcons();
}

function closePricingModal() {
  const modal = document.getElementById('pricing-modal');
  if (modal) modal.classList.add('hidden');
}

async function handlePricingSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('pricing-form-id')?.value;
  const isEditing = Boolean(id);
  const btn = document.getElementById('btn-save-pricing');

  const title = document.getElementById('pricing-form-title')?.value.trim();
  const badge = document.getElementById('pricing-form-badge')?.value.trim() || '';
  const price = document.getElementById('pricing-form-price')?.value.trim();
  const desc = document.getElementById('pricing-form-desc')?.value.trim() || '';
  const featuresText = document.getElementById('pricing-form-features')?.value || '';
  const features = featuresText.split('\n').map(f => f.trim()).filter(Boolean);
  const actionText = document.getElementById('pricing-form-cta-text')?.value.trim() || 'ปรึกษาฟรี';
  const actionUrl = document.getElementById('pricing-form-cta-url')?.value.trim() || '#contact';
  const isHighlight = document.getElementById('pricing-form-popular')?.checked ?? false;

  if (!title || !price) {
    showAdminToast('กรุณากรอกชื่อแพ็กเกจและราคา', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>กำลังบันทึก...</span>';
  }

  try {
    const url = isEditing ? `/api/admin/pricing/${id}` : '/api/admin/pricing';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title, badge, price, desc, isHighlight, features, actionText, actionUrl })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(data.message || (isEditing ? 'แก้ไขแพ็กเกจเรียบร้อยแล้ว!' : 'เพิ่มแพ็กเกจใหม่สำเร็จ!'));
      closePricingModal();
      await fetchAdminContent();
    } else {
      showAdminToast(data.message || 'บันทึกแพ็กเกจไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error('Pricing submit error:', err);
    showAdminToast('เกิดข้อผิดพลาดในการบันทึกแพ็กเกจ', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <i data-lucide="check" class="w-3.5 h-3.5"></i>
        <span>บันทึกแพ็กเกจ</span>
      `;
      updateIcons();
    }
  }
}

async function deletePricingItem(id, title) {
  if (!confirm(`คุณต้องการลบแพ็กเกจราคา "${title}" ใช่หรือไม่?`)) return;

  try {
    const res = await fetch(`/api/admin/pricing/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(data.message || 'ลบแพ็กเกจราคาเรียบร้อยแล้ว!');
      await fetchAdminContent();
    } else {
      showAdminToast(data.message || 'ลบแพ็กเกจไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error('Delete pricing error:', err);
    showAdminToast('เกิดข้อผิดพลาดในการลบแพ็กเกจ', 'error');
  }
}

// Utility: HTML Escaping
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
