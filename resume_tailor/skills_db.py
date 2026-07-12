"""
Comprehensive skills database for Jobscan-style keyword identification.

Organized by category with synonym/variant mappings for flexible matching.
Focused on data analytics / business intelligence domain but broadly applicable.
"""

# ---------------------------------------------------------------------------
# Hard Skills — tools, technologies, programming languages, platforms
# Each entry is the canonical form. Variants/synonyms are in SKILL_VARIANTS.
# ---------------------------------------------------------------------------
HARD_SKILLS = {
    # Programming & Query Languages
    "SQL", "Python", "R", "Java", "JavaScript", "Scala", "SAS", "MATLAB",
    "Julia", "C++", "C#", "Go", "Ruby", "Perl", "Bash", "Shell Scripting",
    "VBA", "DAX", "MDX", "HQL", "PL/SQL", "T-SQL", "NoSQL",

    # Python Libraries & Frameworks
    "Pandas", "NumPy", "scikit-learn", "SciPy", "Matplotlib", "Seaborn",
    "Plotly", "TensorFlow", "PyTorch", "Keras", "XGBoost", "LightGBM",
    "NLTK", "spaCy", "statsmodels", "PySpark", "Flask", "Django",
    "FastAPI", "Streamlit", "Airflow", "Luigi", "Prefect", "Dagster",

    # Data Visualization & BI
    "Tableau", "Power BI", "Looker", "Looker Studio", "Google Data Studio",
    "Qlik", "QlikView", "Qlik Sense", "MicroStrategy", "Sisense",
    "Mode Analytics", "Metabase", "Periscope", "Hex", "Observable",
    "D3.js", "Grafana", "Kibana",

    # Databases & Data Warehouses
    "PostgreSQL", "MySQL", "SQL Server", "Oracle", "MongoDB", "Cassandra",
    "Redis", "DynamoDB", "Elasticsearch", "Neo4j", "Snowflake", "BigQuery",
    "Redshift", "Databricks", "Teradata", "Vertica", "Hive", "Presto",
    "Trino", "ClickHouse", "Apache Druid", "Synapse",

    # Cloud Platforms & Services
    "AWS", "GCP", "Azure", "Google Cloud", "Amazon Web Services",
    "S3", "EC2", "Lambda", "Glue", "Athena", "EMR",
    "Cloud Functions", "Cloud Storage", "Cloud Composer",
    "Azure Data Factory", "Azure Synapse", "Azure DevOps",

    # ETL / Data Engineering
    "ETL", "ELT", "DBT", "dbt", "Informatica", "Talend", "SSIS",
    "Fivetran", "Stitch", "Airbyte", "Matillion", "Alteryx",
    "Apache Spark", "Apache Kafka", "Apache Beam", "Apache Flink",
    "Apache NiFi", "Meltano",

    # Spreadsheets & Office
    "Excel", "Microsoft Excel", "Google Sheets", "Pivot Tables",
    "VLOOKUP", "Power Query", "Power Pivot", "Microsoft Office",
    "PowerPoint", "Google Slides", "Word",

    # Version Control & Dev Tools
    "Git", "GitHub", "GitLab", "Bitbucket", "Docker", "Kubernetes",
    "Jenkins", "CI/CD", "Terraform", "Ansible",

    # Data Science & ML Concepts (as tool-adjacent skills)
    "Machine Learning", "Deep Learning", "Natural Language Processing",
    "NLP", "Computer Vision", "Neural Networks", "Random Forest",
    "Logistic Regression", "Linear Regression", "Decision Trees",
    "Clustering", "Classification", "Regression Analysis",
    "Time Series Analysis", "Forecasting", "Predictive Modeling",
    "Statistical Modeling", "A/B Testing", "Hypothesis Testing",
    "Bayesian Analysis",

    # Data Concepts & Methodologies
    "Data Modeling", "Data Warehousing", "Data Pipeline", "Data Pipelines",
    "Data Governance", "Data Quality", "Data Cleaning", "Data Wrangling",
    "Data Mining", "Data Engineering", "Data Architecture",
    "Data Catalog", "Data Lake", "Data Lakehouse", "Data Mesh",
    "Dimensional Modeling", "Star Schema", "Snowflake Schema",
    "Data Transformation", "Data Integration", "Data Migration",
    "Data Visualization", "Data Analysis", "Data Analytics",
    "Business Intelligence", "Business Analytics",
    "Reporting", "Dashboarding", "Dashboard Development",

    # Analytics & Marketing Tools
    "Google Analytics", "Adobe Analytics", "Mixpanel", "Amplitude",
    "Segment", "Heap", "Hotjar", "Salesforce", "HubSpot",
    "Marketo", "Google Ads", "Facebook Ads", "SEO", "SEM",

    # Project & Collaboration
    "Jira", "Confluence", "Asana", "Trello", "Slack", "Notion",
    "Monday.com", "Airtable", "Smartsheet",

    # Statistical & Research
    "SPSS", "Stata", "Minitab", "JMP", "Survey Design",
    "Experimental Design", "Causal Inference",

    # Compliance & Security
    "HIPAA", "GDPR", "SOX", "PCI DSS",

    # Methodologies
    "Agile", "Scrum", "Kanban", "Waterfall", "Lean", "Six Sigma",
    "OKRs", "KPIs",
}

