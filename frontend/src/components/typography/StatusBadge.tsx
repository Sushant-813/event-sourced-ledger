/**
 * StatusBadge Component
 *
 * Displays account lifecycle status (ACTIVE, FROZEN, CLOSED) with dual encoding:
 * distinctive semantic color scheme AND clear textual label. Never relies on color alone.
 *
 * Design specs: docs/DESIGN.md §10.2
 *   - ACTIVE: bg #ecfdf5, text #047857, border #a7f3d0
 *   - FROZEN: bg #fffbeb, text #b77900, border #fde68a
 *   - CLOSED: bg #f7f8fa, text #595e68, border #dee1e6
 */
import React from 'react'
import { AccountStatus } from '@/types/enums'

export interface StatusBadgeProps {
  status: AccountStatus
  className?: string
}

const STATUS_CONFIG: Record<
  AccountStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  [AccountStatus.ACTIVE]: {
    label: 'ACTIVE',
    bg: '#ecfdf5',
    color: '#047857',
    border: '#a7f3d0',
  },
  [AccountStatus.FROZEN]: {
    label: 'FROZEN',
    bg: '#fffbeb',
    color: '#b77900',
    border: '#fde68a',
  },
  [AccountStatus.CLOSED]: {
    label: 'CLOSED',
    bg: '#f7f8fa',
    color: '#595e68',
    border: '#dee1e6',
  },
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = STATUS_CONFIG[status] ?? {
    label: String(status),
    bg: 'var(--surface-soft)',
    color: 'var(--color-muted)',
    border: 'var(--border-hairline)',
  }

  return (
    <span
      className={`status-badge status-badge--${status.toLowerCase()} ${className}`.trim()}
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
      }}
      role="status"
    >
      <span className="status-badge__dot" style={{ backgroundColor: config.color }} aria-hidden="true" />
      <span className="status-badge__label">{config.label}</span>

      <style>{`
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 2px 8px;
          border-radius: var(--radius-pill);
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          line-height: 1.4;
          white-space: nowrap;
          user-select: none;
        }

        .status-badge__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      `}</style>
    </span>
  )
}
