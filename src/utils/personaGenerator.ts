import type { Persona, DiversityAxis, DiversityMetrics, GenerationConfig } from '../types'
import { generateAvatarSVG } from './avatarGenerator'
import { getAdapter } from './aiAdapters'
import { buildPersonaPrompt } from './aiPrompts'

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Blake', 'Cameron', 'Drew', 'Emery', 'Finley', 'Harper', 'Hayden', 'Jamie',
  'Kendall', 'Lane', 'Marley', 'Nico', 'Parker', 'Peyton', 'Reese', 'Sage',
  'Sam', 'Shannon', 'Sidney', 'Skyler', 'Spencer', 'Terry', 'Tristan', 'Val'
]

const LAST_NAMES = [
  'Chen', 'Patel', 'Kim', 'Singh', 'Rodriguez', 'Wang', 'Gupta', 'Lopez',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Anderson', 'Wilson', 'Martinez', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin'
]

const TRAIT_POOLS: Record<string, string[]> = {
  openness: [
    'curious about new experiences', 'prefers familiar routines', 'artistically inclined',
    'intellectually adventurous', 'values tradition', 'creative thinker', 'practical minded',
    'open to abstract ideas', 'prefers concrete facts', 'imaginative', 'down-to-earth'
  ],
  agreeableness: [
    'cooperative and trusting', 'competitive and assertive', 'empathetic listener',
    'straightforward and direct', 'helpful and altruistic', 'self-reliant', 'forgiving nature',
    'holds grudges', 'values harmony', 'challenges authority', 'team player', 'individualistic'
  ],
  extraversion: [
    'energetic and outgoing', 'reserved and reflective', 'social butterfly',
    'prefers small groups', 'talkative and expressive', 'quiet observer', 'action-oriented',
    'thoughtful planner', 'seeks stimulation', 'enjoys solitude', 'enthusiastic', 'calm demeanor'
  ],
  conscientiousness: [
    'organized and reliable', 'spontaneous and flexible', 'goal-driven achiever',
    'easygoing and adaptable', 'detail-oriented', 'big-picture thinker', 'self-disciplined',
    'impulsive decision-maker', 'plans ahead', 'lives in the moment', 'perfectionist', 'pragmatic'
  ],
  neuroticism: [
    'emotionally stable', 'anxiety-prone', 'resilient under stress', 'easily worried',
    'confident in uncertainty', 'seeks security', 'adaptable to change', 'prefers predictability',
    'optimistic outlook', 'prepares for worst-case', 'emotionally expressive', 'stoic and composed'
  ]
}

const BACKGROUND_TEMPLATES = [
  'Grew up in a {adjective} household with {family} siblings. {education}. Currently works as a {occupation} and {living}.',
  'Raised in a {setting} environment. {education}. Works remotely as a {occupation} and {hobby}.',
  'From a {size} town with {family} siblings. {education}. Recently transitioned to a {occupation} role and {living}.',
  'First-generation college graduate from a {adjective} family. {education}. Now a {occupation} who {hobby}.'
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateName(rng: () => number): string {
  const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]
  const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]
  return `${first} ${last}`
}

function generateAvatar(seed: number): string {
  return generateAvatarSVG(seed)
}

function interpolateValue(axis: DiversityAxis, value: number): string {
  const normalized = (value - axis.min) / (axis.max - axis.min)
  return normalized < 0.3 ? axis.labels[0] : normalized > 0.7 ? axis.labels[1] : `moderately ${axis.labels[1].toLowerCase()}`
}

