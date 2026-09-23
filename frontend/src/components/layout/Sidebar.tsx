/**
 * Sidebar
 *
 * Left navigation sidebar — 240px wide on desktop, off-canvas slide-out on mobile.
 *
 * Navigation model per DESIGN.md §24:
 *   Level 1: Dashboard | Accounts
 *   (Level 2 account-context tabs live in AccountLayout, not here)
 *
 * Accessibility per FRONTEND_ARCHITECTURE.md §16.1:
 *   - Uses <nav> semantic landmark with aria-label
 *   - Current page link indicated via aria-current="page"
 *   - id="app-sidebar" matches aria-controls on the TopBar hamburger
 */
import { NavLink } from 'react-router-dom'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="sidebar__backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <nav
        id="app-sidebar"
        className={`sidebar${isOpen ? ' sidebar--open' : ''}`}
        aria-label="Main navigation"
      >
        <ul className="sidebar__nav" role="list">
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
              aria-current={undefined /* NavLink sets this via className */}
              onClick={onClose}
            >
              {/* Dashboard icon — grid/gauge motif per DESIGN.md §25 */}
              <svg
                className="sidebar__icon"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9" />
                <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.5" />
                <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.5" />
                <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9" />
              </svg>
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/accounts"
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
              onClick={onClose}
            >
              {/* Account icon — bank/building motif per DESIGN.md §25 */}
              <svg
                className="sidebar__icon"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M10 2L2 7h16L10 2z"
                  fill="currentColor"
                  opacity="0.8"
                />
                <rect x="3" y="8" width="2.5" height="7" rx="0.5" fill="currentColor" />
                <rect x="7.5" y="8" width="2.5" height="7" rx="0.5" fill="currentColor" />
                <rect x="12" y="8" width="2.5" height="7" rx="0.5" fill="currentColor" />
                <rect x="1.5" y="15.5" width="17" height="2" rx="0.5" fill="currentColor" />
              </svg>
              <span>Accounts</span>
            </NavLink>
          </li>
        </ul>

        <style>{`
          .sidebar {
            position: fixed;
            top: var(--layout-topbar-height);
            left: 0;
            bottom: 0;
            width: var(--layout-sidebar-width);
            background: var(--surface-canvas);
            border-right: 1px solid var(--border-hairline);
            padding-block: var(--space-lg);
            padding-inline: var(--space-sm);
            overflow-y: auto;
            z-index: 90;
          }

          .sidebar__backdrop {
            display: none;
          }

          .sidebar__nav {
            display: flex;
            flex-direction: column;
            gap: var(--space-xxs);
          }

          .sidebar__link {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            padding: var(--space-xs) var(--space-sm);
            border-radius: var(--radius-sm);
            font-size: 0.9375rem;
            font-weight: 500;
            color: var(--color-body);
            transition: background 0.15s, color 0.15s;
          }

          .sidebar__link:hover {
            background: var(--surface-soft);
            color: var(--color-ink);
          }

          .sidebar__link--active {
            background: var(--color-primary-soft);
            color: var(--color-primary);
          }

          .sidebar__link--active:hover {
            background: var(--color-primary-soft);
            color: var(--color-primary-active);
          }

          .sidebar__icon {
            width: 18px;
            height: 18px;
            flex-shrink: 0;
          }

          /* Mobile: off-canvas slide-out */
          @media (max-width: 1023px) {
            .sidebar {
              transform: translateX(-100%);
              transition: transform 0.25s ease;
              z-index: 95;
            }

            .sidebar--open {
              transform: translateX(0);
            }

            .sidebar__backdrop {
              display: block;
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.4);
              z-index: 94;
            }
          }
        `}</style>
      </nav>
    </>
  )
}
