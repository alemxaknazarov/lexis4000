# 📘 LEXIS 4000 — Loyiha Haqida To'liq Ma'lumotnoma (Project Overview)

> Ushbu hujjat **LEXIS 4000** ta'limiy platformasining to'liq tahlili, texnik arxitekturasi va funksional imkoniyatlarini o'z ichiga oladi. Asosiy dasturchi qo'llanmasi uchun [README.md](file:///Users/astro/Desktop/lexis-4000/README.md) fayliga qarang.

---

## 1. Loyihaning Qisqacha Tavsifi
**LEXIS 4000** — Paul Nation tomonidan tuzilgan dunyoga mashhur **"4000 Essential English Words"** (1–6 kitoblar) kursi asosida yaratilgan interaktiv lug'at va so'z o'rganish platformasi. Loyiha [lexis4000.uz](https://www.lexis4000.uz) domenida faoliyat yuritadi.

Platformaning tub mohiyati — shunchaki so'zni ko'rsatish emas, balki foydalanuvchiga uni **5 xil sensorik usul** bilan miyasida chuqur muhrlashga yordam berishdan iborat.

---

## 2. Asosiy Modullar va Texnik Imkoniyatlar

### 🔹 Neyrolingvistik 5+1 Bosqichli Sikl (`/src/components/learning/`)
Har bir 20 ta so'zdan iborat dars quyidagi bosqichlardan o'tadi:
1. **Phase 1: Flashcard** — Yangi so'z, uning talaffuzi (audio), IPA transkripsiyasi, ma'nosi va jumlada ishlatilishi.
2. **Phase 2: Spelling** — So'zni to'g'ri yozish mashqi (motor xotirani shakllantiradi).
3. **Phase 3: Quiz** — Kontekstli 4 variantli test sinovi.
4. **Phase 4: Voice** — Web Speech API orqali talaffuzni tekshirish va sun'iy intellekt orqali baholash.
5. **Phase 5: Visual** — So'zga mos 4 ta rasm ichidan to'g'risini topish (ko'rish xotirasi).
6. **Phase 6: Summary** — Olingan XP, to'g'rilik foizi va qayd qilingan xatolar xulosasi.

### 🔹 Gamifikatsiya & Odat Shakllantirish
- **XP (Tajriba Ballari):** Har bir o'rganilgan so'z va topshirilgan bosqich uchun XP beriladi.
- **Streak Tizimi:** Foydalanuvchi kunlik o'qishini uzmasligi uchun streak zanjiri yuritiladi.
- **Leaderboard (`/leaderboard`):** Foydalanuvchilar o'rtasida sog'lom raqobatni ta'minlovchi reyting jadvali.
- **Mistakes Hub (`/mistakes`):** O'quvchi adashgan so'zlar avtomatik yig'iladi va alohida qayta mashq qilinadi.

### 🔹 Telegram Bot Orqali Parolsiz Kirish (Passwordless OTP)
- Login qilishda elektron pochta yoki parol talab qilinmaydi.
- Foydalanuvchi Telegram botdan 6 xonali kod oladi va saytga kiritadi.
- Serverless funksiya (`/api/verify-code.ts`) kodni tekshirib, 24 soatlik xavfsiz sessiya ochadi.
- Kirish bilan botdagi vaqtinchalik xabarlar avtomatik o'chirilib, tabrik xabari yuboriladi.

### 🔹 Quvvatli Admin Paneli (`/admin` yoki `/admin-uchun`)
- Ro'yxatdan o'tgan foydalanuvchilar va ularning faolligi monitoringi.
- Barcha foydalanuvchilarga Telegram orqali broadcast e'lonlar yuborish.
- 4000 ta so'zlik lug'at bazasini to'liq ko'rish, qidirish va tahrirlash.
- Foydalanuvchilarning streak yoki ballarini to'g'rilash vositalari.

---

## 3. Texnologik Arxitektura

- **Frontend:** React 19, Vite 8, TypeScript 6, Tailwind CSS v4, Lucide Icons.
- **Backend / DB:** Supabase (PostgreSQL, Row-Level Security, Auth).
- **Serverless API:** Vercel Functions (`/api/*`).
- **Bot:** Telegram Bot API (Webhook va Cron orqali avtomatik streak eslatmalari).
- **Audio & Ovoz:** Web Speech API (Ovozni tanish va matnni o'qish).
- **Optimizatsiya:** Dinamik lazy-loading (`wordLoader.ts` orqali boshlang'ich yuklanish o'lchami < 200KB).

---

## 4. Marshrutlar (Routes)

- `/` — Kitoblar katalogi (6 ta jild)
- `/book/:bookNumber` — Kitobdagi 30 ta unit tanlash
- `/book/:bookNumber/unit/:unitNumber` — Unitdagi 20 ta so'z ro'yxati
- `/book/:bookNumber/unit/:unitNumber/learn` — 5 bosqichli o'rganish xonasi (Avtorizatsiya talab qiladi)
- `/login` — Telegram OTP orqali kirish sahifasi
- `/profile` — Foydalanuvchi profili va statistikasi
- `/leaderboard` — O'quvchilar reyting jadvali
- `/mistakes` — Xatolar ustida ishlash sahifasi
- `/settings` — Ilova sozlamalari (Mavzu, ovoz sozlamalari)
- `/admin` yoki `/admin-uchun` — Administrator boshqaruv paneli
