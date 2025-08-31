# Overview

Pix for Replit is an AI-powered image editing web application that leverages Google's Gemini AI to perform intelligent photo manipulations. The application allows users to upload images and apply various edits including retouching, adjustments, filters, and cropping through natural language prompts and preset options. Built as a full-stack TypeScript application, it features a modern React frontend with a clean, professional interface and an Express.js backend with database support.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with **React 18** and **TypeScript**, using a component-based architecture with functional components and hooks. The application uses **Vite** for development and bundling, providing fast hot module replacement and optimized builds.

**UI Framework**: The interface is built with **shadcn/ui** components on top of **Radix UI** primitives, styled with **TailwindCSS** using a dark theme design system. This provides accessible, customizable components with consistent styling.

**State Management**: Uses React's built-in state management with hooks (`useState`, `useCallback`, `useRef`) and **TanStack Query** (React Query) for server state management and API interactions.

**Routing**: Implements client-side routing with **Wouter**, a lightweight routing library suitable for single-page applications.

**Image Processing**: Integrates **react-image-crop** for manual cropping functionality, allowing users to select specific areas of images with various aspect ratio presets.

## Backend Architecture
The server is built with **Express.js** and TypeScript, following a RESTful API design pattern. The architecture is designed to be scalable and maintainable with clear separation of concerns.

**Development Setup**: Uses **tsx** for running TypeScript in development and **esbuild** for production builds, providing fast compilation and bundling.

**Middleware**: Includes request logging, JSON parsing, and error handling middleware for robust request processing.

**Storage Interface**: Implements an abstract storage interface (`IStorage`) with both in-memory (`MemStorage`) and database implementations, allowing for flexible data persistence strategies.

## Data Storage Solutions
The application is configured to use **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations and migrations.

**Schema Design**: Implements a user-centric schema with the `users` table containing id, username, and password fields. The schema uses Drizzle's type-safe approach with Zod validation.

**Connection**: Uses **Neon Database** serverless PostgreSQL for cloud-hosted database services, with connection pooling via `@neondatabase/serverless`.

**Session Management**: Configured for PostgreSQL session storage using `connect-pg-simple` for persistent user sessions.

## Authentication and Authorization
The application includes basic user authentication infrastructure with username/password-based login. The schema supports user registration and authentication, though the implementation may need completion based on specific requirements.

**Session Storage**: Uses PostgreSQL-backed sessions for maintaining user state across requests.

**Password Security**: The schema includes password fields, suggesting implementation of secure password hashing (likely bcrypt or similar).

## External Service Integrations

### Google Gemini AI Integration
The core AI functionality is powered by **Google Gemini AI** (`@google/genai`), providing advanced image editing capabilities through natural language processing.

**Image Processing Services**: 
- `generateEditedImage()`: Applies specific edits to targeted image areas using hotspot coordinates
- `generateFilteredImage()`: Applies artistic filters and effects based on text prompts  
- `generateAdjustedImage()`: Performs image adjustments like brightness, contrast, and saturation

**API Configuration**: Requires `VITE_GEMINI_API_KEY` or `GEMINI_API_KEY` environment variable for authentication with Google's AI services.

### Image Handling
**File Processing**: Handles image uploads and conversions between File objects, data URLs, and Gemini AI-compatible formats. Implements error handling for various image processing scenarios including API rate limits and content filtering.

**Sample Images**: Integrates with **Unsplash** for providing sample images to users who want to test the application without uploading their own photos.

### Development and Deployment
**Replit Integration**: Includes Replit-specific configurations and plugins for seamless development in the Replit environment, including runtime error overlays and cartographer integration.

**Environment Handling**: Supports both development and production environments with appropriate build processes and static file serving.

**Font Integration**: Uses Google Fonts (Inter, Architects Daughter, DM Sans, Fira Code, Geist Mono) for typography, loaded via CDN for optimal performance.