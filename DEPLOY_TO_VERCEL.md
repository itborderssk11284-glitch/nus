# คำแนะนำการติดตั้งและเชื่อมต่อระบบขึ้น Vercel (Deployment Guide)
## Sangkhlaburi Hospital Smart Workload & Workforce Assessment System

ระบบได้รับการตั้งค่าไฟล์คอนฟิกสำหรับ **Vercel** เรียบร้อยแล้ว (มีไฟล์ `vercel.json`, `package.json`, และ `src/utils/firebase.ts` ที่รองรับทั้งการอ่านคอนฟิกอัตโนมัติจากไฟล์และตัวแปร Environment Variables)

---

### ขั้นตอนที่ 1: นำโค้ดขึ้น GitHub / Git Repository
1. นำโฟลเดอร์โปรเจกต์นี้ขึ้น GitHub Repository (เช่น `nursing-workload-sangkhlaburi`)
2. ตรวจสอบว่ามีไฟล์สำคัญต่อไปนี้อยู่ในโปรเจกต์:
   - `vercel.json` (ตั้งค่า SPA Routing Rewrites ป้องกันปัญหาหน้า 404 เมื่อรีเฟรช)
   - `firebase-applet-config.json` (ข้อมูลการเชื่อมต่อ Firebase Firestore & Auth อัตโนมัติ)
   - `package.json`

---

### ขั้นตอนที่ 2: นำขึ้นโฮสติ้ง Vercel (Deploy to Vercel)
1. เข้าไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. คลิกปุ่ม **"Add New..."** -> **"Project"**
3. เลือก Repository ที่คุณอัปโหลดไว้ และกด **"Import"**
4. ในหน้าตั้งค่าโปรเจกต์:
   - **Framework Preset:** Vite (Vercel จะตรวจพบให้อัตโนมัติ)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. *(ตัวเลือกเสริม)*: สามารถเพิ่ม Environment Variables ในหัวข้อ **Environment Variables** ได้ตามไฟล์ `.env.example` (แต่ระบบมีไฟล์ `firebase-applet-config.json` ให้เรียบร้อยแล้ว จึงเชื่อมต่อฐานข้อมูลได้ทันทีแบบ Zero-Config)
6. คลิกปุ่ม **"Deploy"**
7. รอประมาณ 30-60 วินาที เมื่อเสร็จสิ้น คุณจะได้ URL เว็บไซต์ เช่น:
   `https://your-app-name.vercel.app`

---

### ขั้นตอนที่ 3: เพิ่มโดเมน Vercel ใน Firebase Authorized Domains (สำคัญมากสำหรับ Google Login)
เพื่อให้การเข้าสู่ระบบด้วย Google บนโดเมน Vercel ใช้งานได้สมบูรณ์:
1. เข้าไปที่ [Firebase Console](https://console.firebase.google.com/)
2. เลือกโปรเจกต์: `gen-lang-client-0590738786`
3. ไปที่เมนู **Authentication** -> แท็บ **Settings** (การตั้งค่า)
4. เลื่อนลงมาที่หัวข้อ **Authorized domains** (โดเมนที่ได้รับอนุญาต)
5. คลิก **"Add domain"** แล้วใส่โดเมนของ Vercel ของคุณ เช่น `your-app-name.vercel.app`
6. กด **"Add"** เรียบร้อย

---

### ข้อมูลการเชื่อมต่อฐานข้อมูล Firebase อัตโนมัติ
- **Firebase Project ID:** `gen-lang-client-0590738786`
- **Firestore Database ID:** `ai-studio-a3ea8142-d4aa-46d4-903c-79f3be317369`
- **Region:** `asia-southeast1`
- **Security Rules:** Deployed & Hardened เรียบร้อย
