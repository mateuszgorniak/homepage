import { defineConfig } from 'astro/config';

// Set base to '/rubycon-homepage/' when deploying to a project repo on GitHub Pages.
// Use '/' for a user/organization site (username.github.io).
const base = process.env.BASE_PATH || '/rubycon-homepage/';

export default defineConfig({
  site: process.env.SITE_URL || 'https://mateusz-gorniak.github.io',
  base,
  output: 'static',
  build: {
    assets: 'assets',
  },
});