# ---------------------------------------------------------------------------
# Soft Skills
# ---------------------------------------------------------------------------
SOFT_SKILLS = {
    "Communication", "Written Communication", "Verbal Communication",
    "Presentation Skills", "Public Speaking",
    "Leadership", "Team Leadership", "People Management",
    "Problem Solving", "Problem-Solving", "Critical Thinking",
    "Analytical Thinking", "Analytical Skills", "Strategic Thinking",
    "Collaboration", "Cross-Functional Collaboration", "Teamwork",
    "Stakeholder Management", "Stakeholder Engagement",
    "Project Management", "Time Management", "Prioritization",
    "Attention to Detail", "Detail-Oriented",
    "Adaptability", "Flexibility", "Resilience",
    "Creativity", "Innovation", "Innovative",
    "Decision Making", "Decision-Making",
    "Mentoring", "Coaching", "Training",
    "Relationship Building", "Interpersonal Skills",
    "Conflict Resolution", "Negotiation",
    "Self-Motivated", "Self-Starter", "Initiative",
    "Storytelling", "Data Storytelling",
    "Customer Focus", "Client-Facing", "Client Management",
    "Organizational Skills", "Multi-Tasking",
    "Results-Driven", "Results-Oriented", "Goal-Oriented",
    "Fast-Paced Environment", "Deadline-Driven",
    "Curiosity", "Intellectual Curiosity", "Continuous Learning",
    "Ownership", "Accountability",
}

# ---------------------------------------------------------------------------
# Education Keywords
# ---------------------------------------------------------------------------
EDUCATION_KEYWORDS = {
    "Bachelor's", "Bachelor", "BS", "BA", "B.S.", "B.A.",
    "Master's", "Master", "MS", "MA", "M.S.", "M.A.", "MBA",
    "PhD", "Ph.D.", "Doctorate",
    "Computer Science", "Data Science", "Statistics", "Mathematics",
    "Economics", "Engineering", "Business Administration",
    "Business Analytics", "Information Systems", "Information Technology",
    "Quantitative Finance", "Operations Research",
}

# ---------------------------------------------------------------------------
# Certifications
# ---------------------------------------------------------------------------
CERTIFICATIONS = {
    "AWS Certified", "Google Cloud Certified", "Azure Certified",
    "Certified Analytics Professional", "CAP",
    "Certified Data Professional", "CDP",
    "Tableau Desktop Specialist", "Tableau Certified",
    "Google Analytics Certified", "Google Analytics Individual Qualification",
    "PMP", "Project Management Professional",
    "Lean Six Sigma", "Green Belt", "Black Belt",
    "CFA", "CPA", "Salesforce Certified",
    "dbt Analytics Engineering Certification",
    "Snowflake SnowPro",
    "Databricks Certified",
    "CompTIA Data+",
}

# ---------------------------------------------------------------------------
# Job Title Keywords — common data/analytics titles and fragments
# ---------------------------------------------------------------------------
JOB_TITLE_KEYWORDS = {
    "Data Analyst", "Senior Data Analyst", "Lead Data Analyst",
    "Data Scientist", "Senior Data Scientist",
    "Business Analyst", "Business Intelligence Analyst",
    "BI Analyst", "BI Developer", "BI Engineer",
    "Analytics Engineer", "Analytics Manager",
    "Data Engineer", "Senior Data Engineer",
    "Marketing Analyst", "Marketing Data Analyst",
    "Product Analyst", "Growth Analyst",
    "Sales Analyst", "Financial Analyst", "Revenue Analyst",
    "Research Analyst", "Market Research Analyst",
    "Quantitative Analyst", "Statistical Analyst",
    "Reporting Analyst", "Operations Analyst",
    "Customer Analyst", "Customer Data Analyst",
    "Performance Analyst", "Performance Marketing",
    "Insights Analyst", "Strategy Analyst",
}

