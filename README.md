# Smart Study Planner

A clean, minimalistic, beautiful web app that helps students manage studies intelligently with AI.

## Color Philosophy
- Primary Color: #14B8A6 (Soft Teal)
- Secondary Color: #3B82F6 (Calm Blue)
- Success: #22C55E
- Background: #F8FAFC (Off-white)
- Card: #FFFFFF with subtle shadows
- Font: Inter (system-ui fallback)

## Tech Stack

### Frontend (`client/`)
- React 18 + TypeScript + Vite
- Tailwind CSS v3.4+
- shadcn/ui
- React Router DOM v6
- Zustand (state management)
- Recharts (analytics)
- Lucide React (icons)

### Backend (`server/`)
- FastAPI + Python 3.11+
- SQLAlchemy 2.0 (async ready)
- Alembic (migrations)
- Pydantic v2
- JWT Authentication

## Setup & Run Instructions

### 1. Backend Setup

```bash
cd server
python -m venv venv
# Activate venv:
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt

# Run the backend
uvicorn app.main:app --reload --port 8000
```
Backend runs on: `http://localhost:8000`
Swagger UI: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd client
npm install

# Run the frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

## Environment Variables
See `.env.example` in the root directory.
