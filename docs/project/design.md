# Stylinger — Design System & Visual Direction (design.md)

**Document Status:** Approved Design Direction  
**Aesthetic Theme:** *Haute Numérique / Atelier Studio*  
**Core Design Philosophy:** Editorial High-Fashion Meets Rigorous Scientific Precision  
**Target Medium:** Responsive Desktop & Mobile Web Studio  

---

## 1. Visual Philosophy & Identity

Stylinger is an **academic virtual fashion laboratory**, not a cookie-cutter SaaS dashboard. The design avoids generic bootstrap cards, bubble-gum gradients, and gratuitous blur effects. Instead, it draws inspiration from luxury fashion ateliers, editorial lookbooks, and high-precision scientific imaging instruments:

- **Large Imagery First:** High-fashion 3:4 portrait ratios dominate the viewport, providing generous breathing room for visual scrutiny.
- **Restrained Luxury Palette:** Deep obsidian, warm slate, crisp alabaster, and an electric gold accent (`#D4AF37`) used with surgical restraint.
- **Editorial Typography:** High-contrast pairing of a refined editorial serif (for titles and lookbook statements) with a crisp, geometric monospace/grotesque sans (for image coordinates, matrix metadata, and algorithmic telemetry).
- **Tactile Spatial Continuity:** Transitions and micro-animations indicate actual physical transformations (warping, sliding, blending), giving users the tangible sensation that the photograph itself is being transformed.

---

## 2. Color Palette & Token System

All color tokens are organized under CSS Custom Properties for immediate consumption in vanilla CSS.

```css
:root {
  /* Surface & Canvas Tokens */
  --bg-primary: #0A0C0F;            /* Deep Obsidian Void */
  --bg-surface: #12151B;            /* Atelier Slate Surface */
  --bg-surface-raised: #181C24;     /* Elevated Card / Panel Surface */
  --bg-surface-elevated: #202632;   /* Floating Drawer / Popover Surface */
  --bg-glass: rgba(18, 21, 27, 0.85);/* Backdrop Filter Glaze */

  /* Structural Border & Line Tokens */
  --border-subtle: #202632;         /* Baseline Divider */
  --border-default: #2E3747;        /* Card Perimeters & Interactive Borders */
  --border-hover: #4A566E;          /* Hover State Accent */
  --border-active: #D4AF37;         /* Selected / Active State (Liquid Gold) */

  /* Text & Typography Tokens */
  --text-primary: #F7F6F3;          /* Warm Alabaster Primary */
  --text-secondary: #9DA7B8;        /* Muted Studio Slate */
  --text-tertiary: #5E697C;         /* Subdued Footers & Inactive Labels */
  --text-accent: #E5C358;           /* High-Contrast Gold Accent */

  /* Accent & Semantic Tokens */
  --accent-gold: #D4AF37;           /* Liquid Atelier Gold */
  --accent-gold-glow: rgba(212, 175, 55, 0.18);
  --accent-cyan: #4CD6C0;           /* Algorithmic Inspector Metric (Teal) */
  --state-success: #2ECC71;         /* Confirmation Green */
  --state-warning: #E67E22;         /* Low-contrast warning */
  --state-error: #E74C3C;           /* Invalid format / error state */
}
```

---

## 3. Typography Architecture

Stylinger marries the timeless elegance of Vogue/Atelier editorial print with the analytical clarity of computer vision terminals:

| Role | Font Family Fallback Stack | Size / Weight | Line Height / Letter Spacing |
| :--- | :--- | :--- | :--- |
| **Hero / Title** | `'Playfair Display', 'Cormorant Garamond', 'Baskerville', serif` | `32px` – `48px` / Semi-Bold (600) | `1.15` / `-0.02em` |
| **Section Headings**| `'Playfair Display', 'Georgia', serif` | `20px` – `24px` / Medium (500) | `1.25` / `-0.01em` |
| **Body Primary** | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | `14px` – `15px` / Regular (400) | `1.6` / `0.00em` |
| **Metrics & Telemetry**| `'JetBrains Mono', 'Fira Code', 'Courier New', monospace` | `11px` – `12px` / Medium (500) | `1.4` / `+0.05em` uppercase |
| **Micro Labels** | `'Inter', sans-serif` | `10px` – `11px` / Bold (700) | `1.2` / `+0.08em` uppercase |

---

## 4. Spacing & Grid System

- **Base Unit:** Strictly based on an 8-point spatial rhythm:
  - `space-1` = `4px` (hairline offsets, icon gaps)
  - `space-2` = `8px` (compact element spacing, tag margins)
  - `space-3` = `12px` (input padding, label offsets)
  - `space-4` = `16px` (card content padding)
  - `space-6` = `24px` (container gutters, section separation)
  - `space-8` = `32px` (major component margins)
  - `space-12` = `48px` (workspace layout gaps)
- **Viewport Layout:**
  - **Left Rail / Inspector Drawer (360px fixed width):** Pipeline stage stepper, fine-tune sliders, academic CV metrics.
  - **Center Viewport (Fluid flex 1):** Main 3:4 portrait stage with comparison curtain.
  - **Right Rail / Catalog Drawer (340px fixed width):** Garment collection gallery and asset previews.

