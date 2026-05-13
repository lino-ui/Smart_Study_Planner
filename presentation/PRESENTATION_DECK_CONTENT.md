# Smart Study Planner: Slide Deck Outline

If you are building a PowerPoint/Keynote for your final presentation, follow this 10-slide structure.

### Slide 1: Title Slide
- **Title**: Smart Study Planner
- **Subtitle**: AI-Powered Productivity, Gamification, and RAG Integration
- **Names**: [Your Team Names]
- **Institution**: [Your College Name]

### Slide 2: Problem Statement
- **Information Overload**: Students have massive PDF syllabuses but don't know where to start.
- **Scheduling Paralysis**: Manually creating a study schedule is tedious and immediately breaks if a day is missed.
- **Lack of Motivation**: Long-term studying yields delayed rewards, leading to burnout.

### Slide 3: The Solution Overview
- A single, unified platform combining **Intelligent Scheduling**, **Deep Work Execution (Pomodoro)**, and **Instant AI Tutoring**.
- *Visual*: Place a wide screenshot of the Main Dashboard here.

### Slide 4: Core Feature 1 - Smart Timetable Engine
- **How it works**: Uses a weighted algorithm to prioritize subjects based on `days_left_to_exam` and `difficulty_level`.
- **Value**: Dynamically rebuilds the optimal schedule if the student falls behind, eliminating scheduling anxiety.
- *Visual*: Screenshot of the Timetable page.

### Slide 5: Core Feature 2 - RAG AI Assistant
- **Tech Stack**: PyPDF2 + ChromaDB + Google Gemini 3.1 Pro.
- **How it works**: Retrieval-Augmented Generation prevents AI hallucinations by forcing the LLM to read ONLY the student's uploaded class notes.
- *Visual*: Split screenshot of the Library (uploaded PDFs) and the Chat interface.

### Slide 6: Core Feature 3 - Gamification & Focus
- **Deep Work**: Full-screen Pomodoro mode with ambient audio to enforce focus.
- **Positive Reinforcement**: Completing a timer auto-logs the hours, calculates XP, updates a daily flame streak, and unlocks badges.
- *Visual*: Screenshot of the Achievements Page (Level ring & Badges).

### Slide 7: System Architecture
- **Frontend**: React 18, Vite, Zustand, Tailwind CSS.
- **Backend**: Python FastAPI, SQLAlchemy (Async SQLite).
- **Deployment**: Fully Dockerized with multi-stage builds.
- *Visual*: Paste the ER Diagram or Architecture Diagram from the docs folder here.

### Slide 8: Data Visualization (Analytics)
- **Feature**: 30-day GitHub-style heatmap, Radar charts for subject proficiency.
- **Value**: Gives students immediate visual feedback on their consistency. Allows PDF exporting.
- *Visual*: Screenshot of the Analytics Page.

### Slide 9: Future Scope
- Mobile App deployment (React Native).
- Multiplayer/Social study groups (share streaks with friends).
- Deeper Voice AI integration.

### Slide 10: Live Demo & Q&A
- "We will now demonstrate the system live."
- *Open the browser, use `Cmd+K` to navigate, start a timer, ask the AI a question.*
