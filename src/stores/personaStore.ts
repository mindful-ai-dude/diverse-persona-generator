import { create } from 'zustand'
import type { Persona, DiversityMetrics, GenerationConfig, DiversityAxis } from '../types'

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

export const usePersonaStore = create<PersonaState>((set) => ({
  config: {
    context: 'Mental health chatbot users',
    populationSize: 25,
    axes: defaultAxes,
    useEvolution: true,
    iterations: 100,
    mode: 'deterministic',
    aiConfig: {
      enabled: false,
      provider: 'openrouter',
      apiKey: '',
      model: 'google/gemma-4-31b-it:free',
      temperature: 0.7,
      maxTokens: 1000
    }
  },
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
  }))
}))
