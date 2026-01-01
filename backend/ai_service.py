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
PERPLEXITY_API_KEY = os.getenv('PERPLEXITY_API_KEY')
PERPLEXITY_MODEL = os.getenv('PERPLEXITY_MODEL', 'sonar-pro')
AI_ENABLED = os.getenv('AI_ENABLED', 'true').lower() == 'true'

try:
    import openai
    if OPENAI_API_KEY:
        openai.api_key = OPENAI_API_KEY
except Exception:
    openai = None


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

    # Perplexity AI
    if PERPLEXITY_API_KEY:
        try:
            url = "https://api.perplexity.ai/chat/completions"
            headers = {
                "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
                "Content-Type": "application/json"
            }
            data = {
                "model": PERPLEXITY_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a helpful business analyst."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": max_tokens,
                "temperature": 0.6
            }
            r = requests.post(url, headers=headers, json=data, timeout=30)
            if r.status_code == 200:
                res = r.json()
                if 'choices' in res and len(res['choices']) > 0:
                    return res['choices'][0]['message']['content'].strip()
                return f"AI request failed (Perplexity): Unexpected response format"
            else:
                return f"AI request failed (Perplexity): {r.status_code} {r.text}"
        except Exception as e:
            return f"AI request failed (Perplexity): {e}"

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

    return "(AI disabled) Add PERPLEXITY_API_KEY, OPENAI_API_KEY or HUGGINGFACE_API_KEY to .env to enable AI-generated insights."

def test_perplexity_key() -> str:
    """Return 'ok:<model>' if Perplexity API key works, or 'error: <detail>'.
    Does not log or echo the key.
    """
    if not AI_ENABLED:
        return "AI disabled"
    if not PERPLEXITY_API_KEY:
        return "No PERPLEXITY_API_KEY configured"
    try:
        url = "https://api.perplexity.ai/chat/completions"
        headers = {
            "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "model": PERPLEXITY_MODEL,
            "messages": [
                {"role": "user", "content": "ping"}
            ],
            "max_tokens": 10
        }
        r = requests.post(url, headers=headers, json=data, timeout=10)
        if r.status_code == 200:
            return f"ok:{PERPLEXITY_MODEL}"
        else:
            return f"error: {r.status_code} {r.text[:100]}"
    except Exception as e:
        return f"error: {e}"


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
