import os
import json
import uuid
import httpx
from typing import Dict, Any, Optional
from app.config import settings
from app.services.redaction_service import RedactionService

class IBMAgentService:
    """
    SecureShip Security Review Agent.
    Interacts with IBM watsonx Orchestrate / Granite LLM if credentials are present,
    or uses an evidence-grounded deterministic AI review adapter as an offline fallback.
    """

    SYSTEM_INSTRUCTION = (
        "Review security findings produced by trusted scanners. Explain each finding "
        "using supplied evidence, rank remediation priority and recommend a safer code "
        "pattern. Never invent scan results, expose secrets or claim a fix is verified "
        "without a rescan."
    )

    def __init__(self):
        self.api_key = settings.WATSONX_API_KEY
        self.project_id = settings.WATSONX_PROJECT_ID
        self.url = settings.WATSONX_URL
        self.model_id = settings.GRANITE_MODEL_ID
        self.is_live_ibm_configured = bool(self.api_key and self.project_id)

    async def review_finding(self, finding_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sends structured evidence to the IBM agent and returns structured analysis.
        """
        # Ensure evidence is strictly sanitized before AI processing
        sanitized_snippet = RedactionService.redact_text(finding_data.get("code_snippet", ""))
        sanitized_evidence = RedactionService.redact_text(finding_data.get("masked_evidence", ""))

        payload = {
            "finding_id": finding_data["id"],
            "rule_id": finding_data.get("rule_id", "UNKNOWN"),
            "scanner_name": finding_data.get("scanner_name", "scanner"),
            "severity": finding_data.get("severity", "MEDIUM"),
            "file_path": finding_data.get("file_path", "unknown"),
            "line_number": finding_data.get("line_number", 1),
            "scanner_message": finding_data.get("message", ""),
            "sanitized_snippet": sanitized_snippet,
            "sanitized_evidence": sanitized_evidence
        }

        if self.is_live_ibm_configured:
            try:
                return await self._call_watsonx_granite(payload)
            except Exception as e:
                print(f"[IBMAgentService] Live watsonx call failed ({e}), falling back to local grounded agent.")
                return self._generate_grounded_fallback(payload, provider="ibm_watsonx_fallback")
        else:
            return self._generate_grounded_fallback(payload, provider="ibm_granite_local_adapter")

    async def _call_watsonx_granite(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Calls IBM watsonx.ai REST API with Granite model."""
        # 1. Fetch IAM token
        async with httpx.AsyncClient(timeout=15.0) as client:
            iam_resp = await client.post(
                "https://iam.cloud.ibm.com/identity/token",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                    "apikey": self.api_key
                }
            )
            iam_token = iam_resp.json().get("access_token")

            prompt = (
                f"{self.SYSTEM_INSTRUCTION}\n\n"
                f"Finding Evidence:\n"
                f"- Rule ID: {payload['rule_id']}\n"
                f"- Scanner: {payload['scanner_name']}\n"
                f"- Severity: {payload['severity']}\n"
                f"- Location: {payload['file_path']}:{payload['line_number']}\n"
                f"- Message: {payload['scanner_message']}\n"
                f"- Code: {payload['sanitized_snippet']}\n\n"
                f"Respond ONLY with valid JSON having keys: "
                f"plain_language_explanation, potential_impact, priority_reason, "
                f"recommended_fix, verification_steps, limitations."
            )

            gen_url = f"{self.url.rstrip('/')}/ml/v1/text/generation?version=2023-05-29"
            gen_resp = await client.post(
                gen_url,
                headers={
                    "Authorization": f"Bearer {iam_token}",
                    "Content-Type": "application/json"
                },
                json={
                    "model_id": self.model_id,
                    "input": prompt,
                    "parameters": {
                        "decoding_method": "greedy",
                        "max_new_tokens": 800,
                        "min_new_tokens": 50
                    },
                    "project_id": self.project_id
                }
            )

            result_text = gen_resp.json()["results"][0]["generated_text"]
            # Clean JSON markdown if wrapped in ```json ... ```
            cleaned = result_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]

            parsed = json.loads(cleaned.strip())
            parsed["finding_id"] = payload["finding_id"]
            parsed["id"] = str(uuid.uuid4())
            parsed["agent_name"] = "ARGUS Security Review Agent"
            parsed["model_provider"] = f"ibm_granite ({self.model_id})"
            return parsed

    def _generate_grounded_fallback(self, payload: Dict[str, Any], provider: str) -> Dict[str, Any]:
        """
        Generates deterministic, evidence-grounded review strictly adhering
        to the hackathon agent instructions.
        """
        rule = payload["rule_id"].lower()
        scanner = payload["scanner_name"]
        snippet = payload["sanitized_snippet"]
        file_path = payload["file_path"]

        # Default fallback structure
        explanation = f"The scanner '{scanner}' detected a {payload['severity']} severity condition in {file_path} at line {payload['line_number']}."
        impact = "Untrusted input handling or credential leakage can compromise the application confidentiality and integrity."
        priority = f"Ranked {payload['severity']} based on scanner evidence and exploitability risk."
        recommended_fix = "# Apply secure coding pattern:\n# Use environment variables and parameterized interfaces."
        verification = "1. Rescan the codebase to confirm zero scanner alerts.\n2. Execute automated integration tests."
        limitations = "Review is scoped strictly to scanner evidence provided. Cannot verify runtime business logic without execution."

        if "sql" in rule:
            explanation = (
                f"The static scanner detected dynamic SQL query construction at line {payload['line_number']} of {file_path}. "
                "String interpolation or direct string concatenation of user-provided values allows attackers to manipulate SQL syntax."
            )
            impact = (
                "Attackers can bypass authentication, exfiltrate the entire database table, "
                "or modify/drop tables via SQL Injection (CWE-89)."
            )
            priority = (
                "CRITICAL. Injection flaws in database execution pathways allow immediate, "
                "unauthorized database access."
            )
            recommended_fix = (
                "# Replace concatenated queries with parameterized queries or ORM:\n"
                "# INSTEAD OF:\n"
                "# cursor.execute(f'SELECT * FROM users WHERE id = {user_id}')\n\n"
                "# USE PARAMETER BINDING:\n"
                "cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))\n"
                "# OR SQLALCHEMY:\n"
                "# stmt = select(User).where(User.id == user_id)"
            )
            verification = (
                "1. Apply parameter binding to the database query.\n"
                "2. Trigger a fresh ARGUS rescan to verify Semgrep rule resolution.\n"
                "3. Run automated tests with payload `1' OR '1'='1` to confirm query safety."
            )
            limitations = "Does not evaluate stored procedures or dynamic SQL constructed inside database triggers."

        elif "command" in rule or "system" in rule or "exec" in rule:
            explanation = (
                f"The static scanner flagged a shell execution call ({snippet}) in {file_path}. "
                "Passing untrusted inputs directly to system shells allows command execution chaining."
            )
            impact = (
                "Arbitrary command execution (RCE) allows attackers to compromise the host server, "
                "read local files, or deploy malicious binaries."
            )
            priority = "CRITICAL. Remote code execution represents the highest risk level."
            recommended_fix = (
                "# Avoid invoking the system shell (shell=True or os.system).\n"
                "# Use subprocess.run with an explicit argument list:\n"
                "import subprocess\n"
                "# INSTEAD OF: os.system('ping ' + host)\n"
                "subprocess.run(['ping', '-c', '1', host], check=True, shell=False)"
            )
            verification = (
                "1. Replace shell invocation with safe subprocess argument array.\n"
                "2. Rescan the project copy to confirm elimination of command-injection rule.\n"
                "3. Verify non-alphanumeric characters like `;` or `&&` are not interpreted by shell."
            )
            limitations = "Assumes the executed binary itself does not have command execution bypasses."

        elif "gitleaks" in rule or "secret" in rule or "key" in rule or "password" in rule:
            explanation = (
                f"The secret scanner detected an exposed credential or secret token in {file_path}. "
                "Hardcoding credentials directly into source files exposes secrets to version control and build artifacts."
            )
            impact = (
                "Leaked API keys or JWT signing secrets permit unauthorized API impersonation, "
                "session forgery, or Cloud infrastructure compromise."
            )
            priority = "HIGH. Secrets must be revoked immediately upon discovery."
            recommended_fix = (
                "# Move secrets into environment variables or Secret Manager:\n"
                "import os\n\n"
                "# INSTEAD OF: API_KEY = 'hardcoded_value'\n"
                "API_KEY = os.getenv('API_KEY')\n"
                "if not API_KEY:\n"
                "    raise RuntimeError('Missing required API_KEY environment variable.')"
            )
            verification = (
                "1. Move the secret to an untracked `.env` file and add `.env` to `.gitignore`.\n"
                "2. Invalidate/rotate the exposed token in your provider console.\n"
                "3. Rescan to confirm Gitleaks scanner reports zero secret findings."
            )
            limitations = "A scanner can verify that a secret is no longer in code, but cannot revoke an already-compromised key."

        elif "admin" in rule or "access" in rule or "missing-access" in rule:
            explanation = (
                f"The static scanner flagged an administrative or sensitive endpoint ({file_path}) "
                "lacking role verification or authentication dependencies."
            )
            impact = (
                "Broken Object Level Authorization (BOLA / IDOR) or unauthenticated admin access allows "
                "any network caller to invoke sensitive maintenance actions."
            )
            priority = "HIGH. Critical endpoints must enforce strict RBAC before execution."
            recommended_fix = (
                "# Add authentication and role dependencies to route:\n"
                "from fastapi import Depends, HTTPException, status\n"
                "from app.auth import get_current_admin_user\n\n"
                "@router.post('/admin/reset', dependencies=[Depends(get_current_admin_user)])\n"
                "async def reset_system():\n"
                "    return {'status': 'system reset complete'}"
            )
            verification = (
                "1. Attach the authentication dependency to the router decorator.\n"
                "2. Rescan with ARGUS to verify rule satisfaction.\n"
                "3. Perform an unauthenticated HTTP request to verify a 401/403 HTTP response."
            )
            limitations = "Static scanners detect missing auth guards, but cannot verify if backend user claims are properly signed."

        elif "osv" in rule or "cve" in rule:
            explanation = (
                f"The dependency scanner flagged an outdated package version in {file_path}. "
                f"Evidence: {payload['scanner_message']}."
            )
            impact = (
                "Known public CVEs in third-party libraries have published exploit vectors "
                "that can be leveraged by automated scanners against your application."
            )
            priority = "HIGH. Pinned dependency vulnerabilities should be patched promptly."
            recommended_fix = (
                "# Update your dependency manifest to a safe, patched version:\n"
                "# Update requirements.txt or package.json with latest secure releases:\n"
                "# E.g., requests>=2.31.0, urllib3>=2.0.0, lodash>=4.17.21"
            )
            verification = (
                "1. Upgrade the package version in the dependency file.\n"
                "2. Run package manager install/lock.\n"
                "3. Rescan with ARGUS to verify OSV-Scanner clears the CVE alert."
            )
            limitations = "Ensures dependency manifest is updated, but does not test for breaking API changes across major package versions."

        return {
            "id": str(uuid.uuid4()),
            "finding_id": payload["finding_id"],
            "agent_name": "ARGUS Security Review Agent",
            "plain_language_explanation": explanation,
            "potential_impact": impact,
            "priority_reason": priority,
            "recommended_fix": recommended_fix,
            "verification_steps": verification,
            "limitations": limitations,
            "model_provider": provider
        }
