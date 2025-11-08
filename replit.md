# CoCreate AI - Project Documentation

## Overview

CoCreate AI is a Human + AI Co-Creation Platform that enables collaborative work between users and AI across three specialized domains: coding assistance (Coder), creative visualization (Artist), and adaptive learning (Tutor). The platform provides a workspace-based environment where users can interact with AI through chat interfaces and generate diagrams, with all interactions and context preserved per workspace.

The application is a full-stack web platform built with modern JavaScript technologies, featuring a React-based frontend, Express backend, PostgreSQL database via Neon, and OpenAI integration for AI capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (November 8, 2025)

**Sidebar UI Improvements**
- Moved collapse/expand button into sidebar header next to Fusion.AI logo for better accessibility
- Reduced Fusion.AI text size in sidebar to accommodate the collapse button
- Relocated ThemeToggle from sidebar to main header for consistent access

**Reminders System Bug Fixes**
- Fixed reminder creation error caused by empty workspaceId validation
- Updated mutation to properly filter out empty workspaceId values before sending to backend
- Improved form data handling to ensure clean payload submission

**Reminders System with Tutor Integration**
- Added complete in-app reminders feature with dedicated page for creating and managing reminders
- Database schema: New `reminders` table with title, description, datetime, workspace association, and completion status
- Backend API: Full CRUD operations (GET, POST, PATCH, DELETE) with user authentication
- Reminders page UI: Form to create reminders, categorized lists (upcoming, past due, completed)
- Navigation: "Reminders" button in workspace header for easy access
- Tutor AI integration: Automatically fetches upcoming reminders and includes them in conversation context to proactively alert users
- Visual indicators: Amber badge in Tutor panel header showing count of upcoming reminders
- Dynamic reminder display: Tutor panel shows up to 5 upcoming reminders with time-until information and past-due warnings
- In-app only: No external calendar integration required - all reminders are managed within Fusion.AI

**Font Update**
- Changed "Fusion.AI" logo font to "Press Start 2P" pixel font style for retro gaming aesthetic

**Previous Updates**

**Message Deletion Feature**
- Added ability to delete messages from Coder and Tutor panels
- Delete button appears on hover over user messages (small red trash icon in top-right corner)
- Deletes both the user message and its corresponding AI reply in a single action
- Backend: New DELETE /api/messages/:messageId endpoint with workspace ownership verification
- Frontend: Integrated delete mutations with toast notifications for success/error feedback
- Proper cache invalidation ensures UI updates immediately after deletion

**Mermaid Diagram Rendering Fix**
- Implemented comprehensive syntax-aware extraction to handle AI-generated Mermaid code with markdown fences and commentary
- Added `fixMermaidSyntax()` helper with pattern matching for ALL major Mermaid diagram types:
  - flowchart, sequence, class, state (full support)
  - gitGraph (commit, branch, merge, checkout, tag, etc.)
  - gantt (dateFormat, tasks, resources, markers)
  - journey (steps with scores)
  - timeline (year/event rows, sections)
  - Plus: er, pie, mindmap, quadrantChart, requirementDiagram, zenuml, sankey
- Automatically removes markdown code fences (```mermaid ... ```) from AI output
- Stops extraction at first non-Mermaid line to prevent rendering errors
- Fixes unquoted node labels containing spaces

**Tutor Panel Context Awareness**
- Added visual badges in Tutor panel header showing cross-panel context:
  - Code2 icon badge displays count of recent Coder messages (last 5)
  - Sparkles icon badge displays count of recent Artist diagrams (last 3)
- Helps users understand when Tutor has contextual information from other panels

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type safety and component-based architecture
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing (landing page, workspace, 404)

**UI Component System**
- Shadcn/ui component library built on Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling with custom design tokens
- Theme system supporting light/dark modes with CSS variables
- Custom color system using HSL values for consistent theming across components

**State Management**
- TanStack Query (React Query) for server state management, caching, and data synchronization
- Local React state for UI-specific concerns
- Query client configured with infinite stale time and disabled auto-refetching for explicit control

