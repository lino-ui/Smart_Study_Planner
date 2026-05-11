export interface DailyTask {
  id: number;
  subject_id: number;
  chapter_id: number | null;
  task_date: string; // ISO date
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  title: string;
  is_completed: boolean;
  priority_score: number;
  subject_color?: string;
  subject_name?: string;
}

export interface GenerateTimetableRequest {
  start_date: string;
  days_to_generate: number;
  regenerate: boolean;
}
