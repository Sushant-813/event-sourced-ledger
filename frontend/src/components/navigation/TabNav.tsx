/**
 * TabNav Component
 *
 * Horizontal tab navigation for account-context sub-views per DESIGN.md §18.
 * Uses React Router NavLink for deep-linking and active-route styling.
 */
import React from 'react'
import { NavLink } from 'react-router-dom'

export interface TabItem {
  label: string
  to: string
  end?: boolean
}

export interface TabNavProps {
  tabs?: TabItem[]
  className?: string
  ariaLabel?: string
}

export const DEFAULT_ACCOUNT_TABS: TabItem[] = [
  { label: 'Overview', to: 'overview' },
  { label: 'Transactions', to: 'transactions' },
  { label: 'Ledger', to: 'ledger' },
  { label: 'Events', to: 'events' },
  { label: 'Audit Trail', to: 'audit' },
]

export const TabNav: React.FC<TabNavProps> = ({
  tabs = DEFAULT_ACCOUNT_TABS,
  className = '',
  ariaLabel = 'Account Navigation',
}) => {
  return (
    <nav className={`tab-nav ${className}`.trim()} aria-label={ariaLabel}>
      <ul className="tab-nav__list">
        {tabs.map((tab) => (
          <li key={tab.to} className="tab-nav__item">
            <NavLink
              to={tab.to}
              {...(tab.end !== undefined ? { end: tab.end } : {})}
              className={({ isActive }) =>
                `tab-nav__link ${isActive ? 'tab-nav__link--active' : ''}`
              }
            >
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <style>{`
        .tab-nav {
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--border-hairline);
          background: var(--surface-canvas);
          padding: 0 var(--space-base);
        }

        .tab-nav__list {
          display: flex;
          align-items: center;
          gap: 8px;
          list-style: none;
          margin: 0;
          padding: 0;
          height: 48px;
        }

        .tab-nav__item {
          display: flex;
          align-items: center;
          height: 100%;
        }

        .tab-nav__link {
          display: inline-flex;
          align-items: center;
          height: 36px;
          padding: 0 14px;
          font-family: var(--font-ui);
          font-size: 14px;
          font-weight: 500;
          color: var(--color-body);
          text-decoration: none;
          border-radius: var(--radius-sm);
          transition: background-color 0.15s ease, color 0.15s ease;
          white-space: nowrap;
        }

        .tab-nav__link:hover:not(.tab-nav__link--active) {
          color: var(--color-ink);
          background: var(--surface-soft);
        }

        .tab-nav__link--active {
          color: var(--color-primary);
          background: var(--color-primary-soft);
          font-weight: 600;
        }

        .tab-nav__link:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
      `}</style>
    </nav>
  )
}
