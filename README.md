# HireTrack – AI-Powered Applicant Tracking System (ATS)


![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-success)
![AI](https://img.shields.io/badge/AI-Groq-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

## 📌 Overview

HireTrack is an enterprise-grade Applicant Tracking System (ATS) built on the MERN stack. It leverages Groq AI (using llama-3.3-70b-versatile) for automated candidate profile parsing, professional summary generation, interview question formulation, and job description match-scoring. It includes a visual Kanban board, interactive calendar view, Recharts dashboard widgets, bulk actions, Nodemailer transactional outreach campaigns, and role-based access controls (RBAC).

---

## 🚀 Key Features

### 1. AI-Powered Resume Parser & Form Pre-filling
- Upload PDF resumes to instantly parse text.
- Autofills candidate Name, Email, Phone, Skills, and Experience in candidate forms.
- Compiles structured AI professional summaries (Years of Experience, Core Skills, highest Education degree, suitable roles, and career accomplishments).

### 2. AI Candidates Match Score & Recommendations
- Automatically evaluates candidate profiles against specific Job Descriptions.
- Assigns compatibility scores (0-100%) and categorizes candidates as "Strongly Recommended", "Recommended", "Consider", or "Not Recommended".
- Pinpoints matching skills, missing skills, strengths, and constructive suggestions.

### 3. AI Interview Question Generator
- Generates tailored lists of Technical, HR, Scenario-Based, and Coding questions customized specifically to the candidate's background and the selected job role.
- Print-friendly layout report for recruiters.

### 4. Interactive Visual Kanban Board
- Drag-and-drop board for candidate status tracking: `Applied` ➔ `Screening` ➔ `Shortlisted` ➔ `Interview` ➔ `Selected` ➔ `Rejected`.
- Optimistic UI updates with instant syncing to MongoDB database.

### 5. Multi-round Interview Roster & Calendar
- Schedules dates, times, modes (Online/Offline/Phone), and interviewer assignments.
- Interactive month-by-month grid rendering interview events and job application deadlines.
- Logs multi-round history for each candidate.

### 6. Document Manager & PDF Previewer
- Securely uploads Resumes, Cover Letters, and Certificates to Cloudinary.
- Embedded preview modal within candidate detail view for seamless reviewing.

### 7. Bulk Pipeline Operations & Exporting
- Batch status modifications, deletions, and job assignments.
- Template-driven bulk outreach emails using placeholder variables.
- Export selected lists to Microsoft Excel-compatible CSVs.

### 8. Analytics Dashboard
- Metric indicators showing Average Match Score and Hiring Conversion Rates.
- Visual charts: applications monthly trend line graph, hiring funnel conversion, recruiter performance tables, and skills catalog.

---

## 🔐 Environment Variables

Create or update the `.env` file in the `server` folder:

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=hiretrack_secret_key

# Cloudinary Integration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Groq AI Integration
GROQ_API_KEY=your_groq_api_key

# Nodemailer Outreach
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
```

---

## 🛠 Tech Stack

- **Frontend**: React.js, React Router v7, Tailwind CSS, Recharts, Axios, Lucide Icons, Hot Toast.
- **Backend**: Node.js, Express, Mongoose, Multer (Memory Storage), Cloudinary SDK, pdf-parse, Nodemailer, groq-sdk.
- **Security**: JWT tokens, Role-Based Access Control, rate-limiting (`express-rate-limit`), security headers (`helmet`).

---

## 📂 Project Structure

```
hiretrack/
├── client/                     # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── components/         # KanbanBoard, NotificationCenter, Table, Forms
│   │   ├── context/            # AuthContext
│   │   ├── pages/              # Dashboard, Jobs, Candidates, CalendarView, Details
│   │   └── services/           # Axios API wrappers (jobService, candidateService)
│   └── package.json
└── server/                     # Backend Application (Node + Express)
    ├── config/                 # DB connections
    ├── controllers/            # Job, candidate, and notification controllers
    ├── middleware/             # Multer uploads, RBAC role validation, rate limiters
    ├── models/                 # Job, User, Candidate, Notification, Scorecard
    ├── routes/                 # Express REST endpoint maps
    └── utils/                  # Cloudinary upload, pdfParser, aiService AI helpers
```

---

## 📡 REST API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Authenticate user

### Candidate Pipeline
- `GET /api/candidates` - Retrieve candidates (paginated, sorted, filtered)
- `POST /api/candidates` - Create profile (handles files)
- `PUT /api/candidates/:id` - Update profile (re-calculates match scores, schedules interviews)
- `DELETE /api/candidates/:id` - Remove candidate
- `POST /api/candidates/parse` - Parse PDF resume text & compile summary
- `POST /api/candidates/:id/generate-questions` - Generate AI interview questions
- `POST /api/candidates/bulk-delete` - Bulk delete candidates
- `POST /api/candidates/bulk-status` - Bulk update status
- `POST /api/candidates/bulk-email` - Bulk email candidates

### Job Openings
- `GET /api/jobs` - List jobs (paginated)
- `POST /api/jobs` - Post job opening
- `PUT /api/jobs/:id` - Update job details
- `DELETE /api/jobs/:id` - Delete job opening

### Notifications Center
- `GET /api/notifications` - Retrieve recent alerts
- `PUT /api/notifications/:id/read` - Dismiss alert
- `PUT /api/notifications/read-all` - Dismiss all alerts