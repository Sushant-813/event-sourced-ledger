/**
 * AccountLayout — Full F1 Implementation
 *
 * Account-context layout shell providing:
 *   - Account identification banner (name, account number chip, type, status badge)
 *   - Authoritative reconstructed current balance
 *   - Deep-linkable account sub-view navigation (TabNav)
 *   - Error boundary for missing/inaccessible accounts (404 / SYS-CASH)
 *   - Sub-view Outlet with shared AccountOutletContext
 *
 * Financial correctness rules:
 *   - Balance loaded exclusively from GET /accounts/{id}/audit/balance.
 *   - Rendered using Money.fromWire(); never calculated client-side.
 */
import React from 'react'
import { Outlet, useParams, useOutletContext } from 'react-router-dom'
import { useAccount } from '@/features/accounts/api/accountQueries'
import { useAccountBalance } from '@/features/audit/api/auditQueries'
import { isNotFound } from '@/api/errors'
import { Money } from '@/utils/money'
import { StatusBadge } from '@/components/typography/StatusBadge'
import { TechnicalIdBadge } from '@/components/typography/TechnicalIdBadge'
import { TabNav } from '@/components/navigation/TabNav'
import { AccountNotFoundView } from '@/features/accounts/components/AccountNotFoundView'
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay'
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner'
import type { AccountOutletContext } from '@/features/accounts/types/account'

export function useAccountContext(): AccountOutletContext {
  return useOutletContext<AccountOutletContext>()
}

export const AccountLayout: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>()

  const {
    data: account,
    isLoading: isAccountLoading,
    error: accountError,
    refetch: refetchAccount,
  } = useAccount(accountId)

  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useAccountBalance(accountId, { enabled: Boolean(account) })

  // 1. Loading state
  if (isAccountLoading) {
    return (
      <div className="account-layout account-layout--loading">
        <div className="account-layout__skeleton-banner">
          <LoadingSpinner size="lg" label="Loading account details..." />
        </div>
        <style>{`
          .account-layout--loading {
            padding: var(--space-xxl) 0;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .account-layout__skeleton-banner {
            text-align: center;
          }
        `}</style>
      </div>
    )
  }

  // 2. 404 / Missing account (including SYS-CASH)
  if (isNotFound(accountError) || !account) {
    return accountId !== undefined ? (
      <AccountNotFoundView accountId={accountId} />
    ) : (
      <AccountNotFoundView />
    )
  }

  // 3. Network or other server error
  if (accountError) {
    return (
      <div className="account-layout__error-wrapper">
        <ErrorDisplay
          error={accountError}
          title="Failed to Load Account"
          onRetry={() => {
            void refetchAccount()
          }}
        />
        <style>{`
          .account-layout__error-wrapper {
            padding: var(--space-xl) var(--space-base);
            max-width: 600px;
            margin: 0 auto;
          }
        `}</style>
      </div>
    )
  }

  const balanceMoney = Money.fromWire(balanceData?.balance)
  const balanceString = balanceMoney.format()

  const outletContext: AccountOutletContext = {
    account,
    refetchAccount,
    balanceString,
    isBalanceLoading,
    balanceError,
    refetchBalance,
  }

  return (
    <div className="account-layout">
      {/* Account Context Banner */}
      <header className="account-layout__banner">
        <div className="account-layout__banner-content">
          <div className="account-layout__identity">
            <div className="account-layout__title-row">
              <h1 className="account-layout__account-name">{account.accountName}</h1>
              <StatusBadge status={account.status} />
            </div>

            <div className="account-layout__meta-row">
              <TechnicalIdBadge
                id={account.accountNumber}
                label="Account Number"
                copyable
              />
              <span className="account-layout__meta-divider">•</span>
              <span className="account-layout__account-type">{account.accountType}</span>
            </div>
          </div>

          <div className="account-layout__balance-box">
            <span className="account-layout__balance-label">Current Balance</span>
            <div className="account-layout__balance-value font-mono">
              {isBalanceLoading ? (
                <span className="account-layout__balance-loading text-muted">
                  Loading...
                </span>
              ) : balanceError ? (
                <span className="account-layout__balance-error">Unavailable</span>
              ) : (
                <span className="financial-value">
                  <span className="account-layout__currency-prefix">₹</span>{' '}
                  {balanceString}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabNav />
      </header>

      {/* Child Sub-Views via Outlet */}
      <main className="account-layout__body">
        <Outlet context={outletContext} />
      </main>

      <style>{`
        .account-layout {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          width: 100%;
        }

        .account-layout__banner {
          background: var(--surface-card);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .account-layout__banner-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-lg) var(--space-xl);
          flex-wrap: wrap;
          gap: var(--space-lg);
        }

        .account-layout__identity {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .account-layout__title-row {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex-wrap: wrap;
        }

        .account-layout__account-name {
          font-family: var(--font-ui);
          font-size: 24px;
          font-weight: 700;
          color: var(--color-ink);
          margin: 0;
          line-height: 1.2;
        }

        .account-layout__meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-muted);
          font-size: 13px;
        }

        .account-layout__meta-divider {
          color: var(--border-hairline);
        }

        .account-layout__account-type {
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 12px;
          color: var(--color-body);
        }

        .account-layout__balance-box {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
        }

        .account-layout__balance-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .account-layout__balance-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-ink);
          font-variant-numeric: tabular-nums;
        }

        .account-layout__currency-prefix {
          font-weight: 500;
          color: var(--color-muted);
          margin-right: 2px;
        }

        .account-layout__balance-loading {
          font-size: 16px;
          font-weight: 400;
        }

        .account-layout__balance-error {
          font-size: 16px;
          color: var(--color-negative);
          font-weight: 500;
        }

        .account-layout__body {
          width: 100%;
        }

        @media (max-width: 640px) {
          .account-layout__banner-content {
            flex-direction: column;
            align-items: flex-start;
          }
          .account-layout__balance-box {
            align-items: flex-start;
            text-align: left;
          }
        }
      `}</style>
    </div>
  )
}
