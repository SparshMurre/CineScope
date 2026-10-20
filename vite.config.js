import process from 'node:process'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import aiRecommendHandler from './api/ai-recommend.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load server-side environment variables (including GEMINI_API_KEY without VITE_ prefix)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'ai-recommend-api',
        configureServer(server) {
          server.middlewares.use('/api/ai-recommend', async (req, res) => {
            await aiRecommendHandler(req, res, env)
          })
        },
        configurePreviewServer(server) {
          server.middlewares.use('/api/ai-recommend', async (req, res) => {
            await aiRecommendHandler(req, res, env)
          })
        },
      },
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/**',
          'dist/**',
          'src/test/**',
          '**/*.config.*',
        ],
      },
    },
  }
})
