CREATE TABLE events (
    id              BIGSERIAL PRIMARY KEY,

    account_id      BIGINT NOT NULL,
    transaction_id  BIGINT,

    event_type      VARCHAR(50) NOT NULL,

    payload         TEXT,

    occurred_at     TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT FK_events_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(id)
        ON DELETE RESTRICT,

    CONSTRAINT FK_events_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(id)
        ON DELETE RESTRICT,

    CONSTRAINT CK_events_event_type
        CHECK (event_type IN (
            'ACCOUNT_CREATED',
            'DEPOSIT',
            'WITHDRAWAL',
            'TRANSFER_DEBIT',
            'TRANSFER_CREDIT'
        ))
);

CREATE INDEX IDX_events_account_id_occurred_at_id
    ON events(account_id, occurred_at, id);

CREATE INDEX IDX_events_transaction_id
    ON events(transaction_id);

COMMENT ON TABLE events IS
    'Immutable historical record of every financial business event in the ledger system.';