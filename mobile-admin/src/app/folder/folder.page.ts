import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonBadge,
  IonNote,
  IonList,
  IonFooter,
  IonFab,
  IonFabButton,
  IonSpinner
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  camera,
  imagesOutline,
  sparkles,
  scan,
  checkmarkCircle,
  alertCircle,
  trash,
  logIn,
  logOut,
  refresh,
  arrowForward,
  bulb,
  thumbsUp,
  thumbsDown,
  shieldCheckmark,
  statsChart,
  documentText,
  wallet,
  business
} from 'ionicons/icons';
import { ApiService, CreditItem, ReviewItem, AISlipResult, AIReviewInsights } from '../services/api.service';
import { PhotoService } from '../services/photo.service';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonBadge,
    IonNote,
    IonList,
    IonFooter,
    IonFab,
    IonFabButton,
    IonSpinner
  ],
})
export class FolderPage implements OnInit {
  public folder = signal<string>('Dashboard');
  public api = inject(ApiService);
  public photoService = inject(PhotoService);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  // Form State
  public pinInput = signal<string>('');
  public loginError = signal<string>('');
  public serverUrlInput = signal<string>('');

  // Slip Scan Form State
  public currentSlipPhoto = signal<string | null>(null);
  public isScanning = signal<boolean>(false);
  public scanResult = signal<AISlipResult | null>(null);
  public creditTitle = signal<string>('');
  public creditPrice = signal<number>(0);
  public creditCustomer = signal<string>('');
  public creditDescription = signal<string>('');
  public isSubmittingCredit = signal<boolean>(false);
  public submitMessage = signal<string>('');

  // Data States
  public credits = signal<CreditItem[]>([]);
  public reviews = signal<ReviewItem[]>([]);
  public isLoadingData = signal<boolean>(false);

  // AI Sentiment State
  public isAnalyzingReviews = signal<boolean>(false);
  public reviewInsights = signal<AIReviewInsights | null>(null);

  // AI CRAFT State
  public craftTopic = signal<string>('ระบบเว็บแอปพลิเคชันพอร์ตโฟลิโอ & เครดิตร้านค้า');
  public craftType = signal<string>('portfolio');
  public isGeneratingCraft = signal<boolean>(false);
  public craftResult = signal<any>(null);

  constructor() {
    addIcons({
      camera,
      imagesOutline,
      sparkles,
      scan,
      checkmarkCircle,
      alertCircle,
      trash,
      logIn,
      logOut,
      refresh,
      arrowForward,
      bulb,
      thumbsUp,
      thumbsDown,
      shieldCheckmark,
      statsChart,
      documentText,
      wallet,
      business
    });
  }

  ngOnInit() {
    this.serverUrlInput.set(this.api.serverUrl());
    this.activatedRoute.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const routeId = params.get('folder') || 'Dashboard';
        // Keep old bookmarked links working; Photos was the original app landing route.
        const pageId = routeId === 'Photos' ? 'Dashboard' : routeId;
        this.folder.set(pageId);
        this.loadPageData(pageId);
      });
  }

  async loadPageData(pageId: string) {
    if (pageId === 'Dashboard' || pageId === 'Credits') {
      this.fetchCredits();
    }
    if (pageId === 'Dashboard' || pageId === 'Reviews') {
      this.fetchReviews();
    }
  }

  async handleLogin() {
    this.loginError.set('');
    if (!this.pinInput()) {
      this.loginError.set('กรุณากรอกรหัส PIN');
      return;
    }

    const res = await this.api.login(this.pinInput());
    if (res.success) {
      this.pinInput.set('');
      this.loadPageData(this.folder());
    } else {
      this.loginError.set(res.message);
    }
  }

  async handleLogout() {
    await this.api.logout();
  }

  async saveServerUrl() {
    if (this.serverUrlInput()) {
      await this.api.setServerUrl(this.serverUrlInput());
      alert('บันทึกที่อยู่เซิร์ฟเวอร์เรียบร้อย');
    }
  }

  async fetchCredits() {
    this.isLoadingData.set(true);
    const list = await this.api.getCredits();
    this.credits.set(list);
    this.isLoadingData.set(false);
  }

  async fetchReviews() {
    this.isLoadingData.set(true);
    const list = await this.api.getReviews();
    this.reviews.set(list);
    this.isLoadingData.set(false);
  }

  // ---------------- Camera & AI Slip Scan ----------------

  async takeSlipPhoto() {
    try {
      const res = await this.photoService.captureSlip();
      this.currentSlipPhoto.set(res.base64);
      this.scanResult.set(null);
      this.submitMessage.set('');
    } catch (err: any) {
      console.warn('Camera cancel or error:', err);
    }
  }

  async runAISlipScan() {
    const photo = this.currentSlipPhoto();
    if (!photo) return;

    this.isScanning.set(true);
    this.scanResult.set(null);
    try {
      const result = await this.api.verifySlipAI(photo);
      this.scanResult.set(result);

      // Auto-fill fields
      if (result.amount) this.creditPrice.set(result.amount);
      this.creditTitle.set(`งานบริการดิจิทัล (${result.bank || 'สลิปโอนเงิน'})`);
      this.creditCustomer.set(result.sender || 'ลูกค้าออนไลน์ (สลิปยืนยัน)');
      this.creditDescription.set(`${result.summary} [รหัสสลิป: ${result.transactionId || '-'}]`);
    } catch (err: any) {
      alert('AI Scan Error: ' + err.message);
    } finally {
      this.isScanning.set(false);
    }
  }

  async submitCredit() {
    if (!this.creditTitle() || !this.currentSlipPhoto()) {
      alert('กรุณาใส่รูปสลิปและชื่อรายการ');
      return;
    }

    this.isSubmittingCredit.set(true);
    const res = await this.api.createCredit({
      title: this.creditTitle(),
      price: Number(this.creditPrice()) || 0,
      customer: this.creditCustomer(),
      description: this.creditDescription(),
      base64Image: this.currentSlipPhoto() || undefined
    });

    this.isSubmittingCredit.set(false);
    if (res.success) {
      this.submitMessage.set('✅ บันทึกขึ้นระบบ Supabase เรียบร้อยแล้ว!');
      this.currentSlipPhoto.set(null);
      this.scanResult.set(null);
      this.fetchCredits();
    } else {
      alert('ไม่สามารถบันทึกได้: ' + res.message);
    }
  }

  // ---------------- AI Reviews Analysis ----------------

  async runAIReviewAnalysis() {
    this.isAnalyzingReviews.set(true);
    try {
      const insights = await this.api.analyzeReviewsAI();
      this.reviewInsights.set(insights);
    } catch (err: any) {
      alert('AI Review Error: ' + err.message);
    } finally {
      this.isAnalyzingReviews.set(false);
    }
  }

  // ---------------- AI CRAFT Content Generation ----------------

  async runAICraft() {
    if (!this.craftTopic()) return;
    this.isGeneratingCraft.set(true);
    try {
      const content = await this.api.generateContentAI(this.craftTopic(), this.craftType());
      this.craftResult.set(content);
    } catch (err: any) {
      alert('AI Content Error: ' + err.message);
    } finally {
      this.isGeneratingCraft.set(false);
    }
  }

  // Stats Helpers
  getTotalSales(): number {
    return this.credits().reduce((sum, c) => sum + (Number(c.price) || 0), 0);
  }

  getPositiveReviewsCount(): number {
    return this.reviews().filter(r => r.type === '+1').length;
  }

  getIssueReviewsCount(): number {
    return this.reviews().filter(r => r.type === '-1').length;
  }
}
