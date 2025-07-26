# Magic UI Design System Documentation

## Overview

Magic UI is a custom design system built for Claude Pause that emphasizes gradient-based aesthetics, glass morphism, and smooth animations. It creates a premium, futuristic interface with a cohesive dark theme.

## Design Principles

1. **Gradient-First**: Use gradients for visual interest
2. **Glass Morphism**: Translucent surfaces with blur
3. **Smooth Motion**: Fluid animations and transitions
4. **Dark Excellence**: Optimized for dark environments
5. **Spatial Depth**: Layered shadows and elevations

## Color System

### Base Colors
```css
:root {
  /* Dark Theme Colors */
  --magic-bg-primary: #0f172a;      /* Deepest background */
  --magic-bg-secondary: #1e293b;    /* Elevated surfaces */
  --magic-bg-tertiary: #334155;     /* Higher elevation */
  --magic-bg-elevated: rgba(30, 41, 59, 0.95);
  
  /* Text Colors */
  --magic-text-primary: #f1f5f9;    /* Main text */
  --magic-text-secondary: #94a3b8;  /* Secondary text */
  --magic-text-tertiary: #64748b;   /* Muted text */
}
```

### Accent Colors
```css
:root {
  --magic-accent-blue: #60a5fa;     /* Primary action */
  --magic-accent-purple: #a78bfa;   /* Secondary action */
  --magic-accent-pink: #f472b6;     /* Tertiary accent */
  --magic-accent-orange: #fb923c;   /* Warning */
  --magic-accent-green: #34d399;    /* Success */
}
```

### Gradient Definitions
```css
:root {
  --magic-gradient-primary: linear-gradient(135deg, #60a5fa, #a78bfa);
  --magic-gradient-accent: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
  --magic-gradient-success: linear-gradient(135deg, #10b981, #34d399);
  --magic-gradient-danger: linear-gradient(135deg, #ef4444, #dc2626);
  --magic-gradient-warning: linear-gradient(135deg, #f59e0b, #d97706);
}
```

## Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### Font Sizes
```css
.text-xs    { font-size: 12px; }
.text-sm    { font-size: 14px; }
.text-base  { font-size: 16px; }
.text-lg    { font-size: 18px; }
.text-xl    { font-size: 20px; }
.text-2xl   { font-size: 24px; }
.text-3xl   { font-size: 28px; }
```

### Font Weights
```css
.font-normal   { font-weight: 400; }
.font-medium   { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold     { font-weight: 700; }
.font-extrabold{ font-weight: 800; }
```

## Component Patterns

### 1. Glass Morphism Card
```css
.glass-card {
  background: linear-gradient(135deg, 
    rgba(30, 41, 59, 0.8), 
    rgba(51, 65, 85, 0.6)
  );
  backdrop-filter: blur(20px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  box-shadow: 
    0 20px 50px -10px rgba(0, 0, 0, 0.8),
    inset 0 2px 4px rgba(255, 255, 255, 0.04);
}
```

### 2. Animated Gradient Border
```css
.magic-border {
  position: relative;
}

.magic-border::before {
  content: '';
  position: absolute;
  inset: -3px;
  background: conic-gradient(
    from var(--gradient-angle, 0deg),
    #3b82f6, #8b5cf6, #ec4899, #f59e0b, #10b981, #3b82f6
  );
  border-radius: 20px;
  animation: borderRotate 8s linear infinite;
}

@keyframes borderRotate {
  to { --gradient-angle: 360deg; }
}
```

### 3. Hover Effects
```css
.magic-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.magic-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(96, 165, 250, 0.3);
}
```

### 4. Glow Effects
```css
.magic-glow {
  box-shadow: 
    0 0 20px rgba(96, 165, 250, 0.5),
    0 0 40px rgba(96, 165, 250, 0.3),
    0 0 60px rgba(96, 165, 250, 0.1);
}
```

## Animation System

### Timing Functions
```css
--magic-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-bounce: cubic-bezier(0.87, -0.41, 0.19, 1.44);
```

### Standard Animations

