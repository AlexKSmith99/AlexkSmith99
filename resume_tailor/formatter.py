"""
PDF and DOCX formatters for resume and cover letter output.

Replicates the exact visual design from the original resume:
- Bold name header, contact line
- Dark section header bars with white centered text
- Company/date layout, bullet points
- Two-page support

And cover letter design:
- Date, greeting, paragraphs
- Two-column table with dark header row
- Closing, signature
"""

import os
import re
from pathlib import Path

from fpdf import FPDF
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import nsdecls
from docx.oxml import parse_xml


# ===================================================================
# FONT SETUP — bundled fonts so it works on Streamlit Cloud
# ===================================================================
_PACKAGE_DIR = Path(__file__).resolve().parent
_FONT_DIR = _PACKAGE_DIR / "fonts"
_FONT_REGULAR = str(_FONT_DIR / "DejaVuSans.ttf")
_FONT_BOLD = str(_FONT_DIR / "DejaVuSans-Bold.ttf")
_FONT_ITALIC = _FONT_REGULAR  # No oblique variant; reuse regular
_FONT_BOLD_ITALIC = _FONT_BOLD

# Verify fonts exist at import time
if not os.path.isfile(_FONT_REGULAR):
    raise FileNotFoundError(
        f"Bundled font not found at {_FONT_REGULAR}. "
        f"Contents of {_FONT_DIR}: {list(_FONT_DIR.iterdir()) if _FONT_DIR.is_dir() else 'DIR MISSING'}"
    )


