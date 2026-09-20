import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Fonts stay separate files so the content security policy can keep font-src 'self' with no data: URIs.
  build: { target: 'es2022', chunkSizeWarningLimit: 300, assetsInlineLimit: 0 },
  worker: { format: 'es' },
  test: {
    environment: 'jsdom',
    testTimeout: 30000,
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/**/worker/**',
        'src/features/data/services/loadStory.ts',
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/**/index.ts',
        'src/**/types/**',
      ],
      reporter: ['text', 'html'],
      thresholds: { lines: 80, functions: 75, branches: 70, statements: 80 },
    },
  },
})
