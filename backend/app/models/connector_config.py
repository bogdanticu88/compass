from sqlalchemy import JSON, Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, uuid_pk


class ConnectorConfig(Base, TimestampMixin):
    __tablename__ = "connector_configs"
    __table_args__ = (UniqueConstraint("system_id", "connector_name", name="uq_system_connector"),)

    id: Mapped[str] = uuid_pk()
    system_id: Mapped[str] = mapped_column(ForeignKey("ai_systems.id"), nullable=False)
    connector_name: Mapped[str] = mapped_column(String(50), nullable=False)
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