**Key Features**
- Resizable panel layout for the three AI panels (Coder, Artist, Tutor) using react-resizable-panels
- Real-time chat interfaces for each panel with message history
- Mermaid.js integration for rendering diagrams generated by the Artist panel
- Workspace management with persistent panel states stored in database
- **Cross-Panel Synchronization System** (November 2025):
  - Sync button in Coder panel auto-generates diagrams from coding conversations
  - Artist AI includes context from Coder panel for contextually-aware diagram generation
  - Tutor AI pulls context from both Coder messages (last 5) and Artist diagrams (last 3)
  - All three panels share workspace context seamlessly for intelligent collaboration

### Backend Architecture

**Server Framework**
- Express.js as the HTTP server
- ESM (ES Modules) throughout the codebase for modern JavaScript syntax
- Custom middleware for request logging and JSON body parsing with raw body preservation

**API Design**
- RESTful API structure with `/api/*` prefix
- Routes organized by resource: workspaces, messages, diagrams, AI endpoints
- Session-based authentication with PostgreSQL session store
- Cross-panel sync endpoints: `/api/ai/sync-to-artist` for intelligent diagram generation from code discussions

**Data Layer**
- In-memory storage implementation (MemStorage class) for development
- Interface-based storage design (IStorage) for easy swapping to database implementation
- UUID generation for all entities

**Development Setup**
- Vite middleware integration for SSR during development
- Development-only plugins: runtime error overlay, cartographer, dev banner
- Production builds bundle both frontend and backend separately

### Data Storage Solutions

**Database Configuration**
- PostgreSQL via Neon serverless driver with WebSocket support
- Drizzle ORM for type-safe database queries and schema management
- Schema-first approach with Zod validation schemas generated from Drizzle tables

**Schema Design**

*Users Table*
- Stores user credentials (username, hashed password)
- UUID primary keys generated by PostgreSQL

*Workspaces Table*
- Belongs to a user, stores workspace name
- JSONB field for panel states (which panels are open/closed)
- Timestamps for creation and last update

*Messages Table*
- Belongs to a workspace and specific panel type (coder/artist/tutor)
- Stores role (user/assistant) and content
- Enables conversation history and context retention per panel

*Diagrams Table*
- Stores Artist panel generated diagrams
- Includes original prompt and generated Mermaid code
- Associated with workspace for context preservation

**Migration Strategy**
- Drizzle Kit for schema migrations
- Migrations stored in `/migrations` directory
- Push-based workflow for development (`db:push` script)

### Authentication and Authorization

**Current State**
- Hardcoded "demo-user" ID throughout the application
- Password field exists in users schema but no hashing/validation implemented
- No session management or JWT tokens

**Planned Architecture** (based on dependencies)
- Flask-style session management using connect-pg-simple for PostgreSQL session store
- Intended to use either Flask-JWT or Flask-Login patterns (though this is a Node.js app, suggesting Flask was the original plan that shifted)

### External Dependencies

**AI Services**
- OpenRouter API (via OpenAI SDK) for chat completions across all AI panels
- Model: `openai/gpt-4o-mini` for cost-effective, fast responses
- Coder panel: Programming assistance with conversation history
- Artist panel: Mermaid diagram generation from prompts with optional Coder context integration
- Tutor panel: Personalized learning with cross-panel awareness (reads Coder messages and Artist diagrams)
- Sync system: AI-powered analysis of Coder conversations to auto-generate relevant diagrams

**UI Component Libraries**
- Radix UI primitives: 20+ component primitives for accessibility and unstyled foundations
- Lucide React for iconography (consistent icon set throughout)
- date-fns for date formatting and manipulation
- cmdk for command palette components
- Mermaid.js for diagram rendering in the browser

**Development Tools**
- Replit-specific plugins for development environment integration
- TypeScript for type checking across the entire codebase
- ESBuild for production bundling of the server
- PostCSS with Autoprefixer for CSS processing

**Database Infrastructure**
- Neon serverless PostgreSQL (configured via DATABASE_URL environment variable)
- WebSocket support for serverless database connections
- Drizzle ORM with PostgreSQL dialect

**Design System**
- Google Fonts: Inter (primary), JetBrains Mono (code), DM Sans, Fira Code, Geist Mono
- Tailwind CSS with custom configuration extending Shadcn's New York theme
- Custom CSS variables for theming with HSL color space
- Design guidelines documented separately for consistent visual language