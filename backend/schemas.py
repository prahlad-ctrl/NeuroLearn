from pydantic import BaseModel
from typing import Optional


class StartSessionRequest(BaseModel):
    subject: str


class StartSessionResponse(BaseModel):
    session_id: str
    subject: str
    level: str


class DiagnosticRequest(BaseModel):
    session_id: str
    answers: list[dict]  # [{question, user_answer, correct_answer, type?}]


class DiagnosticResponse(BaseModel):
    score: float
    level: str
    correct: int
    total: int


class GenerateRequest(BaseModel):
    session_id: str
    question_type: str = "short"  # mcq | true_false | short | qa | mixed


class LessonResponse(BaseModel):
    lesson: str
    subject: str
    level: str


class ExerciseResponse(BaseModel):
    questions: list[dict]
    subject: str
    level: str


class SubmitExerciseRequest(BaseModel):
    session_id: str
    answers: list[dict]  # [{question, user_answer, correct_answer, type?}]


class SubmitExerciseResponse(BaseModel):
    accuracy: float
    correct: int
    total: int
    new_level: str
    level_changed: bool
    mastery: float


# --- Material upload ---
class MaterialUploadResponse(BaseModel):
    session_id: str
    filename: str
    chunks: int
    message: str


class MaterialGenerateRequest(BaseModel):
    session_id: str
    mode: str = "lesson"  # lesson | exercise
    question_type: str = "short"
    subject: Optional[str] = None   # standalone mode
    level: Optional[str] = None     # standalone mode


class MaterialLessonResponse(BaseModel):
    lesson: str
    source: str


class MaterialExerciseResponse(BaseModel):
    questions: list[dict]
    source: str


# --- Flashcards ---
class FlashcardRequest(BaseModel):
    session_id: Optional[str] = None
    topic: Optional[str] = None
    from_material: bool = False
    subject: Optional[str] = None   # standalone mode (required when no session_id)
    level: Optional[str] = None     # standalone mode


class FlashcardResponse(BaseModel):
    flashcards: list[dict]  # [{front, back}]
    subject: str


# --- Podcast ---
class PodcastRequest(BaseModel):
    topic: str


class PodcastScriptEntry(BaseModel):
    speaker: str
    name: str
    text: str
    emotion: str = "neutral"
    audio_url: Optional[str] = None


class PodcastResponse(BaseModel):
    podcast_id: str
    topic: str
    script: list[dict]
    full_audio_url: Optional[str] = None
    has_audio: bool = False
    segments: int = 0


# --- Enhanced progress ---
class ProgressResponse(BaseModel):
    session_id: str
    subject: str
    level: str
    total_correct: int
    total_attempts: int
    accuracy: float
    level_history: list[str]
    mastery: float
    weaknesses: list[str]
    recommendations: list[str]
    topic_accuracy: dict
    type_accuracy: dict
