---
name: Obsidian Ethereal
colors:
  surface: '#13131a'
  surface-dim: '#13131a'
  surface-bright: '#393840'
  surface-container-lowest: '#0e0e15'
  surface-container-low: '#1b1b22'
  surface-container: '#1f1f26'
  surface-container-high: '#2a2931'
  surface-container-highest: '#34343c'
  on-surface: '#e4e1ec'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#e4e1ec'
  inverse-on-surface: '#303038'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ddb7ff'
  on-tertiary: '#490080'
  tertiary-container: '#8d36db'
  on-tertiary-container: '#f2dfff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#f0dbff'
  tertiary-fixed-dim: '#ddb7ff'
  on-tertiary-fixed: '#2c0051'
  on-tertiary-fixed-variant: '#6900b3'
  background: '#13131a'
  on-background: '#e4e1ec'
  surface-variant: '#34343c'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base-unit: 4px
  gutter-desktop: 24px
  margin-desktop: 48px
  gutter-mobile: 16px
  margin-mobile: 20px
  sidebar-width: 280px
  sidebar-collapsed-width: 80px
---

## Brand & Style

The design system is engineered for a high-tech, creative marketplace where visual performance and artistic expression intersect. The brand personality is "Techno-Sophisticate"—combining the precision of developer tools with the vibrant, community-driven energy of a digital art gallery.

The aesthetic leans heavily into **Glassmorphism** and **Modern Minimalism**. By utilizing deep, light-absorbing backgrounds contrasted with luminous, translucent surfaces, the UI creates a sense of infinite depth. This "Layered Void" approach ensures that the vibrant OBS overlay previews remain the focal point, while the interface provides a premium, non-intrusive framework for discovery.

## Colors

The palette is designed for deep immersion and high-contrast legibility. 

- **Base:** The core background is a deep navy-black (#0D0D14), providing a canvas that minimizes eye strain during long browsing sessions.
- **Brand:** Primary Violet (#7C3AED) signifies creativity and luxury. It is used for primary actions and active states.
- **Accent:** Cyan (#06B6D4) provides a high-energy "glow" effect, used sparingly for secondary highlights and interactive feedback.
- **Glass Surfaces:** Elements use varying degrees of transparency rather than flat colors to maintain the "Ethereal" depth.

## Typography

This design system utilizes **Inter** exclusively to lean into its systematic, utilitarian nature. To prevent a purely corporate feel, we use tight letter-spacing on headlines and generous line heights for body text.

Headlines should utilize a "semibold" to "bold" weight to stand out against visual-heavy backgrounds. Secondary labels use all-caps sparingly with tracking to denote metadata (e.g., "FREE", "PREMIUM", "INSTALLED").

## Layout & Spacing

The layout follows a **Fluid Masonry Grid** logic. Content density is prioritized, allowing for a Pinterest-style browsing experience where card heights vary based on their preview aspect ratios.

- **Desktop:** A 12-column system with a persistent or collapsible sidebar on the left. Margins are generous (48px) to allow the glass effects to breathe.
- **Tablet:** 8-column system. The sidebar collapses into a rail.
- **Mobile:** 2-column masonry grid. 16px gutters to maximize screen real estate for visuals.
- **Rhythm:** All spacing (padding, margins) must be a multiple of the 4px base unit.

## Elevation & Depth

Depth is achieved through **Backdrop Filtering** and **Tonal Stacking** rather than traditional drop shadows.

- **Level 0 (Base):** Deep Navy-Black (#0D0D14).
- **Level 1 (Glass Surface):** White with 3% opacity and a 12px Backdrop Blur. A subtle 1px inner border (8% white) creates a "light-catching" edge.
- **Level 2 (Active/Hover):** White with 6% opacity and an 18px Backdrop Blur. 
- **Floating Elements:** Modals and tooltips utilize a Primary Violet glow (low opacity, 40px radius) to simulate a light source behind the glass.

## Shapes

The design system uses a "Rounded" philosophy to soften the high-tech aesthetic and make it feel more approachable and community-driven.

- **Standard Elements:** 0.5rem (8px) for input fields and small cards.
- **Large Components:** 1rem (16px) for main masonry cards and container sections.
- **Pills/Chips:** Fully rounded (999px) for category tags and filter buttons.

## Components

### Buttons
- **Primary:** Linear gradient (45deg) from Primary Violet to Tertiary Purple. No border. Text is white.
- **Glass/Ghost:** Transparent background with 1px border (#ffffff 10%) and 12px backdrop blur. On hover, background opacity increases.

### Masonry Cards
- **Container:** Glass surface (Level 1). No visible shadow.
- **Interaction:** On hover, the 1px border changes to Primary Violet, and the image preview scales slightly (1.05x).
- **Metadata:** Author name and price are displayed at the bottom of the card on a semi-transparent black gradient overlay.

### Filter Chips
- **Default:** Transparent with a subtle grey border.
- **Active:** Cyan background with dark text (#0D0D14). Use a cyan "outer glow" shadow (0 0 10px rgba(6, 182, 212, 0.3)).

### Search Bar
- **Style:** Full-width glass container with an "inner-glow" shadow to simulate a recessed physical area. 
- **Icon:** Cyan stroke icons for high visibility.

### Sidebar
- **Behavior:** Collapsible to a rail. Uses a "frosted" sidebar background that spans the full height of the viewport. Navigation items use a vertical violet bar on the left to indicate the active state.