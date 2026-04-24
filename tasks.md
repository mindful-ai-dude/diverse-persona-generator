# Firecrawl Integration — Task Checklist

## Phase 1 — Core Pipeline Connection
> Inject Firecrawl snippets into AI persona prompts. No new API calls needed.

### Task 1.1 — Add `ResearchSnippet` type and `researchContext` field
- **File:** `src/types/index.ts`
- [ ] Add `ResearchSnippet` interface above `GenerationConfig`:
  ```typescript
  export interface ResearchSnippet {
    title: string
    description: string
    url: string
    scrapedContent?: string
  }
  ```
- [ ] Add `researchContext` to `GenerationConfig`:
  ```typescript
  researchContext?: {
    snippets: ResearchSnippet[]
    query: string
    fetchedAt: number
  }
  ```
- **Test:** `npx tsc --noEmit` — no new type errors

---

### Task 1.2 — Persist research context in Zustand store
- **File:** `src/stores/personaStore.ts`
- [ ] Add `setResearchContext` to `PersonaState` interface:
  ```typescript
  setResearchContext: (ctx: GenerationConfig['researchContext']) => void
  ```
- [ ] Add action implementation inside `create()`:
  ```typescript
  setResearchContext: (researchContext) =>
    set((state) => ({ config: { ...state.config, researchContext } })),
  ```
- [ ] Add `researchContext: state.config.researchContext` to the `partialize` config object so it survives page reload
- **Test:** Open DevTools → Application → Local Storage → `dpg-settings`. Run a search and reload page. Verify snippets are still present.

---

### Task 1.3 — Inject research into AI prompt
- **File:** `src/utils/aiPrompts.ts`
- [ ] Import `ResearchSnippet` from `'../types'`
- [ ] Add optional `researchSnippets?: ResearchSnippet[]` parameter to `buildPersonaPrompt`
- [ ] Build a `researchBlock` string when snippets are present:
  ```typescript
  const researchBlock = researchSnippets && researchSnippets.length > 0
    ? `\nRESEARCH EVIDENCE (ground this persona in real-world evidence):\n` +
      researchSnippets.map((s, i) =>
        `[${i + 1}] ${s.title}\n${s.description}` +
        (s.scrapedContent ? `\n${s.scrapedContent.slice(0, 600)}` : '')
      ).join('\n\n') + '\n'
    : ''
  ```
- [ ] Insert `researchBlock` in the prompt template between `CONTEXT:` and `DIVERSITY PROFILE:`
- [ ] Update the prompt rules to include: `"- Draw on the RESEARCH EVIDENCE when crafting background and traits"`
- **Test:** Call `buildPersonaPrompt(...)` with 2 snippets. Log the output. Confirm `RESEARCH EVIDENCE` section appears with both snippets.

---

### Task 1.4 — Thread research through the generator
- **File:** `src/utils/personaGenerator.ts`
- [ ] Add `researchSnippets?: ResearchSnippet[]` parameter to `generatePersonaWithAI` signature
- [ ] Pass `researchSnippets` to `buildPersonaPrompt(context, axes, values, index, total, researchSnippets)`
- [ ] In `generatePopulation`, extract snippets: `const snippets = config.researchContext?.snippets`
- [ ] Pass `snippets` when calling `generatePersonaWithAI(..., snippets)`
- [ ] Import `ResearchSnippet` from `'../types'`
- **Test:** Run generation with AI mode and snippets loaded. Console-log the prompt inside `generatePersonaWithAI`. Verify research block is present.

---

### Task 1.5 — Store results in Zustand from ResearchPanel
- **File:** `src/components/shared/ResearchPanel.tsx`
- [ ] Destructure `setResearchContext` from `usePersonaStore()`
- [ ] After a successful search, call:
  ```typescript
  setResearchContext({
    snippets: mappedResults,
    query,
    fetchedAt: Date.now()
  })
  ```
- [ ] Add a "Clear" button next to the search bar that calls `setResearchContext(undefined)` and `setResults([])`
- [ ] Show a green "Active — X snippets loaded" badge when `config.researchContext?.snippets.length > 0`
- [ ] Show the `fetchedAt` timestamp as a human-readable "Fetched 2 min ago" label
- **Test:** Search → badge appears. Reload page → badge still shows. Clear → badge gone. Generate → research-grounded personas.

---

## Phase 2 — Auto-Research Trigger
> Automatically fetch research when the context changes (debounced).

