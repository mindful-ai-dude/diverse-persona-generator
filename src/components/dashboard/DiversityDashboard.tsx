import { useRef, useEffect, useState } from 'react'
import { usePersonaStore } from '../../stores/personaStore'
import { BarChart3, Target, Maximize2, Minimize2, CircleDot, TrendingUp, Activity } from 'lucide-react'
import type { DiversityMetrics } from '../../types'

const METRIC_DEFS: { key: keyof DiversityMetrics; label: string; description: string; icon: React.ReactNode; unit: string }[] = [
  { key: 'coverage', label: 'Coverage', description: 'Monte Carlo estimate of space coverage', icon: <Target size={16} />, unit: '%' },
  { key: 'convexHullVolume', label: 'Convex Hull Volume', description: 'Volume of bounding box in embedding space', icon: <Maximize2 size={16} />, unit: '' },
  { key: 'minPairwiseDistance', label: 'Min Pairwise Distance', description: 'Distance between closest personas', icon: <Minimize2 size={16} />, unit: '' },
  { key: 'avgPairwiseDistance', label: 'Avg Pairwise Distance', description: 'Mean distance across population', icon: <TrendingUp size={16} />, unit: '' },
  { key: 'dispersion', label: 'Dispersion', description: 'Radius of largest empty region', icon: <CircleDot size={16} />, unit: '' },
  { key: 'klDivergence', label: 'KL Divergence', description: 'Distance from uniform distribution', icon: <Activity size={16} />, unit: '' }
]

function AnimatedCounter({ value, unit, duration = 1500 }: { value: number; unit: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!ref.current || hasAnimated.current) return
    hasAnimated.current = true

    const start = performance.now()
    const startValue = 0

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      const current = startValue + (value - startValue) * eased

      if (ref.current) {
        if (unit === '%') {
          ref.current.textContent = current.toFixed(1) + unit
        } else if (value < 0.01) {
          ref.current.textContent = current.toFixed(4)
        } else {
          ref.current.textContent = current.toFixed(3)
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, unit, duration])

  return <span ref={ref}>0</span>
}

export default function DiversityDashboard() {
  const { metrics } = usePersonaStore()
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  if (!metrics) return null

  // Normalize values for radar chart
  const normalizedValues = [
    Math.min(metrics.coverage / 100, 1),
    Math.min(metrics.convexHullVolume * 5, 1),
    Math.min(metrics.minPairwiseDistance * 10, 1),
    Math.min(metrics.avgPairwiseDistance * 5, 1),
    Math.min(metrics.dispersion * 5, 1),
    Math.min(metrics.klDivergence * 2, 1)
  ]

  const radarPoints = normalizedValues.map((v, i) => {
    const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2
    const r = v * 80
    return { x: 100 + r * Math.cos(angle), y: 100 + r * Math.sin(angle) }
  })

  const avgScore = (
    normalizedValues.reduce((a, b) => a + b, 0) / normalizedValues.length
  ) * 100

  return (
    <section
      ref={sectionRef}
      id="dashboard"
      style={{
        padding: '120px 24px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={14} />
          Diversity Metrics
        </div>
        <h2 className="dpg-heading" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
          The <span>Metrics</span>
        </h2>
        <p className="dpg-subheading" style={{ marginBottom: '48px' }}>
          Six diversity metrics quantifying how well your population covers the support 
          of possible attitudes, preferences, and response patterns.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {METRIC_DEFS.map((metric, i) => (
            <div
              key={metric.key}
              className="dpg-card"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ color: 'var(--accent)' }}>{metric.icon}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{metric.label}</div>
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 600,
                color: 'var(--text)',
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: '4px'
              }}>
                <AnimatedCounter value={metrics[metric.key]} unit={metric.unit} />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
                {metric.description}
              </div>
              <div style={{
                marginTop: '12px',
                height: '3px',
                background: 'var(--surface2)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(normalizedValues[i] * 100, 100)}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, var(--accent), var(--warning))`,
                  borderRadius: '2px',
                  transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)'
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Radar Chart */}
        <div className="dpg-card" style={{ marginTop: '32px', display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
          <svg width="220" height="220" viewBox="0 0 200 200">
            {/* Grid */}
            {[0.2, 0.4, 0.6, 0.8, 1].map(scale => (
              <polygon
                key={scale}
                points={[0, 1, 2, 3, 4, 5].map(i => {
                  const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2
                  const r = scale * 80
                  return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`
                }).join(' ')}
                fill="none"
                stroke="var(--border)"
                strokeWidth="0.5"
                opacity="0.5"
              />
            ))}
            {/* Axes */}
            {[0, 1, 2, 3, 4, 5].map(i => {
              const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2
              return (
                <line
                  key={i}
                  x1="100"
                  y1="100"
                  x2={100 + 80 * Math.cos(angle)}
                  y2={100 + 80 * Math.sin(angle)}
                  stroke="var(--border)"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              )
            })}
            {/* Data area */}
            <polygon
              points={radarPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="rgba(200, 169, 126, 0.15)"
              stroke="var(--accent)"
              strokeWidth="2"
            />
            {/* Data points */}
            {radarPoints.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3"
                fill="var(--accent)"
              />
            ))}
          </svg>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              Overall Score
            </div>
            <div style={{
              fontSize: '48px',
              fontWeight: 700,
              color: 'var(--accent)',
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: '16px'
            }}>
              <AnimatedCounter value={avgScore} unit="%" />
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>
              The overall diversity score is a composite metric across all six dimensions. 
              Higher scores indicate better coverage of rare trait combinations and reduced 
              mode collapse in the generated population.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

