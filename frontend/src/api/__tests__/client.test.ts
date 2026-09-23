/**
 * apiClient — Unit Tests
 *
 * Tests the centralized fetch wrapper covering:
 *   - 2xx success responses
 *   - 204 No Content
 *   - 4xx / 5xx error normalization into ApiError
 *   - Network failure mapping
 *   - Non-JSON error body handling
 *   - Query parameter construction (null/undefined filtering)
 *   - Absence of /api/v1 prefix
 *
 * Uses vi.stubGlobal to mock fetch — no network requests are made.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient } from '../../api/client'
import { ApiError } from '../../api/errors'

// ---------------------------------------------------------------------------
// Helper: create a minimal fetch Response mock
// ---------------------------------------------------------------------------
function mockResponse(
  status: number,
  body: unknown,
  ok?: boolean
): Response {
  const jsonBody = JSON.stringify(body)
  return {
    ok: ok ?? (status >= 200 && status < 300),
    status,
    statusText: String(status),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(jsonBody),
  } as unknown as Response
}

function mockJsonFailResponse(status: number): Response {
  return {
    ok: false,
    status,
    statusText: String(status),
    json: () => Promise.reject(new Error('not json')),
  } as unknown as Response
}

describe('apiClient — success responses', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns parsed JSON for a 200 OK response', async () => {
    const data = { id: 1, name: 'Test' }
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, data))

    const result = await apiClient<typeof data>('/accounts')
    expect(result).toEqual(data)
  })

  it('returns undefined for a 204 No Content response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(204, null))
    const result = await apiClient('/accounts/1/freeze', { method: 'PATCH' })
    expect(result).toBeUndefined()
  })
})

describe('apiClient — error normalization', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('throws ApiError with correct status for 400 Bad Request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse(400, {
        status: 400,
        error: 'Bad Request',
        message: 'Amount must be greater than zero',
        path: '/accounts/1/deposit',
      })
    )

    await expect(apiClient('/accounts/1/deposit', { method: 'POST' })).rejects.toSatisfy(
      (err: unknown): err is ApiError =>
        err instanceof ApiError &&
        err.status === 400 &&
        err.serverMessage === 'Amount must be greater than zero'
    )
  })

  it('throws ApiError with status 404 for Not Found', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse(404, {
        status: 404,
        error: 'Not Found',
        message: 'Account not found',
        path: '/accounts/999',
      })
    )

    await expect(apiClient('/accounts/999')).rejects.toSatisfy(
      (err: unknown): err is ApiError =>
        err instanceof ApiError && err.status === 404
    )
  })

  it('throws ApiError with status 422 for business rule violations', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse(422, {
        status: 422,
        error: 'Unprocessable Entity',
        message: 'Insufficient funds',
        path: '/accounts/1/withdrawal',
      })
    )

    await expect(apiClient('/accounts/1/withdrawal', { method: 'POST' })).rejects.toSatisfy(
      (err: unknown): err is ApiError =>
        err instanceof ApiError &&
        err.status === 422 &&
        err.serverMessage === 'Insufficient funds'
    )
  })

  it('throws ApiError with status 500 for internal server error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse(500, {
        status: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred.',
      })
    )

    await expect(apiClient('/accounts')).rejects.toSatisfy(
      (err: unknown): err is ApiError =>
        err instanceof ApiError && err.status === 500
    )
  })

  it('throws ApiError with isNetworkError=true when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(apiClient('/accounts')).rejects.toSatisfy(
      (err: unknown): err is ApiError =>
        err instanceof ApiError &&
        err.status === 0 &&
        err.isNetworkError === true
    )
  })

  it('throws ApiError with fallback message when error body is not JSON', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonFailResponse(503))

    await expect(apiClient('/accounts')).rejects.toSatisfy(
      (err: unknown): err is ApiError =>
        err instanceof ApiError && err.status === 503
    )
  })
})

describe('apiClient — query parameter handling', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('appends defined query parameters to the URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, { content: [] }))

    await apiClient('/accounts', { params: { page: 0, size: 20 } })

    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string
    expect(calledUrl).toContain('page=0')
    expect(calledUrl).toContain('size=20')
  })

  it('omits null parameter values from the URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, { content: [] }))

    await apiClient('/accounts', { params: { status: null, page: 0 } })

    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string
    expect(calledUrl).not.toContain('status=')
    expect(calledUrl).toContain('page=0')
  })

  it('omits undefined parameter values from the URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, { content: [] }))

    await apiClient('/accounts', { params: { status: undefined, page: 1 } })

    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string
    expect(calledUrl).not.toContain('status=')
    expect(calledUrl).toContain('page=1')
  })
})

describe('apiClient — URL invariants', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does NOT include /api/v1 in any request URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, {}))

    await apiClient('/accounts/1')

    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string
    expect(calledUrl).not.toContain('/api/v1')
  })
})
