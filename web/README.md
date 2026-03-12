# NANO HRIS — Admin Panel

Admin panel untuk sistem manajemen kehadiran PT Nano Indonesia Sakti.

## Tech Stack

- React 18 + TypeScript
- Vite (bundler)
- Tailwind CSS
- React Router v6
- Recharts (grafik)
- Leaflet.js / React-Leaflet (peta)
- Lucide React (icons)

## Setup & Menjalankan

### 1. Install dependencies

```bash
npm install
```

### 2. Jalankan development server

```bash
npm run dev
```

Buka http://localhost:5173

### 3. Build production

```bash
npm run build
```

## Halaman yang sudah diimplementasi

| Route               | Halaman                                         | Status  |
| ------------------- | ----------------------------------------------- | ------- |
| `/summary-report`   | Summary Report (absensi harian + stats + chart) | ✅ Done |
| `/location-map`     | Location Map (realtime GPS markers)             | ✅ Done |
| `/issue-attendance` | Issue Attendance (log masuk/keluar)             | ✅ Done |
| `/employee`         | Employee List + Management                      | ✅ Done |
| `/hierarchy`        | Hierarchy (Position, Grade, Employment Status)  | ✅ Done |
| `/zones`            | Zones / Work Location + peta                    | ✅ Done |
| `/company`          | Company Settings                                | ✅ Done |

## Integrasi Supabase

Untuk menghubungkan ke Supabase, buat file `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Kemudian install Supabase client:

```bash
npm install @supabase/supabase-js
```

Dan buat file `src/lib/supabase.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

## Struktur Folder

```
src/
├── components/
│   └── layout/
│       └── AppLayout.tsx     # Sidebar + Topbar
├── data/
│   └── mockData.ts           # Data mock (ganti dengan Supabase queries)
├── pages/
│   ├── summary-report/
│   ├── location-map/
│   ├── issue-attendance/
│   ├── employees/
│   ├── hierarchy/
│   ├── zones/
│   └── company/
├── types/
│   └── database.ts           # TypeScript types
├── App.tsx                   # Routing
├── main.tsx                  # Entry point
└── index.css                 # Global styles + Tailwind
```
