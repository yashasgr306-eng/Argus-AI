import os
import re
import shutil
import subprocess
import json
from pathlib import Path
from typing import List, Dict, Any
from app.services.pattern_engine import PatternEngine
from app.services.redaction_service import RedactionService

class GitleaksScanner:
    """Secret and credential scanner."""

    def __init__(self):
        self.cli_available = shutil.which("gitleaks") is not None

    def scan_directory(self, target_dir: Path) -> List[Dict[str, Any]]:
        findings = []
        if self.cli_available:
            try:
                findings = self._run_cli_scan(target_dir)
            except Exception:
                findings = self._run_pattern_scan(target_dir)
        else:
            findings = self._run_pattern_scan(target_dir)

        return findings

    def _run_cli_scan(self, target_dir: Path) -> List[Dict[str, Any]]:
        findings = []
        report_file = target_dir / "gitleaks_report.json"
        cmd = ["gitleaks", "detect", "--no-git", "--source", str(target_dir), "--report-path", str(report_file), "--report-format", "json"]
        subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if report_file.exists():
            try:
                data = json.loads(report_file.read_text(encoding="utf-8"))
                for item in data:
                    rel_path = os.path.relpath(item["File"], target_dir)
                    raw_secret = item.get("Secret", "")
                    masked_secret = RedactionService.mask_secret_value(raw_secret)
                    findings.append({
                        "rule_id": f"gitleaks.{item.get('RuleID', 'secret')}",
                        "scanner_name": "gitleaks",
                        "severity": "HIGH",
                        "file_path": rel_path,
                        "line_number": item.get("StartLine", 1),
                        "message": f"Exposed credential detected: {item.get('Description', 'Sensitive secret')}",
                        "code_snippet": RedactionService.redact_text(item.get("Match", "")),
                        "masked_evidence": masked_secret
                    })
            finally:
                if report_file.exists():
                    report_file.unlink()

        return findings

    def _run_pattern_scan(self, target_dir: Path) -> List[Dict[str, Any]]:
        findings = []
        for file_path in target_dir.rglob("*"):
            if not file_path.is_file():
                continue
            # Skip binary and git metadata
            if file_path.suffix in {".png", ".jpg", ".zip", ".tar", ".gz", ".pyc"}:
                continue
            if ".git" in file_path.parts:
                continue

            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()
                rel_path = str(file_path.relative_to(target_dir))

                for rule in PatternEngine.GITLEAKS_RULES:
                    pattern = re.compile(rule["pattern"], re.MULTILINE)
                    for idx, line in enumerate(lines, 1):
                        match = pattern.search(line)
                        if match:
                            raw_val = match.group(0) if len(match.groups()) == 0 else match.group(1)
                            masked_val = RedactionService.mask_secret_value(raw_val)
                            sanitized_line = RedactionService.redact_text(line.strip())

                            findings.append({
                                "rule_id": rule["id"],
                                "scanner_name": "gitleaks",
                                "severity": rule["severity"],
                                "file_path": rel_path,
                                "line_number": idx,
                                "message": f"{rule['name']}: {rule['message']}",
                                "code_snippet": sanitized_line,
                                "masked_evidence": masked_val
                            })
                            break # Once per rule/line
            except Exception:
                continue

        return findings
