import { SparkleIcon } from '../components/decor.js';

export function ContactSection() {
  return `
    <section class="section-wrapper contact-section-bg" id="contact">
      <div class="container">
        <div class="contact-cta-wrapper">
          <div class="card-glass contact-cta-card reveal-on-scroll">
            <div class="contact-mascot-badge">
              <span class="contact-mascot-emoji">☀️</span>
            </div>

            <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
              <span class="badge-sunny">
                ${SparkleIcon({ size: 16 })}
                <span>CONTACT US</span>
              </span>
              <span class="badge-sky">
                <span>ปรึกษาฟรี ไม่มีค่าใช้จ่าย</span>
              </span>
            </div>

            <h2 class="section-title" style="margin-bottom: 12px;">มีงานหรือไอเดียที่อยากทำ?</h2>

            <p class="contact-oa-desc">
              ส่งรายละเอียดมาให้ประเมินก่อนได้ค่ะ คุยรายละเอียดและสอบถามราคาได้ทาง LINE<br/>
              ตอบไว ยินดีให้คำแนะนำทุกสไตล์งาน เป็นกันเอง สบายกระเป๋า ✨
            </p>

            <div class="contact-oa-title">
              <span>LINE OA:</span>
              <span class="contact-oa-highlight">@419ajynp</span>
            </div>

            <a href="https://line.me/R/ti/p/@419ajynp" target="_blank" rel="noopener" class="contact-line-primary-btn">
              <span>💬 ทัก LINE เพื่อสอบถาม</span>
              <span style="font-size: 1.25rem;">→</span>
            </a>

            <!-- 3 Steps info -->
            <div class="contact-steps-grid">
              <div class="contact-step-item">
                <div class="contact-step-num">1</div>
                <div>
                  <div class="contact-step-title">ทักแชท LINE</div>
                  <div class="contact-step-sub">กดปุ่มหรือแอด @419ajynp</div>
                </div>
              </div>
              <div class="contact-step-item">
                <div class="contact-step-num">2</div>
                <div>
                  <div class="contact-step-title">ส่งรายละเอียดงาน</div>
                  <div class="contact-step-sub">บอกประเภทงาน, จำนวนหน้า, หรือตัวอย่างที่ชอบ</div>
                </div>
              </div>
              <div class="contact-step-item">
                <div class="contact-step-num">3</div>
                <div>
                  <div class="contact-step-title">ประเมินราคา &amp; เริ่มงาน</div>
                  <div class="contact-step-sub">ตกลงราคาก่อนเริ่ม ไม่ผูกมัด สบายใจได้ 100%</div>
                </div>
              </div>
            </div>

            <!-- Secondary channels row -->
            <div class="contact-secondary-row">
              <a href="https://www.facebook.com/profile.php?id=61595346770633&locale=th_TH" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
                <span>📘 Facebook Page</span>
              </a>
              <a href="/credits" class="btn btn-secondary btn-sm">
                <span>🛡️ ตรวจสอบเครดิต &amp; สลิป</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
