import uuid
from datetime import datetime
from sqlalchemy import (
    String, Boolean, Integer, Text, DateTime, ForeignKey,
    Enum, JSON, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


# ── Enums ────────────────────────────────────────────────

class PlanEnum(str, enum.Enum):
    starter = "starter"
    growth = "growth"
    professional = "professional"
    enterprise = "enterprise"


class CycleEnum(str, enum.Enum):
    monthly = "monthly"
    annual = "annual"


class SubStatusEnum(str, enum.Enum):
    active = "active"
    past_due = "past_due"
    canceled = "canceled"
    trialing = "trialing"
    incomplete = "incomplete"


class ProjectStatusEnum(str, enum.Enum):
    active = "active"
    paused = "paused"
    failed = "failed"
    archived = "archived"


class RunStatusEnum(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    canceled = "canceled"


class RunTriggerEnum(str, enum.Enum):
    manual = "manual"
    schedule = "schedule"
    api = "api"


class TeamRoleEnum(str, enum.Enum):
    owner = "owner"
    admin = "admin"
    member = "member"
    viewer = "viewer"


class TeamStatusEnum(str, enum.Enum):
    active = "active"
    invited = "invited"
    suspended = "suspended"


class InvoiceStatusEnum(str, enum.Enum):
    paid = "paid"
    open = "open"
    void = "void"
    uncollectible = "uncollectible"


class LogLevelEnum(str, enum.Enum):
    info = "info"
    warn = "warn"
    error = "error"


class NotifTypeEnum(str, enum.Enum):
    run_complete = "run_complete"
    run_failed = "run_failed"
    quota_warning = "quota_warning"
    billing = "billing"
    team_invite = "team_invite"
    system = "system"


class VectorDBEnum(str, enum.Enum):
    none = "none"
    pinecone = "pinecone"
    qdrant = "qdrant"
    weaviate = "weaviate"
    pgvector = "pgvector"
    milvus = "milvus"
    azure_ai = "azure_ai"
    custom = "custom"


class EmbeddingProviderEnum(str, enum.Enum):
    none = "none"
    openai = "openai"
    cohere = "cohere"


# ── Models ───────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(255))
    company: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50))
    password_hash: Mapped[str | None] = mapped_column(Text)
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    avatar_url: Mapped[str | None] = mapped_column(Text)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    subscription: Mapped["Subscription | None"] = relationship("Subscription", back_populates="user", uselist=False)
    projects: Mapped[list["Project"]] = relationship("Project", back_populates="user")
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="user")
    api_keys: Mapped[list["ApiKey"]] = relationship("ApiKey", back_populates="user")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    plan: Mapped[PlanEnum] = mapped_column(Enum(PlanEnum), default=PlanEnum.starter)
    cycle: Mapped[CycleEnum] = mapped_column(Enum(CycleEnum), default=CycleEnum.monthly)
    years_term: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[SubStatusEnum] = mapped_column(Enum(SubStatusEnum), default=SubStatusEnum.incomplete)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    stripe_price_id: Mapped[str | None] = mapped_column(String(255))
    current_period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    canceled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    page_quota: Mapped[int] = mapped_column(Integer, default=1000)
    pages_used_this_period: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="subscription")
    invoices: Mapped[list["Invoice"]] = relationship("Invoice", back_populates="subscription")


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    subscription_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("subscriptions.id"))
    stripe_invoice_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    receipt_number: Mapped[str | None] = mapped_column(String(50))
    amount_paid: Mapped[int] = mapped_column(Integer, default=0)  # cents
    currency: Mapped[str] = mapped_column(String(10), default="usd")
    status: Mapped[InvoiceStatusEnum] = mapped_column(Enum(InvoiceStatusEnum), default=InvoiceStatusEnum.open)
    pdf_url: Mapped[str | None] = mapped_column(Text)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    subscription: Mapped["Subscription | None"] = relationship("Subscription", back_populates="invoices")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_url: Mapped[str] = mapped_column(Text, nullable=False)  # primary/first URL (kept for backwards compat)
    seed_urls: Mapped[list | None] = mapped_column(JSON)  # list of {url, depth} objects
    crawl_depth: Mapped[int] = mapped_column(Integer, default=3)  # default max depth
    url_patterns_include: Mapped[str | None] = mapped_column(Text)  # comma-separated include patterns
    url_patterns_exclude: Mapped[str | None] = mapped_column(Text)  # comma-separated exclude patterns
    status: Mapped[ProjectStatusEnum] = mapped_column(Enum(ProjectStatusEnum), default=ProjectStatusEnum.active)
    js_rendering: Mapped[bool] = mapped_column(Boolean, default=False)
    auto_chunking: Mapped[bool] = mapped_column(Boolean, default=True)
    chunk_size: Mapped[int] = mapped_column(Integer, default=512)
    chunk_overlap: Mapped[int] = mapped_column(Integer, default=50)
    vector_db: Mapped[VectorDBEnum] = mapped_column(Enum(VectorDBEnum), default=VectorDBEnum.none)
    vector_db_credentials: Mapped[dict | None] = mapped_column(JSON)  # encrypted at rest
    embedding_provider: Mapped[EmbeddingProviderEnum] = mapped_column(Enum(EmbeddingProviderEnum), default=EmbeddingProviderEnum.none)
    embedding_api_key: Mapped[str | None] = mapped_column(Text)  # encrypted
    embedding_model: Mapped[str | None] = mapped_column(String(100))
    schedule_cron: Mapped[str | None] = mapped_column(String(50))
    pages_processed: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="projects")
    runs: Mapped[list["Run"]] = relationship("Run", back_populates="project", order_by="Run.created_at.desc()")


class Run(Base):
    __tablename__ = "runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    trigger: Mapped[RunTriggerEnum] = mapped_column(Enum(RunTriggerEnum), default=RunTriggerEnum.manual)
    status: Mapped[RunStatusEnum] = mapped_column(Enum(RunStatusEnum), default=RunStatusEnum.queued)
    pages_processed: Mapped[int] = mapped_column(Integer, default=0)
    pages_failed: Mapped[int] = mapped_column(Integer, default=0)
    chunks_created: Mapped[int] = mapped_column(Integer, default=0)
    embeddings_created: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_ms: Mapped[int | None] = mapped_column(Integer)
    scraper_job_id: Mapped[str | None] = mapped_column(String(255))
    output_file_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="runs")
    logs: Mapped[list["RunLog"]] = relationship("RunLog", back_populates="run", order_by="RunLog.created_at.asc()")


class RunLog(Base):
    __tablename__ = "run_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("runs.id"), nullable=False)
    level: Mapped[LogLevelEnum] = mapped_column(Enum(LogLevelEnum), default=LogLevelEnum.info)
    message: Mapped[str] = mapped_column(Text)
    url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    run: Mapped["Run"] = relationship("Run", back_populates="logs")


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[TeamRoleEnum] = mapped_column(Enum(TeamRoleEnum), default=TeamRoleEnum.member)
    status: Mapped[TeamStatusEnum] = mapped_column(Enum(TeamStatusEnum), default=TeamStatusEnum.invited)
    invite_token: Mapped[str | None] = mapped_column(String(255), unique=True)
    invited_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ApiKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), default="Production Key")
    key_prefix: Mapped[str] = mapped_column(String(20))
    key_hash: Mapped[str] = mapped_column(Text)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="api_keys")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type: Mapped[NotifTypeEnum] = mapped_column(Enum(NotifTypeEnum))
    title: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    link: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="notifications")
