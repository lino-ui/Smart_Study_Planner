export interface OverviewStats {
  total_hours: number;
  current_streak: number;
  completion_rate: number;
  consistency_score: number;
}

export interface HeatmapData {
  date: string;
  count: number;
}

export interface WeeklyHours {
  name: string;
  hours: number;
}

export interface SubjectPerformance {
  subject: string;
  hours_spent: number;
  progress_percentage: number;
  color: string;
}

export interface TrendData {
  date: string;
  hours: number;
}

export interface AnalyticsReport {
  overview: OverviewStats;
  heatmap: HeatmapData[];
  weekly_trend: WeeklyHours[];
  subject_performance: SubjectPerformance[];
  monthly_trend: TrendData[];
  ai_insights: string[];
}
