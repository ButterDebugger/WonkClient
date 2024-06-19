import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 4030
    },
    publicDir: resolve(process.cwd(), 'public'),
    root: resolve(process.cwd(), 'src'),
    appType: 'mpa',
});
