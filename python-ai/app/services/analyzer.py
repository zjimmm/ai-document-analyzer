import base64
import json
import os
import re

import google.generativeai as genai

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
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
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
        return {
            "summary": text,
            "extractedText": text,
            "structuredData": {},
        }
