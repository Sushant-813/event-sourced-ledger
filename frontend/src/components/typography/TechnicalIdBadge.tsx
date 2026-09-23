/**
 * TechnicalIdBadge Component
 *
 * Monospace chip for technical identifiers (Account Number, UUID, Event ID).
 * Features an optional hover-activated copy-to-clipboard action with feedback.
 *
 * Design specs: docs/DESIGN.md §19
 *   - JetBrains Mono 13px, weight 400
 *   - Background: var(--surface-soft)
 *   - Border: 1px solid var(--border-hairline)
 *   - Radius: var(--radius-xs) (4px)
 *   - Padding: 2px 8px
 */
import React, { useState } from 'react'

export interface TechnicalIdBadgeProps {
  id: string | number
  label?: string
  copyable?: boolean
  className?: string
}

export const TechnicalIdBadge: React.FC<TechnicalIdBadgeProps> = ({
  id,
  label,
  copyable = true,
  className = '',
}) => {
  const [copied, setCopied] = useState(false)
  const textValue = String(id)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(textValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fallback for environments where clipboard API is unavailable
    }
  }

  return (
    <span
      className={`technical-id-badge ${className}`.trim()}
      title={label ? `${label}: ${textValue}` : textValue}
    >
      <span className="technical-id-badge__text font-mono">{textValue}</span>
      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          className="technical-id-badge__copy-btn"
          aria-label={`Copy ${label ?? 'identifier'}: ${textValue}`}
          title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? (
            <svg
              className="technical-id-badge__icon technical-id-badge__icon--success"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              className="technical-id-badge__icon"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      )}

      <style>{`
        .technical-id-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 2px 8px;
          background: var(--surface-soft);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-xs);
          font-size: 13px;
          line-height: 1.4;
          color: var(--color-ink);
          user-select: text;
          max-width: 100%;
        }

        .technical-id-badge__text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }

        .technical-id-badge__copy-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          background: transparent;
          border: none;
          color: var(--color-muted);
          border-radius: var(--radius-xs);
          cursor: pointer;
          transition: color 0.15s ease, background-color 0.15s ease;
        }

        .technical-id-badge__copy-btn:hover {
          color: var(--color-ink);
          background: var(--surface-strong);
        }

        .technical-id-badge__icon--success {
          color: var(--color-positive-text);
        }
      `}</style>
    </span>
  )
}
