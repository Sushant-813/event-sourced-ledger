package com.ledger.account;

import com.ledger.account.dto.AccountResponse;
import com.ledger.account.dto.CreateAccountRequest;
import com.ledger.account.entity.Account;
import com.ledger.account.entity.AccountStatus;
import com.ledger.account.entity.AccountType;
import com.ledger.account.exception.DuplicateAccountNumberException;
import com.ledger.account.exception.InvalidAccountStatusTransitionException;
import com.ledger.account.mapper.AccountMapper;
import com.ledger.account.repository.AccountRepository;
import com.ledger.account.service.AccountServiceImpl;
import java.util.Optional;
import com.ledger.account.exception.AccountNotFoundException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AccountServiceImplTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private AccountMapper accountMapper;

    private AccountServiceImpl accountService;

    @BeforeEach
    void setUp() {
        accountService = new AccountServiceImpl(
                accountRepository,
                accountMapper);
    }

    @Test
    void createAccount_success() {

        // Arrange
        CreateAccountRequest request = new CreateAccountRequest(
                "ACC001",
                "John Doe",
                AccountType.SAVINGS);

        Account savedAccount = new Account();
        savedAccount.setAccountNumber("ACC001");
        savedAccount.setAccountName("John Doe");
        savedAccount.setAccountType(AccountType.SAVINGS);
        savedAccount.setStatus(AccountStatus.ACTIVE);

        AccountResponse expectedResponse = new AccountResponse(
                1L,
                "ACC001",
                "John Doe",
                AccountType.SAVINGS,
                AccountStatus.ACTIVE,
                null,
                null);

        when(accountRepository.existsByAccountNumber("ACC001"))
                .thenReturn(false);

        when(accountRepository.save(any(Account.class)))
                .thenReturn(savedAccount);

        when(accountMapper.toResponse(savedAccount))
                .thenReturn(expectedResponse);

        // Act
        AccountResponse result = accountService.createAccount(request);

        // Assert
        assertSame(expectedResponse, result);

        ArgumentCaptor<Account> accountCaptor = ArgumentCaptor.forClass(Account.class);

        verify(accountRepository).save(accountCaptor.capture());

        Account capturedAccount = accountCaptor.getValue();

        assertEquals("ACC001", capturedAccount.getAccountNumber());
        assertEquals("John Doe", capturedAccount.getAccountName());
        assertEquals(AccountType.SAVINGS, capturedAccount.getAccountType());
        assertEquals(AccountStatus.ACTIVE, capturedAccount.getStatus());
    }

    @Test
    void createAccount_duplicateAccountNumber() {

        // Arrange
        CreateAccountRequest request = new CreateAccountRequest(
                "ACC001",
                "John Doe",
                AccountType.SAVINGS);

        when(accountRepository.existsByAccountNumber("ACC001"))
                .thenReturn(true);

        // Act & Assert
        assertThrows(
                DuplicateAccountNumberException.class,
                () -> accountService.createAccount(request));

        // Verify that account was never saved
        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    void getAccountById_success() {

        // Arrange
        Long accountId = 1L;

        Account account = new Account();
        account.setAccountNumber("ACC001");
        account.setAccountName("John Doe");
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(AccountStatus.ACTIVE);

        AccountResponse expectedResponse = new AccountResponse(
                accountId,
                "ACC001",
                "John Doe",
                AccountType.SAVINGS,
                AccountStatus.ACTIVE,
                null,
                null);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(accountMapper.toResponse(account))
                .thenReturn(expectedResponse);

        // Act
        AccountResponse actualResponse = accountService.getAccountById(accountId);

        // Assert
        assertEquals(expectedResponse, actualResponse);

        verify(accountRepository).findById(accountId);
        verify(accountMapper).toResponse(account);
    }

    @Test
    void getAccountById_notFound() {

        // Arrange
        Long accountId = 99L;

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
                AccountNotFoundException.class,
                () -> accountService.getAccountById(accountId));

        verify(accountRepository).findById(accountId);
        verifyNoInteractions(accountMapper);
    }

    @Test
    void getAccountByNumber_success() {

        // Arrange
        String accountNumber = "ACC001";

        Account account = new Account();
        account.setAccountNumber(accountNumber);
        account.setAccountName("John Doe");
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(AccountStatus.ACTIVE);

        AccountResponse expectedResponse = new AccountResponse(
                1L,
                accountNumber,
                "John Doe",
                AccountType.SAVINGS,
                AccountStatus.ACTIVE,
                null,
                null);

        when(accountRepository.findByAccountNumber(accountNumber))
                .thenReturn(Optional.of(account));

        when(accountMapper.toResponse(account))
                .thenReturn(expectedResponse);

        // Act
        AccountResponse actualResponse = accountService.getAccountByNumber(accountNumber);

        // Assert
        assertEquals(expectedResponse, actualResponse);

        verify(accountRepository).findByAccountNumber(accountNumber);
        verify(accountMapper).toResponse(account);
    }

    @Test
    void getAccountByNumber_notFound() {

        // Arrange
        String accountNumber = "ACC999";

        when(accountRepository.findByAccountNumber(accountNumber))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
                AccountNotFoundException.class,
                () -> accountService.getAccountByNumber(accountNumber));

        verify(accountRepository).findByAccountNumber(accountNumber);
        verifyNoInteractions(accountMapper);
    }

    @Test
    void getAllAccounts_success() {

        // Arrange
        Pageable pageable = PageRequest.of(0, 20);

        Account account = new Account();
        account.setAccountNumber("ACC001");
        account.setAccountName("John Doe");
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(AccountStatus.ACTIVE);

        AccountResponse response = new AccountResponse(
                1L,
                "ACC001",
                "John Doe",
                AccountType.SAVINGS,
                AccountStatus.ACTIVE,
                null,
                null);

        Page<Account> accountPage = new PageImpl<>(List.of(account), pageable, 1);

        when(accountRepository.findAll(pageable))
                .thenReturn(accountPage);

        when(accountMapper.toResponse(account))
                .thenReturn(response);

        // Act
        Page<AccountResponse> result = accountService.getAllAccounts(pageable);

        // Assert
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertEquals(response, result.getContent().get(0));

        verify(accountRepository).findAll(pageable);
        verify(accountMapper).toResponse(account);
    }

    @Test
    void freezeAccount_fromActive_success() {

        // Arrange
        Long accountId = 1L;

        Account account = new Account();
        account.setAccountNumber("ACC001");
        account.setAccountName("John Doe");
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(AccountStatus.ACTIVE);

        AccountResponse expectedResponse = new AccountResponse(
                accountId,
                "ACC001",
                "John Doe",
                AccountType.SAVINGS,
                AccountStatus.FROZEN,
                null,
                null);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(accountRepository.save(account))
                .thenReturn(account);

        when(accountMapper.toResponse(account))
                .thenReturn(expectedResponse);

        // Act
        AccountResponse result = accountService.freezeAccount(accountId);

        // Assert
        assertEquals(AccountStatus.FROZEN, account.getStatus());
        assertEquals(expectedResponse, result);

        verify(accountRepository).findById(accountId);
        verify(accountRepository).save(account);
        verify(accountMapper).toResponse(account);
    }

    @Test
    void freezeAccount_fromFrozen_throws() {

        // Arrange
        Long accountId = 1L;

        Account account = new Account();
        account.setAccountNumber("ACC001");
        account.setAccountName("John Doe");
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(AccountStatus.FROZEN);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        // Act & Assert
        assertThrows(
                InvalidAccountStatusTransitionException.class,
                () -> accountService.freezeAccount(accountId));

        verify(accountRepository).findById(accountId);
        verify(accountRepository, never()).save(any(Account.class));
        verifyNoInteractions(accountMapper);
    }

    @Test
    void freezeAccount_fromClosed_throws() {

        // Arrange
        Long accountId = 1L;

        Account account = new Account();
        account.setAccountNumber("ACC001");
        account.setAccountName("John Doe");
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(AccountStatus.CLOSED);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        // Act & Assert
        assertThrows(
                InvalidAccountStatusTransitionException.class,
                () -> accountService.freezeAccount(accountId));

        verify(accountRepository).findById(accountId);
        verify(accountRepository, never()).save(any(Account.class));
        verifyNoInteractions(accountMapper);
    }

    @Test
    void activateAccount_fromFrozen_success() {

        // Arrange
        Long accountId = 1L;

        Account account = new Account();
        account.setAccountNumber("ACC001");
        account.setAccountName("John Doe");
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(AccountStatus.FROZEN);

        AccountResponse expectedResponse = new AccountResponse(
                accountId,
                "ACC001",
                "John Doe",
                AccountType.SAVINGS,
                AccountStatus.ACTIVE,
                null,
                null);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(accountRepository.save(account))
                .thenReturn(account);

        when(accountMapper.toResponse(account))
                .thenReturn(expectedResponse);

        // Act
        AccountResponse result = accountService.activateAccount(accountId);

        // Assert
        assertEquals(AccountStatus.ACTIVE, account.getStatus());
        assertEquals(expectedResponse, result);

        verify(accountRepository).findById(accountId);
        verify(accountRepository).save(account);
        verify(accountMapper).toResponse(account);
    }

    @Test
    void activateAccount_fromActive_throws() {

        // Arrange
        Long accountId = 1L;

        Account account = new Account();
        account.setAccountNumber("ACC001");
        account.setAccountName("John Doe");
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(AccountStatus.ACTIVE);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        // Act & Assert
        assertThrows(
                InvalidAccountStatusTransitionException.class,
                () -> accountService.activateAccount(accountId));

        verify(accountRepository).findById(accountId);
        verify(accountRepository, never()).save(any(Account.class));
        verifyNoInteractions(accountMapper);
    }

    @Test
    void activateAccount_fromClosed_throws() {

        // Arrange
        Long accountId = 1L;

        Account account = new Account();
        account.setAccountNumber("ACC001");
        account.setAccountName("John Doe");
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(AccountStatus.CLOSED);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        // Act & Assert
        assertThrows(
                InvalidAccountStatusTransitionException.class,
                () -> accountService.activateAccount(accountId));

        verify(accountRepository).findById(accountId);
        verify(accountRepository, never()).save(any(Account.class));
        verifyNoInteractions(accountMapper);
    }

    @Test
    void closeAccount_fromActive_success() {

        // Arrange
        Long accountId = 1L;

        Account account = new Account();
        account.setAccountNumber("ACC001");
        account.setAccountName("John Doe");
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(AccountStatus.ACTIVE);

        AccountResponse expectedResponse = new AccountResponse(
                accountId,
                "ACC001",
                "John Doe",
                AccountType.SAVINGS,
                AccountStatus.CLOSED,
                null,
                null);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(accountRepository.save(account))
                .thenReturn(account);

        when(accountMapper.toResponse(account))
                .thenReturn(expectedResponse);

        // Act
        AccountResponse result = accountService.closeAccount(accountId);

        // Assert
        assertEquals(AccountStatus.CLOSED, account.getStatus());
        assertEquals(expectedResponse, result);

        verify(accountRepository).findById(accountId);
        verify(accountRepository).save(account);
        verify(accountMapper).toResponse(account);
    }

    @Test
    void closeAccount_fromFrozen_success() {

        // Arrange
        Long accountId = 1L;

        Account account = new Account();
        account.setAccountNumber("ACC001");
        account.setAccountName("John Doe");
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(AccountStatus.FROZEN);

        AccountResponse expectedResponse = new AccountResponse(
                accountId,
                "ACC001",
                "John Doe",
                AccountType.SAVINGS,
                AccountStatus.CLOSED,
                null,
                null);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        when(accountRepository.save(account))
                .thenReturn(account);

        when(accountMapper.toResponse(account))
                .thenReturn(expectedResponse);

        // Act
        AccountResponse result = accountService.closeAccount(accountId);

        // Assert
        assertEquals(AccountStatus.CLOSED, account.getStatus());
        assertEquals(expectedResponse, result);

        verify(accountRepository).findById(accountId);
        verify(accountRepository).save(account);
        verify(accountMapper).toResponse(account);
    }

    @Test
    void closeAccount_fromClosed_throws() {

        // Arrange
        Long accountId = 1L;

        Account account = new Account();
        account.setAccountNumber("ACC001");
        account.setAccountName("John Doe");
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(AccountStatus.CLOSED);

        when(accountRepository.findById(accountId))
                .thenReturn(Optional.of(account));

        // Act & Assert
        assertThrows(
                InvalidAccountStatusTransitionException.class,
                () -> accountService.closeAccount(accountId));

        verify(accountRepository).findById(accountId);
        verify(accountRepository, never()).save(any(Account.class));
        verifyNoInteractions(accountMapper);
    }

    @Test
    void createAccount_concurrentDuplicate_dataIntegrityViolation() {

        // Arrange
        CreateAccountRequest request = new CreateAccountRequest(
                "ACC001",
                "John Doe",
                AccountType.SAVINGS);

        when(accountRepository.existsByAccountNumber("ACC001"))
                .thenReturn(false);

        when(accountRepository.save(any(Account.class)))
                .thenThrow(new DataIntegrityViolationException(
                        "Unique constraint violation"));

        // Act & Assert
        assertThrows(
                DuplicateAccountNumberException.class,
                () -> accountService.createAccount(request));

        verify(accountRepository).existsByAccountNumber("ACC001");
        verify(accountRepository).save(any(Account.class));
        verifyNoInteractions(accountMapper);
    }
}