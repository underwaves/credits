// ========================================================
// SUNFZ - Dedicated Admin Web App Logic
// Handles PIN auth, credit CRUD, image upload, settings & backup
// ========================================================

const adminState = {
  isAuthenticated: false,
  shopSlug: 'sunfz',
  shopName: 'SUNFZ',
  credits: [],
  settings: {},
  activeTab: 'add',
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
    fetchAdminCredits(),
    fetchAdminSettings()
  ]);
  updateDashboardStats();
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
  const tabs = ['add', 'list', 'settings'];
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

  if (tabId === 'list') {
    renderCreditsList();
  }

  updateIcons();
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

  if (nameEl) nameEl.value = shopName || 'SUNFZ';
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
        line: { label: 'Line ID / แชท', url: lineUrl, enabled: !!lineUrl },
        facebook: { label: 'Facebook Fanpage', url: fbUrl, enabled: !!fbUrl }
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
