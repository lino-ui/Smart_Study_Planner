import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/dashboard/Profile';
import Subjects from './pages/dashboard/Subjects';
import SubjectDetail from './pages/dashboard/SubjectDetail';
import Timetable from './pages/dashboard/Timetable';
import Chat from './pages/dashboard/Chat';
import Progress from './pages/dashboard/Progress';
import { useAuthStore } from './store/authStore';
import { LayoutDashboard, CalendarDays, BookOpen, Target, UserCircle, LogOut, MessageSquareText } from 'lucide-react';

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  
  return (
    <div className="flex min-h-screen w-full bg-background font-sans">
      <aside className="hidden w-64 flex-col border-r bg-card shadow-soft md:flex">
        <div className="flex h-16 items-center px-6 border-b">
          <span className="text-xl font-bold text-primary flex items-center gap-2">
            <CalendarDays className="h-6 w-6" /> Smart Study
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/dashboard" className="flex items-center gap-3 p-3 rounded-md hover:bg-primary/10 text-foreground hover:text-primary transition-colors cursor-pointer font-medium">
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </Link>
          <Link to="/timetable" className="flex items-center gap-3 p-3 rounded-md hover:bg-primary/10 text-foreground hover:text-primary transition-colors cursor-pointer font-medium">
            <CalendarDays className="h-5 w-5" /> Planner
          </Link>
          <Link to="/subjects" className="flex items-center gap-3 p-3 rounded-md hover:bg-primary/10 text-foreground hover:text-primary transition-colors cursor-pointer font-medium">
            <BookOpen className="h-5 w-5" /> Subjects
          </Link>
          <Link to="/progress" className="flex items-center gap-3 p-3 rounded-md hover:bg-primary/10 text-foreground hover:text-primary transition-colors cursor-pointer font-medium">
            <Target className="h-5 w-5" /> Progress
          </Link>
          <Link to="/chat" className="flex items-center gap-3 p-3 rounded-md hover:bg-primary/10 text-foreground hover:text-primary transition-colors cursor-pointer font-medium">
            <MessageSquareText className="h-5 w-5" /> AI Assistant
          </Link>
          <Link to="/profile" className="flex items-center gap-3 p-3 rounded-md hover:bg-primary/10 text-foreground hover:text-primary transition-colors cursor-pointer font-medium">
            <UserCircle className="h-5 w-5" /> Profile
          </Link>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-6 shadow-sm">
          <div className="md:hidden text-xl font-bold text-primary">Smart Study</div>
          <div className="hidden md:block text-sm text-muted-foreground font-medium">
            {user ? `Welcome back, ${user.full_name.split(' ')[0]}` : 'Welcome back'}
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={logout}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase shadow-sm border border-primary/10">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                user ? user.full_name.charAt(0) : 'U'
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
          Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-[600px] mx-auto">
          Your AI Study Planner is ready. Check your Progress to keep the streak going!
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Layout><LandingPage /></Layout>} />
          <Route path="/timetable" element={<Layout><Timetable /></Layout>} />
          <Route path="/progress" element={<Layout><Progress /></Layout>} />
          <Route path="/chat" element={<Layout><Chat /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/subjects" element={<Layout><Subjects /></Layout>} />
          <Route path="/subjects/:id" element={<Layout><SubjectDetail /></Layout>} />
        </Route>
        
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
