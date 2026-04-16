"""
Resume Tailor — Streamlit Web Interface

A Jobscan-style resume keyword matcher and cover letter tailor.
Paste a job description, get an optimized resume and tailored cover letter.
"""

import copy
import io
import os
import streamlit as st

from resume_tailor.analyzer import JobscanAnalyzer, analyze_match
from resume_tailor.cover_letter import generate_cover_letter
from resume_tailor.formatter import (
    generate_cover_letter_docx,
    generate_cover_letter_pdf,
)
from resume_tailor.optimizer import ResumeOptimizer
from resume_tailor.resume_data import MASTER_RESUME, resume_to_plain_text
from resume_tailor.template_formatter import (
    generate_resume_from_template,
    generate_resume_pdf_from_template,
)

try:
    from resume_tailor.llm_rewriter import LLMRewriter
    _LLM_AVAILABLE = True
except ImportError:
    _LLM_AVAILABLE = False


# ---------------------------------------------------------------------------
# Page config
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="Resume Tailor",
    page_icon="📄",
    layout="wide",
)

# Version marker — if you see this in the app, the latest code is deployed
_APP_VERSION = "v5.0-claude-llm"

# ---------------------------------------------------------------------------
# Styling
# ---------------------------------------------------------------------------
st.markdown("""
<style>
    .score-big {
        font-size: 3rem;
        font-weight: 700;
        text-align: center;
    }
    .score-green { color: #22c55e; }
    .score-yellow { color: #eab308; }
    .score-red { color: #ef4444; }
    .metric-label {
        font-size: 0.85rem;
        color: #888;
        text-align: center;
    }
    .change-item {
        padding: 4px 0;
        border-bottom: 1px solid #eee;
    }
</style>
""", unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Helper: score color
# ---------------------------------------------------------------------------
def score_color(score):
    if score >= 75:
        return "green"
    elif score >= 50:
        return "yellow"
    return "red"


def score_html(score, label=""):
    color = score_color(score)
    return f"""
    <div>
        <div class="score-big score-{color}">{score:.1f}%</div>
        <div class="metric-label">{label}</div>
    </div>
    """


# ---------------------------------------------------------------------------
# Helper: generate files to in-memory buffers
# ---------------------------------------------------------------------------
def generate_resume_files(resume_data):
    """Generate PDF from the original resume template (preserves exact design)."""
    pdf_buf = io.BytesIO()
    docx_buf = io.BytesIO()

    # PDF — template .docx converted via LibreOffice
    pdf_path = "/tmp/_resume_temp.pdf"
    generate_resume_pdf_from_template(resume_data, pdf_path)
    with open(pdf_path, "rb") as f:
        pdf_buf.write(f.read())
    pdf_buf.seek(0)

    # DOCX — template-based (preserves all original formatting)
    docx_path = "/tmp/_resume_temp.docx"
    generate_resume_from_template(resume_data, docx_path)
    with open(docx_path, "rb") as f:
        docx_buf.write(f.read())
    docx_buf.seek(0)

    return pdf_buf, docx_buf


def generate_cl_files(cl_data):
    """Generate cover letter PDF and DOCX into BytesIO buffers."""
    pdf_buf = io.BytesIO()
    docx_buf = io.BytesIO()

    pdf_path = "/tmp/_cl_temp.pdf"
    generate_cover_letter_pdf(cl_data, pdf_path)
    with open(pdf_path, "rb") as f:
        pdf_buf.write(f.read())
    pdf_buf.seek(0)

    docx_path = "/tmp/_cl_temp.docx"
    generate_cover_letter_docx(cl_data, docx_path)
    with open(docx_path, "rb") as f:
        docx_buf.write(f.read())
    docx_buf.seek(0)

    return pdf_buf, docx_buf


# ---------------------------------------------------------------------------
# Category labels
# ---------------------------------------------------------------------------
CATEGORY_LABELS = {
    "hard_skills": "Hard Skills",
    "soft_skills": "Soft Skills",
    "job_titles": "Job Titles",
    "education": "Education",
    "certifications": "Certifications",
    "industry_terms": "Industry Terms",
    "action_verbs": "Action Verbs",
}


# ---------------------------------------------------------------------------
# Main App
# ---------------------------------------------------------------------------
st.title("📄 Resume Tailor")
st.caption("Jobscan-style keyword matching  •  Resume optimization  •  Cover letter generation")

tab_resume, tab_cover_letter, tab_analyze = st.tabs([
    "🎯 Optimize Resume",
    "✉️ Cover Letter",
    "🔍 Analyze Only",
])


# ===================================================================
# TAB 1: RESUME OPTIMIZER
# ===================================================================
with tab_resume:
    st.header("Resume Optimizer")
    st.write("Paste a job description below. The tool will analyze your resume against it and generate a tailored version.")

    # API key input — the LLM mode is what produces professional output
    with st.expander("🤖 Claude API Settings (recommended for quality)", expanded=True):
        st.markdown("""
        **Without a Claude API key:** Rule-based injection is used. Faster and free,
        but output can be grammatically awkward.

        **With a Claude API key:** Bullets and summary are rewritten naturally by
        Claude Sonnet 4.5. Professional-quality output. Costs ~$0.01-0.03 per resume.

        Get an API key at: [console.anthropic.com](https://console.anthropic.com)
        """)
        # Try env variable / Streamlit secrets first
        default_key = ""
        try:
            default_key = st.secrets.get("ANTHROPIC_API_KEY", "")
        except Exception:
            pass
        if not default_key:
            default_key = os.environ.get("ANTHROPIC_API_KEY", "")

        api_key = st.text_input(
            "Anthropic API Key",
            value=default_key,
            type="password",
            placeholder="sk-ant-...",
            help="Your API key is only used in this session and is never stored or logged.",
        )
        use_llm = st.checkbox(
            "Use Claude to rewrite bullets (recommended)",
            value=bool(api_key),
            disabled=not api_key,
        )

    jd_text_resume = st.text_area(
        "Job Description",
        height=300,
        placeholder="Paste the full job description here...",
        key="jd_resume",
    )

    col_opts1, col_opts2 = st.columns(2)
    with col_opts1:
        target_score = st.slider("Target match score (%)", 50, 95, 75, 5)
    with col_opts2:
        output_format = st.selectbox("Output format", ["PDF", "DOCX", "Both"])

    if st.button("🚀 Optimize Resume", type="primary", disabled=not jd_text_resume.strip()):
        with st.spinner("Analyzing and optimizing..." +
                         (" (Claude is rewriting bullets — 10-30 seconds...)" if use_llm else "")):
            # Baseline
            resume_text = resume_to_plain_text()
            _, _, baseline_report = analyze_match(resume_text, jd_text_resume)

            # Set up LLM rewriter if enabled
            llm_rewriter = None
            if use_llm and api_key and _LLM_AVAILABLE:
                try:
                    llm_rewriter = LLMRewriter(api_key=api_key)
                except Exception as e:
                    st.error(f"Failed to initialize Claude API: {e}")
                    llm_rewriter = None

            # Optimize
            optimizer = ResumeOptimizer(target_score=target_score, llm_rewriter=llm_rewriter)
            optimized, baseline_score, final_score, final_report, changes = optimizer.optimize(jd_text_resume)

            # Generate files
            pdf_buf, docx_buf = generate_resume_files(optimized)

        # --- Results ---
        st.divider()

        # Score comparison
        col_before, col_arrow, col_after = st.columns([2, 1, 2])
        with col_before:
            st.markdown(score_html(baseline_score, "BEFORE"), unsafe_allow_html=True)
        with col_arrow:
            improvement = final_score - baseline_score
            st.markdown(f"""
            <div style="text-align:center; padding-top: 1rem;">
                <span style="font-size:2rem;">→</span><br>
                <span style="color:#22c55e; font-weight:600;">+{improvement:.1f}%</span>
            </div>
            """, unsafe_allow_html=True)
        with col_after:
            st.markdown(score_html(final_score, "AFTER"), unsafe_allow_html=True)

        st.divider()

        # Category breakdown
        col_cats, col_changes = st.columns(2)

        with col_cats:
            st.subheader("Category Breakdown")
            for cat_key in ["hard_skills", "soft_skills", "job_titles", "education",
                            "certifications", "industry_terms", "action_verbs"]:
                if cat_key in final_report["by_category"]:
                    cat = final_report["by_category"][cat_key]
                    label = CATEGORY_LABELS.get(cat_key, cat_key)
                    pct = cat["score"]
                    st.progress(min(pct / 100, 1.0), text=f"{label}: {pct:.0f}% ({cat['matched']}/{cat['total']})")

        with col_changes:
            st.subheader("Changes Made")
            if changes:
                for i, change in enumerate(changes, 1):
                    st.markdown(f"**{i}.** {change}")
            else:
                st.info("No changes needed — already above target!")

        # Missing keywords
        if final_report["missing_keywords"]:
            with st.expander(f"Remaining missing keywords ({len(final_report['missing_keywords'])})"):
                for kw in final_report["missing_keywords"]:
                    imp = kw["importance"]
                    level = "🔴" if imp >= 3.0 else "🟡" if imp >= 1.5 else "⚪"
                    cat_label = CATEGORY_LABELS.get(kw["category"], kw["category"])
                    st.write(f"{level} **{kw['keyword']}** — {cat_label}")

        # Download buttons
        st.divider()
        st.subheader("Download Optimized Resume")
        col_dl1, col_dl2 = st.columns(2)
        with col_dl1:
            st.download_button(
                "📥 Download PDF",
                data=pdf_buf,
                file_name="tailored_resume.pdf",
                mime="application/pdf",
                use_container_width=True,
            )
        with col_dl2:
            st.download_button(
                "📥 Download DOCX",
                data=docx_buf,
                file_name="tailored_resume.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                use_container_width=True,
            )


# ===================================================================
# TAB 2: COVER LETTER
# ===================================================================
with tab_cover_letter:
    st.header("Cover Letter Generator")
    st.write("Paste a job description. The tool extracts qualification bullets and generates a tailored cover letter matching your template.")

    jd_text_cl = st.text_area(
        "Job Description",
        height=300,
        placeholder="Paste the full job description here...",
        key="jd_cl",
    )

    col_cl1, col_cl2, col_cl3 = st.columns(3)
    with col_cl1:
        company = st.text_input("Company Name", placeholder="e.g., Brex")
    with col_cl2:
        title = st.text_input("Job Title", placeholder="e.g., Data Analyst III")
    with col_cl3:
        source = st.text_input("Source", value="LinkedIn", placeholder="e.g., LinkedIn")

    col_cl4, col_cl5 = st.columns(2)
    with col_cl4:
        posting_date = st.text_input("Posting Month/Year (optional)", placeholder="e.g., April 2026")
    with col_cl5:
        pass  # spacer

    can_generate = jd_text_cl.strip() and company.strip() and title.strip()

    if st.button("✉️ Generate Cover Letter", type="primary", disabled=not can_generate):
        with st.spinner("Generating cover letter..."):
            cl_data = generate_cover_letter(
                jd_text_cl,
                company.strip(),
                title.strip(),
                source=source.strip() or "LinkedIn",
                posting_date=posting_date.strip() or None,
            )
            pdf_buf, docx_buf = generate_cl_files(cl_data)

        st.divider()

        # Preview
        st.subheader("Preview")

        st.markdown(f"**{cl_data['date']}**")
        st.write("Dear Hiring Manager,")
        st.write(cl_data["intro_paragraph"])
        st.write(cl_data["background_paragraph"])
        st.write("Here is a breakdown of my experience vs. your requirements:")

        # Table preview
        table_data = {
            cl_data["table_header_left"]: cl_data["jd_bullets"],
            cl_data["table_header_right"]: cl_data["exp_bullets"],
        }
        # Pad to same length
        max_len = max(len(cl_data["jd_bullets"]), len(cl_data["exp_bullets"]))
        jd_col = cl_data["jd_bullets"] + [""] * (max_len - len(cl_data["jd_bullets"]))
        exp_col = cl_data["exp_bullets"] + [""] * (max_len - len(cl_data["exp_bullets"]))

        import pandas as pd
        df = pd.DataFrame({
            cl_data["table_header_left"]: jd_col,
            cl_data["table_header_right"]: exp_col,
        })
        st.table(df)

        st.write(cl_data["closing_paragraph"])
        st.write(f"**{cl_data['sign_off']}**")
        st.write(f"**{cl_data['name']}**")

        # Download
        st.divider()
        st.subheader("Download Cover Letter")
        col_dl1, col_dl2 = st.columns(2)
        with col_dl1:
            st.download_button(
                "📥 Download PDF",
                data=pdf_buf,
                file_name="tailored_cover_letter.pdf",
                mime="application/pdf",
                use_container_width=True,
            )
        with col_dl2:
            st.download_button(
                "📥 Download DOCX",
                data=docx_buf,
                file_name="tailored_cover_letter.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                use_container_width=True,
            )


# ===================================================================
# TAB 3: ANALYZE ONLY
# ===================================================================
with tab_analyze:
    st.header("Analyze Resume vs JD")
    st.write("Score your current resume against a job description — no optimization, just the raw analysis.")

    jd_text_analyze = st.text_area(
        "Job Description",
        height=300,
        placeholder="Paste the full job description here...",
        key="jd_analyze",
    )

    if st.button("🔍 Analyze", type="primary", disabled=not jd_text_analyze.strip()):
        with st.spinner("Analyzing..."):
            resume_text = resume_to_plain_text()
            _, jd_keywords, report = analyze_match(resume_text, jd_text_analyze)

        st.divider()

        # Score
        st.markdown(score_html(report["overall_score"], "MATCH SCORE"), unsafe_allow_html=True)
        st.markdown(f"<div class='metric-label'>{report['total_matched']}/{report['total_keywords']} keywords matched</div>", unsafe_allow_html=True)

        st.divider()

        # Category breakdown
        col_a1, col_a2 = st.columns(2)

        with col_a1:
            st.subheader("Category Breakdown")
            for cat_key in ["hard_skills", "soft_skills", "job_titles", "education",
                            "certifications", "industry_terms", "action_verbs"]:
                if cat_key in report["by_category"]:
                    cat = report["by_category"][cat_key]
                    label = CATEGORY_LABELS.get(cat_key, cat_key)
                    pct = cat["score"]
                    st.progress(min(pct / 100, 1.0), text=f"{label}: {pct:.0f}% ({cat['matched']}/{cat['total']})")

        with col_a2:
            st.subheader("Matched Keywords")
            for kw in report["matched_keywords"][:20]:
                cat_label = CATEGORY_LABELS.get(kw["category"], kw["category"])
                st.write(f"✅ **{kw['keyword']}** — {cat_label}")

        # Missing keywords
        if report["missing_keywords"]:
            st.subheader("Missing Keywords")
            col_miss1, col_miss2 = st.columns(2)
            half = len(report["missing_keywords"]) // 2
            with col_miss1:
                for kw in report["missing_keywords"][:half]:
                    imp = kw["importance"]
                    level = "🔴 HIGH" if imp >= 3.0 else "🟡 MED" if imp >= 1.5 else "⚪ LOW"
                    cat_label = CATEGORY_LABELS.get(kw["category"], kw["category"])
                    st.write(f"{level}: **{kw['keyword']}** — {cat_label}")
            with col_miss2:
                for kw in report["missing_keywords"][half:]:
                    imp = kw["importance"]
                    level = "🔴 HIGH" if imp >= 3.0 else "🟡 MED" if imp >= 1.5 else "⚪ LOW"
                    cat_label = CATEGORY_LABELS.get(kw["category"], kw["category"])
                    st.write(f"{level}: **{kw['keyword']}** — {cat_label}")


# ---------------------------------------------------------------------------
# Sidebar
# ---------------------------------------------------------------------------
with st.sidebar:
    st.markdown("### How to use")
    st.markdown("""
    1. **Optimize Resume** — Paste a JD, get a keyword-optimized resume (PDF/DOCX)
    2. **Cover Letter** — Paste a JD + company/title, get a tailored cover letter
    3. **Analyze Only** — See your raw match score without changes
    """)

    st.divider()

    st.markdown("### Scoring Methodology")
    st.markdown("""
    Mirrors **Jobscan's** keyword matching:
    - **Hard Skills** (3.0x weight) — tools, tech, languages
    - **Job Titles** (2.5x) — role name matches
    - **Education** (2.0x) — degree, certifications
    - **Soft Skills** (1.5x) — communication, leadership
    - **Industry Terms** (1.5x) — domain language
    - **Action Verbs** (0.5x) — responsibility verbs
    """)

    st.divider()

    st.markdown("### CLI Usage")
    st.code("""python -m resume_tailor analyze --jd-file jd.txt
python -m resume_tailor resume --jd-file jd.txt
python -m resume_tailor cover-letter \\
  --jd-file jd.txt -c "Brex" -t "Data Analyst III"
""", language="bash")

    st.divider()
    st.caption(f"App version: {_APP_VERSION}")
