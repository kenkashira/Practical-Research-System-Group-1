# Event Registration System - Army's Angels Integrated School

## Overview

This is a web-based Event Registration System for Army's Angels Integrated School, Inc. The application allows students to view and register for school events through a multi-stage wizard, while administrators can create events, manage registrations, and approve/reject student submissions. The system follows a portal-style workflow similar to scholarship application systems, with stage-based registration, document uploads, and status tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion for page transitions
- **File Uploads**: Uppy with AWS S3 presigned URL flow

The frontend follows a component-based architecture with:
- `/pages` - Route-level page components
- `/components` - Reusable UI components including shadcn/ui primitives
- `/hooks` - Custom React hooks for auth, events, registrations, and file uploads
- `/lib` - Utility functions and query client configuration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES Modules
- **Authentication**: Passport.js with Local Strategy, session-based auth stored in PostgreSQL
- **API Design**: RESTful endpoints defined in shared route contracts (`shared/routes.ts`)

The backend serves both API routes and static files in production. In development, Vite handles the frontend with HMR support.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Drizzle Kit (`drizzle-kit push`)
- **Session Storage**: PostgreSQL via `connect-pg-simple`

Key database tables:
- `users` - Students and admins with role-based access
- `events` - School events with dates, venues, fees, and deadlines
- `registrations` - Multi-stage registration records linking users to events

### File Storage
- **Service**: Google Cloud Storage via Replit Object Storage integration
- **Upload Flow**: Presigned URL pattern - client requests URL, then uploads directly to storage
- **Routes**: `/api/uploads/request-url` provides presigned upload URLs

### Authentication Flow
- Students log in with LRN (Learner Reference Number) and password
- Sessions persist for 30 days in PostgreSQL
- Role-based route protection (student vs admin views)
- Protected routes redirect unauthenticated users to `/auth`

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: 
  - Frontend built with Vite to `dist/public`
  - Backend bundled with esbuild to `dist/index.cjs`
  - Selected dependencies bundled to reduce cold start times

## External Dependencies

### Database
- PostgreSQL (required, connection via `DATABASE_URL` environment variable)

### Cloud Services
- Google Cloud Storage for file uploads (via Replit Object Storage integration)
- Presigned URLs for direct client-to-storage uploads

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `passport` / `passport-local` - Authentication
- `express-session` / `connect-pg-simple` - Session management
- `@tanstack/react-query` - Server state management
- `@uppy/core` / `@uppy/aws-s3` - File upload handling
- `zod` - Schema validation shared between client and server
- `framer-motion` - UI animations
- `date-fns` - Date formatting

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret for session encryption (defaults to "secret" in development)