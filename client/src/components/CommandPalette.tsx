import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CalendarDays, Flame, BookOpen, Target, BarChart3, Trophy, FileText, MessageSquareText } from 'lucide-react';

const commands = [
  { id: 'dash', name: 'Dashboard', icon: Target, path: '/dashboard' },
  { id: 'plan', name: 'Smart Timetable', icon: CalendarDays, path: '/timetable' },
  { id: 'pomo', name: 'Focus Space (Pomodoro)', icon: Flame, path: '/pomodoro' },
  { id: 'subj', name: 'Subjects', icon: BookOpen, path: '/subjects' },
  { id: 'prog', name: 'Progress Logging', icon: Target, path: '/progress' },
  { id: 'anal', name: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'doc', name: 'Library & Documents', icon: FileText, path: '/documents' },
  { id: 'chat', name: 'AI Assistant', icon: MessageSquareText, path: '/chat' },
  { id: 'game', name: 'Achievements', icon: Trophy, path: '/gamification' },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const filteredCommands = query === '' 
    ? commands 
    : commands.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card rounded-xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-top-4">
        
        {/* Search Input */}
        <div className="flex items-center px-4 border-b">
          <Search className="h-5 w-5 text-muted-foreground mr-2" />
          <input 
            type="text" 
            autoFocus
            className="w-full bg-transparent h-14 outline-none placeholder:text-muted-foreground text-foreground"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Navigation</div>
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.path)}
                  className="w-full flex items-center px-3 py-3 text-sm rounded-md hover:bg-primary/10 hover:text-primary transition-colors text-left"
                >
                  <cmd.icon className="h-4 w-4 mr-3 opacity-70" />
                  {cmd.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
