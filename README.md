# 🏒 Northbrook Bluehawks Summer Training Tracker

A full-stack web app for tracking daily shot and stickhandle counts over the summer.
Players log their reps each day; coaches see a live leaderboard and weekly report.

**Tech Stack:** React 18 · Vite · Supabase (Auth + Postgres) · Recharts · Vercel

---

## 🚀 Getting Started (5 steps, ~15 minutes)

### 1 · Create a Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) and sign in
2. Click **New project**, name it `bluehawks-tracker`, set a DB password
3. Wait ~2 minutes for provisioning

### 2 · Run the database schema

1. In your Supabase project, go to **SQL Editor → New Query**
2. Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql)
3. Click **Run** — you should see "Success" for each statement

### 3 · Copy your API keys

1. Go to **Settings → API** in your Supabase project
2. Copy **Project URL** and **anon / public key**
3. In this project folder, copy the env template and fill it in:

```bash
cp .env.example .env
```

Then edit `.env`:
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4 · Install and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the app is running!

### 5 · Make yourself an admin

1. Open the app and create your account via **Create Account**
2. Back in Supabase, go to **SQL Editor → New Query** and run:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'your@email.com'
);
```

3. Sign out and back in — you'll now see the admin nav (Leaderboard / Weekly Report / Players)

---

## 📦 Deploy to Vercel (free)

1. Push this project to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` → your project URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key
4. Click **Deploy** — live in ~60 seconds

> **Tip:** Add your Vercel domain (e.g. `bluehawks.vercel.app`) to
> Supabase **Authentication → URL Configuration → Redirect URLs**
> so email confirmation links work correctly.

---

## 🏗️ Project Structure

```
bluehawks-tracker/
├── public/
│   └── logo.png                  # Bluehawks logo (favicon + UI)
├── src/
│   ├── main.jsx                  # React entry point
│   ├── App.jsx                   # Auth wiring + view router
│   ├── App.css                   # All styles
│   ├── supabaseClient.js         # Supabase singleton
│   ├── utils.js                  # Date helpers, stat calculations
│   └── components/
│       ├── AuthScreen.jsx        # Login + Create Account
│       ├── Nav.jsx               # Top navigation bar
│       ├── LogToday.jsx          # Daily counter (player)
│       ├── MyProgress.jsx        # Stats + charts (player + admin drilldown)
│       ├── Leaderboard.jsx       # Rankings + charts (admin)
│       ├── WeeklyReport.jsx      # Branded weekly report (admin)
│       ├── Players.jsx           # Player grid (admin)
│       ├── Spinner.jsx           # Loading state
│       └── ChartTooltip.jsx      # Recharts tooltip
├── supabase/
│   └── schema.sql                # Full DB schema + RLS policies
├── .env.example                  # Environment variable template
├── index.html
├── vite.config.js
└── package.json
```

---

## 🔐 Roles & Permissions

| Feature              | Player | Admin |
|---------------------|--------|-------|
| Log today's reps     | ✅     | —     |
| View own progress    | ✅     | ✅    |
| View team leaderboard| —      | ✅    |
| Weekly report        | —      | ✅    |
| All player profiles  | —      | ✅    |

Admins are assigned manually via SQL (see Step 5 above).
All data access is enforced at the database level via Row Level Security.

---

## 🎯 Summer Goals

Defaults are set in `src/utils.js`:
```js
export const SHOT_GOAL  = 5000
export const STICK_GOAL = 10000
```
Change these values and redeploy to update the goal bars for all players.

---

## 🛠️ Local Development Tips

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Supabase has generous free-tier limits: 500 MB database, 50,000 monthly active users,
and unlimited API requests — more than enough for a youth hockey team.
