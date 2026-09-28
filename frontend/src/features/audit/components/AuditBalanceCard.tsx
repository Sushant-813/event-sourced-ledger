/**
 * AuditBalanceCard Component
 *
 * Displays the authoritative reconstructed final balance for an account.
 * Sourced directly from AuditTrailResponse.finalBalance.
 *
 * CRITICAL FINANCIAL INVARIANTS:
 *   - Performs ZERO client-side arithmetic or balance derivation.
 *   - Sourced exclusively from the backend response; issues no independent API requests.
 *   - Distinguishes Current vs Historical Reconstructed Balance.
 *   - Explicitly displays 0.00 when the authoritative balance is zero.
 */
import React from 'react'
import { Money } from '@/utils/money'
import { formatTimestamp } from '@/utils/date'

export interface AuditBalanceCardProps {
  finalBalance: string | number
  asOf: string | null
  totalElements: number
  className?: string
}

export const AuditBalanceCard: React.FC<AuditBalanceCardProps> = ({
  finalBalance,
  asOf,
  totalElements,
  className = '',
}) => {
  const balanceMoney = Money.fromWire(finalBalance)
  const isHistorical = asOf !== null && asOf !== undefined && asOf.trim() !== ''

  return (
    <div
      className={`audit-balance-card ${isHistorical ? 'audit-balance-card--historical' : ''} ${className}`.trim()}
      data-testid="audit-balance-card"
    >
      <div className="audit-balance-card__content">
        <div className="audit-balance-card__header-row">
          <span className="audit-balance-card__badge font-mono">
            {isHistorical ? 'HISTORICAL RECONSTRUCTED BALANCE' : 'CURRENT RECONSTRUCTED BALANCE'}
          </span>
          {isHistorical && (
            <span className="audit-balance-card__cutoff font-mono text-muted">
              Cutoff: {formatTimestamp(asOf)}
            </span>
          )}
        </div>

        <div className="audit-balance-card__amount-row">
          <div className="audit-balance-card__amount font-mono">
            <span className="audit-balance-card__currency-prefix">₹</span>{' '}
            {balanceMoney.format()}
          </div>
        </div>

        <div className="audit-balance-card__meta-row">
          <p className="audit-balance-card__explanation text-muted">
            {isHistorical
              ? `Derived from ${totalElements} historical event(s) up to selected cutoff point. Events occurring after this timestamp are excluded.`
              : `Authoritative reconstructed balance derived from complete chronological event history (${totalElements} event(s)).`}
          </p>
          <span className="audit-balance-card__authority-note">
            Server-authoritative balance derived from full event replay prior to pagination.
          </span>
        </div>
      </div>

      <style>{`
        .audit-balance-card {
          background: var(--surface-card);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-md);
          padding: var(--space-base) var(--space-lg);
          transition: border-color 0.15s ease;
        }

        .audit-balance-card--historical {
          border-left: 4px solid var(--color-warning);
          background: var(--surface-card);
        }

        .audit-balance-card__content {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .audit-balance-card__header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-xs);
        }

        .audit-balance-card__badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: var(--radius-xs);
          background: var(--surface-soft);
          border: 1px solid var(--border-hairline);
          color: var(--color-ink);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .audit-balance-card--historical .audit-balance-card__badge {
          background: var(--surface-warning-soft);
          border-color: var(--color-warning);
          color: var(--color-ink);
        }

        .audit-balance-card__cutoff {
          font-size: 12px;
        }

        .audit-balance-card__amount-row {
          margin: 2px 0;
        }

        .audit-balance-card__amount {
          font-size: 26px;
          font-weight: 700;
          color: var(--color-ink);
          font-variant-numeric: tabular-nums;
          line-height: 1.2;
        }

        .audit-balance-card__currency-prefix {
          font-weight: 500;
          color: var(--color-muted);
          margin-right: 2px;
        }

        .audit-balance-card__meta-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .audit-balance-card__explanation {
          font-size: 13px;
          margin: 0;
        }

        .audit-balance-card__authority-note {
          font-size: 11px;
          color: var(--color-muted);
          font-style: italic;
        }
      `}</style>
    </div>
  )
}
