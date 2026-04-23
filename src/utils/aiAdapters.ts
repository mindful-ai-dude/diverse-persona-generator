import type { AIAdapter, AIProviderConfig } from '../types/ai'

/**
 * Base OpenAI-compatible adapter
 * OpenRouter, Ollama Cloud, and Generic providers all use the same request format
 */
abstract class BaseOpenAIAdapter implements AIAdapter {
  protected async makeRequest(url: string, apiKey: string, body: object): Promise<Response> {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    })
  }

  async generate(config: AIProviderConfig, prompt: string): Promise<string> {
    const response = await this.makeRequest(this.getEndpoint(config), config.apiKey, {
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 1000
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AI request failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || data.message?.content || data.response || ''
  }

  abstract getEndpoint(config: AIProviderConfig): string
  abstract validateConfig(config: AIProviderConfig): boolean
}

/**
 * OpenRouter adapter
 * Uses model format: provider/model (e.g., google/gemma-4-31b-it:free)
 */
export class OpenRouterAdapter extends BaseOpenAIAdapter {
  getEndpoint(): string {
    return 'https://openrouter.ai/api/v1/chat/completions'
  }

  validateConfig(config: AIProviderConfig): boolean {
    // OpenRouter model format: provider/model
    return /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(config.model)
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
 * Ollama Cloud adapter
 * Uses model format: model:tag (e.g., kimi-k2.6:cloud)
 */
export class OllamaCloudAdapter extends BaseOpenAIAdapter {
  getEndpoint(): string {
    return 'https://ollama.com/api/chat'
  }

  validateConfig(config: AIProviderConfig): boolean {
    // Ollama model format: model:tag
    return /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_.-]+$/.test(config.model)
  }
}

/**
 * Generic OpenAI-compatible adapter
 * User provides their own base URL
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
 * Factory to get the correct adapter for a provider
 */
export function getAdapter(provider: string): AIAdapter {
  switch (provider) {
    case 'openrouter':
      return new OpenRouterAdapter()
    case 'ollama':
      return new OllamaCloudAdapter()
    case 'generic':
      return new GenericOpenAIAdapter()
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}

/**
 * Test connection to an AI provider
 */
export async function testConnection(config: AIProviderConfig): Promise<{ success: boolean; latency: number; error?: string }> {
  const startTime = performance.now()
  try {
    const adapter = getAdapter(config.provider)
    if (!adapter.validateConfig(config)) {
      return { success: false, latency: 0, error: 'Invalid configuration' }
    }

    // Send a simple test prompt
    await adapter.generate(
      { ...config, maxTokens: 5 },
      'Hello'
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