export type AIProvider = 'openrouter' | 'ollama' | 'generic'

export interface AIProviderConfig {
  provider: AIProvider
  apiKey: string
  model: string
  baseUrl?: string
  temperature?: number
  maxTokens?: number
}

export interface AIAdapter {
  generate(config: AIProviderConfig, prompt: string): Promise<string>
  validateConfig(config: AIProviderConfig): boolean
  fetchModels?(apiKey: string): Promise<string[]>
}

export interface AIConfig extends AIProviderConfig {
  enabled: boolean
}

export type GenerationMode = 'deterministic' | 'ai'

export interface AIResponse {
  content: string
  latency: number
}