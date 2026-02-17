"""
Flashcard generation prompts.
The actual generation is done via gemini_client.generate_json().
"""


def generate_flashcard_prompt(subject: str, level: str, topic: str | None = None) -> str:
    """Build a prompt that asks Gemini to produce 10 flashcards."""
    scope = f"{subject} at {level} level"
    if topic:
        scope += f", focusing on {topic}"

    return (
        f"Generate exactly 10 flashcards for studying {scope}.\n"
        "Return ONLY a JSON array with no extra text.\n"
        "Each element must have exactly two keys: \"front\" and \"back\".\n"
        "\"front\" is the question or term, \"back\" is the answer or definition.\n"
        "Keep answers concise (1-3 sentences).\n"
        "Example format:\n"
        '[{"front": "What is a stack?", "back": "A LIFO data structure where elements are added and removed from the top."}]'
    )


def generate_flashcard_from_material_prompt(chunks: list[str]) -> str:
    """Build a prompt that generates flashcards from uploaded material chunks."""
    context = "\n---\n".join(chunks)
    return (
        "Based on the following study material, generate exactly 10 flashcards.\n"
        "Return ONLY a JSON array with no extra text.\n"
        "Each element must have exactly two keys: \"front\" and \"back\".\n"
        "\"front\" is the question or key concept, \"back\" is the concise answer.\n\n"
        f"MATERIAL:\n{context}\n\n"
        "Generate the flashcards now."
    )
