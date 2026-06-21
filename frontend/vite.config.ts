import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const env =
  (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const devPort = Number(env.VITE_DEV_PORT || env.PORT || 5174);

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: devPort,
    strictPort: true,
  },
});
