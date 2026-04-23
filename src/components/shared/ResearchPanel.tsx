import { useState } from 'react'
import { Search, BookOpen, ExternalLink, Loader2 } from 'lucide-react'

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

  const handleSearch = async () => {
    if (!query.trim()) return
    setIsSearching(true)
    
    // Simulated research results based on Firecrawl search patterns
    // In production, this would call Firecrawl MCP
    setTimeout(() => {
      setResults([
        {
          title: 'Generative Agent-Based Modeling for Diverse Personas',
          snippet: 'Recent advances in using LLMs as mutation operators within evolutionary search loops to optimize persona generation functions...',
          url: 'https://arxiv.org/abs/2602.03545',
          source: 'arXiv'
        },
        {
          title: 'AlphaEvolve: Scaling Evolutionary Algorithms with LLMs',
          snippet: 'AlphaEvolve uses LLMs as mutation operators within large-population evolutionary search to discover novel algorithms...',
          url: 'https://deepmind.google/discover/blog/alphaevolve/',
          source: 'DeepMind Blog'
        },
        {
          title: 'Concordia: A Library for Multi-Agent LLM Simulations',
          snippet: 'Concordia enables complex social simulations where a game-master mediates interactions between agents...',
          url: 'https://github.com/google-deepmind/concordia',
          source: 'GitHub'
        },
        {
          title: 'Algorithmic Fidelity in Synthetic Populations',
          snippet: 'Measuring how accurately LLMs reproduce beliefs, attitudes, and response patterns for specific sub-populations...',
          url: 'https://doi.org/10.1016/j.jhealecon.2024',
          source: 'Journal of Behavioral Economics'
        }
      ])
      setIsSearching(false)
    }, 1500)
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