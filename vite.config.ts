import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Safely inject the API key. Vercel env vars often don't have VITE_ prefix unless specified.
      // This checks both VITE_API_KEY and API_KEY.
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY),
      // Polyfill process.env to prevent crashes in libraries that expect node environment
      'process.env': {} 
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    server: {
      port: 3000
    }
  };
});