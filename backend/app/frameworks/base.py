from dataclasses import dataclass, field


@dataclass
class ControlDef:
    article_ref: str
    title: str
    requirement: str
    evidence_types: list[str] = field(default_factory=list)


@dataclass
class FrameworkPack:
    name: str
    slug: str
    version: str
    controls: list[ControlDef] = field(default_factory=list)
