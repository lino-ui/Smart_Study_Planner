import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Clock, BookOpen, Target, MessageSquareText, CalendarDays, Loader2, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import api from '../../lib/axios';
import { DashboardOverviewResponse } from '../../types/dashboard';

export default function Dashboard() {
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/overview');
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
            Hello, {data.user_name}
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        {/* Gamification Quick Stats */}
        <div className="flex items-center gap-4 bg-card border rounded-full px-5 py-2 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              L{data.current_level}
            </div>
            <div className="w-24 h-2 bg-secondary/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000" 
                style={{ width: `${data.xp_progress_percentage}%` }}
              />
            </div>
          </div>
          <div className="w-px h-6 bg-border mx-1"></div>
          <div className="flex items-center gap-1.5 font-bold text-orange-500" title="Current Streak">
            <Flame className="h-5 w-5" /> {data.current_streak}
          </div>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-primary-foreground shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <Target className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Today's Mission</h2>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-black">{data.hours_studied_today}</span>
              <span className="text-primary-foreground/80 text-xl font-medium mb-1">/ {data.planned_hours_today} hrs completed</span>
            </div>
            <div className="w-full max-w-sm bg-primary-foreground/20 rounded-full h-3 mb-6 overflow-hidden">
              <div 
                className="h-full bg-primary-foreground rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min((data.hours_studied_today / (data.planned_hours_today || 1)) * 100, 100)}%` }}
              />
            </div>
            
            <Link 
              to="/progress"
              className="inline-flex items-center justify-center bg-background text-foreground hover:bg-background/90 px-6 py-3 rounded-xl font-bold transition-all shadow-sm group"
            >
              <Play className="h-5 w-5 mr-2 text-primary group-hover:scale-110 transition-transform" /> Start Study Session
            </Link>
          </div>
          
          <div className="bg-background/10 backdrop-blur-sm border border-primary-foreground/20 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <MessageSquareText className="h-5 w-5" /> Daily Motivation
            </h3>
            <p className="text-primary-foreground/90 leading-relaxed text-lg italic">
              "{data.daily_motivation}"
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Today's Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" /> Today's Schedule
            </h3>
            <Link to="/timetable" className="text-sm text-primary font-medium hover:underline flex items-center">
              View full planner <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            {data.today_tasks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <BookOpen className="h-12 w-12 opacity-20 mb-3" />
                <p>No tasks scheduled for today.</p>
                <Link to="/timetable" className="text-primary font-medium mt-2 hover:underline">Generate a timetable</Link>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {data.today_tasks.map(task => (
                  <div key={task.id} className={`p-4 flex items-center gap-4 transition-colors hover:bg-muted/30 ${task.is_completed ? 'opacity-60' : ''}`}>
                    <div className="w-16 text-center shrink-0">
                      <div className="font-bold text-lg">{task.start_time}</div>
                      <div className="text-xs text-muted-foreground">{task.duration_minutes}m</div>
                    </div>
                    
                    <div className="w-1 bg-border h-12 rounded-full shrink-0 relative overflow-hidden">
                      <div className="absolute inset-0" style={{ backgroundColor: task.subject_color }}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold truncate ${task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.chapter_title}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.subject_color }}></span>
                        {task.subject_name}
                      </p>
                    </div>
                    
                    {task.is_completed ? (
                      <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
                    ) : (
                      <Link to="/progress" className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary hover:text-primary transition-colors text-muted-foreground shrink-0">
                        <CheckCircle2 className="h-5 w-5" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Exams & Progress Snapshot */}
        <div className="space-y-8">
          
          {/* Upcoming Exams */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-secondary" /> Upcoming Exams
            </h3>
            <div className="space-y-3">
              {data.upcoming_exams.length === 0 ? (
                <div className="bg-card border border-dashed rounded-xl p-5 text-center text-muted-foreground text-sm">
                  No upcoming exams scheduled.
                </div>
              ) : (
                data.upcoming_exams.map(exam => (
                  <div key={exam.subject_id} className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: exam.subject_color }}></div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {new Date(exam.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <h4 className="font-bold text-foreground truncate">{exam.subject_name}</h4>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-2xl font-black ${exam.days_left <= 7 ? 'text-destructive' : 'text-foreground'}`}>
                        {exam.days_left}
                      </div>
                      <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Days Left</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Quick Actions */}
          <div className="bg-gradient-to-br from-card to-secondary/5 border border-secondary/20 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-secondary" /> AI Study Tutor
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Stuck on a concept? Ask the Smart Tutor for a quick explanation.
            </p>
            <Link 
              to="/chat" 
              className="w-full bg-secondary/10 hover:bg-secondary/20 text-secondary font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center border border-secondary/20"
            >
              Open AI Chat
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
