export type DifficultyLevel = "Easy" | "Medium" | "Hard";
export type ChapterStatus = "Not Started" | "In Progress" | "Completed";

export interface Chapter {
  id: number;
  subject_id: number;
  title: string;
  description?: string;
  difficulty: DifficultyLevel;
  estimated_hours: number;
  completed_hours: number;
  status: ChapterStatus;
  order_index: number;
  created_at: string;
}

export interface Subject {
  id: number;
  user_id: number;
  name: string;
  branch?: string;
  semester?: number;
  exam_date?: string;
  total_hours: number;
  color: string;
  created_at: string;
}

export interface SubjectWithChapters extends Subject {
  chapters: Chapter[];
}
