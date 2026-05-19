import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    build: {
        outDir: 'dist',
        chunkSizeWarningLimit: 2000,
    },
    optimizeDeps: {
        include: ['fabric', 'dexie', 'zustand', 'immer'],
    },
});
