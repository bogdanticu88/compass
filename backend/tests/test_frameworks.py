from app.frameworks import FRAMEWORKS


def test_all_four_frameworks_registered():
    assert "eu_ai_act" in FRAMEWORKS
    assert "dora" in FRAMEWORKS
    assert "iso_42001" in FRAMEWORKS
    assert "nist_ai_rmf" in FRAMEWORKS


def test_each_framework_has_controls():
    for name, pack in FRAMEWORKS.items():
        assert len(pack.controls) > 0, f"{name} has no controls"


def test_control_has_required_fields():
    for name, pack in FRAMEWORKS.items():
        for ctrl in pack.controls:
            assert ctrl.article_ref, f"{name} control missing article_ref"
            assert ctrl.title, f"{name} control missing title"
            assert ctrl.requirement, f"{name} control missing requirement"


def test_eu_ai_act_has_key_articles():
    pack = FRAMEWORKS["eu_ai_act"]
    refs = {c.article_ref for c in pack.controls}
    assert "Art. 9" in refs   # Risk management
    assert "Art. 10" in refs  # Data governance
    assert "Art. 13" in refs  # Transparency