### Task 2.1 — Extract Firecrawl fetch into a utility
- **File:** `src/utils/firecrawlUtils.ts` *(new file)*
- [ ] Create `searchFirecrawl(query: string, apiKey: string, limit?: number): Promise<ResearchSnippet[]>`
  - POST to `https://api.firecrawl.dev/v2/search`
  - Map `data.data.web[]` → `ResearchSnippet[]`
  - Return `[]` on any error (don't throw)
- [ ] Export the function
- **Test:** Import in browser console. Verify it returns 5 snippets for a valid query.

---

### Task 2.2 — Auto-search on context change
- **File:** `src/components/shared/ResearchPanel.tsx`
- [ ] Destructure `config.context` from `usePersonaStore()`
- [ ] Add `useEffect` that debounces `runSearch(config.context)` by 1500 ms when context changes:
  ```typescript
  useEffect(() => {
    if (!firecrawlApiKey || !config.context.trim()) return
    const t = setTimeout(() => runSearch(config.context), 1500)
    return () => clearTimeout(t)
  }, [config.context, firecrawlApiKey])
  ```
- [ ] Replace the inline fetch logic in `runSearch` with a call to `searchFirecrawl` from Task 2.1
- [ ] Add a small "Auto" badge next to the search bar when research was auto-triggered (i.e. query matches `config.context`)
- **Test:** Change context text in Settings → wait 1.5 s → verify research panel auto-updates.

---

## Phase 3 — Full Article Scrape
> Let users fetch full article text for richer AI context.

### Task 3.1 — Add `scrapeUrl` and `condenseScrape` to utility
- **File:** `src/utils/firecrawlUtils.ts`
- [ ] Add `scrapeUrl(url: string, apiKey: string): Promise<string>`:
  - POST to `https://api.firecrawl.dev/v1/scrape` with `{ url, formats: ['markdown'] }`
  - Return `data.data.markdown || ''`
  - Return `''` on error
- [ ] Add `condenseScrape(markdown: string, maxChars = 800): string`:
  - Strip markdown image syntax `![...](...)`
  - Strip lines starting with `#` (headers add noise)
  - Collapse multiple blank lines
  - Truncate to `maxChars`
- **Test:** Scrape a real article URL. Verify `condenseScrape` output is under 800 chars and readable.

---

### Task 3.2 — "Scrape" button on result cards
- **File:** `src/components/shared/ResearchPanel.tsx`
- [ ] Add per-card state: `scrapingIds: Set<string>` tracking which URLs are in-flight
- [ ] Add "Scrape Full Text" button on each result card (only show if `firecrawlApiKey` is set)
- [ ] On click:
  1. Add URL to `scrapingIds` (show spinner on button)
  2. Call `scrapeUrl(result.url, firecrawlApiKey)` then `condenseScrape(markdown)`
  3. Update the snippet's `scrapedContent` in the Zustand research context
  4. Remove from `scrapingIds`
- [ ] Show "Full text loaded" badge on scraped cards
- [ ] Show scraped text preview (first 100 chars) collapsed under the card
- **Test:** Click "Scrape" on a result. Verify badge appears. Generate personas — verify prompt contains scraped content.

---

## Phase 4 — Research-Backed Axis Suggestions
> Use AI to propose new diversity axes based on research evidence.

### Task 4.1 — Add axis suggestion prompt builder
- **File:** `src/utils/aiPrompts.ts`
- [ ] Add new export `buildAxisSuggestionPrompt(context: string, snippets: ResearchSnippet[]): string`
  - Prompt asks AI to output a JSON array of 2–4 axis objects:
    ```json
    [{ "id": "pain_catastrophizing", "name": "Pain Catastrophizing", "description": "...", "labels": ["Low", "High"] }]
    ```
  - Include the research snippets as evidence
  - Instruct: "Only suggest axes supported by the research. Respond ONLY with valid JSON array."
- **Test:** Call with a mental-health context and snippets. Verify valid JSON array output from the AI.

---

### Task 4.2 — "Suggest Axes" UI
- **File:** `src/components/shared/ResearchPanel.tsx`
- [ ] Show "Suggest Axes" button only when: AI is enabled (`config.aiConfig?.enabled`) AND snippets are loaded
- [ ] On click:
  1. Call `adapter.generate(aiConfig, buildAxisSuggestionPrompt(context, snippets))`
  2. Parse JSON array response
  3. Show confirmation modal listing the suggested axes with Add/Skip per axis
  4. For each "Add": call `addAxis({ ...suggestion, min: 0, max: 100 })` from the store
- [ ] Destructure `addAxis` from `usePersonaStore()`
- [ ] Show loading state on the button while AI is thinking
- **Test:** With AI enabled and snippets loaded, click "Suggest Axes". Verify 2–4 axes appear in the confirmation UI. Verify "Add" appends to the axis list in Settings.

---

## Cross-Cutting Concerns

### Backward Compatibility
- [ ] Verify all calls to `buildPersonaPrompt` without the `researchSnippets` argument still work (parameter is optional with default `undefined`)
- [ ] Verify generation with no `researchContext` set produces identical output to current behavior

### Error Handling
- [ ] If Firecrawl `/v2/search` returns non-200: show error message in panel, do NOT overwrite existing research context
- [ ] If Firecrawl `/v1/scrape` fails: show inline error on the card, leave `scrapedContent` unset
- [ ] If AI axis suggestion returns unparseable JSON: show "Could not parse suggestions, try again" toast

### UI Polish
- [ ] ResearchPanel: show "Research is active — personas will be grounded in evidence" notice when snippets are stored
- [ ] Generation button area: show a small "Research: X snippets" pill when research context is active
- [ ] Keep snippet count badge in sync with Zustand state (not local state)

---

## Dependency Map

```
Task 1.1 (types)
  ↓
Task 1.2 (store) ──────────── Task 1.5 (ResearchPanel writes to store)
  ↓
Task 1.3 (prompt builder)
  ↓
Task 1.4 (generator reads research from config)
  ↓
Task 2.1 (firecrawlUtils) ─── Task 2.2 (auto-trigger)
                          ↓
                       Task 3.1 (scrape util)
                          ↓
                       Task 3.2 (scrape UI)
  ↓
Task 4.1 (axis prompt) ────── Task 4.2 (suggest axes UI)
```

Phase 1 tasks must be completed in order (1.1 → 1.2 → 1.3 → 1.4 → 1.5). Phases 2–4 are independent of each other and can be done in any order after Phase 1.
