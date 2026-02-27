// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import tailwindcss from '@tailwindcss/vite';

const env = loadEnv(process.env.MODE ?? 'development', process.cwd(), '');
const allowedHosts = (env.ALLOWED_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: true,
      strictPort: false,
      allowedHosts
    }
  }
});
