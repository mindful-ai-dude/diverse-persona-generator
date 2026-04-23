export interface DiversityAxis {
  id: string;
  name: string;
  description: string;
  min: number;
  max: number;
  labels: [string, string];
}

export interface Persona {
  id: string;
  name: string;
  avatar: string;
  summary: string;
  background: string;
  values: Record<string, number>;
  embedding: number[];
  traits: string[];
  stage1Descriptor: string;
}

export interface Questionnaire {
  id: string;
  context: string;
  axes: DiversityAxis[];
  items: QuestionnaireItem[];
}

export interface QuestionnaireItem {
  id: string;
  axisId: string;
  text: string;
  scale: 5;
}

export interface DiversityMetrics {
  coverage: number;
  convexHullVolume: number;
  minPairwiseDistance: number;
  avgPairwiseDistance: number;
  dispersion: number;
  klDivergence: number;
}

export interface GenerationConfig {
  context: string;
  populationSize: number;
  axes: DiversityAxis[];
  useEvolution: boolean;
  iterations: number;
  mode?: 'deterministic' | 'ai';
  aiConfig?: {
    enabled: boolean;
    provider: 'openrouter' | 'ollama' | 'generic';
    apiKey: string;
    model: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface AppState {
  config: GenerationConfig;
  population: Persona[];
  metrics: DiversityMetrics | null;
  isGenerating: boolean;
  generationProgress: number;
  selectedPersona: Persona | null;
  activeSection: string;
}