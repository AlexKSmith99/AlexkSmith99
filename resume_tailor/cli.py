"""
CLI entry point for the Resume Tailor tool.

Usage:
    python -m resume_tailor resume --jd-file jd.txt --format pdf
    python -m resume_tailor resume --jd-file jd.txt --format docx
    python -m resume_tailor cover-letter --jd-file jd.txt --company "Brex" --title "Data Analyst III"
    python -m resume_tailor analyze --jd-file jd.txt   (score only, no output file)
"""

import argparse
import copy
import os
import sys
import textwrap

from .analyzer import JobscanAnalyzer, analyze_match
from .cover_letter import generate_cover_letter
from .formatter import (
    generate_cover_letter_docx,
    generate_cover_letter_pdf,
    generate_resume_docx,
    generate_resume_pdf,
)
from .template_formatter import generate_resume_from_template
from .optimizer import ResumeOptimizer
from .resume_data import MASTER_RESUME, resume_to_plain_text


# ---------------------------------------------------------------------------
# Display helpers
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


def print_banner():
    print("\n" + "=" * 60)
    print("   RESUME TAILOR — Jobscan-Style Keyword Matcher")
    print("=" * 60)


def print_report(report, label="ANALYSIS"):
    """Print a formatted Jobscan-style report."""
    print(f"\n{'─' * 50}")
    print(f"  {label}")
    print(f"{'─' * 50}")

    score = report["overall_score"]
    bar_len = 30
    filled = int(bar_len * score / 100)
    bar = "█" * filled + "░" * (bar_len - filled)
    color = "\033[92m" if score >= 75 else "\033[93m" if score >= 50 else "\033[91m"
    reset = "\033[0m"
    print(f"\n  Overall Match: {color}{score:.1f}%{reset}  [{bar}]")

    print(f"\n  Keywords: {report['total_matched']}/{report['total_keywords']} matched")
    print()

    # Category breakdown
    print("  Category Breakdown:")
    print(f"  {'Category':<20} {'Score':>7} {'Matched':>10}")
    print(f"  {'─' * 40}")
    for cat_key in ["hard_skills", "soft_skills", "job_titles", "education",
                     "certifications", "industry_terms", "action_verbs"]:
        if cat_key in report["by_category"]:
            cat = report["by_category"][cat_key]
            label = CATEGORY_LABELS.get(cat_key, cat_key)
            print(f"  {label:<20} {cat['score']:>6.1f}% {cat['matched']:>4}/{cat['total']}")

    # Missing keywords (top 15)
    if report["missing_keywords"]:
        print(f"\n  Top Missing Keywords (by importance):")
        for i, kw in enumerate(report["missing_keywords"][:15]):
            imp = kw["importance"]
            level = "HIGH" if imp >= 3.0 else "MED" if imp >= 1.5 else "LOW"
            cat_label = CATEGORY_LABELS.get(kw["category"], kw["category"])
            print(f"    [{level:>4}] {kw['keyword']:<30} ({cat_label})")

    print()


def print_changes(changes):
    """Print optimization changes log."""
    if not changes:
        return
    print(f"\n  Changes Made:")
    print(f"  {'─' * 45}")
    for i, change in enumerate(changes, 1):
        print(f"    {i}. {change}")
    print()


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------
def cmd_analyze(jd_text):
    """Analyze current resume against a JD (no optimization)."""
    print_banner()
    resume_text = resume_to_plain_text()
    _, jd_keywords, report = analyze_match(resume_text, jd_text)
    print_report(report, "BASELINE ANALYSIS (before optimization)")


def cmd_resume(jd_text, output_format, output_path, target_score):
    """Optimize resume and generate output file."""
    print_banner()

    # Baseline analysis
    resume_text = resume_to_plain_text()
    _, _, baseline_report = analyze_match(resume_text, jd_text)
    print_report(baseline_report, "BASELINE SCORE (before optimization)")

    # Optimize
    print("  Optimizing resume to hit target score...")
    optimizer = ResumeOptimizer(target_score=target_score)
    optimized, baseline_score, final_score, final_report, changes = optimizer.optimize(jd_text)

    print_changes(changes)
    print_report(final_report, "OPTIMIZED SCORE")

    # Generate output — use template-based formatter for .docx (preserves exact design)
    if output_format == "pdf":
        # Generate .docx from template, user converts to PDF in Word/Google Docs
        if not output_path:
            output_path = "tailored_resume.docx"
        generate_resume_from_template(optimized, output_path)
        print(f"\n  NOTE: Output is .docx (preserves your exact resume design).")
        print(f"  To get PDF: open in Word/Google Docs → File → Export/Download as PDF")
    elif output_format == "docx":
        if not output_path:
            output_path = "tailored_resume.docx"
        generate_resume_from_template(optimized, output_path)
    elif output_format == "both":
        docx_path = output_path or "tailored_resume.docx"
        if docx_path.endswith(".pdf"):
            docx_path = docx_path.rsplit(".", 1)[0] + ".docx"
        generate_resume_from_template(optimized, docx_path)
        print(f"  Output saved to: {docx_path}")
        print(f"  To get PDF: open in Word/Google Docs → File → Export/Download as PDF")
        improvement = final_score - baseline_score
        print(f"  Score: {baseline_score:.1f}% → {final_score:.1f}% (+{improvement:.1f}%)")
        return

    if not output_path:
        output_path = "tailored_resume.docx"
    print(f"  Output saved to: {output_path}")
    improvement = final_score - baseline_score
    print(f"  Score: {baseline_score:.1f}% → {final_score:.1f}% (+{improvement:.1f}%)")


