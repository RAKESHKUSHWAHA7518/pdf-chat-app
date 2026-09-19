---
title: AI PDF Chat App
emoji: 📄
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# AI-Powered PDF Chat & Document Intelligence Platform

A production-grade, full-stack Generative AI application that enables users to upload PDF documents and interact with them in real-time using Google Gemini AI, LangChain RAG, and MongoDB Atlas Vector Search.

**Developed by:** [Rakesh Kushwaha](https://github.com/RAKESHKUSHWAHA7518)  
**Deployment Target:** Render.com / Railway (Single Unified Full-Stack Service)

---

## ⚡ Architecture & Tech Stack

- **Frontend**: React 19, Vite, React Markdown, CSS Variables & Modern Glassmorphism
- **Backend**: Node.js & Express (Layered: routes → middleware → services)
- **AI & RAG Engine**: Google Gemini (`gemini-flash-latest` chat + `gemini-embedding-2` embeddings), LangChain.js
- **Database & Vector Search**: MongoDB Atlas M0 (`$vectorSearch` semantic retrieval across document chunks)
- **Authentication**: JWT authentication with scrypt password hashing
- **Security & Reliability**: Helmet, express-rate-limit, Zod schema validation, Pino structured logging
- **Unified Hosting**: In production, Express directly serves the optimized React SPA bundle from `frontend/dist`. No separate frontend hosting or Vercel timeouts!

```
[Browser: React 19 SPA / SSE Client]
             │
             │ HTTP / & /api/*
             ▼
[Express Backend Server]
  ├── Serves React Static Bundle (frontend/dist)
  ├── Document Chunking & Ingestion
  ├── Server-Sent Events (SSE) Streaming
  └── JWT Auth & Rate Limiting
             │
             ├── MongoDB Atlas M0 ($vectorSearch & Documents)
             └── Google Gemini API (Embeddings & Generative Chat)
```

---

## 🚀 Key Features

- 📄 **Intelligent Document Processing**: Upload PDFs up to 10MB; extracts text, chunks semantically, computes embeddings, and indexes them in MongoDB Atlas Vector Search.
- 💬 **Real-Time Streaming Chat (SSE)**: Server-Sent Events streaming token-by-token responses with markdown formatting, code highlights, and conversation memory.
- 🔍 **Semantic Vector Search**: LangChain-powered Retrieval-Augmented Generation (RAG) providing accurate answers grounded in document context.
- 📚 **Persistent Document Library**: Signed-in users' uploaded PDFs persist in MongoDB — switch between uploaded documents anytime or delete unneeded files.
- 🎁 **Freemium Guest Quota System**: Guests can upload and try the app with 1 free document before seeing a seamless signup wall.
- 🔐 **Secure User Accounts**: Complete signup/login system with JWT tokens (7-day sessions).
- 🧹 **Automatic Cleanup**: Temporary sessions and guest quotas auto-expire using TTL indexing to maintain zero memory leaks.

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

## 📄 License
MIT License — Created by [Rakesh Kushwaha](https://github.com/RAKESHKUSHWAHA7518).
