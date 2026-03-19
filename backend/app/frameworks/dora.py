from app.frameworks.base import ControlDef, FrameworkPack

DORA = FrameworkPack(
    name="DORA",
    slug="dora",
    version="2022/2554",
    controls=[
        ControlDef(
            article_ref="Art. 5",
            title="ICT Risk Management Framework",
            requirement="Financial entities shall have in place a sound, comprehensive and well-documented ICT risk management framework.",
            evidence_types=["ict_risk_policy", "risk_register"],
        ),
        ControlDef(
            article_ref="Art. 8",
            title="Identification of ICT Risk",
            requirement="Financial entities shall identify, classify and document all ICT supported business functions, roles and responsibilities.",
            evidence_types=["asset_inventory", "data_flow_diagram"],
        ),
        ControlDef(
            article_ref="Art. 9",
            title="Protection and Prevention",
            requirement="Financial entities shall continuously monitor and control the security and functioning of ICT systems and tools.",
            evidence_types=["monitoring_logs", "vulnerability_scan_results"],
        ),
        ControlDef(
            article_ref="Art. 10",
            title="Detection",
            requirement="Financial entities shall have in place mechanisms to promptly detect anomalous activities.",
            evidence_types=["siem_config", "alert_policies"],
        ),
        ControlDef(
            article_ref="Art. 11",
            title="Response and Recovery",
            requirement="Financial entities shall put in place a comprehensive ICT business continuity policy.",
            evidence_types=["bcp_document", "rto_rpo_evidence", "recovery_tests"],
        ),
        ControlDef(
            article_ref="Art. 17",
            title="ICT-related Incident Management",
            requirement="Financial entities shall define, establish and implement an ICT-related incident management process.",
            evidence_types=["incident_register", "incident_response_procedures"],
        ),
        ControlDef(
            article_ref="Art. 28",
            title="Third-Party Risk Management",
            requirement="Financial entities shall manage ICT third-party risk as an integral component of ICT risk.",
            evidence_types=["vendor_assessments", "contract_clauses", "third_party_audit_reports"],
        ),
    ],
)
