export interface TaskItem {
  title: string;
  description: string;
  due_date_iso: string | null;
  due_date_original_text: string;
}

export interface FutureTasks {
  overview: string;
  items: TaskItem[];
}

export interface MentionedDate {
  date_iso: string | null;
  original_text: string;
  description: string;
}

/** Forma que o Gemini de fato produz — sem `recording_date` nem
 * `prompt_version`, que são conhecidos por nós e injetados depois do parse. */
export interface SessionExtraction {
  title: string;
  summary: string;
  off_topic: string;
  future_tasks: FutureTasks;
  mentioned_dates: MentionedDate[];
  class_activities: string;
  tags: string[];
}

export interface Session extends SessionExtraction {
  recording_date: string;
  prompt_version: string;
}

export interface CourseExtraction {
  name: string;
  professor: string;
  sessions: SessionExtraction[];
}

export interface Course {
  name: string;
  professor: string;
  sessions: Session[];
}

export interface CourseExtractionResponse {
  full_transcript: string;
  courses: CourseExtraction[];
}

export interface CourseExtractionResult {
  full_transcript: string;
  courses: Course[];
}
