"""
Jobscan-style keyword extraction, matching, and scoring engine.

Replicates Jobscan's methodology:
1. Extract keywords from JD, categorize them
2. Weight by category importance x frequency
3. Match resume keywords against JD keywords (exact, stem, variant)
4. Calculate weighted match percentage with detailed breakdown
"""

import re
from collections import defaultdict

from .skills_db import (
    HARD_SKILLS, SOFT_SKILLS, EDUCATION_KEYWORDS, CERTIFICATIONS,
    JOB_TITLE_KEYWORDS, INDUSTRY_TERMS, SKILL_VARIANTS, ACTION_VERBS,
)

# ---------------------------------------------------------------------------
# Simple Porter-style stemmer (avoids nltk dependency for core matching)
# ---------------------------------------------------------------------------
_SUFFIX_RULES = [
    ("ational", "ate"), ("tional", "tion"), ("enci", "ence"),
    ("anci", "ance"), ("izer", "ize"), ("isation", "ize"),
    ("ization", "ize"), ("ation", "ate"), ("ator", "ate"),
    ("alism", "al"), ("iveness", "ive"), ("fulness", "ful"),
    ("ousness", "ous"), ("aliti", "al"), ("iviti", "ive"),
    ("biliti", "ble"), ("ling", "l"), ("ing", ""), ("ment", ""),
    ("ness", ""), ("ity", ""), ("ies", "y"), ("ive", ""),
    ("ful", ""), ("ous", ""), ("ment", ""), ("ally", "al"),
    ("ly", ""), ("er", ""), ("ed", ""), ("es", ""), ("s", ""),
]


def _simple_stem(word):
    """Lightweight stemmer for matching variants."""
    w = word.lower().strip()
    if len(w) <= 4:
        return w
    for suffix, replacement in _SUFFIX_RULES:
        if w.endswith(suffix) and len(w) - len(suffix) >= 3:
            return w[: -len(suffix)] + replacement
    return w


