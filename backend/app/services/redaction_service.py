import re
from typing import Optional

class RedactionService:
    """
    Sanitizes sensitive information (secrets, passwords, API keys, tokens)
    from code snippets, evidence strings, logs, and AI payloads.
    """

    REDACTION_PATTERNS = [
        # AWS Access Key ID
        (re.compile(r'(?i)\b(AKIA[0-9A-Z]{16})\b'), r'AKIA****************'),
        # AWS Secret Access Key
        (re.compile(r'(?i)(aws_secret_access_key|aws_secret|secret_key)\s*[:=]\s*["\']?([a-zA-Z0-9/+=]{40})["\']?'), r'\1="****************************************"'),
        # JWT / API key / secret assignment
        (re.compile(r'(?i)(jwt[_-]?secret|jwt[_-]?key|api[_-]?key|secret[_-]?key|client[_-]?secret|auth[_-]?token|access[_-]?token|private[_-]?key|token_secret)\s*[:=]\s*["\']([^"\']{4,})["\']'), r'\1="***REDACTED_SECRET***"'),
        # Password assignment
        (re.compile(r'(?i)(password|passwd|pwd|db_pass|admin_pass)\s*[:=]\s*["\']([^"\']+)["\']'), r'\1="***REDACTED_PASSWORD***"'),
        # Full JWT Token string
        (re.compile(r'\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}\.[A-Za-z0-9._-]{10,}\b'), r'eyJ***.***.***REDACTED_JWT***'),
        # GitHub Personal Access Token
        (re.compile(r'\b(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})\b'), r'ghp_***REDACTED_GITHUB_TOKEN***'),
        # Stripe API Keys
        (re.compile(r'\b(sk_live_[0-9a-zA-Z]{24}|pk_live_[0-9a-zA-Z]{24})\b'), r'sk_live_***REDACTED_STRIPE***'),
        # Database URIs with credentials
        (re.compile(r'(postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^:]+:([^@]+)@'), r'\1://user:***REDACTED_PASSWORD***@'),
        # Private key blocks
        (re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'), r'-----BEGIN PRIVATE KEY-----\n[***REDACTED_PRIVATE_KEY***]\n-----END PRIVATE KEY-----'),
        # Slack tokens
        (re.compile(r'\bxox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,32}\b'), r'xoxb-***REDACTED_SLACK_TOKEN***')
    ]

    @classmethod
    def redact_text(cls, text: Optional[str]) -> str:
        """Applies all regex redactions to sensitive text."""
        if not text:
            return ""

        sanitized = text
        for pattern, replacement in cls.REDACTION_PATTERNS:
            sanitized = pattern.sub(replacement, sanitized)

        return sanitized

    @classmethod
    def mask_secret_value(cls, value: str) -> str:
        """
        Masks a specific discovered secret string, showing only prefix/suffix
        with redacted center.
        """
        if not value:
            return ""
        if len(value) <= 6:
            return "***REDACTED***"
        return f"{value[:2]}...***REDACTED***...{value[-2:]}"
