# AdaptiveMind AI — Design System Master

## 1. Product Design Thesis

AdaptiveMind AI is a **living learning universe** — an intelligent, calm, spatial educational platform that adapts to how each learner understands. The interface communicates adaptation through a **Learning DNA constellation**, where every interaction shapes the experience.

Design principles:
- **Intelligent, not flashy** — every visual choice serves comprehension
- **Spatial, not flat** — depth communicates relationships and state
- **Calm, not loud** — the learner's focus belongs to the content
- **Warm, not cold** — inviting surfaces that feel human
- **Premium, not generic** — every detail signals quality
- **Original, not derivative** — a distinctive identity, not a clone

## 2. Color Tokens

### Spatial Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `--am-bg-deep` | `#080c1b` | Dark sections, landing hero, 3D scene surrounds |
| `--am-bg-mid` | `#0e1428` | Secondary dark surfaces |
| `--am-bg-surface` | `#f7f5f0` | Warm off-white page backgrounds |
| `--am-bg-reading` | `#faf8f5` | Lesson reading surfaces |
| `--am-bg-elevated` | `#ffffff` | Cards, modals, elevated surfaces |

### Text
| Token | Value | Ratio |
|-------|-------|-------|
| `--am-text-primary` | `#1a1d2e` | 15.4:1 on surface |
| `--am-text-secondary` | `#5c5f73` | 7.2:1 on surface |
| `--am-text-muted` | `#9195a8` | 4.6:1 on surface |
| `--am-text-inverse` | `#f0f0f2` | On dark backgrounds |

### Primary Accent
| Token | Value | Usage |
|-------|-------|-------|
| `--am-primary` | `#5046e5` | Primary buttons, links, active states |
| `--am-primary-hover` | `#4338ca` | Hover states |
| `--am-primary-light` | `#ede9fe` | Subtle backgrounds |
| `--am-primary-glow` | `rgba(80, 70, 229, 0.15)` | Atmospheric glow |

### Learning DNA Colors (Semantic)

| Dimension | Token | Value | Usage |
|-----------|-------|-------|-------|
| Visual | `--am-dna-visual` | `#22d3ee` | Cyan |
| Examples | `--am-dna-examples` | `#f59e0b` | Amber |
| Analogies | `--am-dna-analogies` | `#8b5cf6` | Violet |
| Stories | `--am-dna-stories` | `#fb7185` | Rose |
| Challenges | `--am-dna-challenges` | `#fb6a4a` | Coral |

- All DNA colors must meet 4.5:1 contrast against white text
- Never communicate meaning through color alone; always pair with text labels and icons

### Semantic States
| Token | Value | Usage |
|-------|-------|-------|
| `--am-success` | `#10b981` | Positive states |
| `--am-success-light` | `#ecfdf5` | Success backgrounds |
| `--am-warning` | `#f59e0b` | Warning states |
| `--am-warning-light` | `#fffbeb` | Warning backgrounds |
| `--am-error` | `#ef4444` | Error states |
| `--am-error-light` | `#fef2f2` | Error backgrounds |

## 3. Typography

### Type Scale
| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 3.5rem (56px) | 700 | 1.1 | Landing hero, major reveals |
| Heading 1 | 2.25rem (36px) | 700 | 1.2 | Page titles |
| Heading 2 | 1.5rem (24px) | 600 | 1.3 | Section headings |
| Heading 3 | 1.25rem (20px) | 600 | 1.4 | Card titles, lesson titles |
| Body | 1rem (16px) | 400 | 1.6 | Reading content |
| Body Small | 0.875rem (14px) | 400 | 1.5 | Supporting text |
| Label | 0.75rem (12px) | 600 | 1.4 | Labels, badges, captions |
| Code | 0.875rem (14px) | 400 | 1.5 | Inline code |

### Font Stacks
```css
--font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, monospace;
```

- Fonts are system-available or bundled; no build-time download dependency
- Minimum 16px body text on mobile (prevents iOS auto-zoom)
- Body line length: 60–75 characters on desktop, 35–60 on mobile

## 4. Spacing Scale

| Token | Value | Example |
|-------|-------|---------|
| `--am-space-xs` | 0.25rem (4px) | Micro spacing |
| `--am-space-sm` | 0.5rem (8px) | Tight spacing |
| `--am-space-md` | 1rem (16px) | Base spacing |
| `--am-space-lg` | 1.5rem (24px) | Section padding |
| `--am-space-xl` | 2rem (32px) | Component gaps |
| `--am-space-2xl` | 3rem (48px) | Section gaps |
| `--am-space-3xl` | 4rem (64px) | Page section gaps |

## 5. Layout Principles

- Max content width: 72rem (1152px) for reading, 80rem (1280px) for dashboard
- Asymmetrical compositions preferred over symmetrical grids
- Content area hierarchy: primary content on left, supporting on right
- Mobile-first responsive design targeting 360px → 1920px
- Each view has one primary action

## 6. Surface Hierarchy

| Level | Background | Border | Shadow | Usage |
|-------|-----------|--------|--------|-------|
| Page | `--am-bg-reading` | None | None | Default |
| Card | `--am-bg-elevated` | `--am-border-light` | `--am-shadow-sm` | Content containers |
| Elevated | `--am-bg-elevated` | `--am-border` | `--am-shadow-md` | Modals, dropdowns |
| Overlay | N/A | N/A | `--am-shadow-lg` | Modal backdrops |

## 7. Border Radius

| Token | Value |
|-------|-------|
| `--am-radius-sm` | 0.5rem (8px) |
| `--am-radius-md` | 0.75rem (12px) |
| `--am-radius-lg` | 1rem (16px) |
| `--am-radius-xl` | 1.25rem (20px) |
| `--am-radius-2xl` | 1.5rem (24px) |
| `--am-radius-full` | 9999px |

