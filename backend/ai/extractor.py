import json
import re
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.1:8b"  # <-- confirm this matches `ollama list` exactly

EXTRACTION_PROMPT_TEMPLATE = """You are a workplace safety analyst. Analyze the safety report below using this reasoning chain:

Activity -> Hazard -> Energy -> Exposure -> Critical Control -> Barrier Failure -> Potential Consequence -> SIF Potential -> Life-Saving Rule

Report:
\"\"\"{report_text}\"\"\"

Respond with ONLY a valid JSON object (no extra text, no markdown fences) with exactly these keys:

{{
  "activity": "...",
  "hazard": "...",
  "energy": "...",
  "exposure": "...",
  "critical_control": "...",
  "barrier_failure": "...",
  "potential_consequence": "...",
  "sif_potential": "High or Medium or Low",
  "lifesaving_rule": "...",
  "evidence": "a short exact quote from the report that supports this analysis"
}}

If a field cannot be determined from the report, use "Unknown" as the value.
"""

DEFAULT_RESULT = {
    "activity": "Unknown",
    "hazard": "Unknown",
    "energy": "Unknown",
    "exposure": "Unknown",
    "critical_control": "Unknown",
    "barrier_failure": "Unknown",
    "potential_consequence": "Unknown",
    "sif_potential": "Unknown",
    "lifesaving_rule": "Unknown",
    "evidence": "Unknown",
}


def extract_safety_fields(report_text: str) -> dict:
    prompt = EXTRACTION_PROMPT_TEMPLATE.format(report_text=report_text)

    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": MODEL_NAME, "prompt": prompt, "stream": False},
            timeout=120,
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        result = dict(DEFAULT_RESULT)
        result["error"] = f"Could not reach Ollama: {e}"
        return result

    raw_text = response.json().get("response", "")
    parsed = _parse_json_from_text(raw_text)

    if parsed is None:
        result = dict(DEFAULT_RESULT)
        result["error"] = "Could not parse model output as JSON"
        result["raw_output"] = raw_text
        return result

    result = dict(DEFAULT_RESULT)
    result.update(parsed)
    return result


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