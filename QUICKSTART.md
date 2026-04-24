## The Research and Development Behind It

The Diverse Persona Generator was architected and engineered by Gregory Kennedy and is based on the Google DeepMind research paper:

> **"Persona Generators: Generating Diverse Synthetic Personas at Scale"**  
> Authors: Paglieri et al., Google DeepMind  
> arXiv: [2602.03545v1](https://arxiv.org/abs/2602.03545) (2026)

### Key Research Concepts Implemented

| Concept | What It Means | How Diverse Persona Generator Uses It |
|---------|---------------|--------------------------|
| **Two-Stage Generation** | First generate high-level descriptors, then expand into full profiles | Stage 1 creates axis values; Stage 2 adds backgrounds, traits, names, avatars |
| **Quasi-Random Sampling** | Use deterministic low-discrepancy sequences (Halton-like) for better coverage than pure randomness | Seeded golden-ratio-based sampling ensures even distribution across the space |
| **Coverage Metric** | Monte Carlo estimate of how much of the possibility space your personas cover | Displays as a percentage on the diversity dashboard |
| **Convex Hull Volume** | Volume of the bounding box in the embedding space | Larger = more diverse population |
| **Dispersion** | Largest empty region between personas | Smaller = better coverage, fewer gaps |

---
### The Generation Algorithm

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User Config    │────▶│  Stage 1:        │────▶│  Stage 2:       │
│  (axes, size)   │     │  High-Level      │     │  Full Expansion │
│                 │     │  Descriptors     │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │                          │
                              ▼                          ▼
                        Quasi-random                Name + Avatar
                        sampling                  Background story
                        (golden ratio              Trait mapping
                         constants)                Summary text
                              │
                              ▼
                    ┌─────────────────┐
                    │  Embedding      │
                    │  [0.42, 0.85,   │
                    │   0.12, ...]    │
                    └─────────────────┘
```

---

### AI Generation Pipline

The AI pipeline in `src/utils/personaGenerator.ts` + `src/utils/aiAdapters.ts` works as follows:

```
┌─────────────────────┐
│  Stage 1 (always    │   Deterministic quasi-random sampling
│  deterministic)     │   generates axis values + embedding
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Stage 2 (AI mode)  │   Builds a structured prompt with the
│  LLM call           │   persona's axis profile, sends to LLM
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  JSON parse         │   Extracts name, summary, background,
│  + fallback         │   traits. Falls back to deterministic
└─────────────────────┘   if parse fails.
```

All four providers share a single `BaseOpenAIAdapter` with `stream: false` enforced, so responses are always parsed as complete JSON — never streamed chunks.

---



## Project Structure

```
Diverse-Persona-Generator/
├── start.sh              # One-command startup script
├── stop.sh               # Graceful shutdown script
├── package.json          # Dependencies (verified live against npm)
├── vite.config.ts        # Vite 8 config (Oxc-Rust Compiler)
├── tsconfig.json         # TypeScript strict mode
├── index.html            # Entry point with Google Fonts
├── src/
│   ├── main.tsx              # React root renderer
│   ├── App.tsx               # Main layout composer
│   ├── index.css             # Generator Dark design system
│   ├── vite-env.d.ts         # Vite type declarations
│   ├── types/
│   │   ├── index.ts          # Persona, DiversityAxis, GenerationConfig types
│   │   └── ai.ts             # AIProvider, AIAdapter, AIProviderConfig types
│   ├── stores/
│   │   └── personaStore.ts   # Zustand global state (default: Ollama Cloud)
│   ├── utils/
│   │   ├── personaGenerator.ts   # Core two-stage algorithm + AI integration
│   │   ├── aiAdapters.ts         # ← NEW: Provider adapters (Ollama/OpenRouter/Local/Generic)
│   │   ├── aiPrompts.ts          # ← NEW: Structured LLM prompt builder
│   │   ├── avatarGenerator.ts    # SVG avatar generation
│   │   └── exportUtils.ts        # TXT / MD / PDF export
│   └── components/
│       ├── generator/
│       │   └── GeneratorSection.tsx  # Configuration panel
│       ├── explorer/
│       │   └── PopulationExplorer.tsx  # 3D scatter plot + detail panel
│       ├── dashboard/
│       │   └── DiversityDashboard.tsx  # 6 metrics + radar chart
│       ├── settings/
│       │   └── AISettingsPanel.tsx  # ← NEW: AI provider configuration modal
│       ├── simulation/           # Simulation components
│       └── shared/
│           └── ResearchPanel.tsx  # Firecrawl research integration
```

---


## Quick Start (5 Minutes)

### Prerequisites
- **Node.js 20+** installed ([download here](https://nodejs.org/))
- A terminal (Terminal on macOS, PowerShell on Windows, or any Linux terminal)

### Step 1: Clone or Navigate to the Project
```bash
cd Diverse-Persona-Generator
```

### Step 2: Make Scripts Executable (First Time Only)
```bash
chmod +x start.sh stop.sh
```

### Step 3: Start the Application
```bash
./start.sh
```

The script will:
1. Detect your operating system
2. Check Node.js is installed
3. Install pnpm (fast package manager) if missing
4. Install all dependencies automatically
5. Start the dev server

### Step 4: Open Your Browser
Navigate to: **http://localhost:4321**

You should see the cinematic dark-themed Diverse Persona Generator interface.

### Step 5: Stop the Application
When you're done, press `Ctrl+C` in the terminal, or run:
```bash
./stop.sh
```

---

## Step-by-Step Usage Guide

### 1. The Hero Section
When you first load the app, you'll see:
- An **animated mesh gradient background** (living, breathing colors)
- A **scramble text reveal** — the subtitle decodes character by character like a terminal
- Two buttons: **"Enter the Generator"** and **"Read Paper"**

Click **"Enter the Generator"** to scroll down to the configuration panel.

### 2. Configure Your Context (The Forge Section)

#### Choose a Preset (Fastest Way)
Click one of the **Quick Presets**:
- 🧠 **Mental Health Chatbot** — Users interacting with an AI mental health assistant
- 📚 **Educational Platform** — Students using an AI tutoring system
- 🤖 **AGI Adaptation** — Workers adapting to AGI in their workplace
- 🛒 **E-commerce Shoppers** — Online shoppers during holiday season
- 🏥 **Healthcare Decisions** — Patients making health-related choices
- 💬 **Social Platform** — Users of a social media platform

Each preset automatically fills in:
- A context description
- Three relevant diversity axes

#### Or Write Your Own Context
In the **Context Description** text area, describe your scenario. For example:
> "First-time homebuyers exploring mortgage options through a mobile banking app"

#### Set Population Size
Use the slider to choose how many personas to generate:
- **Small (5-15)** — Quick exploration, focus on extremes
- **Medium (20-50)** — Balanced coverage for most projects
- **Large (75-100)** — Maximum diversity for research or AI training

#### Customize Diversity Axes
Diversity axes are the dimensions along which your personas should vary. Each axis has:
- **Name** (e.g., "Risk Tolerance")
- **Low label** (e.g., "Risk-Averse")
- **High label** (e.g., "Risk-Seeking")

You can:
- **Add axes** with the "Add Axis" button
- **Remove axes** (minimum 2 required) with the X button
- **Use defaults** by selecting a preset

### 3. Generate the Population
Click the big **"Generate Population"** button. You'll see:
- A progress bar filling up
- Status updates as personas are created
- The page auto-scrolls to the explorer when done

**What happens under the hood:**
1. **Stage 1** — Quasi-random sampling generates axis values using a deterministic low-discrepancy sequence (based on the golden ratio constant). This ensures even coverage, not clumping.
2. **Stage 2** — Each high-level descriptor is expanded into a full persona with:
   - Realistic name (from diverse name pools)
   - Avatar (auto-generated SVG from DiceBear API)
   - Background story (template-based with randomized details)
   - Personality traits (mapped from axis values)
   - Natural language summary

### 4. Explore in 3D (Population Explorer)

After generation, you'll see an **interactive 3D scatter plot** showing all your personas as points in space.

#### How to Interact:
| Action | Result |
|--------|--------|
| **Drag** | Rotate the 3D view |
| **Hover** | See persona name glow and preview |
| **Click** | Open full persona detail panel |
| **Toggle Labels** | Show/hide name labels with the eye button |

#### The Detail Panel
When you click a persona, a side panel opens showing:
- **Avatar & Name** — Visual identity
- **Stage 1 Descriptor** — High-level summary (e.g., "Trusting | High Literacy")
- **Summary** — Natural language description
- **Background** — Life story with education, work, living situation
- **Traits** — Personality tags derived from axis values
- **Axis Bars** — Visual sliders showing where this persona sits on each axis

### 5. Analyze Diversity (Diversity Dashboard)

Scroll down to see **six animated metric cards** that quantify your population's diversity:

1. **Coverage** — What % of the possibility space is covered (Monte Carlo estimate)
2. **Convex Hull Volume** — Volume of the bounding box (larger = more spread out)
3. **Min Pairwise Distance** — Distance between closest personas (larger = less redundancy)
4. **Avg Pairwise Distance** — Mean separation across all pairs
5. **Dispersion** — Largest gap between any persona and its nearest neighbor (smaller = better)
6. **KL Divergence** — Distance from a uniform distribution (closer to 0 = more balanced)

**Animated Counters** — Numbers count up from 0 when you scroll into view.

**Radar Chart** — A hexagonal radar chart visualizes all six metrics simultaneously, with an **Overall Score** percentage.

> **Tip:** If your coverage is below 40%, try increasing population size or adding more axes.

### 6. Research Augmentation (Firecrawl Panel)

At the bottom, there's a **Firecrawl Research panel** where you can search for relevant papers, articles, and resources to ground your persona generation in real-world data.

> **Live Integration:** The research feature is fully functional and integrates directly with the Firecrawl API. You must configure your Firecrawl API key in the settings panel to use it.

Type a topic (e.g., "mental health chatbot user demographics") to perform live web searches. The integration uses Firecrawl's `/v2/search` endpoint to instantly retrieve relevant web data, summarize it, and provide source citations directly in the UI.

### 7. Export Your Data (TXT, MD, PDF)

Once you're satisfied with your generated population, you can export the full dataset to your local machine for further use in documentation, reports, or prompts.

Navigate to the **Population Explorer** section and use the export buttons:
- **TXT**: Plain text format, great for simple data extraction or piping into scripts.
- **MD**: Beautifully formatted Markdown, perfect for pasting directly into Notion, Obsidian, or GitHub.
- **PDF**: A professionally styled, multi-page PDF document summarizing the entire population, ideal for sharing with stakeholders.

All exports happen securely and instantly in your browser—no backend processing is required.

#### How Personas Are Generated

The app supports **two generation modes**:

| Mode | Description | Requires API Key? |
|------|-------------|-------------------|
| **Deterministic (Default)** | 100% client-side algorithmic generation — fast, free, and reproducible. No external calls. | No |
| **AI-Powered** | Each persona is drafted by a Large Language Model for richer, more nuanced profiles. | Yes (LLM provider key) |

**Deterministic mode details:**

| Aspect | How It Works |
|--------|-------------|
| **No LLM by default** | Personas are built algorithmically — no API call to any model. |
| **No Database** | All data lives in-memory during your session. |
| **Deterministic Seeding** | Same inputs always produce the same outputs. |
| **Quasi-Random Sampling** | Stage 1 uses a low-discrepancy golden-ratio sequence for even distribution. |
| **Template Expansion** | Stage 2 fills pre-written templates with curated pools (768 name combos, 55 traits, etc.) |
| **Avatars** | Unique SVG avatars generated per-persona from a deterministic seed. |

The full pipeline is in `src/utils/personaGenerator.ts`.

#### How to Configure Firecrawl for Live Research

1. Click the **Settings (gear) icon** in the top right corner of the application.
2. Scroll down to the **Research Integrations** section.
3. Paste your **Firecrawl API Key** (get yours at [firecrawl.dev](https://firecrawl.dev)).
4. Click **Save**. The Research Panel will now perform live semantic web searches.

---

## 🤖 AI-Powered Generation

As of April 2026, Diverse Persona Generator supports **LLM-enhanced persona generation** through three cloud providers and local Ollama. Switch to AI mode to have a language model draft each persona's name, summary, background, and traits — resulting in noticeably richer, more culturally nuanced profiles.

### How to Enable AI Mode

1. Click the **⚙ Settings** button in the top navigation bar.
2. In the **AI Configuration** modal, select **AI-Powered** under _Generation Mode_.
3. Choose a provider, enter your API key, select a model, and click **Save Settings**.
4. Click **Generate Population** — the app will now call the LLM for each persona.

> **Tip:** Generation will be slower in AI mode (one API call per persona) but substantially more creative. A fallback to deterministic generation fires automatically if any API call fails, so you never get an incomplete population.

---

### Provider 1 — Ollama Cloud 🌩️ *(Default)*

Ollama Cloud (2026) is a managed inference service for models with the `:cloud` tag. No local GPU required. This is the **primary/default provider**.

**Setup:**
1. Sign up / log in at [ollama.com](https://ollama.com)
2. Authenticate your machine using a **Device Key** (see full instructions below)
3. Grab your API key at [ollama.com/settings/keys](https://ollama.com/settings/keys)
4. In Settings → AI Configuration → choose **Ollama Cloud**
5. Paste your key and select a cloud model

#### 🔑 Device Key Setup — macOS, Linux, Windows

Device keys are SSH public keys that authorize your machine to access your Ollama Cloud account. They are added automatically when you run `ollama signin`, or you can add one manually.

---

##### macOS

**Method A — Automatic (recommended)**

```bash
# 1. Install Ollama (skip if already installed)
brew install ollama
# or download the .dmg from https://ollama.com/download

# 2. Sign in — opens your browser to authenticate
ollama signin

# 3. Verify cloud access
ollama list
```

Ollama generates an `ssh-ed25519` key pair on your Mac and registers the public key with your account automatically. You will see it appear at [ollama.com/settings/keys](https://ollama.com/settings/keys).

**Method B — Manual SSH key**

```bash
# 1. Check for an existing key (skip step 2 if this file exists)
ls ~/.ssh/id_ed25519.pub

# 2. Generate a new key if needed
ssh-keygen -t ed25519 -C "my-macbook"

# 3. Copy the public key to your clipboard
pbcopy < ~/.ssh/id_ed25519.pub
```

Then go to [ollama.com/settings/keys](https://ollama.com/settings/keys) → **Add key** → paste → **Add key**.

---

##### Linux

**Method A — Automatic (recommended)**

```bash
# 1. Install Ollama (skip if already installed)
curl -fsSL https://ollama.com/install.sh | sh

# 2. Sign in — follow the URL printed in the terminal if no browser opens
ollama signin

# 3. Verify cloud access
ollama list
```

**Method B — Manual SSH key**

```bash
# 1. Check for an existing key
ls ~/.ssh/id_ed25519.pub

# 2. Generate a new key if needed
ssh-keygen -t ed25519 -C "my-linux-machine"

# 3. Print the public key — copy the output
cat ~/.ssh/id_ed25519.pub
```

Then go to [ollama.com/settings/keys](https://ollama.com/settings/keys) → **Add key** → paste → **Add key**.

---

##### Windows

**Method A — Automatic (recommended)**

1. Download and install Ollama from [ollama.com/download](https://ollama.com/download).
2. Open **Command Prompt** or **PowerShell** and run:
   ```powershell
   ollama signin
   ```
3. Your browser will open — log in to your Ollama account.
4. Ollama registers your device key automatically.
5. Verify with:
   ```powershell
   ollama list
   ```

**Method B — Manual SSH key**

```powershell
# 1. Check for an existing key
Test-Path "$env:USERPROFILE\.ssh\id_ed25519.pub"

# 2. Generate a new key if needed (run in PowerShell)
ssh-keygen -t ed25519 -C "my-windows-pc"

# 3. Copy the public key to clipboard
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub" | Set-Clipboard
```

Then go to [ollama.com/settings/keys](https://ollama.com/settings/keys) → **Add key** → paste → **Add key**.

---

> **After adding a device key**, grab your API key at [ollama.com/settings/keys](https://ollama.com/settings/keys) and paste it into the app's AI Configuration panel.

**Endpoint used:** `http://localhost:11434/api/chat` (local Ollama daemon — routes `:cloud` models to `ollama.com` transparently)

> **Why localhost?** Browsers block direct cross-origin requests to `ollama.com` (CORS). The correct pattern is to run `ollama signin` once, then let the local daemon proxy cloud requests — it handles auth itself with no Bearer token needed in the app.

**Available cloud models (quick-select chips in the UI):**

| Model | Strengths |
|-------|-----------|
| `kimi-k2.6:cloud` | **Default** — 1T MoE, excellent for agent-style tasks |
| `glm-5.1:cloud` | Technical reasoning, long-context tool use |
| `gemma4:31b-cloud` | High-efficiency reasoning + creative output |
| `qwen3.5:122b-cloud` | Top-tier logic, coding, math |
| `deepseek-v3.2:cloud` | High-efficiency MoE, general-purpose |
| `nemotron-3-super:cloud` | NVIDIA flagship, multi-agent coordination |
| `cogito-2.1:cloud` | Instruction following, complex JSON output |

```typescript
// How the adapter connects
const client = new OllamaCloudAdapter()
// endpoint: http://localhost:11434/api/chat  (local daemon, CORS-safe)
// auth: handled by `ollama signin` session on the daemon; API key optional
// request body: { model, messages, stream: false, options: { temperature, num_predict } }
// the daemon transparently routes kimi-k2.6:cloud → ollama.com
```

---

### Provider 2 — OpenRouter 🔀 *(Second Cloud Option)*

OpenRouter is an OpenAI-compatible gateway to hundreds of models from multiple providers. It is particularly useful for accessing Moonshot AI's Kimi models outside China.

**Setup:**
1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Get your key at [openrouter.ai/keys](https://openrouter.ai/keys)
3. In Settings → AI Configuration → choose **OpenRouter**
4. Paste your key and select a model

**Endpoint used:** `https://openrouter.ai/api/v1/chat/completions`

**Recommended models (quick-select chips in the UI):**

| Model | Notes |
|-------|-------|
| `moonshotai/kimi-k2.5` | **Default** — SOTA multimodal, MoonViT encoder |
| `google/gemma-3-27b-it:free` | Free tier, solid general reasoning |
| `meta-llama/llama-4-scout:free` | Free tier, fast |
| `deepseek/deepseek-chat-v3-5:free` | Free tier, strong coding |

> Many OpenRouter models have a `:free` suffix — these work with a free account (subject to rate limits).

**Model format:** `provider/model-name` (must contain a `/`)

---

### Provider 3 — Local Ollama 🖥️ *(No Cloud, No Key)*

Run models locally on your own machine using [Ollama](https://ollama.com/download). No API key required for standard local usage.

**Setup:**
1. [Download and install Ollama](https://ollama.com/download) for your OS
2. Pull a model: `ollama pull llama3.2`
3. Ollama starts automatically; verify it's running: `ollama list`
4. In Settings → AI Configuration → choose **Local Ollama**
5. Leave the API Key blank; leave the Host URL as the default or enter a custom URL

**Default host:** `http://localhost:11434/v1/chat/completions`

**Custom host:** If you run Ollama on a different port or remote machine, enter the full URL in the _Ollama Host URL_ field.

**Popular local models:**
```bash
ollama pull llama3.2        # Meta Llama 3.2 3B — fast, lightweight
ollama pull mistral          # Mistral 7B — great all-rounder  
ollama pull gemma3:27b       # Google Gemma 3 27B — strong reasoning
ollama pull qwen2.5:14b      # Alibaba Qwen 2.5 14B — multilingual
```

---

### Provider 4 — Custom OpenAI-Compatible 🔧

Any API that follows the OpenAI chat completions format. Useful for self-hosted models, enterprise gateways, or other inference providers.

**Setup:**
1. In Settings → AI Configuration → choose **Custom OpenAI-Compatible**
2. Enter your **Base URL** (full endpoint, e.g. `https://api.example.com/v1/chat/completions`)
3. Enter your **API Key** and **Model** identifier
4. Click **Test Connection** to verify before saving

---

### Test Connection Button

All providers have a **Test Connection** button in the settings panel. It:
- Sends a minimal test prompt (`"Hi"` with `max_tokens: 10`)
- Reports success + latency in ms, or the exact error message
- Is disabled until a model name is filled in (API key optional for Local Ollama)

---

## Understanding the Features

### Cinematic UI Effects

| Feature | What You See | Technical Implementation |
|---------|-----------|------------------------|
| **Mesh Gradient Background** | Animated, living color blobs behind the hero | Canvas 2D with radial gradients and `lighter` composite |
| **Scramble Text Decode** | Characters scramble and lock into place one by one | `requestAnimationFrame` with random character pool |
| **Scroll-Driven Reveals** | Sections fade in as you scroll | Intersection Observer API with CSS transitions |
| **Animated Counters** | Metrics count up from 0 | `requestAnimationFrame` with cubic ease-out |
| **3D Scatter Plot** | Draggable 3D point cloud | Canvas 2D with manual 3D→2D projection, depth sorting |

## Architecture

### Tech Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| **Build Tool** | Vite | 8.0.9 | Lightning-fast HMR, Oxc-based compilation (no Babel) |
| **Framework** | React | 19.2.5 | Server Components, Actions, latest hooks |
| **Language** | TypeScript | 6.0.3 | Strict type safety |
| **State** | Zustand | 5.0.12 | Minimal, hooks-based state management |
| **Styling** | Pure CSS | — | Custom properties, no Tailwind overhead |
| **Icons** | Lucide React | 0.474.0 | Tree-shakeable SVG icons |
| **Math/Vis** | D3 | 7.9.0 | Scale functions, data transformations |
| **Animation** | GSAP | 3.15.0 | Timeline control (reserved for future effects) |

### Key Design Decisions

**No Tailwind CSS** — We use pure CSS custom properties for the Generator Dark design system. This avoids the `~30KB` Tailwind runtime and gives us pixel-perfect control over the cinematic aesthetic.

**No Three.js for the 3D Plot** — The scatter plot is implemented with raw Canvas 2D and manual 3D→2D projection. This keeps the bundle smaller and proves you don't need a heavy library for simple 3D visualization.

**No Babel** — Vite 8's `@vitejs/plugin-react` v6 uses the Oxc compiler (Rust-based). Faster builds, smaller bundles.

**pnpm over npm** — Disk-efficient, strict lockfiles, faster installs.

### State Management (Zustand)

The app uses a single Zustand store (`personaStore.ts`) with the following state:

```typescript
interface PersonaState {
  population: Persona[]           // All generated personas
  selectedPersona: Persona | null // Currently selected in explorer
  metrics: DiversityMetrics | null // Computed diversity scores
  isGenerating: boolean           // Generation in progress
  generationProgress: number      // 0-100
  config: GenerationConfig        // User's current configuration
}
```

Actions are simple setter functions — no reducers, no boilerplate.


## Troubleshooting

### "Port 4321 is already in use"
```bash
./stop.sh
# Then:
./start.sh
```

### "Node.js not found"
Install Node.js 20+ from [nodejs.org](https://nodejs.org/). Verify with:
```bash
node --version  # Should show v20.x.x or higher
```

### "pnpm not found"
The `start.sh` script auto-installs pnpm. If it fails:
```bash
npm install -g pnpm
```

### Blank white screen
1. Check the browser console (F12 → Console) for errors
2. Ensure dependencies are installed: `pnpm install`
3. Try a hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

### Build errors
```bash
pnpm run build
```
If TypeScript errors appear, they are usually related to missing types. Ensure `@types/react` and `@types/react-dom` are installed (they are in `devDependencies`).

### AI connection issues

**"AI request failed: 401"** or **"Missing Authentication header"**  
Your API key is missing, invalid, or expired. For OpenRouter the key format is `sk-or-v1-...`. Double-check it at the provider's keys page. OpenRouter returns "Missing Authentication header" for both empty and invalid keys.

**"AI request failed: 404"**  
The model name is incorrect. Use the quick-select chips in the settings panel for verified model IDs.

**Ollama Cloud: "Failed to fetch" or connection refused**  
The app routes cloud models through your local Ollama daemon (`localhost:11434`), not directly to `ollama.com` (which blocks browser CORS requests). Fix checklist:
1. Install the Ollama app: [ollama.com/download](https://ollama.com/download)
2. Run `ollama signin` in your terminal (one-time auth)
3. Confirm Ollama is running: `ollama list` should show cloud models
4. In AI Configuration, leave the API Key field blank (daemon handles auth) or paste a key from [ollama.com/settings/keys](https://ollama.com/settings/keys)

**Local Ollama: connection refused**  
Ensure Ollama is running locally:
```bash
ollama serve        # starts Ollama if not already running
ollama list         # verify your models are pulled
```
Default URL: `http://localhost:11434/v1/chat/completions`

**OpenRouter: "No endpoints found"**  
The model may be unavailable or require credits. Try a `:free` model such as `google/gemma-3-27b-it:free`.

**Personas fall back to deterministic despite AI mode**  
The AI failed silently (check the browser console for warnings). This is intentional — a failed LLM call never blocks population generation.

### The 3D plot is laggy
The Canvas 2D renderer is optimized for ~50 personas. For 100+ personas, the frame rate may drop on older GPUs. Reduce population size or close other browser tabs.

---

## Tech Stack & Dependencies

All versions were **verified live against the npm registry** using the `dependency-guard` skill:

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | 8.0.9 | Build tool & dev server |
| `@vitejs/plugin-react` | 6.0.1 | Oxc-based React compilation |
| `react` | 19.2.5 | UI framework |
| `react-dom` | 19.2.5 | React DOM renderer |
| `typescript` | 6.0.3 | Type system |
| `zustand` | 5.0.12 | State management |
| `lucide-react` | 0.474.0 | Icons |
| `d3` | 7.9.0 | Data visualization utilities |
| `gsap` | 3.15.0 | Animation timeline (future use) |
| `jspdf` | 4.2.1 | Client-side PDF generation |
| `three` | 0.184.0 | Installed but not used (reserved) |

---

## Acknowledgments

- **Research**: "Persona Generators: Generating Diverse Synthetic Personas at Scale" by Paglieri et al., Google DeepMind, 2026
- **Architecture**: Built with the AI-Harness Engineering Toolkit (HET) methodology, by Gregory Kennedy
- **Design**: Generator Dark aesthetic inspired by industrial-futurism color palettes
- **Fonts**: [Outfit](https://fonts.google.com/specimen/Outfit) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) via Google Fonts

---

## License

MIT — This is a research-to-product demonstration. The original paper is © Google DeepMind.