# ---------------------------------------------------------------------------
# Industry / Domain Terms
# ---------------------------------------------------------------------------
INDUSTRY_TERMS = {
    "Healthcare", "Health Insurance", "Fintech", "Finance",
    "E-Commerce", "Retail", "SaaS", "B2B", "B2C",
    "Advertising", "Media", "Telecommunications",
    "Supply Chain", "Logistics", "Manufacturing",
    "Real Estate", "Education", "Government",
    "Pharmaceutical", "Biotech", "Life Sciences",
    "Insurance", "Banking", "Capital Markets",
    "Consulting", "Technology", "Startup",
    "Revenue", "ROI", "Conversion Rate", "Churn",
    "Customer Acquisition", "Customer Retention",
    "Market Research", "Competitive Analysis",
    "Go-To-Market", "GTM", "Product Launch",
    "Sales Pipeline", "Sales Funnel",
    "Marketing Campaign", "Campaign Performance",
    "User Engagement", "User Retention",
    "Growth", "Optimization", "Automation",
    "Cross-Functional", "End-to-End",
}

# ---------------------------------------------------------------------------
# Skill Variants / Synonyms — maps canonical → set of accepted variants
# Used for flexible matching (if JD says "MS Excel", match "Microsoft Excel")
# ---------------------------------------------------------------------------
SKILL_VARIANTS = {
    "SQL": {"sql", "structured query language"},
    "PostgreSQL": {"postgresql", "postgres", "psql"},
    "MySQL": {"mysql"},
    "T-SQL": {"t-sql", "tsql", "transact-sql"},
    "PL/SQL": {"pl/sql", "plsql"},
    "Python": {"python", "python3", "python programming"},
    "R": {"r programming", "r language", "r studio", "rstudio"},
    "Excel": {"excel", "microsoft excel", "ms excel", "spreadsheet", "spreadsheets"},
    "Microsoft Excel": {"excel", "microsoft excel", "ms excel"},
    "Tableau": {"tableau", "tableau desktop", "tableau server", "tableau online"},
    "Power BI": {"power bi", "powerbi", "power b.i."},
    "Looker": {"looker", "looker studio", "google looker"},
    "Looker Studio": {"looker studio", "google data studio", "data studio"},
    "Google Data Studio": {"google data studio", "data studio", "looker studio"},
    "AWS": {"aws", "amazon web services"},
    "Amazon Web Services": {"aws", "amazon web services"},
    "GCP": {"gcp", "google cloud", "google cloud platform"},
    "Google Cloud": {"gcp", "google cloud", "google cloud platform"},
    "Azure": {"azure", "microsoft azure", "ms azure"},
    "Snowflake": {"snowflake"},
    "BigQuery": {"bigquery", "big query", "google bigquery"},
    "Redshift": {"redshift", "amazon redshift", "aws redshift"},
    "Databricks": {"databricks"},
    "DBT": {"dbt", "data build tool"},
    "dbt": {"dbt", "data build tool", "dbt core", "dbt cloud"},
    "ETL": {"etl", "extract transform load"},
    "ELT": {"elt", "extract load transform"},
    "Alteryx": {"alteryx"},
    "Airflow": {"airflow", "apache airflow"},
    "Git": {"git", "version control"},
    "GitHub": {"github"},
    "Docker": {"docker", "containerization"},
    "Pandas": {"pandas"},
    "NumPy": {"numpy", "num py"},
    "scikit-learn": {"scikit-learn", "sklearn", "scikit learn"},
    "Matplotlib": {"matplotlib"},
    "Seaborn": {"seaborn"},
    "TensorFlow": {"tensorflow", "tensor flow"},
    "PyTorch": {"pytorch", "torch"},
    "Machine Learning": {"machine learning", "ml"},
    "Deep Learning": {"deep learning", "dl"},
    "NLP": {"nlp", "natural language processing"},
    "Natural Language Processing": {"nlp", "natural language processing"},
    "A/B Testing": {"a/b testing", "ab testing", "a/b test", "split testing"},
    "Hypothesis Testing": {"hypothesis testing", "statistical testing"},
    "Data Modeling": {"data modeling", "data modelling"},
    "Data Pipeline": {"data pipeline", "data pipelines", "pipeline", "pipelines"},
    "Data Pipelines": {"data pipeline", "data pipelines", "pipeline", "pipelines"},
    "Data Warehousing": {"data warehousing", "data warehouse", "dwh"},
    "Data Visualization": {"data visualization", "data visualisation", "data viz"},
    "Data Analysis": {"data analysis", "data analytics"},
    "Data Analytics": {"data analytics", "data analysis"},
    "Business Intelligence": {"business intelligence", "bi"},
    "KPIs": {"kpis", "kpi", "key performance indicators", "key performance indicator"},
    "OKRs": {"okrs", "okr", "objectives and key results"},
    "SEO": {"seo", "search engine optimization"},
    "SEM": {"sem", "search engine marketing"},
    "Google Analytics": {"google analytics", "ga", "ga4"},
    "Jira": {"jira", "atlassian jira"},
    "Confluence": {"confluence", "atlassian confluence"},
    "Agile": {"agile", "agile methodology", "agile methodologies"},
    "Scrum": {"scrum"},
    "Salesforce": {"salesforce", "sfdc"},
    "HubSpot": {"hubspot"},
    "PowerPoint": {"powerpoint", "power point", "microsoft powerpoint", "ppt"},
    "Pivot Tables": {"pivot tables", "pivot table", "pivottable"},
    "VLOOKUP": {"vlookup", "v-lookup", "xlookup"},
    "CI/CD": {"ci/cd", "cicd", "continuous integration", "continuous deployment"},
    "Hex": {"hex"},
    "Apache Spark": {"apache spark", "spark", "pyspark"},
    "PySpark": {"pyspark", "py spark", "apache spark"},
    "Apache Kafka": {"apache kafka", "kafka"},
    "Forecasting": {"forecasting", "forecast"},
    "Predictive Modeling": {"predictive modeling", "predictive modelling", "predictive analytics"},
    "Statistical Modeling": {"statistical modeling", "statistical modelling", "statistical models"},
    "Regression Analysis": {"regression analysis", "regression"},
    "Time Series Analysis": {"time series analysis", "time series"},
    "Data Cleaning": {"data cleaning", "data cleansing"},
    "Data Wrangling": {"data wrangling", "data munging"},
    "Reporting": {"reporting", "report generation", "report building"},
    "Dashboarding": {"dashboarding", "dashboard development", "dashboard creation"},
    "Dashboard Development": {"dashboard development", "dashboarding", "dashboard creation"},
    "Automation": {"automation", "process automation", "automated"},
    "Cross-Functional": {"cross-functional", "cross functional", "cross-team"},
    "Stakeholder Management": {"stakeholder management", "stakeholder engagement", "managing stakeholders"},
    "Problem Solving": {"problem solving", "problem-solving"},
    "Problem-Solving": {"problem solving", "problem-solving"},
    "Communication": {"communication", "communicate", "communicating"},
    "Collaboration": {"collaboration", "collaborative", "collaborating"},
    "Leadership": {"leadership", "lead", "leading"},
    "Storytelling": {"storytelling", "data storytelling", "story telling"},
    "Data Storytelling": {"data storytelling", "storytelling"},
    "Presentation Skills": {"presentation skills", "presenting", "presentations"},
    "Project Management": {"project management", "project manage"},
    "Attention to Detail": {"attention to detail", "detail-oriented", "detail oriented"},
    "Detail-Oriented": {"detail-oriented", "detail oriented", "attention to detail"},
    "Strategic Thinking": {"strategic thinking", "strategic"},
    "Analytical Thinking": {"analytical thinking", "analytical skills", "analytical"},
    "Analytical Skills": {"analytical skills", "analytical thinking", "analytical"},
}

# ---------------------------------------------------------------------------
# Action Verbs commonly found in JDs — lower weight but still matched
# ---------------------------------------------------------------------------
ACTION_VERBS = {
    "analyze", "build", "create", "design", "develop", "implement",
    "manage", "optimize", "present", "report", "support", "maintain",
    "automate", "collaborate", "communicate", "deliver", "drive",
    "evaluate", "identify", "improve", "integrate", "lead", "leverage",
    "measure", "mentor", "monitor", "partner", "perform", "provide",
    "recommend", "research", "solve", "streamline", "transform",
    "translate", "visualize", "architect", "define", "document",
    "establish", "execute", "extract", "forecast", "generate",
    "influence", "innovate", "investigate", "launch", "model",
    "onboard", "orchestrate", "own", "pioneer", "prioritize",
    "propose", "prototype", "query", "refine", "scale", "scope",
    "segment", "synthesize", "track", "troubleshoot", "validate",
}
