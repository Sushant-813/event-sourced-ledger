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
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
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
        className={`sidebar${isOpen ? ' sidebar--open' : ''}${isCollapsed ? ' sidebar--collapsed' : ''}`}
        aria-label="Main navigation"
      >
        <ul className="sidebar__nav" role="list">
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
              onClick={onClose}
              aria-label="Dashboard"
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
              <span className="sidebar__label">Dashboard</span>
              <span className="sidebar__tooltip" role="tooltip">Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/accounts"
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
              onClick={onClose}
              aria-label="Accounts"
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
              <span className="sidebar__label">Accounts</span>
              <span className="sidebar__tooltip" role="tooltip">Accounts</span>
            </NavLink>
          </li>
        </ul>

        {/* Desktop sidebar collapse/expand toggle */}
        {onToggleCollapse && (
          <div className="sidebar__footer">
            <button
              type="button"
              className="sidebar__toggle"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!isCollapsed}
            >
              <svg
                className="sidebar__icon sidebar__toggle-icon"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                {isCollapsed ? (
                  <path d="M7 15l5-5-5-5" />
                ) : (
                  <path d="M13 15l-5-5 5-5" />
                )}
              </svg>
              <span className="sidebar__label sidebar__toggle-label">
                Collapse
              </span>
              <span className="sidebar__tooltip" role="tooltip">
                {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              </span>
            </button>
          </div>
        )}

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
            overflow-x: hidden;
            z-index: 90;
            display: flex;
            flex-direction: column;
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
            position: relative;
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

          .sidebar__footer {
            margin-top: auto;
            padding-top: var(--space-sm);
            border-top: 1px solid var(--border-hairline);
          }

          .sidebar__toggle {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            width: 100%;
            padding: var(--space-xs) var(--space-sm);
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--color-body);
            background: transparent;
            border: none;
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
            position: relative;
          }

          .sidebar__toggle:hover {
            background: var(--surface-soft);
            color: var(--color-ink);
          }

          .sidebar__toggle:focus-visible {
            outline: 2px solid var(--color-primary);
            outline-offset: 2px;
          }

          .sidebar__tooltip {
            display: none;
          }

          /* Desktop: smooth collapse transition and compact icon-only rail */
          @media (min-width: 1024px) {
            .sidebar {
              transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1), padding 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .sidebar--collapsed {
              width: var(--layout-sidebar-collapsed-width);
              padding-inline: var(--space-xs);
            }

            .sidebar--collapsed .sidebar__link {
              justify-content: center;
              padding-inline: 0;
            }

            .sidebar--collapsed .sidebar__label {
              display: none;
            }

            .sidebar--collapsed .sidebar__toggle {
              justify-content: center;
              padding-inline: 0;
            }

            .sidebar--collapsed .sidebar__link:hover .sidebar__tooltip,
            .sidebar--collapsed .sidebar__link:focus-visible .sidebar__tooltip,
            .sidebar--collapsed .sidebar__toggle:hover .sidebar__tooltip,
            .sidebar--collapsed .sidebar__toggle:focus-visible .sidebar__tooltip {
              display: block;
              position: absolute;
              left: calc(100% + var(--space-xs));
              top: 50%;
              transform: translateY(-50%);
              background: var(--color-ink);
              color: var(--surface-canvas);
              padding: var(--space-xxs) var(--space-xs);
              border-radius: var(--radius-sm);
              font-size: 0.75rem;
              font-weight: 500;
              line-height: 1.2;
              white-space: nowrap;
              pointer-events: none;
              z-index: 1000;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .sidebar {
              transition: none !important;
            }
          }

          /* Mobile: off-canvas slide-out (unaffected by desktop collapse) */
          @media (max-width: 1023px) {
            .sidebar {
              transform: translateX(-100%);
              transition: transform 0.25s ease;
              z-index: 95;
              width: var(--layout-sidebar-width) !important;
              padding-inline: var(--space-sm) !important;
            }

            .sidebar--open {
              transform: translateX(0);
            }

            .sidebar__footer {
              display: none;
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
