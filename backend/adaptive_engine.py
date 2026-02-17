from models import LEVELS


def calculate_level(score: float) -> str:
    """Determine level from a 0-100 score."""
    if score >= 75:
        return "Advanced"
    if score >= 40:
        return "Intermediate"
    return "Beginner"


def adjust_level(current_level: str, accuracy: float, mastery: float = -1) -> str:
    """
    Shift level up / down.
    If mastery is provided (0-100), use mastery thresholds.
    Otherwise fall back to accuracy thresholds.
    """
    idx = LEVELS.index(current_level) if current_level in LEVELS else 0

    if mastery >= 0:
        if mastery > 80 and idx < len(LEVELS) - 1:
            return LEVELS[idx + 1]
        if mastery < 50 and idx > 0:
            return LEVELS[idx - 1]
        return current_level

    if accuracy > 80 and idx < len(LEVELS) - 1:
        return LEVELS[idx + 1]
    if accuracy < 40 and idx > 0:
        return LEVELS[idx - 1]
    return current_level


# ---------------------------------------------------------------------------
# Prompt generators
# ---------------------------------------------------------------------------

def _type_format_instruction(question_type: str) -> str:
    """Return JSON schema instructions for a specific question type."""
    if question_type == "mcq":
        return (
            'Each question must be JSON with keys: "type" (always "mcq"), '
            '"question", "options" (array of exactly 4 strings), "answer" (the correct option text).'
        )
    elif question_type == "true_false":
        return (
            'Each question must be JSON with keys: "type" (always "true_false"), '
            '"question", "answer" (boolean: true or false).'
        )
    elif question_type == "short":
        return (
            'Each question must be JSON with keys: "type" (always "short"), '
            '"question", "answer" (concise text).'
        )
    elif question_type == "qa":
        return (
            'Each question must be JSON with keys: "type" (always "qa"), '
            '"question", "expected_points" (array of 2-4 key points the answer should cover).'
        )
    else:
        # mixed
        return (
            "Use a mix of question types. Each question must have a \"type\" field "
            "(one of: \"mcq\", \"true_false\", \"short\", \"qa\") and the appropriate fields:\n"
            "- mcq: question, options (array of 4), answer (correct option text)\n"
            "- true_false: question, answer (boolean)\n"
            "- short: question, answer (text)\n"
            "- qa: question, expected_points (array of strings)"
        )


def generate_lesson_prompt(subject: str, level: str) -> str:
    return (
        f"Generate a concise lesson for {subject} at {level} level. "
        "Include explanation and one example. "
        "Keep it structured with clear headings."
    )


def generate_exercise_prompt(subject: str, level: str, question_type: str = "short") -> str:
    type_instr = _type_format_instruction(question_type)
    return (
        f"Generate 5 practice questions for {subject} at {level} level.\n"
        f"{type_instr}\n"
        "Return ONLY a JSON array with no extra text.\n"
        "Do not wrap the JSON in markdown code fences."
    )


def generate_diagnostic_prompt(subject: str, question_type: str = "short") -> str:
    type_instr = _type_format_instruction(question_type)
    return (
        f"Generate 5 diagnostic quiz questions for {subject} that test a range of difficulty.\n"
        f"{type_instr}\n"
        "Return ONLY a JSON array with no extra text.\n"
        "Do not wrap the JSON in markdown code fences."
    )
