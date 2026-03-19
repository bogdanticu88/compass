from app.frameworks.base import FrameworkPack
from app.frameworks.dora import DORA
from app.frameworks.eu_ai_act import EU_AI_ACT
from app.frameworks.iso_42001 import ISO_42001
from app.frameworks.nist_ai_rmf import NIST_AI_RMF

FRAMEWORKS: dict[str, FrameworkPack] = {
    "eu_ai_act": EU_AI_ACT,
    "dora": DORA,
    "iso_42001": ISO_42001,
    "nist_ai_rmf": NIST_AI_RMF,
}

__all__ = ["FRAMEWORKS", "FrameworkPack"]
