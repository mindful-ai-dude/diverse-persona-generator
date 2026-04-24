import { useEffect, useRef, useState, useCallback } from 'react'
import { usePersonaStore } from '../../stores/personaStore'
import { Users, X, Eye, EyeOff, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { exportAsText, exportAsMarkdown, exportAsPDF } from '../../utils/exportUtils'
import type { Persona } from '../../types'

export default function PopulationExplorer() {
  const { population, config, selectedPersona, setSelectedPersona } = usePersonaStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rotation, setRotation] = useState({ x: 0.3, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const [hoveredPersona, setHoveredPersona] = useState<Persona | null>(null)
  const [showLabels, setShowLabels] = useState(true)
  const [zoom, setZoom] = useState(1)
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Refs to avoid stale closures in the animation loop
  const rotationRef = useRef(rotation)
  const hoveredRef = useRef(hoveredPersona)
  const selectedRef = useRef(selectedPersona)
  const showLabelsRef = useRef(showLabels)
  const populationRef = useRef(population)
  const isDraggingRef = useRef(isDragging)
  const zoomRef = useRef(zoom)
  const animFrameRef = useRef(0)
  const isVisibleRef = useRef(isVisible)
  const canvasSizeRef = useRef({ w: 0, h: 0, dpr: 1 })
  const needsRedrawRef = useRef(true)

  useEffect(() => { rotationRef.current = rotation; needsRedrawRef.current = true }, [rotation])
  useEffect(() => { hoveredRef.current = hoveredPersona; needsRedrawRef.current = true }, [hoveredPersona])
  useEffect(() => { selectedRef.current = selectedPersona; needsRedrawRef.current = true }, [selectedPersona])
  useEffect(() => { showLabelsRef.current = showLabels; needsRedrawRef.current = true }, [showLabels])
  useEffect(() => {
    populationRef.current = population
    needsRedrawRef.current = true
  }, [population])
  useEffect(() => { isDraggingRef.current = isDragging }, [isDragging])
  useEffect(() => { zoomRef.current = zoom; needsRedrawRef.current = true }, [zoom])
  useEffect(() => {
    isVisibleRef.current = isVisible
    if (isVisible) needsRedrawRef.current = true
  }, [isVisible])

  // Intersection observer for visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [population.length])

  // Canvas resize — only on mount and window resize, NOT inside rAF
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = container.offsetWidth
    const h = container.offsetHeight

    if (canvasSizeRef.current.w !== w || canvasSizeRef.current.h !== h || canvasSizeRef.current.dpr !== dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvasSizeRef.current = { w, h, dpr }
      needsRedrawRef.current = true
    }
  }, [])

  useEffect(() => {
    resizeCanvas()
    // Re-measure after a short delay to handle cases where container
    // hasn't painted yet (opacity: 0 → 1 transition)
    const timer = setTimeout(resizeCanvas, 200)
    window.addEventListener('resize', resizeCanvas)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [resizeCanvas])

  // Animation loop — single rAF, reads everything from refs
  // Re-initialize when population becomes available (component renders canvas for first time)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    let frameCount = 0

    function draw() {
      if (!ctx) return
      frameCount++

      // Skip rendering when not visible or no data — but still schedule next frame
      // to check again. Use frame skipping (every 2nd frame) to reduce CPU load.
      if (!isVisibleRef.current || populationRef.current.length === 0) {
        animId = requestAnimationFrame(draw)
        return
      }

      // Render at 30fps instead of 60fps to reduce CPU load
      if (frameCount % 2 !== 0 && !isDraggingRef.current) {
        animId = requestAnimationFrame(draw)
        return
      }

      if (!needsRedrawRef.current && !isDraggingRef.current) {
        animId = requestAnimationFrame(draw)
        return
      }

      needsRedrawRef.current = false

      const { w, h, dpr } = canvasSizeRef.current
      if (w === 0 || h === 0) {
        animId = requestAnimationFrame(draw)
        return
      }

      const pop = populationRef.current
      const rot = rotationRef.current
      const hovered = hoveredRef.current
      const selected = selectedRef.current
      const showLabels = showLabelsRef.current
      const currentZoom = zoomRef.current

      // Resolve CSS custom properties — Canvas 2D API cannot use var() syntax
      const rootStyles = getComputedStyle(document.documentElement)
      const textColor = rootStyles.getPropertyValue('--text').trim() || '#eae7e2'
      const mutedColor = rootStyles.getPropertyValue('--muted').trim() || '#5a5a5e'

      // Get axes
      const axes = Object.keys(pop[0]?.values || {})
      const axis1 = axes[0] || 'x'
      const axis2 = axes[1] || 'y'
      const axis3 = axes[2] || axis1

      const cx = w / 2
      const cy = h / 2
      // Base scale multiplied by zoom — controls how spread out the cloud is
      const scale = (Math.min(w, h) / 2.5) * currentZoom

      // Clear
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = 'rgba(8, 8, 10, 0.95)'
      ctx.fillRect(0, 0, w, h)

      // Pre-compute rotation constants
      const cosY = Math.cos(rot.y)
      const sinY = Math.sin(rot.y)
      const cosX = Math.cos(rot.x)
      const sinX = Math.sin(rot.x)

      // Project all points
      const projected = pop.map((p, i) => {
        const xv = ((p.values[axis1] || 50) / 100 - 0.5) * 2
        const yv = ((p.values[axis2] || 50) / 100 - 0.5) * 2
        const zv = ((p.values[axis3] || 50) / 100 - 0.5) * 2

        const rx = xv * cosY - zv * sinY
        const rz = xv * sinY + zv * cosY
        const ry = yv * cosX - rz * sinX
        const rfz = yv * sinX + rz * cosX

        return {
          x: cx + rx * scale,
          y: cy + ry * scale,
          z: rfz,
          persona: p,
          index: i
        }
      })

      // Sort by depth
      projected.sort((a, b) => a.z - b.z)

      // Draw connections (limit to nearby pairs, scale threshold with zoom)
      if (pop.length <= 50) {
        const connThresh = 3600 * currentZoom * currentZoom // dist < 60*zoom
        ctx.strokeStyle = 'rgba(200, 169, 126, 0.03)'
        ctx.lineWidth = 0.5
        for (let i = 0; i < projected.length; i++) {
          for (let j = i + 1; j < projected.length; j++) {
            const dx = projected[i].x - projected[j].x
            const dy = projected[i].y - projected[j].y
            if (dx * dx + dy * dy < connThresh) {
              ctx.beginPath()
              ctx.moveTo(projected[i].x, projected[i].y)
              ctx.lineTo(projected[j].x, projected[j].y)
              ctx.stroke()
            }
          }
        }
      }

      // Draw points — node radius scales with zoom so circles grow/shrink
      projected.forEach((p) => {
        const isHovered = hovered?.id === p.persona.id
        const isSelected = selected?.id === p.persona.id
        // Base size driven by depth; zoom scales the whole thing
        const baseSize = 3 + (p.z + 1) * 2 + (isHovered ? 4 : 0) + (isSelected ? 4 : 0)
        const size = baseSize * currentZoom
        const alpha = 0.4 + (p.z + 1) * 0.3

        // Glow
        if (isHovered || isSelected) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2)
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3)
          glow.addColorStop(0, isSelected ? 'rgba(200, 169, 126, 0.3)' : 'rgba(79, 70, 229, 0.2)')
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.fill()
        }

        // Point
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fillStyle = isSelected
          ? `rgba(200, 169, 126, ${Math.min(alpha + 0.3, 1)})`
          : isHovered
            ? `rgba(79, 70, 229, ${Math.min(alpha + 0.3, 1)})`
            : `rgba(200, 169, 126, ${alpha})`
        ctx.fill()

        // Label
        if (showLabels && (isHovered || isSelected)) {
          ctx.font = '11px "JetBrains Mono", monospace'
          ctx.fillStyle = textColor
          ctx.textAlign = 'center'
          ctx.fillText(p.persona.name.split(' ')[0], p.x, p.y - size - 8)
        }
      })

      // Axis labels
      ctx.font = '12px "Outfit", sans-serif'
      ctx.fillStyle = mutedColor
      ctx.textAlign = 'center'
      ctx.fillText(axis1, cx, h - 16)
      ctx.save()
      ctx.translate(16, cy)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(axis2, 0, 0)
      ctx.restore()

      // Schedule next frame
      if (isDraggingRef.current) {
        needsRedrawRef.current = true
      }
      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    animFrameRef.current = animId

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [population.length]) // Re-run when population becomes available

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Handle drag rotation
    if (isDraggingRef.current) {
      const dx = e.clientX - lastMouse.current.x
      const dy = e.clientY - lastMouse.current.y
      setRotation(r => ({ x: r.x + dy * 0.005, y: r.y + dx * 0.005 }))
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }

    // Throttled hit test — only every 50ms
    const now = performance.now()
    if ((handleMouseMove as any)._lastHit && now - (handleMouseMove as any)._lastHit < 50) return
    ;(handleMouseMove as any)._lastHit = now

    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const pop = populationRef.current
    if (pop.length === 0) return

    const axes = Object.keys(pop[0]?.values || {})
    const axis1 = axes[0] || 'x'
    const axis2 = axes[1] || 'y'
    const axis3 = axes[2] || axis1

    const cx = rect.width / 2
    const cy = rect.height / 2
    const scale = (Math.min(rect.width, rect.height) / 2.5) * zoomRef.current

    const rot = rotationRef.current
    const cosY = Math.cos(rot.y)
    const sinY = Math.sin(rot.y)
    const cosX = Math.cos(rot.x)
    const sinX = Math.sin(rot.x)

    let closest: Persona | null = null
    // Hit radius scales with zoom so small nodes aren't impossible to click
    let closestDist = Math.max(12, 20 * zoomRef.current)

    for (const p of pop) {
      const xv = ((p.values[axis1] || 50) / 100 - 0.5) * 2
      const yv = ((p.values[axis2] || 50) / 100 - 0.5) * 2
      const zv = ((p.values[axis3] || 50) / 100 - 0.5) * 2

      const rx = xv * cosY - zv * sinY
      const rz = xv * sinY + zv * cosY
      const ry = yv * cosX - rz * sinX

      const px = cx + rx * scale
      const py = cy + ry * scale

      const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2)
      if (dist < closestDist) {
        closestDist = dist
        closest = p
      }
    }

    setHoveredPersona(closest)
  }, [])

  const handleClick = useCallback(() => {
    if (hoveredRef.current) setSelectedPersona(hoveredRef.current)
  }, [setSelectedPersona])

  // Wheel zoom — attach as non-passive so we can preventDefault and stop page scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      // Normalize across deltaMode (pixels / lines / pages)
      const delta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaMode === 2 ? e.deltaY * 200 : e.deltaY
      // Exponential zoom for a smooth feel; clamp to [0.2, 4]
      const factor = Math.exp(-delta * 0.002)
      setZoom(z => Math.min(Math.max(z * factor, 0.2), 4))
    }
    container.addEventListener('wheel', onWheel, { passive: false })
    return () => container.removeEventListener('wheel', onWheel)
  }, [])

  const handleZoomIn  = useCallback(() => setZoom(z => Math.min(z * 1.3, 4)),   [])
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(z / 1.3, 0.2)), [])
  const handleZoomReset = useCallback(() => setZoom(1), [])

  if (population.length === 0) return null

  return (
    <section
      ref={sectionRef}
      id="explorer"
      style={{
        padding: '120px 24px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={14} />
          Population Explorer
        </div>
        <h2 className="dpg-heading" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
          Meet the <span>Population</span>
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <p className="dpg-subheading" style={{ margin: 0, maxWidth: '600px' }}>
            Interactive 3D scatter plot of your generated personas. Drag to rotate, hover to preview, click to select.
          </p>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="dpg-btn"
              onClick={() => exportAsText(population, config)}
              style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Download as Text file"
            >
              <Download size={14} /> TXT
            </button>
            <button
              className="dpg-btn"
              onClick={() => exportAsMarkdown(population, config)}
              style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Download as Markdown file"
            >
              <Download size={14} /> MD
            </button>
            <button
              className="dpg-btn"
              onClick={() => exportAsPDF(population, config)}
              style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Download as PDF document"
            >
              <Download size={14} /> PDF
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* 3D Canvas */}
          <div
            ref={containerRef}
            style={{
              flex: 1,
              minWidth: '300px',
              height: '500px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
          >
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
            {/* Top-right controls */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {/* Zoom out */}
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomOut() }}
                style={{
                  padding: '6px 10px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  lineHeight: 0
                }}
                title="Zoom out (scroll wheel also works)"
              >
                <ZoomOut size={14} />
              </button>

              {/* Zoom % — click to reset to 100% */}
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomReset() }}
                style={{
                  padding: '5px 8px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: zoom === 1 ? 'var(--muted)' : 'var(--accent)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  minWidth: '42px',
                  textAlign: 'center'
                }}
                title="Click to reset zoom to 100%"
              >
                {Math.round(zoom * 100)}%
              </button>

              {/* Zoom in */}
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomIn() }}
                style={{
                  padding: '6px 10px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  lineHeight: 0
                }}
                title="Zoom in (scroll wheel also works)"
              >
                <ZoomIn size={14} />
              </button>

              {/* Divider */}
              <div style={{ width: '1px', height: '20px', background: 'var(--border)', opacity: 0.5 }} />

              {/* Labels toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowLabels(!showLabels) }}
                style={{
                  padding: '6px 10px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  lineHeight: 0
                }}
                title="Toggle name labels"
              >
                {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>

            {/* Bottom-left status */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              fontSize: '11px',
              color: 'var(--muted)',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              {population.length} personas | Drag to rotate | Scroll to zoom
            </div>
          </div>

          {/* Persona Detail Panel */}
          {selectedPersona && (
            <div className="dpg-card" style={{ width: '320px', minWidth: '320px', position: 'relative' }}>
              <button
                onClick={() => setSelectedPersona(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <img
                  src={selectedPersona.avatar}
                  alt={selectedPersona.name}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    border: '2px solid var(--accent)',
                    background: 'var(--surface2)'
                  }}
                />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
                    {selectedPersona.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                    ID: {selectedPersona.id.slice(-8)}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--accent)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Stage 1 Descriptor
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
                  {selectedPersona.stage1Descriptor}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--accent)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Summary
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
                  {selectedPersona.summary}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--accent)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Background
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  {selectedPersona.background}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Traits
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedPersona.traits.map((trait, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '4px 10px',
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'var(--text)'
                      }}
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Axis Values
                </div>
                {Object.entries(selectedPersona.values).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', width: '80px', textTransform: 'capitalize' }}>
                      {key}
                    </span>
                    <div style={{ flex: 1, height: '4px', background: 'var(--surface2)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${value}%`,
                        height: '100%',
                        background: 'var(--accent)',
                        borderRadius: '2px'
                      }} />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace", width: '30px', textAlign: 'right' }}>
                      {Math.round(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}