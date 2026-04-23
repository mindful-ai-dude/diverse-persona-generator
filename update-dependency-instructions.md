Follow the instructions below to update this app to the April 2026 latest dependencies below.  Use the Firecrawl MSP Server if you need to search the web for the latest updates and or fixes if you run into any issues with the updates.

Updating to the **Vite 8** and **Tailwind CSS v4** stack is a massive performance leap. With the shift to **Rolldown** as the unified bundler and **Oxc** as the core compiler, you're essentially putting your build process on a rocket. Babel is officially off the payroll for React transforms, and PostCSS is now optional.

Here is your updated `package.json` followed by the migration strategy.

### Updated `package.json`

```json
{
  "dependencies": {
    "d3": "^7.9.0",
    "gsap": "^3.15.0",
    "lucide-react": "^1.8.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "three": "^0.184.0",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/d3": "^7.4.3",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/three": "^0.184.0",
    "@vitejs/plugin-react": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^6.0.0",
    "vite": "^8.0.0"
  }
}
```

---

### Key Vite 8 & Tailwind 4 Features

* **Unified Rust Engine:** Vite 8 replaces the esbuild/Rollup duo with **Rolldown**. This eliminates "works in dev, breaks in prod" inconsistencies because the same engine powers both.
* **Oxc (Oxide Compiler):** By default, Vite 8 uses Oxc for lightning-fast parsing and minification. It is significantly faster than SWC or Babel.
* **Tailwind v4 (Oxide):** This version features a new engine written in Rust. It no longer requires a `tailwind.config.js` by default, moving configuration directly into your CSS files using the `@theme` block.
* **Native Vite Plugin:** The `@tailwindcss/vite` plugin handles everything—no more `postcss.config.js` or `autoprefixer` required.

---

### Step-by-Step Upgrade Guide

Follow these steps to ensure a conflict-free transition.

#### 1. Clean the Slate
Remove the legacy PostCSS/Tailwind v3 dependencies and your old build artifacts.
```bash
npm uninstall tailwindcss postcss autoprefixer
rm -rf node_modules package-lock.json
```

#### 2. Install the New Stack
Install the updated dependencies.
```bash
npm install
npm install -D tailwindcss@latest @tailwindcss/vite@latest vite@latest @vitejs/plugin-react@latest
```

#### 3. Configure `vite.config.ts`
Update your configuration to include the new Tailwind plugin. Note that **Oxc** minification is now the default in Vite 8, so you don't need to explicitly toggle it unless you want to customize it.

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(), // Now uses Oxc for React Refresh transforms
    tailwindcss(),
  ],
  build: {
    minify: 'oxc', // Explicitly set, though default in v8
    target: 'esnext',
  },
});
```

#### 4. Modernize Your CSS Entry Point
Tailwind v4 moves away from the triple `@tailwind` directives. Open your main CSS file (e.g., `src/index.css`) and replace them with the single import.

**Before:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**After (v4):**
```css
@import "tailwindcss";

/* Configuration now lives here instead of tailwind.config.js */
@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui;
  --color-brand: #ff5733;
}
```

#### 5. Verify and Audit
Since you are using **TypeScript 6**, ensure your `tsconfig.json` uses `"moduleResolution": "bundler"` to properly resolve the new exports from Vite 8 and React 19.

```bash
# Run a type check and build to confirm no conflicts
npx tsc --noEmit
npm run build
```

> **Pro Tip:** If you have a complex `tailwind.config.js` that you aren't ready to port to CSS yet, you can still reference it in your CSS file using `@config "./tailwind.config.js";` after the `@import "tailwindcss";` line, but the CSS-first approach is highly recommended for the best performance.