<div align="center">

  <img src="public/images/logo.svg" alt="SUNFZ Logo" width="80" height="80">

  # SUNFZ Store — Credit & Proof Showcase Web Application

  **Minimal Modern & Clean Trust Platform for Gaming Accounts & Digital Goods Proof-of-Delivery**

  [![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
  [![Express](https://img.shields.io/badge/Express-v5.0-000000?logo=express&logoColor=white)](https://expressjs.com)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
  [![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/underwaves)

  <p align="center">
    <a href="#-overview">Overview</a> •
    <a href="#-key-features">Key Features</a> •
    <a href="#-architecture--design">Architecture</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-admin-guide">Admin Guide</a> •
    <a href="#-deployment">Deployment</a>
  </p>

</div>

---

## 📖 Overview

**SUNFZ Store** is a full-stack, proof-of-delivery credit showcase web application built for digital commerce sellers (game accounts, premium accounts, digital items, and online services). 

Designed around the **"Clean Trust & Proof-First"** design philosophy, it allows sellers to upload and organize payment slips, handover screenshots, and customer chat proofs into an elegant, high-converting public catalog with zero clutter.

### 💡 Core Design Principles
- **Decoupled User Experience:** The customer-facing storefront (`/`) contains **zero admin controls, buttons, or modals** — strictly clean for visitors to browse and verify.
- **Dedicated Admin Studio:** Store administrators manage everything exclusively through a PIN-protected, standalone web app portal (`/admin`).
- **Proof-First Cards:** High-resolution screenshots take center stage with responsive aspect ratios, zoomable lightboxes, and one-click deep-link sharing.

---

## ✨ Key Features

### 🛍️ Customer Storefront (`/`)
- **Clean Card Feed:** Displays verified orders with high-res proof thumbnails, transaction dates, customer handles, and prices.
- **Interactive Lightbox:** Fullscreen image modal supporting multiple screenshots, zoom-in inspection, keyboard navigation (Escape, Arrow keys), and direct image download.
- **Instant Search:** Real-time client-side search filtering by item title, customer name, price, or description.
- **Deep Linking:** Direct URL support (e.g. `/?credit=sample-1`) to open specific credit proofs instantly.
- **Social Quick Links:** Seamless integration with Line, Facebook, and Discord channels.

### 🛡️ Dedicated Admin Studio (`/admin`)
- **PIN Lock Authentication:** Fast numeric PIN entry with stateless HMAC signed session tokens and HttpOnly cookies.
- **Drag & Drop Upload:** Multi-file drag-and-drop dropzone supporting up to 5 images per credit (JPG, PNG, WebP) with instant thumbnail removal.
- **Flexible Items Categorization:** "Sell anything" structure — title, price, customer, review note, and pin toggle.
- **One-Click Pinning:** Pin featured items to always appear at the top of the feed.
- **Full CRUD Management:** Real-time editing, deletion with safeguard confirmation, and image replacements.
- **Shop Customization:** Live editing of shop name, tagline, announcement marquee, and social links.
- **Zero Data Loss Backup:** One-click JSON database export and instant restore.

---

## 🏗️ Architecture & Design

```
├── server.js               # Express 5 server, HMAC sessions, REST API, Multer upload
├── data/
│   └── database.json       # Atomic JSON document database
├── public/
│   ├── index.html          # Public customer storefront (Zero admin exposure)
│   ├── admin.html          # Dedicated Admin Studio Web App
│   ├── css/
│   │   └── style.css       # Custom styles, smooth fonts, scrollbar & animations
│   ├── js/
│   │   ├── app.js          # Customer frontend logic (Lightbox, search, render)
│   │   └── admin.js        # Admin studio logic (PIN auth, CRUD, drag & drop)
│   ├── images/             # Brand logos & vector placeholders
│   └── uploads/            # Uploaded proof screenshots & slips
├── DEPLOY.md               # 24/7 Cloud deployment guide
└── package.json            # Dependencies & start scripts
```

### 🔒 Security Highlights
- **Stateless HMAC-SHA256 Sessions:** Admin sessions are signed cryptographically using server secret keys.
- **HttpOnly & SameSite Cookies:** Mitigates XSS token extraction.
- **Atomic Database Writes:** JSON database updates use temporary swap files (`.tmp` -> rename) to prevent file corruption during server interruptions.
- **Input Sanitization:** Complete HTML entity escaping across all rendered fields to prevent XSS injection.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | [Node.js](https://nodejs.org/) & [Express 5](https://expressjs.com/) | Lightweight, asynchronous REST API runtime |
| **File Handling** | [Multer](https://github.com/expressjs/multer) | High-speed multi-part form data & disk storage |
| **Frontend** | Vanilla JavaScript (ES6+) | Blazing fast client logic with zero framework overhead |
| **Styling** | [Tailwind CSS CDN](https://tailwindcss.com/) & Custom CSS | Responsive layout following `#F8FAFC` Minimal Trust Palette |
| **Typography** | Google Fonts | Plus Jakarta Sans, Prompt, Noto Sans Thai |
| **Icons** | [Lucide Icons](https://lucide.dev/) | Crisp, modern SVG icons |
| **Database** | Embedded JSON DB | Portable, human-readable atomic JSON persistence |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [npm](https://www.npmjs.com/) v9.0.0 or higher

### 1. Clone Repository
```bash
git clone https://github.com/underwaves/credits.git
cd credits
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Application
```bash
npm start
```
The server will start at:
- **Public Customer Site:** `http://localhost:3000`
- **Admin Studio:** `http://localhost:3000/admin` (Default PIN: `1234`)

For development with live reloading:
```bash
npm run dev
```

---

## 🔑 Admin Guide

1. Navigate to `http://localhost:3000/admin` in your browser.
2. Enter the admin PIN (Default: `1234`).
3. Inside the Admin Studio, you can:
   - **Upload Credits:** Drop proof screenshots into the dropzone, fill in details, and click submit.
   - **Pin Items:** Click the star icon to pin important transactions to the top.
   - **Edit / Delete:** Modify pricing, title, notes, or delete records.
   - **Update PIN & Settings:** Change your PIN and store announcement at the Settings tab.
   - **Download Backup:** Export your entire store database as a `.json` file for safekeeping.

---

## 🌐 Deployment

### Option 1: Instant Public URL (Cloudflare Tunnel)
To test and share with friends/customers on mobile devices right now:
```bash
npx cloudflared tunnel --url http://localhost:3000
```

### Option 2: 24/7 Free Cloud Hosting (Render.com)
1. Fork or push this repository to your GitHub account.
2. Create an account at [Render.com](https://render.com).
3. Click **New +** -> **Web Service** -> Connect this repository.
4. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** `Free`
5. Click **Create Web Service** — your app is live 24/7 with automatic HTTPS!

*(Detailed step-by-step instructions available in [DEPLOY.md](DEPLOY.md))*

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  Crafted with ❤️ by <strong><a href="https://github.com/underwaves">SUNFZ (underwaves)</a></strong>
</div>
