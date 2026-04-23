import { useRef, useEffect, useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import MeshBackground from './MeshBackground'
import ScrambleText from './ScrambleText'

export default function HeroSection() {
  const [scrambleComplete, setScrambleComplete] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const handleScroll = () => {
      const rect = section.getBoundingClientRect()
      const opacity = Math.max(0, 1 + rect.top / window.innerHeight * 0.5)
      section.style.opacity = String(opacity)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToGenerator = () => {
    document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      ref={sectionRef}
      id="hero"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 24px',
        overflow: 'hidden'
      }}
    >
      <MeshBackground />
      
      <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: '24px',
          padding: '6px 16px',
          border: '1px solid var(--border)',
          borderRadius: '100px'
        }}>
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          Research-to-Product: AlphaEvolve Paper
        </div>

        <h1 className="dpg-heading">
          Diverse Persona <span>Generator</span>
        </h1>

        <div style={{
          fontSize: 'clamp(14px, 3vw, 28px)',
          fontWeight: 500,
          color: 'var(--text)',
          lineHeight: 1.3,
          marginBottom: '16px',
          minHeight: '1.4em',
          whiteSpace: 'nowrap'
        }}>
          <ScrambleText
            text="Generating diverse synthetic personas at scale"
            delay={500}
            onComplete={() => setScrambleComplete(true)}
          />
        </div>

        <p className="dpg-subheading" style={{
          opacity: scrambleComplete ? 1 : 0,
          transform: scrambleComplete ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          Based on Google DeepMind's research on Persona Generators and AlphaEvolve. 
          Create diverse, coverage-maximized populations of synthetic personas for any context.
        </p>

        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          marginTop: '40px',
          opacity: scrambleComplete ? 1 : 0,
          transform: scrambleComplete ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s'
        }}>
          <button className="dpg-btn" onClick={scrollToGenerator}>
            Enter the Generator
          </button>
          <a
            href="https://arxiv.org/abs/2602.03545"
            target="_blank"
            rel="noopener noreferrer"
            className="dpg-btn dpg-btn-outline"
          >
            Read Paper
          </a>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2,
        animation: 'bounce 2s ease infinite'
      }}>
        <ChevronDown size={24} color="var(--muted)" />
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </section>
  )
}