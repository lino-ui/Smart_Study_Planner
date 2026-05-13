export interface Document {
  id: number;
  user_id: number;
  title: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  upload_date: string;
  subject_name?: string;
}

export interface RagQueryRequest {
  query: string;
  document_ids?: number[];
}

export interface RagQueryResponse {
  answer: string;
  context_used: boolean;
}
