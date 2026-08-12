CREATE TABLE ledger_entries (
    id BIGSERIAL PRIMARY KEY,

    transaction_id BIGINT NOT NULL,

    account_id BIGINT NOT NULL,

    entry_type VARCHAR(10) NOT NULL,

    amount NUMERIC(19, 2) NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT FK_ledger_entries_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(id)
        ON DELETE RESTRICT,

    CONSTRAINT FK_ledger_entries_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(id)
        ON DELETE RESTRICT,

    CONSTRAINT CK_ledger_entries_entry_type
        CHECK (entry_type IN ('DEBIT', 'CREDIT')),

    CONSTRAINT CK_ledger_entries_amount
        CHECK (amount > 0)
);

CREATE INDEX IDX_ledger_entries_transaction_id
    ON ledger_entries(transaction_id);

CREATE INDEX IDX_ledger_entries_account_id
    ON ledger_entries(account_id);