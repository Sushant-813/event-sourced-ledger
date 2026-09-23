/**
 * NotFoundPage
 *
 * Catch-all 404 page rendered for any unmatched route.
 * Minimal — no feature logic, no data fetching.
 */
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="not-found">
      <h1 className="not-found__code">404</h1>
      <p className="not-found__message">Page not found.</p>
      <p className="not-found__hint">
        The page you requested does not exist.
      </p>
      <Link to="/dashboard" className="not-found__link">
        Return to Dashboard
      </Link>

      <style>{`
        .not-found {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: var(--space-sm);
          text-align: center;
          padding: var(--space-xl);
        }

        .not-found__code {
          font-size: 5rem;
          font-weight: 700;
          color: var(--border-hairline);
          line-height: 1;
        }

        .not-found__message {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-ink);
        }

        .not-found__hint {
          color: var(--color-muted);
          font-size: 0.9375rem;
        }

        .not-found__link {
          margin-top: var(--space-base);
          padding: var(--space-xs) var(--space-lg);
          background: var(--color-primary);
          color: #ffffff;
          border-radius: var(--radius-sm);
          font-weight: 500;
          font-size: 0.9375rem;
          transition: background 0.15s;
        }

        .not-found__link:hover {
          background: var(--color-primary-active);
        }
      `}</style>
    </div>
  )
}
