package com.ledger.account.service;

import com.ledger.account.dto.AccountResponse;
import com.ledger.account.dto.CreateAccountRequest;
import com.ledger.account.entity.Account;
import com.ledger.account.entity.AccountStatus;
import com.ledger.account.entity.AccountType;
import com.ledger.account.exception.AccountNotFoundException;
import com.ledger.account.exception.DuplicateAccountNumberException;
import com.ledger.account.exception.InvalidAccountStatusTransitionException;
import com.ledger.account.mapper.AccountMapper;
import com.ledger.account.repository.AccountRepository;
import com.ledger.common.constant.SystemAccountConstants;
import com.ledger.common.dto.PagedResponse;
import com.ledger.common.validation.PaginationValidator;
import com.ledger.common.validation.SortValidator;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Set;

@Service
public class AccountServiceImpl implements AccountService {

    private static final Set<String> ACCOUNT_SORT_FIELDS = Set.of(
            "createdAt",
            "accountName",
            "accountNumber");

    private final AccountRepository accountRepository;
    private final AccountMapper accountMapper;

    public AccountServiceImpl(
            AccountRepository accountRepository,
            AccountMapper accountMapper) {
        this.accountRepository = accountRepository;
        this.accountMapper = accountMapper;
    }

    @Override
    @Transactional
    public AccountResponse createAccount(CreateAccountRequest request) {

        if (accountRepository.existsByAccountNumber(request.accountNumber())) {
            throw new DuplicateAccountNumberException(
                    "Account number already exists: " + request.accountNumber());
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        Account account = new Account();
        account.setAccountNumber(request.accountNumber());
        account.setAccountName(request.accountName());
        account.setAccountType(request.accountType());
        account.setStatus(AccountStatus.ACTIVE);
        account.setCreatedAt(now);
        account.setUpdatedAt(now);

        try {
            Account savedAccount = accountRepository.save(account);
            return accountMapper.toResponse(savedAccount);

        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateAccountNumberException(
                    "Account number already exists: " + request.accountNumber());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getAccountById(Long id) {

        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + id));

        if (SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER
                .equals(account.getAccountNumber())) {
            throw new AccountNotFoundException("Account not found: " + id);
        }

        return accountMapper.toResponse(account);
    }

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getAccountByNumber(String accountNumber) {

        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new AccountNotFoundException(
                        "Account not found: " + accountNumber));

        if (SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER
                .equals(account.getAccountNumber())) {
            throw new AccountNotFoundException(
                    "Account not found: " + accountNumber);
        }

        return accountMapper.toResponse(account);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<AccountResponse> getAllAccounts(
            int page,
            int size,
            String sortBy,
            String direction,
            AccountStatus status,
            AccountType accountType) {

        // Validate pagination parameters.
        PaginationValidator.validate(page, size);

        // Validate sort field and direction.
        // SortValidator also adds the deterministic ID tie-breaker
        // using the same direction.
        Sort sort = SortValidator.validateAndBuild(
                sortBy,
                direction,
                ACCOUNT_SORT_FIELDS);

        Pageable pageable = PageRequest.of(
                page,
                size,
                sort);

        Page<Account> accountPage;

        // Filter -> count -> sort -> paginate is handled by Spring Data
        // through the appropriate repository query and Pageable.
        if (status != null && accountType != null) {

            accountPage = accountRepository
                    .findAllByAccountNumberNotAndStatusAndAccountType(
                            SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER,
                            status,
                            accountType,
                            pageable);

        } else if (status != null) {

            accountPage = accountRepository
                    .findAllByAccountNumberNotAndStatus(
                            SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER,
                            status,
                            pageable);

        } else if (accountType != null) {

            accountPage = accountRepository
                    .findAllByAccountNumberNotAndAccountType(
                            SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER,
                            accountType,
                            pageable);

        } else {

            accountPage = accountRepository
                    .findAllByAccountNumberNot(
                            SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER,
                            pageable);
        }

        return new PagedResponse<>(
                accountPage.getContent()
                        .stream()
                        .map(accountMapper::toResponse)
                        .toList(),
                accountPage.getNumber(),
                accountPage.getSize(),
                accountPage.getTotalPages(),
                accountPage.getTotalElements());
    }

    @Override
    @Transactional
    public AccountResponse freezeAccount(Long id) {
        return changeStatus(id, AccountStatus.FROZEN);
    }

    @Override
    @Transactional
    public AccountResponse activateAccount(Long id) {
        return changeStatus(id, AccountStatus.ACTIVE);
    }

    @Override
    @Transactional
    public AccountResponse closeAccount(Long id) {
        return changeStatus(id, AccountStatus.CLOSED);
    }

    private AccountResponse changeStatus(
            Long id,
            AccountStatus targetStatus) {

        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + id));

        if (SystemAccountConstants.SYSTEM_CASH_ACCOUNT_NUMBER
                .equals(account.getAccountNumber())) {
            throw new AccountNotFoundException("Account not found: " + id);
        }

        AccountStatus currentStatus = account.getStatus();

        if (!isValidTransition(currentStatus, targetStatus)) {
            throw new InvalidAccountStatusTransitionException(
                    "Cannot transition account " + id
                            + " from " + currentStatus
                            + " to " + targetStatus);
        }

        account.setStatus(targetStatus);

        Account updatedAccount = accountRepository.save(account);

        return accountMapper.toResponse(updatedAccount);
    }

    private boolean isValidTransition(
            AccountStatus currentStatus,
            AccountStatus targetStatus) {

        return switch (currentStatus) {

            case ACTIVE ->
                targetStatus == AccountStatus.FROZEN
                        || targetStatus == AccountStatus.CLOSED;

            case FROZEN ->
                targetStatus == AccountStatus.ACTIVE
                        || targetStatus == AccountStatus.CLOSED;

            case CLOSED -> false;
        };
    }
}