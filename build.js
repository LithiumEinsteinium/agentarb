import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

// Build React app
await esbuild.build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  outfile: 'dist/assets/main.js',
  minify: isProduction,
  sourcemap: !isProduction,
  target: ['es2020'],
  loader: {
    '.js': 'jsx',
    '.jsx': 'jsx',
    '.css': 'css'
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});

// Copy index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('/src/main.jsx', '/assets/main.js');
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);

console.log('Build complete!');
