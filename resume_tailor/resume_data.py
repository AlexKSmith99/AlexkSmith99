"""
Structured master resume data for Alexander Smith.

This module contains the parsed resume in a structured format that the
optimizer and cover letter generator can work with programmatically.
"""

MASTER_RESUME = {
    "name": "ALEXANDER SMITH",
    "contact": {
        "location": "New York, NY",
        "phone": "917-359-0833",
        "email": "alex.k.smith99@gmail.com",
        "linkedin": "linkedin.com/in/alexander-k-smith99",
        "github": "github.com/AlexKSmith99",
        "portfolio": "alexanderksmith.carrd.co",
    },
    "profile": {
        "title": "Data Analyst",
        "summary": (
            "Experienced data analyst with a proven track record of integrating "
            "business strategies and data analytics to provide actionable insights. "
            "Adaptable problem-solver, leveraging collaborative, storytelling and "
            "analytical skills to create impactful dashboards and deliver "
            "data-driven solutions."
        ),
        "core_competencies": [
            "SQL",
            "Python (Pandas, Numpy)",
            "Microsoft Excel",
            "Tableau",
            "GitHub",
            "AWS/GCP",
            "Snowflake",
            "ETL",
            "DBT",
        ],
    },
    "experience": [
        {
            "company": "HEALTHFIRST INC.",
            "location": "New York, NY",
            "dates": "2025 \u2013 Present",
            "company_short": "Healthfirst",
            "description": (
                "Healthfirst is the #1 private, not-for-profit health insurer "
                "in New York, serving 2M+ members."
            ),
            "title": "Sales and Customer Data Analyst",
            "work_type": "on-site",
            "summary": (
                "Provide support through data modeling automation, dashboarding, "
                "and business strategy to Medicare, Medicaid, Sales, Marketing "
                "and Product stakeholders. Work within the sales & customer "
                "analytics team within Enterprise Analytics."
            ),
            "bullets": [
                (
                    "Built and launched a Tableau dashboard using custom SQL "
                    "analysis to assess our go-to-market strategy for Medicare "
                    "plans across 7 counties that identified 25 high-opportunity "
                    "neighborhoods to target."
                ),
                (
                    "Built and presented a strategic PowerPoint deck to Sales "
                    "and Medicare leadership; recommendations were adopted into "
                    "a 3-year expansion plan backed by a $200K budget to grow "
                    "sales and marketing across 15 priority neighborhoods."
                ),
                (
                    "Automated Medicare enrollment reporting by migrating manual "
                    "Alteryx ETL process into DBT using PostgreSQL; built 3 data "
                    "models that saved roughly 10 hours of manual work each month."
                ),
                (
                    "Leveraged PostgreSQL to segment 7,000 Medicare members "
                    "eligible for PACE services into priority outreach groups "
                    "based on key member criteria; presented an insights report "
                    "to the sales team that helped drive a 20% conversion rate."
                ),
            ],
            "skills_used": [
                "Tableau", "SQL", "PostgreSQL", "PowerPoint", "DBT", "ETL",
                "Alteryx", "Data Modeling", "Dashboarding", "Business Strategy",
                "Stakeholder Management", "Data Analysis", "Reporting",
                "Automation", "Go-To-Market",
            ],
        },
        {
            "company": "CANON USA",
            "location": "Melville, NY",
            "dates": "2023 \u2013 2024",
            "company_short": "Canon USA",
            "description": None,
            "title": "Market Research and Data Analyst",
            "work_type": "on-site",
            "summary": (
                "Analyzed customer behavior and market trends and provided "
                "support through data analysis and business strategy to "
                "marketing, sales, and product teams. Worked within the data "
                "science team in the marketing department."
            ),
            "bullets": [
                (
                    "Built and launched Tableau dashboard, conducting data "
                    "transformation in SQL, providing insights and "
                    "recommendations on 3 product launches to the executive "
                    "board, increasing sales from previous launches by 10%."
                ),
                (
                    "Created and presented a PowerPoint to marketing executives "
                    "highlighting actionable insights for a marketing strategy "
                    "brief; 4 recommendations were adopted."
                ),
                (
                    "Developed SQL script automation using Airflow, which "
                    "identified and removed 22 unlicensed Amazon Canon product "
                    "listings, decreasing unauthorized competition by 100%."
                ),
                (
                    "Built website metrics dashboard in Looker Studio using "
                    "Google Analytics data collected from website cookies, "
                    "resulting in 25% more users signing up for Canon "
                    "memberships, increasing overall sales by 5% within 3 months."
                ),
                (
                    "Managed project to assess 8 e-commerce analytics services "
                    "for marketing and sales data capabilities and accuracy, "
                    "onboarding 2. Built out Excel model and led weekly and "
                    "monthly performance analysis for AMZ and BestBuy channels."
                ),
            ],
            "skills_used": [
                "Tableau", "SQL", "Airflow", "Looker Studio", "Google Analytics",
                "PowerPoint", "Excel", "Data Transformation", "Data Analysis",
                "Market Research", "E-Commerce", "Product Launch",
                "Stakeholder Management", "Automation", "Reporting",
            ],
        },
        {
            "company": "RAZOR USA LLC",
            "location": "Cerritos, CA",
            "dates": "2021 \u2013 2022",
            "company_short": "Razor USA",
            "description": (
                "The number one kick and kid electric scooter manufacturer "
                "in the world."
            ),
            "title": "Performance Marketing Data Analyst",
            "work_type": "remote",
            "summary": (
                "Identified KPIs relevant to business objectives in Excel "
                "using pivot tables, forecasting, and data visualization tools. "
                "Prepared reports of sales, marketing, and SEO data from market "
                "research platforms. Worked directly under the president."
            ),
            "bullets": [
                (
                    "Designed and implemented an SEO and advertising campaign "
                    "that countered competitor efforts on Amazon, obtaining the "
                    "top search result ranking for key terms and generating "
                    "$58K in profits per month."
                ),
                (
                    "Researched and identified major customer complaints, "
                    "spearheading redesign and re-release of 3 poorly designed "
                    "Razor products."
                ),
                (
                    "Created an Excel database and launched a social media "
                    "performance tracking report for Razor\u2019s Meta, YouTube, "
                    "Instagram, and Twitter statistics and channels."
                ),
                (
                    "Presented market share findings and recommendations to the "
                    "president, marketing managers, and sales team in weekly and "
                    "monthly meetings, providing strategic initiatives that "
                    "drove executive decision making."
                ),
            ],
            "skills_used": [
                "Excel", "Pivot Tables", "SEO", "KPIs", "Data Visualization",
                "Market Research", "Forecasting", "Reporting",
                "Presentation Skills", "Competitive Analysis",
            ],
        },
    ],
    "education": {
        "degree": "Bachelor of Science",
        "field": "Business Administration and Business Analytics",
        "honors": "GPA: Dean's List (6 semesters)",
        "school": "BUCKNELL UNIVERSITY",
        "location": "Lewisburg, PA",
        "year": "2021",
        "coursework": [
            "Business Analytics", "Sports Analytics",
            "Quantitative Reasoning", "Operations Management",
            "Marketing Management", "Computer Science",
            "Mathematics", "Calculus", "Statistics",
            "Economics", "Accounting", "Corporate Finance",
        ],
    },
    "professional_development": {
        "program": "Data Analytics Program",
        "school": "FULLSTACK ACADEMY",
        "location": "New York, NY",
        "dates": "01/2023 \u2013 04/2023",
        "description": (
            "Completed 10-week intensive data analytics program from a "
            "well-regarded coding bootcamp."
        ),
        "bullets": [
            (
                "Cleaned and analyzed large data sets using advanced analytics "
                "in Excel, SQL, and Python."
            ),
            (
                "Identified trends and KPIs to answer business objectives and "
                "drive informed decision-making processes."
            ),
            (
                "Communicated insights to class by creating dashboards and "
                "presentations in Tableau and PowerPoint."
            ),
        ],
    },
}


