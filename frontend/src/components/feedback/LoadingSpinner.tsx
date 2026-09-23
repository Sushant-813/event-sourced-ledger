/**
 * LoadingSpinner
 *
 * Accessible loading indicator for async operations.
 *
 * Accessibility:
 *   - role="status" announces loading state to screen readers
 *   - aria-label provides descriptive text
 *   - Spinner animation respects prefers-reduced-motion
 */
interface LoadingSpinnerProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({
  label = 'Loading…',
  size = 'md',
}: LoadingSpinnerProps) {
  const px = size === 'sm' ? 16 : size === 'lg' ? 40 : 24

  return (
    <div
      role="status"
      aria-label={label}
      className={`spinner spinner--${size}`}
      style={{ width: px, height: px }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="spinner__svg"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="var(--surface-strong)"
          strokeWidth="2.5"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          strokeDasharray="31.4"
          strokeDashoffset="23.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
      <style>{`
        .spinner {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .spinner__svg {
          width: 100%;
          height: 100%;
          animation: spinner-rotate 0.75s linear infinite;
        }

        @keyframes spinner-rotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .spinner__svg {
            animation: none;
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
