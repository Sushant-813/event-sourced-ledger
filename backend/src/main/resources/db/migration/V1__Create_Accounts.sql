CREATE TABLE accounts (
    id BIGSERIAL PRIMARY KEY,

    account_number VARCHAR(50) NOT NULL,
    account_name VARCHAR(255) NOT NULL,

    account_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT UK_accounts_account_number
        UNIQUE (account_number),

    CONSTRAINT CK_accounts_account_type
        CHECK (account_type IN ('SAVINGS', 'CURRENT')),

    CONSTRAINT CK_accounts_status
        CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED'))
);

COMMENT ON TABLE accounts IS
    'Stores financial accounts managed by the ledger system.';