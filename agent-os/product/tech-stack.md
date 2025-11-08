# Tech Stack

## Framework & Runtime
- **Build Tool:** Vite 7.1.7
- **Language/Runtime:** JavaScript (ES6+) with Node.js
- **Package Manager:** npm

## Frontend
- **JavaScript Framework:** React 19.1.1
- **CSS Framework:** Tailwind CSS (utility-first styling approach)
- **UI Components:** shadcn/ui (accessible, customizable component system built on Radix UI primitives)

## State Management
- **Server State:** TanStack Query (React Query) - for fetching, caching, and synchronizing Firebase data
- **UI State:** React Context API - for simple client-side state like sidebar toggles, theme preferences, and modal visibility

## Database & Storage
- **Database:** Firebase Firestore - NoSQL document database for storing game configuration, user data, prizes, and gameplay records
- **File Storage:** Firebase Storage - for hosting prize images and other media assets
- **Authentication:** Firebase Authentication - for secure admin user management and access control

## Backend/Services
- **Backend Platform:** Firebase (serverless architecture)
- **API Layer:** Direct Firebase SDK integration in React components via TanStack Query hooks

## Testing & Quality
- **Test Framework:** To be determined based on project needs
- **Linting/Formatting:** To be configured with ESLint and Prettier for consistent code style

## Deployment & Infrastructure
- **Hosting:** Firebase Hosting - for deploying the admin panel web application
- **CI/CD:** To be configured based on deployment workflow needs

## Third-Party Services
- **Authentication:** Firebase Authentication (built-in)
- **Monitoring:** Firebase Analytics and Performance Monitoring for tracking application health
- **Error Tracking:** To be determined based on operational needs

## Development Standards
- **Standards Framework:** Agent-OS - for maintaining consistent development conventions, coding style, error handling, and validation practices across the codebase
