import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const isServe = process.argv.includes('--serve');

const buildOptions = {
  entryPoints: ['src/main.jsx'],
  bundle: true,
  outfile: 'dist/assets/main.js',
  minify: !isServe,
  sourcemap: isServe,
  target: ['es2020'],
  loader: {
    '.js': 'jsx',
    '.jsx': 'jsx'
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
};

async function build() {
  // Ensure dist directory exists
  fs.mkdirSync('dist', { recursive: true });
  fs.mkdirSync('dist/assets', { recursive: true });
  
  // Build the bundle
  await esbuild.build(buildOptions);
  
  // Copy and modify index.html
  let html = fs.readFileSync('index.html', 'utf8');
  html = html.replace('/src/main.jsx', '/assets/main.js');
  fs.writeFileSync('dist/index.html', html);
  
  console.log('Build complete!');
}

if (isServe) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.serve({
    servedir: 'dist',
    port: 3000
  });
  console.log('Dev server running on http://localhost:3000');
} else {
  build();
}
