# ⚡ Manthan Prototypes — Neon Lab (v3)

> Futuristic, highly interactive 3D portfolio theme. All original bio info, projects,
> social links and hardware/software descriptions are preserved — only the visual
> layer was rebuilt.

**Live stack:** vanilla HTML/CSS/JS (no build step, GitHub Pages ready) +
Three.js · GSAP + ScrollTrigger · Lenis smooth scroll, all via CDN with graceful
fallbacks when offline.

## ✨ What's inside

| Feature | Implementation |
| :--- | :--- |
| **3D hero tech core** | `js/three-scene.js` — floating microchip (die + PCB + pins), wireframe shells, 3 orbit rings, satellites, rising sparks, hex pad. Cursor-tracked with damped inertia + live telemetry readouts |
| **Particle universe background** | Same module — dual drifting particle layers, two scroll-reactive grid floors, additive glow sprites, mouse-parallax camera |
| **Glitch headline** | Cyberpunk RGB-split glitch pulses on “MANTHAN PROTOTYPES” + typewriter operator line |
| **3D tilt cards** | `js/tilt.js` — cursor x/y tilt with rAF damping, cursor-tracked specular sheen + neon edge beam |
| **Skill cloud** | `js/skills-orbit.js` — 8 tech nodes (Arduino, C++, Python, HTML/CSS, JS, Arch Linux, Circuit Design, VS Code) in a projected 3D orbit; selecting a node expands its dossier and ignites related project tags |
| **Scroll experience** | `js/animations.js` — Lenis inertia scrolling locked to the render loop, GSAP reveals, hero parallax, pinned horizontal build-pipeline (desktop), scroll-spy HUD nav, animated counters, cursor glow, magnetic buttons |
| **Live GitHub matrix** | `js/github.js` — `mnthn26` repos, sorted by updated, with language tags + stars + “Source Files” links |
| **Live DeskTech feed** | `js/youtube.js` — channel `UCJ097…` via RSS, click-to-play embeds (iframes load only on intent) |
| **Theme system** | `style.css` — CSS custom properties (`--void #05070A`, `--cyan #00F0FF`, `--violet #8A2BE2/#7000FF`, `--emerald #00FF87`), glassmorphism + neon-glow utilities |
| **Brand + light/dark** | `assets/logo.svg` M-arrow mark in sidebar/nav/footer/preloader/veil; `js/theme.js` toggle (or `T` key), persisted, OS-aware, live 3D re-tint. Favicon = classic config (inline SVG M26 + original `favicon/` set) |

## 📂 Structure

```
index.html                  — 3D Spatial Command Dashboard (sidebar + bento console: hero, holo-avatar, DeskTech panel, link directory, live metrics)
about/about.html            — Developer Profile dossier
desktech/desktech.html      — DeskTech Broadcast Feed (full)
projects/projects.html      — Active Lab Repositories (full)
style.css                   — complete Neon Lab design system
script.js                   — boot orchestrator (preloader + module wiring)
js/three-scene.js           — background universe + hero core
js/animations.js            — Lenis + GSAP reveals, pinning, HUD interactions
js/tilt.js                  — 3D card tilt + specular system
js/skills-orbit.js          — interactive skill cloud
js/github.js · js/youtube.js— live data pipelines
js/theme.js                 — light/dark mode command (toggle, persistence, 3D sync)
js/dashboard.js             — page-veil tab transitions, drawer, clock, metrics, avatar boot
assets/logo.svg · logo.png  — brand mark (vector + 512px transparent render)
about/about.css, desktech/desktech.css — legacy v2 styles (kept for history, unlinked)
```

## ♿ Performance & resilience

- DPR capped (≤2 desktop, ≤1.25 low-power), particle counts scale down on mobile,
  canvases pause off-screen / when the tab is hidden.
- `prefers-reduced-motion` → static frames, no smooth-scroll hijack, no tilt.
- No WebGL / blocked CDN → CSS fallback core, IntersectionObserver reveals, native
  smooth scroll. Content is never trapped invisible (`anim-armed` gating).
- Semantic HTML, skip link, keyboard-operable skill cloud + video cards, alt text.

## 🚀 Run locally

```bash
# any static server from the repo root, e.g.
python3 -m http.server 8000
# → http://localhost:8000
```

Deployment is automatic via `.github/workflows/static.yml` (uploads the repo as-is
to GitHub Pages on push to `main`).

---

# 🎨 Manthan Prototypes (original project notes, preserved)

Welcome to **Manthan Prototypes**. This repository is a dedicated space for clean, responsive, and modern user interface (UI) designs, layouts, and web components built entirely with HTML and CSS.

The goal of this project is to create a reusable library of web layouts and components that focus on clean code, modern design trends, and excellent responsiveness across all screen sizes.

---

## 🛠️ Skills & Technologies

*   **Structure:** HTML5 (Semantic elements, accessible structures)
*   **Styling:** CSS3 (Flexbox, CSS Grid, Custom Properties/Variables)
*   **Design Practices:** Mobile-First Design, Responsive Layouts, Fluid Typography, Smooth CSS Animations

---

## 📂 Project Portfolio

| Prototype Folder | Core Features | Layout Type | Description |
| :--- | :--- | :--- | :--- |
| **`📐 layout-templates`** | CSS Grid, Flexbox, Media Queries | Responsive Layouts | Clean page structures, landing page wireframes, and dashboard grids. |
| **`✨ ui-components`** | CSS Transitions, Hover Effects, Buttons | Web Elements | A collection of modern navigation bars, cards, buttons, and form inputs. |
| **`📱 mobile-designs`** | Viewport Units, Flexible Images | Mobile-First | Web layouts optimized specifically for smartphones and tablets. |
| **`🌗 themes`** | CSS Variables, Root Styling | Light/Dark Mode | Clean stylesheets designed for easy color-theme switching. |

---

## 📐 Coding Standards

Every file in this repository is built following these core practices:

*   **Semantic HTML:** Using proper tags like `<header>`, `<nav>`, `<main>`, and `<footer>` instead of unnecessary nested `<div>` tags.
*   **Pure CSS:** 100% vanilla CSS. No frameworks (like Bootstrap or Tailwind), ensuring lightweight and fast-loading pages.
*   **Responsive Architecture:** Layouts are thoroughly tested to ensure they scale smoothly from mobile screens up to desktop monitors.
*   **Organized Code:** Well-commented CSS files with logical sections, making it easy to copy, paste, and customize code blocks for other projects.

---

## 🚀 How to Use These Files

You can easily download and use any of these templates or components for your own web projects.

```bash
# Clone the repository
git clone [https://github.com/your-username/manthan-prototypes.git](https://github.com/your-username/manthan-prototypes.git)

# Navigate to any project folder and open the index.html file in your browser
```
