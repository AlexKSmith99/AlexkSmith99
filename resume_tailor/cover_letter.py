"""
Cover letter tailor — generates a tailored cover letter from template + JD.

Process:
1. Extract first 4 qualification bullets from JD
2. Generate matching "My Experience" bullets using resume data
3. Fill template with date, company, title, source, tailored table rows
"""

import re
from datetime import datetime

from .resume_data import MASTER_RESUME, find_companies_for_skill
from .skills_db import HARD_SKILLS, SKILL_VARIANTS


# ---------------------------------------------------------------------------
# Qualification section extraction
# ---------------------------------------------------------------------------
# Common headers for the qualifications/requirements section of a JD
_QUAL_HEADERS = [
    r"qualifications",
    r"requirements",
    r"what you(?:'ll| will)? (?:bring|have|need)",
    r"about you",
    r"who you are",
    r"what we(?:'re| are) looking for",
    r"must[- ]have",
    r"required skills",
    r"required qualifications",
    r"minimum qualifications",
    r"basic qualifications",
    r"your background",
    r"skills (?:and|&) (?:experience|qualifications)",
    r"you have",
    r"you(?:'ll| will) need",
    r"key requirements",
    r"desired skills",
    r"preferred qualifications",
    r"what you(?:'ll| will)? need",
    r"experience (?:and|&) skills",
]

# Section headers that signal END of qualifications
_END_HEADERS = [
    r"nice[- ]to[- ]have",
    r"preferred",
    r"bonus",
    r"benefits",
    r"perks",
    r"compensation",
    r"salary",
    r"what we offer",
    r"why (?:join|work)",
    r"about (?:us|the (?:company|team|role))",
    r"responsibilities",
    r"what you(?:'ll| will) do",
    r"the role",
    r"day[- ]to[- ]day",
    r"equal opportunity",
    r"eeo",
]


def extract_qualifications(jd_text, max_bullets=4):
    """
    Extract the first `max_bullets` qualification bullets from a JD.

    Looks for common qualification section headers, then pulls bullet points
    (lines starting with •, -, *, or numbered patterns).
    """
    lines = jd_text.split("\n")
    in_qual_section = False
    bullets = []

    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue

        # Check if this line is a qualification section header
        if not in_qual_section:
            for pattern in _QUAL_HEADERS:
                if re.search(pattern, stripped, re.IGNORECASE):
                    in_qual_section = True
                    # Don't add the header itself as a bullet
                    break
            continue

        # Check if we've hit the end of the qual section
        if in_qual_section:
            for pattern in _END_HEADERS:
                if re.search(pattern, stripped, re.IGNORECASE):
                    if bullets:  # Only stop if we've found bullets
                        return bullets[:max_bullets]
            # Check if this is a new major section header (short, possibly bold)
            if (
                len(stripped) < 50
                and stripped.endswith(":")
                and not _is_bullet(stripped)
            ):
                # Might be subsection header within quals — check next lines
                if not any(
                    p in stripped.lower()
                    for p in ["required", "must", "minimum", "basic"]
                ):
                    if bullets:
                        return bullets[:max_bullets]

        # Extract bullet content
        if in_qual_section and _is_bullet(stripped):
            bullet_text = _clean_bullet(stripped)
            if len(bullet_text) > 15:  # Skip very short lines
                bullets.append(bullet_text)
                if len(bullets) >= max_bullets:
                    return bullets

    # If we found bullets in the section, return them
    if bullets:
        return bullets[:max_bullets]

    # Fallback: try to find any bulleted list after "qualifications" keyword
    return _fallback_extract(jd_text, max_bullets)


def _is_bullet(line):
    """Check if a line is a bullet point."""
    bullet_patterns = [
        r"^[\u2022\u2023\u25E6\u2043\u2219]\s",  # Unicode bullets
        r"^[-*+]\s",  # Markdown bullets
        r"^\d+[.)]\s",  # Numbered lists
        r"^[a-z][.)]\s",  # Lettered lists
    ]
    return any(re.match(p, line) for p in bullet_patterns)


def _clean_bullet(line):
    """Remove bullet prefix from a line."""
    # Remove leading bullet characters
    cleaned = re.sub(
        r"^[\u2022\u2023\u25E6\u2043\u2219\-*+]\s*", "", line
    )
    # Remove numbered prefixes
    cleaned = re.sub(r"^\d+[.)]\s*", "", cleaned)
    return cleaned.strip()


