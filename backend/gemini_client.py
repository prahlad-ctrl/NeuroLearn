import os
import json
import re
import asyncio
import httpx

# ---------------------------------------------------------------------------
# Provider toggle: IS_GEMINI=true  → Google Gemini API
#                  IS_GEMINI=false → Local Ollama (Mistral)
# ---------------------------------------------------------------------------

_client = None
_use_gemini: bool | None = None

GEMINI_MODEL = "gemini-2.5-flash"
OLLAMA_BASE = "http://localhost:11434"


def _is_gemini() -> bool:
    global _use_gemini
    if _use_gemini is None:
        _use_gemini = os.getenv("IS_GEMINI", "true").strip().lower() in ("true", "1", "yes")
        provider = "Gemini" if _use_gemini else f"Ollama ({os.getenv('OLLAMA_MODEL', 'mistral')})"
        print(f"[AI] Using provider: {provider}")
    return _use_gemini


def _get_gemini_client():
    """Lazy-init the Gemini client."""
    global _client
    if _client is None:
        from google import genai
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set in environment / .env")
        _client = genai.Client(api_key=api_key)
    return _client


def _parse_retry_delay(exc: Exception) -> float | None:
    """Try to extract the retryDelay seconds from a 429 error."""
    msg = str(exc)
    m = re.search(r"retry in ([\d.]+)s", msg, re.IGNORECASE)
    if m:
        return float(m.group(1))
    m = re.search(r"retryDelay['\"]:\s*['\"]?([\d.]+)s", msg)
    if m:
        return float(m.group(1))
    return None


# ---------------------------------------------------------------------------
# Ollama helpers
# ---------------------------------------------------------------------------

async def _ollama_generate(prompt: str, json_mode: bool = False) -> str:
    """Call local Ollama API and return the response text."""
    model = os.getenv("OLLAMA_MODEL", "mistral")
    payload: dict = {"model": model, "prompt": prompt, "stream": False}
    if json_mode:
        payload["format"] = "json"

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(f"{OLLAMA_BASE}/api/generate", json=payload)
        resp.raise_for_status()
        return resp.json().get("response", "")


# ---------------------------------------------------------------------------
# Public API — generate_text / generate_json
# ---------------------------------------------------------------------------

async def generate_text(prompt: str) -> str:
    """Send a prompt and return the response text."""
    try:
        if _is_gemini():
            from google.genai import types  # noqa: F811
            client = _get_gemini_client()
            response = await client.aio.models.generate_content(
                model=GEMINI_MODEL, contents=prompt,
            )
            return response.text
        else:
            return await _ollama_generate(prompt)
    except Exception as exc:
        return f"[Error] AI request failed: {exc}"


def _parse_json_text(raw: str) -> list[dict] | None:
    """Try hard to extract a JSON array from raw text. Returns None on failure."""
    cleaned = re.sub(r"```(?:json)?\s*", "", raw)
    cleaned = cleaned.strip().rstrip("`")

    # Attempt direct parse
    try:
        parsed = json.loads(cleaned)
        # If it's already a list, use it
        if isinstance(parsed, list):
            return parsed
        # Ollama often wraps in {"data": [...]} or {"questions": [...]}
        if isinstance(parsed, dict):
            for key in ("data", "questions", "items", "results", "quiz", "flashcards"):
                if key in parsed and isinstance(parsed[key], list):
                    return parsed[key]
            # Single question object → wrap in list
            if "question" in parsed:
                return [parsed]
        return [parsed] if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        pass

    # Fallback: find a JSON array in the text
    match = re.search(r"\[.*\]", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return None


async def generate_json(prompt: str, retries: int = 3) -> list[dict]:
    """Generate JSON with automatic retry on parse failure or rate-limit."""
    last_raw = ""

    for attempt in range(1 + retries):
        try:
            if _is_gemini():
                from google.genai import types
                client = _get_gemini_client()
                response = await client.aio.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                    ),
                )
                last_raw = response.text
            else:
                json_prompt = (
                    prompt
                    + "\n\nIMPORTANT: Respond ONLY with a valid JSON array. "
                    "No markdown, no explanation, just the JSON array."
                )
                last_raw = await _ollama_generate(json_prompt, json_mode=True)
        except Exception as exc:
            print(f"[AI] Error (attempt {attempt + 1}): {exc}")
            if attempt < retries:
                delay = _parse_retry_delay(exc)
                if delay:
                    wait = min(delay + 2, 60)
                    print(f"[AI] Rate-limited, waiting {wait:.0f}s before retry...")
                    await asyncio.sleep(wait)
                else:
                    await asyncio.sleep(2 ** (attempt + 1))
                continue
            return [{"question": "AI request failed. Please try again.", "answer": "N/A"}]

        parsed = _parse_json_text(last_raw)
        if parsed is not None:
            return parsed

        if attempt < retries:
            print(f"[AI] Malformed JSON, retrying ({attempt + 1}/{retries})...")
            await asyncio.sleep(1)

    print(f"[AI] Could not parse response after {retries + 1} attempts: {last_raw[:200]}")
    return [{"question": "Could not parse AI response. Please try again.", "answer": "N/A"}]
