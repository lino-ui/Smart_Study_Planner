import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Wand2, CheckCircle2, Circle, Loader2, Clock } from 'lucide-react';
import api from '../../lib/axios';
import { DailyTask } from '../../types/timetable';
import { useAuthStore } from '../../store/authStore';

export default function Timetable() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Get the start of the week (Sunday)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(currentDate);

  const fetchTasks = async (startDate: Date) => {
    try {
      setIsLoading(true);
      const formattedDate = startDate.toISOString().split('T')[0];
      const res = await api.get(`/timetable/weekly?start_date=${formattedDate}`);
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch timetable");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(startOfWeek);
  }, [currentDate]);

  const generateTimetable = async (regenerate: boolean = false) => {
    if (!user) return;
    try {
      setIsGenerating(true);
      setMessage(null);
      const payload = {
        start_date: startOfWeek.toISOString().split('T')[0],
        days_to_generate: 7,
        regenerate
      };
      const res = await api.post('/timetable/generate', payload);
      setMessage({ type: 'success', text: res.data.message });
      fetchTasks(startOfWeek);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to generate timetable' });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTaskCompletion = async (task: DailyTask) => {
    try {
      // Optimistic update
      setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t));
      await api.put(`/timetable/tasks/${task.id}`, { is_completed: !task.is_completed });
    } catch (err) {
      // Revert on error
      fetchTasks(startOfWeek);
    }
  };

  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  // Group tasks by date
  const groupedTasks: Record<string, DailyTask[]> = {};
  
  // Initialize all 7 days with empty arrays
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    groupedTasks[d.toISOString().split('T')[0]] = [];
  }

  tasks.forEach(task => {
    if (groupedTasks[task.task_date]) {
      groupedTasks[task.task_date].push(task);
    }
  });

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" /> Timetable
          </h1>
          <p className="text-muted-foreground mt-1">Your AI-generated optimal study schedule.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => generateTimetable(true)}
            disabled={isGenerating}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/90 h-10 px-4 py-2 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Regenerate Schedule
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md border text-sm ${message.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
          <button onClick={prevWeek} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-lg font-bold text-foreground">
            {startOfWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - 
            {new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <button onClick={nextWeek} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center p-6">
            <div className="bg-primary/10 p-6 rounded-full mb-4">
              <Wand2 className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Schedule Generated</h3>
            <p className="text-muted-foreground mb-6 max-w-md">Let the AI analyze your syllabus, priorities, and available hours to create an optimal study plan.</p>
            <button
              onClick={() => generateTimetable()}
              disabled={isGenerating}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6"
            >
              {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Generate Smart Timetable"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-border border-b border-border">
            {Object.keys(groupedTasks).map((dateStr, index) => {
              const dayTasks = groupedTasks[dateStr];
              const dateObj = new Date(dateStr);
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              
              return (
                <div key={dateStr} className={`min-h-[500px] flex flex-col ${isToday ? 'bg-primary/5' : ''}`}>
                  <div className={`p-3 text-center border-b border-border/50 ${isToday ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground bg-muted/10'}`}>
                    <div className="text-xs uppercase tracking-wider font-semibold">{daysOfWeek[dateObj.getDay()]}</div>
                    <div className="text-2xl font-light mt-1 text-foreground">{dateObj.getDate()}</div>
                  </div>
                  
                  <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                    {dayTasks.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground opacity-50">
                        No tasks
                      </div>
                    ) : (
                      dayTasks.map(task => (
                        <div 
                          key={task.id} 
                          className={`p-3 rounded-lg border text-sm transition-all group relative overflow-hidden ${
                            task.is_completed 
                              ? 'bg-muted/50 border-border opacity-60 grayscale' 
                              : 'bg-card border-border/50 shadow-sm hover:shadow-md'
                          }`}
                        >
                          {/* Subject Color Indicator */}
                          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: task.subject_color || '#14B8A6' }}></div>
                          
                          <div className="pl-1">
                            <div className="flex justify-between items-start mb-1">
                              <span 
                                className="text-xs font-semibold px-2 py-0.5 rounded-full" 
                                style={{ 
                                  backgroundColor: `${task.subject_color || '#14B8A6'}20`, 
                                  color: task.subject_color || '#14B8A6' 
                                }}
                              >
                                {task.subject_name || "Study Session"}
                              </span>
                              <button 
                                onClick={() => toggleTaskCompletion(task)}
                                className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                              >
                                {task.is_completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                ) : (
                                  <Circle className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            
                            <h4 className={`font-medium line-clamp-2 mt-1 mb-2 ${task.is_completed ? 'line-through' : 'text-foreground'}`}>
                              {task.title}
                            </h4>
                            
                            <div className="flex items-center text-xs text-muted-foreground font-medium">
                              <Clock className="h-3 w-3 mr-1" /> {task.duration_minutes} min
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
