"""
Template-based resume formatter.

Instead of generating a resume from scratch, this opens the user's actual
.docx resume file and surgically replaces text content while preserving
100% of the original formatting (fonts, styles, margins, bullets, shading).
"""

import copy
import os
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn

# Path to the base resume template
_TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "Alexander-Smith-2025-ResumeK-edit (2).docx"


def _find_paragraph_index(doc, text_fragment):
    """Find the index of the paragraph containing a text fragment."""
    for i, p in enumerate(doc.paragraphs):
        if text_fragment in p.text:
            return i
    return None


def _replace_paragraph_text(para, new_text):
    """
    Replace all text in a paragraph while preserving the formatting
    of the first run. Collapses all runs into one.
    """
    if not para.runs:
        return
    # Preserve first run's formatting
    first_run = para.runs[0]
    # Remove all runs except the first
    for run in para.runs[1:]:
        run._element.getparent().remove(run._element)
    # Set the first run's text to the new text
    first_run.text = new_text


def _replace_run_text_in_paragraph(para, old_fragment, new_fragment):
    """
    Replace a text fragment across runs in a paragraph.
    Joins all run text, does the replacement, and resets into the first run.
    """
    full_text = para.text
    if old_fragment not in full_text:
        return False
    new_full = full_text.replace(old_fragment, new_fragment, 1)
    _replace_paragraph_text(para, new_full)
    return True


def generate_resume_from_template(resume_data, output_path):
    """
    Generate a tailored resume by modifying the original .docx template.

    Opens the user's actual resume, replaces text content in each section,
    and saves a new copy. All formatting is preserved exactly.
    """
    if not _TEMPLATE_PATH.exists():
        raise FileNotFoundError(
            f"Base resume template not found at {_TEMPLATE_PATH}. "
            "Please ensure 'Alexander-Smith-2025-ResumeK-edit (2).docx' "
            "is in the project root."
        )

    doc = Document(str(_TEMPLATE_PATH))

    # --- 1. Profile title (paragraph 7) ---
    title_idx = _find_paragraph_index(doc, "Data Analyst")
    if title_idx is not None:
        _replace_paragraph_text(doc.paragraphs[title_idx], resume_data["profile"]["title"])

    # --- 2. Summary (paragraph 9) ---
    summary_idx = _find_paragraph_index(doc, "Experienced data analyst")
    if summary_idx is not None:
        _replace_paragraph_text(doc.paragraphs[summary_idx], resume_data["profile"]["summary"])

    # --- 3. Core Competencies table ---
    if doc.tables:
        table = doc.tables[0]
        skills = resume_data["profile"]["core_competencies"]
        # Split skills across 3 columns (original layout)
        n = len(skills)
        col_size = (n + 2) // 3  # ceiling division
        columns = [
            skills[:col_size],
            skills[col_size:col_size * 2],
            skills[col_size * 2:],
        ]
        row = table.rows[0]
        for col_idx, col_skills in enumerate(columns):
            cell = row.cells[col_idx]
            # Clear existing paragraphs
            for p in cell.paragraphs:
                for run in p.runs:
                    run.text = ""
            # Set new skills, one per line
            for skill_idx, skill in enumerate(col_skills):
                if skill_idx == 0:
                    # Use existing first paragraph
                    if cell.paragraphs[0].runs:
                        cell.paragraphs[0].runs[0].text = skill
                    else:
                        cell.paragraphs[0].text = skill
                else:
                    # Add new paragraph copying format from first
                    new_para = cell.add_paragraph()
                    # Copy formatting from first paragraph
                    src_para = cell.paragraphs[0]
                    if src_para.runs:
                        run = new_para.add_run(skill)
                        src_font = src_para.runs[0].font
                        run.font.size = src_font.size
                        run.font.bold = src_font.bold
                        run.font.name = src_font.name

    # --- 4. Experience sections ---
    _update_experience(doc, resume_data["experience"])

    # --- 5. Education ---
    # Education stays the same (not modified by optimizer)

    # --- 6. Professional Development ---
    # Professional Development stays the same (not modified by optimizer)

    # Save
    doc.save(output_path)
    return output_path


def _update_experience(doc, experience_data):
    """Update experience bullet points and role summaries in the template."""

    # Map company names to their paragraph indices
    company_markers = {
        "HEALTHFIRST": "HEALTHFIRST INC.",
        "CANON USA": "CANON USA",
        "RAZOR USA": "RAZOR USA LLC",
    }

    for job in experience_data:
        company_short = job["company_short"]

        # Find the company header paragraph
        company_para_idx = None
        for i, p in enumerate(doc.paragraphs):
            for marker, full in company_markers.items():
                if marker in p.text and company_short.upper().startswith(marker.split()[0]):
                    if full.split(",")[0].upper() in p.text.upper() or marker in p.text:
                        company_para_idx = i
                        break
            if company_para_idx is not None:
                break

        if company_para_idx is None:
            continue

        # Find the job title paragraph (has bold run with the title)
        title_para_idx = None
        for i in range(company_para_idx + 1, min(company_para_idx + 5, len(doc.paragraphs))):
            p = doc.paragraphs[i]
            if p.runs and p.runs[0].font.bold and any(
                keyword in p.text for keyword in ["Analyst", "Engineer", "Manager", "Developer"]
            ):
                title_para_idx = i
                break

        # Find the role summary paragraph (right after title)
        summary_para_idx = None
        if title_para_idx is not None:
            for i in range(title_para_idx + 1, min(title_para_idx + 3, len(doc.paragraphs))):
                p = doc.paragraphs[i]
                if p.text and len(p.text) > 50:  # Summary is a long paragraph
                    summary_para_idx = i
                    break

        # Update role summary
        if summary_para_idx is not None:
            _replace_paragraph_text(doc.paragraphs[summary_para_idx], job["summary"])

        # Find and update bullet points
        # Bullets follow the summary and have numPr formatting
        bullet_start = (summary_para_idx or title_para_idx or company_para_idx) + 1
        bullet_idx = 0
        for i in range(bullet_start, min(bullet_start + 15, len(doc.paragraphs))):
            p = doc.paragraphs[i]
            # Check if this is a list item
            pPr = p._element.find(qn('w:pPr'))
            if pPr is not None:
                numPr = pPr.find(qn('w:numPr'))
                if numPr is not None and bullet_idx < len(job["bullets"]):
                    _replace_paragraph_text(p, job["bullets"][bullet_idx])
                    bullet_idx += 1
                elif numPr is None and bullet_idx > 0:
                    # We've passed the bullet section
                    break
            elif p.text.strip() == "" and bullet_idx > 0:
                break
            elif bullet_idx > 0:
                break


def generate_resume_docx_from_template(resume_data, output_path):
    """Alias for the template-based generation."""
    return generate_resume_from_template(resume_data, output_path)
