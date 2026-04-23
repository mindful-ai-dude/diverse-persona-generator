import HeroSection from './components/generator/HeroSection'
import GeneratorSection from './components/generator/GeneratorSection'
import PopulationExplorer from './components/explorer/PopulationExplorer'
import DiversityDashboard from './components/dashboard/DiversityDashboard'
import ResearchPanel from './components/shared/ResearchPanel'

export default function App() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <HeroSection />
      <div style={{ borderTop: '1px solid var(--border)' }} />
      <GeneratorSection />
      <PopulationExplorer />
      <DiversityDashboard />
      
      {/* Research Section */}
      <section style={{ padding: '120px 24px', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="section-label">Research Augmentation</div>
          <h2 className="dpg-heading" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
            Firecrawl <span>Research</span>
          </h2>
          <p className="dpg-subheading" style={{ marginBottom: '32px' }}>
            Search the web for relevant research, papers, and resources to ground your persona generation
            in real-world data and published findings.
          </p>
          <ResearchPanel />
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '40px 24px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            fontSize: '14px',
            color: 'var(--muted)',
            marginBottom: '8px'
          }}>
            Diverse Persona Generator — Based on Google DeepMind's Persona Generators research (arXiv:2602.03545)
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--muted)',
            opacity: 0.6
          }}>
            Built with Vite 8 + React 19 + TypeScript · Verified dependencies via dependency-guard
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--muted)',
            opacity: 0.4,
            marginTop: '16px'
          }}>
            Acknowledgment: This app is derived from "Persona Generators: Generating Diverse Synthetic Personas at Scale"
            by Paglieri et al., Google DeepMind, 2026. AlphaEvolve and Concordia are trademarks of Google DeepMind.
          </div>
        </div>
      </footer>
    </div>
  )
}