export function generatePersona(
  axes: DiversityAxis[],
  _context: string,
  index: number,
  total: number
): Persona {
  const seed = index * 7919 + total * 104729
  const rng = seededRandom(seed)
  
  // Stage 1: High-level descriptor with quasi-random Monte Carlo sampling
  const values: Record<string, number> = {}
  const embedding: number[] = []
  
  axes.forEach((axis, i) => {
    // Use quasi-random sampling (Halton-like sequence) for better coverage
    const base = (index * 0.618033988749 + i * 0.41421356237) % 1
    const jitter = (rng() - 0.5) * 0.15
    const normalized = Math.max(0, Math.min(1, base + jitter))
    const value = axis.min + normalized * (axis.max - axis.min)
    values[axis.id] = value
    embedding.push(normalized)
  })
  
  // Stage 2: Expand into full persona description
  const name = generateName(rng)
  const traits: string[] = []
  
  axes.forEach(axis => {
    const pool = TRAIT_POOLS[axis.id] || TRAIT_POOLS.openness
    const traitIndex = Math.floor((values[axis.id] / axis.max) * pool.length * 0.999)
    traits.push(pool[Math.min(traitIndex, pool.length - 1)])
  })
  
  const thirdAxis = axes[2] || axes[0]
  const summary = `${name} is ${interpolateValue(axes[0], values[axes[0].id])}, 
    ${interpolateValue(axes[1], values[axes[1].id])}, and 
    ${interpolateValue(thirdAxis, values[thirdAxis.id])}. 
    ${traits.slice(0, 3).join(', ')}.`
  
  const template = BACKGROUND_TEMPLATES[index % BACKGROUND_TEMPLATES.length]
  const adjectives = ['close-knit', 'diverse', 'traditional', 'progressive', 'religious', 'secular']
  const settings = ['urban', 'suburban', 'rural', 'coastal', 'mountain']
  const sizes = ['small', 'medium-sized', 'large']
  const educations = ['Studied at a state university', 'Attended a community college', 'Graduated from a private liberal arts college', 'Self-taught through online courses']
  const occupations = ['software engineer', 'teacher', 'nurse', 'marketing specialist', 'data analyst', 'small business owner', 'freelance designer', 'research scientist']
  const hobbies = ['enjoys hiking on weekends', 'plays in a local band', 'volunteers at an animal shelter', 'practices meditation daily', 'coaches youth sports', 'maintains a popular blog']
  
  const background = template
    .replace('{adjective}', adjectives[Math.floor(rng() * adjectives.length)])
    .replace('{family}', ['2', '3', '4', '5', 'no'][Math.floor(rng() * 5)])
    .replace('{education}', educations[Math.floor(rng() * educations.length)])
    .replace('{occupation}', occupations[Math.floor(rng() * occupations.length)])
    .replace('{living}', ['lives alone in the city', 'shares an apartment with roommates', 'lives with extended family', 'recently bought a house in the suburbs'][Math.floor(rng() * 4)])
    .replace('{setting}', settings[Math.floor(rng() * settings.length)])
    .replace('{hobby}', hobbies[Math.floor(rng() * hobbies.length)])
    .replace('{size}', sizes[Math.floor(rng() * sizes.length)])
  
  return {
    id: `persona-${seed}`,
    name,
    avatar: generateAvatar(seed),
    summary: summary.replace(/\s+/g, ' ').trim(),
    background,
    values,
    embedding,
    traits,
    stage1Descriptor: `${interpolateValue(axes[0], values[axes[0].id])} | ${interpolateValue(axes[1], values[axes[1].id])}`
  }
}

// Helper: yield control back to the event loop to prevent UI freezing
function yieldControl(): Promise<void> {
  return new Promise(r => setTimeout(r, 0))
}

export async function computeDiversityMetrics(personas: Persona[], _axes: DiversityAxis[]): Promise<DiversityMetrics> {
  if (personas.length < 2) {
    return {
      coverage: 0,
      convexHullVolume: 0,
      minPairwiseDistance: 0,
      avgPairwiseDistance: 0,
      dispersion: 0,
      klDivergence: 0
    }
  }
  
  const embeddings = personas.map(p => p.embedding)
  const n = embeddings.length
  const dim = embeddings[0].length
  
  // Coverage: Monte Carlo estimate using random samples
  // Scaled by population size to keep computation bounded
  const numSamples = Math.min(500, Math.max(100, personas.length * 3))
  let covered = 0
  const yieldInterval = 50 // yield every 50 iterations
  for (let s = 0; s < numSamples; s++) {
    const samplePoint = Array(dim).fill(0).map(() => Math.random())
    let minDist = Infinity
    for (const emb of embeddings) {
      const dist = Math.sqrt(emb.reduce((sum, v, i) => sum + (v - samplePoint[i]) ** 2, 0))
      if (dist < minDist) minDist = dist
    }
    if (minDist < 0.15) covered++
    if (s % yieldInterval === 0) await yieldControl()
  }
  const coverage = (covered / numSamples) * 100
  
  // Pairwise distances — use sampling for large populations to avoid O(n²)
  let minDist = Infinity
  let totalDist = 0
  let count = 0
  const samplePairs = n > 80 ? 3000 : (n * (n - 1)) / 2 // cap pairs checked for large n
  if (samplePairs < (n * (n - 1)) / 2) {
    // Sample random pairs
    for (let c = 0; c < samplePairs; c++) {
      const i = Math.floor(Math.random() * n)
      const j = Math.floor(Math.random() * n)
      if (i === j) continue
      const dist = Math.sqrt(embeddings[i].reduce((sum, v, k) => sum + (v - embeddings[j][k]) ** 2, 0))
      if (dist < minDist) minDist = dist
      totalDist += dist
      count++
      if (c % yieldInterval === 0) await yieldControl()
    }
  } else {
    // Full pairwise for small populations
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dist = Math.sqrt(embeddings[i].reduce((sum, v, k) => sum + (v - embeddings[j][k]) ** 2, 0))
        if (dist < minDist) minDist = dist
        totalDist += dist
        count++
      }
      if (i % yieldInterval === 0) await yieldControl()
    }
  }
  const avgPairwiseDistance = count > 0 ? totalDist / count : 0
  
  // Dispersion: max distance to nearest neighbor
  let maxMinDist = 0
  for (let i = 0; i < n; i++) {
    let minD = Infinity
    for (let j = 0; j < n; j++) {
      if (i === j) continue
      const dist = Math.sqrt(embeddings[i].reduce((sum, v, k) => sum + (v - embeddings[j][k]) ** 2, 0))
      if (dist < minD) minD = dist
    }
    if (minD > maxMinDist) maxMinDist = minD
    if (i % yieldInterval === 0) await yieldControl()
  }
  
  // Convex hull volume (simplified: bounding box volume)
  const mins = Array(dim).fill(Infinity)
  const maxs = Array(dim).fill(-Infinity)
  for (const emb of embeddings) {
    for (let d = 0; d < dim; d++) {
      if (emb[d] < mins[d]) mins[d] = emb[d]
      if (emb[d] > maxs[d]) maxs[d] = emb[d]
    }
  }
  let volume = 1
  for (let d = 0; d < dim; d++) {
    volume *= (maxs[d] - mins[d])
  }
  
  // KL divergence from uniform
  const klDivergence = Math.abs(0.5 - avgPairwiseDistance) * 2
  
  return {
    coverage: Math.round(coverage * 10) / 10,
    convexHullVolume: Math.round(volume * 1000) / 1000,
    minPairwiseDistance: Math.round(minDist * 1000) / 1000,
    avgPairwiseDistance: Math.round(avgPairwiseDistance * 1000) / 1000,
    dispersion: Math.round(maxMinDist * 1000) / 1000,
    klDivergence: Math.round(klDivergence * 1000) / 1000
  }
}

