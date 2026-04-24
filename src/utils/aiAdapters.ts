import type { AIAdapter, AIProviderConfig } from '../types/ai'

/**
 * Base OpenAI-compatible adapter
 * OpenRouter, Local Ollama, and Generic providers all use the same request format
 */
abstract class BaseOpenAIAdapter implements AIAdapter {
  protected async makeRequest(url: string, apiKey: string, body: object): Promise<Response> {
    let cleanKey = (apiKey || '').trim()
    cleanKey = cleanKey.replace(/^[\"']|[\"']$/g, '') // remove surrounding quotes
    if (cleanKey.toLowerCase().startsWith('bearer ')) {
      cleanKey = cleanKey.slice(7).trim()
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (cleanKey) {
      headers['Authorization'] = `Bearer ${cleanKey}`
    }

    return fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
  }

  async generate(config: AIProviderConfig, prompt: string): Promise<string> {
    const response = await this.makeRequest(this.getEndpoint(config), config.apiKey, {
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 1000,
      stream: false
    })

    if (!response.ok) {
      const errorText = await response.text()
      // Try to parse a structured error message from providers like OpenRouter
      try {
        const errJson = JSON.parse(errorText)
        const msg = errJson?.error?.message || errJson?.message
        if (msg) throw new Error(`AI request failed: ${response.status} — ${msg}`)
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message.startsWith('AI request failed')) throw parseErr
      }
      throw new Error(`AI request failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || data.message?.content || data.response || ''
  }

  abstract getEndpoint(config: AIProviderConfig): string
  abstract validateConfig(config: AIProviderConfig): boolean
}

/**
 * OpenRouter adapter — OpenAI-compatible gateway
 * Model format: provider/model  (e.g., moonshotai/kimi-k2.5)
 * Endpoint: https://openrouter.ai/api/v1/chat/completions
 * Auth: Authorization: Bearer <sk-or-v1-...>
 * Optional headers per OpenRouter docs (April 2026): HTTP-Referer, X-Title
 */
export class OpenRouterAdapter extends BaseOpenAIAdapter {
  getEndpoint(): string {
    return 'https://openrouter.ai/api/v1/chat/completions'
  }

  validateConfig(config: AIProviderConfig): boolean {
    return typeof config.model === 'string' && config.model.includes('/')
  }

  async generate(config: AIProviderConfig, prompt: string): Promise<string> {
    const key = (config.apiKey || '').trim()
    if (!key) {
      throw new Error(
        'OpenRouter API key is required. Get yours at openrouter.ai/keys (format: sk-or-v1-...).'
      )
    }
    return super.generate(config, prompt)
  }

  // Override makeRequest to add OpenRouter-specific optional headers
  protected async makeRequest(url: string, apiKey: string, body: object): Promise<Response> {
    let cleanKey = (apiKey || '').trim()
    cleanKey = cleanKey.replace(/^[\"']|[\"']$/g, '')
    if (cleanKey.toLowerCase().startsWith('bearer ')) cleanKey = cleanKey.slice(7).trim()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cleanKey}`,
      // HTTP-Referer and X-Title are optional but recommended per OpenRouter docs
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4321',
      'X-Title': 'Diverse Persona Generator',
    }

    return fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  }

  async fetchModels(apiKey: string): Promise<string[]> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })
      if (!res.ok) return []
      const data = await res.json()
      return data.data?.map((m: { id: string }) => m.id) || []
    } catch {
      return []
    }
  }
}

/**
 * Ollama Cloud adapter — managed cloud inference (no local GPU needed)
 * Uses the native Ollama /api/chat endpoint on ollama.com.
 * The /v1/chat/completions (OpenAI-compat) path on ollama.com does NOT emit
 * CORS headers for browser origins, causing "Failed to fetch" from web apps.
 * The native /api/chat endpoint is the documented path for direct cloud access
 * and is CORS-enabled for browser clients.
 *
 * Per Ollama Cloud docs (April 2026):
 *   host: "https://ollama.com"
 *   Authorization: Bearer <OLLAMA_API_KEY>
 *   Endpoint: https://ollama.com/api/chat  (native Ollama format)
 *   Model format: model:cloud  (e.g., kimi-k2.6:cloud)
 */
