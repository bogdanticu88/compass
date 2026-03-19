from app.frameworks.base import ControlDef, FrameworkPack

EU_AI_ACT = FrameworkPack(
    name="EU AI Act",
    slug="eu_ai_act",
    version="2024",
    controls=[
        ControlDef(
            article_ref="Art. 9",
            title="Risk Management System",
            requirement="Providers of high-risk AI systems shall establish, implement, document and maintain a risk management system.",
            evidence_types=["risk_register", "risk_assessment_report"],
        ),
        ControlDef(
            article_ref="Art. 10",
            title="Data and Data Governance",
            requirement="Training, validation and testing data sets shall be subject to data governance and management practices.",
            evidence_types=["data_quality_report", "data_lineage_doc"],
        ),
        ControlDef(
            article_ref="Art. 11",
            title="Technical Documentation",
            requirement="Providers of high-risk AI systems shall draw up technical documentation before that system is placed on the market.",
            evidence_types=["technical_doc", "model_card"],
        ),
        ControlDef(
            article_ref="Art. 12",
            title="Record-Keeping and Logging",
            requirement="High-risk AI systems shall technically allow for the automatic recording of events (logs) throughout their lifetime.",
            evidence_types=["audit_logs", "system_logs"],
        ),
        ControlDef(
            article_ref="Art. 13",
            title="Transparency and Provision of Information",
            requirement="High-risk AI systems shall be designed and developed in such a way to ensure sufficient transparency to enable deployers to interpret the system's output.",
            evidence_types=["user_documentation", "explainability_report"],
        ),
        ControlDef(
            article_ref="Art. 14",
            title="Human Oversight",
            requirement="High-risk AI systems shall be designed and developed in such a way to allow effective oversight by natural persons during the period in which the AI system is in use.",
            evidence_types=["oversight_procedures", "override_capability_doc"],
        ),
        ControlDef(
            article_ref="Art. 15",
            title="Accuracy, Robustness and Cybersecurity",
            requirement="High-risk AI systems shall be designed and developed in such a way that they achieve an appropriate level of accuracy, robustness, and cybersecurity.",
            evidence_types=["accuracy_metrics", "robustness_tests", "security_assessment"],
        ),
        ControlDef(
            article_ref="Art. 17",
            title="Quality Management System",
            requirement="Providers of high-risk AI systems shall put a quality management system in place.",
            evidence_types=["qms_documentation", "audit_records"],
        ),
        ControlDef(
            article_ref="Art. 26",
            title="Obligations of Deployers",
            requirement="Deployers shall take appropriate technical and organisational measures to ensure they use high-risk AI systems in accordance with the instructions for use.",
            evidence_types=["deployment_procedures", "staff_training_records"],
        ),
        ControlDef(
            article_ref="Art. 72",
            title="Conformity Assessment",
            requirement="Providers of high-risk AI systems shall carry out a conformity assessment before placing the system on the market or putting it into service.",
            evidence_types=["conformity_assessment_report", "ce_declaration"],
        ),
    ],
)
