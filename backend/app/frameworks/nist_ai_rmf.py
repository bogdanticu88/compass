from app.frameworks.base import ControlDef, FrameworkPack

NIST_AI_RMF = FrameworkPack(
    name="NIST AI RMF",
    slug="nist_ai_rmf",
    version="1.0",
    controls=[
        ControlDef(
            article_ref="GOVERN 1.1",
            title="Policies and Procedures",
            requirement="Policies, processes, procedures, and practices across the organization related to the mapping, measuring, and managing of AI risks are in place, transparent, and implemented effectively.",
            evidence_types=["ai_risk_policy", "governance_procedures"],
        ),
        ControlDef(
            article_ref="GOVERN 2.2",
            title="Organizational Roles and Responsibilities",
            requirement="The organization's personnel and partners receive AI risk management training to enable them to perform their duties and responsibilities consistent with related policies, procedures, and agreements.",
            evidence_types=["training_records", "raci_matrix"],
        ),
        ControlDef(
            article_ref="MAP 1.1",
            title="Context Establishment",
            requirement="Context is established for the AI risk assessment — organizational mission and relevant internal and external stakeholder requirements are identified.",
            evidence_types=["stakeholder_analysis", "use_case_documentation"],
        ),
        ControlDef(
            article_ref="MAP 2.1",
            title="Scientific Findings",
            requirement="The organization uses AI risk concepts from peer-reviewed literature and established industry norms, guidelines, and industry best practices.",
            evidence_types=["literature_review", "benchmark_comparisons"],
        ),
        ControlDef(
            article_ref="MEASURE 1.1",
            title="AI Risk Identification",
            requirement="Approaches and metrics for measurement of AI risks and trustworthiness characteristics are identified and applied.",
            evidence_types=["risk_metrics", "measurement_methodology"],
        ),
        ControlDef(
            article_ref="MEASURE 2.5",
            title="Bias Testing",
            requirement="AI system to be deployed has been tested for bias and the results are documented.",
            evidence_types=["bias_test_results", "fairness_metrics"],
        ),
        ControlDef(
            article_ref="MEASURE 2.6",
            title="Explainability",
            requirement="AI system outputs can be explained and are interpreted appropriately by relevant AI actors.",
            evidence_types=["explainability_report", "shap_values"],
        ),
        ControlDef(
            article_ref="MANAGE 1.1",
            title="Risk Treatment",
            requirement="Risks based on assessments and identified metrics are prioritized, responded to, and managed.",
            evidence_types=["risk_treatment_plan", "remediation_tracker"],
        ),
        ControlDef(
            article_ref="MANAGE 4.1",
            title="Post-deployment Monitoring",
            requirement="Identified and documented risks are prioritized and addressed based on projected impact on individuals, groups, communities, and organizations.",
            evidence_types=["monitoring_plan", "drift_detection_reports"],
        ),
    ],
)
