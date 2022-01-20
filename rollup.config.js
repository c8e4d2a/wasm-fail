import { removeSync } from 'fs-extra'
import { appConfig } from './package.json'
import { preprocess as svelteWindicss } from 'svelte-windicss-preprocess'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import svelte from 'rollup-plugin-svelte'
import livereload from 'rollup-plugin-livereload'
import esbuild from 'rollup-plugin-esbuild'

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
    //https://esbuild.github.io/plugins/#webassembly-plugin
    esbuild({
      plugins: [{
        name: 'wasm',
        setup(build) {
          let path = require('path')
          let fs = require('fs')

          build.onResolve({ filter: /\.wasm$/ }, args => {
            // If this is the import inside the stub module, import the
            // binary itself. Put the path in the "wasm-binary" namespace
            // to tell our binary load callback to load the binary file.
            if (args.namespace === 'wasm-stub') {
              return {
                path: args.path,
                namespace: 'wasm-binary',
              }
            }
      
            if (args.resolveDir === '') {
              return // Ignore unresolvable paths
            }
            return {
              path: path.isAbsolute(args.path) ? args.path : path.join(args.resolveDir, args.path),
              namespace: 'wasm-stub',
            }
          })
          build.onLoad({ filter: /.*/, namespace: 'wasm-stub' }, async (args) => ({
            contents: `import wasm from ${JSON.stringify(args.path)}
              export default (imports) =>
                WebAssembly.instantiate(wasm, imports).then(
                  result => result.instance.exports)`,
          }))
          build.onLoad({ filter: /.*/, namespace: 'wasm-binary' }, async (args) => ({
            contents: await fs.promises.readFile(args.path),
            loader: 'binary',
          }))
        },}],
    }),
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
    production && terser(),
    !production && livereload(distDir), // refresh entire window when code is updated
  ],
  watch: {
    clearScreen: false,
  },
}
