import { useState } from 'react'
import { Search, BookOpen, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import { usePersonaStore } from '../../stores/personaStore'

interface ResearchResult {
  title: string
  snippet: string
  url: string
  source: string
}

export default function ResearchPanel() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ResearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { firecrawlApiKey, setShowSettings } = usePersonaStore()

  const handleSearch = async () => {
    if (!query.trim()) return
    
    if (!firecrawlApiKey) {
      setError('Please configure your Firecrawl API key in settings.')
      return
    }
    
    setIsSearching(true)
    setError(null)
    
    try {
      const response = await fetch('https://api.firecrawl.dev/v2/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          limit: 5,
          sources: ['web']
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || data.warning || 'Failed to fetch research results')
      }
      
      if (data.success && data.data && data.data.web) {
        const mappedResults: ResearchResult[] = data.data.web.map((item: any) => ({
          title: item.title || 'Untitled',
          snippet: item.description || 'No description available.',
          url: item.url,
          source: new URL(item.url).hostname.replace('www.', '')
        }))
        setResults(mappedResults)
      } else {
        setResults([])
      }
    } catch (err) {
      console.error('Firecrawl API error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="dpg-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <BookOpen size={16} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
          Firecrawl Research
        </span>
        <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: 'auto' }}>
          MCP-powered
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          className="dpg-input"
          placeholder="Research persona generation, diversity metrics..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button
          className="dpg-btn"
          onClick={handleSearch}
          disabled={isSearching}
          style={{ padding: '12px 20px', flexShrink: 0 }}
        >
          {isSearching ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          color: '#ef4444',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <AlertCircle size={16} />
          <div style={{ flex: 1 }}>{error}</div>
          {error.includes('configure') && (
            <button
              onClick={() => setShowSettings(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'currentColor',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '13px',
                padding: 0
              }}
            >
              Open Settings
            </button>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {results.map((result, i) => (
            <div
              key={i}
              style={{
                padding: '12px',
                background: 'var(--surface2)',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {result.source}
                </span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
                {result.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4, marginBottom: '8px' }}>
                {result.snippet}
              </div>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '12px',
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Read more <ExternalLink size={12} />
              </a>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}