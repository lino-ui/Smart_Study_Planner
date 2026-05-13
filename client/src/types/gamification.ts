export interface Badge {
  id: number;
  badge_name: string;
  badge_icon: string;
  description: string;
  earned_at: string;
}

export interface GamificationStats {
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  total_points: number;
  xp_to_next_level: number;
  progress_percentage: number;
  badges: Badge[];
}
