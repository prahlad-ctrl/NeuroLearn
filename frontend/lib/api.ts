import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuestionType = "mcq" | "true_false" | "short" | "qa" | "mixed";

export interface SessionResponse {
  session_id: string;
  subject: string;
  level: string;
}

export interface DiagnosticResponse {
  score: number;
  level: string;
  correct: number;
  total: number;
}

export interface Question {
  type?: string;
  question: string;
  answer?: string;
  options?: string[];
  expected_points?: string[];
}

export interface LessonResponse {
  lesson: string;
  subject: string;
  level: string;
}

export interface ExerciseResponse {
  questions: Question[];
  subject: string;
  level: string;
}

export interface SubmitResponse {
  accuracy: number;
  correct: number;
  total: number;
  new_level: string;
  level_changed: boolean;
  mastery: number;
}

export interface ProgressResponse {
  session_id: string;
  subject: string;
  level: string;
  total_correct: number;
  total_attempts: number;
  accuracy: number;
  level_history: string[];
  mastery: number;
  weaknesses: string[];
  recommendations: string[];
  topic_accuracy: Record<string, { correct: number; total: number }>;
  type_accuracy: Record<string, { correct: number; total: number }>;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardResponse {
  flashcards: Flashcard[];
  subject: string;
}

export interface MaterialUploadResponse {
  session_id: string;
  filename: string;
  chunks: number;
  message: string;
}

export interface MaterialLessonResponse {
  lesson: string;
  source: string;
}

export interface MaterialExerciseResponse {
  questions: Question[];
  source: string;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export async function startSession(subject: string): Promise<SessionResponse> {
  const res = await api.post("/start-session", { subject });
  return res.data;
}

// ---------------------------------------------------------------------------
// Diagnostic
// ---------------------------------------------------------------------------

export async function getDiagnosticQuestions(
  session_id: string,
  question_type: QuestionType = "short"
): Promise<{ questions: Question[]; subject: string }> {
  const res = await api.post("/diagnostic-questions", { session_id, question_type });
  return res.data;
}

export async function submitDiagnostic(
  session_id: string,
  answers: { question: string; user_answer: string; correct_answer: string; type?: string }[]
): Promise<DiagnosticResponse> {
  const res = await api.post("/diagnostic", { session_id, answers });
  return res.data;
}

// ---------------------------------------------------------------------------
// Lesson & Exercise
// ---------------------------------------------------------------------------

export async function generateLesson(session_id: string): Promise<LessonResponse> {
  const res = await api.post("/generate-lesson", { session_id });
  return res.data;
}

export async function generateExercise(
  session_id: string,
  question_type: QuestionType = "short"
): Promise<ExerciseResponse> {
  const res = await api.post("/generate-exercise", { session_id, question_type });
  return res.data;
}

export async function submitExercise(
  session_id: string,
  answers: { question: string; user_answer: string; correct_answer: string; type?: string }[]
): Promise<SubmitResponse> {
  const res = await api.post("/submit-exercise", { session_id, answers });
  return res.data;
}

// ---------------------------------------------------------------------------
// Material upload (RAG)
// ---------------------------------------------------------------------------

export async function uploadMaterial(
  session_id: string,
  file: File
): Promise<MaterialUploadResponse> {
  const form = new FormData();
  form.append("session_id", session_id);
  form.append("file", file);
  const res = await api.post("/upload-material", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function generateFromMaterial(
  session_id: string,
  mode: "lesson" | "exercise" = "lesson",
  question_type: QuestionType = "short",
  subject?: string,
  level?: string
): Promise<MaterialLessonResponse | MaterialExerciseResponse> {
  const res = await api.post("/generate-from-material", { session_id, mode, question_type, subject, level });
  return res.data;
}

// ---------------------------------------------------------------------------
// Flashcards
// ---------------------------------------------------------------------------

export async function generateFlashcards(
  session_id?: string,
  topic?: string,
  from_material: boolean = false,
  subject?: string,
  level?: string
): Promise<FlashcardResponse> {
  const res = await api.post("/generate-flashcards", { session_id, topic, from_material, subject, level });
  return res.data;
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export async function getProgress(session_id: string): Promise<ProgressResponse> {
  const res = await api.post("/progress", { session_id });
  return res.data;
}