## 8. Elevation / Shadow

| Token | Value |
|-------|-------|
| `--am-shadow-sm` | `0 1px 3px rgba(8, 12, 27, 0.06)` |
| `--am-shadow-md` | `0 4px 16px rgba(8, 12, 27, 0.08)` |
| `--am-shadow-lg` | `0 8px 32px rgba(8, 12, 27, 0.10)` |
| `--am-shadow-xl` | `0 16px 48px rgba(8, 12, 27, 0.14)` |

## 9. Focus & Interaction States

- Focus visible: 2px solid `--am-primary`, 2px offset, rounded
- Hover: subtle transform (+1px translateY for cards, opacity for text)
- Active/Pressed: scale(0.97) for buttons, no translateY
- Disabled: opacity 0.5, cursor not-allowed
- Selected: primary border + light primary background
- Loading: animated pulse or shimmer, disabled interaction state

## 10. Loading States

- Skeleton shimmer for content areas
- Animated pulse ring for 3D scene (conic gradient)
- Progress bar for linear flows (assessment, lesson generation)
- Spinner for button actions
- Use `aria-busy="true"` on loading regions
- Never use fake typing indicators

## 11. Motion

### Durations
| Token | Value | Usage |
|-------|-------|-------|
| `--am-duration-fast` | 120ms | Micro-interactions, button press |
| `--am-duration-quick` | 180ms | Hover, focus transitions |
| `--am-duration-standard` | 280ms | Default transitions |
| `--am-duration-reveal` | 450ms | Content reveals, page transitions |
| `--am-duration-slow` | 650ms | Emphasized transitions |

### Easing
| Token | Value | Usage |
|-------|-------|-------|
| `--am-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entering elements |
| `--am-ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | State transitions |
| `--am-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Emphasized feedback |

### Motion Rules
- Animate only `transform` and `opacity` for performance
- Entry animations: 280ms ease-out
- Exit animations: 180ms ease-in (faster than entry)
- Page transitions: 350ms crossfade
- List stagger: 40ms per item
- Respect `prefers-reduced-motion`: disable all decorative animation, keep functional transitions at 0.01ms
- Never block user input during animation
- All animations must be interruptible

## 12. Responsive Breakpoints

| Name | Width | Target |
|------|-------|--------|
| Mobile | < 768px | Phones |
| Tablet | 768px - 1023px | Tablets |
| Desktop | 1024px - 1439px | Laptops |
| Wide | 1440px+ | Desktop |

### Mobile Rules
- Bottom tab navigation, not sidebar
- Single-column layout
- Larger touch targets (min 44×44px)
- Simplified 3D scenes (fewer particles, lower poly)
- Readable lesson width (100% with comfortable padding)
- No horizontal overflow
- Safe bottom spacing for home indicator

## 13. 3D Usage Rules

- 3D is for meaningful spatial communication only (Learning DNA, knowledge relationships)
- Dynamic import with `ssr: false` — never block initial render
- `WebGLErrorBoundary` wrapping all Three.js scenes
- `SceneFallback` — polished 2D SVG/CSS version shown when WebGL unavailable
- Respect `prefers-reduced-motion` — show fallback or static scene
- Limited DPR (max 2 on mobile)
- No external 3D models, no large textures, no heavy post-processing
- Pause rendering when offscreen or in hidden tab
- Stable aspect-ratio container — no layout shift
- Accessible HTML text labels and screen-reader descriptions outside canvas
- All data shown in 3D must also be available in 2D HTML

## 14. Accessibility Requirements (WCAG 2.2 AA)

- Semantic landmarks (`<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`)
- Logical heading hierarchy (h1 → h2 → h3, no skips)
- Keyboard navigation with visible focus rings
- All interactive elements must be keyboard accessible
- Buttons with `<button>`, links with `<a>`, no div-as-button without role
- Form labels properly associated with inputs
- Error messages near the field with `aria-describedby`
- Minimum 4.5:1 contrast for normal text, 3:1 for large
- Minimum touch target: 44×44px
- `prefers-reduced-motion` respected
- Text alternatives for all non-text content
- No color-only communication (always pair with icon/label/text)
- `aria-live` regions for dynamic content
- Focus management after state changes (navigation, modal, error)
- Skip-to-content link

## 15. Prohibited Patterns

- ❌ Stock brain icons or graduation caps as primary logo
- ❌ Chat bubble UI for tutor (structured lesson instead)
- ❌ Fake typing indicators
- ❌ Decorative floating particles
- ❌ Heavy glassmorphism on every surface
- ❌ Neon borders everywhere
- ❌ Generic card grids without hierarchy
- ❌ Centered title + 3 feature cards layout
- ❌ Random glowing blobs
- ❌ Gaming HUD aesthetics
- ❌ Unnecessary Three.js decoration unrelated to product state
- ❌ Emoji as icons (use inline SVG)
- ❌ Placeholder-only form labels
- ❌ Hover-only information
- ❌ Animation on every paragraph
- ❌ Infinite decorative animation loops
- ❌ Long cinematic delays before revealing content

## 16. Reduced Motion Behavior

When `prefers-reduced-motion: reduce` is detected:
- All CSS animations and transitions are set to 0.01ms duration
- Motion library animations are disabled via `MotionConfig` `reducedMotion="always"`
- 3D scenes render as static (no rotation, no particle movement)
- SceneFallback (2D SVG) is shown instead of 3D
- Page transitions are instant crossfades
- Hover animations are disabled
- Loading states use opacity-only pulses (no shimmer movement)
