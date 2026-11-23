import os
import re
import shutil
import subprocess
import json
from pathlib import Path
from typing import List, Dict, Any
from app.services.pattern_engine import PatternEngine

class SemgrepScanner:
    """Static application security testing (SAST) scanner."""

    def __init__(self):
        self.cli_available = shutil.which("semgrep") is not None

    def scan_directory(self, target_dir: Path) -> List[Dict[str, Any]]:
        findings = []
        if self.cli_available:
            try:
                findings = self._run_cli_scan(target_dir)
            except Exception as e:
                # Fallback to embedded pattern engine
                findings = self._run_pattern_scan(target_dir)
        else:
            findings = self._run_pattern_scan(target_dir)

        return findings

    def _run_cli_scan(self, target_dir: Path) -> List[Dict[str, Any]]:
        findings = []
        cmd = ["semgrep", "scan", "--json", "--config", "auto", str(target_dir)]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if res.returncode in (0, 1) and res.stdout:
            data = json.loads(res.stdout)
            for item in data.get("results", []):
                rel_path = os.path.relpath(item["path"], target_dir)
                findings.append({
                    "rule_id": item["check_id"],
                    "scanner_name": "semgrep",
                    "severity": self._normalize_severity(item.get("extra", {}).get("severity", "MEDIUM")),
                    "file_path": rel_path,
                    "line_number": item["start"]["line"],
                    "message": item.get("extra", {}).get("message", "Semgrep security finding"),
                    "code_snippet": item.get("extra", {}).get("lines", "")
                })
        return findings

    def _run_pattern_scan(self, target_dir: Path) -> List[Dict[str, Any]]:
        findings = []
        for file_path in target_dir.rglob("*"):
            if not file_path.is_file() or file_path.suffix not in {".py", ".js", ".ts", ".jsx", ".tsx"}:
                continue
            
            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()
                rel_path = str(file_path.relative_to(target_dir))

                for rule in PatternEngine.SEMGREP_RULES:
                    for pattern_str in rule["patterns"]:
                        pattern = re.compile(pattern_str, re.MULTILINE)
                        for idx, line in enumerate(lines, 1):
                            if pattern.search(line):
                                snippet = line.strip()
                                findings.append({
                                    "rule_id": rule["id"],
                                    "scanner_name": "semgrep",
                                    "severity": rule["severity"],
                                    "file_path": rel_path,
                                    "line_number": idx,
                                    "message": f"{rule['name']}: {rule['message']}",
                                    "code_snippet": snippet
                                })
                                break # Avoid duplicate triggers of the same rule on the same line
            except Exception:
                continue

        return findings

    @staticmethod
    def _normalize_severity(sev: str) -> str:
        s = sev.upper()
        if s in ("ERROR", "CRITICAL"):
            return "CRITICAL"
        elif s in ("WARNING", "HIGH"):
            return "HIGH"
        elif s in ("INFO", "LOW"):
            return "LOW"
        return "MEDIUM"
