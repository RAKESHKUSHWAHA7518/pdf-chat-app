---
title: AI PDF Chat App
emoji: 📄
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# DevSuite AI — Multi-Tool AI Developer & Career Intelligence Platform

A production-grade, full-stack AI platform unifying six specialized developer and career acceleration tools under a single custom JWT authentication engine, dark-mode design system, and Razorpay credit/subscription engine.

**Developed by:** [Rakesh Kushwaha](https://github.com/RAKESHKUSHWAHA7518)  
**Deployment Target:** Render.com / Railway / Koyeb / Docker (Single Unified Full-Stack Service)

---

## ⚡ Architecture & Tech Stack

- **Frontend**: React 19, Vite, React Markdown, Remark GFM, Rehype Raw, Mermaid.js, Lucide Icons, Modern Pure CSS Glassmorphism
- **Backend**: Node.js & Express (Layered: routes → middleware → services)
- **AI & RAG Engine**: Google Gemini 2.5 Flash chat & Gemini embeddings, LangChain.js
- **Database & Vector Search**: MongoDB Atlas M0 (`$vectorSearch` semantic retrieval across document chunks)
- **GitHub Integration**: `@octokit/rest` with AES-256 encrypted Personal Access Tokens stored in MongoDB
- **Diagram Engine**: Mermaid.js text-to-diagram generation and visual SVG canvas rendering
- **Monetization & Credits**: Razorpay integration with Webhooks, 10/50 credit packs, and Pro Monthly/Yearly subscriptions
- **Authentication**: Custom JWT authentication with scrypt password hashing
- **Security & Reliability**: Helmet, express-rate-limit, Zod schema validation, Pino structured logging
- **Unified Hosting**: In production, Express directly serves the optimized React SPA bundle from `frontend/dist`.

```
[Browser: React 19 Multi-Tool SPA]
             │
             │ HTTP / & /api/*
             ▼
[Express Backend Gateway]
  ├── Serves React Static Bundle (frontend/dist)
  ├── 1. PDF Chat Workspace (LangChain + Gemini RAG)
  ├── 2. GitHub Profile README Studio (Octokit 1-Click Commit)
  ├── 3. Resume-to-README Transformer (PDF to Markdown Profile)
  ├── 4. AI ATS Resume Matcher & Google STAR Optimizer
  ├── 5. GitHub Repo to README Studio (Manifest inspection & Docs gen)
  ├── 6. Architecture Diagram Studio (Mermaid.js Text to Diagram)
  └── Shared Credits (Razorpay) & Encrypted JWT / GitHub Secrets
             │
             ├── MongoDB Atlas M0 ($vectorSearch, Users, Documents, Payments)
             └── Google Gemini 2.5 Flash API
```

---

## 🚀 The 6 Specialized Developer Workspaces

1. 📄 **PDF Chat Workspace (`/dashboard/chat-pdf`)**: Multi-page PDF conversational intelligence with sub-second streaming answers and verifiable source page citations.
2. 🐙 **GitHub Profile Studio (`/dashboard/github-studio`)**: Interactive profile builder with typing lines, categorized tech badges, stats widgets, and 1-click publishing directly to `username/username` on GitHub.
3. 📑 **Resume-to-README Generator (`/dashboard/resume-to-readme`)**: Converts any PDF resume or stored document into an impactful GitHub README in under 5 seconds.
4. 🎯 **AI ATS Resume Matcher (`/dashboard/ats-matcher`)**: Evaluates resumes against technical job descriptions, calculates ATS keyword match scores, identifies missing skills, and rewrites bullets using the Google STAR method.
5. 📦 **Repo README Generator (`/dashboard/repo-docs`)**: Inspects repository file trees, parses `package.json`/dependencies, and generates comprehensive production-grade documentation.
6. 📐 **Architecture Diagram Studio (`/dashboard/diagrams`)**: Generates system architecture flowcharts, sequence diagrams, and microservice topologies from plain English descriptions using Mermaid.js.


---

## 📁 Project Structure

```
pdf-chat-app/
├── package.json              # Root orchestration (unified build & start scripts)
├── render.yaml               # 1-Click Render.com deployment Blueprint
├── docker-compose.yml        # Optional local Docker compose setup
├── backend/
│   ├── src/
│   │   ├── config/env.js     # Validated environment configuration (Zod)
│   │   ├── db/database.js    # MongoDB connection & Atlas vector search index setup
│   │   ├── lib/              # Logger & vector store wrapper
│   │   ├── middleware/       # Auth, rate-limiter, validation, error handler
│   │   ├── routes/           # /api/health, /api/auth, /api/documents, /api/session
│   │   ├── services/         # authService, ragService, guestService, sessionService
│   │   ├── app.js            # Express app assembly & static React frontend serving
│   │   └── server.js         # Bootstrap & graceful shutdown
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api.js            # Unified API client & error handling
    │   ├── App.jsx           # Main chat & document interface
    │   ├── components/       # AuthModal and UI components
    │   └── App.css           # Modern theme styling
    └── package.json
```

---

## 🛠️ Local Development Quick Start

### 1. Prerequisites
- **Node.js**: v20+ or v22+
- **Google Gemini API Key**: [Get one free at Google AI Studio](https://aistudio.google.com/apikey)
- **MongoDB Atlas**: Free M0 cluster connection string (or local MongoDB)

### 2. Setup Environment Variables
In `backend/.env`:
```env
PORT=3001
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/pdf_chat?retryWrites=true&w=majority
JWT_SECRET=your_random_32_character_secret_key_here
CORS_ORIGIN=http://localhost:5173
```

### 3. Install & Run
From the root directory:
```bash
# Terminal 1: Backend API (port 3001)
npm run dev:backend

# Terminal 2: Frontend with Vite HMR (port 5173, auto-proxies /api to 3001)
npm run dev:frontend
```
Open `http://localhost:5173` in your browser.

---

## 🌐 Deploy to Render.com (Single Unified Service)

Because this app relies on Server-Sent Events (SSE) streaming and persistent connections that struggle with Vercel's serverless timeouts, it is configured as a **Unified Full-Stack App**. Express serves both the backend API and the compiled React frontend from a single web service.

### Step 1: Push Code to GitHub
```bash
cd C:\Users\rk751\Projects\pdf-chat-app
git init -b main
git add .
git commit -m "feat: standalone AI PDF chat application ready for Render deployment"
git remote add origin https://github.com/RAKESHKUSHWAHA7518/pdf-chat-app.git
git push -u origin main
```

### Step 2: Create Web Service on Render
1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** → **Web Service**.
2. Connect your `pdf-chat-app` repository.
3. Configure the settings:
   - **Name**: `pdf-chat-app`
   - **Region**: Oregon (or nearest region)
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Add **Environment Variables** in Render:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: *(your Google Gemini API key)*
   - `MONGODB_URI`: *(your MongoDB Atlas connection string)*
   - `JWT_SECRET`: *(any secure 32+ character random string)*
   - `CORS_ORIGIN`: `*`
5. Click **Deploy Web Service**!

Render will build the frontend with Vite, install backend dependencies, and launch Express. Your app will be live at:
`https://pdf-chat-app.onrender.com`

---

## 🗄️ MongoDB Atlas Setup Guide
1. Create a free **M0** cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Under **Network Access**, add `0.0.0.0/0` (allow access from Render).
3. Under **Database Access**, create a user with read and write permissions.
4. Copy your connection string (`mongodb+srv://...`).
5. The backend automatically initializes the **Atlas Vector Search index** (`vector_index`) on the `documents` collection at startup!

---

## 📄 Copyright & Ownership
Proprietary & Confidential — © 2026 [Rakesh Kushwaha](https://github.com/RAKESHKUSHWAHA7518). All rights reserved.

