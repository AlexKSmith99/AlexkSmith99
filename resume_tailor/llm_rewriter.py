"""
LLM-based resume rewriter using Claude API.

Uses Anthropic's Claude to naturally rewrite resume bullets and summaries
to include target keywords while preserving all factual details.

Uses prompt caching on the system prompt for cost efficiency.
"""

import os
from typing import Optional

try:
    from anthropic import Anthropic
    _ANTHROPIC_AVAILABLE = True
except ImportError:
    _ANTHROPIC_AVAILABLE = False


# Claude Sonnet 4.6 — best balance of quality, speed, and cost for this use case
_MODEL = "claude-sonnet-4-5"

# System prompt for the rewriter — cached for cost efficiency
_REWRITE_SYSTEM_PROMPT = """You are an expert resume writer specializing in ATS-optimized content.

Your job is to rewrite resume bullets and summaries to naturally incorporate target keywords from a job description, while preserving all factual content.

CRITICAL RULES:
1. PRESERVE all metrics, numbers, company names, and factual achievements exactly (e.g., "25 high-opportunity neighborhoods", "$200K budget", "20% conversion rate", "7 counties")
2. PRESERVE the core action and outcome of each bullet
3. ABSOLUTE BULLET LENGTH LIMIT: Each bullet MUST be UNDER 210 characters. Count the characters carefully. If the rewrite exceeds 210 characters, you MUST shorten it — cut filler words, use shorter synonyms, remove redundant phrases, or drop the lowest-priority keyword. If the ORIGINAL bullet already exceeds 210 characters, you must shorten it too while preserving the key achievement. NEVER exceed 210 characters per bullet. This is the most important formatting rule.
4. ROLE SUMMARY/DESCRIPTION LENGTH LIMIT: Role summaries and descriptions MUST be UNDER 330 characters (approximately 3 printed lines). Shorten if needed.
4. Only add keywords that fit naturally in context — skip any that would sound forced or fabricated
5. NEVER invent new accomplishments, tools, or metrics that aren't in the original
6. Use strong action verbs and professional, active-voice language
7. Maintain ATS-readability (no fancy formatting, just clean prose)
8. When a keyword is a tool/technology, integrate it where it makes contextual sense (e.g., alongside other tools used)
9. When a keyword is a soft skill or concept, weave it into the description of how the work was done
10. Output ONLY the rewritten text — no preamble, no explanations, no quotation marks, no bullet markers

DOMAIN/INDUSTRY RULES — VERY IMPORTANT:
11. NEVER claim the candidate has experience in a domain or industry they haven't actually worked in
12. The candidate's ACTUAL industry experience is ONLY: healthcare/health insurance (Healthfirst), consumer electronics/cameras (Canon USA), and electric scooters/manufacturing (Razor USA)
13. The candidate's ACTUAL functional domains are: data analytics, data science, sales analytics, marketing analytics, business intelligence, product analytics, customer analytics, B2C, DTC, retail, manufacturing, healthcare, insights, strategy
14. If a JD keyword is an industry the candidate has NOT worked in (e.g., fintech, SaaS, banking, B2B), do NOT write "experience in fintech" or "proven track record in fintech" — instead SKIP that keyword or use it only if it appears as a job requirement you're matching TO (not claiming you have)
15. You may reference that the candidate is seeking to apply their skills in a new industry, but NEVER claim existing experience in an industry they haven't worked in

You are writing for a data analyst with experience at Healthfirst (health insurance, healthcare), Canon USA (consumer electronics, cameras, B2C, DTC, retail), and Razor USA (electric scooters, manufacturing, B2C, DTC, e-commerce)."""


