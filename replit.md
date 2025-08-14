# Overview

This is a comprehensive warehouse pallet racking inspection and certification management system built to help organizations manage warehouse safety through systematic inspections, defect tracking, and automated reporting. The system provides an interactive warehouse layout editor, click-to-inspect workflow, severity-based color coding, and professional PDF report generation.

The platform serves two primary user roles: Inspectors who conduct inspections and mark defects, and Administrators who manage layouts, generate reports, and oversee the system. The system emphasizes visual interaction through canvas-based warehouse layout editing and real-time dashboard monitoring of urgent items.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Hybrid Architecture Pattern

The system uses a hybrid approach combining Django backend with React frontend, connected via a REST API. This pattern allows for Django's robust ORM and admin capabilities while providing a modern React-based user interface.

**Backend**: Django serves as the primary backend with PostgreSQL database, handling authentication, data processing, and PDF generation through WeasyPrint.

**Frontend**: React with TypeScript provides the user interface, using TanStack Query for state management and data fetching.

**Database**: Drizzle ORM with PostgreSQL handles data persistence, with schemas defined in TypeScript for type safety across the stack.

## Authentication & Authorization

The system implements Replit Auth for user authentication, with role-based access control distinguishing between Inspector and Administrator users. User profiles extend the base authentication to include role assignments and certification details.

Django Allauth provides additional authentication features including email verification and password reset capabilities.

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

Django's static file system handles backend assets and PDF generation resources.

# External Dependencies

## Database Services
- **PostgreSQL**: Primary database for all application data
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect

## Authentication Services  
- **Replit Auth**: Primary authentication provider
- **Django Allauth**: Extended authentication features (email verification, password reset)

## UI & Styling Libraries
- **Tailwind CSS v4**: Utility-first styling framework
- **Radix UI**: Accessible component primitives for React
- **Font Awesome**: Icon library (self-hosted, not CDN)
- **Konva.js**: Interactive 2D canvas library for warehouse layouts

## Development & Build Tools
- **Vite**: Frontend build tool and asset bundling
- **TypeScript**: Type safety across frontend and shared code
- **TanStack Query**: Data fetching and caching for React
- **Django**: Python web framework for backend API

## Document Generation
- **WeasyPrint**: Professional PDF report generation
- **Python Imaging Library (PIL)**: Image processing for reports

## Testing & Development
- **Jest/React Testing Library**: Frontend testing framework
- **Django Test Framework**: Backend testing capabilities
- **Hot Module Replacement**: Development experience optimization

The system is designed to be self-contained with minimal external service dependencies, focusing on reliability and performance through local asset management and robust caching strategies.