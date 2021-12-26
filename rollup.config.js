import { removeSync } from 'fs-extra'
import { appConfig } from './package.json'
import { preprocess as svelteWindicss } from 'svelte-windicss-preprocess'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import svelte from 'rollup-plugin-svelte'
import livereload from 'rollup-plugin-livereload'
import { wasm } from '@rollup/plugin-wasm'

const { distDir, buildDir } = appConfig
const production = process.env['NODE_ENV'] === 'production'

// clear previous builds
removeSync(distDir)

export default {
  preserveEntrySignatures: false,
  input: [`src/main.js`],
  output: {
    sourcemap: true,
    format: 'esm',
    dir: buildDir,
    chunkFileNames: `[name]${(production && '-[hash]') || ''}.js`,
  },
  plugins: [
    svelte({
      preprocess: [
        svelteWindicss({
          compile: false,
          prefix: 'windi-',
          globalPreflight: true,
          globalUtility: true,
        }),
      ],
    }),
    resolve({
      browser: true,
      dedupe: (importee) => !!importee.match(/svelte(\/|$)/),
    }),
    commonjs(),
    wasm(),
    production && terser(),
    !production && livereload(distDir), // refresh entire window when code is updated
  ],
  watch: {
    clearScreen: false,
  },
}
