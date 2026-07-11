# HireTrack – Applicant Tracking System (ATS)

## 📌 Overview

HireTrack is a full-stack Applicant Tracking System (ATS) built using the MERN Stack. It enables recruiters to manage candidates, organize hiring pipelines, schedule interviews, collaborate with team members, and analyze recruitment performance through interactive dashboards.

---

## 🚀 Features

### Authentication
- Secure Login & Registration
- JWT Authentication
- Protected Routes

### Role-Based Access Control (RBAC)
- Admin
- Recruiter
- Interviewer

### Candidate Management
- Add Candidate
- Edit Candidate
- Delete Candidate
- Archive / Restore Candidate
- Candidate Details
- Search & Filter

### Recruitment Pipeline
- Drag-and-Drop Kanban Board
- Stage Management
- Recruiter & Interviewer Permissions

### Reports & Analytics
- Dashboard Metrics
- Funnel Conversion Analytics
- Hiring Source Analytics
- Average Time-to-Hire
- CSV Report Export

### Email Management
- Email Templates
- Placeholder Replacement
- Email Outreach
- Activity Timeline Logging

### Collaboration
- Recruiter Notes
- @Mentions

### Import / Export
- Bulk CSV Import
- CSV Export

---

## 🛠 Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas
- Mongoose

### Authentication
- JWT

---

## ⚙️ Installation

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file inside the `server` folder.

```env
PORT=
MONGO_URI=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASS=
```

---

## 📈 Future Enhancements

- AI Resume Parser
- AI ATS Resume Score
- Google Calendar Integration
- AI Interview Question Generator
- Resume Ranking
- Notifications

---

## 👨‍💻 Author

**Sampath Kumar**

B.Tech CSE