export interface ChatMessage {
  id?: number;
  user_id?: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface ChatRequest {
  message: string;
  subject_context?: string;
}
