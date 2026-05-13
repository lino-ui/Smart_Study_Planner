# Comprehensive Feature List

The Smart Study Planner is composed of 14 distinct, highly integrated modules.

1. **Authentication & Authorization**: Secure JWT-based login and registration system with persistent session management.
2. **User Profiles**: Track available study hours, specific exam dates, and customizable preferred study intervals.
3. **Subject & Syllabus Management**: A CRUD interface to break down large exam subjects into highly manageable chapters.
4. **Smart Timetable Engine**: A proprietary algorithm that automatically sorts and assigns chapters to days of the week based on Exam Proximity, Subject Difficulty, and Chapter length.
5. **Generative AI Tutor**: A direct integration with Google Gemini Pro 3.1, acting as an always-on tutor to explain complex topics.
6. **Progress Tracking**: Log exact study duration, rate the energy level, and track topics covered per session.
7. **Analytics Dashboard**: Real-time rendering of a user's 30-day consistency score, a visual activity heatmap, and a multi-axis Radar Chart for subject-wise proficiency.
8. **Gamification System**: Transforms studying into a game. Earn XP for every logged session, build daily "flame" streaks, and unlock dynamic SVG Badges for hitting major milestones.
9. **Central Dashboard**: A single pane of glass showing today's immediate tasks, upcoming exam countdowns, and quick access to the AI.
10. **RAG Vector Management**: Users can upload `.txt` and `.pdf` study materials. The system parses, chunks, and creates vector embeddings stored locally in ChromaDB.
11. **Grounded RAG Chat**: Users can toggle the AI Tutor into "Chat with Notes" mode. The AI will strictly reference only the context retrieved from the user's uploaded syllabus.
12. **Pomodoro Engine**: A beautifully animated SVG timer for deep work sessions, which automatically triggers gamification rewards upon completion.
13. **Daily Habit Tracker**: Track micro-habits alongside study sessions.
14. **PDF Reporting**: Export beautiful, high-resolution vector PDF reports of Analytics and Timetable data for printing.
