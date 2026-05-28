import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { useAuthStore } from './store/authStore';
import { LayoutDashboard, CalendarDays, BookOpen, Target, UserCircle, LogOut, MessageSquareText, BarChart3, Trophy, FileText, Flame } from 'lucide-react';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { Toaster } from 'sonner';
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation } from 'react-router-dom';
import NotFound from './pages/NotFound';
import SplashLoader from './components/SplashLoader';
import { CommandPalette } from './components/CommandPalette';

// Lazy loaded modules to optimize bundle size
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const Subjects = lazy(() => import('./pages/dashboard/Subjects'));
const SubjectDetail = lazy(() => import('./pages/dashboard/SubjectDetail'));
const Timetable = lazy(() => import('./pages/dashboard/Timetable'));
const Chat = lazy(() => import('./pages/dashboard/Chat'));
const Progress = lazy(() => import('./pages/dashboard/Progress'));
const Analytics = lazy(() => import('./pages/dashboard/Analytics'));
const Gamification = lazy(() => import('./pages/dashboard/Gamification'));
const Documents = lazy(() => import('./pages/dashboard/Documents'));
const Pomodoro = lazy(() => import('./pages/dashboard/Pomodoro'));
function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h2>
      <pre className="text-sm text-muted-foreground bg-muted p-4 rounded-md mb-4 max-w-xl overflow-auto text-left">
        {error.message}
      </pre>
      <button 
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const getLinkClass = (path: string) => {
    const isActive = location.pathname.startsWith(path);
    return `flex items-center gap-3 p-3 rounded-md transition-colors cursor-pointer font-medium ${
      isActive 
        ? 'bg-primary/10 text-primary shadow-sm' 
        : 'text-foreground hover:bg-muted/80 hover:text-primary'
    }`;
  };
  
  return (
    <div className="flex min-h-screen w-full bg-background font-sans">
      <CommandPalette />
      <aside className="hidden w-64 flex-col border-r bg-card shadow-soft md:flex">
        <div className="flex h-16 items-center px-6 border-b">
          <span className="text-xl font-bold text-primary flex items-center gap-2">
            <CalendarDays className="h-6 w-6" /> Smart Study
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/dashboard" className={getLinkClass('/dashboard')}>
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </Link>
          <Link to="/timetable" className={getLinkClass('/timetable')}>
            <CalendarDays className="h-5 w-5" /> Planner
          </Link>
          <Link to="/pomodoro" className={getLinkClass('/pomodoro')}>
            <Flame className="h-5 w-5" /> Focus Space
          </Link>
          <Link to="/subjects" className={getLinkClass('/subjects')}>
            <BookOpen className="h-5 w-5" /> Subjects
          </Link>
          <Link to="/progress" className={getLinkClass('/progress')}>
            <Target className="h-5 w-5" /> Progress
          </Link>
          <Link to="/analytics" className={getLinkClass('/analytics')}>
            <BarChart3 className="h-5 w-5" /> Analytics
          </Link>
          <Link to="/documents" className={getLinkClass('/documents')}>
            <FileText className="h-5 w-5" /> Library
          </Link>
          <Link to="/chat" className={getLinkClass('/chat')}>
            <MessageSquareText className="h-5 w-5" /> AI Assistant
          </Link>
          <Link to="/gamification" className={getLinkClass('/gamification')}>
            <Trophy className="h-5 w-5" /> Achievements
          </Link>
          <Link to="/profile" className={getLinkClass('/profile')}>
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
            <ThemeToggle />
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

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="smart-study-theme">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Layout><Suspense fallback={<SplashLoader />}><Dashboard /></Suspense></Layout>} />
              <Route path="/timetable" element={<Layout><Suspense fallback={<SplashLoader />}><Timetable /></Suspense></Layout>} />
              <Route path="/pomodoro" element={<Layout><Suspense fallback={<SplashLoader />}><Pomodoro /></Suspense></Layout>} />
              <Route path="/progress" element={<Layout><Suspense fallback={<SplashLoader />}><Progress /></Suspense></Layout>} />
              <Route path="/analytics" element={<Layout><Suspense fallback={<SplashLoader />}><Analytics /></Suspense></Layout>} />
              <Route path="/gamification" element={<Layout><Suspense fallback={<SplashLoader />}><Gamification /></Suspense></Layout>} />
              <Route path="/documents" element={<Layout><Suspense fallback={<SplashLoader />}><Documents /></Suspense></Layout>} />
              <Route path="/chat" element={<Layout><Suspense fallback={<SplashLoader />}><Chat /></Suspense></Layout>} />
              <Route path="/profile" element={<Layout><Suspense fallback={<SplashLoader />}><Profile /></Suspense></Layout>} />
              <Route path="/subjects" element={<Layout><Suspense fallback={<SplashLoader />}><Subjects /></Suspense></Layout>} />
              <Route path="/subjects/:id" element={<Layout><Suspense fallback={<SplashLoader />}><SubjectDetail /></Suspense></Layout>} />
            </Route>
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
