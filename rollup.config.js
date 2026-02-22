import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import css from 'rollup-plugin-import-css';
import json from '@rollup/plugin-json';
import image from '@rollup/plugin-image';
import dotenv from 'dotenv';
import replace from '@rollup/plugin-replace';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import url from '@rollup/plugin-url';

// Load `.env` variables
dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';

export default {
  input: 'src/library.js', // Library entry point
  output: [
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: !isDevelopment,
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: !isDevelopment,
    },
  ],
  plugins: [
    // This prevents needing an additional `external` prop in this config file by automatically excluding peer dependencies
    peerDepsExternal(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.env.REACT_APP_WS_URL': JSON.stringify(
        process.env.REACT_APP_WS_URL || ''
      ),
      'process.env.REACT_APP_API_BASE_URL': JSON.stringify(
        process.env.REACT_APP_API_BASE_URL || ''
      ),
      'process.env.REACT_APP_KIOSK_MODE': JSON.stringify(
        process.env.REACT_APP_KIOSK_MODE || ''
      ),
      'process.env.REACT_APP_HIDE_ON_DISCONNECT': JSON.stringify(
        process.env.REACT_APP_HIDE_ON_DISCONNECT || ''
      ),
      'process.env.REACT_APP_LAYOUT': JSON.stringify(
        process.env.REACT_APP_LAYOUT || ''
      ),
      'process.env.REACT_APP_MAX_HEIGHT': JSON.stringify(
        process.env.REACT_APP_MAX_HEIGHT || ''
      ),
      'process.env.REACT_APP_PANEL_MAX_HEIGHT': JSON.stringify(
        process.env.REACT_APP_PANEL_MAX_HEIGHT || ''
      ),
      'process.env.REACT_APP_MOBILE_BREAKPOINT': JSON.stringify(
        process.env.REACT_APP_MOBILE_BREAKPOINT || ''
      ),
    }),
    // Convert CommonJS modules to ES6
    commonjs({
      preferBuiltins: false,
      include: 'node_modules/**',
    }),
    // "...locates modules using the Node resolution algorithm"
    resolve(),
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx'], // Transpile both .js and .jsx files
      presets: ['@babel/preset-env', '@babel/preset-react'],
    }),
    image(),
    json(),
    url({
      include: ["**/*.png", "**/*.jpg", "**/*.svg", "**/*.gif"],
      limit: 0,
      // fileName: "[dirname][hash][extname]",
      // publicPath: "/dist/",
    }),
    css({
      inject: true,
      minify: true
    }),
    !isDevelopment && terser(),
  ],
};
