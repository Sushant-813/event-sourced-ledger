package com.ledger.account.service;

import com.ledger.account.dto.AccountResponse;
import com.ledger.account.dto.CreateAccountRequest;
import com.ledger.account.entity.Account;
import com.ledger.account.entity.AccountStatus;
import com.ledger.account.exception.AccountNotFoundException;
import com.ledger.account.exception.DuplicateAccountNumberException;
import com.ledger.account.exception.InvalidAccountStatusTransitionException;
import com.ledger.account.mapper.AccountMapper;
import com.ledger.account.repository.AccountRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountServiceImpl implements AccountService {

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

        return accountMapper.toResponse(account);
    }

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getAccountByNumber(String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + accountNumber));

        return accountMapper.toResponse(account);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AccountResponse> getAllAccounts(Pageable pageable) {
        return accountRepository.findAll(pageable)
                .map(accountMapper::toResponse);
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

    private AccountResponse changeStatus(Long id, AccountStatus targetStatus) {

        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + id));

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