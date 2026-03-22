# The Design System: Architectural Clarity & Editorial Depth

## 1. Overview & Creative North Star: "The Intelligent Curator"
This design system moves beyond the standard "educational dashboard" to create an environment that feels like a premium, high-end digital library. The **Creative North Star** is **"The Intelligent Curator"**—a system that values white space as a functional tool, uses typography to establish an authoritative hierarchy, and employs tonal layering to guide the user’s focus without the clutter of traditional UI borders.

To break the "template" look, we favor **intentional asymmetry**. For example, a lesson card might feature a large, offset display numeral, or a progress tracker might use an oversized, thin-stroke circular gauge that bleeds slightly off-screen. We reject the rigid grid in favor of a "layered paper" aesthetic, where content floats on distinct planes of depth.

---

## 2. Colors & Surface Philosophy
Our palette is rooted in stability (`primary`: `#003466`) and growth (`secondary`: `#006a6a`). We utilize a sophisticated Material 3 tonal scale to create a "monochromatic-plus" look that feels expensive and intentional.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To separate a "Lesson Module" from the "Course Background," do not use a 1px line. Instead, use a background shift:
*   **Base:** `surface` (#f8f9fa)
*   **Section:** `surface_container_low` (#f3f4f5)
*   **Active Card:** `surface_container_lowest` (#ffffff)

### Surface Hierarchy & Nesting
Treat the UI as a physical stack. Importance is signaled by "lifting" an element toward the user through lighter surface tokens:
1.  **Level 0 (Deepest):** `surface_dim` (used for background utility areas).
2.  **Level 1 (Standard):** `surface` (the primary canvas).
3.  **Level 2 (Inlay):** `surface_container` (for grouped content like a list of chapters).
4.  **Level 3 (Top):** `surface_container_highest` (for floating action elements or high-priority alerts).

### The "Glass & Gradient" Rule
To inject "soul" into the app, use **Glassmorphism** for navigation bars and floating headers.
*   **Effect:** Apply `surface` at 80% opacity with a `backdrop-blur` of 20px. 
*   **CTAs:** Use a subtle linear gradient for primary buttons, transitioning from `primary` (#003466) to `primary_container` (#1a4b84) at a 135-degree angle. This prevents the "flat-blue-box" syndrome.

---

## 3. Typography: The Editorial Scale
We pair **Manrope** (Display/Headlines) with **Inter** (Body/Labels) to balance character with extreme legibility.

*   **Display (Manrope):** Use `display-lg` (3.5rem) for milestone achievements (e.g., "Level 10 Reached"). Use tight letter-spacing (-0.02em) to maintain a premium feel.
*   **Headlines (Manrope):** `headline-md` (1.75rem) should be used for course titles. These are the "anchors" of your page.
*   **Body (Inter):** `body-md` (0.875rem) is the workhorse. Ensure a line height of at least 1.5x for educational content to reduce cognitive load during long reading sessions.
*   **Labels (Inter):** `label-md` (0.75rem) in `on_surface_variant` (#424750) should be used for metadata (e.g., "5 min read" or "Advanced Level").

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often a crutch for poor layout. In this system, depth is primarily achieved through color.

*   **The Layering Principle:** A `surface_container_lowest` card sitting on a `surface_container` background creates a "natural lift." 
*   **Ambient Shadows:** For high-elevation elements (like a "Start Quiz" FAB), use a shadow with a blur radius of `24px`, an offset of `Y: 8`, and a color of `on_surface` at **4% opacity**. It should feel like a soft glow, not a dark stain.
*   **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use `outline_variant` (#c3c6d1) at **15% opacity**. This creates a "whisper" of a line that defines space without interrupting the visual flow.

---

## 5. Components

### Buttons
*   **Primary:** Rounded `md` (0.75rem). Background: Primary-to-Container Gradient. Text: `on_primary` (#ffffff), `title-sm` (Inter, Bold).
*   **Secondary:** Rounded `md`. Background: `secondary_container` (#93efee). Text: `on_secondary_container` (#006e6e).
*   **Tertiary:** No background. Text: `primary`. Use for "Cancel" or "Skip" actions.

### Cards & Progress Lists
*   **The Rule:** Forbid divider lines. Use `spacing.4` (1rem) as a vertical gutter between list items.
*   **Structure:** Wrap items in a `surface_container_low` rounded box. If an item is "In Progress," transition its background to `secondary_fixed` (#96f2f1) to draw the eye.

### Input Fields
*   **Style:** Minimalist. No bottom line. Use a `surface_container_highest` background with a roundedness of `sm` (0.25rem). 
*   **Focus State:** Shift background to `primary_fixed` (#d5e3ff) and add a `2px` "Ghost Border" using the `primary` color at 30% opacity.

### Specialized Educational Components
*   **Code/Formula Blocks:** Use `inverse_surface` (#2e3132) with `on_surface_variant` for syntax highlighting. Apply a `xl` (1.5rem) corner radius to one corner only (top-right) to create a "signature" asymmetric look.
*   **Progress Micro-Banners:** Floating bars at the top of a lesson using `secondary` (#006a6a) with a glass effect to show growth without occupying permanent screen real estate.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical padding. A screen header might have `spacing.10` top padding and `spacing.6` side padding to create an editorial feel.
*   **Do** use `secondary_container` for "Success" states instead of a jarring bright green. It feels more integrated into the brand.
*   **Do** rely on `title-lg` typography to define sections rather than creating a new box for every piece of content.

### Don't:
*   **Don't** use 100% black (#000000) for text. Use `on_surface` (#191c1d) to maintain a soft, premium contrast.
*   **Don't** use a shadow on every card. If you have 10 cards in a list, shadows create "visual noise." Use tonal shifts instead.
*   **Don't** use a standard "X" for closing modals. Use a `label-md` "Close" or a custom icon with a `surface_variant` circular background for a tactile, high-end feel.