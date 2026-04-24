# Firecrawl Research Integration — Implementation Plan

## Vision

Right now the Research panel fetches article snippets from Firecrawl and shows them as cards. That data is never passed anywhere — the AI generation pipeline has no idea it exists. The goal of this integration is to make research evidence **directly shape the personas the AI creates**, turning the tool from "here are some links" into "I read the literature and generated grounded, realistic people."

---

## Current State (The Gap)

```
ResearchPanel.tsx
  └─ useState<ResearchResult[]>([])   ← results die here; never leave this component

generatePopulation(config)
  └─ generatePersonaWithAI(...)
       └─ buildPersonaPrompt(context, axes, values, index, total)
            └─ NO research injected into the LLM prompt
```

`GenerationConfig` has no `researchContext` field. `buildPersonaPrompt` has no research parameter. The entire pipeline is blind to what the user researched.

---

## Phase 1 — Core Pipeline Connection (High Value, Low Risk)

**What it does:** Snippets the user already fetched get injected as a "RESEARCH EVIDENCE" section inside every AI persona prompt.

**Why this matters most:** This is the single change that converts Firecrawl from a decorative feature into a real signal. Phases 2–4 build on it.

### Files to Modify

#### 1. `src/types/index.ts`
Add a `ResearchSnippet` type and a `researchContext` field on `GenerationConfig`:

```typescript
export interface ResearchSnippet {
  title: string
  description: string
  url: string
  scrapedContent?: string   // optional: full article markdown (Phase 3)
}

// Inside GenerationConfig:
researchContext?: {
  snippets: ResearchSnippet[]
  query: string
  fetchedAt: number         // Unix ms timestamp
}
```

#### 2. `src/stores/personaStore.ts`
- Add `setResearchContext` action
- Include `researchContext` in `partialize` so it persists across reloads

```typescript
setResearchContext: (ctx: GenerationConfig['researchContext']) =>
  set((state) => ({ config: { ...state.config, researchContext: ctx } }))
```

Add to `partialize` → `config`:
```typescript
researchContext: state.config.researchContext,
```

#### 3. `src/utils/aiPrompts.ts`
Add optional `researchSnippets` parameter to `buildPersonaPrompt`. When snippets are present, append a `RESEARCH EVIDENCE` block before the JSON instruction:

```typescript
export function buildPersonaPrompt(
  context: string,
  axes: DiversityAxis[],
  values: Record<string, number>,
  index: number,
  total: number,
  researchSnippets?: ResearchSnippet[]
): string {
  // ... existing axis descriptions ...

  const researchBlock = researchSnippets && researchSnippets.length > 0
    ? `\nRESEARCH EVIDENCE (use this to make the persona authentic and grounded):\n` +
      researchSnippets.map((s, i) =>
        `[${i + 1}] ${s.title}\n${s.description}${s.scrapedContent ? '\n' + s.scrapedContent.slice(0, 600) : ''}`
      ).join('\n\n')
    : ''

  return `You are a persona generation engine...
CONTEXT: ${context}
${researchBlock}
DIVERSITY PROFILE ...`
}
```

#### 4. `src/utils/personaGenerator.ts`
Thread research context through the call chain:

- `generatePersonaWithAI(axes, context, index, total, aiConfig, researchSnippets?)` — pass snippets to `buildPersonaPrompt`
- `generatePopulation(config, onProgress)` — extract `config.researchContext?.snippets` and pass down

#### 5. `src/components/shared/ResearchPanel.tsx`
- Import `usePersonaStore` and call `setResearchContext` after a successful search
- Add a visible "Applied to generation" badge when snippets are live
- Add a "Clear research" button that calls `setResearchContext(undefined)`

---

## Phase 2 — Auto-Research Trigger (Quality-of-Life)

**What it does:** When the user changes their context text, Firecrawl automatically runs (debounced 1.5 s) so research is always fresh without needing a manual click.

### Files to Modify

#### 6. `src/components/shared/ResearchPanel.tsx`
```typescript
useEffect(() => {
  if (!firecrawlApiKey || !context.trim()) return
  const t = setTimeout(() => runSearch(context), 1500)
  return () => clearTimeout(t)
}, [context])
```
Show a small spinner in the panel header while auto-searching. Keep the manual search field so users can search a different topic if desired.

