---
name: Precision Analytics
colors:
  surface: '#f9f9ff'
  surface-dim: '#d8d9e3'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3fd'
  surface-container: '#ecedf7'
  surface-container-high: '#e6e7f2'
  surface-container-highest: '#e1e2ec'
  on-surface: '#191b23'
  on-surface-variant: '#424754'
  inverse-surface: '#2e3038'
  inverse-on-surface: '#eff0fa'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#585f6c'
  on-secondary: '#ffffff'
  secondary-container: '#dce2f3'
  on-secondary-container: '#5e6572'
  tertiary: '#924700'
  on-tertiary: '#ffffff'
  tertiary-container: '#b75b00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#dce2f3'
  secondary-fixed-dim: '#c0c7d6'
  on-secondary-fixed: '#151c27'
  on-secondary-fixed-variant: '#404754'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#f9f9ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ec'
typography:
  h1:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '450'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  container-margin: 32px
---

## Brand & Style

The design system is rooted in **Minimalism** and **Modern Corporate** aesthetics, specifically tailored for data-dense environments. The brand personality is clinical, efficient, and unobtrusive, ensuring that the user's data remains the primary focus. 

The UI evokes a sense of "quiet intelligence"—it does not compete for attention but provides a highly organized framework for complex information. By utilizing generous whitespace and a strict 1px border language, the system achieves clarity without the visual weight of heavy shadows or decorative elements. The target audience consists of analysts and engineers who value speed, density, and precision over visual flair.

## Colors

This design system utilizes a high-clarity light mode palette. The foundation relies on neutral grays to establish hierarchy, while the primary blue (#3B82F6) is reserved for interactive elements and key indicators. 

- **Surface Strategy:** Use the Background color for the main application canvas and Surface (#FFFFFF) for cards and containers to create a subtle lift.
- **Data Feedback:** Success, Warning, and Error colors should be used sparingly—only for status indicators, validation, or critical data points.
- **Code Syntax:** The dark code area provides a high-contrast environment for technical data, distinguishing logic from the surrounding UI.

## Typography

The typographic system prioritizes legibility and utility. **Inter** handles all UI labels, navigation, and editorial content, utilizing its neutral character to keep the interface clean. 

**JetBrains Mono** is mandatory for all tabular data, metrics, and code blocks to ensure vertical alignment of digits and characters, which is critical for scanning data columns. Use `label-caps` for table headers and section overviews to create a distinct visual break from body content.

## Layout & Spacing

The design system employs a **Fixed Grid** model for analytical dashboards to maintain predictable data density, while using a **Fluid Grid** for content-heavy internal pages. 

- **Grid:** Use a 12-column system with 20px gutters.
- **Rhythm:** All margins and paddings must be multiples of 4px.
- **Density:** Standard vertical spacing between stacked cards is 24px (lg), while internal card padding should remain at 16px (md) to keep elements compact.

## Elevation & Depth

In this design system, depth is communicated through **Low-contrast outlines** rather than shadows. 

- **Level 0 (Background):** #F7F8FA.
- **Level 1 (Surface/Cards):** #FFFFFF with a 1px border of #E5E7EB.
- **Level 2 (Popovers/Modals):** #FFFFFF with a 1px border and a very subtle 4px blur shadow at 5% opacity to provide separation from the primary surface.
- **Interactive States:** Use "Subtle Surface" (#F1F3F5) to indicate hover states on list items or buttons instead of using elevation shifts.

## Shapes

The shape language is "Soft," utilizing a 4px to 6px corner radius. This provides a modern, approachable feel without appearing overly casual or "bubbly."

- **Standard Elements:** 4px (inputs, buttons, small cards).
- **Large Containers:** 6px (main dashboard widgets, modals).
- **Strictness:** Do not use pill-shaped elements for buttons; keep the 4px radius consistent to reinforce the systematic, architectural feel of the data.

## Components

- **Buttons:** Primary buttons use #3B82F6 with white text. Ghost buttons use #111827 text with a #E5E7EB border. All buttons have a 4px radius.
- **Input Fields:** 1px border (#E5E7EB) with a 4px radius. On focus, the border changes to Primary Blue with a 1px solid ring.
- **Data Tables:** Headers use `label-caps` in Secondary Text. Rows should use a subtle 1px bottom border rather than zebra striping to keep the look clean.
- **Chips:** Small, 2px radius or 12px pill (exception for tags), using Subtle Surface (#F1F3F5) and Secondary Text.
- **Cards:** White background, 1px border, 6px radius. No shadow. Titles should be H3.
- **Code Blocks:** Use #0F172A background with 4px radius. Ensure JetBrains Mono is used for all content within these blocks.