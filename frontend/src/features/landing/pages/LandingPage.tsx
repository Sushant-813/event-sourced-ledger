/**
 * LandingPage Component
 *
 * Public-facing entry point for the Event Sourced Ledger.
 * Features a dedicated public layout with technical, restrained, and professional
 * presentation consistent with docs/DESIGN.md and the ledger application.
 *
 * Sections:
 *   1. Public Navigation Header (Brand, Section Anchor Links, ThemeToggle, Dashboard CTA, GitHub Link)
 *   2. Hero Section (Authoritative title, technical summary, primary CTAs, metric chips)
 *   3. Core Capabilities (6 cards: Event Sourcing, Double-Entry, Server-Authoritative State, etc.)
 *   4. How the System Works (End-to-end architectural data flow pipeline)
 *   5. Technology Stack (Actual backend, frontend, and verification technologies)
 *   6. Product Entry Preview (Live application bridge with "Open Dashboard" CTA)
 *   7. Public Footer (Metadata, repository link, technical summary)
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

const GITHUB_REPO_URL = 'https://github.com/Sushant-813/event-sourced-ledger'

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Skip link for keyboard accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* ------------------------------------------------------------------
       * 1. Public Header
       * ------------------------------------------------------------------ */}
      <header className="landing-header" aria-label="Main landing navigation">
        <div className="landing-container landing-header__inner">
          <Link to="/" className="landing-brand" aria-label="Event-Sourced Ledger Home">
            <svg
              className="landing-brand__logo"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <rect x="2" y="6" width="7" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="2" y="9.5" width="7" height="1.5" rx="0.75" fill="currentColor" opacity="0.7" />
              <rect x="2" y="13" width="7" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
              <rect x="15" y="6" width="7" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="15" y="9.5" width="7" height="1.5" rx="0.75" fill="currentColor" opacity="0.7" />
              <rect x="15" y="13" width="7" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
              <rect x="11" y="5" width="2" height="12" rx="1" fill="currentColor" opacity="0.25" />
            </svg>
            <span className="landing-brand__title">Ledger</span>
          </Link>

          <nav className="landing-nav" aria-label="Landing page sections">
            <a href="#capabilities" className="landing-nav__link">
              Capabilities
            </a>
            <a href="#architecture" className="landing-nav__link">
              Architecture
            </a>
            <a href="#stack" className="landing-nav__link">
              Tech Stack
            </a>
          </nav>

          <div className="landing-header__actions">
            <ThemeToggle />

            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-header__btn landing-header__btn--ghost"
              aria-label="View source code on GitHub (opens in a new tab)"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              <span className="landing-header__btn-label">GitHub</span>
            </a>

            <Link to="/dashboard" className="landing-header__btn landing-header__btn--primary">
              Open Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------
       * Main Content
       * ------------------------------------------------------------------ */}
      <main id="main-content" tabIndex={-1}>
        {/* ------------------------------------------------------------------
         * 2. Hero Section
         * ------------------------------------------------------------------ */}
        <section className="landing-hero" aria-labelledby="hero-heading">
          <div className="landing-container landing-hero__inner">
            <div className="landing-badge">
              <span className="landing-badge__dot" aria-hidden="true" />
              <span>Double-Entry Core • Append-Only Event Sourcing • Server-Authoritative State</span>
            </div>

            <h1 id="hero-heading" className="landing-hero__title">
              Event-Sourced Ledger
            </h1>

            <p className="landing-hero__lead">
              A high-integrity double-entry financial ledger engineered with immutable event sourcing,
              strict mathematical equilibrium (<span className="font-mono">∑ Debits = ∑ Credits</span>), and
              server-authoritative balance reconstruction. Designed for deterministic financial correctness and auditability.
            </p>

            <div className="landing-hero__actions">
              <Link to="/dashboard" className="landing-btn landing-btn--primary">
                <span>Open Dashboard</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>

              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="landing-btn landing-btn--secondary"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
                <span>View on GitHub</span>
              </a>
            </div>

            {/* Invariant Highlights Ribbon */}
            <div className="landing-highlights" role="list" aria-label="System Invariants">
              <div className="landing-highlight" role="listitem">
                <span className="landing-highlight__label">Accounting Standard</span>
                <strong className="landing-highlight__value">Double-Entry Bookkeeping</strong>
              </div>
              <div className="landing-highlight" role="listitem">
                <span className="landing-highlight__label">Persistence Model</span>
                <strong className="landing-highlight__value">Append-Only Event Store</strong>
              </div>
              <div className="landing-highlight" role="listitem">
                <span className="landing-highlight__label">Balance State</span>
                <strong className="landing-highlight__value">Server-Authoritative Replay</strong>
              </div>
              <div className="landing-highlight" role="listitem">
                <span className="landing-highlight__label">Historical Auditing</span>
                <strong className="landing-highlight__value">Point-in-Time Reconstruction</strong>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
         * 3. Core Capabilities
         * ------------------------------------------------------------------ */}
        <section id="capabilities" className="landing-section" aria-labelledby="capabilities-heading">
          <div className="landing-container">
            <div className="landing-section__header">
              <span className="landing-section__eyebrow">Architecture & Integrity</span>
              <h2 id="capabilities-heading" className="landing-section__title">
                Core Capabilities
              </h2>
              <p className="landing-section__desc">
                Engineered from foundational accounting laws and distributed ledger patterns, guaranteeing
                mathematical correctness across every financial transition.
              </p>
            </div>

            <div className="landing-grid landing-grid--3">
              {/* Card 1: Event Sourcing */}
              <div className="landing-card">
                <div className="landing-card__icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <h3 className="landing-card__title">Append-Only Event Sourcing</h3>
                <p className="landing-card__text">
                  State transitions are captured as immutable domain events. The event store contains the complete, unalterable historical narrative of every transaction.
                </p>
              </div>

              {/* Card 2: Double-Entry Equilibrium */}
              <div className="landing-card">
                <div className="landing-card__icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <h3 className="landing-card__title">Double-Entry Equilibrium</h3>
                <p className="landing-card__text">
                  Multi-legged transactions strictly enforce zero-sum mathematical equilibrium: total debits must equal total credits across all involved accounts.
                </p>
              </div>

              {/* Card 3: Server-Authoritative Balances */}
              <div className="landing-card">
                <div className="landing-card__icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3 className="landing-card__title">Authoritative Balances</h3>
                <p className="landing-card__text">
                  Balances are computed exclusively by replaying ledger entries on the server. The client is strictly presentational, eliminating calculation drift.
                </p>
              </div>

              {/* Card 4: Point-in-Time Audit Trail */}
              <div className="landing-card">
                <div className="landing-card__icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3 className="landing-card__title">Point-in-Time Reconstruction</h3>
                <p className="landing-card__text">
                  Reconstruct account balances and transaction activity as of any microsecond in history with ISO-8601 UTC temporal cutoff queries.
                </p>
              </div>

              {/* Card 5: Account Lifecycle Governance */}
              <div className="landing-card">
                <div className="landing-card__icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="landing-card__title">Account Lifecycle Governance</h3>
                <p className="landing-card__text">
                  Explicit state machine managing Active, Frozen, and Closed accounts with deterministic transition guards and zero-balance closure requirements.
                </p>
              </div>

              {/* Card 6: Atomic Monetary Operations */}
              <div className="landing-card">
                <div className="landing-card__icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <h3 className="landing-card__title">Atomic Monetary Operations</h3>
                <p className="landing-card__text">
                  Deposits, withdrawals, and inter-account transfers execute within isolated database transactions, guaranteeing ACID consistency without partial failures.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
         * 4. How the System Works (Architecture Pipeline)
         * ------------------------------------------------------------------ */}
        <section id="architecture" className="landing-section landing-section--alt" aria-labelledby="architecture-heading">
          <div className="landing-container">
            <div className="landing-section__header">
              <span className="landing-section__eyebrow">Execution Pipeline</span>
              <h2 id="architecture-heading" className="landing-section__title">
                How the System Works
              </h2>
              <p className="landing-section__desc">
                From user interaction to immutable persistence and state reconstruction, commands follow a deterministic, unidirectional pipeline.
              </p>
            </div>

            <div className="pipeline-flow" role="list" aria-label="System Workflow Pipeline">
              {/* Step 1 */}
              <div className="pipeline-step" role="listitem">
                <div className="pipeline-step__badge">1</div>
                <div className="pipeline-step__content">
                  <span className="pipeline-step__tag">Client Intent</span>
                  <h3 className="pipeline-step__title">Frontend Presentation</h3>
                  <p className="pipeline-step__desc">
                    React 19 interface captures monetary parameters via typed forms, dispatching validated commands to backend endpoints.
                  </p>
                </div>
              </div>

              <div className="pipeline-arrow" aria-hidden="true">↓</div>

              {/* Step 2 */}
              <div className="pipeline-step" role="listitem">
                <div className="pipeline-step__badge">2</div>
                <div className="pipeline-step__content">
                  <span className="pipeline-step__tag">Ingestion & Auth</span>
                  <h3 className="pipeline-step__title">REST API Validation</h3>
                  <p className="pipeline-step__desc">
                    Spring Boot REST controllers validate account existence, command formats, and positive monetary amounts.
                  </p>
                </div>
              </div>

              <div className="pipeline-arrow" aria-hidden="true">↓</div>

              {/* Step 3 */}
              <div className="pipeline-step" role="listitem">
                <div className="pipeline-step__badge">3</div>
                <div className="pipeline-step__content">
                  <span className="pipeline-step__tag">Domain Core</span>
                  <h3 className="pipeline-step__title">Double-Entry Ledger Engine</h3>
                  <p className="pipeline-step__desc">
                    Domain services evaluate lifecycle rules, verify sufficient funds, and construct balanced debit/credit ledger entries.
                  </p>
                </div>
              </div>

              <div className="pipeline-arrow" aria-hidden="true">↓</div>

              {/* Step 4 */}
              <div className="pipeline-step" role="listitem">
                <div className="pipeline-step__badge">4</div>
                <div className="pipeline-step__content">
                  <span className="pipeline-step__tag">Persistence</span>
                  <h3 className="pipeline-step__title">Append-Only Event Store</h3>
                  <p className="pipeline-step__desc">
                    Atomic transaction writes events and ledger entries to PostgreSQL. No rows are updated or overwritten in-place.
                  </p>
                </div>
              </div>

              <div className="pipeline-arrow" aria-hidden="true">↓</div>

              {/* Step 5 */}
              <div className="pipeline-step" role="listitem">
                <div className="pipeline-step__badge">5</div>
                <div className="pipeline-step__content">
                  <span className="pipeline-step__tag">State Derivation</span>
                  <h3 className="pipeline-step__title">Authoritative Balance Reconstruction</h3>
                  <p className="pipeline-step__desc">
                    Queries replay ledger entries on demand, delivering mathematically guaranteed account balances and audit sequences.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
         * 5. Technology Stack
         * ------------------------------------------------------------------ */}
        <section id="stack" className="landing-section" aria-labelledby="stack-heading">
          <div className="landing-container">
            <div className="landing-section__header">
              <span className="landing-section__eyebrow">Implementation Details</span>
              <h2 id="stack-heading" className="landing-section__title">
                Technology Stack
              </h2>
              <p className="landing-section__desc">
                Built strictly with proven enterprise technologies — no experimental libraries, no superfluous dependencies.
              </p>
            </div>

            <div className="landing-grid landing-grid--3">
              {/* Stack 1: Backend */}
              <div className="stack-card">
                <div className="stack-card__header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                    <line x1="6" y1="6" x2="6.01" y2="6" />
                    <line x1="6" y1="18" x2="6.01" y2="18" />
                  </svg>
                  <h3 className="stack-card__category">Backend & Persistence</h3>
                </div>
                <ul className="stack-card__list">
                  <li><strong>Java 21</strong> — Modern LTS with strict typing</li>
                  <li><strong>Spring Boot 3.5</strong> — Production-grade application framework</li>
                  <li><strong>Spring Data JPA</strong> — Declarative repository abstraction</li>
                  <li><strong>PostgreSQL 18</strong> — ACID relational storage</li>
                  <li><strong>Flyway</strong> — Version-controlled database schema migrations</li>
                </ul>
              </div>

              {/* Stack 2: Frontend */}
              <div className="stack-card">
                <div className="stack-card__header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  <h3 className="stack-card__category">Frontend Architecture</h3>
                </div>
                <ul className="stack-card__list">
                  <li><strong>React 19</strong> — Component-based user interface</li>
                  <li><strong>TypeScript</strong> — Compile-time type safety across domain models</li>
                  <li><strong>TanStack React Query v5</strong> — Async server state caching</li>
                  <li><strong>React Router v7</strong> — Declarative deep-link navigation</li>
                  <li><strong>Vite 6</strong> — Ultra-fast modular asset bundling</li>
                </ul>
              </div>

              {/* Stack 3: Testing */}
              <div className="stack-card">
                <div className="stack-card__header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <h3 className="stack-card__category">Quality & Verification</h3>
                </div>
                <ul className="stack-card__list">
                  <li><strong>Vitest</strong> — Fast unit & component testing suite</li>
                  <li><strong>React Testing Library</strong> — User-centric DOM assertions</li>
                  <li><strong>Playwright</strong> — Automated real browser E2E journeys</li>
                  <li><strong>ESLint</strong> — Zero-warning code quality enforcement</li>
                  <li><strong>WCAG AA</strong> — Verified contrast and accessibility</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
         * 6. Product Entry Preview & Final CTA
         * ------------------------------------------------------------------ */}
        <section className="landing-cta" aria-labelledby="cta-heading">
          <div className="landing-container landing-cta__inner">
            <div className="landing-cta__badge">Console Access</div>
            <h2 id="cta-heading" className="landing-cta__title">
              Explore the Ledger
            </h2>
            <p className="landing-cta__desc">
              Experience the live management console. Create accounts, execute balanced monetary operations,
              and inspect the immutable event store in real time.
            </p>

            <div className="landing-cta__actions">
              <Link to="/dashboard" className="landing-btn landing-btn--primary landing-btn--lg">
                <span>Open Dashboard</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------------
       * 7. Public Footer
       * ------------------------------------------------------------------ */}
      <footer className="landing-footer" aria-label="Landing page footer">
        <div className="landing-container landing-footer__inner">
          <div className="landing-footer__meta">
            <div className="landing-brand">
              <svg
                className="landing-brand__logo"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <rect x="2" y="6" width="7" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="2" y="9.5" width="7" height="1.5" rx="0.75" fill="currentColor" opacity="0.7" />
                <rect x="2" y="13" width="7" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
                <rect x="15" y="6" width="7" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="15" y="9.5" width="7" height="1.5" rx="0.75" fill="currentColor" opacity="0.7" />
                <rect x="15" y="13" width="7" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
                <rect x="11" y="5" width="2" height="12" rx="1" fill="currentColor" opacity="0.25" />
              </svg>
              <span className="landing-brand__title">Event-Sourced Ledger</span>
            </div>
            <p className="landing-footer__tagline">
              An institutional-grade double-entry financial ledger and audit platform with server-authoritative balance reconstruction.
            </p>
          </div>

          <div className="landing-footer__links">
            <div className="landing-footer__col">
              <span className="landing-footer__col-title">Navigation</span>
              <a href="#capabilities">Capabilities</a>
              <a href="#architecture">Architecture</a>
              <a href="#stack">Tech Stack</a>
            </div>

            <div className="landing-footer__col">
              <span className="landing-footer__col-title">Application</span>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/accounts">Accounts</Link>
              <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
                GitHub Repository
              </a>
            </div>
          </div>
        </div>

        <div className="landing-container landing-footer__bottom">
          <span>Event-Sourced Ledger • Core Financial Platform</span>
          <span>Open Source under MIT</span>
        </div>
      </footer>

      {/* ------------------------------------------------------------------
       * Scoped Styles
       * ------------------------------------------------------------------ */}
      <style>{`
        .landing-page {
          min-height: 100vh;
          background: var(--surface-canvas);
          color: var(--color-ink);
          font-family: var(--font-ui);
          display: flex;
          flex-direction: column;
        }

        .landing-container {
          max-width: var(--layout-content-max-width);
          margin-inline: auto;
          padding-inline: var(--space-lg);
          width: 100%;
        }

        /* ------------------------------------------------------------------
         * Header
         * ------------------------------------------------------------------ */
        .landing-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--surface-canvas);
          border-bottom: 1px solid var(--border-hairline);
          backdrop-filter: blur(8px);
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .landing-header__inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          gap: var(--space-md);
        }

        .landing-brand {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          color: var(--color-primary);
          text-decoration: none;
          font-weight: 700;
          font-size: 1.125rem;
          letter-spacing: -0.01em;
        }

        .landing-brand__logo {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        .landing-brand__title {
          color: var(--color-ink);
        }

        .landing-nav {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
        }

        .landing-nav__link {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--color-body);
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .landing-nav__link:hover {
          color: var(--color-primary);
        }

        .landing-header__actions {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .landing-header__btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 36px;
          padding: 0 14px;
          border-radius: var(--radius-pill);
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
          white-space: nowrap;
        }

        .landing-header__btn--ghost {
          background: transparent;
          color: var(--color-body);
          border: 1px solid var(--border-hairline);
        }

        .landing-header__btn--ghost:hover {
          background: var(--surface-soft);
          color: var(--color-ink);
        }

        .landing-header__btn--primary {
          background: var(--color-primary);
          color: #ffffff;
          border: 1px solid var(--color-primary);
        }

        .landing-header__btn--primary:hover {
          background: var(--color-primary-active);
          border-color: var(--color-primary-active);
        }

        /* ------------------------------------------------------------------
         * Hero Section
         * ------------------------------------------------------------------ */
        .landing-hero {
          padding-block: var(--space-xxl) var(--space-xl);
          background: radial-gradient(circle at 50% 0%, var(--surface-soft) 0%, var(--surface-canvas) 70%);
          border-bottom: 1px solid var(--border-hairline);
        }

        .landing-hero__inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 900px;
        }

        .landing-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: var(--radius-pill);
          background: var(--surface-card);
          border: 1px solid var(--border-hairline);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-muted);
          margin-bottom: var(--space-lg);
          box-shadow: var(--shadow-card);
        }

        .landing-badge__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-positive);
        }

        .landing-hero__title {
          font-size: clamp(2.25rem, 5vw, 3.5rem);
          font-weight: 800;
          letter-spacing: -0.025em;
          line-height: 1.15;
          margin-bottom: var(--space-md);
          color: var(--color-ink);
        }

        .landing-hero__lead {
          font-size: clamp(1.0625rem, 2vw, 1.25rem);
          line-height: 1.6;
          color: var(--color-body);
          margin-bottom: var(--space-xl);
          max-width: 760px;
        }

        .landing-hero__actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-md);
          margin-bottom: var(--space-xxl);
          flex-wrap: wrap;
        }

        .landing-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 48px;
          padding: 0 24px;
          border-radius: var(--radius-pill);
          font-size: 0.9375rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
        }

        .landing-btn:focus-visible,
        .landing-header__btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        .landing-btn--primary {
          background: var(--color-primary);
          color: #ffffff;
          border: 1px solid var(--color-primary);
          box-shadow: 0 2px 10px rgba(0, 82, 255, 0.2);
        }

        .landing-btn--primary:hover {
          background: var(--color-primary-active);
          border-color: var(--color-primary-active);
        }

        .landing-btn--secondary {
          background: var(--surface-card);
          color: var(--color-ink);
          border: 1px solid var(--border-hairline);
        }

        .landing-btn--secondary:hover {
          background: var(--surface-soft);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .landing-btn--lg {
          height: 52px;
          padding: 0 32px;
          font-size: 1.0625rem;
        }

        /* ------------------------------------------------------------------
         * Invariant Highlights Ribbon
         * ------------------------------------------------------------------ */
        .landing-highlights {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-md);
          width: 100%;
          padding: var(--space-md);
          background: var(--surface-card);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
        }

        .landing-highlight {
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: left;
          padding: var(--space-xs) var(--space-sm);
        }

        .landing-highlight__label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .landing-highlight__value {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--color-ink);
        }

        /* ------------------------------------------------------------------
         * Sections Common
         * ------------------------------------------------------------------ */
        .landing-section {
          padding-block: var(--space-xxl);
        }

        .landing-section--alt {
          background: var(--surface-soft);
          border-block: 1px solid var(--border-hairline);
        }

        .landing-section__header {
          text-align: center;
          max-width: 720px;
          margin-inline: auto;
          margin-bottom: var(--space-xxl);
        }

        .landing-section__eyebrow {
          display: inline-block;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-primary);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: var(--space-xs);
        }

        .landing-section__title {
          font-size: clamp(1.75rem, 3.5vw, 2.5rem);
          font-weight: 800;
          color: var(--color-ink);
          letter-spacing: -0.02em;
          margin-bottom: var(--space-sm);
        }

        .landing-section__desc {
          font-size: 1.0625rem;
          line-height: 1.6;
          color: var(--color-muted);
        }

        .landing-grid {
          display: grid;
          gap: var(--space-lg);
        }

        .landing-grid--3 {
          grid-template-columns: repeat(3, 1fr);
        }

        /* ------------------------------------------------------------------
         * Capability Cards
         * ------------------------------------------------------------------ */
        .landing-card {
          padding: var(--space-lg);
          background: var(--surface-card);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .landing-card:hover {
          border-color: var(--color-primary);
          transform: translateY(-2px);
        }

        .landing-card__icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--color-primary-soft);
          color: var(--color-primary);
        }

        .landing-card__title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-ink);
          margin: 0;
        }

        .landing-card__text {
          font-size: 0.9375rem;
          line-height: 1.5;
          color: var(--color-body);
          margin: 0;
        }

        /* ------------------------------------------------------------------
         * Architecture Pipeline
         * ------------------------------------------------------------------ */
        .pipeline-flow {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 720px;
          margin-inline: auto;
          gap: var(--space-xs);
        }

        .pipeline-step {
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
          width: 100%;
          padding: var(--space-md) var(--space-lg);
          background: var(--surface-card);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-card);
        }

        .pipeline-step__badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-primary);
          color: #ffffff;
          font-weight: 700;
          font-size: 0.9375rem;
          flex-shrink: 0;
        }

        .pipeline-step__content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pipeline-step__tag {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--color-primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pipeline-step__title {
          font-size: 1.0625rem;
          font-weight: 700;
          color: var(--color-ink);
          margin: 0;
        }

        .pipeline-step__desc {
          font-size: 0.875rem;
          line-height: 1.5;
          color: var(--color-body);
          margin: 0;
        }

        .pipeline-arrow {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-primary);
          line-height: 1;
          user-select: none;
        }

        /* ------------------------------------------------------------------
         * Technology Stack Cards
         * ------------------------------------------------------------------ */
        .stack-card {
          padding: var(--space-lg);
          background: var(--surface-card);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .stack-card__header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--color-primary);
        }

        .stack-card__category {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-ink);
          margin: 0;
        }

        .stack-card__list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .stack-card__list li {
          font-size: 0.875rem;
          line-height: 1.5;
          color: var(--color-body);
          padding-left: var(--space-sm);
          border-left: 2px solid var(--color-primary-soft);
        }

        .stack-card__list strong {
          color: var(--color-ink);
        }

        /* ------------------------------------------------------------------
         * CTA Section
         * ------------------------------------------------------------------ */
        .landing-cta {
          padding-block: var(--space-xxl);
          background: radial-gradient(circle at 50% 100%, var(--surface-soft) 0%, var(--surface-canvas) 70%);
          border-top: 1px solid var(--border-hairline);
        }

        .landing-cta__inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 680px;
        }

        .landing-cta__badge {
          display: inline-block;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-primary);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: var(--space-xs);
        }

        .landing-cta__title {
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--color-ink);
          margin-bottom: var(--space-sm);
        }

        .landing-cta__desc {
          font-size: 1.0625rem;
          line-height: 1.6;
          color: var(--color-muted);
          margin-bottom: var(--space-xl);
        }

        /* ------------------------------------------------------------------
         * Footer
         * ------------------------------------------------------------------ */
        .landing-footer {
          background: var(--surface-soft);
          border-top: 1px solid var(--border-hairline);
          padding-top: var(--space-xxl);
          padding-bottom: var(--space-lg);
          margin-top: auto;
        }

        .landing-footer__inner {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-xxl);
          padding-bottom: var(--space-xl);
          border-bottom: 1px solid var(--border-hairline);
          flex-wrap: wrap;
        }

        .landing-footer__meta {
          max-width: 380px;
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .landing-footer__tagline {
          font-size: 0.875rem;
          line-height: 1.6;
          color: var(--color-muted);
          margin: 0;
        }

        .landing-footer__links {
          display: flex;
          gap: var(--space-xxl);
        }

        .landing-footer__col {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .landing-footer__col-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-ink);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: var(--space-xs);
        }

        .landing-footer__col a {
          font-size: 0.875rem;
          color: var(--color-body);
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .landing-footer__col a:hover {
          color: var(--color-primary);
        }

        .landing-footer__bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--space-md);
          font-size: 0.8125rem;
          color: var(--color-muted);
          flex-wrap: wrap;
          gap: var(--space-sm);
        }

        /* ------------------------------------------------------------------
         * Responsive Adjustments
         * ------------------------------------------------------------------ */
        @media (max-width: 1023px) {
          .landing-grid--3 {
            grid-template-columns: repeat(2, 1fr);
          }

          .landing-highlights {
            grid-template-columns: repeat(2, 1fr);
          }

          .landing-nav {
            display: none;
          }
        }

        @media (max-width: 639px) {
          .landing-grid--3 {
            grid-template-columns: 1fr;
          }

          .landing-highlights {
            grid-template-columns: 1fr;
          }

          .landing-header__btn-label {
            display: none;
          }

          .landing-hero__actions {
            flex-direction: column;
            width: 100%;
          }

          .landing-btn {
            width: 100%;
          }

          .landing-footer__links {
            flex-direction: column;
            gap: var(--space-lg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .landing-card,
          .landing-btn,
          .landing-header__btn {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}
