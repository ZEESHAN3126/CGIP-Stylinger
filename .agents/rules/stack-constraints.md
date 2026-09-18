---
description: Strict technology stack constraints and translation rules for Stylinger.
always_on: true
---

# Stylinger — Technology Stack Constraints & Translation Rules

This rule enforces non-negotiable technology boundaries across the Stylinger project.

## 1. Forbidden Frontend Frameworks & Libraries
- **STRICTLY PROHIBITED:** React, Next.js, Vue, Angular, Svelte, Solid.js.
- **STRICTLY PROHIBITED:** TailwindCSS, Bootstrap, Bulma, Foundation, Sass, Less.
- **STRICTLY PROHIBITED:** Component libraries (shadcn/ui, Radix, Material UI, Ant Design).

## 2. Mandatory Frontend Implementation Stack
- **Structure:** Semantic HTML5 (`<header>`, `<main>`, `<section>`, `<article>`, `<nav>`, `<aside>`, `<footer>`).
- **Styling:** Pure Vanilla CSS3 with Custom Properties (CSS variables) for design tokens. Responsive layouts must use CSS Flexbox and CSS Grid.
- **Interactivity:** Pure Vanilla ECMAScript 6+ (Fetch API, DOM Events, standard Canvas API).
- **Comparison Slider:** Custom HTML5/CSS3 `clip-path` implementation with vanilla mouse/touch event listeners.

## 3. Translation of External Skill Guidance
When skills like `ui-ux-pro-max`, `taste-skill`, or `ECC` provide recommendations or code snippets:
- Translate all Tailwind utility classes into semantic Vanilla CSS rules using project tokens in `variables.css`.
- Translate all React/JSX component examples into standard HTML5 markup and vanilla JavaScript DOM manipulation functions.
- Never install any npm packages for UI styling or layout.

## 4. Backend & Database Constraints
- **Framework:** Python 3.12 + Flask 3.0+.
- **STRICTLY PROHIBITED:** SQL Databases (PostgreSQL, MySQL, SQLite) and NoSQL Databases (MongoDB, Redis).
- **Session Architecture:** All state is stateless or ephemeral, stored in temporary filesystem session directories (`temp/sessions/<session_id>/`) with automated TTL cleanup.

## 5. Architectural Isolation
- `src/processing/` must contain pure mathematical algorithms (OpenCV/NumPy) with **zero imports** of Flask, PyQt5, or frontend code.
- The baseline PyQt5 desktop GUI (`src/gui/main_window.py`) must remain functional and decoupled from the web application.