async function generatePersonaWithAI(
  axes: DiversityAxis[],
  context: string,
  index: number,
  total: number,
  aiConfig: NonNullable<GenerationConfig['aiConfig']>
): Promise<Partial<Persona>> {
  const adapter = getAdapter(aiConfig.provider)
  
  // Use deterministic stage 1 values for consistency
  const seed = index * 7919 + total * 104729
  const rng = seededRandom(seed)
  
  const values: Record<string, number> = {}
  const embedding: number[] = []
  
  axes.forEach((axis, i) => {
    const base = (index * 0.618033988749 + i * 0.41421356237) % 1
    const jitter = (rng() - 0.5) * 0.15
    const normalized = Math.max(0, Math.min(1, base + jitter))
    const value = axis.min + normalized * (axis.max - axis.min)
    values[axis.id] = value
    embedding.push(normalized)
  })

  const prompt = buildPersonaPrompt(context, axes, values, index, total)
  
  try {
    const response = await adapter.generate(
      {
        provider: aiConfig.provider,
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        baseUrl: aiConfig.baseUrl,
        temperature: aiConfig.temperature,
        maxTokens: aiConfig.maxTokens
      },
      prompt
    )

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = response
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1]
    }
    
    const parsed = JSON.parse(jsonStr.trim())
    
    return {
      name: parsed.name || generateName(rng),
      summary: parsed.summary || '',
      background: parsed.background || '',
      traits: Array.isArray(parsed.traits) ? parsed.traits : [],
      values,
      embedding,
      stage1Descriptor: `${interpolateValue(axes[0], values[axes[0].id])} | ${interpolateValue(axes[1], values[axes[1].id])}`
    }
  } catch (err) {
    // Fallback to deterministic generation if AI fails
    console.warn('AI generation failed, falling back to deterministic:', err)
    const fallback = generatePersona(axes, context, index, total)
    return {
      name: fallback.name,
      summary: fallback.summary,
      background: fallback.background,
      traits: fallback.traits,
      values,
      embedding,
      stage1Descriptor: fallback.stage1Descriptor
    }
  }
}

export async function generatePopulation(
  config: GenerationConfig,
  onProgress: (progress: number) => void
): Promise<{ personas: Persona[]; metrics: DiversityMetrics }> {
  console.log('[generatePopulation] Starting with config:', {
    populationSize: config.populationSize,
    axesCount: config.axes.length,
    mode: config.mode
  })
  const { populationSize, axes, context, mode, aiConfig } = config
  
  const personas: Persona[] = []
  const batchSize = Math.max(1, Math.floor(populationSize / 10))
  
  for (let i = 0; i < populationSize; i++) {
    let persona: Persona
    
    if (mode === 'ai' && aiConfig?.enabled && aiConfig.apiKey) {
      const aiPersona = await generatePersonaWithAI(axes, context, i, populationSize, aiConfig)
      const seed = i * 7919 + populationSize * 104729
      persona = {
        id: `persona-${seed}`,
        name: aiPersona.name || generateName(seededRandom(seed)),
        avatar: generateAvatar(seed),
        summary: aiPersona.summary || '',
        background: aiPersona.background || '',
        values: aiPersona.values || {},
        embedding: aiPersona.embedding || [],
        traits: aiPersona.traits || [],
        stage1Descriptor: aiPersona.stage1Descriptor || ''
      }
    } else {
      persona = generatePersona(axes, context, i, populationSize)
    }
    
    personas.push(persona)
    
    if (i % batchSize === 0 || i === populationSize - 1) {
      onProgress(Math.round(((i + 1) / populationSize) * 100))
      await new Promise(r => setTimeout(r, 10))
    }
  }
  
  const metrics = await computeDiversityMetrics(personas, axes)
  return { personas, metrics }
}
