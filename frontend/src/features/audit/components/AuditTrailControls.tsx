/**
 * AuditTrailControls Component
 *
 * Provides historical balance reconstruction controls per DESIGN.md §23.
 *
 * CRITICAL TEMPORAL INVARIANTS:
 *   - Input displays and accepts browser local time.
 *   - Local input is strictly normalized to UTC ISO-8601 before submission via normalizeAsOf().
 *   - Preserves inclusive backend semantics: occurredAt <= asOf.
 *   - Controls restricted to: datetime-local cutoff input, Reconstruct action, and Reset action.
 *   - Zero "Set to Current Time" or unapproved shortcut affordances.
 */
import React, { useState, useEffect } from 'react'
import { normalizeAsOf, toLocalDatetimeInputString } from '@/utils/date'

export interface AuditTrailControlsProps {
  currentAsOf: string | null
  onApplyAsOf: (utcIsoString: string) => void
  onReset: () => void
  isLoading?: boolean
  className?: string
}

export const AuditTrailControls: React.FC<AuditTrailControlsProps> = ({
  currentAsOf,
  onApplyAsOf,
  onReset,
  isLoading = false,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(() => toLocalDatetimeInputString(currentAsOf))

  useEffect(() => {
    setInputValue(toLocalDatetimeInputString(currentAsOf))
  }, [currentAsOf])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = normalizeAsOf(inputValue)
    if (normalized) {
      onApplyAsOf(normalized)
    }
  }

  const handleReset = () => {
    setInputValue('')
    onReset()
  }

  const isSubmitDisabled = !inputValue.trim() || isLoading
  const isHistoricalActive = Boolean(currentAsOf)

  return (
    <div className={`audit-controls ${className}`.trim()} data-testid="audit-controls">
      <form onSubmit={handleSubmit} className="audit-controls__form">
        <div className="audit-controls__input-group">
          <label htmlFor="audit-as-of-input" className="audit-controls__label">
            Reconstruct Balance As Of
          </label>
          <input
            id="audit-as-of-input"
            type="datetime-local"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="audit-controls__input font-mono"
            aria-describedby="audit-as-of-notice"
          />
        </div>

        <div className="audit-controls__actions">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="audit-controls__btn audit-controls__btn--primary"
          >
            Reconstruct
          </button>

          {isHistoricalActive && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="audit-controls__btn audit-controls__btn--reset"
            >
              Reset to Current Balance
            </button>
          )}
        </div>
      </form>

      <p id="audit-as-of-notice" className="audit-controls__notice text-muted">
        Includes all events where occurredAt &le; asOf. Events sharing the identical boundary timestamp are included together.
      </p>

      <style>{`
        .audit-controls {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
          padding: var(--space-base);
          background: var(--surface-soft);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-md);
        }

        .audit-controls__form {
          display: flex;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: var(--space-md);
        }

        .audit-controls__input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .audit-controls__label {
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 600;
          color: var(--color-ink);
        }

        .audit-controls__input {
          height: 38px;
          padding: 0 12px;
          font-size: 13px;
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-sm);
          background: var(--surface-canvas);
          color: var(--color-ink);
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .audit-controls__input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-soft);
        }

        .audit-controls__actions {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .audit-controls__btn {
          height: 38px;
          padding: 0 16px;
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .audit-controls__btn--primary {
          background: var(--color-primary);
          color: #ffffff;
          border: none;
        }

        .audit-controls__btn--primary:hover:not(:disabled) {
          background: var(--color-primary-active);
        }

        .audit-controls__btn--primary:disabled {
          background: var(--color-primary-disabled);
          cursor: not-allowed;
          opacity: 0.7;
        }

        .audit-controls__btn--reset {
          background: var(--surface-canvas);
          color: var(--color-ink);
          border: 1px solid var(--border-hairline);
        }

        .audit-controls__btn--reset:hover:not(:disabled) {
          background: var(--surface-strong);
        }

        .audit-controls__btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        .audit-controls__notice {
          font-size: 12px;
          margin: 0;
        }
      `}</style>
    </div>
  )
}
