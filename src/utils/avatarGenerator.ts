/**
 * Client-side seeded SVG avatar generator
 * Replaces external DiceBear API dependency
 * Deterministic: same seed always produces the same avatar
 */

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateShape(rng: () => number): string {
  const shapes = ['circle', 'rect', 'triangle', 'diamond', 'hexagon'] as const
  const type = shapes[Math.floor(rng() * shapes.length)]
  const cx = 20 + rng() * 60
  const cy = 20 + rng() * 60
  const size = 8 + rng() * 24
  const rotation = rng() * 360

  switch (type) {
    case 'circle':
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(size / 2).toFixed(1)}" fill="rgba(255,255,255,0.25)" />`
    case 'rect':
      return `<rect x="${(cx - size / 2).toFixed(1)}" y="${(cy - size / 2).toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" rx="${(size * 0.2).toFixed(1)}" fill="rgba(255,255,255,0.2)" transform="rotate(${rotation.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" />`
    case 'triangle': {
      const pts = [
        `${cx.toFixed(1)},${(cy - size / 2).toFixed(1)}`,
        `${(cx - size / 2).toFixed(1)},${(cy + size / 2).toFixed(1)}`,
        `${(cx + size / 2).toFixed(1)},${(cy + size / 2).toFixed(1)}`
      ].join(' ')
      return `<polygon points="${pts}" fill="rgba(255,255,255,0.2)" transform="rotate(${rotation.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" />`
    }
    case 'diamond': {
      const dpts = [
        `${cx.toFixed(1)},${(cy - size / 2).toFixed(1)}`,
        `${(cx + size / 2).toFixed(1)},${cy.toFixed(1)}`,
        `${cx.toFixed(1)},${(cy + size / 2).toFixed(1)}`,
        `${(cx - size / 2).toFixed(1)},${cy.toFixed(1)}`
      ].join(' ')
      return `<polygon points="${dpts}" fill="rgba(255,255,255,0.18)" transform="rotate(${rotation.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" />`
    }
    case 'hexagon': {
      const h = size / 2
      const w = h * 0.866
      const hpts = [
        `${cx.toFixed(1)},${(cy - h).toFixed(1)}`,
        `${(cx + w).toFixed(1)},${(cy - h / 2).toFixed(1)}`,
        `${(cx + w).toFixed(1)},${(cy + h / 2).toFixed(1)}`,
        `${cx.toFixed(1)},${(cy + h).toFixed(1)}`,
        `${(cx - w).toFixed(1)},${(cy + h / 2).toFixed(1)}`,
        `${(cx - w).toFixed(1)},${(cy - h / 2).toFixed(1)}`
      ].join(' ')
      return `<polygon points="${hpts}" fill="rgba(255,255,255,0.15)" transform="rotate(${rotation.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" />`
    }
    default:
      return `<circle cx="50" cy="50" r="10" fill="rgba(255,255,255,0.2)" />`
  }
}

function generateCenterShape(rng: () => number): string {
  const size = 28 + rng() * 12
  const type = Math.floor(rng() * 3)

  switch (type) {
    case 0: // large circle
      return `<circle cx="50" cy="50" r="${(size / 2).toFixed(1)}" fill="rgba(255,255,255,0.35)" />`
    case 1: // ring
      return `<circle cx="50" cy="50" r="${(size / 2).toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="${(size * 0.15).toFixed(1)}" />`
    case 2: // square with rounded corners
      return `<rect x="${(50 - size / 2).toFixed(1)}" y="${(50 - size / 2).toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" rx="${(size * 0.25).toFixed(1)}" fill="rgba(255,255,255,0.3)" />`
    default:
      return `<circle cx="50" cy="50" r="${(size / 2).toFixed(1)}" fill="rgba(255,255,255,0.35)" />`
  }
}

export function generateAvatarSVG(seed: number): string {
  const rng = seededRandom(seed)

  // Color palette derived from seed
  const hue1 = Math.floor(rng() * 360)
  const hue2 = (hue1 + 120 + Math.floor(rng() * 60)) % 360
  const sat = 60 + Math.floor(rng() * 30)
  const light1 = 35 + Math.floor(rng() * 15)
  const light2 = 55 + Math.floor(rng() * 15)

  // Number of decorative shapes
  const shapeCount = 4 + Math.floor(rng() * 6)

  // Generate shapes
  const shapes: string[] = []
  for (let i = 0; i < shapeCount; i++) {
    shapes.push(generateShape(rng))
  }

  // Center focal shape
  shapes.push(generateCenterShape(rng))

  // Generate SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${hue1},${sat}%,${light1}%)" />
        <stop offset="100%" stop-color="hsl(${hue2},${sat}%,${light2}%)" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.2)" />
      </filter>
    </defs>
    <rect width="100" height="100" fill="url(#g)" rx="12" />
    ${shapes.join('\n    ')}
  </svg>`

  // Convert to base64 data URI (browser only)
  const encoded = btoa(svg)
  
  return `data:image/svg+xml;base64,${encoded}`
}