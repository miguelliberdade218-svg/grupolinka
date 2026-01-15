# replit.md

## Overview

Link-A is a comprehensive multi-service marketplace platform for Mozambique, built with React/TypeScript frontend and Express backend. The platform connects users with transportation services (rides), accommodations (hotels/stays), events, and partnerships. It features a dual-role authentication system using Firebase Auth, allowing users to have multiple roles (client, driver, hotel_manager, admin) with secure role-based access control.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Components**: Shadcn/ui with Radix UI primitives and Tailwind CSS
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: Firebase Auth with custom role management hooks
- **Build Tool**: Vite with code splitting and optimized chunks for vendor libraries

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Firebase Admin SDK for token verification
- **Storage**: Google Cloud Storage for file uploads (documents, photos)
- **Payment Processing**: Stripe integration for payment handling
- **Session Management**: PostgreSQL-based session store for Replit Auth compatibility

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Centralized schema definition in `shared/schema.ts`
- **Key Tables**: users, rides, accommodations, bookings, events, partnerships, loyalty programs
- **Migrations**: Drizzle Kit for database schema management
- **Multi-role Support**: Users table supports array of roles for flexible access control

### Authentication & Authorization
- **Primary Auth**: Firebase Authentication with Google OAuth
- **Role Management**: Custom multi-role system where users can have multiple roles simultaneously
- **Security**: Backend validates all role access regardless of frontend state
- **Role Switching**: Frontend allows switching between possessed roles while maintaining backend security
- **Protected Routes**: Component-based route protection with role-specific access

### API Architecture
- **REST API**: Express routes with TypeScript interfaces
- **File Uploads**: Multer middleware with memory storage for cloud uploads
- **Error Handling**: Centralized error handling with structured responses
- **CORS**: Configured for cross-origin requests
- **Validation**: Zod schemas for request/response validation

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL (serverless) via `@neondatabase/serverless`
- **Authentication**: Firebase Admin SDK and client SDK
- **Cloud Storage**: Google Cloud Storage for file management
- **Payment Processing**: Stripe for secure payment transactions

### Frontend Libraries
- **UI Framework**: React with TypeScript
- **UI Components**: Shadcn/ui component library built on Radix UI
- **Styling**: Tailwind CSS for responsive design
- **State Management**: TanStack Query for server state caching
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns for date manipulation
- **File Uploads**: Uppy for enhanced file upload experience

### Backend Services
- **Web Framework**: Express.js with comprehensive middleware stack
- **Database ORM**: Drizzle ORM with PostgreSQL support
- **File Upload**: Multer for multipart form handling
- **Session Storage**: connect-pg-simple for PostgreSQL session store
- **WebSockets**: ws for real-time communication capabilities
- **Validation**: Zod for runtime type checking and validation

### Development & Deployment
- **Build Tools**: Vite for frontend, esbuild for backend compilation
- **Package Management**: npm with lock files for dependency management
- **Type Checking**: TypeScript with strict configuration
- **Database Migrations**: Drizzle Kit for schema management
- **Deployment**: Configured for Vercel (frontend) and Railway (backend)

### Third-party Integrations
- **Maps & Location**: Prepared for Leaflet/OpenStreetMap integration
- **Email Services**: Firebase Auth email verification
- **Analytics**: Ready for Google Analytics integration
- **Monitoring**: Error tracking and performance monitoring setup