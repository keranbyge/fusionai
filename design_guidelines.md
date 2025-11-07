# CoCreate AI - Design Guidelines

## Design Approach
**Hybrid Strategy**: Productivity-focused workspace inspired by Linear, Notion, and VS Code, combined with an impactful landing page drawing from modern AI tool aesthetics (Vercel, Midjourney, Runway).

## Typography
- **Primary Font**: Inter (Google Fonts) - clean, modern sans-serif
- **Code Font**: JetBrains Mono - for code snippets and technical content
- **Hierarchy**:
  - Hero Headlines: text-5xl to text-7xl, font-bold
  - Section Headers: text-3xl to text-4xl, font-semibold
  - Body Text: text-base to text-lg, font-normal
  - UI Labels: text-sm, font-medium
  - Code/Technical: text-sm, font-mono

## Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, and 16 for consistent rhythm
- Component padding: p-4, p-6, p-8
- Section spacing: py-12, py-16, py-20
- Element gaps: gap-4, gap-6, gap-8

## Landing Page Structure

**Hero Section** (90vh):
- Full-width hero with gradient mesh background image
- Centered headline: "CoCreate AI – Build with AI, not just for AI"
- Subheadline emphasizing collaboration (text-xl)
- Dual CTAs: "Get Started Free" (primary) + "Watch Demo" (secondary with blurred background)
- Trust indicator: "Join 10,000+ creators building together"

**Feature Showcase** (3-column grid on desktop):
- Icon + Title + Description cards for Coder, Artist, and Tutor
- Each card: p-6, rounded-2xl, with subtle border
- Icons from Heroicons (code, sparkles, academic-cap)

**How It Works** (alternating 2-column sections):
- Left: Feature description, Right: Screenshot/diagram mockup
- Sections for Workspace Dashboard, AI Collaboration, Memory & Context
- Each section: py-16 spacing between

**Social Proof**:
- 3-column testimonial cards with user avatars
- Quote text + name + role format

**Final CTA Section**:
- Centered, generous vertical padding (py-20)
- Primary CTA button + "No credit card required" subtext

## Workspace Dashboard

**Layout Structure**:
- Fixed left sidebar (w-64): workspace list + controls
- Main area: three-panel layout with dynamic resizing
- Each panel occupies equal width initially, adjustable via drag handles

**Sidebar Design**:
- Workspace list items: p-3, rounded-lg on hover
- "+ New Workspace" button at top: primary style, full-width
- Active workspace: slightly elevated background
- Each workspace shows: title + last modified timestamp (text-xs)

**Panel Architecture**:
Each panel (Coder, Artist, Tutor) includes:
- Header bar (h-12): panel title + controls (minimize, maximize, close icons)
- Chat/content area: flex-1, scrollable
- Input area: fixed bottom, p-4 with border-top

**Chat Interface**:
- Messages: max-w-3xl centered within panel
- User messages: right-aligned, rounded-2xl, px-4 py-3
- AI messages: left-aligned, rounded-2xl, px-4 py-3
- Message spacing: space-y-4
- Code blocks: rounded-lg with syntax highlighting indication
- Voice input button: positioned in input area

**Artist Panel Specifics**:
- Diagram canvas: full-width within panel
- Mermaid.js renders fill available space
- Diagram controls: top-right corner (download, zoom, reset)

**Resizable Panel Behavior**:
- Drag handles: w-1, cursor-col-resize, positioned between panels
- Minimum panel width: 320px
- Panels collapse to icon-only sidebar when minimized
- Maximized panel takes full main area width

## Component Library

**Buttons**:
- Primary: px-6 py-3, rounded-full, font-semibold
- Secondary: px-6 py-3, rounded-full, border-2, font-semibold
- Icon buttons: p-2, rounded-lg
- Buttons on images: backdrop-blur-md with semi-transparent background

**Input Fields**:
- Text inputs: px-4 py-3, rounded-lg, border, focus ring
- Chat input: px-4 py-3, rounded-2xl, with send button integrated
- Voice button: rounded-full icon button within input

**Cards**:
- Feature cards: p-6, rounded-2xl, border, hover shadow transition
- Workspace cards: p-4, rounded-xl
- Message bubbles: px-4 py-3, rounded-2xl

**Icons**: Heroicons via CDN, size-5 for UI elements, size-6 for feature showcases

## Animations
**Minimal & Purposeful**:
- Panel resize: smooth transition (transition-all duration-200)
- Message appearance: subtle fade-in
- Button hover: gentle scale (scale-105)
- NO scroll-triggered animations, NO complex keyframes

## Images
**Hero Section**: Abstract AI collaboration visualization - flowing nodes connecting human and AI elements, vibrant gradient mesh (teal to purple spectrum)

**How It Works Sections**:
1. Workspace dashboard screenshot showing three-panel layout
2. AI code generation in action - before/after code comparison
3. Mermaid diagram rendering - flowchart example

**Testimonial Section**: 3 user avatar placeholder images (circular, size-12)

## Accessibility
- Focus indicators on all interactive elements (ring-2)
- Sufficient contrast ratios throughout
- Keyboard navigation for panel resizing and controls
- ARIA labels for icon-only buttons
- Screen reader announcements for AI message arrivals

## Key Design Principles
1. **Clarity Over Decoration**: Workspace prioritizes readability and function
2. **Spatial Hierarchy**: Clear delineation between sidebar, panels, and controls
3. **Responsive Breathing**: Generous padding prevents cramped interfaces
4. **Contextual Awareness**: Visual cues show active workspace and panel states
5. **Progressive Disclosure**: Collapsed panels maintain accessibility without clutter