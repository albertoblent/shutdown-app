/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: [
        'src/test/**',
        'src/**/*.test.ts', 
        'src/**/*.spec.ts',
        'src/vite-env.d.ts',
        'src/main.tsx',
        'src/App.tsx',
        'src/utils/pwa.ts',
        'src/**/index.ts', // Exclude barrel export files
      ],
      thresholds: {
        functions: 80,
        lines: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
})