// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: true,
      strictPort: false,
      allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io']
    }
  }
});