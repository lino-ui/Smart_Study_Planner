import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Flame, Clock, Target, Plus, BookOpen, Smile, Battery, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import { ProgressOverview, StudyLog, DailyProgressSummary, StudyLogCreate } from '../../types/progress';
import { Subject } from '../../types/subject';

const logSchema = z.object({
  subject_id: z.number().min(1, "Please select a subject"),
  chapter_id: z.number().optional().nullable(),
  duration_minutes: z.number().min(1, "Must be at least 1 minute"),
  log_date: z.string(),
  topics_covered: z.string().optional(),
  notes: z.string().optional(),
  mood: z.number().min(1).max(5).optional(),
  energy_level: z.number().min(1).max(5).optional()
});

type LogFormValues = z.infer<typeof logSchema>;

export default function Progress() {
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [weeklyData, setWeeklyData] = useState<DailyProgressSummary[]>([]);
  const [recentLogs, setRecentLogs] = useState<StudyLog[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, watch } = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      log_date: new Date().toISOString().split('T')[0],
      duration_minutes: 60,
      mood: 3,
      energy_level: 3
    }
  });

  const selectedSubjectId = watch('subject_id');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [overviewRes, weeklyRes, logsRes, subjectsRes] = await Promise.all([
        api.get('/progress/overview'),
        api.get('/progress/weekly'),
        api.get('/progress/recent'),
        api.get('/subjects/') // Needed for the dropdown
      ]);
      
      setOverview(overviewRes.data);
      setWeeklyData(weeklyRes.data);
      setRecentLogs(logsRes.data);
      setSubjects(subjectsRes.data);
    } catch (err) {
      console.error("Failed to fetch progress data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmitLog = async (data: LogFormValues) => {
    try {
      setMessage(null);
      await api.post('/progress/log', data);
      setMessage({ type: 'success', text: 'Study session logged successfully!' });
      setIsModalOpen(false);
      reset();
      fetchData(); // Refresh all stats
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to log session' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Format data for Recharts
  const chartData = weeklyData.map(d => {
    const date = new Date(d.log_date);
    return {
      name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
      hours: +(d.total_minutes / 60).toFixed(1)
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Progress & Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your study habits and monitor your syllabus completion.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> Log Session
        </button>
      </div>

      {message && !isModalOpen && (
        <div className={`p-4 rounded-md border text-sm ${message.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
          {message.text}
        </div>
      )}

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
            <Flame className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
            <h3 className="text-3xl font-bold text-foreground">{overview?.current_streak || 0} <span className="text-lg font-normal text-muted-foreground">days</span></h3>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Clock className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Hours Studied</p>
            <h3 className="text-3xl font-bold text-foreground">{overview?.total_study_hours || 0} <span className="text-lg font-normal text-muted-foreground">hrs</span></h3>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
            <Target className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Global Progress</p>
            <h3 className="text-3xl font-bold text-foreground">{overview?.global_progress_percentage || 0}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Charts and Subjects */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Weekly Chart */}
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Weekly Activity (Hours)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="hours" fill="#14B8A6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject Progress */}
          <div>
            <h3 className="text-lg font-bold mb-4">Syllabus Completion</h3>
            <div className="space-y-4">
              {overview?.subject_progress.length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-xl text-muted-foreground bg-card">
                  No subjects added yet.
                </div>
              ) : (
                overview?.subject_progress.map(sub => (
                  <div key={sub.subject_id} className="bg-card border rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: sub.color }}></div>
                        <h4 className="font-semibold text-foreground">{sub.subject_name}</h4>
                      </div>
                      <span className="text-sm font-bold">{sub.progress_percentage}%</span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full bg-secondary/20 rounded-full h-2.5 mb-1 overflow-hidden">
                      <div 
                        className="h-2.5 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${sub.progress_percentage}%`, backgroundColor: sub.color }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      {sub.total_completed_hours}h / {sub.total_estimated_hours}h
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Logs */}
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col h-full max-h-[800px]">
          <div className="p-5 border-b border-border bg-muted/10">
            <h3 className="text-lg font-bold">Recent Study Sessions</h3>
          </div>
          
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            {recentLogs.length === 0 ? (
              <div className="text-center py-10">
                <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">No study sessions logged yet.</p>
              </div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="relative pl-6 pb-6 last:pb-0 border-l border-border/50 ml-3">
                  {/* Timeline Dot */}
                  <div 
                    className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-card"
                    style={{ backgroundColor: log.subject_color || '#14B8A6' }}
                  ></div>
                  
                  <div className="bg-background border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-1">
                      <span 
                        className="text-xs font-semibold px-2 py-0.5 rounded-sm" 
                        style={{ backgroundColor: `${log.subject_color || '#14B8A6'}15`, color: log.subject_color || '#14B8A6' }}
                      >
                        {log.subject_name}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium flex items-center">
                        <Clock className="h-3 w-3 mr-1" /> {log.duration_minutes}m
                      </span>
                    </div>
                    
                    {log.chapter_title && <p className="text-sm font-medium mt-2">{log.chapter_title}</p>}
                    {log.topics_covered && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{log.topics_covered}</p>}
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex gap-2">
                        {log.mood && (
                          <span className="flex items-center text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded" title="Mood">
                            <Smile className="h-3 w-3 mr-1" /> {log.mood}/5
                          </span>
                        )}
                        {log.energy_level && (
                          <span className="flex items-center text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded" title="Energy">
                            <Battery className="h-3 w-3 mr-1" /> {log.energy_level}/5
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Log Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-border/50 flex justify-between items-center bg-muted/10">
              <h2 className="text-xl font-bold">Log Study Session</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {message && isModalOpen && (
                <div className={`mb-4 p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-destructive/10 text-destructive' : ''}`}>
                  {message.text}
                </div>
              )}
              
              <form onSubmit={handleSubmit(onSubmitLog)} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-sm font-medium">Subject *</label>
                  <select
                    {...register("subject_id", { valueAsNumber: true })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <option value={0}>Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.subject_id && <p className="text-xs text-destructive">{errors.subject_id.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Date *</label>
                    <input
                      type="date"
                      {...register("log_date")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Duration (min) *</label>
                    <input
                      type="number"
                      {...register("duration_minutes", { valueAsNumber: true })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Topics Covered</label>
                  <input
                    {...register("topics_covered")}
                    placeholder="e.g., Recursion, Linked Lists"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground flex items-center"><Smile className="h-4 w-4 mr-1"/> Mood (1-5)</label>
                    <input
                      type="range"
                      min="1" max="5"
                      {...register("mood", { valueAsNumber: true })}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>Bad</span><span>Great</span></div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground flex items-center"><Battery className="h-4 w-4 mr-1"/> Energy (1-5)</label>
                    <input
                      type="range"
                      min="1" max="5"
                      {...register("energy_level", { valueAsNumber: true })}
                      className="w-full accent-secondary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>Low</span><span>High</span></div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-10 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors inline-flex items-center shadow-sm"
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Session"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