def get_all_companies():
    """Return list of company short names."""
    return [job["company_short"] for job in MASTER_RESUME["experience"]]


def get_skills_by_company():
    """Return a dict mapping company_short -> set of skills used."""
    return {
        job["company_short"]: set(job["skills_used"])
        for job in MASTER_RESUME["experience"]
    }


def find_companies_for_skill(skill):
    """Find which companies a skill was used at."""
    skill_lower = skill.lower()
    companies = []
    for job in MASTER_RESUME["experience"]:
        job_skills_lower = {s.lower() for s in job["skills_used"]}
        # Also check bullets text for implicit skill mentions
        bullets_text = " ".join(job["bullets"]).lower()
        summary_text = job["summary"].lower()
        all_text = bullets_text + " " + summary_text

        if skill_lower in job_skills_lower or skill_lower in all_text:
            companies.append(job["company_short"])

    return companies if companies else get_all_companies()[:2]


def resume_to_plain_text(resume=None):
    """Convert structured resume to plain text for keyword matching."""
    r = resume or MASTER_RESUME
    lines = []

    # Header
    lines.append(r["name"])
    c = r["contact"]
    lines.append(
        f"{c['location']}  \u25aa  {c['phone']}  \u25aa  {c['email']}"
    )
    lines.append(
        f"{c['linkedin']}  \u25aa  {c['github']}  \u25aa  {c['portfolio']}"
    )
    lines.append("")

    # Profile
    lines.append("PROFESSIONAL PROFILE")
    lines.append(r["profile"]["title"])
    lines.append(r["profile"]["summary"])
    lines.append(
        "Core Competencies: "
        + "  ".join(r["profile"]["core_competencies"])
    )
    lines.append("")

    # Experience
    lines.append("WORK EXPERIENCE")
    for job in r["experience"]:
        lines.append(f"{job['company']}, {job['location']}  {job['dates']}")
        if job.get("description"):
            lines.append(job["description"])
        lines.append(f"{job['title']} ({job['work_type']})")
        lines.append(job["summary"])
        for bullet in job["bullets"]:
            lines.append(f"\u2022 {bullet}")
        lines.append("")

    # Education
    lines.append("EDUCATION")
    edu = r["education"]
    lines.append(
        f"{edu['degree']}, {edu['field']}, {edu['honors']}"
    )
    lines.append(f"{edu['school']}, {edu['location']} ({edu['year']})")
    lines.append("Relevant coursework: " + ", ".join(edu["coursework"]) + ".")
    lines.append("")

    # Professional Development
    lines.append("PROFESSIONAL DEVELOPMENT")
    pd = r["professional_development"]
    lines.append(f"{pd['program']}, {pd['school']}, {pd['location']} ({pd['dates']})")
    lines.append(pd["description"])
    for bullet in pd["bullets"]:
        lines.append(f"\u2022 {bullet}")

    return "\n".join(lines)
