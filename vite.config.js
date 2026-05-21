import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    base: '/AetherEdit-Pro/',
    plugins: [react()],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    build: {
        outDir: 'dist',
        chunkSizeWarningLimit: 3000,
    },
    optimizeDeps: {
        // @imgly/background-removal uses WASM + dynamic imports — must NOT be pre-bundled
        exclude: ['@imgly/background-removal'],
    },
    server: {
        headers: {
            // Required for SharedArrayBuffer used by WASM/ONNX runtime
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    },
    preview: {
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    },
});
