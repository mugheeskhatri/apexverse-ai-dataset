"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-01-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('company', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('password_hash', sa.Text(), nullable=True),
        sa.Column('google_id', sa.String(255), nullable=True),
        sa.Column('avatar_url', sa.Text(), nullable=True),
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('google_id'),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    op.create_table('subscriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('plan', sa.Enum('starter','growth','professional','enterprise', name='planenum'), nullable=False, server_default='starter'),
        sa.Column('cycle', sa.Enum('monthly','annual', name='cycleenum'), nullable=False, server_default='monthly'),
        sa.Column('years_term', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.Enum('active','past_due','canceled','trialing','incomplete', name='substatusenum'), nullable=False, server_default='incomplete'),
        sa.Column('stripe_customer_id', sa.String(255), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(255), nullable=True),
        sa.Column('stripe_price_id', sa.String(255), nullable=True),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('canceled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('page_quota', sa.Integer(), nullable=False, server_default='1000'),
        sa.Column('pages_used_this_period', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('stripe_customer_id'),
        sa.UniqueConstraint('stripe_subscription_id'),
    )

    op.create_table('invoices',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subscription_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('stripe_invoice_id', sa.String(255), nullable=True),
        sa.Column('receipt_number', sa.String(50), nullable=True),
        sa.Column('amount_paid', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('currency', sa.String(10), nullable=False, server_default='usd'),
        sa.Column('status', sa.Enum('paid','open','void','uncollectible', name='invoicestatusenum'), nullable=False, server_default='open'),
        sa.Column('pdf_url', sa.Text(), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('stripe_invoice_id'),
    )

    op.create_table('projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('target_url', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('active','paused','failed','archived', name='projectstatusenum'), nullable=False, server_default='active'),
        sa.Column('js_rendering', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('auto_chunking', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('chunk_size', sa.Integer(), nullable=False, server_default='512'),
        sa.Column('chunk_overlap', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('vector_db', sa.Enum('none','pinecone','qdrant','weaviate','pgvector','milvus','azure_ai','custom', name='vectordbenum'), nullable=False, server_default='none'),
        sa.Column('vector_db_credentials', sa.JSON(), nullable=True),
        sa.Column('embedding_provider', sa.Enum('none','openai','cohere', name='embeddingproviderenum'), nullable=False, server_default='none'),
        sa.Column('embedding_api_key', sa.Text(), nullable=True),
        sa.Column('embedding_model', sa.String(100), nullable=True),
        sa.Column('schedule_cron', sa.String(50), nullable=True),
        sa.Column('pages_processed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table('runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('trigger', sa.Enum('manual','schedule','api', name='runtriggerenum'), nullable=False, server_default='manual'),
        sa.Column('status', sa.Enum('queued','running','completed','failed','canceled', name='runstatusenum'), nullable=False, server_default='queued'),
        sa.Column('pages_processed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('pages_failed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('chunks_created', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('embeddings_created', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('scraper_job_id', sa.String(255), nullable=True),
        sa.Column('output_file_url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table('run_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('run_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('level', sa.Enum('info','warn','error', name='loglevelenum'), nullable=False, server_default='info'),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['run_id'], ['runs.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table('team_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('role', sa.Enum('owner','admin','member','viewer', name='teamroleenum'), nullable=False, server_default='member'),
        sa.Column('status', sa.Enum('active','invited','suspended', name='teamstatusenum'), nullable=False, server_default='invited'),
        sa.Column('invite_token', sa.String(255), nullable=True),
        sa.Column('invited_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['workspace_id'], ['users.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invite_token'),
    )

    op.create_table('api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False, server_default='Production Key'),
        sa.Column('key_prefix', sa.String(20), nullable=False),
        sa.Column('key_hash', sa.Text(), nullable=False),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table('notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.Enum('run_complete','run_failed','quota_warning','billing','team_invite','system', name='notiftypeenum'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('link', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('api_keys')
    op.drop_table('team_members')
    op.drop_table('run_logs')
    op.drop_table('runs')
    op.drop_table('projects')
    op.drop_table('invoices')
    op.drop_table('subscriptions')
    op.drop_table('users')
    for e in ['planenum','cycleenum','substatusenum','invoicestatusenum','projectstatusenum',
              'vectordbenum','embeddingproviderenum','runtriggerenum','runstatusenum',
              'loglevelenum','teamroleenum','teamstatusenum','notiftypeenum']:
        op.execute(f'DROP TYPE IF EXISTS {e}')
