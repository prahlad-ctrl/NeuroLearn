import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from schemas import (
    StartSessionRequest,
    StartSessionResponse,
    DiagnosticRequest,
    DiagnosticResponse,
    GenerateRequest,
    LessonResponse,
    ExerciseResponse,
    SubmitExerciseRequest,
    SubmitExerciseResponse,
    ProgressResponse,
    MaterialUploadResponse,
    MaterialGenerateRequest,
    MaterialLessonResponse,
    MaterialExerciseResponse,
    FlashcardRequest,
    FlashcardResponse,
)
from database import create_session, get_session, update_session
from adaptive_engine import (
    calculate_level,
    adjust_level,
    generate_lesson_prompt,
    generate_exercise_prompt,
    generate_diagnostic_prompt,
)
from gemini_client import generate_text, generate_json
from performance_tracker import (
    record_answers,
    compute_mastery,
    detect_weaknesses,
    get_study_recommendations,
)
from material_rag import (
    extract_text,
    chunk_text,
    store_chunks,
    retrieve_chunks,
    has_material,
    build_rag_lesson_prompt,
    build_rag_exercise_prompt,
)
from flashcard_engine import generate_flashcard_prompt, generate_flashcard_from_material_prompt

router = APIRouter()


# ---------------------------------------------------------------------------
# Session
# ---------------------------------------------------------------------------

@router.post("/start-session", response_model=StartSessionResponse)
async def start_session(req: StartSessionRequest):
    session_id = uuid.uuid4().hex[:12]
    await create_session(session_id, req.subject)
    return StartSessionResponse(session_id=session_id, subject=req.subject, level="unknown")


# ---------------------------------------------------------------------------
# Diagnostic
# ---------------------------------------------------------------------------

@router.post("/diagnostic-questions")
async def diagnostic_questions(req: GenerateRequest):
    session = await get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    prompt = generate_diagnostic_prompt(session["subject"], req.question_type)
    questions = await generate_json(prompt)
    return {"questions": questions, "subject": session["subject"]}


@router.post("/diagnostic", response_model=DiagnosticResponse)
async def diagnostic(req: DiagnosticRequest):
    session = await get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    correct, total = _score_answers(req.answers)
    score = (correct / total * 100) if total > 0 else 0
    level = calculate_level(score)

    # Update performance tracker
    perf = session.get("performance", None)
    if perf is None:
        from performance_tracker import empty_performance
        perf = empty_performance()
    scored = _add_correct_flags(req.answers)
    qtype = scored[0].get("type", "short") if scored else "short"
    perf = record_answers(perf, scored, qtype, session["subject"])

    history = session["level_history"] + [level]
    await update_session(
        session["id"],
        level=level,
        total_correct=session["total_correct"] + correct,
        total_attempts=session["total_attempts"] + total,
        level_history=history,
        performance=perf,
    )

    return DiagnosticResponse(score=round(score, 1), level=level, correct=correct, total=total)


# ---------------------------------------------------------------------------
# Lesson & Exercise
# ---------------------------------------------------------------------------

@router.post("/generate-lesson", response_model=LessonResponse)
async def generate_lesson(req: GenerateRequest):
    session = await get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["level"] == "unknown":
        raise HTTPException(status_code=400, detail="Complete diagnostic first")

    prompt = generate_lesson_prompt(session["subject"], session["level"])
    lesson_text = await generate_text(prompt)
    return LessonResponse(lesson=lesson_text, subject=session["subject"], level=session["level"])


@router.post("/generate-exercise", response_model=ExerciseResponse)
async def generate_exercise(req: GenerateRequest):
    session = await get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["level"] == "unknown":
        raise HTTPException(status_code=400, detail="Complete diagnostic first")

    prompt = generate_exercise_prompt(session["subject"], session["level"], req.question_type)
    questions = await generate_json(prompt)
    return ExerciseResponse(questions=questions, subject=session["subject"], level=session["level"])


@router.post("/submit-exercise", response_model=SubmitExerciseResponse)
async def submit_exercise(req: SubmitExerciseRequest):
    session = await get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    correct, total = _score_answers(req.answers)
    accuracy = (correct / total * 100) if total > 0 else 0

    # Update performance
    perf = session.get("performance", None)
    if perf is None:
        from performance_tracker import empty_performance
        perf = empty_performance()
    scored = _add_correct_flags(req.answers)
    qtype = scored[0].get("type", "short") if scored else "short"
    perf = record_answers(perf, scored, qtype, session["subject"])
    mastery = compute_mastery(perf)

    new_level = adjust_level(session["level"], accuracy, mastery)
    level_changed = new_level != session["level"]

    history = session["level_history"]
    if level_changed:
        history = history + [new_level]

    await update_session(
        session["id"],
        level=new_level,
        total_correct=session["total_correct"] + correct,
        total_attempts=session["total_attempts"] + total,
        level_history=history,
        performance=perf,
    )

    return SubmitExerciseResponse(
        accuracy=round(accuracy, 1),
        correct=correct,
        total=total,
        new_level=new_level,
        level_changed=level_changed,
        mastery=round(mastery, 1),
    )


# ---------------------------------------------------------------------------
# Material upload (RAG)
# ---------------------------------------------------------------------------

