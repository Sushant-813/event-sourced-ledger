/**
 * AppShell
 *
 * The root application layout shell. Composes the full page structure:
 *   - Skip navigation link (keyboard accessibility)
 *   - TopBar (fixed header, 60px)
 *   - Sidebar (fixed left nav, 240px desktop / off-canvas mobile)
 *   - Main content area with PageContainer
 *   - aria-live region for toast announcements
 *
 * Responsive behavior per DESIGN.md §26 / FRONTEND_ARCHITECTURE.md §17:
 *   Desktop (>=1024px): persistent sidebar + fixed top bar
 *   Mobile (<1024px):   sidebar collapses to off-canvas, hamburger in TopBar
 *
 * Accessibility per FRONTEND_ARCHITECTURE.md §16:
 *   - Skip link bypasses sidebar navigation
 *   - <main tabindex="-1" id="main-content"> receives programmatic focus on
 *     route navigation (implemented via useEffect on location in RootLayout)
 *   - aria-live="polite" region for async announcements
 */
import { useState, type ReactNode } from 'react'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  function handleMobileMenuToggle() {
    setIsMobileMenuOpen((prev) => !prev)
  }

  function handleSidebarClose() {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Skip navigation — bypasses sidebar for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <TopBar
        onMobileMenuToggle={handleMobileMenuToggle}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <Sidebar isOpen={isMobileMenuOpen} onClose={handleSidebarClose} />

      {/* Main content region */}
      <main
        id="main-content"
        className="app-shell__main"
        tabIndex={-1}
        aria-label="Main content"
      >
        {children}
      </main>

      {/*
       * Polite aria-live region for async announcements.
       * FRONTEND_ARCHITECTURE.md §16.3: "A polite live region announces
       * asynchronous events (toast notifications, successful deposits, etc.)"
       * Content is populated by a toast/notification system in later phases.
       */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="aria-announcer"
      />

      <style>{`
        .app-shell__main {
          /* Offset for fixed TopBar */
          margin-top: var(--layout-topbar-height);
          /* Offset for fixed Sidebar on desktop */
          margin-left: var(--layout-sidebar-width);
          min-height: calc(100dvh - var(--layout-topbar-height));
          background: var(--surface-soft);
          /* Remove default focus outline — the skip-link target doesn't need a ring */
          outline: none;
        }

        /* Mobile: no sidebar offset */
        @media (max-width: 1023px) {
          .app-shell__main {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  )
}
