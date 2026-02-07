import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Using the requested key: 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
  const activeKey = "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";

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(activeKey || env.VITE_API_KEY || env.API_KEY),
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