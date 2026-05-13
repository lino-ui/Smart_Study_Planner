export interface Habit {
  id: number;
  name: string;
  description?: string;
  current_streak: number;
  longest_streak: number;
  is_completed_today: boolean;
}
