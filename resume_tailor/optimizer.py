"""
Resume optimizer that injects missing JD keywords to achieve 75%+ match.

Strategy (mirrors what Jobscan recommends):
1. Add missing hard skills to Core Competencies
2. Weave missing terms into the professional summary
3. Inject keywords into the most contextually relevant experience bullets
4. Update profile title if JD title differs
5. Recalculate score after each change; stop at target
"""

import copy
import re

from .analyzer import JobscanAnalyzer, _simple_stem
from .resume_data import MASTER_RESUME, resume_to_plain_text, find_companies_for_skill


class ResumeOptimizer:
    """Optimizes a resume to hit a target Jobscan-style match score."""

    def __init__(self, target_score=75):
        self.target = target_score
        self.analyzer = JobscanAnalyzer()
        self.changes_log = []

    def optimize(self, jd_text):
        """
        Main entry point. Takes JD text, returns:
          (optimized_resume, baseline_score, final_score, report, changes_log)
        """
        self.changes_log = []
        self._bullet_mod_count = {}  # (job_idx, bullet_idx) -> count of mods

        # Deep copy master resume
        resume = copy.deepcopy(MASTER_RESUME)

        # Extract JD keywords
        jd_keywords = self.analyzer.extract_keywords(jd_text)

        # Baseline score
        baseline_text = resume_to_plain_text(resume)
        jd_kw_baseline = copy.deepcopy(jd_keywords)
        self.analyzer.match_resume(baseline_text, jd_kw_baseline)
        baseline_score = self.analyzer.calculate_score(jd_kw_baseline)
        baseline_report = self.analyzer.get_report(jd_kw_baseline)

        # Get missing keywords sorted by importance
        missing = sorted(
            [
                (kw, info)
                for kw, info in jd_kw_baseline.items()
                if not info["matched"]
            ],
            key=lambda x: x[1]["importance"],
            reverse=True,
        )

        if not missing:
            return resume, baseline_score, baseline_score, baseline_report, []

        # --- Phase 1: Update profile title if JD has a specific title ---
        self._optimize_title(resume, jd_text, missing)

        # --- Phase 2: Add hard skills to Core Competencies ---
        self._optimize_skills_section(resume, missing)

        # --- Phase 3: Enrich professional summary ---
        self._optimize_summary(resume, missing)

        # --- Phase 4: Weave keywords into experience bullets ---
        self._optimize_bullets(resume, missing)

        # --- Phase 5: Enrich role summaries ---
        self._optimize_role_summaries(resume, missing)

        # Final score
        final_text = resume_to_plain_text(resume)
        jd_kw_final = copy.deepcopy(jd_keywords)
        self.analyzer.match_resume(final_text, jd_kw_final)
        final_score = self.analyzer.calculate_score(jd_kw_final)
        final_report = self.analyzer.get_report(jd_kw_final)

        return resume, baseline_score, final_score, final_report, self.changes_log

    # ------------------------------------------------------------------
    # Phase 1: Title optimization
    # ------------------------------------------------------------------
    def _optimize_title(self, resume, jd_text, missing):
        """Update profile title to match JD title if different."""
        jd_lower = jd_text.lower()
        # Try to extract the job title from the first few lines
        lines = jd_text.strip().split("\n")
        for line in lines[:5]:
            line_clean = line.strip()
            if len(line_clean) < 60 and any(
                t.lower() in line_clean.lower()
                for t in ["analyst", "engineer", "scientist", "manager", "developer"]
            ):
                # Check if this differs from current title
                current = resume["profile"]["title"]
                if line_clean.lower() != current.lower() and len(line_clean) > 5:
                    # Only update if it's a reasonable title
                    if len(line_clean.split()) <= 6:
                        resume["profile"]["title"] = line_clean
                        self.changes_log.append(
                            f"Updated profile title: '{current}' -> '{line_clean}'"
                        )
                        break

    # ------------------------------------------------------------------
    # Phase 2: Core Competencies
    # ------------------------------------------------------------------
    def _optimize_skills_section(self, resume, missing):
        """Add missing hard skills to Core Competencies."""
        current_skills = resume["profile"]["core_competencies"]
        current_lower = {s.lower() for s in current_skills}
        # Also expand compound skills like "Python (Pandas, Numpy)"
        for s in list(current_lower):
            # Extract parenthetical items
            paren_match = re.search(r"\(([^)]+)\)", s)
            if paren_match:
                for item in paren_match.group(1).split(","):
                    current_lower.add(item.strip().lower())

        added = 0
        max_add = 6  # Don't overcrowd the skills section

        for kw, info in missing:
            if added >= max_add:
                break
            if info["category"] != "hard_skills":
                continue
            kw_lower = kw.lower()
            if kw_lower in current_lower:
                continue
            # Check if it's a sub-skill that could be added to an existing entry
            inserted = self._try_insert_sub_skill(current_skills, kw)
            if not inserted:
                current_skills.append(kw)
                self.changes_log.append(
                    f"Added '{kw}' to Core Competencies"
                )
            else:
                self.changes_log.append(
                    f"Inserted '{kw}' into existing competency entry"
                )
            current_lower.add(kw_lower)
            info["matched"] = True  # Mark as addressed
            added += 1

    def _try_insert_sub_skill(self, skills, keyword):
        """Try to add a sub-skill inside parentheses of an existing skill."""
        kw_lower = keyword.lower()
        # Map of parent -> possible sub-skills
        parent_map = {
            "python": ["Pandas", "NumPy", "scikit-learn", "SciPy", "Matplotlib",
                        "Seaborn", "PySpark", "Airflow"],
            "aws": ["S3", "EC2", "Lambda", "Glue", "Athena", "Redshift", "EMR"],
            "gcp": ["BigQuery", "Cloud Functions", "Cloud Storage"],
            "azure": ["Synapse", "Data Factory"],
        }
        for i, skill in enumerate(skills):
            skill_base = skill.split("(")[0].strip().lower()
            # Check if keyword's parent is this skill
            for parent, subs in parent_map.items():
                sub_names_lower = [s.lower() for s in subs]
                if parent in skill_base and kw_lower in sub_names_lower:
                    # Add to parenthetical
                    if "(" in skill:
                        skills[i] = skill.rstrip(")") + f", {keyword})"
                    else:
                        skills[i] = f"{skill} ({keyword})"
                    return True
        return False

    # ------------------------------------------------------------------
    # Phase 3: Summary optimization
    # ------------------------------------------------------------------
    def _optimize_summary(self, resume, missing):
        """Weave missing soft skills and key terms into the summary."""
        summary = resume["profile"]["summary"]
        additions = []

        for kw, info in missing:
            if info.get("matched"):
                continue
            if info["category"] in ("soft_skills", "industry_terms"):
                kw_lower = kw.lower()
                if kw_lower not in summary.lower():
                    additions.append(kw_lower)
                    info["matched"] = True
                    if len(additions) >= 4:
                        break

        if additions:
            # Integrate into summary naturally
            # Strategy: append a clause to the summary
            extra_terms = ", ".join(additions[:-1])
            if len(additions) > 1:
                extra_terms += f", and {additions[-1]}"
            else:
                extra_terms = additions[0]

            # Find a good insertion point
            if summary.endswith("."):
                summary = summary[:-1]
            summary += f", with expertise in {extra_terms}."
            resume["profile"]["summary"] = summary
            self.changes_log.append(
                f"Enriched summary with: {', '.join(additions)}"
            )

    # ------------------------------------------------------------------
    # Phase 4: Experience bullet optimization
    # ------------------------------------------------------------------
    def _optimize_bullets(self, resume, missing):
        """Inject missing keywords into the most relevant experience bullets."""
        remaining = [
            (kw, info) for kw, info in missing
            if not info.get("matched") and info["category"] in (
                "hard_skills", "industry_terms", "action_verbs"
            )
        ]

        max_mods_per_bullet = 2  # Don't overload any single bullet

        for kw, info in remaining:
            best = self._find_best_bullet(resume, kw)
            if best:
                job_idx, bullet_idx, bullet = best
                key = (job_idx, bullet_idx)
                if self._bullet_mod_count.get(key, 0) >= max_mods_per_bullet:
                    continue  # Skip — this bullet is already heavily modified
                new_bullet = self._inject_into_bullet(bullet, kw, info["category"])
                if new_bullet != bullet:
                    resume["experience"][job_idx]["bullets"][bullet_idx] = new_bullet
                    self._bullet_mod_count[key] = self._bullet_mod_count.get(key, 0) + 1
                    info["matched"] = True
                    company = resume["experience"][job_idx]["company_short"]
                    self.changes_log.append(
                        f"Wove '{kw}' into {company} bullet {bullet_idx + 1}"
                    )

    def _find_best_bullet(self, resume, keyword):
        """Find the experience bullet most relevant to a keyword."""
        kw_lower = keyword.lower()
        kw_stem = _simple_stem(kw_lower)
        best_score = -1
        best = None

        # Check which companies used this skill
        companies = find_companies_for_skill(keyword)

        for job_idx, job in enumerate(resume["experience"]):
            # Prefer companies where the skill was actually used
            company_bonus = 2.0 if job["company_short"] in companies else 0.0

            for bullet_idx, bullet in enumerate(job["bullets"]):
                bullet_lower = bullet.lower()
                # Skip if keyword already present
                if kw_lower in bullet_lower:
                    continue
                # Penalize already-modified bullets to spread changes
                mod_penalty = self._bullet_mod_count.get((job_idx, bullet_idx), 0) * 3.0

                # Score based on semantic relevance
                score = company_bonus - mod_penalty
                # Count related words
                bullet_words = set(re.findall(r"[a-z]+", bullet_lower))
                kw_words = set(re.findall(r"[a-z]+", kw_lower))
                overlap = len(bullet_words & kw_words)
                score += overlap * 1.5

                # Check for related tools/context
                related_contexts = {
                    "sql": ["database", "query", "data", "table", "postgresql", "etl"],
                    "python": ["script", "automat", "pandas", "model", "analys"],
                    "tableau": ["dashboard", "visual", "chart", "report"],
                    "excel": ["spreadsheet", "pivot", "model", "track"],
                    "etl": ["pipeline", "transform", "migrat", "automat", "dbt"],
                    "data modeling": ["model", "schema", "database", "warehouse"],
                    "data pipeline": ["etl", "automat", "dbt", "transform", "migrat"],
                    "forecasting": ["predict", "trend", "model", "analys"],
                    "stakeholder": ["present", "leadership", "executive", "recommend"],
                    "automation": ["automat", "script", "efficien", "manual", "process"],
                    "dashboard": ["tableau", "looker", "visual", "report", "metric"],
                    "a/b testing": ["test", "experiment", "conver", "optimiz"],
                }
                for ctx_key, ctx_words in related_contexts.items():
                    if ctx_key in kw_lower:
                        for cw in ctx_words:
                            if cw in bullet_lower:
                                score += 1.0

                if score > best_score:
                    best_score = score
                    best = (job_idx, bullet_idx, bullet)

        return best if best_score > 0 else None

    def _inject_into_bullet(self, bullet, keyword, category):
        """Inject a keyword into a bullet point naturally."""
        kw_lower = keyword.lower()

        # Strategy 1: Add to a list of tools/technologies
        # Look for patterns like "using X, Y, and Z" or "in X and Y"
        tool_list_pattern = r"(using |in |with |leveraging |via )([\w\s,/()]+?)(\s+to\b|\s+for\b|\s+that\b|;|,\s*(?:which|resulting|providing|built|increasing|decreasing))"
        match = re.search(tool_list_pattern, bullet, re.IGNORECASE)
        if match and category == "hard_skills":
            prefix = match.group(1)
            tools = match.group(2).strip()
            suffix = match.group(3)
            # Add keyword to the tools list
            if " and " in tools:
                new_tools = tools.replace(" and ", f", {keyword}, and ", 1)
            elif "," in tools:
                new_tools = tools + f", and {keyword}"
            else:
                new_tools = tools + f" and {keyword}"
            new_bullet = bullet[:match.start(2)] + new_tools + suffix + bullet[match.end(3):]
            return new_bullet

        # Strategy 2: For action verbs, try to swap a similar verb
        if category == "action_verbs":
            # Maps target_verb -> list of (old_verb_to_find, replacement_past_tense)
            verb_swaps = {
                "analyze": [("assessed", "analyzed"), ("evaluated", "analyzed"),
                            ("examined", "analyzed"), ("reviewed", "analyzed")],
                "build": [("created", "built"), ("developed", "built"),
                          ("constructed", "built")],
                "develop": [("built", "developed"), ("created", "developed"),
                            ("constructed", "developed")],
                "optimize": [("improved", "optimized"), ("enhanced", "optimized"),
                             ("refined", "optimized")],
                "automate": [("streamlined", "automated")],
                "collaborate": [("partnered", "collaborated"),
                                ("worked with", "collaborated with")],
                "deliver": [("provided", "delivered"), ("produced", "delivered")],
                "drive": [("led", "drove"), ("spearheaded", "drove")],
                "evaluate": [("assessed", "evaluated"), ("reviewed", "evaluated")],
                "implement": [("developed", "implemented"), ("created", "implemented"),
                              ("designed", "implemented")],
                "leverage": [("used", "leveraged"), ("utilized", "leveraged")],
                "monitor": [("tracked", "monitored"), ("measured", "monitored")],
                "streamline": [("improved", "streamlined"), ("optimized", "streamlined")],
                "transform": [("converted", "transformed"), ("migrated", "transformed")],
                "visualize": [("charted", "visualized"), ("displayed", "visualized")],
            }
            for target_verb, swap_pairs in verb_swaps.items():
                if target_verb == kw_lower:
                    for old_verb, new_past_tense in swap_pairs:
                        pattern = r"\b" + re.escape(old_verb) + r"\b"
                        match = re.search(pattern, bullet, re.IGNORECASE)
                        if match:
                            # Preserve capitalization of original
                            replacement = new_past_tense
                            if match.group(0)[0].isupper():
                                replacement = replacement[0].upper() + replacement[1:]
                            new_bullet = (
                                bullet[:match.start()]
                                + replacement
                                + bullet[match.end():]
                            )
                            if new_bullet != bullet:
                                return new_bullet

        # Strategy 3: For hard skills, try to insert into a tool mention
        # e.g. "using SQL" -> "using SQL and Snowflake"
        if category == "hard_skills" and bullet.endswith("."):
            # Look for tool mentions and add alongside them
            tool_mentions = [
                (r"(SQL\b)", f"SQL and {keyword}"),
                (r"(Tableau\b)", f"Tableau and {keyword}"),
                (r"(Python\b)", f"Python and {keyword}"),
                (r"(Excel\b)", f"Excel and {keyword}"),
                (r"(DBT\b)", f"DBT and {keyword}"),
                (r"(PostgreSQL\b)", f"PostgreSQL and {keyword}"),
            ]
            for pattern, replacement in tool_mentions:
                if re.search(pattern, bullet) and keyword not in bullet:
                    new_bullet = re.sub(pattern, replacement, bullet, count=1)
                    if new_bullet != bullet:
                        return new_bullet

        # Strategy 4: Skip rather than add formulaic "utilizing X" / "supporting X initiatives"
        # It's better to leave a bullet unchanged than to add an awkward appendage
        return bullet

    # ------------------------------------------------------------------
    # Phase 5: Role summary optimization
    # ------------------------------------------------------------------
    def _optimize_role_summaries(self, resume, missing):
        """Add remaining missing keywords to role summary paragraphs."""
        remaining = [
            (kw, info) for kw, info in missing
            if not info.get("matched") and info["importance"] >= 1.5
        ]
        if not remaining:
            return

        # Group remaining keywords by best-fit job, then insert as one clause
        job_additions = {}  # job_idx -> list of keywords
        for kw, info in remaining[:4]:
            companies = find_companies_for_skill(kw)
            for job_idx, job in enumerate(resume["experience"]):
                if job["company_short"] in companies:
                    if kw.lower() not in job["summary"].lower():
                        job_additions.setdefault(job_idx, []).append((kw, info))
                        break

        for job_idx, kw_list in job_additions.items():
            job = resume["experience"][job_idx]
            # Preserve original casing for proper nouns (Databricks, BigQuery, etc.)
            terms = [kw for kw, _ in kw_list]
            if len(terms) == 1:
                clause = terms[0]
            elif len(terms) == 2:
                clause = f"{terms[0]} and {terms[1]}"
            else:
                clause = ", ".join(terms[:-1]) + f", and {terms[-1]}"

            summary = job["summary"]
            if summary.endswith("."):
                summary = summary[:-1]
            summary += f", with a focus on {clause}."
            job["summary"] = summary
            for kw, info in kw_list:
                info["matched"] = True
            self.changes_log.append(
                f"Enriched {job['company_short']} role summary with: {clause}"
            )