def _fallback_extract(jd_text, max_bullets):
    """Fallback extraction: find bulleted items near qualification keywords."""
    lines = jd_text.split("\n")
    bullets = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if _is_bullet(stripped):
            bullet_text = _clean_bullet(stripped)
            if len(bullet_text) > 15:
                bullets.append(bullet_text)

    # Return the first max_bullets from the second half of all bullets
    # (first half is usually responsibilities, second half is qualifications)
    mid = len(bullets) // 2
    qual_bullets = bullets[mid:] if len(bullets) > max_bullets else bullets
    return qual_bullets[:max_bullets]


# ---------------------------------------------------------------------------
# Experience response generation
# ---------------------------------------------------------------------------
def generate_experience_response(jd_bullet):
    """
    Generate a "My Experience" response for a JD qualification bullet.

    Uses the master resume to identify relevant companies and skills.
    """
    bullet_lower = jd_bullet.lower()

    # Detect the type of requirement
    is_years_experience = bool(re.search(r"\d+\+?\s*years?", bullet_lower))
    is_degree = any(
        w in bullet_lower
        for w in ["bachelor", "master", "degree", "b.s.", "b.a.", "m.s.", "phd"]
    )
    is_tool_proficiency = _mentions_tools(bullet_lower)

    # Find relevant companies
    companies = _find_relevant_companies(jd_bullet)
    company_str = _format_company_list(companies)

    if is_degree:
        return _generate_degree_response(jd_bullet)
    elif is_years_experience and not is_tool_proficiency:
        return _generate_experience_years_response(jd_bullet, company_str)
    elif is_tool_proficiency:
        return _generate_tool_response(jd_bullet, company_str)
    else:
        return _generate_general_response(jd_bullet, company_str)


def _mentions_tools(text):
    """Check if text mentions specific tools/technologies."""
    tool_indicators = [
        "proficien", "experience with", "knowledge of", "familiarity with",
        "hands-on", "working knowledge", "expertise in",
    ]
    has_indicator = any(ind in text for ind in tool_indicators)
    has_tool = any(
        skill.lower() in text
        for skill in list(HARD_SKILLS)[:100]
    )
    return has_indicator and has_tool


def _find_relevant_companies(bullet):
    """Find which companies are relevant to a JD bullet."""
    bullet_lower = bullet.lower()
    companies = set()

    # Check for tool/skill mentions and map to companies
    for job in MASTER_RESUME["experience"]:
        job_text = (
            " ".join(job["bullets"]).lower()
            + " " + job["summary"].lower()
            + " " + " ".join(s.lower() for s in job["skills_used"])
        )
        # Count relevant word overlap
        bullet_words = set(re.findall(r"[a-z]{3,}", bullet_lower))
        job_words = set(re.findall(r"[a-z]{3,}", job_text))
        overlap = len(bullet_words & job_words)
        if overlap >= 3:
            companies.add(job["company_short"])

    if not companies:
        # Default to the two most recent
        return [MASTER_RESUME["experience"][0]["company_short"],
                MASTER_RESUME["experience"][1]["company_short"]]

    # Order by recency
    ordered = []
    for job in MASTER_RESUME["experience"]:
        if job["company_short"] in companies:
            ordered.append(job["company_short"])
    return ordered


def _format_company_list(companies):
    """Format company names with proper grammar (Oxford comma)."""
    if not companies:
        return "Healthfirst and Canon USA"
    if len(companies) == 1:
        return companies[0]
    if len(companies) == 2:
        return f"{companies[0]} and {companies[1]}"
    return ", ".join(companies[:-1]) + f", and {companies[-1]}"


def _generate_experience_years_response(jd_bullet, company_str):
    """Generate response for 'X+ years of experience in...' bullets."""
    # Extract the full requirement text after the years prefix
    match = re.search(
        r"(\d+\+?\s*years?\s*(?:of\s+)?(?:experience\s+)?)(.+?)(?:\.|$)",
        jd_bullet, re.IGNORECASE
    )
    if match:
        years_prefix = match.group(1).strip()
        remainder = match.group(2).strip()
        # Clean up trailing "or a related..." / "or equivalent..."
        remainder = re.sub(
            r"\s*,?\s*or\s+(?:a\s+)?(?:related|equivalent|similar).*$",
            "", remainder, flags=re.IGNORECASE
        )
        # Remove "as an embedded analytics partner" etc. — mirror in response
        return (
            f"{years_prefix} {remainder} "
            f"from {company_str}."
        )
    return f"Demonstrated experience from {company_str}."


