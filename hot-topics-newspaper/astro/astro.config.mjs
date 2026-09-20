import { defineConfig } from 'astro/config';

export default defineConfig({
  // Static output — perfect for a newspaper that rebuilds daily
  output: 'static',
  build: {
    format: 'directory', // index.html per route
  },
});
