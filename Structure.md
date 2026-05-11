smart-study-planner/
├── README.md
├── .gitignore
├── docker-compose.yml                 # Optional
├── .env.example
│
├── client/                            # React Frontend
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/
│   │   ├── components/                # Reusable UI components
│   │   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── layout/
│   │   │   ├── dashboard/
│   │   │   ├── timetable/
│   │   │   ├── chat/
│   │   │   ├── progress/
│   │   │   └── gamification/
│   │   ├── pages/                     # Main pages
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── subjects/
│   │   │   ├── timetable/
│   │   │   ├── progress/
│   │   │   ├── chat/
│   │   │   └── profile/
│   │   ├── hooks/
│   │   ├── lib/                       # utils, axios config
│   │   ├── store/                     # Zustand or Redux
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── routes.tsx
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── server/                            # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app entry
│   │   ├── core/
│   │   │   ├── config.py              # Settings, env vars
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/                    # SQLAlchemy models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── subject.py
│   │   │   ├── exam.py
│   │   │   ├── task.py
│   │   │   ├── study_log.py
│   │   │   ├── gamification.py
│   │   │   └── document.py
│   │   ├── schemas/                   # Pydantic models
│   │   ├── routers/                   # API routes
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── subjects.py
│   │   │   ├── timetable.py
│   │   │   ├── progress.py
│   │   │   ├── llm.py
│   │   │   ├── rag.py
│   │   │   └── gamification.py
│   │   ├── services/                  # Business logic
│   │   │   ├── scheduler.py           # Smart timetable engine
│   │   │   ├── ml_predictor.py
│   │   │   ├── gamification_service.py
│   │   │   └── analytics.py
│   │   ├── utils/
│   │   ├── llm/                       # LLM integration
│   │   │   ├── client.py
│   │   │   └── prompts.py
│   │   └── rag/                       # Vector store & embeddings
│   │       ├── vector_store.py
│   │       └── document_processor.py
│   ├── migrations/                    # Alembic migrations
│   ├── tests/
│   ├── requirements.txt
│   └── alembic.ini
│
└── docs/
    ├── architecture.md
    ├── api.md
    └── flowchart.md