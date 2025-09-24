# Afyonlu Todo - Task Management Application

## Overview

A full-stack task management application built with React, Express, and TypeScript. The application features a modern Turkish interface for managing tasks with categories, priorities, and mood tracking. It uses a clean architecture with shared schema validation between frontend and backend, implementing both task management and user mood logging functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming, supporting both light and dark modes
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Framework**: Express.js with TypeScript for the REST API server
- **Data Storage**: In-memory storage implementation with interface for future database integration
- **Schema Validation**: Shared Zod schemas between frontend and backend for type safety
- **Development**: Hot module replacement with Vite integration for seamless development experience

### Data Storage Solutions
- **Current**: In-memory storage using Map data structures for tasks and moods
- **Configured**: Drizzle ORM with PostgreSQL support (Neon Database) ready for production deployment
- **Schema**: Centralized schema definitions in shared directory with Drizzle table definitions

### Authentication and Authorization
- **Current**: Hardcoded user ("Berat") for demonstration purposes
- **Session Management**: Express session configuration present but not actively used
- **Future Ready**: Infrastructure in place for proper authentication implementation

### External Dependencies
- **Database**: Neon Database (PostgreSQL) configured via Drizzle ORM
- **UI Components**: Radix UI for accessible component primitives
- **Development Tools**: Replit-specific plugins for development environment integration
- **Build Tools**: ESBuild for fast server bundling, Vite for client bundling
- **Validation**: Zod for runtime type checking and schema validation
- **Date Handling**: date-fns for date manipulation and formatting

### Key Design Patterns
- **Monorepo Structure**: Client, server, and shared code in single repository
- **Type Safety**: End-to-end TypeScript with shared interfaces and schemas
- **Component Architecture**: Atomic design with reusable UI components
- **API Design**: RESTful endpoints with consistent error handling and validation
- **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints
- **Theme System**: CSS custom properties for consistent theming across light/dark modes

### Development Features
- **Hot Reload**: Integrated Vite development server with Express
- **Path Aliases**: Configured import aliases for clean module resolution
- **Error Handling**: Runtime error overlays and comprehensive error boundaries
- **Code Quality**: TypeScript strict mode with comprehensive type checking