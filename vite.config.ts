import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(), // Now uses Oxc for React Refresh transforms
    tailwindcss(),
  ],
  server: {
    port: 4321,
    host: true,
  },
  build: {
    minify: 'oxc', // Explicitly set, though default in v8
    target: 'esnext',
    sourcemap: true,
  },
});
