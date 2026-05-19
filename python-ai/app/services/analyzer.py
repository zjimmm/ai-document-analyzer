import base64
import json
import logging
import os
import re

import google.generativeai as genai

logger = logging.getLogger(__name__)

PROMPT = """Analyze this document and return ONLY a JSON object with exactly these fields:
{
  "summary": "A 1-2 sentence summary of the document",
  "extractedText": "The full text content extracted from the document",
  "structuredData": {}
}

For structuredData, extract any fields present in the document such as:
vendorName, amount, invoiceDate, invoiceNumber, recipient, etc.
Include only fields that are actually present.
Return ONLY valid JSON — no markdown, no explanation, no code fences."""


def analyze_document(file_content_b64: str, file_type: str) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")
    file_bytes = base64.b64decode(file_content_b64)

    response = model.generate_content([
        {"mime_type": file_type, "data": file_bytes},
        PROMPT,
    ])

    text = response.text.strip()
    # Strip markdown code fences Gemini sometimes adds despite instructions
    text = re.sub(r"^```(?:json)?\n?", "", text)
    text = re.sub(r"\n?```$", "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.warning("Gemini returned non-JSON response, falling back to raw text")
        return {
            "summary": text,
            "extractedText": text,
            "structuredData": {},
        }