---

## 5. Border Radius & Surface Elevation

- **Radius Strategy:** Crisp, architectural, and restrained. Avoid rounded bubbly corners:
  - Small elements (Tags, badges, tooltips): `2px`
  - Interactive inputs, buttons: `4px`
  - Cards, canvas frames, modal dialogs: `6px`
  - Dividers & slider handles: `0px` (sharp surgical precision)
- **Depth & Shadow System:** Soft, multi-layered atmospheric ambient occlusion rather than harsh drop shadows:
  ```css
  --shadow-flat: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-subtle: 0 4px 16px -2px rgba(0, 0, 0, 0.4);
  --shadow-floating: 0 12px 36px -4px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.05);
  --shadow-gold-glow: 0 0 24px -2px rgba(212, 175, 55, 0.25);
  ```

---

## 6. Component Specifications

### 6.1 Upload Zone (Initial Empty State)
- **Visuals:** Large central 3:4 portrait frame outlined in a subtle border with animated dashed gold accents on drag hover.
- **Typography:**
  - Headline: *"Upload Studio Portrait"*
  - Subline: *"Frontal upper-body or full-body photograph (PNG, JPG up to 10MB)"*
- **Micro-Interaction:** Dragging a file over the target causes the dashed boundary to contract smoothly by `4px` with a soft ambient gold pulse (`--shadow-gold-glow`).

### 6.2 Interactive Before / After Comparison Curtain Slider
- **Visuals:** Two perfectly aligned absolute layers containing the original and composited images.
- **Divider Line:** Ultra-thin `2px` vertical line in solid Liquid Gold (`#D4AF37`).
- **Handle:** Minimalist diamond or circular brushed brass grip (`36px` diameter) with subtle `< | >` indicators.
- **Labels:** Muted floating badges: `"ORIGINAL"` (top-left) and `"STYLED COMPOSITE"` (top-right) that fade smoothly when the handle approaches them.
- **Interaction:** Smooth pointer tracking, touch support, and keyboard arrow key accessibility (stepping in 5% increments).

### 6.3 Garment Catalog Cards
- **Visuals:** Minimalist dark tiles displaying isolated transparent apparel PNGs over a subtle dark velvet radial gradient.
- **Hover State:** Card elevates by `-3px`, garment image subtly scales (`scale(1.04)`), and item details (title, category) fade into full opacity.
- **Selected State:** Border lights up with a sharp `1.5px solid #D4AF37` frame and an elegant gold checkmark badge in the top-right corner.

### 6.4 Pipeline Inspector & Stage Stepper
- **Visuals:** A collapsible vertical drawer dedicated to the academic evaluation of the CV algorithms.
- **Stepper Nodes:** 8 distinct milestone nodes:
  1. *Source RGB*
  2. *Grayscale BT.601*
  3. *HSV Slicing*
  4. *Morphological Opening/Closing*
  5. *Canny Edge Map*
  6. *Contour & Body Anchors*
  7. *Warped 2D Affine Garment*
  8. *Feathered Alpha Composite*
- **Node Interaction:** Clicking any node instantly displays that intermediate matrix in the viewport with a live histogram and algorithmic description.

### 6.5 Action Buttons
- **Primary CTA ("Apply Garment", "Download Outfit"):**
  - Solid background: `#D4AF37`
  - Text: `#0A0C0F` (bold, crisp contrast)
  - Hover: Background warms to `#E5C358` with `--shadow-gold-glow`.
- **Secondary / Ghost ("Inspect Pipeline", "Reset"):**
  - Border: `1px solid var(--border-default)`
  - Text: `var(--text-primary)`
  - Hover: Border color brightens to `var(--border-hover)`, background fills with `rgba(255, 255, 255, 0.04)`.

---

## 7. Motion & Interaction Guidelines

Animations must serve **spatial continuity and state communication**, never decorative clutter:

1. **Garment Transformation Transition:** When a garment is applied, it does not abruptly pop into place. It performs a 300ms cubic-bezier warp-fade (`cubic-bezier(0.16, 1, 0.3, 1)`), visually conveying the mathematical affine alignment.
2. **Comparison Curtain Elasticity:** The divider handle has zero physics bounce to maintain crisp precision, but features subtle magnetic snapping at 0%, 50%, and 100%.
3. **Processing Progress Feedback:** A high-precision progress beam traverses the top border of the canvas, lighting up the active pipeline step as each CV calculation completes.

---

## 8. Accessibility & Reduced-Motion Rules

- **Contrast Ratios:** All primary text (`#F7F6F3`) on background surfaces (`#0A0C0F`, `#12151B`) achieves a contrast ratio $> 14:1$, substantially exceeding WCAG AAA standards.
- **Keyboard Navigation:** All garment cards, file inputs, comparison handles, and inspector buttons are fully focusable with high-visibility gold focus rings (`outline: 2px solid #D4AF37; outline-offset: 2px`).
- **Prefers-Reduced-Motion:**
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
    .comparison-curtain {
      transition: none !important;
    }
  }
  ```
- **Screen Reader Announcements:** Dynamic ARIA live regions announce processing progress ("Processing HSV segmentation...", "Garment successfully composited").
