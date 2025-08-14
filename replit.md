# Overview

This is a comprehensive warehouse pallet racking inspection and certification management system built to help organizations manage warehouse safety through systematic inspections, defect tracking, and automated reporting. The system provides an interactive warehouse layout editor, click-to-inspect workflow, severity-based color coding, and professional PDF report generation.

The platform serves two primary user roles: Inspectors who conduct inspections and mark defects, and Administrators who manage layouts, generate reports, and oversee the system. The system emphasizes visual interaction through canvas-based warehouse layout editing and real-time dashboard monitoring of urgent items.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Modern Full-Stack Architecture

The system uses a modern full-stack JavaScript architecture with Express.js backend and React frontend, providing a cohesive development experience.

**Backend**: Express.js serves as the REST API backend with PostgreSQL database, handling authentication via Replit Auth, data processing, and API endpoints.

**Frontend**: React with TypeScript provides the user interface, using TanStack Query for state management and data fetching, Vite for bundling.

**Database**: Drizzle ORM with PostgreSQL handles data persistence, with schemas defined in TypeScript for type safety across the stack.

## Authentication & Authorization

The system implements Replit Auth for user authentication, with role-based access control distinguishing between Inspector and Administrator users. User profiles extend the base authentication to include role assignments and certification details.

Express sessions with PostgreSQL storage provide secure session management and user state persistence.

## Interactive Canvas System

The warehouse layout editor uses Konva.js for interactive canvas manipulation, allowing users to draw and edit warehouse components directly on screen. Components are stored with position coordinates and rendered dynamically.

For inspections, the same canvas system enables click-to-inspect functionality where users can select components and immediately create inspection records with severity classifications.

## Real-time Dashboard

The dashboard provides live monitoring of warehouse status with automatic color coding:
- **Red**: Immediate threats requiring instant attention
- **Amber**: Issues requiring fixes within 4 weeks  
- **Green**: Components that only need monitoring

Statistics update automatically and urgent items are prominently displayed with notification badges.

## Report Generation Architecture

Professional PDF reports are generated server-side using WeasyPrint, with customizable templates that can include:
- Warehouse layout diagrams
- Inspection photos and details
- Inspector information and certifications
- Compliance summaries and recommendations

Reports can be filtered by date ranges and include various detail levels from summary views to comprehensive defect listings.

## Asset Management

The system uses Vite for frontend asset bundling and optimization. Static assets including fonts (Font Awesome) and styles (Tailwind CSS) are processed locally rather than relying on CDNs for better performance and reliability.

Express.js serves static files and handles asset delivery through Vite in development mode.

# External Dependencies

## Database Services
- **PostgreSQL**: Primary database for all application data
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect

## Authentication Services  
- **Replit Auth**: Primary authentication provider
- **Express Sessions**: Secure session management with PostgreSQL storage

## UI & Styling Libraries
- **Tailwind CSS v4**: Utility-first styling framework
- **Radix UI**: Accessible component primitives for React
- **Font Awesome**: Icon library (self-hosted, not CDN)
- **Konva.js**: Interactive 2D canvas library for warehouse layouts

## Development & Build Tools
- **Vite**: Frontend build tool and asset bundling
- **TypeScript**: Type safety across frontend and shared code
- **TanStack Query**: Data fetching and caching for React
- **Express.js**: Node.js web framework for backend API

## Document Generation
- **WeasyPrint**: Professional PDF report generation
- **Python Imaging Library (PIL)**: Image processing for reports

## Testing & Development
- **Jest/React Testing Library**: Frontend testing framework
- **Node.js Testing**: Backend testing with standard Node.js testing frameworks
- **Hot Module Replacement**: Development experience optimization

The system is designed to be self-contained with minimal external service dependencies, focusing on reliability and performance through local asset management and robust caching strategies.