# 🚀 HireTrack – AI-Powered Applicant Tracking System (ATS)

<p align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)
![AI](https://img.shields.io/badge/AI-Groq-FF6B00)
![JWT](https://img.shields.io/badge/Auth-JWT-blue)
![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-3448C5)
![License](https://img.shields.io/badge/License-MIT-green)

</p>

<p align="center">
A modern AI-powered Applicant Tracking System (ATS) built using the MERN Stack to streamline recruitment, automate resume analysis, schedule interviews, and manage the complete hiring pipeline.
</p>

---

# 🌐 Live Demo

> **Live Website:** 

```
https://hiretrack-tawny.vercel.app/
```

> **GitHub Repository**

```
https://github.com/sk1746717-hub/hiretrack
```

---

# 📑 Table of Contents

- Overview
- Features
- Tech Stack
- Installation
- Environment Variables
- Project Structure
- API Endpoints
- Authentication & Security
- AI Features
- Deployment
- Future Enhancements
- Author
- License

---

# 📌 Overview

HireTrack is a full-stack AI-powered Applicant Tracking System (ATS) designed to simplify and automate the recruitment workflow.

The platform enables recruiters and hiring managers to manage candidates from application to hiring while leveraging AI to reduce manual effort.

Using Groq AI (Llama-3.3-70B-Versatile), HireTrack automatically analyzes resumes, evaluates candidates against job descriptions, generates interview questions, and provides intelligent hiring recommendations.

The application also includes secure authentication, role-based access control, interview scheduling, email outreach, analytics dashboards, and modern recruiter-friendly workflows.

---

# ✨ Features

## 🤖 Artificial Intelligence

- AI Resume Parsing
- Automatic Candidate Information Extraction
- AI Candidate Summary
- AI Match Score
- AI Hiring Recommendation
- AI Skill Gap Analysis
- AI Interview Question Generator
- Candidate Strength Analysis
- Improvement Suggestions

---

## 👥 Candidate Management

- Candidate CRUD
- Resume Upload
- Cover Letter Upload
- Certificate Upload
- Resume Preview
- Candidate Timeline
- Candidate Notes
- Candidate Search
- Advanced Filtering
- Pagination
- Sorting
- Bulk Delete
- Bulk Status Update
- Candidate Assignment
- Recruiter Assignment
- Interviewer Assignment

---

## 💼 Job Management

- Create Jobs
- Edit Jobs
- Delete Jobs
- Assign Candidates
- Job Dashboard
- Department Management
- Job Status Tracking

---

## 📅 Interview Management

- Interview Scheduling
- Calendar View
- Multi-Round Interviews
- Interview Timeline
- Interview Status
- Interview Decision
- Interview Feedback
- Interviewer Assignment
- Scorecards

---

## 📧 Email Outreach

- Bulk Email Campaigns
- Dynamic Email Templates
- Candidate Personalization
- Placeholder Variables
- Email Activity Timeline
- Campaign History

---

## 📊 Analytics Dashboard

- Total Candidates
- Total Jobs
- Hiring Funnel
- Match Score Analytics
- Recruiter Performance
- Monthly Applications
- Skills Analytics
- Interactive Charts

---

## 🔐 Authentication & Security

- JWT Authentication
- Role-Based Access Control (RBAC)
- Protected Routes
- Secure APIs
- Password Encryption
- Helmet Security Headers
- Rate Limiting

---

## 📂 Resume Management

- Cloudinary Storage
- Resume Preview
- PDF Support
- Cover Letter Upload
- Certificate Upload
- Resume History

---

# 🛠 Tech Stack

## Frontend

- React 19
- React Router v7
- Vite
- Tailwind CSS
- Axios
- React Hot Toast
- Lucide Icons
- Recharts

---

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Multer
- Cloudinary
- Nodemailer
- pdf-parse
- Groq SDK

---

## AI

- Groq API
- Llama-3.3-70B-Versatile
- Resume Parsing
- Candidate Matching
- Interview Question Generation

---

# ⚙️ Installation

## Clone the Repository

```bash
git clone https://github.com/sk1746717-hub/hiretrack.git

cd hiretrack
```

---

## Backend Setup

```bash
cd server

npm install
```

Create a `.env` file inside the `server` directory.

Start the backend:

```bash
npm run dev
```

The backend will run on:

```
http://localhost:5000
```

---

## Frontend Setup

Open another terminal:

```bash
cd client

npm install

npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# 🔐 Environment Variables

Create a `.env` file inside the **server** directory.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Groq AI
GROQ_API_KEY=your_groq_api_key

# Email Outreach
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_google_app_password
SMTP_FROM=HireTrack <your_email@gmail.com>
```

> **Note:** Never commit your `.env` file to GitHub.

---

# 📂 Project Structure

```
hiretrack
│
├── client
│   ├── public
│   ├── src
│   │   ├── assets
│   │   ├── components
│   │   ├── context
│   │   ├── hooks
│   │   ├── layouts
│   │   ├── pages
│   │   ├── services
│   │   ├── utils
│   │   └── App.jsx
│   │
│   └── package.json
│
├── server
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── uploads
│   ├── utils
│   ├── server.js
│   └── package.json
│
├── README.md
└── .gitignore
```

---

# 📡 REST API Overview

## Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |

---

## Candidates

| Method | Endpoint |
|---------|----------|
| GET | `/api/candidates` |
| GET | `/api/candidates/:id` |
| POST | `/api/candidates` |
| PUT | `/api/candidates/:id` |
| DELETE | `/api/candidates/:id` |

### AI Features

| Method | Endpoint |
|---------|----------|
| POST | `/api/candidates/parse` |
| POST | `/api/candidates/:id/generate-questions` |

### Bulk Operations

| Method | Endpoint |
|---------|----------|
| POST | `/api/candidates/bulk-delete` |
| POST | `/api/candidates/bulk-status` |
| POST | `/api/email/send-bulk` |

---

## Jobs

| Method | Endpoint |
|---------|----------|
| GET | `/api/jobs` |
| POST | `/api/jobs` |
| PUT | `/api/jobs/:id` |
| DELETE | `/api/jobs/:id` |

---

## Interviews

| Method | Endpoint |
|---------|----------|
| GET | `/api/interviews` |
| POST | `/api/interviews` |
| PUT | `/api/interviews/:id` |
| DELETE | `/api/interviews/:id` |

---

## Notifications

| Method | Endpoint |
|---------|----------|
| GET | `/api/notifications` |
| PUT | `/api/notifications/:id/read` |
| PUT | `/api/notifications/read-all` |

---

# 🔒 Security Features

HireTrack follows common web security practices.

✔ JWT Authentication

✔ Role-Based Access Control (RBAC)

✔ Protected REST APIs

✔ Secure Password Hashing

✔ Helmet Security Headers

✔ Express Rate Limiting

✔ Environment Variable Protection

✔ Secure File Upload Validation

✔ Cloudinary Secure Storage

---

# 🤖 Artificial Intelligence Features

HireTrack integrates **Groq AI (Llama-3.3-70B-Versatile)** to assist recruiters throughout the hiring process.

### AI Resume Parsing

- Extract candidate details
- Detect skills
- Identify experience
- Parse education
- Generate structured summaries

---

### AI Candidate Matching

- Compare resume with job description
- Calculate compatibility score
- Highlight matching skills
- Detect missing skills
- Recommend hiring decision

---

### AI Interview Generator

Automatically generates:

- Technical Questions
- HR Questions
- Scenario-Based Questions
- Coding Questions

based on the candidate profile and selected job.

---

# 🚀 Deployment

## Frontend

- Vercel

## Backend

- Node.js + Express

## Database

- MongoDB Atlas

## Storage

- Cloudinary

---

# 🌍 Browser Support

HireTrack supports all modern browsers.

- Chrome
- Edge
- Firefox
- Brave
- Opera
- Safari

---

# 🔮 Future Enhancements

The following features are planned for future releases:

- 📅 Google Calendar Integration
- 📅 Outlook Calendar Integration
- 📧 Email Scheduling
- 📱 SMS & WhatsApp Notifications
- 🤖 AI Candidate Ranking
- 🎥 AI Video Interview Analysis
- 📄 Offer Letter Generator
- 📊 Advanced Recruitment Analytics
- 🔔 Real-time Notifications (Socket.IO)
- 📱 Progressive Web App (PWA)
- 🌍 Multi-language Support
- 📈 Recruitment Performance Reports
- 🔗 LinkedIn Candidate Import
- ☁ Resume OCR for Scanned Documents
- 📂 Candidate Talent Pool Management

---

# 🎯 Learning Outcomes

This project helped strengthen my understanding of:

- Full Stack MERN Development
- REST API Design
- Authentication & Authorization (JWT)
- Role-Based Access Control (RBAC)
- AI Integration using Groq API
- Resume Parsing
- Cloudinary File Storage
- Email Automation using Nodemailer
- MongoDB Data Modeling
- React State Management
- Express Middleware
- Deployment using Vercel
- Secure Environment Variable Management

---

# 📈 Project Highlights

✅ AI-Powered Resume Parsing

✅ AI Candidate Match Scoring

✅ AI Interview Question Generation

✅ Complete Candidate Lifecycle Management

✅ Kanban Hiring Pipeline

✅ Interview Scheduling

✅ Interactive Calendar View

✅ Resume Preview

✅ Certificate Management

✅ Bulk Candidate Operations

✅ Email Outreach Campaigns

✅ Analytics Dashboard

✅ JWT Authentication

✅ Role-Based Access Control

✅ Cloudinary Integration

✅ Responsive UI

---

# 🤝 Contributing

Contributions are welcome!

If you'd like to improve HireTrack:

1. Fork the repository.

2. Create a feature branch.

```bash
git checkout -b feature/NewFeature
```

3. Commit your changes.

```bash
git commit -m "Add New Feature"
```

4. Push the branch.

```bash
git push origin feature/NewFeature
```

5. Open a Pull Request.

---

# 🐞 Bug Reports

Found a bug?

Please create an Issue including:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)

---

# 💡 Feature Requests

Have an idea to improve HireTrack?

Feel free to create a Feature Request issue.

Suggestions are always welcome.

---

# 📄 License

This project is licensed under the **MIT License**.

You are free to use this project for learning and educational purposes.

---

# 👨‍💻 Author

## Sampath Kumar K

**Computer Science Engineering Student**

**Full Stack MERN Developer | AI Integration Enthusiast | Open Source Learner**

### 🌐 Portfolio

https://portfolio-beta-five-dsukzzvn59.vercel.app

### 💼 LinkedIn

https://www.linkedin.com/in/sampath-kumar-k-7329a42a9?utm_source=share_via&utm_content=profile&utm_medium=member_android

### 🐙 GitHub

https://github.com/sk1746717-hub

### 🚀 HireTrack Live Demo

https://hiretrack-tawny.vercel.app

---

# ⭐ Support

If you found this project useful:

⭐ Star this repository

🍴 Fork this repository

🛠 Contribute to improve HireTrack

Your support is greatly appreciated!

---

# 🙏 Acknowledgements

Special thanks to the open-source community and the amazing technologies that made this project possible.

- React
- Node.js
- Express.js
- MongoDB
- Tailwind CSS
- Groq AI
- Cloudinary
- Nodemailer
- Recharts
- Lucide React

---

<p align="center">

### ⭐ If you like this project, don't forget to star the repository!

Made with ❤️ by <b>Sampath Kumar K</b>

</p>