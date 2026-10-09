import os
import sys
import glob
import pymupdf
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

wm_path = os.path.join('web', 'public', 'images', 'watermark.png')
if not os.path.exists(wm_path):
    print(f"Error: Watermark not found at {wm_path}")
    sys.exit(1)

wm = Image.open(wm_path).convert('RGBA')

web_out_dir = os.path.join('web', 'public', 'images', 'portfolio')
pub_out_dir = os.path.join('public', 'images', 'portfolio')
os.makedirs(web_out_dir, exist_ok=True)
os.makedirs(pub_out_dir, exist_ok=True)

pdf_folder = r'D:\My work\ผลงานกราฟิก'

items_config = [
    {
        'file': 'โปสเตอร์กีฬาสี.pdf',
        'slug': 'portfolio-poster-ratchapruek-game',
        'title': 'โปสเตอร์การแข่งขันกีฬาสี ราชพฤกษ์เกมส์ (Ratchapruek Game)'
    },
    {
        'file': 'Concert.pdf',
        'slug': 'portfolio-poster-concert-beat-of-luv',
        'title': 'โปสเตอร์คอนเสิร์ต BEAT OF LUV วันวาเลนไทน์'
    },
    {
        'file': 'kuroko no basket.pdf',
        'slug': 'portfolio-poster-kuroko-no-basket',
        'title': 'โปสเตอร์กราฟิก Kuroko no Basket (Generation of Miracles)'
    },
    {
        'file': '+1 ไม่โกง คุยง่าย (560 × 312 mm) (560 × 312 mm) (560 × 312 mm).pdf',
        'slug': 'portfolio-banner-credit-raiden-shogun',
        'title': 'ป้ายเครดิตซื้อขายร้านค้าออนไลน์ (+1 ไม่โกง คุยง่าย — Raiden Shogun Theme)'
    },
    {
        'file': '+1 ไม่โกง คุยง่าย (560 × 312 mm).pdf',
        'slug': 'portfolio-banner-promo-rates',
        'title': 'ป้ายโปรเปิดร้าน & เรทราคาซื้อขายเกม (Special Promotion Banner)'
    },
    {
        'file': 'AI ENGI.pdf',
        'slug': 'portfolio-ai-engineering-identity',
        'title': 'ตราสัญลักษณ์ & แบนเนอร์สาขาวิศวกรรมปัญญาประดิษฐ์ (AI Engineering & DI)'
    },
    {
        'file': 'Add a subheading (1280 × 1280 px) (1280 × 1280 px).pdf',
        'slug': 'portfolio-how-to-pay-scb-qr',
        'title': 'ป้ายช่องทางชำระเงิน How to Pay (SCB QR Scan & Transfer)'
    },
    {
        'file': 'Add a subheading (1280 × 1280 px) (1280 × 1280px).pdf',
        'slug': 'portfolio-rate-card-dice-service',
        'title': 'ป้ายเรทราคาบริการเกม & รับปั๊มเต๋า (Damian Game Service)'
    },
    {
        'file': 'Add a subheading (1280 × 1280 px).pdf',
        'slug': 'portfolio-how-to-pay-pastel-blue',
        'title': 'ป้าย How to Pay โทนสีฟ้าพาสเทล พร้อมกรอบสแกน QR'
    },
    {
        'file': 'Add a subheading.pdf',
        'slug': 'portfolio-how-to-pay-minimal-notice',
        'title': 'ป้ายแจ้งชำระเงินและช่องทางติดต่อ (Payment Guide Banner)'
    },
    {
        'file': 'BS (960 × 1200 px) (960 × 1200 px).pdf',
        'slug': 'portfolio-banner-bannasan-school',
        'title': 'ป้ายแบนเนอร์ประชาสัมพันธ์โรงเรียน (Bannasan School Banner)'
    },
    {
        'file': 'Colorful Illustrative Book Fair Flyer.pdf',
        'slug': 'portfolio-flyer-computer-engineering',
        'title': 'โปสเตอร์กิจกรรมนิทรรศการ Computer Engineering (3 กิจกรรมไฮไลต์)'
    },
    {
        'file': 'Copy of เพิ่มหัวเรื่องย่อย.pdf',
        'slug': 'portfolio-logo-nurse-association',
        'title': 'ตราสัญลักษณ์ & แบนเนอร์ สมาคมพยาบาลจังหวัดอุดรธานี'
    },
    {
        'file': 'How to (1280 × 1280 px).pdf',
        'slug': 'portfolio-how-to-pay-scb-wallet-cute',
        'title': 'ป้าย How to Pay ธนาคารไทยพาณิชย์ & TrueMoney Wallet สไตล์น่ารัก'
    },
    {
        'file': 'เลขบัญชี  135-3-84767-4 ธนาคาร  กสิกรไทย ชื่อบัญชี  ปิยะอนันต์ จิตทักษะ.pdf',
        'slug': 'portfolio-how-to-pay-kbank-wallet-set',
        'title': 'เซ็ตป้าย How to Pay ธนาคารกสิกรไทย & TrueMoney Wallet'
    },
    {
        'file': 'อัพเสา (960 × 1199 px) (960 × 1199 px) (1600 × 1199 px).pdf',
        'slug': 'portfolio-genshin-service-price-set',
        'title': 'ป้ายเรทราคาบริการเกม Genshin Impact ครบวงจร (ชุด 9 รายการ)'
    },
    {
        'file': 'อัพเสา (960 × 1199 px) (960 × 1199 px).pdf',
        'slug': 'portfolio-genshin-dungeon-boss-rates',
        'title': 'ป้ายเรทราคาลงดัน & บอสสัปดาห์ Genshin Impact'
    },
    {
        'file': 'อัพเสา (960 × 1199 px).pdf',
        'slug': 'portfolio-genshin-statue-unlock-rates',
        'title': 'ป้ายเรทราคาอัพเสาลม เสาหิน เสาไฟฟ้า Genshin Impact'
    },
    {
        'file': 'ดีไซน์ที่ยังไม่ได้ตั้งชื่อ.pdf',
        'slug': 'portfolio-poster-modern-aesthetic',
        'title': 'โปสเตอร์ศิลปะจัดวาง & กราฟิกดีไซน์ร่วมสมัย (Modern Aesthetic Poster)'
    },
    {
        'file': 'E-Book สื่อการสอนการจัดการฝ่ายห้องพัก.pdf',
        'slug': 'portfolio-ebook-room-division-management',
        'title': 'ปก & รูปเล่ม E-Book สื่อการสอนการจัดการฝ่ายห้องพัก (มทร.ศรีวิชัย)'
    },
    {
        'file': 'E-Book สื่อการสอนรายวิชา Front Office Operations.pdf',
        'slug': 'portfolio-ebook-front-office-operations',
        'title': 'ปก & รูปเล่ม E-Book วิชา Front Office Operations (มทร.ศรีวิชัย)'
    },
    {
        'file': 'E-Book สื่อการสอนรายวิชาการดำเนินงานและการจัดการงานแม่บ้าน.pdf',
        'slug': 'portfolio-ebook-housekeeping-operations',
        'title': 'ปก & รูปเล่ม E-Book วิชาการดำเนินงานและการจัดการงานแม่บ้าน'
    },
    {
        'file': 'FOLIO.pdf',
        'slug': 'portfolio-student-folio-business-computer',
        'title': 'แฟ้มสะสมผลงาน Portfolio คอมพิวเตอร์ธุรกิจและการโรงแรม'
    },
    {
        'file': 'Woranat Rueangkhachon.pdf',
        'slug': 'portfolio-student-folio-logistics',
        'title': 'แฟ้มสะสมผลงาน Portfolio สาขาวิชาการจัดการโลจิสติกส์ (12 หน้า)'
    },
    {
        'file': 'วงรี ( Ellipse ).pdf',
        'slug': 'portfolio-slide-math-ellipse',
        'title': 'สไลด์สื่อการสอนคณิตศาสตร์ เรื่อง วงรี (Ellipse Slide Deck 46 แผ่น)'
    },
    {
        'file': 'สไลด์นำเสนอ_DailyRipe.pdf.pdf',
        'slug': 'portfolio-slide-dailyripe-packaging',
        'title': 'สไลด์นำเสนอโครงงานนวัตกรรม DailyRipe บรรจุภัณฑ์กล้วยอัจฉริยะ'
    }
]

