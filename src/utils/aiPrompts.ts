import type { DiversityAxis } from '../types'

export function buildPersonaPrompt(
  context: string,
  axes: DiversityAxis[],
  values: Record<string, number>,
  index: number,
  total: number
): string {
  const axisDescriptions = axes.map(axis => {
    const normalized = (values[axis.id] - axis.min) / (axis.max - axis.min)
    const position = normalized < 0.3
      ? axis.labels[0]
      : normalized > 0.7
        ? axis.labels[1]
        : `moderately ${axis.labels[1].toLowerCase()}`
    return `- ${axis.name}: ${position} (${values[axis.id].toFixed(1)}/100)`
  }).join('\n')

  return `You are a persona generation engine. Create a realistic, diverse synthetic persona for the following scenario.

CONTEXT: ${context}

DIVERSITY PROFILE (Persona ${index + 1} of ${total}):
${axisDescriptions}

Generate a JSON object with these exact fields:
{
  "name": "Full realistic name",
  "summary": "2-3 sentence natural language description",
  "background": "Rich background story (3-5 sentences)",
  "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "occupation": "Realistic job title",
  "age": number,
  "location": "City/region description"
}

Rules:
- Be creative but grounded in reality
- Reflect the diversity axis values in the persona's attitudes and behaviors
- Do not use stereotypes
- Ensure the persona feels distinct from typical patterns
- Respond ONLY with valid JSON, no markdown formatting`
}