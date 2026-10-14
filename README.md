# EV Charging Station Billing & Receipt System
# ระบบบริหารจัดการเอกสารการเงินสถานีชาร์จ EV

## Environment Variables (set in Vercel Dashboard)
```
DATABASE_URL=postgresql://...   # Pooled connection string (from Neon/Supabase/Vercel Postgres)
DIRECT_URL=postgresql://...     # Direct connection string
```

## Setup
```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

## Tech Stack
- Next.js 15 (App Router)
- React 19
- Tailwind CSS + Shadcn UI
- Prisma + PostgreSQL
- Thai Language UI (Prompt + Sarabun fonts)
