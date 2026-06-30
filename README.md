<div align="center">

<img src="https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge" />
<img src="https://img.shields.io/badge/Part%20of-True%20Value%20Infotech-0066CC?style=for-the-badge&logo=building&logoColor=white" />
<img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />

<br/><br/>

<img src="https://github.com/Akshatsrii/Job-parser/blob/main/ee.png?raw=true" alt="AI Job Portal Parser" width="100%" />

# 🤖 AI Job Portal Parser

### *Paste a URL. Get a structured job profile. In seconds.*

An intelligent MERN-stack application that extracts, structures, and stores job data from any URL or raw job description — powered by **Google Gemini 2.5 Flash** and a smart 4-layer extraction pipeline.

> 🏢 **This project is an active running module of the main platform at [True Value Infotech](https://truevalueinfotech.com), Jaipur, Rajasthan.**

<br/>

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%202.5%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## 📸 Screenshots

<div align="center">

| Parse Job Page | Job List | Job Details |
|:-:|:-:|:-:|
| ![Parse](https://placehold.co/380x220/0f172a/38bdf8?text=Parse+Job+URL) | ![List](https://placehold.co/380x220/0f172a/38bdf8?text=Job+Listings) | ![Details](https://placehold.co/380x220/0f172a/38bdf8?text=Job+Details) |

> 📌 *Replace placeholder images with actual screenshots once deployed.*

</div>

---

## ✨ What It Does

```
User Input (URL or Description)
        │
        ▼
┌───────────────────────────────────────────────────┐
│               4-Layer Extraction Pipeline          │
│                                                   │
│  Layer 1 → Direct Fetch (Axios)                   │
│  Layer 2 → CORS Proxy (allorigins.win)            │
│  Layer 3 → Fallback Proxy (corsproxy.io)          │
│  Layer 4 → Raw Description Fallback               │
└───────────────────────────────────────────────────┘
        │
        ▼
  Gemini 2.5 Flash
  (AI Extraction)
        │
        ▼
  Structured JSON ──► MongoDB ──► React UI
```

When you paste a job URL or a raw job description, the parser:

1. **Fetches** the page content using a dual-proxy CORS bypass strategy
2. **Sends** the cleaned HTML/text to Gemini 2.5 Flash
3. **Extracts** 13 structured fields (company, title, salary, skills, etc.)
4. **Saves** the result to MongoDB
5. **Displays** it in a clean, filterable React UI

---

## 🚀 Features

| Category | Feature |
|----------|---------|
| 🔗 Input | Parse from Job URL |
| 📄 Input | Parse from pasted Job Description |
| 🏢 Extraction | Company Name |
| 💼 Extraction | Job Title |
| 📍 Extraction | Location |
| 💰 Extraction | Salary / CTC |
| 🧑‍💻 Extraction | Experience Required |
| 🎓 Extraction | Qualification |
| 🛠 Extraction | Skills (as array) |
| 🕒 Extraction | Working Hours |
| 🌍 Extraction | Work Mode — Remote / Hybrid / Onsite |
| 📅 Extraction | Application Deadline |
| 📝 Extraction | Clean Job Description |
| 💾 Storage | Auto-save to MongoDB |
| ⚡ API | Full REST API |
| 🎨 UI | Modern React + Tailwind Interface |

---

## 🏗 Tech Stack

### Frontend
```
React 18      →  UI Framework
Vite          →  Build Tool (lightning fast HMR)
Tailwind CSS  →  Utility-first Styling
Axios         →  HTTP Client
React Router  →  Client-side Routing
```

### Backend
```
Node.js       →  Runtime
Express.js    →  REST API Framework
MongoDB       →  Database
Mongoose      →  ODM / Schema Layer
Cheerio       →  HTML Parsing
Axios         →  Proxy Fetching
Gemini AI     →  Job Data Extraction (LLM)
CORS          →  Cross-Origin Support
Dotenv        →  Environment Config
```

---

## 📁 Project Structure

```
job-portal/
│
├── client/                        # React + Vite Frontend
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── JobCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── SkillBadge.jsx
│   │   ├── pages/                 # Route-level pages
│   │   │   ├── Home.jsx
│   │   │   ├── JobList.jsx
│   │   │   ├── JobDetails.jsx
│   │   │   ├── ParseJob.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/              # Axios API calls
│   │   │   └── api.js
│   │   └── App.jsx
│   └── vite.config.js
│
├── server/                        # Node.js + Express Backend
│   ├── controllers/
│   │   └── companyController.js   # Route handlers
│   ├── routes/
│   │   └── companyRoutes.js       # API route definitions
│   ├── services/
│   │   └── parser.js              # 4-layer AI extraction engine
│   ├── models/
│   │   └── Job.js                 # Mongoose Job schema
│   ├── utils/
│   │   └── fetchWithProxy.js      # Dual-proxy CORS strategy
│   ├── app.js                     # Express app config
│   └── server.js                  # Entry point
│
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

- Node.js `v18+`
- MongoDB (local or Atlas)
- Google Gemini API Key → [Get here](https://aistudio.google.com/app/apikey)

---

### 1. Clone the Repository

```bash
git clone https://github.com/Akshatsrii/job-portal.git
cd job-portal
```

---

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/jobportal
GEMINI_API_KEY=your_google_gemini_api_key_here
```

Start the backend:

```bash
npm run dev
```

Server runs at → `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

App runs at → `http://localhost:5173`

---

## 📡 API Reference

### `POST /api/company/parse`
Parse a job from URL or pasted description.

**Option A — From URL:**
```json
{
  "url": "https://careers.google.com/jobs/some-job-id"
}
```

**Option B — From Description:**
```json
{
  "description": "We are hiring a Senior Backend Engineer at Razorpay..."
}
```

**Response:**
```json
{
  "_id": "64abc...",
  "company": "Google",
  "title": "Software Engineer",
  "location": "Bangalore, India",
  "salary": "₹18–24 LPA",
  "experience": "2+ Years",
  "qualification": "B.Tech / B.E.",
  "skills": ["React", "Node.js", "MongoDB", "Docker"],
  "workMode": "Hybrid",
  "workingHours": "9 AM – 6 PM",
  "deadline": "2025-08-31",
  "description": "We are looking for a talented engineer...",
  "source": "https://careers.google.com"
}
```

---

### `GET /api/company`
Returns all parsed jobs from the database.

---

### `GET /api/company/:id`
Returns a single job by MongoDB ID.

---

### `DELETE /api/company/:id`
Deletes a job by ID.

---

## 📦 Sample Parsed Output

```json
{
  "company": "Razorpay",
  "title": "Backend Engineer – Payments",
  "location": "Bengaluru, Karnataka",
  "salary": "₹20–28 LPA",
  "experience": "3–5 Years",
  "qualification": "B.Tech in CS / IT",
  "skills": ["Go", "Kafka", "Redis", "PostgreSQL", "AWS"],
  "workMode": "Hybrid",
  "workingHours": "10 AM – 7 PM",
  "deadline": "2025-09-15",
  "description": "Join the core payments team at Razorpay...",
  "source": "https://razorpay.com/jobs/backend-engineer"
}
```

---

## 🖥 Pages / Screens

| Page | Route | Description |
|------|-------|-------------|
| 🏠 Home | `/` | Landing page with intro |
| 📋 Job List | `/jobs` | All saved jobs in card view |
| 🔍 Job Details | `/jobs/:id` | Full details of a single job |
| ➕ Parse Job | `/parse` | Input URL or description to extract |
| 📊 Dashboard | `/dashboard` | Stats overview (admin view) |

---

## 🏢 About True Value Infotech

<div align="center">

```
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🏢  TRUE VALUE INFOTECH                           ║
║       Jaipur, Rajasthan, India                      ║
║                                                      ║
║   This Job Parser is an active running module        ║
║   integrated into True Value Infotech's              ║
║   internal hiring and sourcing platform.             ║
║                                                      ║
║   It is currently deployed in production and         ║
║   used to automate job data extraction for           ║
║   the company's talent acquisition pipeline.         ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

</div>

This project was developed as part of an internship at **True Value Infotech**, a software solutions company based in Jaipur. The parser module is actively used in production to automate the extraction and structuring of job postings from across the web — saving hours of manual data entry in the company's hiring workflows.

---

## 🔮 Roadmap & Future Improvements

- [ ] 🤖 **AI Resume Matching** — Match uploaded resumes to parsed jobs
- [ ] 🏷 **Auto Job Categorization** — Tag jobs by domain (SDE, Design, Marketing)
- [ ] 🔁 **Duplicate Detection** — Prevent re-saving the same posting
- [ ] 🔐 **Authentication** — JWT-based login for admin panel
- [ ] 📊 **Admin Dashboard** — Charts, analytics, and bulk actions
- [ ] 📦 **Bulk Job Parsing** — Upload CSV of URLs, parse all at once
- [ ] 📄 **PDF Job Parser** — Extract job info from PDF attachments
- [ ] 🌐 **Multi-language Support** — Parse Hindi, regional job posts
- [ ] 📧 **Email Notifications** — Alert users when new jobs are parsed
- [ ] 💡 **Job Recommendation** — Suggest jobs based on user's skill profile

---

## 👨‍💻 Author

<div align="center">

**Akshat Srivastava**
Full Stack Engineer Intern @ True Value Infotech

[![GitHub](https://img.shields.io/badge/GitHub-Akshatsrii-181717?style=for-the-badge&logo=github)](https://github.com/Akshatsrii)
[![LeetCode](https://img.shields.io/badge/LeetCode-Akshatsrivastava007-FFA116?style=for-the-badge&logo=leetcode)](https://leetcode.com/Akshatsrivastava007)
[![Portfolio](https://img.shields.io/badge/Portfolio-Visit%20Site-0ea5e9?style=for-the-badge&logo=vercel)](https://protfolio-531z.vercel.app)

</div>

---

## 📜 License

```
MIT License — free to use, modify, and distribute.
See LICENSE file for details.
```

---

<div align="center">

**⭐ Star this repo if it helped you — it motivates further development!**

*Built with ☕ and late nights in Jaipur.*

</div>