print(f"Starting processing {len(items_config)} files...")

for idx, item in enumerate(items_config, 1):
    pdf_path = os.path.join(pdf_folder, item['file'])
    if not os.path.exists(pdf_path):
        print(f"Missing file: {pdf_path}")
        continue
    doc = pymupdf.open(pdf_path)
    page = doc[0]
    pix = page.get_pixmap(dpi=150)
    img = Image.frombytes('RGB', [pix.width, pix.height], pix.samples).convert('RGBA')
    doc.close()

    bw, bh = img.size
    target_w = int(bw * 0.45)
    target_h = int(target_w * (wm.height / wm.width))
    if target_h > bh * 0.38:
        target_h = int(bh * 0.38)
        target_w = int(target_h * (wm.width / wm.height))

    resized_wm = wm.resize((target_w, target_h), Image.Resampling.LANCZOS)
    r, g, b, a = resized_wm.split()
    a = a.point(lambda p: int(p * 0.85))
    resized_wm.putalpha(a)
    rotated_wm = resized_wm.rotate(-10, expand=True, resample=Image.Resampling.BICUBIC)

    pos_x = (bw - rotated_wm.width) // 2
    pos_y = (bh - rotated_wm.height) // 2

    watermarked = img.copy()
    watermarked.paste(rotated_wm, (pos_x, pos_y), rotated_wm)
    final_img = watermarked.convert('RGB')

    slug = item['slug']
    out_webp_1 = os.path.join(web_out_dir, f"{slug}.webp")
    out_webp_2 = os.path.join(pub_out_dir, f"{slug}.webp")
    out_png_1 = os.path.join(web_out_dir, f"{slug}.png")
    out_png_2 = os.path.join(pub_out_dir, f"{slug}.png")

    final_img.save(out_webp_1, format='WEBP', quality=90)
    final_img.save(out_webp_2, format='WEBP', quality=90)
    final_img.save(out_png_1, format='PNG')
    final_img.save(out_png_2, format='PNG')

    print(f"[{idx:02d}/26] Processed: {slug} ({bw}x{bh})")

print("All 26 graphics successfully processed with watermark!")
