import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { useAuthStore } from './store/authStore';

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  
  return (
    <div className="flex min-h-screen w-full bg-background font-sans">
      <aside className="hidden w-64 flex-col border-r bg-card shadow-soft md:flex">
        <div className="flex h-16 items-center px-6 border-b">
          <span className="text-xl font-bold text-primary">Smart Study</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="p-2 rounded-md bg-primary/10 text-primary font-medium">Dashboard</div>
          <div className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors cursor-pointer">Planner</div>
          <div className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors cursor-pointer">Analytics</div>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-6 shadow-sm">
          <div className="md:hidden text-xl font-bold text-primary">Smart Study</div>
          <div className="hidden md:block text-sm text-muted-foreground">
            {user ? `Welcome back, ${user.full_name.split(' ')[0]}` : 'Welcome back, Student'}
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={logout}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Logout
            </button>
            <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold uppercase">
              {user ? user.full_name.charAt(0) : 'U'}
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
          This is a protected area. You can now access your smart tools.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-card rounded-xl shadow-soft border border-border/50 flex flex-col items-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-6 h-6 bg-primary rounded-sm opacity-80" />
            </div>
            <h3 className="font-semibold text-lg">Feature {i}</h3>
            <p className="text-sm text-muted-foreground text-center">Intelligent organization to help you stay ahead.</p>
          </div>
        ))}
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
        </Route>
        
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
