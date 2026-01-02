import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
    define: {
        '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
    },
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: true,
        port: 5173,
        proxy: {
            '/api': 'http://localhost:3000',
            '/auth': 'http://localhost:3000'
        }
    }
})
