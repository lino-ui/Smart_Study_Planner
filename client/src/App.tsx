import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background font-sans">
      {/* Sidebar Placeholder */}
      <aside className="hidden w-64 flex-col border-r bg-card shadow-soft md:flex">
        <div className="flex h-16 items-center px-6 border-b">
          <span className="text-xl font-bold text-primary">Smart Study</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {/* Navigation Links */}
          <div className="p-2 rounded-md bg-primary/10 text-primary font-medium">Dashboard</div>
          <div className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors cursor-pointer">Planner</div>
          <div className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors cursor-pointer">Analytics</div>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Navbar Placeholder */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6 shadow-sm">
          <div className="md:hidden text-xl font-bold text-primary">Smart Study</div>
          <div className="hidden md:block text-sm text-muted-foreground">Welcome back, Student</div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">
              U
            </div>
          </div>
        </header>

        {/* Main Content Area */}
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
          Smart Study Planner
        </h1>
        <p className="text-lg text-muted-foreground max-w-[600px] mx-auto">
          Manage your studies intelligently with AI. A clean, minimalistic, and calm environment to enhance your focus and academic performance.
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
        <Route path="/" element={<Layout><LandingPage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
