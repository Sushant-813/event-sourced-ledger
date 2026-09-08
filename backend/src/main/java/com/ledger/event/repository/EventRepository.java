package com.ledger.event.repository;

import com.ledger.event.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.OffsetDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByAccountIdOrderByOccurredAtAscIdAsc(Long accountId);

    List<Event> findByTransactionIdOrderByOccurredAtAscIdAsc(Long transactionId);

    List<Event> findByAccountIdAndOccurredAtLessThanEqualOrderByOccurredAtAscIdAsc(
            Long accountId,
            OffsetDateTime asOf);
}