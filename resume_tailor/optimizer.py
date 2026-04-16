"""
Resume optimizer that injects missing JD keywords to achieve 75%+ match.

Two modes:
- Rule-based (default): fast, no API key needed, but output can be clunky
- LLM-based (preferred): uses Claude API to naturally rewrite bullets/summary
  while preserving all factual content. Produces professional output.
"""

import copy
import re

from .analyzer import JobscanAnalyzer, _simple_stem
from .resume_data import MASTER_RESUME, resume_to_plain_text, find_companies_for_skill


class ResumeOptimizer:
    """Optimizes a resume to hit a target Jobscan-style match score."""

    def __init__(self, target_score=75, llm_rewriter=None):
        """
        Args:
            target_score: Target match percentage (default 75)
            llm_rewriter: Optional LLMRewriter instance. If provided, bullets
                         and summaries are rewritten via Claude API for
                         professional-quality output. If None, falls back to
                         rule-based injection (clunky but free).
        """
        self.target = target_score
        self.analyzer = JobscanAnalyzer()
        self.llm = llm_rewriter
        self.changes_log = []

    def optimize(self, jd_text):
        """
        Main entry point. Takes JD text, returns:
          (optimized_resume, baseline_score, final_score, report, changes_log)
        """
        self.changes_log = []
        self._bullet_mod_count = {}

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

        # --- Phase 1: Update profile title ---
        self._optimize_title(resume, jd_text, missing)

        # --- Phase 2: Add ALL missing hard skills to Core Competencies ---
        self._optimize_skills_section(resume, missing)

        # --- Phase 3: Enrich professional summary ---
        if self.llm:
            self._optimize_summary_llm(resume, missing)
        else:
            self._optimize_summary(resume, missing)

        # --- Phase 4: Rewrite experience bullets with keywords ---
        if self.llm:
            self._optimize_bullets_llm(resume, missing)
        else:
            self._optimize_bullets(resume, missing)

        # --- Phase 5: Enrich role summaries ---
        if self.llm:
            self._optimize_role_summaries_llm(resume, missing)
        else:
            self._optimize_role_summaries(resume, missing)

        # --- Phase 6: Second pass only in rule-based mode ---
        if not self.llm:
            self._second_pass_bullets(resume, jd_keywords)

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
        lines = jd_text.strip().split("\n")
        for line in lines[:5]:
            line_clean = line.strip()
            if len(line_clean) < 60 and any(
                t.lower() in line_clean.lower()
                for t in ["analyst", "engineer", "scientist", "manager", "developer"]
            ):
                current = resume["profile"]["title"]
                if line_clean.lower() != current.lower() and len(line_clean) > 5:
                    if len(line_clean.split()) <= 6:
                        resume["profile"]["title"] = line_clean
                        self.changes_log.append(
                            f"Updated profile title: '{current}' -> '{line_clean}'"
                        )
                        break

    # ------------------------------------------------------------------
    # Phase 2: Core Competencies — NO CAP, add all missing hard skills
    # ------------------------------------------------------------------
    def _optimize_skills_section(self, resume, missing):
        """Add ALL missing hard skills to Core Competencies."""
        current_skills = resume["profile"]["core_competencies"]
        current_lower = {s.lower() for s in current_skills}
        for s in list(current_lower):
            paren_match = re.search(r"\(([^)]+)\)", s)
            if paren_match:
                for item in paren_match.group(1).split(","):
                    current_lower.add(item.strip().lower())

        for kw, info in missing:
            if info["category"] != "hard_skills":
                continue
            kw_lower = kw.lower()
            if kw_lower in current_lower:
                continue
            inserted = self._try_insert_sub_skill(current_skills, kw)
            if not inserted:
                current_skills.append(kw)
                self.changes_log.append(f"Added '{kw}' to Core Competencies")
            else:
                self.changes_log.append(f"Inserted '{kw}' into existing competency")
            current_lower.add(kw_lower)
            info["matched"] = True

    def _try_insert_sub_skill(self, skills, keyword):
        """Try to add a sub-skill inside parentheses of an existing skill."""
        kw_lower = keyword.lower()
        parent_map = {
            "python": ["Pandas", "NumPy", "scikit-learn", "SciPy", "Matplotlib",
                        "Seaborn", "PySpark", "Airflow", "Flask", "Django"],
            "aws": ["S3", "EC2", "Lambda", "Glue", "Athena", "Redshift", "EMR"],
            "gcp": ["BigQuery", "Cloud Functions", "Cloud Storage"],
            "azure": ["Synapse", "Data Factory"],
        }
        for i, skill in enumerate(skills):
            skill_base = skill.split("(")[0].strip().lower()
            for parent, subs in parent_map.items():
                sub_names_lower = [s.lower() for s in subs]
                if parent in skill_base and kw_lower in sub_names_lower:
                    if "(" in skill:
                        skills[i] = skill.rstrip(")") + f", {keyword})"
                    else:
                        skills[i] = f"{skill} ({keyword})"
                    return True
        return False

    # ------------------------------------------------------------------
    # Phase 3: Summary — generous, up to 8 terms
    # ------------------------------------------------------------------
    def _optimize_summary(self, resume, missing):
        """Weave missing soft skills, industry terms, and key phrases into summary."""
        summary = resume["profile"]["summary"]
        additions = []

        for kw, info in missing:
            if info.get("matched"):
                continue
            if info["category"] in ("soft_skills", "industry_terms", "action_verbs"):
                kw_lower = kw.lower()
                if kw_lower not in summary.lower():
                    additions.append(kw_lower)
                    info["matched"] = True
                    if len(additions) >= 8:
                        break

        if additions:
            extra_terms = ", ".join(additions[:-1])
            if len(additions) > 1:
                extra_terms += f", and {additions[-1]}"
            else:
                extra_terms = additions[0]
            if summary.endswith("."):
                summary = summary[:-1]
            summary += f", with expertise in {extra_terms}."
            resume["profile"]["summary"] = summary
            self.changes_log.append(f"Enriched summary with: {', '.join(additions)}")

    # ------------------------------------------------------------------
    # Phase 4: Bullet optimization — aggressive
    # ------------------------------------------------------------------
    def _optimize_bullets(self, resume, missing):
        """Inject missing keywords into experience bullets. Higher limits."""
        remaining = [
            (kw, info) for kw, info in missing
            if not info.get("matched") and info["category"] in (
                "hard_skills", "industry_terms", "action_verbs"
            )
        ]

        max_mods_per_bullet = 3  # Allow more changes per bullet

        for kw, info in remaining:
            best = self._find_best_bullet(resume, kw)
            if best:
                job_idx, bullet_idx, bullet = best
                key = (job_idx, bullet_idx)
                if self._bullet_mod_count.get(key, 0) >= max_mods_per_bullet:
                    # Try to find another bullet
                    best = self._find_next_best_bullet(resume, kw, exclude=key)
                    if not best:
                        continue
                    job_idx, bullet_idx, bullet = best
                    key = (job_idx, bullet_idx)
                    if self._bullet_mod_count.get(key, 0) >= max_mods_per_bullet:
                        continue

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
        best_score = -1
        best = None

        companies = find_companies_for_skill(keyword)

        for job_idx, job in enumerate(resume["experience"]):
            company_bonus = 2.0 if job["company_short"] in companies else 0.0

            for bullet_idx, bullet in enumerate(job["bullets"]):
                bullet_lower = bullet.lower()
                if kw_lower in bullet_lower:
                    continue
                mod_penalty = self._bullet_mod_count.get((job_idx, bullet_idx), 0) * 2.0

                score = company_bonus - mod_penalty
                bullet_words = set(re.findall(r"[a-z]+", bullet_lower))
                kw_words = set(re.findall(r"[a-z]+", kw_lower))
                overlap = len(bullet_words & kw_words)
                score += overlap * 1.5

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

        return best if best_score > -1 else None

    def _find_next_best_bullet(self, resume, keyword, exclude=None):
        """Find second-best bullet, excluding one already at capacity."""
        kw_lower = keyword.lower()
        best_score = -1
        best = None

        for job_idx, job in enumerate(resume["experience"]):
            for bullet_idx, bullet in enumerate(job["bullets"]):
                key = (job_idx, bullet_idx)
                if key == exclude:
                    continue
                if kw_lower in bullet.lower():
                    continue
                mod_count = self._bullet_mod_count.get(key, 0)
                score = 1.0 - mod_count * 2.0
                if score > best_score:
                    best_score = score
                    best = (job_idx, bullet_idx, bullet)

        return best if best_score > -1 else None

    def _inject_into_bullet(self, bullet, keyword, category):
        """Inject a keyword into a bullet point naturally."""
        kw_lower = keyword.lower()

        # Strategy 1: Add to a list of tools/technologies
        tool_list_pattern = r"(using |in |with |leveraging |via )([\w\s,/()]+?)(\s+to\b|\s+for\b|\s+that\b|;|,\s*(?:which|resulting|providing|built|increasing|decreasing))"
        match = re.search(tool_list_pattern, bullet, re.IGNORECASE)
        if match and category == "hard_skills":
            tools = match.group(2).strip()
            suffix = match.group(3)
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

        # Strategy 3: Insert alongside existing tool mentions
        if category == "hard_skills" and bullet.endswith("."):
            tool_mentions = [
                (r"(SQL\b)", f"SQL and {keyword}"),
                (r"(Tableau\b)", f"Tableau and {keyword}"),
                (r"(Python\b)", f"Python and {keyword}"),
                (r"(Excel\b)", f"Excel and {keyword}"),
                (r"(DBT\b)", f"DBT and {keyword}"),
                (r"(PostgreSQL\b)", f"PostgreSQL and {keyword}"),
                (r"(Airflow\b)", f"Airflow and {keyword}"),
                (r"(Looker Studio\b)", f"Looker Studio and {keyword}"),
                (r"(Google Analytics\b)", f"Google Analytics and {keyword}"),
                (r"(Alteryx\b)", f"Alteryx and {keyword}"),
            ]
            for pattern, replacement in tool_mentions:
                if re.search(pattern, bullet) and keyword not in bullet:
                    new_bullet = re.sub(pattern, replacement, bullet, count=1)
                    if new_bullet != bullet:
                        return new_bullet

        # Strategy 4: Append a contextual clause (ENABLED — not skipped)
        if bullet.endswith("."):
            if category == "hard_skills":
                new_bullet = bullet[:-1] + f", leveraging {keyword}."
                return new_bullet
            elif category == "industry_terms":
                new_bullet = bullet[:-1] + f", driving {kw_lower} outcomes."
                return new_bullet
            elif category == "action_verbs":
                # Add as a gerund clause
                new_bullet = bullet[:-1] + f", helping to {kw_lower} key processes."
                return new_bullet

        return bullet

    # ------------------------------------------------------------------
    # Phase 5: Role summary optimization — ALL jobs, no cap
    # ------------------------------------------------------------------
    def _optimize_role_summaries(self, resume, missing):
        """Add remaining missing keywords to ALL role summaries."""
        remaining = [
            (kw, info) for kw, info in missing
            if not info.get("matched") and info["importance"] >= 0.5
        ]
        if not remaining:
            return

        # Group keywords by best-fit job
        job_additions = {}
        for kw, info in remaining:
            companies = find_companies_for_skill(kw)
            for job_idx, job in enumerate(resume["experience"]):
                if job["company_short"] in companies:
                    if kw.lower() not in job["summary"].lower():
                        job_additions.setdefault(job_idx, []).append((kw, info))
                        break
            else:
                # Default to first job
                job_additions.setdefault(0, []).append((kw, info))

        for job_idx, kw_list in job_additions.items():
            job = resume["experience"][job_idx]
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

    # ------------------------------------------------------------------
    # Phase 6: Second pass — re-check and inject any still-missing
    # ------------------------------------------------------------------
    def _second_pass_bullets(self, resume, jd_keywords):
        """
        Re-analyze the current resume text and inject any keywords
        that are still missing after all previous phases.
        """
        current_text = resume_to_plain_text(resume)
        jd_kw_check = copy.deepcopy(jd_keywords)
        self.analyzer.match_resume(current_text, jd_kw_check)

        still_missing = [
            (kw, info) for kw, info in jd_kw_check.items()
            if not info["matched"] and info["importance"] >= 1.0
        ]
        still_missing.sort(key=lambda x: x[1]["importance"], reverse=True)

        if not still_missing:
            return

        # Try to inject into any bullet that has room
        for kw, info in still_missing:
            kw_lower = kw.lower()
            injected = False

            for job_idx, job in enumerate(resume["experience"]):
                if injected:
                    break
                for bullet_idx, bullet in enumerate(job["bullets"]):
                    key = (job_idx, bullet_idx)
                    if self._bullet_mod_count.get(key, 0) >= 4:
                        continue
                    if kw_lower in bullet.lower():
                        break  # Already present

                    # Force inject with contextual clause
                    if bullet.endswith("."):
                        if info["category"] == "hard_skills":
                            new_bullet = bullet[:-1] + f", utilizing {kw}."
                        elif info["category"] == "action_verbs":
                            new_bullet = bullet[:-1] + f", aiming to {kw_lower} outcomes."
                        else:
                            new_bullet = bullet[:-1] + f", supporting {kw_lower} initiatives."
                        resume["experience"][job_idx]["bullets"][bullet_idx] = new_bullet
                        self._bullet_mod_count[key] = self._bullet_mod_count.get(key, 0) + 1
                        company = resume["experience"][job_idx]["company_short"]
                        self.changes_log.append(
                            f"[Pass 2] Added '{kw}' to {company} bullet {bullet_idx + 1}"
                        )
                        injected = True
                        break

    # ==================================================================
    # LLM-BASED OPTIMIZATION (uses Claude API for natural rewrites)
    # ==================================================================

    def _optimize_summary_llm(self, resume, missing):
        """Use Claude to rewrite the summary with target keywords."""
        # Collect keywords that should go in the summary (soft skills, key concepts)
        summary_keywords = []
        for kw, info in missing:
            if info.get("matched"):
                continue
            if info["category"] in ("soft_skills", "industry_terms"):
                if kw.lower() not in resume["profile"]["summary"].lower():
                    summary_keywords.append(kw)
                    info["matched"] = True
                    if len(summary_keywords) >= 6:
                        break

        if not summary_keywords:
            return

        try:
            new_summary = self.llm.rewrite_summary(
                resume["profile"]["summary"],
                summary_keywords,
                resume["profile"]["title"],
            )
            if new_summary and len(new_summary) > 50:
                resume["profile"]["summary"] = new_summary
                self.changes_log.append(
                    f"Rewrote summary with Claude to include: {', '.join(summary_keywords)}"
                )
        except Exception as e:
            self.changes_log.append(f"[LLM error on summary] {str(e)[:100]}")

    def _optimize_bullets_llm(self, resume, missing):
        """Use Claude to rewrite bullets with target keywords."""
        remaining = [
            (kw, info) for kw, info in missing
            if not info.get("matched") and info["category"] in (
                "hard_skills", "industry_terms", "action_verbs"
            )
        ]

        if not remaining:
            return

        # Assign keywords to the most relevant bullet across all jobs
        # Build: {(job_idx, bullet_idx): [keywords]}
        bullet_assignments = {}
        for kw, info in remaining:
            best = self._find_best_bullet(resume, kw)
            if not best:
                continue
            job_idx, bullet_idx, _ = best
            key = (job_idx, bullet_idx)
            # Cap at 3 keywords per bullet
            if len(bullet_assignments.get(key, [])) >= 3:
                # Find next-best bullet
                best2 = self._find_next_best_bullet(resume, kw, exclude=key)
                if best2:
                    job_idx, bullet_idx, _ = best2
                    key = (job_idx, bullet_idx)
                    if len(bullet_assignments.get(key, [])) >= 3:
                        continue
                else:
                    continue
            bullet_assignments.setdefault(key, []).append(kw)
            info["matched"] = True

        # Group by job and send one API call per job
        for job_idx, job in enumerate(resume["experience"]):
            # Collect bullets-with-keywords for this job
            job_items = []
            for bullet_idx, bullet in enumerate(job["bullets"]):
                key = (job_idx, bullet_idx)
                kws = bullet_assignments.get(key, [])
                job_items.append({"bullet": bullet, "keywords": kws})

            # Only call API if there's work to do
            if not any(item["keywords"] for item in job_items):
                continue

            job_context = {
                "company": job["company_short"],
                "title": job["title"],
                "summary": job["summary"],
            }

            try:
                rewritten = self.llm.rewrite_bullets(job_context, job_items)
                for bullet_idx, new_text in enumerate(rewritten):
                    if new_text and new_text != job["bullets"][bullet_idx]:
                        # Only update if we actually got a rewrite and it had keywords assigned
                        if job_items[bullet_idx]["keywords"]:
                            resume["experience"][job_idx]["bullets"][bullet_idx] = new_text
                            kws = ", ".join(job_items[bullet_idx]["keywords"])
                            self.changes_log.append(
                                f"Rewrote {job['company_short']} bullet {bullet_idx + 1} "
                                f"with Claude (added: {kws})"
                            )
            except Exception as e:
                self.changes_log.append(
                    f"[LLM error on {job['company_short']} bullets] {str(e)[:100]}"
                )

    def _optimize_role_summaries_llm(self, resume, missing):
        """Use Claude to rewrite role summaries with remaining keywords."""
        remaining = [
            (kw, info) for kw, info in missing
            if not info.get("matched") and info["importance"] >= 1.0
        ]
        if not remaining:
            return

        # Group remaining keywords by best-fit job
        job_additions = {}
        for kw, info in remaining:
            companies = find_companies_for_skill(kw)
            assigned = False
            for job_idx, job in enumerate(resume["experience"]):
                if job["company_short"] in companies:
                    if kw.lower() not in job["summary"].lower():
                        job_additions.setdefault(job_idx, []).append(kw)
                        assigned = True
                        break
            if not assigned:
                job_additions.setdefault(0, []).append(kw)

        for job_idx, kws in job_additions.items():
            if not kws:
                continue
            job = resume["experience"][job_idx]
            try:
                new_summary = self.llm.rewrite_role_summary(
                    job["summary"],
                    kws,
                    {"company": job["company_short"], "title": job["title"]},
                )
                if new_summary and len(new_summary) > 30:
                    resume["experience"][job_idx]["summary"] = new_summary
                    for kw in kws:
                        for _, info in missing:
                            # no-op; matching handled in final score
                            pass
                    self.changes_log.append(
                        f"Rewrote {job['company_short']} role summary with Claude "
                        f"(added: {', '.join(kws)})"
                    )
            except Exception as e:
                self.changes_log.append(
                    f"[LLM error on {job['company_short']} summary] {str(e)[:100]}"
                )
