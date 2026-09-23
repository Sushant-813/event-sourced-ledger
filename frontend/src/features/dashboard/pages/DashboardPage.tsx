/**
 * DashboardPage — F0 Placeholder
 *
 * Minimal placeholder page demonstrating that the /dashboard route works.
 *
 * F0 SCOPE CONSTRAINT:
 *   This component contains NO business logic, NO data fetching, and
 *   NO dashboard metrics. The backend does not expose a dedicated metrics
 *   endpoint (DESIGN.md §22 — Future Milestones). Dashboard metrics are
 *   implemented in F1 using GET /accounts totalElements queries.
 *
 * Content is replaced entirely in F1.
 */
export function DashboardPage() {
  return (
    <div className="dashboard-placeholder">
      <h1>Dashboard</h1>
      <p className="text-muted">
        Dashboard metrics will be available in Phase F1.
      </p>

      <style>{`
        .dashboard-placeholder {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }
      `}</style>
    </div>
  )
}
