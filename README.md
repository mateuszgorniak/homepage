# 🖥️ RubyCon Homepage

> Minimalist company site for a Finnish sole proprietorship (toiminimi): web apps, fractional dev and CTO services.

[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![Node](https://img.shields.io/badge/Node-24%20LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-222?logo=github)](https://pages.github.com)

---

## ✨ What's inside

| Feature | Details |
|---------|---------|
| 🪟 Terminal UI | macOS-style window chrome with typewriter hero |
| 🌍 Languages | English · Polish · Finnish (client-side switcher) |
| 📬 Contact form | Opens visitor's email app (`mailto:`) → `mateusz.gorniak@gmail.com` |
| 🎬 Animations | Scroll reveal + typewriter (`prefers-reduced-motion` supported) |
| 🚀 Hosting | Static export → GitHub Pages |

---

## 🏁 Run locally

**Only [Docker](https://docs.docker.com/get-docker/) is required.** No Node.js install on your machine.

### 🐳 Docker *(recommended)*

```bash
docker compose up --build
```

Open **http://localhost:4321** (dev uses `BASE_PATH=/`; GitHub Pages keeps `/rubycon-homepage/`).

> Edits to `src/` are picked up automatically via volume mount. `node_modules` stays inside Docker.

| Command | What it does |
|---------|--------------|
| `docker compose up` | Dev server with hot reload |
| `docker compose up --build` | Rebuild image after dependency changes |
| `docker compose down` | Stop containers |
| `docker compose --profile preview up --build` | Build + preview production output |
| `docker compose --profile build run --rm build` | Write static `dist/` to disk (same as CI) |

### 🟢 Node.js *(alternative)*

If you prefer running without Docker, install **Node.js 24 LTS** (see [`.nvmrc`](.nvmrc) → major `24`).

| Tool | Command |
|------|---------|
| **nvm** | `nvm install` → `nvm use` |
| **fnm** | `fnm install` → `fnm use` |
| **Direct** | [nodejs.org](https://nodejs.org/en/download) |

```bash
npm install
npm run dev
```

```bash
npm run build    # production build → dist/
npm run preview  # preview production build
```

### 🚀 GitHub Pages (production)

Docker is for local development only. Production uses **GitHub Actions**, which builds static files and publishes to GitHub Pages.

---

## 🔧 Maintenance guide

### 📝 Edit page content (most common task)

All visible text lives in JSON. No component changes needed.

| File | Language |
|------|----------|
| `src/i18n/en.json` | 🇬🇧 English (master, edit this first) |
| `src/i18n/pl.json` | 🇵🇱 Polish |
| `src/i18n/fi.json` | 🇫🇮 Finnish |

**Tips:**
- Keep the same JSON structure across all three files
- After editing `en.json`, mirror new keys in `pl.json` and `fi.json`
- Change availability: update `./check_availability.sh` output in `hero.commands` (each locale file)

### 🎨 Edit styles

| File | Purpose |
|------|---------|
| `src/styles/global.css` | Layout, typography, cards, forms |
| `src/styles/window-ui.css` | Terminal window chrome (traffic lights, title bar) |

Colors are CSS variables in `:root`. Change once, applies everywhere.

### 🧩 Edit layout / sections

| Path | What it does |
|------|--------------|
| `src/pages/index.astro` | Page assembly (section order) |
| `src/components/` | Individual UI sections |
| `src/scripts/` | Client JS (i18n, animations, scroll spy) |

### 📬 Contact form

The form uses **`mailto:`** — no API keys or third-party services. On submit it opens the visitor's email app with a pre-filled subject and body to `mateusz.gorniak@gmail.com`. They send the message from their own client.

> Static hosting (GitHub Pages) has no server to send email in the background. For silent form submission you'd need a backend or service like Formspree / Web3Forms.

### 🌍 Add or change a language

1. Copy `src/i18n/en.json` → `src/i18n/xx.json`
2. Translate all values
3. Register locale in `src/i18n/index.ts` (`locales`, `localeLabels`, `translations`)
4. Add a button in `src/components/SiteNav.astro`

### 📦 Update dependencies

```bash
nvm use
npm outdated              # check what's behind
npm install astro@latest typescript@latest
npm run build             # always verify after upgrades
```

Current stack:

| Package | Role |
|---------|------|
| `astro` ^7 | Static site generator |
| `typescript` ^6 | Type checking |

> Astro 7 requires **Node ≥ 22.12**. This project targets **Node 24 LTS** (major `24` in `.nvmrc`). CI uses Node 24.

### 🚀 Deploy to GitHub Pages

**One-time setup:**

1. Push repo to GitHub
2. **Settings → Pages → Build and deployment** → Source: **GitHub Actions**

**Every deploy:** push to `main`. The workflow builds and publishes automatically.

| Repo type | `BASE_PATH` in workflow |
|-----------|-------------------------|
| `username/rubycon-homepage` | `/rubycon-homepage/` *(default)* |
| `username.github.io` | `/` |

Live URL: `https://<username>.github.io/rubycon-homepage/`

### 🏢 Business details (footer)

- **Y-tunnus:** `3597173-9`
- **YTJ register:** https://tietopalvelu.ytj.fi/yritys/3597173-9
- Edit labels in `src/i18n/*.json` under `footer.*`

---

## 📁 Project structure

```
.
├── Dockerfile                     # Dev / build / preview images (Node 24 LTS)
├── docker-compose.yml             # Local dev without installing Node
├── docker-entrypoint.sh
├── .github/workflows/deploy.yml   # CI/CD → GitHub Pages (no Docker)
├── .nvmrc                         # Node 24 LTS (major only)
├── public/                        # Static assets (favicon)
├── src/
│   ├── components/                # Astro UI components
│   ├── i18n/                      # Translation JSON files
│   ├── layouts/                   # HTML shell + meta tags
│   ├── pages/                     # Routes (single-page site)
│   ├── scripts/                   # Client-side JS
│   └── styles/                    # CSS
├── astro.config.mjs               # Site URL, base path
```

---

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| Docker: `Another astro dev server is already running` | Run `docker compose down`, then `docker compose up --build` again |
| Docker: port already in use | Stop other services on `4321` or change the port mapping in `docker-compose.yml` |
| Docker: slow first start | First run installs `node_modules` into a volume; later starts are faster |
| `Node.js is not supported by Astro` | Use Docker, or run `nvm install && nvm use` (Node 24 LTS) |
| Broken assets on GitHub Pages | Check `BASE_PATH` in `astro.config.mjs` matches repo name |
| Language switch not working | Ensure JSON keys match across `en.json`, `pl.json`, `fi.json` |
| Build fails after upgrade | Delete `node_modules` + `package-lock.json`, then `npm install` |

---

## 📄 License

Private. All rights reserved.