class ResumePDF(FPDF):
    """Generates a PDF matching the original resume design."""

    def __init__(self):
        super().__init__(format="Letter")
        self.set_auto_page_break(auto=True, margin=15)
        self.page_num = 0
        self.resume_name = ""
        # Register Unicode-capable font
        self.add_font("DejaVu", "", _FONT_REGULAR)
        self.add_font("DejaVu", "B", _FONT_BOLD)
        self.add_font("DejaVu", "I", _FONT_ITALIC)
        self.add_font("DejaVu", "BI", _FONT_BOLD_ITALIC)

    def header(self):
        if self.page_no() > 1:
            # Page 2+ header: "NAME" left, "Page N" right
            self.set_font("DejaVu", "B", 11)
            self.cell(0, 6, self.resume_name, new_x="LMARGIN")
            self.set_font("DejaVu", "", 10)
            self.cell(0, 6, f"Page {self.page_no()}", align="R", new_x="LMARGIN", new_y="NEXT")
            self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
            self.ln(4)

    def add_section_bar(self, text):
        """Dark bar with white centered text — section header."""
        self.set_fill_color(50, 50, 50)
        self.set_text_color(255, 255, 255)
        self.set_font("DejaVu", "B", 10)
        self.cell(0, 7, text, fill=True, align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)
        self.ln(2)

    def add_name_header(self, name, contact):
        """Top of page 1: large bold name + contact info line."""
        self.resume_name = name
        self.set_font("DejaVu", "B", 16)
        self.cell(0, 8, name, align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("DejaVu", "", 8.5)
        # Contact line 1
        line1 = (
            f"{contact['location']}  \u25aa  {contact['phone']}  "
            f"\u25aa  {contact['email']}"
        )
        self.cell(0, 5, line1, align="C", new_x="LMARGIN", new_y="NEXT")
        # Contact line 2
        line2 = (
            f"{contact['linkedin']}  \u25aa  {contact['github']}  "
            f"\u25aa  {contact['portfolio']}"
        )
        self.cell(0, 5, line2, align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def add_profile(self, profile):
        """Professional Profile section."""
        self.add_section_bar("PROFESSIONAL PROFILE")

        # Title
        self.set_font("DejaVu", "B", 11)
        self.cell(0, 6, profile["title"], align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

        # Summary
        self.set_font("DejaVu", "", 9)
        self.multi_cell(0, 4.5, profile["summary"], align="L")
        self.ln(2)

        # Core Competencies
        self.set_font("DejaVu", "B", 9)
        label = "Core Competencies:  "
        label_w = self.get_string_width(label) + 2
        self.cell(label_w, 5, label)
        self.set_font("DejaVu", "", 9)
        skills_text = "    ".join(profile["core_competencies"])
        remaining_w = self.w - self.l_margin - self.r_margin - label_w
        self.multi_cell(remaining_w, 5, skills_text)
        self.ln(2)

    def add_experience(self, experience):
        """Work Experience section."""
        self.add_section_bar("WORK EXPERIENCE")

        for job in experience:
            # Company name (bold) + location, dates right-aligned
            self.set_font("DejaVu", "B", 10)
            company_loc = f"{job['company']}, {job['location']}"
            dates = job["dates"]

            # Calculate widths
            company_w = self.get_string_width(company_loc) + 4
            dates_w = self.get_string_width(dates) + 4
            remaining = self.w - self.l_margin - self.r_margin - dates_w

            self.cell(remaining, 5, company_loc)
            self.cell(dates_w, 5, dates, align="R", new_x="LMARGIN", new_y="NEXT")

            full_w = self.w - self.l_margin - self.r_margin

            # Company description (italic)
            if job.get("description"):
                self.set_font("DejaVu", "I", 8.5)
                self.set_x(self.l_margin)
                self.multi_cell(full_w, 4, job["description"])

            # Job title
            self.set_font("DejaVu", "B", 9.5)
            title_text = f"{job['title']} ({job['work_type']})"
            self.set_x(self.l_margin)
            self.multi_cell(full_w, 5, title_text)

            # Role summary
            self.set_font("DejaVu", "", 8.5)
            self.set_x(self.l_margin)
            self.multi_cell(full_w, 4, job["summary"])
            self.ln(1)

            # Bullets
            for bullet in job["bullets"]:
                self._add_bullet(bullet)
                self.ln(0.5)

            self.ln(3)

    def _add_bullet(self, text):
        """Add a bullet point with hanging indent."""
        self.set_font("DejaVu", "", 8.5)
        x = self.get_x()
        indent = 8
        bullet_char = "\u2022"

        self.cell(indent, 4, bullet_char)
        # Multi-cell with left margin offset for wrapping
        cell_width = self.w - self.l_margin - self.r_margin - indent
        self.multi_cell(cell_width, 4, text)

    def add_education(self, education):
        """Education section."""
        self.add_section_bar("EDUCATION")

        self.set_font("DejaVu", "B", 9.5)
        degree_line = f"{education['degree']}, "
        self.cell(self.get_string_width(degree_line), 5, degree_line)

        self.set_font("DejaVu", "", 9.5)
        field_honors = f"{education['field']}, {education['honors']}"
        self.cell(0, 5, field_honors, new_x="LMARGIN", new_y="NEXT")

        self.set_font("DejaVu", "B", 9.5)
        school_line = f"{education['school']}, "
        self.cell(self.get_string_width(school_line), 5, school_line)

        self.set_font("DejaVu", "", 9.5)
        self.cell(0, 5, f"{education['location']} ({education['year']})", new_x="LMARGIN", new_y="NEXT")

        self.ln(1)
        self.set_font("DejaVu", "", 8.5)
        coursework = "Relevant coursework: " + ", ".join(education["coursework"]) + "."
        self.multi_cell(0, 4, coursework, align="C")
        self.ln(3)

    def add_professional_development(self, pd):
        """Professional Development section."""
        self.add_section_bar("PROFESSIONAL DEVELOPMENT")

        # Program name and school
        self.set_font("DejaVu", "B", 9.5)
        prog_line = f"{pd['program']}, "
        self.cell(self.get_string_width(prog_line), 5, prog_line)

        self.set_font("DejaVu", "", 9.5)
        school_line = f"{pd['school']}, {pd['location']} ({pd['dates']})"
        self.cell(0, 5, school_line, new_x="LMARGIN", new_y="NEXT")

        # Description (italic)
        self.set_font("DejaVu", "I", 8.5)
        self.cell(0, 5, pd["description"], align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

        # Bullets
        for bullet in pd["bullets"]:
            self._add_bullet(bullet)
            self.ln(1)


def generate_resume_pdf(resume_data, output_path):
    """Generate a PDF resume matching the original design."""
    pdf = ResumePDF()
    pdf.add_page()
    pdf.set_margins(12.7, 12.7, 12.7)  # ~0.5 inch margins

    pdf.add_name_header(resume_data["name"], resume_data["contact"])
    pdf.add_profile(resume_data["profile"])
    pdf.add_experience(resume_data["experience"])
    pdf.add_education(resume_data["education"])
    pdf.add_professional_development(resume_data["professional_development"])

    pdf.output(output_path)
    return output_path


# ===================================================================
# RESUME DOCX
# ===================================================================
def generate_resume_docx(resume_data, output_path):
    """Generate a DOCX resume matching the original design."""
    doc = Document()

    # Page setup
    section = doc.sections[0]
    section.top_margin = Cm(1.27)
    section.bottom_margin = Cm(1.27)
    section.left_margin = Cm(1.27)
    section.right_margin = Cm(1.27)

    # Name
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(resume_data["name"])
    run.bold = True
    run.font.size = Pt(16)
    p.paragraph_format.space_after = Pt(2)

    # Contact line 1
    c = resume_data["contact"]
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(
        f"{c['location']}  \u25aa  {c['phone']}  \u25aa  {c['email']}"
    )
    run.font.size = Pt(8.5)
    p.paragraph_format.space_after = Pt(0)

    # Contact line 2
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(
        f"{c['linkedin']}  \u25aa  {c['github']}  \u25aa  {c['portfolio']}"
    )
    run.font.size = Pt(8.5)
    p.paragraph_format.space_after = Pt(6)

    # --- Profile ---
    _add_section_header_docx(doc, "PROFESSIONAL PROFILE")

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(resume_data["profile"]["title"])
    run.bold = True
    run.font.size = Pt(11)
    p.paragraph_format.space_after = Pt(4)

    p = doc.add_paragraph(resume_data["profile"]["summary"])
    p.paragraph_format.space_after = Pt(4)
    for run in p.runs:
        run.font.size = Pt(9)

    # Core Competencies
    p = doc.add_paragraph()
    run = p.add_run("Core Competencies: ")
    run.bold = True
    run.font.size = Pt(9)
    run = p.add_run("    ".join(resume_data["profile"]["core_competencies"]))
    run.font.size = Pt(9)
    p.paragraph_format.space_after = Pt(6)

    # --- Experience ---
    _add_section_header_docx(doc, "WORK EXPERIENCE")

    for job in resume_data["experience"]:
        # Company + dates
        p = doc.add_paragraph()
        run = p.add_run(f"{job['company']}, {job['location']}")
        run.bold = True
        run.font.size = Pt(10)
        run = p.add_run(f"\t{job['dates']}")
        run.font.size = Pt(10)
        # Right-align dates using tab stop
        tab_stops = p.paragraph_format.tab_stops
        tab_stops.add_tab_stop(Cm(18.5))
        p.paragraph_format.space_after = Pt(0)

        # Company description
        if job.get("description"):
            p = doc.add_paragraph()
            run = p.add_run(job["description"])
            run.italic = True
            run.font.size = Pt(8.5)
            p.paragraph_format.space_after = Pt(0)

        # Title
        p = doc.add_paragraph()
        run = p.add_run(f"{job['title']} ({job['work_type']})")
        run.bold = True
        run.font.size = Pt(9.5)
        p.paragraph_format.space_after = Pt(2)

        # Role summary
        p = doc.add_paragraph(job["summary"])
        for run in p.runs:
            run.font.size = Pt(8.5)
        p.paragraph_format.space_after = Pt(2)

        # Bullets
        for bullet in job["bullets"]:
            p = doc.add_paragraph(bullet, style="List Bullet")
            for run in p.runs:
                run.font.size = Pt(8.5)
            p.paragraph_format.space_after = Pt(1)

    # --- Education ---
    _add_section_header_docx(doc, "EDUCATION")

    p = doc.add_paragraph()
    edu = resume_data["education"]
    run = p.add_run(f"{edu['degree']}, ")
    run.bold = True
    run.font.size = Pt(9.5)
    run = p.add_run(f"{edu['field']}, {edu['honors']}")
    run.font.size = Pt(9.5)
    p.paragraph_format.space_after = Pt(0)

    p = doc.add_paragraph()
    run = p.add_run(f"{edu['school']}, ")
    run.bold = True
    run.font.size = Pt(9.5)
    run = p.add_run(f"{edu['location']} ({edu['year']})")
    run.font.size = Pt(9.5)
    p.paragraph_format.space_after = Pt(4)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(
        "Relevant coursework: " + ", ".join(edu["coursework"]) + "."
    )
    run.font.size = Pt(8.5)
    p.paragraph_format.space_after = Pt(6)

    # --- Professional Development ---
    _add_section_header_docx(doc, "PROFESSIONAL DEVELOPMENT")

    pd = resume_data["professional_development"]
    p = doc.add_paragraph()
    run = p.add_run(f"{pd['program']}, ")
    run.bold = True
    run.font.size = Pt(9.5)
    run = p.add_run(f"{pd['school']}, {pd['location']} ({pd['dates']})")
    run.font.size = Pt(9.5)
    p.paragraph_format.space_after = Pt(0)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(pd["description"])
    run.italic = True
    run.font.size = Pt(8.5)
    p.paragraph_format.space_after = Pt(4)

    for bullet in pd["bullets"]:
        p = doc.add_paragraph(bullet, style="List Bullet")
        for run in p.runs:
            run.font.size = Pt(8.5)
        p.paragraph_format.space_after = Pt(1)

    doc.save(output_path)
    return output_path


def _add_section_header_docx(doc, text):
    """Add a dark background section header bar."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(255, 255, 255)
    # Dark background shading
    shading = parse_xml(
        f'<w:shd {nsdecls("w")} w:fill="323232" w:val="clear"/>'
    )
    p.paragraph_format.element.get_or_add_pPr().append(shading)
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(4)


# ===================================================================
# COVER LETTER PDF
# ===================================================================
class CoverLetterPDF(FPDF):
    """Generates a cover letter PDF with two-column table."""

    def __init__(self):
        super().__init__(format="Letter")
        self.set_auto_page_break(auto=True, margin=15)
        self.add_font("DejaVu", "", _FONT_REGULAR)
        self.add_font("DejaVu", "B", _FONT_BOLD)
        self.add_font("DejaVu", "I", _FONT_ITALIC)
        self.add_font("DejaVu", "BI", _FONT_BOLD_ITALIC)


def generate_cover_letter_pdf(cl_data, output_path):
    """Generate a cover letter PDF."""
    pdf = CoverLetterPDF()
    pdf.add_page()
    pdf.set_margins(15, 15, 15)

    # Date
    pdf.set_font("DejaVu", "", 10)
    pdf.cell(0, 6, cl_data["date"], new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # Dear Hiring Manager
    pdf.cell(0, 6, "Dear Hiring Manager,", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # Intro paragraph
    pdf.set_font("DejaVu", "", 9.5)
    pdf.multi_cell(0, 5, cl_data["intro_paragraph"])
    pdf.ln(2)

    # Background paragraph
    pdf.multi_cell(0, 5, cl_data["background_paragraph"])
    pdf.ln(2)

    # Table intro
    pdf.set_font("DejaVu", "", 9.5)
    pdf.multi_cell(0, 5, "Here is a breakdown of my experience vs. your requirements:")
    pdf.ln(3)

    # Requirements/Experience table
    col_w = (pdf.w - pdf.l_margin - pdf.r_margin) / 2

    # Table header
    pdf.set_fill_color(50, 50, 50)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("DejaVu", "B", 9)
    pdf.cell(col_w, 7, cl_data["table_header_left"], border=1, fill=True, align="C")
    pdf.cell(col_w, 7, cl_data["table_header_right"], border=1, fill=True, align="C",
             new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)

    # Table rows
    pdf.set_font("DejaVu", "", 8)
    for jd_bullet, exp_bullet in zip(cl_data["jd_bullets"], cl_data["exp_bullets"]):
        # Calculate row height based on content
        jd_lines = pdf.multi_cell(col_w - 2, 4, jd_bullet, dry_run=True, output="LINES")
        exp_lines = pdf.multi_cell(col_w - 2, 4, exp_bullet, dry_run=True, output="LINES")
        max_lines = max(len(jd_lines), len(exp_lines))
        row_h = max_lines * 4 + 4  # padding

        y_start = pdf.get_y()
        x_start = pdf.l_margin

        # Draw cell borders
        pdf.rect(x_start, y_start, col_w, row_h)
        pdf.rect(x_start + col_w, y_start, col_w, row_h)

        # Left cell content
        pdf.set_xy(x_start + 1, y_start + 2)
        pdf.multi_cell(col_w - 2, 4, jd_bullet)

        # Right cell content
        pdf.set_xy(x_start + col_w + 1, y_start + 2)
        pdf.multi_cell(col_w - 2, 4, exp_bullet)

        pdf.set_y(y_start + row_h)

    pdf.ln(6)

    # Closing paragraph
    pdf.set_font("DejaVu", "", 9.5)
    pdf.multi_cell(0, 5, cl_data["closing_paragraph"])
    pdf.ln(4)

    # Sign off
    pdf.cell(0, 6, cl_data["sign_off"], new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, cl_data["name"], new_x="LMARGIN", new_y="NEXT")

    pdf.output(output_path)
    return output_path


# ===================================================================
# COVER LETTER DOCX
# ===================================================================
def generate_cover_letter_docx(cl_data, output_path):
    """Generate a cover letter DOCX with formatted table."""
    doc = Document()

    section = doc.sections[0]
    section.top_margin = Cm(1.5)
    section.bottom_margin = Cm(1.5)
    section.left_margin = Cm(1.5)
    section.right_margin = Cm(1.5)

    # Date
    p = doc.add_paragraph(cl_data["date"])
    for run in p.runs:
        run.font.size = Pt(10)
    p.paragraph_format.space_after = Pt(8)

    # Dear Hiring Manager
    p = doc.add_paragraph("Dear Hiring Manager,")
    for run in p.runs:
        run.font.size = Pt(10)
    p.paragraph_format.space_after = Pt(8)

    # Intro
    p = doc.add_paragraph(cl_data["intro_paragraph"])
    for run in p.runs:
        run.font.size = Pt(9.5)
    p.paragraph_format.space_after = Pt(6)

    # Background
    p = doc.add_paragraph(cl_data["background_paragraph"])
    for run in p.runs:
        run.font.size = Pt(9.5)
    p.paragraph_format.space_after = Pt(6)

    # Table intro
    p = doc.add_paragraph(
        "Here is a breakdown of my experience vs. your requirements:"
    )
    for run in p.runs:
        run.font.size = Pt(9.5)
    p.paragraph_format.space_after = Pt(6)

    # Table
    num_rows = len(cl_data["jd_bullets"]) + 1  # +1 for header
    table = doc.add_table(rows=num_rows, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"

    # Header row
    header_cells = table.rows[0].cells
    for i, text in enumerate(
        [cl_data["table_header_left"], cl_data["table_header_right"]]
    ):
        cell = header_cells[i]
        cell.text = ""
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(255, 255, 255)
        # Dark background
        shading = parse_xml(
            f'<w:shd {nsdecls("w")} w:fill="323232" w:val="clear"/>'
        )
        cell._tc.get_or_add_tcPr().append(shading)

    # Data rows
    for row_idx, (jd_bullet, exp_bullet) in enumerate(
        zip(cl_data["jd_bullets"], cl_data["exp_bullets"]), start=1
    ):
        row = table.rows[row_idx]
        # JD bullet
        cell = row.cells[0]
        cell.text = ""
        p = cell.paragraphs[0]
        run = p.add_run(jd_bullet)
        run.font.size = Pt(8.5)

        # Experience bullet
        cell = row.cells[1]
        cell.text = ""
        p = cell.paragraphs[0]
        run = p.add_run(exp_bullet)
        run.font.size = Pt(8.5)

    # Set column widths
    for row in table.rows:
        row.cells[0].width = Cm(9)
        row.cells[1].width = Cm(9)

    # Spacing after table
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)

    # Closing paragraph
    p = doc.add_paragraph(cl_data["closing_paragraph"])
    for run in p.runs:
        run.font.size = Pt(9.5)
    p.paragraph_format.space_after = Pt(8)

    # Sign off
    p = doc.add_paragraph(cl_data["sign_off"])
    for run in p.runs:
        run.font.size = Pt(10)
    p.paragraph_format.space_after = Pt(2)

    p = doc.add_paragraph(cl_data["name"])
    for run in p.runs:
        run.font.size = Pt(10)

    doc.save(output_path)
    return output_path
