import json
import re
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.1:8b"  # <-- must match `ollama list` exactly

LIFESAVING_RULES = [
    "Bypassing Safety Controls",
    "Confined Space",
    "Driving",
    "Energy Isolation",
    "Hot Work",
    "Line of Fire",
    "Safe Mechanical Lifting",
    "Work Authorisation",
    "Working at Height",
    "Other / Not Clearly Applicable",
]

VALID_SIF_LEVELS = {"High", "Medium", "Low"}

EXTRACTION_PROMPT_TEMPLATE = """You are a workplace safety analyst. Analyze the safety report below using this reasoning chain:

Activity -> Hazard -> Energy -> Exposure -> Critical Control -> Barrier Failure -> Potential Consequence -> SIF Potential -> Life-Saving Rule

Report:
\"\"\"{report_text}\"\"\"

For "lifesaving_rule", you MUST choose the single closest match from this exact list (copy the text exactly as written, do not invent new categories or cite regulations):
{rules_list}

For "sif_potential", you MUST use exactly one of: High, Medium, Low.

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
  "lifesaving_rule": "one exact item from the list above",
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
    rules_list_text = "\n".join(f"- {rule}" for rule in LIFESAVING_RULES)
    prompt = EXTRACTION_PROMPT_TEMPLATE.format(
        report_text=report_text, rules_list=rules_list_text
    )

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

    result["sif_potential"] = _normalize_sif_potential(result.get("sif_potential"))
    result["lifesaving_rule"] = _normalize_lifesaving_rule(result.get("lifesaving_rule"))

    return result


def _normalize_sif_potential(value):
    if not value:
        return "Unknown"
    value_clean = str(value).strip().capitalize()
    if value_clean in VALID_SIF_LEVELS:
        return value_clean
    return "Unknown"


def _normalize_lifesaving_rule(value):
    if not value:
        return "Other / Not Clearly Applicable"
    value_clean = str(value).strip().lower()
    for rule in LIFESAVING_RULES:
        if rule.lower() == value_clean:
            return rule
    for rule in LIFESAVING_RULES:
        if rule.lower() in value_clean or value_clean in rule.lower():
            return rule
    return "Other / Not Clearly Applicable"


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