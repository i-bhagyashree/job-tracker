# 💼 JobTrackr — Job Application Tracker

A full-stack MERN app to organize your job/internship hunt: track every application on a drag-and-drop Kanban board, set follow-up reminders, and see your progress on an analytics dashboard.

**Live demo:** https://job-tracker-taupe-sigma-13.vercel.app · **Screenshots:** _add a GIF here_

## ✨ Features

- 🔐 **Authentication** — register/login with JWT, bcrypt-hashed passwords, protected routes
- 🗂️ **Kanban board** — Wishlist → Applied → Interview → Offer → Rejected, with drag & drop (mouse + keyboard accessible)
- ⚡ **Optimistic UI** — board updates instantly, rolls back if the server request fails
- 📝 **Full CRUD** — company, role, location, job link, stipend, notes, applied date, follow-up date
- 🔔 **Follow-up reminders** — overdue follow-ups highlighted on cards, upcoming list on dashboard
- 📊 **Analytics dashboard** — response rate, interview rate, weekly applications chart, pipeline breakdown (MongoDB aggregation pipelines)
- ✅ **Prep checklist** per application — track steps like "tailor resume" or "ask for referral", with progress shown on the card
- ⏳ **Needs attention** — overdue follow-ups and applications with no reply for 14+ days are flagged on cards and the dashboard
- 🎯 **Weekly goal** — set a target number of applications per week and track progress on the dashboard
- 📅 **Add interviews to your calendar** — Google Calendar link or `.ics` download (Apple Calendar / Outlook)
- 👯 **Duplicate warning** when adding a company + role you already track
- ⚙️ **Settings** — edit profile, change password, delete account (and all its data)
- 🔎 **Find Jobs** — search internships & jobs on Internshala and LinkedIn (role, city, work-from-home), then save finds straight to your Wishlist
- 🔍 **Search** across company, role and location
- 📱 **Responsive** design, loading skeletons, empty & error states, toast notifications

## 🛠 Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router, TanStack Query, dnd-kit, Recharts |
| Backend  | Node.js, Express 5, Zod validation |
| Database | MongoDB + Mongoose |
| Security | JWT, bcrypt, Helmet, rate limiting, CORS, per-user data isolation |

## 🚀 Getting Started

```bash
npm run install:all
cp server/.env.example server/.env   # set JWT_SECRET (and MONGO_URI for persistent data)
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5050

> No `MONGO_URI`? The server automatically starts a **local dev MongoDB** so you can try it with zero setup (data is saved in `.data/`). For real data, create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).

## 🗄️ Where data is stored

| What | Where |
|------|-------|
| Users & applications | **MongoDB**, database `jobtracker`, collections `users` and `applications` |
| Local dev (no `MONGO_URI`) | A real `mongod` started by `mongodb-memory-server`, writing to **`.data/`** in the project root. It's persistent, and it's git-ignored |
| Production | MongoDB Atlas, connected through the Vercel integration (`MONGODB_URI`) |
| Passwords | Only bcrypt hashes are stored, never plain text |
| Login session | JWT (valid 7 days) kept in the browser's `localStorage` |

Each application document holds its status history and checklist tasks as embedded arrays, and every query is scoped to the logged-in user.

## 📡 API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in, returns JWT |
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/auth/me` | Update name / weekly goal |
| PATCH | `/api/auth/password` | Change password |
| DELETE | `/api/auth/me` | Delete account + all applications |
| GET | `/api/applications?search=&status=` | List applications |
| POST | `/api/applications` | Create |
| PATCH | `/api/applications/:id` | Update |
| PATCH | `/api/applications/reorder` | Bulk update status/order (drag & drop) |
| DELETE | `/api/applications/:id` | Delete |
| GET | `/api/applications/stats` | Dashboard analytics |

## 📁 Structure

```
job-tracker/
├── api/index.js       # Vercel serverless entry (runs the Express app)
├── server/src/
│   ├── models/        # User, Application (Mongoose)
│   ├── routes/        # auth, applications
│   ├── middleware/    # JWT auth, error handler
│   ├── app.js         # Express app
│   └── index.js       # local server (npm run dev)
└── client/src/
    ├── pages/         # AuthPage, Board, Dashboard, FindJobs, Settings
    ├── components/    # KanbanColumn, ApplicationCard, ApplicationModal, Layout
    ├── context/       # AuthContext
    └── lib/           # axios client, React Query hooks, CSV export, calendar
```

## ☁️ Deployment

The frontend and API deploy together as **one Vercel project** (config in [`vercel.json`](vercel.json)):

- `client/` is built to static files and served by Vercel
- `api/index.js` runs the Express API as a serverless function, so the site calls `/api` on the same domain (no CORS setup needed)
- **Database:** MongoDB Atlas via the Vercel Marketplace integration, which sets `MONGODB_URI` automatically

Environment variables on Vercel: `MONGODB_URI` (from the integration) and `JWT_SECRET`.

```bash
npx vercel deploy --prod
```

---

Made with ❤️ by **Bhagyashree Soni**
