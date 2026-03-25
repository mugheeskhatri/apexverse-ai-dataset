"""add seed_urls and crawl_depth to projects

Revision ID: 0002
Revises: 0001
Create Date: 2026-01-02 00:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('seed_urls', sa.JSON(), nullable=True))
    op.add_column('projects', sa.Column('crawl_depth', sa.Integer(), nullable=False, server_default='3'))
    op.add_column('projects', sa.Column('url_patterns_include', sa.Text(), nullable=True))
    op.add_column('projects', sa.Column('url_patterns_exclude', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('projects', 'url_patterns_exclude')
    op.drop_column('projects', 'url_patterns_include')
    op.drop_column('projects', 'crawl_depth')
    op.drop_column('projects', 'seed_urls')
