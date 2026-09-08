package com.ledger.balance.service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public interface BalanceReconstructionService {

    BigDecimal reconstructCurrentBalance(Long accountId);

    BigDecimal reconstructBalanceAt(Long accountId, OffsetDateTime asOf);
}