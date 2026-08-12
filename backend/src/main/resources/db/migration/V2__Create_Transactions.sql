CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,

    reference_number VARCHAR(100) NOT NULL,

    transaction_type VARCHAR(50) NOT NULL,

    status VARCHAR(50) NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT UK_transactions_reference_number
        UNIQUE (reference_number),

    CONSTRAINT CK_transactions_transaction_type
        CHECK (transaction_type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER')),

    CONSTRAINT CK_transactions_status
        CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED'))
);