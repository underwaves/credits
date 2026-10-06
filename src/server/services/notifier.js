import { config } from '../config.js';

/**
 * Dispatch notification to external webhook if configured.
 * Failures are logged and silently swallowed so they never interrupt user requests.
 */
export async function notifyNewContact(message) {
  if (!config.contactWebhookUrl) return;

  try {
    const payload = {
      content: `🌤️ **ข้อความติดต่อใหม่จาก SUNFZENITH**\n**ชื่อ:** ${message.name}\n**บริการ:** ${message.service}\n**ช่องทาง:** ${message.contact_channel} (${message.contact_value})\n**งบประมาณ:** ${message.budget}\n**รายละเอียด:** ${message.details}`
    };

    await fetch(config.contactWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('[notifier] Webhook notification failed:', err.message);
  }
}
