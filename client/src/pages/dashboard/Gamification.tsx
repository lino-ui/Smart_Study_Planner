import { useState, useEffect } from 'react';
import { Award, Flame, Zap, Trophy, Crown, Star, BookOpen, Sunrise, Moon, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import { GamificationStats } from '../../types/gamification';

// Helper function to map badge icon strings to Lucide components
const getBadgeIcon = (iconName: string, className: string = "h-6 w-6") => {
  switch (iconName) {
    case 'Flame': return <Flame className={className} />;
    case 'Award': return <Award className={className} />;
    case 'Trophy': return <Trophy className={className} />;
    case 'Crown': return <Crown className={className} />;
    case 'Star': return <Star className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Sunrise': return <Sunrise className={className} />;
    case 'Moon': return <Moon className={className} />;
    default: return <Award className={className} />;
  }
};

// All possible badges in the system (to show locked ones)
const ALL_BADGES = [
  { name: 'First Steps', icon: 'Award', desc: 'Completed your first study session.' },
  { name: 'On Fire', icon: 'Flame', desc: 'Maintained a 3-day study streak.' },
  { name: 'Consistency King', icon: 'Crown', desc: 'Maintained a 7-day study streak.' },
  { name: 'Early Bird', icon: 'Sunrise', desc: 'Studied early in the morning.' },
  { name: 'Night Owl', icon: 'Moon', desc: 'Studied late at night.' },
  { name: 'Knowledge Seeker', icon: 'BookOpen', desc: 'Completed a syllabus chapter.' },
  { name: 'Subject Master', icon: 'Trophy', desc: 'Completed 100% of a subject.' },
];

export default function Gamification() {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/gamification/stats');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch gamification stats");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const earnedBadgeNames = new Set(stats.badges.map(b => b.badge_name));

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" /> Achievements
          </h1>
          <p className="text-muted-foreground mt-1">Level up by logging your study sessions and completing chapters.</p>
        </div>
      </div>

      {/* Level & XP Banner */}
      <div className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -right-10 -top-10 opacity-5">
          <Star className="h-64 w-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          {/* Level Circle */}
          <div className="relative shrink-0">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-secondary/20" />
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={351.8} 
                strokeDashoffset={351.8 - (351.8 * stats.progress_percentage) / 100}
                className="text-primary transition-all duration-1000 ease-out" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card rounded-full m-2 shadow-inner">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Level</span>
              <span className="text-4xl font-extrabold text-foreground">{stats.current_level}</span>
            </div>
          </div>

          {/* XP Info */}
          <div className="flex-1 w-full text-center md:text-left">
            <h2 className="text-2xl font-bold mb-2">You are doing great!</h2>
            <p className="text-muted-foreground mb-4">
              You need <strong className="text-primary">{stats.xp_to_next_level} XP</strong> to reach Level {stats.current_level + 1}. 
              Keep studying to earn more!
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-background border rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                <Zap className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Total XP</div>
                  <div className="font-bold">{stats.total_xp.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="bg-background border rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                <Flame className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Current Streak</div>
                  <div className="font-bold">{stats.current_streak} days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Gallery */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" /> Badge Gallery
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ALL_BADGES.map((badge, idx) => {
            const isEarned = earnedBadgeNames.has(badge.name);
            const earnedInfo = stats.badges.find(b => b.badge_name === badge.name);
            
            return (
              <div 
                key={idx} 
                className={`border rounded-xl p-5 flex flex-col items-center text-center transition-all ${
                  isEarned 
                    ? 'bg-card shadow-sm border-primary/20 hover:border-primary/50 hover:shadow-md' 
                    : 'bg-muted/30 border-dashed opacity-70 grayscale'
                }`}
              >
                <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-3 shadow-inner ${
                  isEarned ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {getBadgeIcon(badge.icon, "h-8 w-8")}
                </div>
                <h4 className="font-bold text-sm mb-1">{badge.name}</h4>
                <p className="text-xs text-muted-foreground leading-snug">{badge.desc}</p>
                
                {isEarned && earnedInfo && (
                  <div className="mt-auto pt-3 text-[10px] text-primary font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {new Date(earnedInfo.earned_at).toLocaleDateString()}
                  </div>
                )}
                {!isEarned && (
                  <div className="mt-auto pt-3 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Locked
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
