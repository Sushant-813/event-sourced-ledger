/**
 * RootLayout
 *
 * Root layout component wrapping all routes with the AppShell.
 * On every route change, programmatically shifts focus to <main id="main-content">
 * so screen readers announce the new page context.
 *
 * Per FRONTEND_ARCHITECTURE.md §16.2:
 *   "On route navigation, keyboard focus is programmatically shifted to the
 *    main content container (<main tabindex="-1">) so screen readers announce
 *    the new view."
 */
import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PageContainer } from '@/components/layout/PageContainer'

export function RootLayout() {
  const location = useLocation()
  const hasMountedRef = useRef(false)

  useEffect(() => {
    // Skip focus shift on initial mount — the page is already focused correctly
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    // On subsequent navigations, move focus to the main content area
    // so screen readers announce the new page
    const mainEl = document.getElementById('main-content')
    if (mainEl !== null) {
      mainEl.focus()
    }
  }, [location.pathname])

  return (
    <AppShell>
      <PageContainer>
        <Outlet />
      </PageContainer>
    </AppShell>
  )
}
