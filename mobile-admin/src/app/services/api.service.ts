import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';

export interface CreditItem {
  id: string;
  title: string;
  game?: string;
  price: number;
  customer?: string;
  rating?: number;
  date?: string;
  images: string[];
  description?: string;
  isPinned?: boolean;
}

export interface ReviewItem {
  id: string;
  type: '+1' | '-1';
  customerName?: string;
  message?: string;
  images?: string[];
  createdAt?: string;
}

export interface AISlipResult {
  isValidSlip: boolean;
  amount: number | null;
  currency: string;
  bank?: string;
  transferDate?: string;
  transactionId?: string;
  sender?: string;
  confidenceScore: number;
  summary: string;
}

export interface AIReviewInsights {
  satisfactionScore: number;
  sentimentOverall: string;
  topStrengths: string[];
  reportedIssues: string[];
  actionableRecommendations: string[];
  executiveSummary: string;
  totalReviews: number;
  positiveCount: number;
  issueCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Web production shares its origin with the Express API. Native builds use the configured host.
  public serverUrl = signal<string>(this.getDefaultServerUrl());
  public token = signal<string | null>(null);
  public isAuthenticated = signal<boolean>(false);
  public shopName = signal<string>('SUNFZENITH');

  private TOKEN_KEY = 'sunfz_admin_token';
  private SERVER_URL_KEY = 'sunfz_server_url';

  private getDefaultServerUrl(): string {
    if (!environment.production) return 'http://localhost:3000';
    return Capacitor.isNativePlatform() ? environment.apiBaseUrl : window.location.origin;
  }

  constructor() {
    this.initFromStorage();
  }

  private async initFromStorage() {
    const { value: savedUrl } = await Preferences.get({ key: this.SERVER_URL_KEY });
    const isLocalDevelopmentUrl = Boolean(savedUrl && /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?$/i.test(savedUrl));
    if (savedUrl && !(environment.production && isLocalDevelopmentUrl)) {
      this.serverUrl.set(savedUrl);
    } else if (environment.production && isLocalDevelopmentUrl) {
      await Preferences.set({ key: this.SERVER_URL_KEY, value: this.serverUrl() });
    }

    const { value: savedToken } = await Preferences.get({ key: this.TOKEN_KEY });
    if (savedToken) {
      this.token.set(savedToken);
      this.checkAuth();
    }
  }

  public async setServerUrl(url: string) {
    const clean = url.replace(/\/+$/, '');
    this.serverUrl.set(clean);
    await Preferences.set({ key: this.SERVER_URL_KEY, value: clean });
  }

  public async login(pin: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${this.serverUrl()}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': 'mobile'
        },
        body: JSON.stringify({ pin, returnToken: true })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'รหัส PIN ไม่ถูกต้อง' };
      }

      if (data.token) {
        this.token.set(data.token);
        this.isAuthenticated.set(true);
        this.shopName.set(data.shopName || 'SUNFZENITH');
        await Preferences.set({ key: this.TOKEN_KEY, value: data.token });
      }

      return { success: true, message: 'เข้าสู่ระบบสำเร็จ' };
    } catch (err: any) {
      return { success: false, message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้: ' + err.message };
    }
  }

  public async checkAuth(): Promise<boolean> {
    const token = this.token();
    if (!token) {
      this.isAuthenticated.set(false);
      return false;
    }

    try {
      const res = await fetch(`${this.serverUrl()}/api/admin/check`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const valid = Boolean(data.success && data.isAdmin);
      this.isAuthenticated.set(valid);
      if (valid && data.shopName) this.shopName.set(data.shopName);
      return valid;
    } catch {
      this.isAuthenticated.set(false);
      return false;
    }
  }

  public async logout() {
    this.token.set(null);
    this.isAuthenticated.set(false);
    await Preferences.remove({ key: this.TOKEN_KEY });
  }

  // ---------------- Public & Admin Data ----------------

  public async getCredits(): Promise<CreditItem[]> {
    try {
      const res = await fetch(`${this.serverUrl()}/api/public/credits`);
      const data = await res.json();
      return Array.isArray(data.credits) ? data.credits : [];
    } catch {
      return [];
    }
  }

  public async createCredit(payload: {
    title: string;
    price: number;
    customer: string;
    description: string;
    base64Image?: string;
  }): Promise<{ success: boolean; message: string }> {
    const token = this.token();
    if (!token) return { success: false, message: 'ไม่ได้เข้าสู่ระบบ' };

    try {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('price', String(payload.price || 0));
      formData.append('customer', payload.customer || 'ลูกค้า (Mobile Admin)');
      formData.append('description', payload.description || '');

      if (payload.base64Image) {
        const matches = payload.base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        const mime = matches ? matches[1] : 'image/jpeg';
        const b64 = matches ? matches[2] : payload.base64Image;
        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        formData.append('images', blob, `slip-${Date.now()}.jpg`);
      }

      const res = await fetch(`${this.serverUrl()}/api/admin/credits`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      return { success: Boolean(data.success), message: data.message || 'บันทึกเรียบร้อย' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  public async getReviews(): Promise<ReviewItem[]> {
    try {
      const res = await fetch(`${this.serverUrl()}/api/public/reviews`);
      const data = await res.json();
      return Array.isArray(data.reviews) ? data.reviews : [];
    } catch {
      return [];
    }
  }

  // ---------------- AI Hybrid Intelligence Services ----------------

  public async verifySlipAI(base64Image: string): Promise<AISlipResult> {
    const token = this.token();
    const res = await fetch(`${this.serverUrl()}/api/admin/ai/verify-slip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ base64: base64Image })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'AI วิเคราะห์สลิปไม่สำเร็จ');
    }
    return json.data;
  }

  public async analyzeReviewsAI(): Promise<AIReviewInsights> {
    const token = this.token();
    const res = await fetch(`${this.serverUrl()}/api/admin/ai/analyze-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'AI วิเคราะห์รีวิวไม่สำเร็จ');
    }
    return json.data;
  }

  public async generateContentAI(topic: string, type: string = 'portfolio'): Promise<any> {
    const token = this.token();
    const res = await fetch(`${this.serverUrl()}/api/admin/ai/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        topic,
        type,
        targetAudience: 'ผู้ว่าจ้างทั่วไป',
        keywords: 'สวยงาม, ทันสมัย, ส่งงานไว'
      })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'AI เจนเนื้อหาไม่สำเร็จ');
    }
    return json.data;
  }
}
