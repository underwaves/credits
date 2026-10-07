import { SERVICE_OPTIONS, BUDGET_OPTIONS, CONTACT_CHANNELS } from '../../src/shared/options.js';
import { SparkleIcon } from '../components/decor.js';
import { MascotZenny } from '../components/mascot.js';

export function ContactSection() {
  const serviceOptionsHtml = SERVICE_OPTIONS.map(
    (opt) => `<option value="${opt.id}">${opt.label}</option>`
  ).join('');

  const budgetOptionsHtml = BUDGET_OPTIONS.map(
    (opt) => `<option value="${opt.id}">${opt.label}</option>`
  ).join('');

  const channelOptionsHtml = CONTACT_CHANNELS.map(
    (opt) => `<option value="${opt.id}">${opt.label}</option>`
  ).join('');

  return `
    <section class="section-wrapper contact-section-bg" id="contact">
      <div class="container">
        <div class="section-header reveal-on-scroll">
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
            <span class="badge-sunny">
              ${SparkleIcon({ size: 16 })}
              <span>CONTACT US</span>
            </span>
            <span class="badge-sky">
              <span>💬 ปรึกษาฟรี ไม่มีค่าใช้จ่าย</span>
            </span>
          </div>
          <h2 class="section-title">ปรึกษาไอเดียหรือส่งโจทย์งานกับ SUNFZENITH</h2>
          <p class="section-desc">
            มีโจทย์การบ้าน โครงงาน ม.ปลาย โปรเจกต์วิชาเรียน หรือไอเดียที่อยากทำ? ส่งข้อความหาเราได้เลย 
            ทักแชทพูดคุยหรือประเมินราคาได้ฟรี ไม่มีข้อผูกมัดครับ ✨
          </p>
        </div>

        <div class="contact-layout">
          <!-- Left Info Column -->
          <div class="contact-info-col reveal-on-scroll">
            <div class="card-glass contact-info-card">
              <div class="contact-mascot-row">
                <div style="width: 80px; height: 80px; border-radius: 9999px; overflow: hidden; border: 3px solid #FFF1A0; box-shadow: var(--shadow-sm); flex-shrink: 0; background: linear-gradient(135deg, #FFF9D2, #FFE494); display: flex; align-items: center; justify-content: center;">
                  <img src="/images/mascot.png" alt="SUNFZENITH Mascot" style="width: 100%; height: 100%; object-fit: contain; padding: 4px;" width="80" height="80" loading="lazy" />
                </div>
                <div>
                  <h4 class="contact-card-title">ยินดีต้อนรับเสมอครับ!</h4>
                  <p class="contact-card-sub">✨ ปรึกษาฟรี ไม่มีข้อผูกมัด • เรท ม.ปลาย & นักศึกษา สบายกระเป๋า</p>
                </div>
              </div>

              <div class="direct-channels-list">
                <a href="https://line.me/ti/p/~luvxawrnrkc" target="_blank" rel="noopener" class="direct-channel-item">
                  <div class="channel-icon-box channel-line">💬</div>
                  <div class="channel-text">
                    <span class="channel-name">LINE Official</span>
                    <strong class="channel-val">ID: luvxawrnrkc</strong>
                  </div>
                  <span class="channel-action">ทักแชท →</span>
                </a>

                <a href="https://www.facebook.com/profile.php?id=61595346770633&locale=th_TH" target="_blank" rel="noopener" class="direct-channel-item">
                  <div class="channel-icon-box channel-fb">📘</div>
                  <div class="channel-text">
                    <span class="channel-name">Facebook Fanpage</span>
                    <strong class="channel-val">SUNFZENITH Official</strong>
                  </div>
                  <span class="channel-action">ส่งข้อความ →</span>
                </a>

                <a href="/credits" class="direct-channel-item">
                  <div class="channel-icon-box channel-shield">🛡️</div>
                  <div class="channel-text">
                    <span class="channel-name">สมุดรวมเครดิต & สลิป</span>
                    <strong class="channel-val">ตรวจสอบประวัติการซื้อขาย</strong>
                  </div>
                  <span class="channel-action">ดูเครดิต →</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Right Form Column -->
          <div class="contact-form-col reveal-on-scroll">
            <div class="card-glass contact-form-card">
              <form id="contact-form" onsubmit="handleContactSubmit(event)" novalidate>
                <!-- Anti-spam Honeypot -->
                <div style="display: none;" aria-hidden="true">
                  <input type="text" name="website" id="cf-website" tabindex="-1" autocomplete="off" />
                </div>
                <input type="hidden" id="cf-elapsed" name="elapsedMs" value="0" />

                <!-- 1. Name -->
                <div class="form-group">
                  <label for="cf-name" class="form-label">ชื่อของคุณ / ชื่อเล่น <span class="required">*</span></label>
                  <input type="text" id="cf-name" name="name" class="form-input" placeholder="เช่น คุณต้น, น้องฟ้า" required />
                  <span class="form-error-msg" id="err-name"></span>
                </div>

                <!-- 2. Contact Channel & Value -->
                <div class="form-row-2">
                  <div class="form-group">
                    <label for="cf-channel" class="form-label">ช่องทางติดต่อกลับ <span class="required">*</span></label>
                    <select id="cf-channel" name="contactChannel" class="form-select" onchange="updateContactPlaceholder()">
                      ${channelOptionsHtml}
                    </select>
                    <span class="form-error-msg" id="err-contactChannel"></span>
                  </div>

                  <div class="form-group">
                    <label for="cf-contact" class="form-label">ข้อมูลติดต่อ <span class="required">*</span></label>
                    <input type="text" id="cf-contact" name="contactValue" class="form-input" placeholder="เช่น sunny.dream" required />
                    <span class="form-error-msg" id="err-contactValue"></span>
                  </div>
                </div>

                <!-- 3. Service & Budget -->
                <div class="form-row-2">
                  <div class="form-group">
                    <label for="cf-service" class="form-label">ประเภทบริการ <span class="required">*</span></label>
                    <select id="cf-service" name="service" class="form-select">
                      ${serviceOptionsHtml}
                    </select>
                    <span class="form-error-msg" id="err-service"></span>
                  </div>

                  <div class="form-group">
                    <label for="cf-budget" class="form-label">งบประมาณโดยประมาณ</label>
                    <select id="cf-budget" name="budget" class="form-select">
                      ${budgetOptionsHtml}
                    </select>
                    <span class="form-error-msg" id="err-budget"></span>
                  </div>
                </div>

                <!-- 4. Project Details -->
                <div class="form-group">
                  <label for="cf-details" class="form-label">เล่ารายละเอียดงานที่ต้องการ <span class="required">*</span></label>
                  <textarea id="cf-details" name="details" class="form-textarea" placeholder="เช่น อยากได้เว็บไซต์แนะนำร้านอาหาร มีเมนูอาหาร มีปุ่มโทรออก และมีแผนที่ร้าน..." rows="4" required></textarea>
                  <span class="form-error-msg" id="err-details"></span>
                </div>

                <!-- Alert Feedback Box -->
                <div id="contact-alert" class="contact-alert-box" style="display: none;"></div>

                <!-- Submit Button -->
                <div class="form-action-row">
                  <button type="submit" id="btn-submit-contact" class="btn btn-primary btn-lg" style="width: 100%;">
                    <span id="btn-contact-text">ส่งข้อความหาเรา ✨</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
