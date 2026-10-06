import { validateContact } from '@shared/validation.js';

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileMenu();
  initScrollReveal();
  initPortfolioFilter();
  initContactForm();
});

// ---------------- 1. Theme Toggle ----------------
function initThemeToggle() {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;

  const currentTheme = localStorage.getItem('sunfz_theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('sunfz_theme', nextTheme);
  });
}

// ---------------- 2. Mobile Menu ----------------
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const drawer = document.getElementById('mobile-menu');
  if (!btn || !drawer) return;

  btn.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      drawer.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    } else {
      drawer.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });

  // Close when clicking any menu link
  drawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

// ---------------- 3. Scroll Reveal ----------------
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (!elements.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => observer.observe(el));
  } else {
    elements.forEach((el) => el.classList.add('revealed'));
  }
}

// ---------------- 4. Portfolio Filter ----------------
function initPortfolioFilter() {
  const tabs = document.querySelectorAll('.filter-tab');
  const cards = document.querySelectorAll('.portfolio-card');
  if (!tabs.length || !cards.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');
      cards.forEach((card) => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// Quick helper to select service from service card
window.selectServiceOption = function (serviceId) {
  const selectEl = document.getElementById('cf-service');
  if (selectEl) {
    selectEl.value = serviceId;
  }
};

// ---------------- 5. Contact Form ----------------
const formStartTime = Date.now();

function initContactForm() {
  const channelSelect = document.getElementById('cf-channel');
  if (channelSelect) {
    channelSelect.addEventListener('change', updateContactPlaceholder);
  }
}

window.updateContactPlaceholder = function () {
  const channelSelect = document.getElementById('cf-channel');
  const inputEl = document.getElementById('cf-contact');
  if (!channelSelect || !inputEl) return;

  const placeholders = {
    line: 'เช่น sunny.dream หรือ @lineid',
    facebook: 'เช่น ชื่อโปรไฟล์ หรือ ลิงก์เฟซบุ๊ก',
    email: 'เช่น you@example.com',
    phone: 'เช่น 08x-xxx-xxxx'
  };

  inputEl.placeholder = placeholders[channelSelect.value] || 'กรอกข้อมูลติดต่อ';
};

let isSubmittingContact = false;

window.handleContactSubmit = async function (e) {
  e.preventDefault();
  if (isSubmittingContact) return;

  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('btn-submit-contact');
  const submitText = document.getElementById('btn-contact-text');
  const alertBox = document.getElementById('contact-alert');

  // Clear previous errors
  document.querySelectorAll('.form-error-msg').forEach((el) => (el.textContent = ''));
  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.className = 'contact-alert-box';
  }

  const formData = {
    name: document.getElementById('cf-name')?.value?.trim(),
    contactChannel: document.getElementById('cf-channel')?.value,
    contactValue: document.getElementById('cf-contact')?.value?.trim(),
    service: document.getElementById('cf-service')?.value,
    budget: document.getElementById('cf-budget')?.value,
    details: document.getElementById('cf-details')?.value?.trim(),
    website: document.getElementById('cf-website')?.value,
    elapsedMs: Date.now() - formStartTime
  };

  // Client-side validation
  const validation = validateContact(formData);
  if (!validation.ok) {
    for (const [field, msg] of Object.entries(validation.errors)) {
      const errEl = document.getElementById(`err-${field}`);
      if (errEl) errEl.textContent = msg;
    }
    showToast('กรุณากรอกข้อมูลในฟอร์มให้ครบถ้วนถูกต้อง', 'error');
    return;
  }

  isSubmittingContact = true;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';
    if (submitText) submitText.textContent = 'กำลังส่งข้อความ... กรุณารอสักครู่ ✨';
  }

  try {
    const res = await fetch('/api/public/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();

    if (data.success) {
      if (alertBox) {
        alertBox.className = 'contact-alert-box success';
        alertBox.textContent = data.message || 'ส่งข้อความเรียบร้อยแล้ว!';
        alertBox.style.display = 'block';
      }
      showToast('ส่งข้อความสำเร็จแล้ว! เราจะติดต่อกลับโดยเร็วที่สุดครับ', 'success');
      form.reset();
    } else {
      if (alertBox) {
        alertBox.className = 'contact-alert-box error';
        alertBox.textContent = data.message || 'เกิดข้อผิดพลาดในการส่งข้อความ';
        alertBox.style.display = 'block';
      }
      showToast(data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
    }
  } catch (err) {
    console.error('Contact submit error:', err);
    if (alertBox) {
      alertBox.className = 'contact-alert-box error';
      alertBox.textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ในขณะนี้ กรุณาทักทาง LINE: luvxawrnrkc ได้โดยตรงครับ';
      alertBox.style.display = 'block';
    }
    showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง', 'error');
  } finally {
    isSubmittingContact = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      if (submitText) submitText.textContent = 'ส่งข้อความหาเรา ✨';
    }
  }
};

// Toast notification helper
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✨' : '⚠️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
