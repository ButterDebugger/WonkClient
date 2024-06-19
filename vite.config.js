import { basename, dirname, resolve } from 'node:path';
import { glob } from 'glob';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 4030
    },
    build: {
        target: "es2022",
        outDir: resolve(process.cwd(), 'dist'),
        rollupOptions: {
            input: (await glob("src/**/index.html")).reduce((put, path) => ({
                ...put,
                [basename(dirname(path))]: path
            }), {}),
        },
    },
    publicDir: resolve(process.cwd(), 'public'),
    root: resolve(process.cwd(), 'src'),
    appType: 'mpa',
});
