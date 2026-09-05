-- Flyway migration V5: Seed System Cash Contra-Account
-- Required for double-entry accounting of deposits and withdrawals.
-- See ADR-024.

INSERT INTO accounts (
    account_number,
    account_name,
    account_type,
    status,
    created_at,
    updated_at
)
VALUES (
    'SYS-CASH',
    'System Cash Reserve',
    'CURRENT',
    'ACTIVE',
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
);