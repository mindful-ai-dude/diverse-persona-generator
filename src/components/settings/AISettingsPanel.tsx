import { useState } from 'react'
import { X, Zap, TestTube, AlertCircle, CheckCircle, Loader2, Settings } from 'lucide-react'
import { usePersonaStore } from '../../stores/personaStore'
import { testConnection } from '../../utils/aiAdapters'

interface AISettingsPanelProps {
  onClose: () => void
}

export default function AISettingsPanel({ onClose }: AISettingsPanelProps) {
  const { config, setAIConfig, setGenerationMode } = usePersonaStore()
  const aiConfig = config.aiConfig || {
    enabled: false,
    provider: 'openrouter' as const,
    apiKey: '',
    model: 'google/gemma-4-31b-it:free',
    temperature: 0.7,
    maxTokens: 1000
  }

  const [mode, setMode] = useState(config.mode || 'deterministic')
  const [provider, setProvider] = useState(aiConfig.provider)
  const [apiKey, setApiKey] = useState(aiConfig.apiKey)
  const [model, setModel] = useState(aiConfig.model)
  const [baseUrl, setBaseUrl] = useState(aiConfig.baseUrl || '')
  const [temperature, setTemperature] = useState(aiConfig.temperature || 0.7)
  const [maxTokens, setMaxTokens] = useState(aiConfig.maxTokens || 1000)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; latency?: number; error?: string } | null>(null)

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

  const providerDisplayNames: Record<string, string> = {
    openrouter: 'OpenRouter',
    ollama: 'Ollama Cloud',
    generic: 'Generic OpenAI-Compatible'
  }

  const defaultModels: Record<string, string> = {
    openrouter: 'google/gemma-4-31b-it:free',
    ollama: 'kimi-k2.6:cloud',
    generic: ''
  }

  const handleProviderChange = (newProvider: 'openrouter' | 'ollama' | 'generic') => {
    setProvider(newProvider)
    setModel(defaultModels[newProvider])
    setTestResult(null)
  }

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
        maxWidth: '520px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
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
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Generation Mode */}
          <div>
            <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px', display: 'block' }}>
              Generation Mode
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                background: mode === 'deterministic' ? 'var(--surface2)' : 'var(--surface)',
                border: `1px solid ${mode === 'deterministic' ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'deterministic'}
                  onChange={() => setMode('deterministic')}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>Deterministic (Default)</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    Fast, free, reproducible algorithmic generation
                  </div>
                </div>
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                background: mode === 'ai' ? 'var(--surface2)' : 'var(--surface)',
                border: `1px solid ${mode === 'ai' ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'ai'}
                  onChange={() => setMode('ai')}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} style={{ color: 'var(--warning)' }} />
                    AI-Powered
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    Richer personas via Large Language Model (requires API key)
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* AI Provider Settings */}
          {mode === 'ai' && (
            <>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>
                  AI Provider
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['openrouter', 'ollama', 'generic'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleProviderChange(p)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: provider === p ? 'var(--surface2)' : 'var(--surface)',
                        border: `1px solid ${provider === p ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: '8px',
                        color: provider === p ? 'var(--accent)' : 'var(--text)',
                        fontSize: '13px',
                        fontWeight: provider === p ? 500 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit'
                      }}
                    >
                      {providerDisplayNames[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setTestResult(null) }}
                  placeholder={`Enter your ${providerDisplayNames[provider]} API key`}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                  {provider === 'openrouter' && 'Get your key at openrouter.ai/keys'}
                  {provider === 'ollama' && 'Get your key at ollama.com/settings/keys'}
                  {provider === 'generic' && 'Enter your custom API key'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>
                  Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => { setModel(e.target.value); setTestResult(null) }}
                  placeholder="Model identifier"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                  {provider === 'openrouter' && 'Format: provider/model (e.g., google/gemma-4-31b-it:free)'}
                  {provider === 'ollama' && 'Format: model:tag (e.g., kimi-k2.6:cloud)'}
                  {provider === 'generic' && 'Enter your model identifier'}
                </div>
              </div>

              {provider === 'generic' && (
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => { setBaseUrl(e.target.value); setTestResult(null) }}
                    placeholder="https://api.example.com/v1/chat/completions"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>
                    Temperature: {temperature.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>
                    Max Tokens: {maxTokens}
                  </label>
                  <input
                    type="range"
                    min={256}
                    max={4096}
                    step={256}
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>
              </div>

              {/* Connection Test */}
              <div>
                <button
                  onClick={handleTest}
                  disabled={testing || !apiKey || !model}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--accent)',
                    fontSize: '13px',
                    cursor: testing || !apiKey || !model ? 'not-allowed' : 'pointer',
                    opacity: testing || !apiKey || !model ? 0.6 : 1,
                    fontFamily: 'inherit'
                  }}
                >
                  {testing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <TestTube size={14} />}
                  Test Connection
                </button>

                {testResult && (
                  <div style={{
                    marginTop: '10px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: testResult.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${testResult.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {testResult.success ? (
                      <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                    ) : (
                      <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                    )}
                    <div style={{ fontSize: '13px' }}>
                      {testResult.success
                        ? `Connected successfully (${testResult.latency}ms)`
                        : testResult.error}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          padding: '16px 24px',
          borderTop: '1px solid var(--border)'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text)',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 24px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '8px',
              color: '#0a0a0a',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Save Settings
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}