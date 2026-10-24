import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonMenu,
  IonContent,
  IonList,
  IonListHeader,
  IonNote,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonRouterLink,
  IonBadge
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  cameraSharp,
  imagesOutline,
  imagesSharp,
  heartOutline,
  heartSharp,
  trashOutline,
  trashSharp,
  bookmarkOutline,
  bookmarkSharp,
  scanOutline,
  scanSharp,
  statsChartOutline,
  statsChartSharp,
  chatbubbleEllipsesOutline,
  chatbubbleEllipsesSharp,
  sparklesOutline,
  sparklesSharp,
  settingsOutline,
  settingsSharp,
  logInOutline,
  logInSharp,
  logOutOutline,
  logOutSharp,
  shieldCheckmarkOutline,
  shieldCheckmarkSharp
} from 'ionicons/icons';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonNote,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterLink,
    IonRouterOutlet,
    IonBadge
  ],
})
export class AppComponent {
  public api = inject(ApiService);

  protected readonly appPages = [
    { title: 'ภาพรวม & สถิติ (Dashboard)', url: '/folder/Dashboard', icon: 'stats-chart', badge: null },
    { title: 'AI ถ่ายและตรวจสลิป (Scan)', url: '/folder/ScanSlip', icon: 'scan', badge: 'AI' },
    { title: 'รายการเครดิตร้าน (Credits)', url: '/folder/Credits', icon: 'images', badge: null },
    { title: 'รีวิว & AI Insights (Reviews)', url: '/folder/Reviews', icon: 'chatbubble-ellipses', badge: 'AI' },
    { title: 'AI ช่วยเขียนเนื้อหา (CRAFT)', url: '/folder/AICopywriter', icon: 'sparkles', badge: 'AI' },
    { title: 'ตั้งค่าการเชื่อมต่อ (Settings)', url: '/folder/Settings', icon: 'settings', badge: null },
  ];

  constructor() {
    addIcons({
      cameraOutline,
      cameraSharp,
      imagesOutline,
      imagesSharp,
      heartOutline,
      heartSharp,
      trashOutline,
      trashSharp,
      bookmarkOutline,
      bookmarkSharp,
      scanOutline,
      scanSharp,
      statsChartOutline,
      statsChartSharp,
      chatbubbleEllipsesOutline,
      chatbubbleEllipsesSharp,
      sparklesOutline,
      sparklesSharp,
      settingsOutline,
      settingsSharp,
      logInOutline,
      logInSharp,
      logOutOutline,
      logOutSharp,
      shieldCheckmarkOutline,
      shieldCheckmarkSharp
    });
  }
}
