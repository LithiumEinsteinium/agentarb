import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const buildOptions = {
  entryPoints: ['src/main.jsx'],
  bundle: true,
  outfile: 'dist/assets/main.js',
  minify: true,
  target: ['es2020'],
  loader: {
    '.js': 'jsx',
    '.jsx': 'jsx'
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
};

async function build() {
  fs.mkdirSync('dist', { recursive: true });
  fs.mkdirSync('dist/assets', { recursive: true });
  
  await esbuild.build(buildOptions);
  
  let html = fs.readFileSync('index.html', 'utf8');
  html = html.replace('/src/main.jsx', '/assets/main.js');
  // Add CSS link if not present
  if (!html.includes('main.css')) {
    html = html.replace('</head>', '<link rel="stylesheet" href="/assets/main.css">\n</head>');
  }
  fs.writeFileSync('dist/index.html', html);
  
  console.log('Build complete!');
}

build();
