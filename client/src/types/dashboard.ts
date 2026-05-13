export interface DashboardTaskItem {
  id: number;
  subject_name: string;
  subject_color: string;
  chapter_title: string;
  start_time: string;
  duration_minutes: int;
  is_completed: boolean;
}

export interface DashboardExamItem {
  subject_id: number;
  subject_name: string;
  subject_color: string;
  exam_date: string;
  days_left: number;
}

export interface DashboardProgressSnapshot {
  subject_name: string;
  subject_color: string;
  progress_percentage: number;
}

export interface DashboardOverviewResponse {
  user_name: string;
  current_level: number;
  current_streak: number;
  xp_progress_percentage: number;
  hours_studied_today: number;
  planned_hours_today: number;
  today_tasks: DashboardTaskItem[];
  upcoming_exams: DashboardExamItem[];
  progress_snapshot: DashboardProgressSnapshot[];
  daily_motivation: string;
}
