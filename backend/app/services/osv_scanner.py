import os
import re
import shutil
import subprocess
import json
from pathlib import Path
from typing import List, Dict, Any
from app.services.pattern_engine import PatternEngine

class OSVScanner:
    """Dependency vulnerability scanner (OSV-Scanner equivalent)."""

    def __init__(self):
        self.cli_available = shutil.which("osv-scanner") is not None

    def scan_directory(self, target_dir: Path) -> List[Dict[str, Any]]:
        findings = []
        if self.cli_available:
            try:
                findings = self._run_cli_scan(target_dir)
            except Exception:
                findings = self._run_manifest_scan(target_dir)
        else:
            findings = self._run_manifest_scan(target_dir)

        return findings

    def _run_cli_scan(self, target_dir: Path) -> List[Dict[str, Any]]:
        findings = []
        cmd = ["osv-scanner", "--format", "json", "-r", str(target_dir)]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if res.stdout:
            try:
                data = json.loads(res.stdout)
                for item in data.get("results", []):
                    pkg_source = item.get("source", {}).get("path", "")
                    rel_path = os.path.relpath(pkg_source, target_dir) if pkg_source else "manifest"
                    for pkg in item.get("packages", []):
                        for vuln in pkg.get("vulnerabilities", []):
                            cve_id = vuln.get("id", "OSV-VULN")
                            summary = vuln.get("summary", "Known vulnerable dependency")
                            findings.append({
                                "rule_id": f"osv.{cve_id}",
                                "scanner_name": "osv-scanner",
                                "severity": "HIGH",
                                "file_path": rel_path,
                                "line_number": 1,
                                "message": f"{pkg.get('package', {}).get('name', 'pkg')} - {summary}",
                                "code_snippet": f"{pkg.get('package', {}).get('name')}=={pkg.get('package', {}).get('version')}"
                            })
            except Exception:
                pass
        return findings

    def _run_manifest_scan(self, target_dir: Path) -> List[Dict[str, Any]]:
        findings = []

        # 1. Scan requirements.txt
        req_files = list(target_dir.rglob("requirements*.txt"))
        for req_file in req_files:
            rel_path = str(req_file.relative_to(target_dir))
            try:
                lines = req_file.read_text(encoding="utf-8", errors="ignore").splitlines()
                for line_idx, line in enumerate(lines, 1):
                    clean_line = line.strip()
                    if not clean_line or clean_line.startswith("#"):
                        continue

                    # Parse pkg==version or pkg>=version
                    match = re.match(r'^([a-zA-Z0-9_\-\.]+)\s*(?:==|<=|>=|<|>)\s*([0-9a-zA-Z\.\-]+)', clean_line)
                    if match:
                        pkg_name = match.group(1).lower()
                        pkg_version = match.group(2)

                        known_vulns = PatternEngine.VULNERABLE_PACKAGES.get("python", {}).get(pkg_name, [])
                        for vuln in known_vulns:
                            if self._is_version_vulnerable(pkg_version, vuln["max_version"]):
                                findings.append({
                                    "rule_id": f"osv.{vuln['cve']}",
                                    "scanner_name": "osv-scanner",
                                    "severity": vuln["severity"],
                                    "file_path": rel_path,
                                    "line_number": line_idx,
                                    "message": f"Dependency {pkg_name}@{pkg_version} has known vulnerability {vuln['cve']}: {vuln['message']}",
                                    "code_snippet": clean_line
                                })
            except Exception:
                continue

        # 2. Scan package.json
        pkg_files = list(target_dir.rglob("package.json"))
        for pkg_file in pkg_files:
            rel_path = str(pkg_file.relative_to(target_dir))
            try:
                data = json.loads(pkg_file.read_text(encoding="utf-8", errors="ignore"))
                all_deps = {}
                all_deps.update(data.get("dependencies", {}))
                all_deps.update(data.get("devDependencies", {}))

                for pkg_name, ver_str in all_deps.items():
                    clean_ver = re.sub(r'[\^~>=<]', '', ver_str)
                    known_vulns = PatternEngine.VULNERABLE_PACKAGES.get("npm", {}).get(pkg_name.lower(), [])
                    for vuln in known_vulns:
                        if self._is_version_vulnerable(clean_ver, vuln["max_version"]):
                            findings.append({
                                "rule_id": f"osv.{vuln['cve']}",
                                "scanner_name": "osv-scanner",
                                "severity": vuln["severity"],
                                "file_path": rel_path,
                                "line_number": 1,
                                "message": f"npm package {pkg_name}@{clean_ver} affected by {vuln['cve']}: {vuln['message']}",
                                "code_snippet": f'"{pkg_name}": "{ver_str}"'
                            })
            except Exception:
                continue

        return findings

    @staticmethod
    def _is_version_vulnerable(ver: str, max_ver: str) -> bool:
        """Simple version comparison tuple check."""
        try:
            v1_parts = [int(p) for p in re.findall(r'\d+', ver)]
            v2_parts = [int(p) for p in re.findall(r'\d+', max_ver)]
            return v1_parts <= v2_parts
        except Exception:
            return True
