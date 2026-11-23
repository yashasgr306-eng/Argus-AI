import re
import json
from pathlib import Path
from typing import List, Dict, Any

class PatternEngine:
    """
    Deterministic static analysis rule engine implementing Semgrep, Gitleaks,
    and OSV-Scanner detection logic natively for zero-dependency local execution.
    """

    # Static Code Analysis Rules (Semgrep equivalent)
    SEMGREP_RULES = [
        {
            "id": "python.fastapi.security.sql-injection-raw-query",
            "name": "SQL Injection in Query Execution",
            "severity": "CRITICAL",
            "scanner": "semgrep",
            "message": "User input concatenated directly into SQL statement without parameterization.",
            "patterns": [
                r"(?i)(execute|cursor\.execute|session\.execute)\s*\(\s*f?[\"'].*?(?:WHERE|SELECT|INSERT|UPDATE|DELETE).*?['\"]\s*\+",
                r"(?i)(execute|cursor\.execute|session\.execute)\s*\(\s*f[\"'].*?(?:WHERE|SELECT|INSERT|UPDATE|DELETE).*?\{.*?\}",
                r"(?i)(execute|cursor\.execute|session\.execute)\s*\(\s*[\"'].*?(?:WHERE|SELECT|INSERT|UPDATE|DELETE).*?%s.*?['\"]\s*%",
                r"(?i)SELECT\s+.*?\s+FROM\s+.*?\s+WHERE\s+.*?=\s*['\"]\s*\+\s*[a-zA-Z0-9_]+"
            ]
        },
        {
            "id": "python.lang.security.dangerous-command-injection",
            "name": "Command Injection via Shell Execution",
            "severity": "CRITICAL",
            "scanner": "semgrep",
            "message": "Invoking system shell with unvalidated user input via os.system or shell=True.",
            "patterns": [
                r"os\.system\s*\(\s*f?[\"'].*?['\"]\s*\+",
                r"os\.system\s*\(\s*f[\"'].*?\{.*?\}",
                r"subprocess\.(?:Popen|call|run|check_output)\s*\([^)]*shell\s*=\s*True",
                r"(?i)(os\.popen|commands\.getoutput)\s*\(\s*f?[\"'].*?['\"]\s*\+"
            ]
        },
        {
            "id": "python.lang.security.eval-code-execution",
            "name": "Dynamic Code Evaluation via eval/exec",
            "severity": "CRITICAL",
            "scanner": "semgrep",
            "message": "eval() or exec() used with dynamic arguments can lead to Arbitrary Code Execution (RCE).",
            "patterns": [
                r"\beval\s*\(\s*[a-zA-Z0-9_]+\s*\)",
                r"\bexec\s*\(\s*[a-zA-Z0-9_]+\s*\)",
                r"__import__\s*\(\s*[a-zA-Z0-9_]+\s*\)"
            ]
        },
        {
            "id": "python.fastapi.security.missing-access-control-admin",
            "name": "Missing Authentication/Authorization on Administrative Route",
            "severity": "HIGH",
            "scanner": "semgrep",
            "message": "Sensitive admin route defined without authorization dependencies or role validation checks.",
            "patterns": [
                r'@(?:app|router)\.(?:get|post|delete|put)\s*\(\s*["\']\/(?:api\/)?(?:admin|internal|reset|debug|superuser)[^"\']*["\']\s*\)\s*(?:\n\s*def\s+[a-zA-Z0-9_]+\s*\([^)]*\):(?![^:]*(?:Depends|security|current_user|verify_admin|role)))',
                r'def\s+reset_database\s*\([^)]*\):',
                r'def\s+delete_user\s*\([^)]*\):'
            ]
        },
        {
            "id": "python.lang.security.insecure-deserialization-pickle",
            "name": "Insecure Deserialization via pickle or unvalidated YAML",
            "severity": "HIGH",
            "scanner": "semgrep",
            "message": "Deserializing untrusted data with pickle.loads or yaml.load(Loader=None) enables arbitrary code execution.",
            "patterns": [
                r"pickle\.loads\s*\(",
                r"yaml\.load\s*\([^)]*(?!Loader\s*=\s*(?:yaml\.)?SafeLoader)[^)]*\)"
            ]
        },
        {
            "id": "python.lang.security.path-traversal-open",
            "name": "Unsafe File Path Handling (Path Traversal)",
            "severity": "HIGH",
            "scanner": "semgrep",
            "message": "File open operation using untrusted user-controlled filename without path resolution or validation.",
            "patterns": [
                r"open\s*\(\s*f?[\"'].*?\{filename\}",
                r"open\s*\(\s*os\.path\.join\s*\([^,]+,\s*(?:request\.|filename|file_name)",
                r"send_file\s*\(\s*filename\s*\)"
            ]
        },
        {
            "id": "python.lang.security.weak-crypto-hash",
            "name": "Use of Broken or Weak Cryptographic Hash (MD5 / SHA1)",
            "severity": "MEDIUM",
            "scanner": "semgrep",
            "message": "MD5 or SHA1 is cryptographically weak and vulnerable to collision attacks.",
            "patterns": [
                r"hashlib\.md5\s*\(",
                r"hashlib\.sha1\s*\("
            ]
        },
        {
            "id": "web.security.cors-wildcard-origin",
            "name": "Overly Permissive CORS Policy with Wildcard",
            "severity": "LOW",
            "scanner": "semgrep",
            "message": "CORS policy allows wildcard origin '*' alongside credentials, exposing API to unauthorized origins.",
            "patterns": [
                r'allow_origins\s*=\s*\[\s*["\']\*["\']\s*\]'
            ]
        }
    ]

    # Secret Scanning Rules (Gitleaks equivalent)
    GITLEAKS_RULES = [
        {
            "id": "gitleaks.rule.aws-access-key",
            "name": "Exposed AWS Access Key",
            "severity": "CRITICAL",
            "scanner": "gitleaks",
            "message": "Identified hardcoded AWS Access Key ID pattern.",
            "pattern": r'\b(AKIA[0-9A-Z]{16})\b'
        },
        {
            "id": "gitleaks.rule.hardcoded-jwt-secret",
            "name": "Hardcoded JWT Secret / Token Key",
            "severity": "HIGH",
            "scanner": "gitleaks",
            "message": "Hardcoded JWT signing secret or secret key in source code.",
            "pattern": r'(?i)(?:jwt_secret|jwt_key|secret_key|token_secret)\s*=\s*["\']([a-zA-Z0-9_\-!@#$%^&*]{8,})["\']'
        },
        {
            "id": "gitleaks.rule.generic-api-key",
            "name": "Hardcoded API Key / Private Secret",
            "severity": "HIGH",
            "scanner": "gitleaks",
            "message": "Generic high-entropy API key or client secret assigned in code.",
            "pattern": r'(?i)(?:api_key|client_secret|auth_token|access_token|private_token)\s*=\s*["\']([a-zA-Z0-9_\-]{16,})["\']'
        },
        {
            "id": "gitleaks.rule.hardcoded-password",
            "name": "Hardcoded Plaintext Password",
            "severity": "HIGH",
            "scanner": "gitleaks",
            "message": "Plaintext password string defined in code or environment file.",
            "pattern": r'(?i)(?:password|db_pass|admin_pass|root_password)\s*=\s*["\']([^"\']{6,})["\']'
        },
        {
            "id": "gitleaks.rule.stripe-secret-key",
            "name": "Stripe Secret Key",
            "severity": "CRITICAL",
            "scanner": "gitleaks",
            "message": "Stripe Secret Key detected in source file.",
            "pattern": r'\b(sk_(?:live|test|mock)_[0-9a-zA-Z]{12,})\b'
        },
        {
            "id": "gitleaks.rule.private-key",
            "name": "Private RSA/SSH Key Block",
            "severity": "CRITICAL",
            "scanner": "gitleaks",
            "message": "Unencrypted private cryptographic key block exposed.",
            "pattern": r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'
        }
    ]

    # Vulnerable Dependency Database (OSV-Scanner equivalent)
    VULNERABLE_PACKAGES = {
        "python": {
            "requests": [
                {"max_version": "2.20.0", "cve": "CVE-2018-18074", "severity": "HIGH", "message": "Redirect vulnerability exposes Authorization headers to third-party domains."}
            ],
            "urllib3": [
                {"max_version": "1.26.5", "cve": "CVE-2021-33503", "severity": "HIGH", "message": "Catastrophic ReDoS in URL parser during authority resolution."},
                {"max_version": "1.24.2", "cve": "CVE-2019-11324", "severity": "CRITICAL", "message": "CRL checking failure permits MITM attack."}
            ],
            "flask": [
                {"max_version": "0.12.3", "cve": "CVE-2018-1000656", "severity": "HIGH", "message": "Denial of Service vulnerability in JSON decoding."}
            ],
            "django": [
                {"max_version": "2.2.28", "cve": "CVE-2022-28346", "severity": "CRITICAL", "message": "SQL injection in QuerySet.aggregate() and annotate()."}
            ],
            "pyyaml": [
                {"max_version": "5.3.1", "cve": "CVE-2020-14343", "severity": "CRITICAL", "message": "Arbitrary code execution via full_load or unsafe Loader."}
            ]
        },
        "npm": {
            "lodash": [
                {"max_version": "4.17.20", "cve": "CVE-2021-23337", "severity": "HIGH", "message": "Prototype pollution via template function."}
            ],
            "axios": [
                {"max_version": "0.21.1", "cve": "CVE-2020-28168", "severity": "MEDIUM", "message": "SSRF vulnerability allows bypass of proxy configurations."}
            ],
            "express": [
                {"max_version": "4.16.0", "cve": "CVE-2022-24999", "severity": "MEDIUM", "message": "qs prototype pollution leading to denial of service."}
            ]
        }
    }
