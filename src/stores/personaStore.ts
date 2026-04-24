import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Persona, DiversityMetrics, GenerationConfig, DiversityAxis } from '../types'
import type { AIProvider } from '../types/ai'

interface PersonaState {
  config: GenerationConfig
  population: Persona[]
  metrics: DiversityMetrics | null
  isGenerating: boolean
  generationProgress: number
  selectedPersona: Persona | null
  activeSection: string
  showSettings: boolean

  setConfig: (config: Partial<GenerationConfig>) => void
  setPopulation: (population: Persona[]) => void
  setMetrics: (metrics: DiversityMetrics | null) => void
  setIsGenerating: (isGenerating: boolean) => void
  setGenerationProgress: (progress: number) => void
  setSelectedPersona: (persona: Persona | null) => void
  setActiveSection: (section: string) => void
  setShowSettings: (show: boolean) => void
  addAxis: (axis: DiversityAxis) => void
  removeAxis: (id: string) => void
  setAIConfig: (aiConfig: GenerationConfig['aiConfig']) => void
  setGenerationMode: (mode: 'deterministic' | 'ai') => void
  firecrawlApiKey: string
  setFirecrawlApiKey: (key: string) => void
}

const defaultAxes: DiversityAxis[] = [
  {
    id: 'openness',
    name: 'Openness',
    description: 'Openness to experience',
    min: 0,
    max: 100,
    labels: ['Traditional', 'Curious']
  },
  {
    id: 'agreeableness',
    name: 'Agreeableness',
    description: 'Cooperation and trust',
    min: 0,
    max: 100,
    labels: ['Competitive', 'Cooperative']
  },
  {
    id: 'extraversion',
    name: 'Extraversion',
    description: 'Sociability and energy',
    min: 0,
    max: 100,
    labels: ['Reserved', 'Outgoing']
  }
]

const defaultConfig: GenerationConfig = {
  context: 'Mental health chatbot users',
  populationSize: 25,
  axes: defaultAxes,
  useEvolution: true,
  iterations: 100,
  mode: 'deterministic',
  aiConfig: {
    enabled: false,
    provider: 'ollama' as AIProvider,
    apiKey: '',
    model: 'kimi-k2.6:cloud',
    temperature: 0.7,
    maxTokens: 1000
  }
}

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set) => ({
      config: defaultConfig,
      population: [],
      metrics: null,
      isGenerating: false,
      generationProgress: 0,
      selectedPersona: null,
      activeSection: 'hero',
      showSettings: false,

      setConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),
      setPopulation: (population) => set({ population }),
      setMetrics: (metrics) => set({ metrics }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setGenerationProgress: (generationProgress) => set({ generationProgress }),
      setSelectedPersona: (selectedPersona) => set({ selectedPersona }),
      setActiveSection: (activeSection) => set({ activeSection }),
      setShowSettings: (showSettings) => set({ showSettings }),
      addAxis: (axis) => set((state) => ({
        config: { ...state.config, axes: [...state.config.axes, axis] }
      })),
      removeAxis: (id) => set((state) => ({
        config: { ...state.config, axes: state.config.axes.filter(a => a.id !== id) }
      })),
      setAIConfig: (aiConfig) => set((state) => ({
        config: { ...state.config, aiConfig }
      })),
      setGenerationMode: (mode) => set((state) => ({
        config: { ...state.config, mode }
      })),
      firecrawlApiKey: '',
      setFirecrawlApiKey: (firecrawlApiKey) => set({ firecrawlApiKey })
    }),
    {
      name: 'dpg-settings',
      // Only persist AI config and Firecrawl key — not the generated population data
      partialize: (state) => ({
        config: {
          mode: state.config.mode,
          aiConfig: state.config.aiConfig,
          context: state.config.context,
          populationSize: state.config.populationSize,
          axes: state.config.axes,
        },
        firecrawlApiKey: state.firecrawlApiKey,
      }),
    }
  )
)