#### 1. Fade In
```css
@keyframes fadeIn {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### 2. Pulse
```css
@keyframes pulse {
  0%, 100% { 
    transform: scale(1);
    opacity: 1;
  }
  50% { 
    transform: scale(1.05);
    opacity: 0.8;
  }
}
```

#### 3. Float
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

## Layout Patterns

### 1. Grid System
```css
.magic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.magic-grid-2col {
  grid-template-columns: 1fr 1fr;
}
```

### 2. Flex Utilities
```css
.magic-flex { display: flex; }
.magic-flex-center { 
  display: flex;
  align-items: center;
  justify-content: center;
}
.magic-flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

### 3. Spacing System
```css
/* Padding/Margin scale */
.p-1 { padding: 4px; }
.p-2 { padding: 8px; }
.p-3 { padding: 12px; }
.p-4 { padding: 16px; }
.p-5 { padding: 20px; }
.p-6 { padding: 24px; }
.p-8 { padding: 32px; }
```

## Shadow System

```css
--magic-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
--magic-shadow-md: 0 8px 24px rgba(0, 0, 0, 0.3);
--magic-shadow-lg: 0 20px 50px rgba(0, 0, 0, 0.4);
--magic-shadow-glow: 0 0 30px rgba(96, 165, 250, 0.3);
```

## Special Effects

### 1. Particle Background
```css
.particle-overlay {
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 2%),
    radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.3) 0%, transparent 2%);
  background-size: 200px 200px;
  animation: particleFloat 30s linear infinite;
}
```

### 2. Aurora Effect
```css
.aurora-gradient {
  background: radial-gradient(
    ellipse at top left, 
    var(--magic-accent-blue) 0%, 
    transparent 50%
  );
  filter: blur(60px);
  opacity: 0.4;
  animation: auroraShift 15s ease-in-out infinite;
}
```

### 3. Gradient Text
```css
.gradient-text {
  background: var(--magic-gradient-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

## Component Styling

### Dialog Structure
```scss
.magic-dialog {
  // Container
  .magic-dialog-border { /* Animated border */ }
  .magic-dialog-bg { /* Glass background */ }
  .magic-dialog-content { /* Content wrapper */ }
  
  // Header
  .magic-dialog-header { }
  .magic-dialog-title { /* Gradient text */ }
  
  // Body
  .magic-dialog-body { }
  
  // Actions
  .magic-dialog-actions { /* Button group */ }
}
```

### Button Variants
```css
.magic-button {
  /* Base styles */
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 600;
  text-transform: uppercase;
  transition: var(--magic-transition);
}

.magic-button-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 10px 30px -10px rgba(59, 130, 246, 0.5);
}

.magic-button-secondary {
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.9), rgba(71, 85, 105, 0.8));
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.magic-button-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 10px 30px -10px rgba(239, 68, 68, 0.5);
}
```

## Responsive Design

### Breakpoints
```css
/* Mobile */
@media (max-width: 640px) { }

/* Tablet */
@media (max-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large Desktop */
@media (min-width: 1280px) { }
```

### Responsive Patterns
```css
/* Stack on mobile */
@media (max-width: 768px) {
  .magic-grid-2col {
    grid-template-columns: 1fr;
  }
  
  .magic-dialog-content {
    padding: 20px;
  }
}
```

## Performance Guidelines

1. **Use CSS Variables**: For dynamic theming
2. **GPU Acceleration**: Transform and opacity only
3. **Will-Change**: For heavy animations
4. **Reduce Paint**: Avoid animating layout properties
5. **Optimize Gradients**: Use simple gradients for performance

## Accessibility

1. **Color Contrast**: Maintain WCAG AA standards
2. **Focus Indicators**: Visible focus states
3. **Motion Preference**: Respect reduced motion
4. **Semantic HTML**: Use proper elements
5. **ARIA Labels**: For decorative elements

## Best Practices

1. **Consistency**: Use design tokens
2. **Simplicity**: Don't overuse effects
3. **Performance**: Profile animations
4. **Maintainability**: Document custom styles
5. **Flexibility**: Design for extensibility

## Custom Scrollbars

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #60a5fa, #a78bfa);
  border-radius: 4px;
}
```

## Future Enhancements

1. **CSS Custom Properties**: More dynamic theming
2. **Dark/Light Mode**: Theme switching
3. **Color Schemes**: User-selectable palettes
4. **Animation Library**: Reusable keyframes
5. **Component Library**: Standalone package