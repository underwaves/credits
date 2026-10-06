import { PROCESS_DATA } from '../data/process.js';
import { SparkleIcon } from '../components/decor.js';

export function ProcessSection() {
  const stepsHtml = PROCESS_DATA.map(
    (step, i) => `
      <div class="timeline-step reveal-on-scroll anim-delay-${(i % 3) + 1}">
        <div class="timeline-badge">
          <span class="timeline-num">${step.step}</span>
        </div>
        <div class="timeline-content card-glass">
          <h4 class="timeline-title">${step.title}</h4>
          <p class="timeline-desc">${step.desc}</p>
        </div>
      </div>
    `
  ).join('');

  return `
    <section class="section-wrapper" id="process">
      <div class="container">
        <div class="section-header reveal-on-scroll">
          <span class="badge-sunny">
            ${SparkleIcon({ size: 16 })}
            <span>WORKFLOW</span>
          </span>
          <h2 class="section-title">ขั้นตอนการทำงานที่โปร่งใส</h2>
          <p class="section-desc">
            ทุกโปรเจกต์ดำเนินงานอย่างมีระบบ มีขั้นตอนอัปเดตงานชัดเจน 
            เพื่อให้คุณสบายใจและได้งานที่ตรงใจที่สุด
          </p>
        </div>

        <div class="timeline-wrapper">
          <div class="timeline-track"></div>
          <div class="timeline-grid">
            ${stepsHtml}
          </div>
        </div>
      </div>
    </section>
  `;
}