export class OllamaCloudAdapter implements AIAdapter {
  private async makeRequest(url: string, apiKey: string, body: object): Promise<Response> {
    let cleanKey = (apiKey || '').trim()
    cleanKey = cleanKey.replace(/^[\"']|[\"']$/g, '')
    if (cleanKey.toLowerCase().startsWith('bearer ')) cleanKey = cleanKey.slice(7).trim()

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (cleanKey) headers['Authorization'] = `Bearer ${cleanKey}`

    return fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  }

  async generate(config: AIProviderConfig, prompt: string): Promise<string> {
    const key = (config.apiKey || '').trim()
    if (!key) {
      throw new Error(
        'Ollama Cloud API key is required. Get yours at ollama.com/settings/keys.'
      )
    }

    // Native Ollama /api/chat request body
    const response = await this.makeRequest('https://ollama.com/api/chat', key, {
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: {
        temperature: config.temperature ?? 0.7,
        num_predict: config.maxTokens ?? 1000,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errJson = JSON.parse(errorText)
        const msg = errJson?.error || errJson?.message
        if (msg) throw new Error(`Ollama Cloud request failed: ${response.status} — ${msg}`)
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message.startsWith('Ollama Cloud')) throw parseErr
      }
      throw new Error(`Ollama Cloud request failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    // Native Ollama response: { message: { role, content }, done, ... }
    const data = await response.json()
    return data.message?.content || data.response || ''
  }

  validateConfig(config: AIProviderConfig): boolean {
    return typeof config.model === 'string' && config.model.trim().length > 0
  }
}

/**
 * Local Ollama adapter — Ollama running on the user's own machine
 * Uses Ollama's OpenAI-compatible /v1/chat/completions endpoint
 * Default host: http://localhost:11434
 * No API key required for local usage.
 */
export class LocalOllamaAdapter extends BaseOpenAIAdapter {
  getEndpoint(config: AIProviderConfig): string {
    // Allow the user to override the host; fall back to standard local Ollama
    return config.baseUrl || 'http://localhost:11434/v1/chat/completions'
  }

  validateConfig(config: AIProviderConfig): boolean {
    return typeof config.model === 'string' && config.model.trim().length > 0
  }

  // Override makeRequest: local Ollama doesn't need an Authorization header
  // but won't break if one is sent with an empty key.
  protected async makeRequest(url: string, apiKey: string, body: object): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    // Add auth header only if an API key was provided (some secured local setups use one)
    if (apiKey && apiKey.trim()) {
      let cleanKey = apiKey.trim().replace(/^[\"']|[\"']$/g, '')
      if (cleanKey.toLowerCase().startsWith('bearer ')) cleanKey = cleanKey.slice(7).trim()
      headers['Authorization'] = `Bearer ${cleanKey}`
    }

    return fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
  }
}

/**
 * Generic OpenAI-compatible adapter
 * User provides their own full endpoint URL.
 */
export class GenericOpenAIAdapter extends BaseOpenAIAdapter {
  getEndpoint(config: AIProviderConfig): string {
    return config.baseUrl || ''
  }

  validateConfig(config: AIProviderConfig): boolean {
    return !!config.baseUrl && /^https?:\/\/.+/.test(config.baseUrl) && !!config.model
  }
}

/**
 * Factory: return the correct adapter for a given provider key
 */
export function getAdapter(provider: string): AIAdapter {
  switch (provider) {
    case 'ollama':
      return new OllamaCloudAdapter()
    case 'openrouter':
      return new OpenRouterAdapter()
    case 'local-ollama':
      return new LocalOllamaAdapter()
    case 'generic':
      return new GenericOpenAIAdapter()
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}

/**
 * Test connection to an AI provider by sending a minimal prompt
 */
export async function testConnection(
  config: AIProviderConfig
): Promise<{ success: boolean; latency: number; error?: string }> {
  const startTime = performance.now()
  try {
    const adapter = getAdapter(config.provider)
    if (!adapter.validateConfig(config)) {
      return { success: false, latency: 0, error: 'Invalid configuration — check model and API key.' }
    }

    await adapter.generate(
      { ...config, maxTokens: 10 },
      'Hi'
    )

    const latency = Math.round(performance.now() - startTime)
    return { success: true, latency }
  } catch (err) {
    const latency = Math.round(performance.now() - startTime)
    return {
      success: false,
      latency,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}