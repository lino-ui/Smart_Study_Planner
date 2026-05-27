import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Maximize2, Minimize2, CheckCircle2, Flame, Music, Trash2 } from 'lucide-react';
import api from '../../lib/axios';
import { Habit } from '../../types/productivity';
import { Subject } from '../../types/subject';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

const MODES = {
  pomodoro: { time: 25 * 60, label: 'Pomodoro', color: 'text-primary' },
  shortBreak: { time: 5 * 60, label: 'Short Break', color: 'text-secondary' },
  longBreak: { time: 15 * 60, label: 'Long Break', color: 'text-blue-400' }
};

export default function Pomodoro() {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(MODES.pomodoro.time);
  const [isActive, setIsActive] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Habits State
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  
  // Progress Logging
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  useEffect(() => {
    fetchData();
    // Initialize audio (using a calm nature sound placeholder, replace with real asset)
    audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const fetchData = async () => {
    try {
      const [habitsRes, subjectsRes] = await Promise.all([
        api.get('/productivity/habits'),
        api.get('/subjects/')
      ]);
      setHabits(habitsRes.data);
      setSubjects(subjectsRes.data);
    } catch (err) {
      console.error("Failed to fetch productivity data");
    }
  };

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleTimerComplete = async () => {
    setIsActive(false);
    
    // Play notification sound
    const notification = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    notification.play().catch(e => console.log("Audio play failed", e));

    if (mode === 'pomodoro') {
      alert("Pomodoro Complete! Logging session...");
      try {
        await api.post('/progress/log', {
          subject_id: selectedSubject ? parseInt(selectedSubject) : undefined,
          duration_minutes: MODES.pomodoro.time / 60,
          date: new Date().toISOString().split('T')[0]
        });
      } catch (err) {
        console.error("Failed to auto-log pomodoro");
      }
      setMode('shortBreak');
      setTimeLeft(MODES.shortBreak.time);
    } else {
      setMode('pomodoro');
      setTimeLeft(MODES.pomodoro.time);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].time);
  };

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(MODES[newMode].time);
    setIsActive(false);
  };

  const toggleFocusMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFocusMode(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFocusMode(false);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(e => console.log(e));
      setIsPlayingAudio(true);
    }
  };

  // Habit Logic
  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    try {
      const res = await api.post('/productivity/habits', { name: newHabitName });
      setHabits([...habits, res.data]);
      setNewHabitName('');
    } catch (err) {
      console.error("Failed to add habit");
    }
  };

  const toggleHabit = async (id: number) => {
    try {
      const res = await api.post(`/productivity/habits/${id}/toggle`);
      setHabits(habits.map(h => h.id === id ? res.data : h));
    } catch (err) {
      console.error("Failed to toggle habit");
    }
  };

  const deleteHabit = async (id: number) => {
    try {
      await api.delete(`/productivity/habits/${id}`);
      setHabits(habits.filter(h => h.id !== id));
    } catch (err) {
      console.error("Failed to delete habit");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((MODES[mode].time - timeLeft) / MODES[mode].time) * 100;

  // Render Focus Mode (Full Screen)
  if (isFocusMode) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
        <div className="absolute top-8 right-8 flex gap-4">
          <button onClick={toggleAudio} className={`p-3 rounded-full transition-colors ${isPlayingAudio ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            <Music className="h-6 w-6" />
          </button>
          <button onClick={toggleFocusMode} className="p-3 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
            <Minimize2 className="h-6 w-6" />
          </button>
        </div>
        
        <h2 className={`text-4xl font-bold mb-8 ${MODES[mode].color} tracking-widest uppercase`}>{MODES[mode].label}</h2>
        
        <div className="relative w-96 h-96 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle cx="192" cy="192" r="180" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-secondary/10" />
            <circle cx="192" cy="192" r="180" stroke="currentColor" strokeWidth="8" fill="transparent" 
              strokeDasharray={1131} 
              strokeDashoffset={1131 - (1131 * progressPercentage) / 100}
              className={`${MODES[mode].color} transition-all duration-1000 ease-linear`} 
            />
          </svg>
          <div className="text-[8rem] font-black tracking-tighter text-foreground z-10 font-mono">
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="flex items-center gap-6 mt-12">
          <button onClick={toggleTimer} className={`h-20 w-20 rounded-full flex items-center justify-center text-primary-foreground transition-transform hover:scale-105 shadow-lg ${isActive ? 'bg-orange-500' : 'bg-primary'}`}>
            {isActive ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-2" />}
          </button>
        </div>
      </div>
    );
  }

  // Render Normal Dashboard Mode
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Flame className="h-8 w-8 text-orange-500" /> Focus Space
          </h1>
          <p className="text-muted-foreground mt-1">
            Master your time with the Pomodoro technique and track your daily habits.
          </p>
        </div>
        <button onClick={toggleFocusMode} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-lg font-medium hover:bg-secondary/20 transition-colors">
          <Maximize2 className="h-5 w-5" /> Enter Focus Mode
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Pomodoro Timer */}
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-3xl shadow-sm p-8 flex flex-col items-center">
            
            {/* Mode Selector */}
            <div className="flex p-1 bg-muted rounded-full mb-10 w-full max-w-sm">
              {(Object.keys(MODES) as TimerMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => changeMode(m)}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all ${
                    mode === m ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {MODES[m].label}
                </button>
              ))}
            </div>

            {/* Timer Display */}
            <div className="relative w-72 h-72 flex items-center justify-center mb-10">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="144" cy="144" r="130" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-secondary/10" />
                <circle cx="144" cy="144" r="130" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray={816} 
                  strokeDashoffset={816 - (816 * progressPercentage) / 100}
                  className={`${MODES[mode].color} transition-all duration-1000 ease-linear`} 
                />
              </svg>
              <div className="text-7xl font-black tracking-tighter text-foreground z-10 font-mono">
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6 mb-8">
              <button onClick={toggleAudio} className={`p-4 rounded-full transition-colors ${isPlayingAudio ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`} title="Toggle Ambient Audio">
                <Music className="h-6 w-6" />
              </button>
              
              <button 
                onClick={toggleTimer} 
                className={`h-20 w-20 rounded-full flex items-center justify-center text-primary-foreground transition-transform hover:scale-105 shadow-lg ${isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-primary/90'}`}
              >
                {isActive ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1.5" />}
              </button>
              
              <button onClick={resetTimer} className="p-4 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors" title="Reset Timer">
                <RotateCcw className="h-6 w-6" />
              </button>
            </div>

            {/* Auto-Log Settings */}
            <div className="w-full max-w-sm pt-6 border-t flex flex-col items-center">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Auto-Log to Subject</label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                <option value="">Don't auto-log session</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Habit Tracker */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-secondary/10 to-card border rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-secondary">
              <CheckCircle2 className="h-6 w-6" /> Daily Habits
            </h2>
            
            <form onSubmit={handleAddHabit} className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Add a new habit..."
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <button type="submit" className="bg-secondary text-secondary-foreground px-3 rounded-md font-medium hover:bg-secondary/90 transition-colors text-sm">
                Add
              </button>
            </form>

            <div className="space-y-3">
              {habits.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">No habits added yet.</p>
              ) : (
                habits.map(habit => (
                  <div key={habit.id} className="flex items-center justify-between p-3 bg-background rounded-xl border shadow-sm group">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleHabit(habit.id)}
                        className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors border ${
                          habit.is_completed_today 
                            ? 'bg-success border-success text-success-foreground' 
                            : 'border-muted-foreground/30 hover:border-success/50'
                        }`}
                      >
                        {habit.is_completed_today && <CheckCircle2 className="h-4 w-4" />}
                      </button>
                      <div>
                        <p className={`text-sm font-bold ${habit.is_completed_today ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-foreground'}`}>
                          {habit.name}
                        </p>
                        <p className="text-[10px] text-orange-500 font-medium flex items-center gap-0.5">
                          <Flame className="h-3 w-3" /> {habit.current_streak} streak
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => deleteHabit(habit.id)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
