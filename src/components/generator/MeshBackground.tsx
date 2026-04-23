import { useRef, useEffect } from 'react'

export default function MeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const colors = [
      'rgba(200, 169, 126, 0.2)',
      'rgba(79, 70, 229, 0.15)',
      'rgba(200, 116, 142, 0.15)',
      'rgba(100, 140, 200, 0.1)',
      'rgba(168, 116, 142, 0.1)'
    ]
    
    interface Blob {
      x: number
      y: number
      vx: number
      vy: number
      r: number
      color: string
    }
    
    const blobs: Blob[] = colors.map((c) => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 0.3 + Math.random() * 0.25,
      color: c
    }))

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth * 2
      canvas.height = canvas.offsetHeight * 2
    }
    
    resize()
    window.addEventListener('resize', resize)

    let animationId: number
    let isVisible = true
    let frameCount = 0

    // Use IntersectionObserver to pause animation when not visible
    const observer = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting },
      { threshold: 0 }
    )
    observer.observe(canvas)

    function draw() {
      if (!ctx || !canvas) return
      frameCount++

      // Skip frames when not visible or use frame skipping to reduce CPU
      if (!isVisible) {
        animationId = requestAnimationFrame(draw)
        return
      }
      // Render at 30fps (every 2nd frame) to reduce CPU load
      if (frameCount % 2 !== 0) {
        animationId = requestAnimationFrame(draw)
        return
      }

      const w = canvas.width
      const h = canvas.height

      ctx.fillStyle = '#08080a'
      ctx.fillRect(0, 0, w, h)

      blobs.forEach((b) => {
        b.x += b.vx / w
        b.y += b.vy / h

        if (b.x < -0.2 || b.x > 1.2) b.vx *= -1
        if (b.y < -0.2 || b.y > 1.2) b.vy *= -1

        const grd = ctx.createRadialGradient(
          b.x * w, b.y * h, 0,
          b.x * w, b.y * h, b.r * Math.max(w, h)
        )
        grd.addColorStop(0, b.color)
        grd.addColorStop(1, 'transparent')

        ctx.globalCompositeOperation = 'lighter'
        ctx.fillStyle = grd
        ctx.fillRect(0, 0, w, h)
        ctx.globalCompositeOperation = 'source-over'
      })

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0
      }}
    />
  )
}
