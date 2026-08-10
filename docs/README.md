# Event-Sourced Ledger Documentation

Welcome to the documentation for the **Event-Sourced Ledger (Double-Entry Bank Core)** project.

This directory contains the complete design, architectural, and engineering documentation used throughout the project's lifecycle.

These documents are intended for:

- Developers
- AI Agents
- Code Reviewers
- Future Contributors

Together, they define the project's requirements, architecture, implementation standards, and development process.

---

# Documentation Reading Order

The documents are organized in the recommended reading sequence.

| Order | Document | Purpose |
|-------:|----------|---------|
| 1 | **PRD.md** | Defines the business problem, objectives, target users, core features, and project success criteria. |
| 2 | **TRD.md** | Specifies the complete technical stack, dependencies, tools, and technology decisions. |
| 3 | **ARCHITECTURE.md** | Explains the overall system architecture, design principles, layers, modules, and data flow. |
| 4 | **DATABASE_DESIGN.md** | Documents the database philosophy, entities, relationships, constraints, and schema design. |
| 5 | **API_GUIDELINES.md** | Defines REST API standards, request/response conventions, validation, and error handling. |
| 6 | **CODING_STANDARDS.md** | Establishes coding conventions, project structure, best practices, and implementation guidelines. |
| 7 | **PROJECT_ROADMAP.md** | Outlines the phased implementation plan and development milestones. |
| 8 | **DECISIONS.md** | Records important architectural and technical decisions (Architecture Decision Records). |
| 9 | **PROJECT_LOG.md** | Maintains a chronological record of project progress, completed milestones, and implementation history. |

---

# Documentation Categories

## Product Documentation

These documents describe **what** the project is intended to achieve.

- PRD.md

---

## Technical Documentation

These documents describe **how** the project is designed.

- TRD.md
- ARCHITECTURE.md
- DATABASE_DESIGN.md
- API_GUIDELINES.md

---

## Development Standards

These documents define **how development should be performed**.

- CODING_STANDARDS.md
- PROJECT_ROADMAP.md

---

## Engineering Records

These documents capture the project's evolution over time.

- DECISIONS.md
- PROJECT_LOG.md

---

# Documentation Principles

The documentation follows these principles:

- Every major engineering decision is documented.
- Documentation evolves alongside implementation.
- Documentation should always reflect the current state of the project.
- Architectural decisions should be traceable.
- Project history should remain preserved.

---

# Keeping Documentation Updated

Whenever significant changes are introduced:

- Update the relevant design document.
- Record architectural decisions in **DECISIONS.md**.
- Record completed milestones in **PROJECT_LOG.md**.
- Ensure documentation remains synchronized with implementation.

Documentation is considered part of the codebase and should be maintained with the same level of care.

---

# Related Documentation

This directory describes the **project itself**.

Documentation related to the AI-assisted development environment is maintained separately in:

```text
ai/
└── AI_DEVELOPMENT_ENVIRONMENT.md
```

This separation keeps project documentation independent from AI tooling and development environment configuration.

---

# Guiding Philosophy

> **"Good software is built twice: first in design, then in code."**

The documents in this directory define the blueprint for the Event-Sourced Ledger project. They provide a shared understanding of the system's goals, architecture, implementation standards, and evolution, ensuring consistency throughout the project's lifecycle.