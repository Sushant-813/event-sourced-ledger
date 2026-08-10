# API Guidelines

**Project Name:** Event-Sourced Ledger (Double-Entry Bank Core)

**Version:** 1.0
Related Documents

- PRD.md                  ← Business requirements
- TRD.md                  ← Technology choices
- ARCHITECTURE.md         ← Layer responsibilities
- DATABASE_DESIGN.md      ← Data model
---

# 1. Purpose

This document defines the API design standards for the Event-Sourced Ledger project.

Its purpose is to ensure that every REST endpoint follows a consistent structure, naming convention, request format, response format, and error handling strategy.

These guidelines apply to all current and future APIs developed within the project.

---

# 2. API Design Philosophy

The API should be:

- Predictable
- Consistent
- Stateless
- Resource-Oriented
- Easy to Consume
- Easy to Extend

The API should expose business capabilities rather than database implementation details.

Clients should interact with business resources instead of internal entities.

---

# 3. REST Principles

Every endpoint should follow RESTful conventions.

## Resource-Oriented URLs

Good

```
/accounts
/accounts/{id}
/transactions
/events
```

Avoid

```
/createAccount
/getAllAccounts
/deleteTransaction
```

The URL identifies the resource.

The HTTP method identifies the action.

---

## Stateless Communication

Every request should contain all information required for processing.

The server must not depend on previous client requests.

---

## JSON Communication

All requests and responses use JSON.

Request

```json
{
  "amount": 500
}
```

Response

```json
{
  "id": 15,
  "status": "SUCCESS"
}
```

---

# 4. HTTP Methods

The project follows standard HTTP semantics.

| Method | Purpose |
|----------|----------|
| GET | Retrieve data |
| POST | Create resources or execute business actions |
| PUT | Replace an existing resource |
| PATCH | Partially update a resource |
| DELETE | Remove a resource (only where applicable) |

Business operations such as transfers may also use POST because they create new financial records.

---

# 5. URI Naming Conventions

Use:

- lowercase
- plural nouns
- hyphens when necessary

Examples

```
/accounts
/transactions
/events
/ledger-entries
```

Avoid:

```
/Account
/getAccounts
/accountList
```

---

# 6. Request Design

Every request should contain only the information required to perform the requested operation.

Request bodies should be represented using dedicated DTOs.

Business entities should never be exposed directly.

Example

```json
{
  "sourceAccountId": 1,
  "destinationAccountId": 2,
  "amount": 1000
}
```

---

# 7. Response Design

Responses should be:

- Minimal
- Predictable
- Consistent

Every successful response should return meaningful information.

Example

```json
{
  "transactionId": 125,
  "status": "SUCCESS",
  "timestamp": "2026-08-04T12:30:15Z"
}
```

Avoid returning unnecessary database fields.

---

# 8. HTTP Status Codes

Use standard HTTP status codes.

| Code | Meaning |
|--------|----------|
| 200 | Success |
| 201 | Resource Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Resource Not Found |
| 409 | Conflict |
| 422 | Business Rule Violation |
| 500 | Internal Server Error |

Status codes should accurately represent the outcome of the request.

---

# 9. Validation

Validation occurs in two stages.

## Request Validation

Ensures that incoming data is structurally valid.

Examples

- Required fields
- Positive amounts
- Valid identifiers
- String length

---

## Business Validation

Ensures that business rules are satisfied.

Examples

- Account exists
- Account is active
- Sufficient funds
- Balanced transaction

Business validation belongs inside the domain layer.

---

# 10. Error Response Format

Every error should follow a consistent structure.

Example

```json
{
  "timestamp": "2026-08-04T14:10:22Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Amount must be greater than zero",
  "path": "/transactions/deposit"
}
```

Error responses should never expose:

- Stack traces
- SQL statements
- Internal implementation details

---

# 11. Pagination

Endpoints returning collections should support pagination.

Example

```
GET /transactions?page=0&size=20
```

Responses should include:

- current page
- page size
- total pages
- total elements

---

# 12. Sorting

Collection endpoints should support sorting.

Example

```
GET /events?sort=occurredAt,desc
```

Sorting should remain optional.

---

# 13. Filtering

Filtering should use query parameters.

Examples

```
GET /events?accountId=5
```

```
GET /transactions?status=COMPLETED
```

```
GET /events?eventType=DEPOSIT
```

---

# 14. Versioning Strategy

The initial version of the project does not expose explicit API versioning.

Future versions may adopt URI versioning.

Example

```
/api/v1/accounts
```

Breaking changes should introduce a new API version.

---

# 15. Idempotency

Read operations must always be idempotent.

Future versions may introduce idempotency keys for financial operations.

Example

```
POST /transactions

Idempotency-Key:
```

This prevents duplicate financial transactions.

---

# 16. Date & Time Standards

All timestamps should use ISO-8601 format.

Example

```
2026-08-04T14:25:30Z
```

Store timestamps in UTC.

Convert to local time only at presentation.

---

# 17. Monetary Values

Monetary values must never use floating-point types.

Amounts should be represented using precise decimal types.

Example

```
1000.50
```

Precision must never be lost during financial calculations.

---

# 18. API Documentation

Every endpoint should be documented using OpenAPI / Swagger.

Documentation should include:

- Endpoint description
- Request schema
- Response schema
- Validation rules
- Error responses
- Example payloads

Swagger is the source of endpoint documentation.

This document defines only the design standards.

---

# 19. Security Guidelines

Authentication is intentionally excluded from the initial implementation.

Future versions may introduce:

- JWT Authentication
- Role-Based Authorization
- Permissions
- Refresh Tokens

Business logic should remain independent of authentication mechanisms.

---

# 20. Consistency Rules

Every API should follow these rules.

- Use plural resource names.
- Return appropriate HTTP status codes.
- Use JSON.
- Validate input.
- Return consistent error responses.
- Never expose internal entities.
- Never expose database implementation details.
- Keep endpoints resource-oriented.
- Keep request and response formats predictable.

---

# 21. Future Enhancements

Future API capabilities may include:

- Bulk Operations
- Batch Processing
- API Versioning
- Idempotency Keys
- Cursor Pagination
- Rate Limiting
- HATEOAS
- Event Streaming
- Webhooks

These enhancements should remain compatible with the core API philosophy.

---

# 22. Guiding Philosophy

> **"An API is a contract, not an implementation."**

Clients should interact with stable business capabilities rather than internal application details.

Every endpoint should be intuitive, consistent, and resilient to future evolution.

A well-designed API minimizes surprises, encourages correct usage, and remains maintainable as the system grows.