def _generate_tool_response(jd_bullet, company_str):
    """Generate response for tool/technology proficiency bullets."""
    bullet_lower = jd_bullet.lower()

    # Find which tools from the JD the user actually has
    user_tools = set()
    for skill in MASTER_RESUME["profile"]["core_competencies"]:
        # Extract base skill and parenthetical items
        base = skill.split("(")[0].strip()
        user_tools.add(base)
        paren = re.search(r"\(([^)]+)\)", skill)
        if paren:
            for item in paren.group(1).split(","):
                user_tools.add(item.strip())

    # Also check all experience skills
    for job in MASTER_RESUME["experience"]:
        user_tools.update(job["skills_used"])

    # Match JD-mentioned tools against user tools
    jd_tools = []
    for tool in HARD_SKILLS:
        if tool.lower() in bullet_lower:
            jd_tools.append(tool)

    my_tools = []
    for tool in jd_tools:
        tool_lower = tool.lower()
        for user_tool in user_tools:
            if (
                tool_lower == user_tool.lower()
                or tool_lower in SKILL_VARIANTS.get(user_tool, set())
            ):
                my_tools.append(user_tool)
                break
        else:
            # Check variants
            variants = SKILL_VARIANTS.get(tool, set())
            for v in variants:
                for user_tool in user_tools:
                    if v.lower() == user_tool.lower():
                        my_tools.append(user_tool)
                        break

    # Build response
    # Start with a prefix that mirrors the JD language
    prefix_patterns = [
        (r"^(advanced\s+)", "Demonstrated experience of "),
        (r"^(proficiency in\s+)", "Proficiency in "),
        (r"^(experience with\s+)", "Experience with "),
        (r"^(hands-on experience\s+)", "Hands-on experience "),
        (r"^(strong\s+)", "Demonstrated "),
        (r"^(deep\s+)", "Demonstrated "),
        (r"^(working knowledge\s+)", "Working knowledge "),
    ]
    prefix = "Demonstrated experience of "
    remainder = jd_bullet
    for pat, replacement in prefix_patterns:
        m = re.match(pat, jd_bullet, re.IGNORECASE)
        if m:
            prefix = replacement
            remainder = jd_bullet[m.end():]
            break

    # Clean up "or similar" / "or equivalent" WITHIN parentheticals
    # Keep the tools list but remove the "or similar" part
    remainder = re.sub(
        r",?\s*or similar\b", "", remainder, flags=re.IGNORECASE
    )
    remainder = re.sub(
        r",?\s*or equivalent\b", "", remainder, flags=re.IGNORECASE
    )

    # Clean up "also valued" / "also considered" in parentheticals
    remainder = re.sub(
        r"\s*\(.*?also (?:valued|considered|accepted).*?\)", "",
        remainder, flags=re.IGNORECASE
    )

    # Swap user's own tools into the parenthetical where applicable
    if my_tools:
        # Find parenthetical tool lists like "(Pandas, NumPy, scikit-learn)"
        paren_match = re.search(r"\(([^)]+)\)", remainder)
        if paren_match:
            # Build user's tool list from what they actually have
            paren_content = paren_match.group(1)
            jd_paren_tools = [t.strip() for t in paren_content.split(",")]
            user_paren_tools = []
            for jd_t in jd_paren_tools:
                jd_t_clean = jd_t.strip()
                if not jd_t_clean:
                    continue
                # Check if user has this exact tool
                matched = False
                for ut in my_tools:
                    if jd_t_clean.lower() == ut.lower():
                        user_paren_tools.append(ut)
                        matched = True
                        break
                if not matched:
                    # Keep JD tool if user might have it
                    user_paren_tools.append(jd_t_clean)
            # Add user tools not in JD paren list
            paren_lower = paren_content.lower()
            extra_user_tools = ["Pandas", "Seaborn", "NumPy"]
            for et in extra_user_tools:
                if et.lower() not in paren_lower and et in my_tools:
                    user_paren_tools.append(et)
            if user_paren_tools:
                new_paren = ", ".join(user_paren_tools)
                remainder = (
                    remainder[:paren_match.start()]
                    + f"({new_paren})"
                    + remainder[paren_match.end():]
                )

    # Add company attribution
    if remainder.rstrip().endswith("."):
        remainder = remainder.rstrip()[:-1]
    response = f"{prefix}{remainder} at {company_str}."

    # Clean up double spaces
    response = re.sub(r"\s{2,}", " ", response)
    return response


