// frontend/src/lib/api.ts
import type { TokenResponse, ApiError } from './types'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

class ApiClient {
  private accessToken: string | null = null

  setToken(token: string | null) {
    this.accessToken = token
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown
      params?: Record<string, string | number | boolean | undefined>
      signal?: AbortSignal
    } = {}
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`, window.location.origin)

    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) url.searchParams.set(key, String(value))
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await this.tryRefresh()
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`
        const retried = await fetch(url.toString(), {
          method,
          headers,
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        })
        if (!retried.ok) {
          const err: ApiError = await retried.json().catch(() => ({ detail: 'Request failed' }))
          throw new Error(err.detail ?? 'Request failed')
        }
        return retried.json() as Promise<T>
      }
      // Refresh failed — force logout
      this.accessToken = null
      window.dispatchEvent(new CustomEvent('auth:logout'))
      throw new Error('Session expired')
    }

    if (!response.ok) {
      const err: ApiError = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(err.detail ?? `HTTP ${response.status}`)
    }

    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }

  private async tryRefresh(): Promise<boolean> {
    const stored = localStorage.getItem('refresh_token')
    if (!stored) return false
    try {
      const res = await fetch(`${BASE_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: stored }),
      })
      if (!res.ok) return false
      const data: TokenResponse = await res.json()
      this.accessToken = data.access_token
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      return true
    } catch {
      return false
    }
  }

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>, signal?: AbortSignal) {
    return this.request<T>('GET', path, { params, signal })
  }
  post<T>(path: string, body?: unknown) {
    return this.request<T>('POST', path, { body })
  }
  put<T>(path: string, body?: unknown) {
    return this.request<T>('PUT', path, { body })
  }
  patch<T>(path: string, body?: unknown) {
    return this.request<T>('PATCH', path, { body })
  }
  delete<T>(path: string) {
    return this.request<T>('DELETE', path)
  }

  /** Multipart form-data upload */
  async postForm<T>(path: string, form: FormData): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`, window.location.origin)
    const headers: Record<string, string> = {}
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`
    const response = await fetch(url.toString(), { method: 'POST', headers, body: form })
    if (!response.ok) {
      const err: ApiError = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(err.detail ?? `HTTP ${response.status}`)
    }
    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }

  /** SSE streaming for AI chat */
  streamChat(
    conversationId: string | null,
    message: string,
    contextPage: string,
    onToken: (token: string) => void,
    onDone: (conversationId: string) => void,
    onError: (err: string) => void
  ): () => void {
    const url = new URL(`${BASE_URL}/v1/ai/chat`, window.location.origin)

    const body = JSON.stringify({
      messages: [{ role: 'user', content: message }],
      conversation_id: conversationId ? Number(conversationId) : null,
      context_page: contextPage || null,
      max_tokens: 2048,
    })
    const ctrl = new AbortController()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    }
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`

    fetch(url.toString(), { method: 'POST', headers, body, signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok || !res.body) { onError(`HTTP ${res.status}`); return }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let newConvId = conversationId ?? ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') { onDone(newConvId); return }
              try {
                const parsed = JSON.parse(data)
                if (parsed.error) { onError(parsed.error); return }
                if (parsed.conversation_id != null) newConvId = String(parsed.conversation_id)
                if (parsed.text) onToken(parsed.text)
                if (parsed.done) { onDone(newConvId); return }
              } catch { /* ignore malformed */ }
            }
          }
        }
        onDone(newConvId)
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== 'AbortError') onError(err.message)
      })

    return () => ctrl.abort()
  }
}

export const api = new ApiClient()
export const apiClient = api

// Hydrate token from localStorage on startup
const stored = localStorage.getItem('access_token')
if (stored) api.setToken(stored)
