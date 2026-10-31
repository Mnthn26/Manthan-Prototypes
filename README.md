# ◼ DOMIC — Editorial Studio (v4)

> Minimalist, modern **editorial portfolio** theme. The entire visual layer was
> rebuilt as pure HTML + CSS (no frameworks, no JavaScript required) to match the
> reference art direction: warm sage/stone paper, near-black charcoal type,
> condensed-grotesque display faces paired with high-contrast italic serif.

**Live stack:** vanilla HTML/CSS only — CSS-only fullscreen menu (checkbox hack),
CSS scroll-driven reveal animations (`animation-timeline: view()`, with graceful
fallback), fluid `clamp()` typography, fully responsive from 320px to desktop.

## ✨ What's inside

| Section | Implementation |
| :--- | :--- |
| **Top bar** | `● DOMIC` brand left, black pill `MENU` toggle right → fullscreen charcoal overlay nav (pure CSS, keyboard-focusable) |
| **Hero grid** | 3 columns: intro + massive `A UI/UX / & Brand / DESIGNER` headline (Oswald bold + Playfair italic) + `CONTACT ME` pill with arrow disc · circular portrait on a darker sage vertical band · stacked stats (15+ / 280+ / *99% / 50) |
| **Core pillars bar** | 4-column hairline-divided service breakdown (User-Centered Design · Brand Identity & Strategy · Responsive & Modern UI · Seamless Prototyping) |
| **Trusted by** | Tracker title + right-aligned caption, 4×2 bordered logo-badge grid (inline SVG marks) |
| **About / philosophy** | Split layout: `CRAFTING MEANINGFUL BRANDS & INTUITIVE EXPERIENCES` left, serif lead + body right |
| **Portfolio** | `PORTFOLIO` header + right caption, large rounded project cards (Soundwave / Atelier Nord / Flowboard) with title, description, year and tag pill |
| **Footer / contact** | Editorial CTA (`LET'S MAKE *something* EXTRAORDINARY`), email pill, socials, hairline bottom bar |

## 🎨 Design tokens (`style.css`)

| Token | Value | Use |
| :--- | :--- | :--- |
| `--paper` | `#D9DAD4` | sheet background (warm off-white sage) |
| `--frame` | `#BBBCB5` | page frame around the sheet |
| `--band` | `#B4B7AF` | hero portrait band |
| `--ink` | `#22231D` | deep charcoal headings/body |
| `--ink-soft` / `--muted` | `#4E4F47` / `#7C7E74` | secondary text / captions |
| `--pill` | `#191A14` | near-black pills & menu overlay |
| Type pairing | Oswald (condensed grotesque) + Playfair Display (serif / italic serif) | display vs. editorial body |

## 📂 Structure

```
index.html                  — editorial portfolio homepage (this theme)
style.css                   — complete Editorial Studio design system
assets/img/                 — portrait + project photography
favicon/                    — icon set (unchanged)
about/ · desktech/ · projects/ — legacy Neon Lab sub-pages (v3), now styled
                                 via legacy/neon.css so they keep working
legacy/neon.css             — archived v3 Neon Lab stylesheet
js/ · script.js             — v3 modules, still used by the legacy sub-pages
```

## ♿ Accessibility & resilience

- Semantic landmarks, skip link, alt text, `aria-label`s on icon-only controls.
- Menu toggle is a real (visually hidden) checkbox — Tab + Space works, page
  scroll locks while open (`:has()`), overlay degrades to a static page if
  `:has` is unsupported.
- `prefers-reduced-motion` disables reveals, smooth scroll and hover motion.
- Google Fonts loaded with full local fallback stacks (Arial Narrow / Georgia).

## 🚀 Run locally

```bash
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
