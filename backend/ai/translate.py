import json
import re
import requests

try:
    from .language_detect import detect_language
except ImportError:
    from language_detect import detect_language
    
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.1:8b"

TRANSLATE_ONLY_PROMPT = """You are a translator for workplace safety reports. The text below has been detected as {detected_language}.

Text:
\"\"\"{report_text}\"\"\"

Translate it into clear, natural English suitable for a safety analyst to read.

Respond with ONLY a valid JSON object (no extra text, no markdown fences) with exactly this key:

{{
  "english_translation": "the English translation"
}}
"""

DETECT_AND_TRANSLATE_PROMPT = """You are a multilingual translator for workplace safety reports.

Text:
\"\"\"{report_text}\"\"\"

Identify the language of this text, then translate it into clear, natural English suitable for a safety analyst to read.

Respond with ONLY a valid JSON object (no extra text, no markdown fences) with exactly these keys:

{{
  "detected_language": "the language name",
  "english_translation": "the English translation"
}}
"""


def detect_and_translate(report_text: str) -> dict:
    language_name, method = detect_language(report_text)

    if language_name == "English":
        return {
            "detected_language": "English",
            "detection_method": "langdetect",
            "english_translation": report_text,
        }

    if language_name is not None:
        return _translate_with_known_language(report_text, language_name)

    return _detect_and_translate_via_llm(report_text)


def _translate_with_known_language(report_text: str, language_name: str) -> dict:
    prompt = TRANSLATE_ONLY_PROMPT.format(
        detected_language=language_name, report_text=report_text
    )
    raw_result = _call_ollama(prompt)

    if raw_result is None:
        return {
            "detected_language": language_name,
            "detection_method": "langdetect",
            "english_translation": report_text,
            "error": "Could not reach Ollama for translation",
        }

    parsed = _parse_json_from_text(raw_result)
    if parsed is None or not parsed.get("english_translation"):
        return {
            "detected_language": language_name,
            "detection_method": "langdetect",
            "english_translation": report_text,
            "error": "Could not parse translation output",
            "raw_output": raw_result,
        }

    return {
        "detected_language": language_name,
        "detection_method": "langdetect",
        "english_translation": parsed["english_translation"],
    }


def _detect_and_translate_via_llm(report_text: str) -> dict:
    prompt = DETECT_AND_TRANSLATE_PROMPT.format(report_text=report_text)
    raw_result = _call_ollama(prompt)

    if raw_result is None:
        return {
            "detected_language": "Unknown",
            "detection_method": "llm_fallback",
            "english_translation": report_text,
            "error": "Could not reach Ollama",
        }

    parsed = _parse_json_from_text(raw_result)
    if parsed is None:
        return {
            "detected_language": "Unknown",
            "detection_method": "llm_fallback",
            "english_translation": report_text,
            "error": "Could not parse translation output",
            "raw_output": raw_result,
        }

    if not parsed.get("english_translation"):
        parsed["english_translation"] = report_text

    parsed["detection_method"] = "llm_fallback"
    return parsed


def _call_ollama(prompt: str):
    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": MODEL_NAME, "prompt": prompt, "stream": False},
            timeout=120,
        )
        response.raise_for_status()
        return response.json().get("response", "")
    except requests.exceptions.RequestException:
        return None


def _parse_json_from_text(text: str):
    text = text.strip()
    text = re.sub(r"^```json", "", text)
    text = re.sub(r"^```", "", text)
    text = re.sub(r"```$", "", text)
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None

    return None