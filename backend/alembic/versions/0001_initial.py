from alembic import op
import sqlalchemy as sa

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('date', sa.String(), nullable=True),
        sa.Column('type', sa.String(), nullable=True),
        sa.Column('product', sa.String(), nullable=True),
        sa.Column('quantity', sa.Float(), nullable=True),
        sa.Column('price', sa.Float(), nullable=True),
        sa.Column('customer', sa.String(), nullable=True),
        sa.Column('region', sa.String(), nullable=True),
        sa.Column('fingerprint', sa.String(), nullable=True),
    )
    op.create_index('idx_transactions_date', 'transactions', ['date'])
    op.create_index('idx_transactions_product', 'transactions', ['product'])
    op.create_index('idx_transactions_region', 'transactions', ['region'])
    op.create_index('idx_transactions_customer', 'transactions', ['customer'])
    op.create_unique_constraint('ux_transactions_fingerprint', 'transactions', ['fingerprint'])

def downgrade():
    op.drop_constraint('ux_transactions_fingerprint', 'transactions', type_='unique')
    op.drop_index('idx_transactions_customer', table_name='transactions')
    op.drop_index('idx_transactions_region', table_name='transactions')
    op.drop_index('idx_transactions_product', table_name='transactions')
    op.drop_index('idx_transactions_date', table_name='transactions')
    op.drop_table('transactions')