@router.post("/upload-material", response_model=MaterialUploadResponse)
async def upload_material(
    session_id: str = Form(...),
    file: UploadFile = File(...),
):
    # Session lookup is optional — allows standalone uploads without picking a subject
    session = await get_session(session_id)
    # (no HTTPException if session is None — standalone mode)

    content = await file.read()
    filename = file.filename or "upload"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ("pdf", "pptx"):
        raise HTTPException(status_code=400, detail="Only PDF and PPTX files are supported")

    import io as _io
    text = extract_text(filename, _io.BytesIO(content))
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    chunks = chunk_text(text)
    store_chunks(session_id, chunks, filename=filename)

    return MaterialUploadResponse(
        session_id=session_id,
        filename=filename,
        chunks=len(chunks),
        message=f"Processed {len(chunks)} chunks from {filename}",
    )


@router.post("/generate-from-material")
async def generate_from_material(req: MaterialGenerateRequest):
    # Try session lookup first; fall back to request-level subject/level
    session = await get_session(req.session_id)
    if not has_material(req.session_id):
        raise HTTPException(status_code=400, detail="No material uploaded for this session")

    subject = (session["subject"] if session else None) or req.subject or "General"
    level = (session.get("level") if session else None) or req.level or "Beginner"
    if level == "unknown":
        level = "Beginner"

    query = f"{subject} {level}"
    chunks = retrieve_chunks(req.session_id, query, top_k=5)

    if req.mode == "lesson":
        prompt = build_rag_lesson_prompt(chunks, subject, level)
        text = await generate_text(prompt)
        return MaterialLessonResponse(lesson=text, source="uploaded material")
    else:
        prompt = build_rag_exercise_prompt(chunks, subject, level, req.question_type)
        questions = await generate_json(prompt)
        return MaterialExerciseResponse(questions=questions, source="uploaded material")


# ---------------------------------------------------------------------------
# Flashcards
# ---------------------------------------------------------------------------

@router.post("/generate-flashcards", response_model=FlashcardResponse)
async def generate_flashcards(req: FlashcardRequest):
    # Try session lookup; fall back to request-level subject/level for standalone
    session = await get_session(req.session_id) if req.session_id else None

    subject = (session["subject"] if session else None) or req.subject
    level = (session.get("level") if session else None) or req.level or "Beginner"
    if level == "unknown":
        level = "Beginner"
    if not subject:
        raise HTTPException(status_code=400, detail="Subject is required (via session or request body)")

    if req.from_material and req.session_id and has_material(req.session_id):
        query = f"{subject} {req.topic or ''}"
        chunks = retrieve_chunks(req.session_id, query, top_k=5)
        prompt = generate_flashcard_from_material_prompt(chunks)
    else:
        prompt = generate_flashcard_prompt(subject, level, req.topic)

    cards = await generate_json(prompt)

    # Normalize: some models return {question, answer} instead of {front, back}
    normalized = []
    for c in cards:
        front = c.get("front") or c.get("question") or c.get("term") or ""
        back = c.get("back") or c.get("answer") or c.get("definition") or ""
        if front or back:
            normalized.append({"front": front, "back": back})
    if not normalized:
        normalized = [{"front": "No flashcards generated", "back": "Please try again."}]

    return FlashcardResponse(flashcards=normalized, subject=subject)


# ---------------------------------------------------------------------------
# Progress / Dashboard
# ---------------------------------------------------------------------------

@router.post("/progress", response_model=ProgressResponse)
async def progress(req: GenerateRequest):
    session = await get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    total = session["total_attempts"]
    accuracy = (session["total_correct"] / total * 100) if total > 0 else 0

    perf = session.get("performance", None)
    if perf is None:
        from performance_tracker import empty_performance
        perf = empty_performance()

    mastery = compute_mastery(perf)
    weaknesses = detect_weaknesses(perf)
    recs = get_study_recommendations(perf, session["subject"])

    return ProgressResponse(
        session_id=session["id"],
        subject=session["subject"],
        level=session["level"],
        total_correct=session["total_correct"],
        total_attempts=total,
        accuracy=round(accuracy, 1),
        level_history=session["level_history"],
        mastery=round(mastery, 1),
        weaknesses=weaknesses,
        recommendations=recs,
        topic_accuracy=perf.get("topic_accuracy", {}),
        type_accuracy=perf.get("type_accuracy", {}),
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _add_correct_flags(answers: list[dict]) -> list[dict]:
    """Return answer dicts with a 'correct' boolean added, based on scoring logic."""
    scored = []
    for ans in answers:
        qtype = ans.get("type", "short")
        user = str(ans.get("user_answer", "")).strip().lower()
        expected = str(ans.get("correct_answer", "")).strip().lower()
        is_correct = False
        if qtype == "true_false":
            if user in ("true", "1", "yes") and expected in ("true", "1", "yes"):
                is_correct = True
            elif user in ("false", "0", "no") and expected in ("false", "0", "no"):
                is_correct = True
        elif qtype == "qa":
            if user and expected and (user in expected or expected in user):
                is_correct = True
        else:
            is_correct = user == expected
        scored.append({**ans, "correct": is_correct})
    return scored


def _score_answers(answers: list[dict]) -> tuple[int, int]:
    """Return (correct, total) from a list of answer dicts."""
    correct = 0
    total = len(answers)
    for ans in answers:
        qtype = ans.get("type", "short")
        user = str(ans.get("user_answer", "")).strip().lower()
        expected = str(ans.get("correct_answer", "")).strip().lower()

        if qtype == "true_false":
            if user in ("true", "1", "yes") and expected in ("true", "1", "yes"):
                correct += 1
            elif user in ("false", "0", "no") and expected in ("false", "0", "no"):
                correct += 1
        elif qtype == "qa":
            # QA is not auto-graded; give partial credit if any overlap
            if user and expected and (user in expected or expected in user):
                correct += 1
        else:
            if user == expected:
                correct += 1
    return correct, total
