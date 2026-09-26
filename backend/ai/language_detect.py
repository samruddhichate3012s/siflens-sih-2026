import langdetect
from langdetect.lang_detect_exception import LangDetectException

LANGUAGE_CODE_MAP = {
    "hi": "Hindi",
    "mr": "Marathi",
    "ta": "Tamil",
    "te": "Telugu",
    "en": "English",
    "bn": "Bengali",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "ur": "Urdu",
}


def detect_language(text: str):
    """
    Returns (language_name, method) where method is 'langdetect' if
    confidently detected, or None if langdetect could not determine it
    (e.g. unsupported language like Assamese, or text too short).
    """
    try:
        code = langdetect.detect(text)
    except LangDetectException:
        return None, None

    language_name = LANGUAGE_CODE_MAP.get(code, code)
    return language_name, "langdetect"