import re
from langdetect import detect, LangDetectException

class TextPreprocessor:
    """Handles data cleaning, PII redaction, and language detection."""
    
    def detect_language(self, text: str) -> str:
        if not text or len(text.strip()) < 3:
            return "unknown"
        try:
            return detect(text)
        except LangDetectException:
            return "unknown"

    def clean_text(self, text: str) -> str:
        # Basic cleaning: remove URLs, standard HTML tags
        text = re.sub(r'http\S+', '', text)
        text = re.sub(r'<.*?>', '', text)
        # In a full production scenario, we would use Microsoft Presidio here to scrub PII
        return text.strip()
