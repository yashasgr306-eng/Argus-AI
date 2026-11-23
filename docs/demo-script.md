# SecureShip AI — 3-Minute Hackathon Demo Script

Aligned with the **Zero-to-Hackathon Roadmap (Page 6)** for IBM Sponsored AI Research Track R1: *"Vibe-coded and vulnerable"*.

---

## Demo Timeline Overview

| Timestamp | Phase | Presenter Action | Script / Narration |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:30** | Problem Pitch | Present problem slide / open browser | *"AI coding tools help teams build at incredible speed, but 'vibe-coded' projects frequently introduce silent, high-impact security vulnerabilities—from SQL injection and shell execution to exposed secrets and unauthenticated admin routes. Scanners must remain the deterministic source of truth, but developers need an intelligent agent to understand and safely fix findings before production."* |
| **0:30 – 1:00** | Archive Upload | Click **Scan Vulnerable Sample** (or drag & drop ZIP) | *"SecureShip AI accepts code projects as ZIP archives with strict safety boundaries: path traversal attacks are rejected, decompression ratios prevent zip-bomb Denial of Service, and uploaded code is strictly analyzed statically—never executed."* |
| **1:00 – 1:40** | Multi-Scanner Findings | Navigate Findings Table, filter by Critical / High | *"Our deterministic multi-engine layer scans the code: Semgrep identifies raw SQL query concatenation and dangerous `os.system` shell injection; Gitleaks flags exposed AWS keys and hardcoded JWT secrets, automatically redacting and masking secret values across logs, database, and UI; and OSV-Scanner flags known CVEs in dependency manifests."* |
| **1:40 – 2:15** | IBM Agent Explanation | Click **Explain with AI** on SQL Injection finding | *"We invoke the SecureShip Security Review Agent, powered by IBM watsonx / Granite. Crucially, we send only sanitized evidence—never raw secrets or whole untrusted repos. The agent explains the vulnerability in plain terms, assesses real-world exploitability, ranks remediation priority, and provides a safer parameterized code pattern with a verification checklist."* |
| **2:15 – 2:45** | Rescan & Verification | Click **Apply Fix & Verify with Rescan** | *"In secure software engineering, a patch is never certified just because an AI suggested it. SecureShip enforces human review and a fresh rescan on a controlled copy. Notice the Before-and-After report: the SQL injection is verified eliminated, and our transparent prototype security score updates accordingly."* |
| **2:45 – 3:00** | Research Benchmark (Track R1) | Switch to **Research Benchmark** Tab | *"For Track R1, we empirically evaluated 40 seeded micro-benchmarks across hard-coded secrets, injection patterns, missing access checks, and clean controls. We achieved 85.7% precision, zero hallucinated scanner rules, 100% secret redaction compliance, and an actionability rating of 4.8 out of 5.0."* |

---

## Anticipated Judge Q&A Cheat Sheet

### Q1: "Why not let the LLM scan the code directly instead of using Semgrep or Gitleaks?"
> **Answer**: Language models frequently hallucinate non-existent vulnerabilities, miss subtle syntax variants, and have high inference costs per file. In SecureShip AI, **deterministic scanners remain the source of truth for detection**, while the IBM agent focuses on what LLMs do best: evidence synthesis, risk explanation, and guided remediation.

### Q2: "How do you protect developer credentials from leaking to external AI APIs?"
> **Answer**: We enforce our **Redaction Service** prior to payload creation. Any detected AWS keys, Stripe tokens, JWT keys, database passwords, or high-entropy secrets are masked with `***REDACTED***` in logs, databases, and AI payloads.

### Q3: "What happens if someone uploads a malicious zip file?"
> **Answer**: `ZipValidator` inspects all member entries before extraction. It explicitly blocks Zip Slip directory traversal (e.g. `../../etc/passwd`), enforces a 25MB archive ceiling, and checks uncompressed expansion ratios to block Zip Bomb attacks. Uploaded applications are never executed.
