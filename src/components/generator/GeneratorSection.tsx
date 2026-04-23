import { useState, useRef, useEffect } from 'react'
import { Settings, Zap, Plus, X, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { usePersonaStore } from '../../stores/personaStore'
import { generatePopulation } from '../../utils/personaGenerator'
import AISettingsPanel from '../settings/AISettingsPanel'
import type { DiversityAxis } from '../../types'

const PRESET_CONTEXTS = [
  { id: 'mental-health', label: 'Mental Health Chatbot', context: 'Users of a mental health support chatbot' },
  { id: 'education', label: 'Educational Platform', context: 'Students using an AI tutoring system' },
  { id: 'agiforecast', label: 'AGI Adaptation', context: 'Individuals adapting to AGI in the workplace' },
  { id: 'ecommerce', label: 'E-commerce Shoppers', context: 'Online shoppers during holiday season' },
  { id: 'healthcare', label: 'Healthcare Decisions', context: 'Patients making health-related choices' },
  { id: 'social', label: 'Social Platform', context: 'Users of a social media platform' }
]

const PRESET_AXES: Record<string, DiversityAxis[]> = {
  'mental-health': [
    { id: 'trust', name: 'Trust in AI', description: 'Trust level toward AI systems', min: 0, max: 100, labels: ['Distrustful', 'Trusting'] },
    { id: 'symptoms', name: 'Symptom Severity', description: 'Current mental health symptom severity', min: 0, max: 100, labels: ['Mild', 'Severe'] },
    { id: 'tech-literacy', name: 'Tech Literacy', description: 'Comfort with technology', min: 0, max: 100, labels: ['Novice', 'Expert'] }
  ],
  'education': [
    { id: 'motivation', name: 'Learning Motivation', description: 'Intrinsic motivation to learn', min: 0, max: 100, labels: ['Low', 'High'] },
    { id: 'background', name: 'Prior Knowledge', description: 'Existing subject knowledge', min: 0, max: 100, labels: ['Beginner', 'Advanced'] },
    { id: 'style', name: 'Learning Style', description: 'Preferred learning approach', min: 0, max: 100, labels: ['Visual', 'Kinesthetic'] }
  ],
  'agiforecast': [
    { id: 'optimism', name: 'AGI Optimism', description: 'Optimism about AGI impact', min: 0, max: 100, labels: ['Pessimistic', 'Optimistic'] },
    { id: 'preparedness', name: 'Preparedness', description: 'How prepared they feel', min: 0, max: 100, labels: ['Unprepared', 'Ready'] },
    { id: 'adaptability', name: 'Adaptability', description: 'Ability to adapt to change', min: 0, max: 100, labels: ['Resistant', 'Adaptive'] }
  ]
}

export default function GeneratorSection() {
  const { config, setPopulation, setMetrics, setIsGenerating, setGenerationProgress, setShowSettings, showSettings } = usePersonaStore()
  const [context, setContext] = useState(config.context)
  const [populationSize, setPopulationSize] = useState(config.populationSize)
  const [axes, setAxes] = useState<DiversityAxis[]>(config.axes)
  const [isGenerating, setLocalGenerating] = useState(false)
  const [progress, setLocalProgress] = useState(0)
  const [showAddAxis, setShowAddAxis] = useState(false)
  const [newAxis, setNewAxis] = useState({ name: '', description: '', labels: ['', ''] as [string, string] })
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

  const applyPreset = (preset: typeof PRESET_CONTEXTS[0]) => {
    setContext(preset.context)
    const presetAxes = PRESET_AXES[preset.id]
    if (presetAxes) setAxes(presetAxes)
  }

  const handleGenerate = async () => {
    console.log('[Generator] handleGenerate called')
    setLocalGenerating(true)
    setIsGenerating(true)
    setLocalProgress(0)
    setGenerationProgress(0)

    try {
      const genConfig = { ...config, context, populationSize, axes }
      console.log('[Generator] Calling generatePopulation with:', {
        populationSize: genConfig.populationSize,
        axesCount: genConfig.axes.length,
        mode: genConfig.mode
      })
      
      const { personas, metrics } = await generatePopulation(
        genConfig,
        (p) => {
          setLocalProgress(p)
          setGenerationProgress(p)
        }
      )

      console.log('[Generator] Success:', personas.length, 'personas generated')
      setPopulation(personas)
      setMetrics(metrics)
      
      // Scroll to explorer after a short delay to allow React to render
      requestAnimationFrame(() => {
        setTimeout(() => {
          document.getElementById('explorer')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      })
    } catch (err) {
      console.error('[Generator] Generation failed:', err)
    } finally {
      setLocalGenerating(false)
      setIsGenerating(false)
    }
  }

  const addAxis = () => {
    if (!newAxis.name || !newAxis.labels[0] || !newAxis.labels[1]) return
    const axis: DiversityAxis = {
      id: `axis-${Date.now()}`,
      name: newAxis.name,
      description: newAxis.description || newAxis.name,
      min: 0,
      max: 100,
      labels: newAxis.labels
    }
    setAxes([...axes, axis])
    setNewAxis({ name: '', description: '', labels: ['', ''] })
    setShowAddAxis(false)
  }

  const removeAxis = (id: string) => {
    if (axes.length <= 2) return
    setAxes(axes.filter(a => a.id !== id))
  }

  return (
    <section
      ref={sectionRef}
      id="generator"
      style={{
        padding: '120px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
        <div>
          <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={14} />
            Configure Your Generator
          </div>
          <h2 className="dpg-heading" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
            Shape the <span>Context</span>
          </h2>
          <p className="dpg-subheading" style={{ marginBottom: '0' }}>
            Define the scenario and diversity axes. The generator uses quasi-random Monte Carlo sampling 
            to maximize coverage across all dimensions.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text)',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.background = 'var(--surface2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background = 'var(--surface)'
            }}
          >
            <Sparkles size={14} style={{ color: config.mode === 'ai' ? 'var(--warning)' : 'var(--muted)' }} />
            {config.mode === 'ai' ? 'AI Mode' : 'Settings'}
          </button>
          {config.mode === 'ai' && config.aiConfig && (
            <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'right' }}>
              {config.aiConfig.provider === 'openrouter' ? 'OpenRouter' : config.aiConfig.provider === 'ollama' ? 'Ollama Cloud' : 'Generic'} · {config.aiConfig.model}
            </div>
          )}
        </div>
      </div>

      {showSettings && <AISettingsPanel onClose={() => setShowSettings(false)} />}

      {/* Presets */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px', letterSpacing: '0.05em' }}>
          Quick Presets
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PRESET_CONTEXTS.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              style={{
                padding: '8px 16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text)',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.background = 'var(--surface2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'var(--surface)'
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Context Input */}
      <div className="dpg-card" style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
          Context Description
        </label>
        <textarea
          className="dpg-input"
          value={context}
          onChange={e => setContext(e.target.value)}
          rows={3}
          style={{ resize: 'vertical', minHeight: '80px' }}
          placeholder="Describe the scenario for which you want to generate personas..."
        />
      </div>

      {/* Population Size */}
      <div className="dpg-card" style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
          Population Size: <span style={{ color: 'var(--accent)' }}>{populationSize}</span>
        </label>
        <input
          type="range"
          min={5}
          max={100}
          value={populationSize}
          onChange={e => setPopulationSize(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: 'var(--accent)',
            height: '4px',
            borderRadius: '2px'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
          <span>5 personas</span>
          <span>100 personas</span>
        </div>
      </div>

      {/* Diversity Axes */}
      <div className="dpg-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Diversity Axes ({axes.length})
          </label>
          <button
            onClick={() => setShowAddAxis(!showAddAxis)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--accent)',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            <Plus size={14} />
            Add Axis
          </button>
        </div>

        {showAddAxis && (
          <div style={{
            padding: '16px',
            background: 'var(--surface2)',
            borderRadius: '12px',
            marginBottom: '16px',
            border: '1px solid var(--border)'
          }}>
            <input
              className="dpg-input"
              placeholder="Axis name (e.g., Risk Tolerance)"
              value={newAxis.name}
              onChange={e => setNewAxis({ ...newAxis, name: e.target.value })}
              style={{ marginBottom: '8px' }}
            />
            <input
              className="dpg-input"
              placeholder="Description"
              value={newAxis.description}
              onChange={e => setNewAxis({ ...newAxis, description: e.target.value })}
              style={{ marginBottom: '8px' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                className="dpg-input"
                placeholder="Low label"
                value={newAxis.labels[0]}
                onChange={e => setNewAxis({ ...newAxis, labels: [e.target.value, newAxis.labels[1]] })}
              />
              <input
                className="dpg-input"
                placeholder="High label"
                value={newAxis.labels[1]}
                onChange={e => setNewAxis({ ...newAxis, labels: [newAxis.labels[0], e.target.value] })}
              />
            </div>
            <button className="dpg-btn" onClick={addAxis} style={{ padding: '8px 20px', fontSize: '13px' }}>
              Add
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {axes.map(axis => (
            <div
              key={axis.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'var(--surface2)',
                borderRadius: '10px',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                  {axis.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {axis.labels[0]} → {axis.labels[1]}
                </div>
              </div>
              {axes.length > 2 && (
                <button
                  onClick={() => removeAxis(axis.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        className="dpg-btn"
        onClick={handleGenerate}
        disabled={isGenerating}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          opacity: isGenerating ? 0.7 : 1,
          cursor: isGenerating ? 'not-allowed' : 'pointer'
        }}
      >
        {isGenerating ? (
          <>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            Generating... {progress}%
          </>
        ) : (
          <>
            <Zap size={20} />
            Generate Population
            <ArrowRight size={20} />
          </>
        )}
      </button>

      {isGenerating && (
        <div style={{
          marginTop: '16px',
          height: '4px',
          background: 'var(--surface)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--accent), var(--warning))',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  )
}