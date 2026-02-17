"""
Performance tracking module.
Tracks per-topic accuracy, per-question-type accuracy, and mastery scoring.
All state is stored in the session document in MongoDB.
"""

from __future__ import annotations

QUESTION_TYPES = ["mcq", "true_false", "short", "qa"]


def empty_performance() -> dict:
    """Return a blank performance record to embed in a new session."""
    return {
        "topic_accuracy": {},       # topic -> {correct: int, total: int}
        "type_accuracy": {},        # question_type -> {correct: int, total: int}
        "mastery_score": 0.0,
        "total_time_seconds": 0.0,
        "total_responses": 0,
        "streak": 0,
        "best_streak": 0,
    }


def record_answers(
    perf: dict,
    answers: list[dict],
    question_type: str,
    topic: str,
    time_seconds: float = 0.0,
) -> dict:
    """
    Update performance dict in-place after a round of answers.

    Each answer dict must have:
      - correct: bool
    """
    correct_count = sum(1 for a in answers if a.get("correct", False))
    total_count = len(answers)

    # -- topic accuracy --
    ta = perf.setdefault("topic_accuracy", {})
    entry = ta.setdefault(topic, {"correct": 0, "total": 0})
    entry["correct"] += correct_count
    entry["total"] += total_count

    # -- type accuracy --
    tya = perf.setdefault("type_accuracy", {})
    tentry = tya.setdefault(question_type, {"correct": 0, "total": 0})
    tentry["correct"] += correct_count
    tentry["total"] += total_count

    # -- timing --
    perf["total_time_seconds"] = perf.get("total_time_seconds", 0.0) + time_seconds
    perf["total_responses"] = perf.get("total_responses", 0) + total_count

    # -- streak --
    if correct_count == total_count:
        perf["streak"] = perf.get("streak", 0) + 1
    else:
        perf["streak"] = 0
    perf["best_streak"] = max(perf.get("best_streak", 0), perf.get("streak", 0))

    # -- mastery --
    perf["mastery_score"] = compute_mastery(perf)

    return perf


def compute_mastery(perf: dict) -> float:
    """
    Mastery score (0-100) based on overall accuracy across all topics/types.
    Weighted: 60% accuracy, 20% coverage breadth, 20% streak bonus.
    """
    topic_acc = perf.get("topic_accuracy", {})
    type_acc = perf.get("type_accuracy", {})

    # overall accuracy
    total_correct = sum(v["correct"] for v in topic_acc.values())
    total_attempts = sum(v["total"] for v in topic_acc.values())
    accuracy = (total_correct / total_attempts * 100) if total_attempts > 0 else 0.0

    # coverage: how many topics & types attempted
    topic_count = len(topic_acc)
    type_count = len(type_acc)
    coverage = min((topic_count + type_count) / 8.0, 1.0) * 100  # normalise to 100

    # streak bonus
    streak = min(perf.get("best_streak", 0), 10)
    streak_score = (streak / 10.0) * 100

    mastery = accuracy * 0.6 + coverage * 0.2 + streak_score * 0.2
    return round(min(mastery, 100.0), 1)


def detect_weaknesses(perf: dict) -> list[dict]:
    """Return topics / types where accuracy < 50%."""
    weaknesses: list[dict] = []

    for topic, v in perf.get("topic_accuracy", {}).items():
        if v["total"] >= 2:
            acc = v["correct"] / v["total"] * 100
            if acc < 50:
                weaknesses.append({"kind": "topic", "name": topic, "accuracy": round(acc, 1)})

    for qtype, v in perf.get("type_accuracy", {}).items():
        if v["total"] >= 2:
            acc = v["correct"] / v["total"] * 100
            if acc < 50:
                weaknesses.append({"kind": "question_type", "name": qtype, "accuracy": round(acc, 1)})

    return weaknesses


def suggest_next_topic(perf: dict, all_topics: list[str]) -> str:
    """Pick the topic with lowest accuracy, or an un-attempted one."""
    ta = perf.get("topic_accuracy", {})

    # prefer un-attempted
    for t in all_topics:
        if t not in ta:
            return t

    # otherwise lowest accuracy
    scored = []
    for t in all_topics:
        v = ta.get(t, {"correct": 0, "total": 1})
        scored.append((t, v["correct"] / max(v["total"], 1)))
    scored.sort(key=lambda x: x[1])
    return scored[0][0] if scored else all_topics[0]


def get_study_recommendations(perf: dict, subject: str) -> list[str]:
    """Generate text recommendations based on performance data."""
    recs: list[str] = []
    mastery = perf.get("mastery_score", 0)
    weaknesses = detect_weaknesses(perf)

    if mastery < 30:
        recs.append(f"Focus on building fundamentals in {subject}.")
    elif mastery < 60:
        recs.append("Solid progress. Continue practicing to strengthen weak areas.")
    else:
        recs.append("Strong performance. Consider moving to advanced topics.")

    for w in weaknesses[:3]:
        if w["kind"] == "topic":
            recs.append(f"Review {w['name']} -- accuracy is {w['accuracy']}%.")
        else:
            recs.append(f"Practice more {w['name'].replace('_', ' ')} questions.")

    streak = perf.get("streak", 0)
    if streak >= 3:
        recs.append(f"Current streak: {streak} rounds correct in a row.")

    return recs
