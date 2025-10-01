import os
import requests
from typing import Optional
from dotenv import load_dotenv
from pathlib import Path

# Load .env from this backend folder specifically to avoid CWD issues
ENV_PATH = Path(__file__).with_name('.env')
load_dotenv(dotenv_path=str(ENV_PATH), encoding='utf-8')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY')
HUGGINGFACE_MODEL = os.getenv('HUGGINGFACE_MODEL', 'gpt2')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_MODEL = os.getenv('GOOGLE_MODEL', 'gemini-1.5-flash')
AI_ENABLED = os.getenv('AI_ENABLED', 'false').lower() == 'true'

try:
    import openai
    if OPENAI_API_KEY:
        openai.api_key = OPENAI_API_KEY
except Exception:
    openai = None

# Optional Google Generative AI (Gemini)
try:
    import google.generativeai as genai  # type: ignore
    if GOOGLE_API_KEY:
        genai.configure(api_key=GOOGLE_API_KEY)
except Exception:
    genai = None


def generate_text(prompt: str, max_tokens: int = 150) -> str:
    """Generate text using OpenAI (if OPENAI_API_KEY set) or Hugging Face Inference API (if HUGGINGFACE_API_KEY set).
    Falls back to a canned response when no API keys available.
    """
    if not AI_ENABLED:
        return "(AI disabled) Set AI_ENABLED=true and provide API keys in .env to enable real AI calls."

    if OPENAI_API_KEY and openai is not None:
        try:
            resp = openai.Completion.create(
                engine='text-davinci-003',
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=0.6,
                n=1,
            )
            return resp.choices[0].text.strip()
        except Exception as e:
            return f"AI request failed (OpenAI): {e}"

    # Google Generative AI (Gemini)
    if GOOGLE_API_KEY and genai is not None:
        # Try configured model first, then sensible fallbacks
        # Use currently available models as of 2025
        candidates = [
            GOOGLE_MODEL,
            'models/gemini-2.0-flash',
            'models/gemini-2.5-flash',
            'models/gemini-flash-latest',
            'models/gemini-pro-latest',
        ]
        seen = set()
        errors = []
        for m in candidates:
            if not m or m in seen:
                continue
            seen.add(m)
            try:
                model = genai.GenerativeModel(m)
                r = model.generate_content(prompt)
                text = (getattr(r, 'text', None) or str(r)).strip()
                if text:
                    return text
            except Exception as e:
                errors.append(f"{m}: {e}")
        return "AI request failed (Google): " + " | ".join(errors[:3])

    if HUGGINGFACE_API_KEY:
        try:
            url = f"https://api-inference.huggingface.co/models/{HUGGINGFACE_MODEL}"
            headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
            data = {"inputs": prompt}
            r = requests.post(url, headers=headers, json=data, timeout=30)
            if r.status_code == 200:
                res = r.json()
                # HF may return text in different shapes
                if isinstance(res, dict) and 'error' in res:
                    return f"AI request failed (HuggingFace): {res['error']}"
                if isinstance(res, list):
                    # many models return a list of dicts with 'generated_text'
                    text = res[0].get('generated_text') if isinstance(res[0], dict) else str(res[0])
                    return text.strip()
                if isinstance(res, dict) and 'generated_text' in res:
                    return res['generated_text'].strip()
                return str(res)
            else:
                return f"AI request failed (HuggingFace): {r.status_code} {r.text}"
        except Exception as e:
            return f"AI request failed (HuggingFace): {e}"

    return "(AI disabled) Add OPENAI_API_KEY or HUGGINGFACE_API_KEY to .env to enable AI-generated insights."

def test_google_key() -> str:
    """Return 'ok:<model>' if Google API key works with any supported model, or 'error: <detail>'.
    Does not log or echo the key.
    """
    if not AI_ENABLED:
        return "AI disabled"
    if not GOOGLE_API_KEY:
        return "No GOOGLE_API_KEY configured"
    if genai is None:
        return "google-generativeai not installed"
    candidates = [
        GOOGLE_MODEL,
        'models/gemini-2.0-flash',
        'models/gemini-2.5-flash',
        'models/gemini-flash-latest',
        'models/gemini-pro-latest',
    ]
    seen = set()
    errors = []
    for m in candidates:
        if not m or m in seen:
            continue
        seen.add(m)
        try:
            model = genai.GenerativeModel(m)
            r = model.generate_content("ping")
            _ = getattr(r, 'text', '')
            return f"ok:{m}"
        except Exception as e:
            errors.append(f"{m}: {e}")
    return "error: " + " | ".join(errors[:3])


def build_insight_prompt_for_profits(items):
    """Create a clean prompt for summarizing product profits.
    items: list of {product, profit}
    """
    lines = [f"{i['product']}: {i['profit']}" for i in items]
    body = "\n".join(lines)
    prompt = (
        "You are a helpful business analyst.\n"
        "Summarize the following product profit numbers in 3 concise bullet points and give one concrete recommendation.\n\n"
        f"{body}\n\n"
        "Answer in plain text, 3 bullets and one recommendation."
    )
    return prompt


def build_insight_prompt_for_timeseries(dates, amounts):
    """Create a prompt for summarizing sales time series."""
    snippet = ", ".join([f"{d}:{a}" for d,a in zip(dates[:10], amounts[:10])])
    prompt = (
        "You are a helpful business analyst.\n"
        "Briefly summarize the sales trend in 2-3 sentences and suggest one action to improve sales.\n\n"
        f"Data sample: {snippet}\n\n"
        "Answer in plain text."
    )
    return prompt