class LLMRewriter:
    """Wraps Anthropic's Claude for resume bullet rewriting."""

    def __init__(self, api_key: Optional[str] = None):
        if not _ANTHROPIC_AVAILABLE:
            raise ImportError(
                "anthropic package not installed. Run: pip install anthropic"
            )
        key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            raise ValueError(
                "Anthropic API key not provided. Pass api_key= or set "
                "ANTHROPIC_API_KEY environment variable."
            )
        self.client = Anthropic(api_key=key)

    def rewrite_bullets(self, job_context: dict, bullets_with_keywords: list) -> list:
        """
        Rewrite all bullets for a single job in one API call.

        Args:
            job_context: dict with 'company', 'title', 'summary' keys
            bullets_with_keywords: list of dicts with 'bullet' and 'keywords' keys

        Returns:
            list of rewritten bullet strings (same length as input, empty for skipped)
        """
        if not bullets_with_keywords:
            return []

        # Build the user message
        lines = [
            f"Company: {job_context['company']}",
            f"Role: {job_context['title']}",
            f"Role summary: {job_context['summary']}",
            "",
            "Rewrite each of the following bullets to naturally incorporate the listed keywords. "
            "ABSOLUTE RULE: Each bullet MUST be UNDER 210 characters. Count them carefully. No exceptions. "
            "If the original already exceeds 210 chars, you MUST shorten it while preserving the key metric/achievement. "
            "Return ONLY the rewritten bullets, one per line, numbered, in the same order. "
            "If no natural way to incorporate the keywords exists, return the original bullet unchanged.",
            "",
        ]
        for i, item in enumerate(bullets_with_keywords, 1):
            lines.append(f"BULLET {i}:")
            lines.append(f"Original: {item['bullet']}")
            kw_list = ", ".join(item['keywords']) if item['keywords'] else "(none — keep as-is)"
            lines.append(f"Keywords to incorporate: {kw_list}")
            lines.append("")

        lines.append("Output format: Return numbered rewrites on separate lines, e.g.:")
        lines.append("1. [rewritten bullet 1]")
        lines.append("2. [rewritten bullet 2]")

        user_message = "\n".join(lines)

        message = self.client.messages.create(
            model=_MODEL,
            max_tokens=2000,
            system=[
                {
                    "type": "text",
                    "text": _REWRITE_SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_message}],
        )

        response_text = message.content[0].text.strip()
        results = self._parse_numbered_response(response_text, len(bullets_with_keywords))

        # Hard enforcement: if any bullet exceeds 210 chars, ask Claude to shorten
        MAX_BULLET_CHARS = 210
        for i, (rewritten, original) in enumerate(zip(results, bullets_with_keywords)):
            if len(rewritten) > MAX_BULLET_CHARS:
                # Ask Claude specifically to shorten this one bullet
                try:
                    shortened = self._shorten_bullet(rewritten, MAX_BULLET_CHARS)
                    if len(shortened) <= MAX_BULLET_CHARS:
                        results[i] = shortened
                except Exception:
                    pass

        return results

    def _shorten_bullet(self, bullet, max_chars):
        """Ask Claude to shorten a single bullet to fit the character limit."""
        message = self.client.messages.create(
            model=_MODEL,
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": (
                    f"This resume bullet is {len(bullet)} characters. "
                    f"Shorten it to UNDER {max_chars} characters while preserving "
                    f"the key achievement and any metrics/numbers. Be concise. "
                    f"Return ONLY the shortened bullet, nothing else.\n\n"
                    f"Bullet: {bullet}"
                ),
            }],
        )
        return message.content[0].text.strip()

    def rewrite_summary(self, original_summary: str, keywords: list,
                         job_title: str) -> str:
        """Rewrite the professional summary to include target keywords."""
        if not keywords:
            return original_summary

        kw_list = ", ".join(keywords)
        user_message = (
            f"Target role title: {job_title}\n\n"
            f"Original professional summary:\n{original_summary}\n\n"
            f"Keywords to naturally incorporate: {kw_list}\n\n"
            f"Rewrite the summary to naturally include these keywords while keeping it "
            f"concise (similar length to original, max 3 sentences). Preserve the core "
            f"message and tone. Return only the rewritten summary with no preamble."
        )

        message = self.client.messages.create(
            model=_MODEL,
            max_tokens=500,
            system=[
                {
                    "type": "text",
                    "text": _REWRITE_SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_message}],
        )

        return message.content[0].text.strip()

    def rewrite_role_summary(self, original: str, keywords: list,
                              job_context: dict) -> str:
        """Rewrite a role summary paragraph to include target keywords."""
        if not keywords:
            return original

        kw_list = ", ".join(keywords)
        user_message = (
            f"Company: {job_context['company']}\n"
            f"Role: {job_context['title']}\n\n"
            f"Original role description:\n{original}\n\n"
            f"Keywords to naturally incorporate: {kw_list}\n\n"
            f"Rewrite the role description to naturally include these keywords. "
            f"MUST be UNDER 330 characters (3 printed lines max). Be concise. "
            f"Preserve factual content about what the role involved. "
            f"Return only the rewritten description with no preamble."
        )

        message = self.client.messages.create(
            model=_MODEL,
            max_tokens=500,
            system=[
                {
                    "type": "text",
                    "text": _REWRITE_SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_message}],
        )

        result = message.content[0].text.strip()
        MAX_SUMMARY_CHARS = 330
        if len(result) > MAX_SUMMARY_CHARS and len(original) <= MAX_SUMMARY_CHARS:
            return original
        return result

    @staticmethod
    def _parse_numbered_response(text: str, expected_count: int) -> list:
        """Parse a numbered response like '1. foo\\n2. bar' into a list."""
        import re
        # Match lines like "1. ..." or "1) ..."
        parts = re.split(r"^\s*\d+[.)]\s*", text, flags=re.MULTILINE)
        # First part is before "1." (empty), actual items start at index 1
        items = [p.strip() for p in parts[1:] if p.strip()]
        # Pad with empty strings if we got fewer than expected
        while len(items) < expected_count:
            items.append("")
        return items[:expected_count]
