/**
 * TopBar
 *
 * Fixed-height application header bar (60px per DESIGN.md §6 / FRONTEND_ARCHITECTURE.md §17).
 * Contains the application name and a slot for mobile menu toggle.
 *
 * Accessibility:
 *   - Uses <header> semantic landmark (FRONTEND_ARCHITECTURE.md §16.1)
 *   - ARIA label distinguishes it from other landmarks
 */
interface TopBarProps {
  onMobileMenuToggle: () => void
  isMobileMenuOpen: boolean
}

export function TopBar({ onMobileMenuToggle, isMobileMenuOpen }: TopBarProps) {
  return (
    <header className="topbar" aria-label="Application header">
      {/* Mobile hamburger button — visible only on narrow viewports */}
      <button
        className="topbar__menu-btn"
        onClick={onMobileMenuToggle}
        aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMobileMenuOpen}
        aria-controls="app-sidebar"
      >
        <span className="topbar__hamburger" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {/* Application identity */}
      <div className="topbar__brand">
        <svg
          className="topbar__logo"
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
        <span className="topbar__title">Ledger</span>
      </div>

      <style>{`
        .topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--layout-topbar-height);
          background: var(--surface-canvas);
          border-bottom: 1px solid var(--border-hairline);
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding-inline: var(--space-lg);
          z-index: 100;
        }

        .topbar__brand {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          color: var(--color-primary);
        }

        .topbar__logo {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        .topbar__title {
          font-family: var(--font-ui);
          font-size: 1.0625rem;
          font-weight: 700;
          color: var(--color-ink);
          letter-spacing: -0.01em;
        }

        /* Mobile hamburger — only shown on narrow viewports */
        .topbar__menu-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          color: var(--color-body);
          flex-shrink: 0;
          margin-right: var(--space-xxs);
        }

        .topbar__menu-btn:hover {
          background: var(--surface-soft);
        }

        .topbar__hamburger {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .topbar__hamburger span {
          display: block;
          width: 18px;
          height: 2px;
          background: currentColor;
          border-radius: 1px;
          transition: opacity 0.2s;
        }

        @media (max-width: 1023px) {
          .topbar__menu-btn {
            display: flex;
          }
        }
      `}</style>
    </header>
  )
}