def cmd_cover_letter(jd_text, company, title, source, output_format,
                      output_path, posting_date):
    """Generate a tailored cover letter."""
    print_banner()
    print(f"\n  Generating cover letter for: {title} at {company}")
    print(f"  Source: {source}")

    cl_data = generate_cover_letter(
        jd_text, company, title,
        source=source, posting_date=posting_date,
    )

    # Display extracted requirements
    print(f"\n  Extracted Requirements ({len(cl_data['jd_bullets'])} bullets):")
    for i, (jd_b, exp_b) in enumerate(
        zip(cl_data["jd_bullets"], cl_data["exp_bullets"]), 1
    ):
        print(f"\n    JD Req {i}:")
        for line in textwrap.wrap(jd_b, width=70):
            print(f"      {line}")
        print(f"    My Exp {i}:")
        for line in textwrap.wrap(exp_b, width=70):
            print(f"      {line}")

    # Generate output
    if output_format == "pdf":
        if not output_path:
            output_path = "tailored_cover_letter.pdf"
        generate_cover_letter_pdf(cl_data, output_path)
    elif output_format == "docx":
        if not output_path:
            output_path = "tailored_cover_letter.docx"
        generate_cover_letter_docx(cl_data, output_path)
    elif output_format == "both":
        pdf_path = output_path or "tailored_cover_letter.pdf"
        docx_path = pdf_path.rsplit(".", 1)[0] + ".docx"
        generate_cover_letter_pdf(cl_data, pdf_path)
        generate_cover_letter_docx(cl_data, docx_path)
        print(f"\n  Output saved to: {pdf_path} and {docx_path}")
        return

    print(f"\n  Output saved to: {output_path}")


# ---------------------------------------------------------------------------
# CLI Parser
# ---------------------------------------------------------------------------
def build_parser():
    parser = argparse.ArgumentParser(
        prog="resume_tailor",
        description="Jobscan-style resume keyword matcher and cover letter tailor",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent("""\
            Examples:
              python -m resume_tailor analyze --jd-file jd.txt
              python -m resume_tailor resume --jd-file jd.txt --format pdf
              python -m resume_tailor resume --jd-file jd.txt --format both --target 80
              python -m resume_tailor cover-letter --jd-file jd.txt --company "Brex" --title "Data Analyst III"
              python -m resume_tailor cover-letter --jd-file jd.txt --company "Google" --title "Data Analyst" --format docx
        """),
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # --- analyze ---
    p_analyze = subparsers.add_parser(
        "analyze", help="Analyze resume vs JD (score only, no file output)"
    )
    _add_jd_args(p_analyze)

    # --- resume ---
    p_resume = subparsers.add_parser(
        "resume", help="Optimize resume and generate tailored output"
    )
    _add_jd_args(p_resume)
    p_resume.add_argument(
        "--format", choices=["pdf", "docx", "both"], default="pdf",
        help="Output format (default: pdf)"
    )
    p_resume.add_argument("--output", "-o", help="Output file path")
    p_resume.add_argument(
        "--target", type=int, default=75,
        help="Target match score %% (default: 75)"
    )

    # --- cover-letter ---
    p_cl = subparsers.add_parser(
        "cover-letter", help="Generate a tailored cover letter"
    )
    _add_jd_args(p_cl)
    p_cl.add_argument("--company", "-c", required=True, help="Company name")
    p_cl.add_argument("--title", "-t", required=True, help="Job title")
    p_cl.add_argument(
        "--source", "-s", default="LinkedIn",
        help="Where you found the posting (default: LinkedIn)"
    )
    p_cl.add_argument(
        "--posting-date", help="Month/Year of posting (e.g., 'April 2026')"
    )
    p_cl.add_argument(
        "--format", choices=["pdf", "docx", "both"], default="pdf",
        help="Output format (default: pdf)"
    )
    p_cl.add_argument("--output", "-o", help="Output file path")

    return parser


def _add_jd_args(parser):
    """Add JD input arguments to a subparser."""
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--jd-file", help="Path to job description text file")
    group.add_argument("--jd", help="Job description text (inline)")


def _read_jd(args):
    """Read JD text from args."""
    if args.jd_file:
        with open(args.jd_file, "r", encoding="utf-8") as f:
            return f.read()
    return args.jd


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = build_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    jd_text = _read_jd(args)

    if args.command == "analyze":
        cmd_analyze(jd_text)
    elif args.command == "resume":
        cmd_resume(jd_text, args.format, args.output, args.target)
    elif args.command == "cover-letter":
        cmd_cover_letter(
            jd_text, args.company, args.title, args.source,
            args.format, args.output, args.posting_date,
        )


if __name__ == "__main__":
    main()
