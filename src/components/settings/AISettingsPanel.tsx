import { useState } from 'react'
import { X, Zap, TestTube, AlertCircle, CheckCircle, Loader2, Settings, Cloud, Server } from 'lucide-react'
import { usePersonaStore } from '../../stores/personaStore'
import { testConnection } from '../../utils/aiAdapters'
import type { AIProvider } from '../../types/ai'

interface AISettingsPanelProps {
  onClose: () => void
}

// ── Provider metadata ─────────────────────────────────────────────────────────

const PROVIDERS: {
  id: AIProvider
  label: string
  hint: string
  keyHint: string
  keyLink: string
  modelHint: string
  defaultModel: string
  showBaseUrl: boolean
  baseUrlPlaceholder?: string
  baseUrlDefault?: string
}[] = [
  {
    id: 'ollama',
    label: 'Ollama Cloud',
    hint: 'Routes :cloud models via local Ollama daemon. Requires: (1) Ollama app installed, (2) run "ollama signin" in terminal once. API key optional after signin.',
    keyHint: 'Optional after "ollama signin". Or get a key at ollama.com/settings/keys',
    keyLink: 'https://ollama.com/settings/keys',
    modelHint: 'Format: model:cloud  (e.g., kimi-k2.6:cloud, gemma4:31b-cloud)',
    defaultModel: 'kimi-k2.6:cloud',
    showBaseUrl: false
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    hint: 'OpenAI-compatible gateway to hundreds of models. Key format: sk-or-v1-...',
    keyHint: 'Get your key at openrouter.ai/keys (format: sk-or-v1-...)',
    keyLink: 'https://openrouter.ai/keys',
    modelHint: 'Format: provider/model  (e.g., moonshotai/kimi-k2.5)',
    defaultModel: 'moonshotai/kimi-k2.5',
    showBaseUrl: false
  },
  {
    id: 'local-ollama',
    label: 'Local Ollama',
    hint: 'Ollama running on your own machine — no API key required.',
    keyHint: 'Leave blank for standard local Ollama (no auth needed)',
    keyLink: '',
    modelHint: 'Format: model:tag  (e.g., llama3.2, mistral, gemma3:27b)',
    defaultModel: 'llama3.2',
    showBaseUrl: true,
    baseUrlPlaceholder: 'http://localhost:11434/v1/chat/completions',
    baseUrlDefault: 'http://localhost:11434/v1/chat/completions'
  },
  {
    id: 'generic',
    label: 'Custom OpenAI-Compatible',
    hint: 'Any OpenAI-compatible API — supply your own endpoint.',
    keyHint: 'Enter your custom API key',
    keyLink: '',
    modelHint: 'Enter your model identifier',
    defaultModel: '',
    showBaseUrl: true,
    baseUrlPlaceholder: 'https://api.example.com/v1/chat/completions'
  }
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function AISettingsPanel({ onClose }: AISettingsPanelProps) {
  const {
    config,
    setAIConfig,
    setGenerationMode,
    firecrawlApiKey: storeFirecrawlApiKey,
    setFirecrawlApiKey: setStoreFirecrawlApiKey
  } = usePersonaStore()

  const aiConfig = config.aiConfig || {
    enabled: false,
    provider: 'ollama' as AIProvider,
    apiKey: '',
    model: 'kimi-k2.6:cloud',
    baseUrl: '',
    temperature: 0.7,
    maxTokens: 1000
  }

  const [mode, setMode] = useState(config.mode || 'deterministic')
  const [provider, setProvider] = useState<AIProvider>(aiConfig.provider)
  const [apiKey, setApiKey] = useState(aiConfig.apiKey)
  const [model, setModel] = useState(aiConfig.model)
  const [baseUrl, setBaseUrl] = useState(aiConfig.baseUrl || '')
  const [temperature, setTemperature] = useState(aiConfig.temperature ?? 0.7)
  const [maxTokens, setMaxTokens] = useState(aiConfig.maxTokens ?? 1000)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    latency?: number
    error?: string
  } | null>(null)
  const [firecrawlApiKey, setFirecrawlApiKey] = useState(storeFirecrawlApiKey)

  const currentProvider = PROVIDERS.find(p => p.id === provider) || PROVIDERS[0]

  const handleProviderChange = (newProvider: AIProvider) => {
    const meta = PROVIDERS.find(p => p.id === newProvider)!
    setProvider(newProvider)
    setModel(meta.defaultModel)
    setBaseUrl(meta.baseUrlDefault || '')
    setTestResult(null)
  }

  const handleSave = () => {
    setGenerationMode(mode)
    setAIConfig({
      enabled: mode === 'ai',
      provider,
      apiKey,
      model,
      baseUrl: baseUrl || undefined,
      temperature,
      maxTokens
    })
    setStoreFirecrawlApiKey(firecrawlApiKey)
    onClose()
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const result = await testConnection({
      provider,
      apiKey,
      model,
      baseUrl: baseUrl || undefined,
      temperature,
      maxTokens
    })
    setTestResult(result)
    setTesting(false)
  }

  // Disable test button: for local-ollama an API key is optional; for others it's required
  const canTest = provider === 'local-ollama'
    ? !!model
    : !!(apiKey && model)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }}>
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 600 }}>
            <Settings size={20} />
            AI Configuration
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── Generation Mode ── */}
          <div>
            <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px', display: 'block' }}>
              Generation Mode
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Deterministic */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px',
                background: mode === 'deterministic' ? 'var(--surface2)' : 'var(--surface)',
                border: `1px solid ${mode === 'deterministic' ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <input type="radio" name="mode" checked={mode === 'deterministic'}
                  onChange={() => setMode('deterministic')} style={{ accentColor: 'var(--accent)' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>Deterministic (Default)</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    Fast, free, reproducible algorithmic generation — no API key needed
                  </div>
                </div>
              </label>
              {/* AI-Powered */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px',
                background: mode === 'ai' ? 'var(--surface2)' : 'var(--surface)',
                border: `1px solid ${mode === 'ai' ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <input type="radio" name="mode" checked={mode === 'ai'}
                  onChange={() => setMode('ai')} style={{ accentColor: 'var(--accent)' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} style={{ color: 'var(--warning)' }} />
                    AI-Powered
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    Richer, more nuanced personas via Large Language Model
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* ── AI Provider Settings (only when AI mode is selected) ── */}
          {mode === 'ai' && (
            <>
              {/* Provider selector */}
              <div>
                <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>
                  AI Provider
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleProviderChange(p.id)}
                      style={{
                        padding: '10px 12px',
                        background: provider === p.id ? 'var(--surface2)' : 'var(--surface)',
                        border: `1px solid ${provider === p.id ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: '8px',
                        color: provider === p.id ? 'var(--accent)' : 'var(--text)',
                        fontSize: '13px',
                        fontWeight: provider === p.id ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {(p.id === 'ollama' || p.id === 'openrouter') && (
                        <Cloud size={13} style={{ opacity: 0.8 }} />
                      )}
                      {(p.id === 'local-ollama' || p.id === 'generic') && (
                        <Server size={13} style={{ opacity: 0.8 }} />
                      )}
                      {p.label}
                    </button>
                  ))}
                </div>
                {/* Provider hint */}
                <div style={{
                  fontSize: '12px', color: 'var(--muted)', marginTop: '8px',
                  padding: '10px 12px', background: 'var(--surface)',
                  borderRadius: '8px', borderLeft: '3px solid var(--accent)'
                }}>
                  {currentProvider.hint}
                </div>
              </div>

              {/* API Key */}
              <div>
                <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>
                  API Key{provider === 'local-ollama' && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> (optional)</span>}
                </label>
                <input
                  id="ai-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setTestResult(null) }}
                  onInput={(e) => { setApiKey((e.target as HTMLInputElement).value); setTestResult(null) }}
                  autoComplete="new-password"
                  placeholder={
                    provider === 'local-ollama'
                      ? 'Leave blank for standard local Ollama (no auth required)'
                      : `Enter your ${currentProvider.label} API key`
                  }
                  style={{
                    width: '100%', padding: '12px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text)', fontSize: '13px',
                    fontFamily: 'inherit', boxSizing: 'border-box'
                  }}
                />
                {currentProvider.keyLink ? (
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                    {currentProvider.keyHint}{' '}
                    <a href={currentProvider.keyLink} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                      ↗ Get key
                    </a>
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                    {currentProvider.keyHint}
                  </div>
                )}
              </div>

              {/* Base URL (Local Ollama / Generic) */}
              {currentProvider.showBaseUrl && (
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>
                    {provider === 'local-ollama' ? 'Ollama Host URL' : 'Base URL'}
                    {provider === 'local-ollama' && (
                      <span style={{ color: 'var(--muted)', fontWeight: 400 }}> (optional)</span>
                    )}
                  </label>
                  <input
                    id="ai-base-url"
                    type="text"
                    value={baseUrl}
                    onChange={(e) => { setBaseUrl(e.target.value); setTestResult(null) }}
                    placeholder={currentProvider.baseUrlPlaceholder || 'https://api.example.com/v1/chat/completions'}
                    style={{
                      width: '100%', padding: '12px',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: '8px', color: 'var(--text)', fontSize: '13px',
                      fontFamily: 'inherit', boxSizing: 'border-box'
                    }}
                  />
                  {provider === 'local-ollama' && (
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                      Leave blank to use the default: <code>http://localhost:11434/v1/chat/completions</code>
                    </div>
                  )}
                </div>
              )}

              {/* Model */}
              <div>
                <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>
                  Model
                </label>
                <input
                  id="ai-model"
                  type="text"
                  value={model}
                  onChange={(e) => { setModel(e.target.value); setTestResult(null) }}
                  placeholder="Model identifier"
                  style={{
                    width: '100%', padding: '12px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text)', fontSize: '13px',
                    fontFamily: 'inherit', boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                  {currentProvider.modelHint}
                </div>

                {/* Ollama Cloud quick-select */}
                {provider === 'ollama' && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                      Quick-select cloud model:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {[
                        'kimi-k2.6:cloud',
                        'glm-5.1:cloud',
                        'gemma4:31b-cloud',
                        'qwen3.5:122b-cloud',
                        'deepseek-v3.2:cloud',
                        'nemotron-3-super:cloud',
                        'cogito-2.1:cloud'
                      ].map(m => (
                        <button
                          key={m}
                          onClick={() => { setModel(m); setTestResult(null) }}
                          style={{
                            padding: '4px 10px', fontSize: '11px',
                            background: model === m ? 'var(--accent)' : 'var(--surface)',
                            color: model === m ? '#0a0a0a' : 'var(--muted)',
                            border: `1px solid ${model === m ? 'var(--accent)' : 'var(--border)'}`,
                            borderRadius: '20px', cursor: 'pointer',
                            fontFamily: 'inherit', fontWeight: model === m ? 600 : 400,
                            transition: 'all 0.15s'
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* OpenRouter quick-select */}
                {provider === 'openrouter' && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                      Quick-select:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {[
                        'moonshotai/kimi-k2.5',
                        'google/gemma-3-27b-it:free',
                        'meta-llama/llama-4-scout:free',
                        'deepseek/deepseek-chat-v3-5:free'
                      ].map(m => (
                        <button
                          key={m}
                          onClick={() => { setModel(m); setTestResult(null) }}
                          style={{
                            padding: '4px 10px', fontSize: '11px',
                            background: model === m ? 'var(--accent)' : 'var(--surface)',
                            color: model === m ? '#0a0a0a' : 'var(--muted)',
                            border: `1px solid ${model === m ? 'var(--accent)' : 'var(--border)'}`,
                            borderRadius: '20px', cursor: 'pointer',
                            fontFamily: 'inherit', fontWeight: model === m ? 600 : 400,
                            transition: 'all 0.15s'
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Temperature & Max Tokens */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>
                    Temperature: {temperature.toFixed(1)}
                  </label>
                  <input
                    type="range" min={0} max={2} step={0.1} value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>
                    Max Tokens: {maxTokens}
                  </label>
                  <input
                    type="range" min={256} max={4096} step={256} value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>
              </div>

              {/* Connection Test */}
              <div>
                <button
                  id="test-connection-btn"
                  onClick={handleTest}
                  disabled={testing || !canTest}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '10px 16px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--accent)', fontSize: '13px',
                    cursor: testing || !canTest ? 'not-allowed' : 'pointer',
                    opacity: testing || !canTest ? 0.6 : 1,
                    fontFamily: 'inherit'
                  }}
                >
                  {testing
                    ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    : <TestTube size={14} />
                  }
                  {testing ? 'Testing…' : 'Test Connection'}
                </button>

                {testResult && (
                  <div style={{
                    marginTop: '10px', padding: '12px', borderRadius: '8px',
                    background: testResult.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${testResult.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    display: 'flex', alignItems: 'flex-start', gap: '8px'
                  }}>
                    {testResult.success
                      ? <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0, marginTop: '1px' }} />
                      : <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                    }
                    <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                      {testResult.success
                        ? `✓ Connected successfully in ${testResult.latency}ms`
                        : testResult.error
                      }
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Research Integrations ── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <div style={{
              fontSize: '14px', fontWeight: 500, marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              Research Integrations
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>
                Firecrawl API Key
              </label>
              <input
                id="firecrawl-api-key"
                type="password"
                value={firecrawlApiKey}
                onChange={(e) => setFirecrawlApiKey(e.target.value)}
                placeholder="Enter your Firecrawl API key (fc-...)"
                style={{
                  width: '100%', padding: '12px',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '8px', color: 'var(--text)', fontSize: '13px',
                  fontFamily: 'inherit', boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                Required for real web searches in the Research Panel.{' '}
                <a href="https://firecrawl.dev" target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                  ↗ Get key at firecrawl.dev
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '12px',
          padding: '16px 24px', borderTop: '1px solid var(--border)'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', background: 'none',
              border: '1px solid var(--border)', borderRadius: '8px',
              color: 'var(--text)', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            Cancel
          </button>
          <button
            id="save-ai-settings-btn"
            onClick={handleSave}
            style={{
              padding: '10px 24px', background: 'var(--accent)', border: 'none',
              borderRadius: '8px', color: '#0a0a0a', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            Save Settings
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}