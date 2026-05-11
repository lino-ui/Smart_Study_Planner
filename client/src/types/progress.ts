export interface StudyLog {
  id: number;
  subject_id: number;
  chapter_id?: number;
  log_date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  topics_covered?: string;
  notes?: string;
  mood?: number;
  energy_level?: number;
  created_at: string;
  
  subject_name?: string;
  subject_color?: string;
  chapter_title?: string;
}

export interface StudyLogCreate {
  subject_id: number;
  chapter_id?: number | null;
  log_date: string;
  duration_minutes: number;
  topics_covered?: string;
  notes?: string;
  mood?: number;
  energy_level?: number;
}

export interface DailyProgressSummary {
  log_date: string;
  total_minutes: number;
  logs_count: number;
}

export interface SubjectProgress {
  subject_id: number;
  subject_name: string;
  color: string;
  total_estimated_hours: number;
  total_completed_hours: number;
  progress_percentage: number;
}

export interface ProgressOverview {
  total_study_hours: number;
  global_progress_percentage: number;
  current_streak: number;
  subject_progress: SubjectProgress[];
}
