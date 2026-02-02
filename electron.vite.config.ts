import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@src': resolve('src'),
        '@libs': resolve('src/libs')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@src': resolve('src'),
        '@libs': resolve('src/libs')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@src': resolve('src'),
        '@renderer': resolve('src/renderer/app'),
        '@libs': resolve('src/libs')
      }
    },
    plugins: [react()]
  }
})
