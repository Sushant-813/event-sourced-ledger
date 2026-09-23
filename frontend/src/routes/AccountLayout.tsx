/**
 * AccountLayout — F0 Shell
 *
 * Account-context layout shell. Establishes the route nesting structure
 * for all account sub-views. Renders child routes via <Outlet>.
 *
 * F0 SCOPE CONSTRAINT:
 *   This component contains NO data fetching, NO account metadata,
 *   NO tab navigation, and NO balance display. Those are implemented in F1.
 *   The shell exists in F0 solely to establish the correct nested routing
 *   structure defined in FRONTEND_ARCHITECTURE.md §3.
 *
 * Full AccountLayout (F1 will add):
 *   - Account metadata banner (accountNumber, accountName, status badge)
 *   - Balance card
 *   - Account context tab navigation
 *     (Overview | Transactions | Ledger | Events | Audit Trail)
 */
import { Outlet, useParams } from 'react-router-dom'

export function AccountLayout() {
  const { accountId } = useParams<{ accountId: string }>()

  return (
    <div className="account-layout">
      {/* Account context banner — implemented in F1 */}
      <div className="account-layout__banner-placeholder" aria-hidden="true">
        <span className="text-muted text-caption">
          Account #{accountId} — context navigation available in F1
        </span>
      </div>

      {/* Child route content */}
      <Outlet />

      <style>{`
        .account-layout {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .account-layout__banner-placeholder {
          padding: var(--space-sm) var(--space-lg);
          background: var(--surface-strong);
          border-bottom: 1px solid var(--border-hairline-soft);
        }
      `}</style>
    </div>
  )
}
