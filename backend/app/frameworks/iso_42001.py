from app.frameworks.base import ControlDef, FrameworkPack

ISO_42001 = FrameworkPack(
    name="ISO/IEC 42001",
    slug="iso_42001",
    version="2023",
    controls=[
        ControlDef(
            article_ref="4.1",
            title="Understanding the Organization and Its Context",
            requirement="The organization shall determine external and internal issues relevant to its purpose that affect its ability to achieve intended outcomes of its AI management system.",
            evidence_types=["context_analysis_doc"],
        ),
        ControlDef(
            article_ref="5.2",
            title="AI Policy",
            requirement="Top management shall establish an AI policy appropriate to the purpose of the organization.",
            evidence_types=["ai_policy_document"],
        ),
        ControlDef(
            article_ref="6.1",
            title="Actions to Address Risks and Opportunities",
            requirement="When planning for the AI management system, the organization shall consider risks and opportunities.",
            evidence_types=["risk_opportunity_register"],
        ),
        ControlDef(
            article_ref="8.2",
            title="AI System Impact Assessment",
            requirement="The organization shall conduct an AI system impact assessment prior to deploying an AI system.",
            evidence_types=["impact_assessment_report"],
        ),
        ControlDef(
            article_ref="8.4",
            title="AI System Life Cycle",
            requirement="The organization shall establish, implement, and maintain processes for the AI system lifecycle.",
            evidence_types=["lifecycle_documentation", "model_versioning_records"],
        ),
        ControlDef(
            article_ref="9.1",
            title="Monitoring, Measurement, Analysis and Evaluation",
            requirement="The organization shall determine what needs to be monitored and measured related to AI systems.",
            evidence_types=["monitoring_reports", "kpi_dashboards"],
        ),
        ControlDef(
            article_ref="10.1",
            title="Continual Improvement",
            requirement="The organization shall continually improve the suitability, adequacy and effectiveness of the AI management system.",
            evidence_types=["improvement_log", "management_review_minutes"],
        ),
    ],
)
