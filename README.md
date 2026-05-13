# Smart Study Planner 🎓

![Version](https://img.shields.io/badge/version-1.0.0-14B8A6?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

An intelligent, minimalist, and deeply integrated Study Planner designed to supercharge student productivity. Built with a modern tech stack, this application features a Smart Timetable Engine, Pomodoro Tracking, Gamification, and a fully grounded AI Assistant leveraging Retrieval-Augmented Generation (RAG) over your uploaded study materials.

---

## 🌟 Key Features

- **Smart Timetable Engine**: Automatically schedules study sessions based on exam proximity, subject difficulty, and daily available hours.
- **Pomodoro Focus Space**: Full-screen timer with ambient audio, auto-logging, and a daily habit streak tracker.
- **Gamification System**: Earn XP, level up, and unlock achievements simply by studying consistently.
- **RAG AI Assistant ("Chat with Notes")**: Upload your PDFs and syllabuses. The AI will read them and strictly answer questions based *only* on your uploaded context.
- **Advanced Analytics**: 30-day trend lines, GitHub-style activity heatmaps, subject radar charts, and downloadable PDF reports.
- **PWA Ready**: Install the planner directly to your desktop or mobile home screen. Dark mode fully supported.

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (State Management)
- Recharts (Data Visualization)

**Backend:**
- Python 3.11 + FastAPI
- SQLAlchemy (Async SQLite/PostgreSQL)
- ChromaDB (Local Vector Store)
- Google Generative AI (Gemini 3.1 Pro via API)

**Infrastructure:**
- Docker & Docker Compose
- Nginx (Frontend Serving)

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- Google Gemini API Key

### 1. Clone the repository
```bash
git clone https://github.com/[Your-Username]/smart-study-planner.git
cd smart-study-planner
```

### 2. Backend Setup
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt

# Create your .env file
cp ../.env.production.example .env
# Edit .env and add your GEMINI_API_KEY

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```
*API Docs available at: `http://localhost:8000/api/v1/docs`*

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```
*App available at: `http://localhost:5173`*

---

## 🐳 Deployment (Docker)

To deploy the entire stack to a VPS (like DigitalOcean, AWS, or Render) using Docker Compose:

1. Ensure `.env.production` is created and filled out in the root directory.
2. Run the deployment command:
```bash
docker-compose --env-file .env.production up -d --build
```
3. The frontend will be served on port `80` and the backend on port `8000`.

---

## 👥 Project Team & Details

**[Your College / Institution Name]**  
**[Project Course / Year]**

- **[Team Member 1]** - Role (e.g., Full Stack Engineer)
- **[Team Member 2]** - Role (e.g., AI Integration / Backend)
- **[Team Member 3]** - Role (e.g., UI/UX Design & Frontend)

---

*For detailed architectural diagrams and API specs, please refer to the `docs/` folder.*