#### 7. New `src/utils/firecrawlUtils.ts`
Extract the fetch logic out of `ResearchPanel` into a reusable utility so `personaGenerator` can also trigger research if needed:

```typescript
export async function searchFirecrawl(
  query: string,
  apiKey: string,
  limit = 5
): Promise<ResearchSnippet[]>

export async function scrapeUrl(
  url: string,
  apiKey: string
): Promise<string>   // returns markdown
```

---

## Phase 3 — Full Article Scrape (Deep Grounding)

**What it does:** For any search result, the user can click "Deep Scrape" to fetch the full article markdown via Firecrawl `/v1/scrape`. The first 800 characters are stored as `scrapedContent` on the snippet and automatically included in AI prompts.

### Files to Modify

#### 8. `src/utils/firecrawlUtils.ts`
`scrapeUrl` already defined in Phase 2. Add a helper:
```typescript
export function condenseScrape(markdown: string, maxChars = 800): string {
  // Strip markdown headers, strip images, collapse whitespace, truncate
}
```

#### 9. `src/components/shared/ResearchPanel.tsx`
- Add "Scrape" button per result card (loading spinner while in-flight)
- On completion: update `snippet.scrapedContent` → call `setResearchContext` with updated snippets
- Show a "Full text loaded" indicator on scraped cards

---

## Phase 4 — Research-Backed Axis Suggestions (Intelligence Layer)

**What it does:** After research is fetched, the user can click "Suggest Axes" and the AI reads the research snippets and proposes new diversity axes relevant to the context. For example, if the context is "chronic pain patients" and research mentions "pain catastrophizing" and "health locus of control", the AI can suggest those as custom axes.

### Files to Modify

#### 10. `src/utils/aiPrompts.ts`
Add a new prompt builder:
```typescript
export function buildAxisSuggestionPrompt(
  context: string,
  snippets: ResearchSnippet[]
): string
```

Returns a prompt asking the AI to output a JSON array of `{ id, name, description, labels: [string, string] }` objects.

#### 11. `src/components/shared/ResearchPanel.tsx`
Add "Suggest Axes" button (only shown when AI is enabled and snippets are present). On click: call `adapter.generate(aiConfig, buildAxisSuggestionPrompt(...))`, parse response, call `addAxis()` for each suggestion. Show a confirmation step so the user reviews before adding.

---

## Architecture After Full Integration

```
User types context
  → [Phase 2] ResearchPanel auto-searches Firecrawl (debounced)
  → results stored in Zustand (config.researchContext.snippets)
  → [Phase 3] optional: user deep-scrapes individual articles
  → [Phase 4] optional: AI suggests new axes from research

User clicks Generate
  → generatePopulation(config)
       └─ config.researchContext.snippets extracted
       └─ generatePersonaWithAI(... researchSnippets)
            └─ buildPersonaPrompt(... researchSnippets)
                 └─ RESEARCH EVIDENCE block in LLM prompt
                 → LLM produces grounded, literature-informed persona
```

---

## Implementation Order

Start with Phase 1 — it delivers the most value with the fewest changes and zero new API calls. Phases 2–4 are additive and each improves on top of the previous.

| Phase | Effort | Risk | Value |
|-------|--------|------|-------|
| 1 — Core pipeline connection | Low (4 files) | Low | Very High |
| 2 — Auto-research trigger | Low (1 new util + 1 edit) | Low | High |
| 3 — Full article scrape | Medium (new util method + UI) | Low | Medium |
| 4 — Axis suggestions | Medium (new prompt + UI flow) | Medium | High |

---

## Testing Checklist

- [ ] Generate personas with AI mode ON and snippets loaded → verify persona `background` references domain-specific language from the research
- [ ] Generate personas with no snippets loaded → verify prompt unchanged (backward compatible)
- [ ] Reload page → verify research snippets persist in localStorage
- [ ] Clear research → verify next generation produces generic personas
- [ ] Phase 2: Change context text → verify auto-search fires after 1.5 s debounce
- [ ] Phase 3: Scrape a URL → verify `scrapedContent` appears in persona prompts
- [ ] Phase 4: Suggest axes → verify parsed axes are added to the axis list

---

## Non-Goals

- No backend, server, or proxy is added. All Firecrawl calls remain client-side.
- No vector embeddings or semantic search — snippets are injected verbatim.
- No paid Firecrawl tier required — `/v2/search` and `/v1/scrape` are available on the free tier.
