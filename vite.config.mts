/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'
import { vueI18n } from "@intlify/vite-plugin-vue-i18n";

// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
import vuetify from 'vite-plugin-vuetify'

const proxyUrl: string = 'http://localhost:3000'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vuetify({ autoImport: true }),
        vueI18n({
            // if you want to use Vue I18n Legacy API, you need to set `compositionOnly: false`
            // compositionOnly: false,

            // you need to set i18n resource including paths !
            include: fileURLToPath(
                new URL('./src/locales/**', import.meta.url)
            ),
        }),
    ],
    resolve: {
        alias: {
            '#': fileURLToPath(new URL('./src', import.meta.url)),
            '@': fileURLToPath(new URL('./src/components', import.meta.url)),
        },
    },
    base: '/simulatorvue/',
    build: {
        outDir: '../public/simulatorvue',
        assetsDir: 'assets',
        chunkSizeWarningLimit: 1600,
    },
    server: {
        port: 4000,
        proxy: {
            // ...(process.env.NODE_ENV === 'development' && {
            '^/(?!(simulatorvue)).*': {
                target: proxyUrl,
                changeOrigin: true,
                headers: {
                    origin: proxyUrl,
                },
            },
            // }),
        },
    },
    test: {
        testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
        testPathIgnorePatterns: ['/node_modules/', '/dist/', '/public/'],
        transform: {
            '^.+\\.vue$': 'vite-jest',
            '^.+\\.ts$': 'vite-jest',
            '^.+\\.css$': '<rootDir>/path/to/styleMock.js',
        },
        deps: {
            optimizer: {
              web: {
                include: ['vuetify'],
              },
            },
          },
        environment: 'happy-dom'
    },
})