def _generate_degree_response(jd_bullet):
    """Generate response for education/degree requirements."""
    edu = MASTER_RESUME["education"]
    return (
        f"{edu['degree']} in {edu['field']} from "
        f"{edu['school'].title()}, {edu['location']} ({edu['year']})."
    )


def _generate_general_response(jd_bullet, company_str):
    """Generate a general response for other requirement types."""
    # Mirror the JD language with company attribution
    bullet_clean = jd_bullet.strip()
    if bullet_clean.endswith("."):
        bullet_clean = bullet_clean[:-1]

    # Add a "demonstrated experience" prefix
    return f"Demonstrated experience in {bullet_clean.lower()} from {company_str}."


# ---------------------------------------------------------------------------
# Full cover letter assembly
# ---------------------------------------------------------------------------
def generate_cover_letter(jd_text, company, title, source="LinkedIn",
                           posting_date=None):
    """
    Generate a complete tailored cover letter.

    Args:
        jd_text: Full job description text
        company: Company name (e.g., "Brex")
        title: Job title (e.g., "Data Analyst III")
        source: Where the job was found (e.g., "LinkedIn")
        posting_date: Month/year string (e.g., "April 2026"), auto-detected if None

    Returns:
        dict with all cover letter fields ready for formatting
    """
    now = datetime.now()

    if posting_date is None:
        posting_date = now.strftime("%B %Y")

    # Format the date line
    date_line = now.strftime("%B %d, %Y")
    # Fix ordinal (1st, 2nd, 3rd, etc.)
    day = now.day
    if 4 <= day <= 20 or 24 <= day <= 30:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(day % 10, "th")
    date_line = now.strftime(f"%B {day}{suffix}, %Y")

    # Extract qualifications from JD
    qual_bullets = extract_qualifications(jd_text, max_bullets=4)

    # Generate experience responses
    exp_responses = [generate_experience_response(b) for b in qual_bullets]

    # Build the closing paragraph tools/tech reference
    # Keep it consistent with the template (SQL, Tableau and DBT)
    closing_tools = "SQL, Tableau and DBT"

    # Detect relevant tools from JD to mention in closing
    jd_lower = jd_text.lower()
    key_tools = []
    for tool in ["SQL", "Tableau", "DBT", "Python", "Snowflake", "Excel", "Looker", "Power BI"]:
        if tool.lower() in jd_lower:
            key_tools.append(tool)
    if key_tools:
        if len(key_tools) >= 3:
            closing_tools = ", ".join(key_tools[:-1]) + " and " + key_tools[-1]
        elif len(key_tools) == 2:
            closing_tools = " and ".join(key_tools)
        else:
            closing_tools = key_tools[0]

    return {
        "date": date_line,
        "company": company,
        "title": title,
        "source": source,
        "posting_date": posting_date,
        "intro_paragraph": (
            f"I believe I am an excellent fit for the {title} at {company} "
            f"posted on {source} in {posting_date}."
        ),
        "background_paragraph": (
            "I\u2019m a data analyst with 4+ years delivering data-driven solutions "
            "to business problems using my data science toolkit as well as my "
            "accrued sales, marketing, and product analytics knowledge. I\u2019ve "
            "worked at the healthcare firm, Healthfirst, and the camera "
            "manufacturer, Canon USA, on the sales and customer analytics and "
            "data science teams and in the marketing and analytics departments."
        ),
        "table_header_left": "Your Requirements/Responsibilities",
        "table_header_right": "My Experience",
        "jd_bullets": qual_bullets,
        "exp_bullets": exp_responses,
        "closing_paragraph": (
            f"Between my experiences at Healthfirst and Canon USA using "
            f"{closing_tools} to build data pipelines, building and maintaining "
            f"dashboards, support product launches, drive sales and marketing "
            f"analyses, and present key business findings and recommendations "
            f"to key stakeholders, I feel I would be an ideal candidate for "
            f"the {title} role. I would welcome the opportunity to meet with "
            f"you to discuss my background as it relates to your position."
        ),
        "sign_off": "Best Regards,",
        "name": "Alexander Smith",
    }