# ---------------------------------------------------------------------------
# Analyzer
# ---------------------------------------------------------------------------
class JobscanAnalyzer:
    """
    Replicates Jobscan's keyword identification and scoring system.

    Category weights mirror Jobscan's observed behaviour:
      - hard_skills  (tools, tech, languages)   — heaviest
      - job_titles   (role name matches)         — very high
      - education    (degree, field)             — high
      - certifications                            — high
      - soft_skills  (leadership, communication) — moderate
      - industry_terms (domain language)         — moderate
      - action_verbs (verbs in responsibilities) — light
    """

    CATEGORY_WEIGHTS = {
        "hard_skills": 3.0,
        "job_titles": 2.5,
        "education": 2.0,
        "certifications": 2.0,
        "soft_skills": 1.5,
        "industry_terms": 1.5,
        "action_verbs": 0.5,
    }

    # Maximum frequency multiplier (caps repeated keywords)
    MAX_FREQ_MULT = 3

    def __init__(self):
        # Build lowercase lookup sets for fast matching
        self._hard_skills_lower = {s.lower(): s for s in HARD_SKILLS}
        self._soft_skills_lower = {s.lower(): s for s in SOFT_SKILLS}
        self._education_lower = {s.lower(): s for s in EDUCATION_KEYWORDS}
        self._certs_lower = {s.lower(): s for s in CERTIFICATIONS}
        self._titles_lower = {s.lower(): s for s in JOB_TITLE_KEYWORDS}
        self._industry_lower = {s.lower(): s for s in INDUSTRY_TERMS}

        # Build reverse variant map: variant_lower -> canonical
        self._variant_to_canonical = {}
        for canonical, variants in SKILL_VARIANTS.items():
            for v in variants:
                self._variant_to_canonical[v.lower()] = canonical

    # ------------------------------------------------------------------
    # Keyword extraction
    # ------------------------------------------------------------------
    def extract_keywords(self, jd_text):
        """
        Extract and categorize keywords from a job description.

        Returns dict: keyword -> {category, frequency, importance, matched, match_quality}
        """
        jd_lower = jd_text.lower()
        keywords = {}

        # 1. Hard skills — highest priority, search longest phrases first
        self._extract_category(
            jd_lower, self._hard_skills_lower, "hard_skills", keywords
        )

        # 2. Soft skills
        self._extract_category(
            jd_lower, self._soft_skills_lower, "soft_skills", keywords
        )

        # 3. Education keywords
        self._extract_category(
            jd_lower, self._education_lower, "education", keywords
        )

        # 4. Certifications
        self._extract_category(
            jd_lower, self._certs_lower, "certifications", keywords
        )

        # 5. Job title keywords
        self._extract_category(
            jd_lower, self._titles_lower, "job_titles", keywords
        )

        # 6. Industry terms
        self._extract_category(
            jd_lower, self._industry_lower, "industry_terms", keywords
        )

        # 7. Action verbs (only from responsibilities / bullet sections)
        self._extract_action_verbs(jd_lower, keywords)

        return keywords

    def _extract_category(self, jd_lower, lookup, category, keywords):
        """Extract keywords of a given category from JD text."""
        # Sort by length descending so longer phrases match first
        sorted_skills = sorted(lookup.keys(), key=len, reverse=True)
        for skill_lower in sorted_skills:
            canonical = lookup[skill_lower]
            if canonical in keywords:
                continue  # already captured
            # Word-boundary match
            pattern = self._build_pattern(skill_lower)
            matches = re.findall(pattern, jd_lower)
            if matches:
                freq = len(matches)
                weight = self.CATEGORY_WEIGHTS[category]
                freq_mult = min(freq, self.MAX_FREQ_MULT)
                keywords[canonical] = {
                    "category": category,
                    "frequency": freq,
                    "importance": weight * (1 + 0.3 * (freq_mult - 1)),
                    "matched": False,
                    "match_quality": 0.0,
                }

    def _extract_action_verbs(self, jd_lower, keywords):
        """Extract action verbs from JD."""
        for verb in ACTION_VERBS:
            if verb in keywords:
                continue
            pattern = r"\b" + re.escape(verb) + r"[sed]*\b"
            matches = re.findall(pattern, jd_lower)
            if matches:
                freq = len(matches)
                weight = self.CATEGORY_WEIGHTS["action_verbs"]
                keywords[verb] = {
                    "category": "action_verbs",
                    "frequency": freq,
                    "importance": weight * min(freq, self.MAX_FREQ_MULT),
                    "matched": False,
                    "match_quality": 0.0,
                }

    @staticmethod
    def _build_pattern(phrase):
        """Build a regex pattern with word boundaries for a phrase."""
        escaped = re.escape(phrase)
        # Handle slashes in things like "AWS/GCP" or "CI/CD"
        escaped = escaped.replace(r"\/", r"[/]")
        return r"(?<![a-z])" + escaped + r"(?![a-z])"

    # ------------------------------------------------------------------
    # Keyword matching
    # ------------------------------------------------------------------
    def match_resume(self, resume_text, jd_keywords):
        """
        Match resume text against extracted JD keywords.
        Updates the 'matched' and 'match_quality' fields in-place.
        Returns the updated keywords dict.
        """
        resume_lower = resume_text.lower()
        # Pre-split resume into tokens for stem matching
        resume_tokens = set(re.findall(r"[a-z][a-z0-9+#/.]+", resume_lower))
        resume_stems = {_simple_stem(t) for t in resume_tokens}

        for keyword, info in jd_keywords.items():
            kw_lower = keyword.lower()

            # --- Exact match ---
            pattern = self._build_pattern(kw_lower)
            exact_matches = re.findall(pattern, resume_lower)
            if exact_matches:
                resume_freq = len(exact_matches)
                jd_freq = info["frequency"]
                # Frequency ratio: having it once is good, matching JD freq is ideal
                freq_ratio = min(resume_freq / max(jd_freq, 1), 1.0)
                info["matched"] = True
                info["match_quality"] = 0.75 + 0.25 * freq_ratio
                continue

            # --- Variant / Synonym match ---
            matched_via_variant = False
            variants = SKILL_VARIANTS.get(keyword, set())
            for variant in variants:
                v_pattern = self._build_pattern(variant.lower())
                if re.search(v_pattern, resume_lower):
                    info["matched"] = True
                    info["match_quality"] = 0.80
                    matched_via_variant = True
                    break
            if matched_via_variant:
                continue

            # Check reverse: if keyword is a known variant of something in resume
            canonical = self._variant_to_canonical.get(kw_lower)
            if canonical:
                c_pattern = self._build_pattern(canonical.lower())
                if re.search(c_pattern, resume_lower):
                    info["matched"] = True
                    info["match_quality"] = 0.80
                    continue

            # --- Stem match (for single-word keywords) ---
            if " " not in kw_lower:
                kw_stem = _simple_stem(kw_lower)
                if kw_stem in resume_stems and len(kw_stem) >= 4:
                    info["matched"] = True
                    info["match_quality"] = 0.65
                    continue

            # --- Multi-word partial match ---
            if " " in kw_lower:
                words = kw_lower.split()
                matched_words = sum(
                    1 for w in words
                    if re.search(r"\b" + re.escape(w) + r"\b", resume_lower)
                )
                if matched_words >= len(words) * 0.6 and matched_words >= 2:
                    info["matched"] = True
                    info["match_quality"] = 0.50 + 0.20 * (matched_words / len(words))
                    continue

        return jd_keywords

    # ------------------------------------------------------------------
    # Scoring
    # ------------------------------------------------------------------
    def calculate_score(self, jd_keywords):
        """Calculate overall Jobscan-style match score (0-100)."""
        total = sum(k["importance"] for k in jd_keywords.values())
        if total == 0:
            return 0.0
        matched = sum(
            k["importance"] * k["match_quality"]
            for k in jd_keywords.values()
            if k["matched"]
        )
        return round((matched / total) * 100, 1)

    def get_category_scores(self, jd_keywords):
        """Get per-category score breakdown."""
        cats = defaultdict(lambda: {"total": 0.0, "matched": 0.0, "count": 0, "matched_count": 0})
        for kw, info in jd_keywords.items():
            cat = info["category"]
            cats[cat]["total"] += info["importance"]
            cats[cat]["count"] += 1
            if info["matched"]:
                cats[cat]["matched"] += info["importance"] * info["match_quality"]
                cats[cat]["matched_count"] += 1

        result = {}
        for cat, data in cats.items():
            score = round((data["matched"] / data["total"]) * 100, 1) if data["total"] > 0 else 0.0
            result[cat] = {
                "score": score,
                "matched": data["matched_count"],
                "total": data["count"],
            }
        return result

    def get_report(self, jd_keywords):
        """Generate a complete Jobscan-style analysis report."""
        overall = self.calculate_score(jd_keywords)
        by_category = self.get_category_scores(jd_keywords)

        matched_kws = []
        missing_kws = []
        for kw, info in sorted(jd_keywords.items(), key=lambda x: x[1]["importance"], reverse=True):
            entry = {
                "keyword": kw,
                "category": info["category"],
                "importance": info["importance"],
                "frequency": info["frequency"],
            }
            if info["matched"]:
                entry["match_quality"] = info["match_quality"]
                matched_kws.append(entry)
            else:
                missing_kws.append(entry)

        return {
            "overall_score": overall,
            "by_category": by_category,
            "matched_keywords": matched_kws,
            "missing_keywords": missing_kws,
            "total_keywords": len(jd_keywords),
            "total_matched": len(matched_kws),
        }


def analyze_match(resume_text, jd_text):
    """
    Convenience function: run full analysis pipeline.

    Returns (analyzer, jd_keywords, report).
    """
    analyzer = JobscanAnalyzer()
    jd_keywords = analyzer.extract_keywords(jd_text)
    analyzer.match_resume(resume_text, jd_keywords)
    report = analyzer.get_report(jd_keywords)
    return analyzer, jd_keywords, report
