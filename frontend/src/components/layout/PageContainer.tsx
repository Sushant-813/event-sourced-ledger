/**
 * PageContainer
 *
 * Constrains content to the 1200px maximum width defined in DESIGN.md §26
 * and FRONTEND_ARCHITECTURE.md §17.1 (Wide viewport: >1280px, max 1200px centered).
 *
 * Applied inside AppShell's main content area on every page.
 */
import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="page-container">
      {children}
      <style>{`
        .page-container {
          width: 100%;
          max-width: var(--layout-content-max-width);
          margin-inline: auto;
          padding-inline: var(--space-lg);
          padding-block: var(--space-xl);
        }

        @media (max-width: 640px) {
          .page-container {
            padding-inline: var(--space-base);
            padding-block: var(--space-lg);
          }
        }
      `}</style>
    </div>
  )
}
