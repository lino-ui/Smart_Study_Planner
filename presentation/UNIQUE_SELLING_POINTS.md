# Smart Study Planner: Unique Selling Points (USPs)

If you are pitching the **Smart Study Planner** to your professors or evaluators, focus heavily on these Unique Selling Points. These features separate your project from standard "Todo List" clones.

## 1. 🧠 Algorithm-Driven Timetable Engine
Most planners require the user to manually drag and drop tasks. Our system asks the user for their syllabus and exam date, then runs a proprietary sorting algorithm factoring in **Exam Proximity**, **Subject Difficulty**, and **User Available Hours** to automatically generate a highly optimized weekly schedule.

## 2. 📚 Grounded RAG AI Assistant
While many projects might wrap the ChatGPT/Gemini API, our project implements **Retrieval-Augmented Generation (RAG)**. Users upload their actual class PDFs, which are chunked, embedded via the Gemini Embedding Model, and stored locally in **ChromaDB**. When the user asks a question, the AI performs a vector similarity search to strictly reference the uploaded text, completely eliminating AI hallucinations.

## 3. 🎮 Gamified Positive Reinforcement Loop
Studying is inherently difficult. We solve the motivation problem with a deeply integrated Gamification Engine. Completing a Pomodoro session automatically logs the study hours, which mathematically calculates XP based on duration and streak multipliers, updating a live circular progress bar and unlocking dynamic badges.

## 4. ⚡ Hyper-Modern UI & Deep UX Polish
The application is built using a strict, calming Teal (#14B8A6) and Blue color palette designed to reduce cognitive load. It features:
- **Global `Cmd/Ctrl + K` Quick Search** for rapid navigation without a mouse.
- **Voice AI Input** using the Web Speech API to dictate queries to the AI tutor.
- **Seamless Dark Mode** toggling via CSS variables.
- **PDF Exporting** for offline printing of complex Recharts Analytics and Timetables.
- **PWA Readiness**, allowing it to be installed natively on desktop and mobile.
