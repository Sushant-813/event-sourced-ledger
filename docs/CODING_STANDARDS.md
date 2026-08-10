# Coding Standards

**Project Name:** Event-Sourced Ledger (Double-Entry Bank Core)

**Version:** 1.0
---

# 1. Purpose

This document defines the coding standards for the Event-Sourced Ledger project.

Its purpose is to ensure:

- Consistency
- Readability
- Maintainability
- Testability
- Long-term scalability

Every source file in the project should follow these standards.

These rules apply equally to developers and AI-assisted code generation.

---

# 2. Guiding Principles

Every implementation should prioritize:

- Correctness over cleverness
- Readability over brevity
- Simplicity over unnecessary abstraction
- Explicit behavior over hidden behavior
- Maintainability over premature optimization

Code should be written for humans first.

---

# 3. General Java Standards

## Java Version

The project targets Java 21 LTS.

Do not introduce language features requiring newer versions unless the project is upgraded.

---

## Formatting

- Four-space indentation
- UTF-8 encoding
- Unix line endings where possible
- One public class per file
- Consistent brace style

---

## Naming

Names should clearly describe intent.

Prefer:

```java
calculateBalance()
```

instead of

```java
calc()
```

Variables should never require comments to explain their purpose.

---

# 4. Package Organization

The project follows feature-based organization.

Example:

```
account
    controller
    service
    repository
    entity
    dto
    mapper

transaction

ledger

event

audit

common

config

exception
```

Each package should represent one cohesive business capability.

---

# 5. Class Design

Each class should have a single responsibility.

Avoid classes that:

- Handle HTTP
- Perform validation
- Execute business logic
- Access the database

all at once.

---

# 6. Controller Standards

Controllers should remain thin.

Responsibilities:

- Receive requests
- Validate request format
- Delegate to services
- Return responses

Controllers must never contain business logic.

---

# 7. Service Standards

Services contain application logic.

Responsibilities:

- Coordinate workflows
- Invoke domain operations
- Manage transactions
- Enforce business use cases

Services should remain focused.

Large services should be decomposed.

---

# 8. Repository Standards

Repositories exist only for persistence.

Responsibilities:

- Store data
- Retrieve data
- Query data

Repositories must not contain business rules.

---

# 9. Entity Standards

Entities represent business concepts.

Rules:

- Keep entities focused.
- Avoid exposing mutable internal state unnecessarily.
- Do not place HTTP concerns inside entities.
- Avoid persistence-specific logic leaking into business behavior.

Entities should model the business, not the API.

---

# 10. DTO Standards

Always use DTOs for external communication.

Never expose entities directly through REST APIs.

Separate DTOs into:

- Request DTOs
- Response DTOs

DTOs should not contain business logic.

---

# 11. Method Design

Methods should:

- Have one responsibility
- Be easy to read
- Be reasonably short
- Use meaningful names

Prefer:

```java
calculateCurrentBalance()
```

over

```java
process()
```

---

# 12. Business Logic

Business rules belong inside the domain/service layer.

Never place business logic inside:

- Controllers
- Repositories
- DTOs
- Configuration classes

---

# 13. Exception Handling

Use custom exceptions for business failures.

Examples:

- AccountNotFoundException
- InsufficientFundsException
- InvalidTransactionException

Avoid throwing generic exceptions for business conditions.

Centralize exception handling.

---

# 14. Validation

Validation occurs at two levels.

## Request Validation

Framework validation.

Examples:

- Required fields
- Positive values
- Format checks

---

## Business Validation

Domain validation.

Examples:

- Account exists
- Account active
- Sufficient balance
- Balanced ledger

Business validation belongs in services/domain.

---

# 15. Logging

Use structured logging.

Log:

- Startup
- Shutdown
- Significant business operations
- Errors
- Unexpected failures

Do not log:

- Passwords
- Secrets
- Authentication tokens
- Sensitive financial data

Logging should aid debugging without exposing confidential information.

---

# 16. Comments

Code should be self-explanatory.

Comments should explain:

- Why something exists
- Business reasoning
- Architectural decisions

Avoid comments that simply repeat the code.

Bad

```java
// Increment counter
counter++;
```

Good

```java
// Retry counter prevents duplicate processing after transient failures.
```

---

# 17. Constants

Avoid magic numbers and hardcoded strings.

Prefer:

```java
MAX_RETRY_COUNT
```

instead of

```java
5
```

Configuration values should be externalized whenever appropriate.

---

# 18. Dependency Injection

Use constructor injection.

Avoid field injection.

Dependencies should be explicit.

---

# 19. Transactions

Financial operations should execute atomically.

Business operations involving money should be enclosed within a single transaction boundary.

Partial completion is not acceptable.

---

# 20. Testing Standards

Business logic should be testable.

Future unit tests should focus on:

- Business rules
- Financial correctness
- Edge cases
- Validation
- Failure scenarios

---

# 21. Documentation

Public classes and complex business logic should be documented when necessary.

Documentation should explain intent rather than implementation details.

Keep documentation synchronized with code changes.

---

# 22. Git Standards

Commit messages should follow a consistent convention.

Examples:

```
feat:
fix:
docs:
refactor:
test:
chore:
```

Commits should remain:

- Small
- Focused
- Descriptive

---

# 23. Code Review Checklist

Before merging code, verify:

- Naming is meaningful.
- No duplicated logic.
- Business rules are correctly implemented.
- Exceptions are handled.
- Logging is appropriate.
- Validation is complete.
- Documentation is updated.
- No unnecessary complexity has been introduced.

---

# 24. Anti-Patterns to Avoid

Avoid:

- God classes
- Massive controllers
- Fat repositories
- Business logic inside DTOs
- Static utility abuse
- Hardcoded configuration
- Premature optimization
- Duplicate logic
- Hidden side effects

---

# 25. SOLID Principles

The project follows the SOLID principles.

- Single Responsibility Principle
- Open/Closed Principle
- Liskov Substitution Principle
- Interface Segregation Principle
- Dependency Inversion Principle

These principles should guide architectural decisions rather than being followed mechanically.

---

# 26. Clean Code Principles

Code should be:

- Intentional
- Predictable
- Consistent
- Modular
- Easy to navigate
- Easy to modify

Favor straightforward implementations over clever solutions.

---

# 27. AI-Assisted Development Guidelines

AI-generated code must:

- Follow all project coding standards.
- Preserve architectural boundaries.
- Avoid introducing unnecessary dependencies.
- Remain readable and maintainable.
- Be reviewed before integration.

AI should accelerate development, not replace engineering judgment.

---

# 28. Guiding Philosophy

> **"Good code is not measured by how little it is written, but by how easily it can be understood, trusted, and extended."**

Every class, method, and package should have a clear purpose.

Consistency is more valuable than cleverness.

The codebase should remain understandable to a developer encountering it for the first time months or years after it was written.