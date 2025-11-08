# CoCreate AI - Project Documentation

## Overview

CoCreate AI is a Human + AI Co-Creation Platform designed for collaborative work between users and AI in coding (Coder), creative visualization (Artist), and adaptive learning (Tutor). The platform provides a workspace-based environment with chat interfaces and diagram generation, preserving all interactions and context per workspace. It's a full-stack web application built with React, Express, PostgreSQL (Neon), and OpenAI integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:** React 18 with TypeScript, Vite for build and development.
**UI Component System:** Shadcn/ui (Radix UI primitives) with Tailwind CSS for utility-first styling, supporting light/dark modes and custom HSL-based color system.
**State Management:** TanStack Query for server state management, local React state for UI.
**Key Features:** Resizable panel layout (react-resizable-panels), real-time chat, Mermaid.js integration, persistent workspace states, and a Cross-Panel Synchronization System. The sync system enables the Coder panel to auto-generate diagrams, the Artist AI to use Coder context, and the Tutor AI to pull context from both Coder messages (last 5) and Artist diagrams (last 3) for seamless collaboration. In-app reminders are also integrated, with the Tutor AI proactively alerting users about upcoming reminders.

### Backend Architecture

**Server Framework:** Express.js with ESM, custom middleware for logging and JSON parsing.
**API Design:** RESTful API (`/api/*`) with routes organized by resource. Session-based authentication is intended with a PostgreSQL session store.
**Data Layer:** Interface-based storage design (IStorage) for flexible data persistence, UUID generation for entities.
**Development Setup:** Vite middleware integration for SSR during development.

### Data Storage Solutions

**Database Configuration:** PostgreSQL via Neon serverless driver, Drizzle ORM for type-safe queries and schema management.
**Schema Design:**
- **Users Table:** Stores user credentials (username, hashed password).
- **Workspaces Table:** Links to users, stores workspace name and JSONB for panel states, includes timestamps.
- **Messages Table:** Associated with workspaces and panel types (coder/artist/tutor), stores role and content for conversation history.
- **Diagrams Table:** Stores Artist-generated diagrams (prompt, Mermaid code), associated with workspaces.
- **Reminders Table:** Stores title, description, datetime, workspace association, and completion status.
**Migration Strategy:** Drizzle Kit for schema migrations.

### Authentication and Authorization

Currently uses a hardcoded "demo-user" ID. Planned architecture involves Flask-style session management using `connect-pg-simple` for a PostgreSQL session store.

## External Dependencies

**AI Services:**
- OpenRouter API (via OpenAI SDK) using `openai/gpt-4o-mini` for chat completions across all AI panels (Coder, Artist, Tutor).
- AI-powered analysis of Coder conversations for diagram auto-generation.

**UI Component Libraries:**
- Radix UI primitives for accessible components.
- Lucide React for iconography.
- `date-fns` for date formatting.
- `cmdk` for command palette components.
- Mermaid.js for diagram rendering.
- `ogl` for WebGL rendering of the Plasma background on the landing page.
- Framer Motion for animations.

**Development Tools:**
- TypeScript for type checking.
- ESBuild for production bundling.
- PostCSS with Autoprefixer.

**Database Infrastructure:**
- Neon serverless PostgreSQL.
- Drizzle ORM.

**Design System:**
- Google Fonts: Inter, JetBrains Mono, DM Sans, Fira Code, Geist Mono.
- Tailwind CSS with custom configuration.
- Custom CSS variables for theming.