# Implementation Plan: The Referee

## Overview

This implementation plan builds The Referee decision-support tool incrementally, starting with database and backend foundation, then frontend components, and finally wiring everything together. Each task builds on previous work with no orphaned code.

## Tasks

- [x] 1. Set up project structure and database
  - [x] 1.1 Initialize backend project with Express and TypeScript
    - Create backend folder with package.json, tsconfig.json
    - Install dependencies: express, pg, zod, cors, dotenv
    - Set up src folder structure (routes, services, db, middleware, types)
    - _Requirements: 5.1, 6.4_

  - [x] 1.2 Create PostgreSQL schema and seed data
    - Create database/schema.sql with all tables (options, attributes, weights, integrations, option_integrations)
    - Create database/seed.sql with sample technical options (e.g., AWS Lambda vs EC2, PostgreSQL vs MongoDB)
    - Include realistic attribute values and weights
    - _Requirements: 6.1, 6.2, 6.3, 6.6_

  - [x] 1.3 Implement database connection with startup validation
    - Create db/pool.ts with pg Pool configuration
    - Implement connection verification on startup
    - Fail fast with readable error if DB unreachable
    - _Requirements: 6.4, 6.5_

- [x] 2. Implement backend API layer
  - [x] 2.1 Create data access layer and queries
    - Implement db/queries.ts with functions: getOptions, getOptionById, getAttributes, getWeights, getIntegrations
    - Use parameterized queries for safety
    - Include error handling for query failures
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 2.2 Implement comparison engine service
    - Create services/comparisonEngine.ts
    - Implement weighted scoring algorithm based on constraints
    - Apply scalability modifiers to weights
    - Filter options by required integrations
    - Return structured ComparisonResult
    - _Requirements: 5.1_

  - [x] 2.3 Implement explanation generator service
    - Create services/explanationGenerator.ts
    - Generate trade-off explanation text based on scores and constraints
    - Generate pivot statement in "If X matters more than Y, choose A; otherwise choose B" format
    - Never declare absolute winners
    - _Requirements: 5.2, 5.3, 3.3, 4.2_

  - [x] 2.4 Create validation middleware with Zod schemas
    - Create middleware/validation.ts
    - Define CompareRequestSchema with all constraint validations
    - Return HTTP 400 with descriptive errors for invalid input
    - _Requirements: 5.4, 5.6_

  - [x] 2.5 Create error handler middleware
    - Create middleware/errorHandler.ts
    - Centralized error handling for all routes
    - Map error types to HTTP status codes
    - Never crash on malformed input
    - _Requirements: 5.5, 5.7_

  - [x] 2.6 Implement API routes
    - Create routes/compare.ts with POST /api/compare
    - Create routes/options.ts with GET /api/options and GET /api/integrations
    - Create routes/health.ts with GET /api/health
    - Wire routes in main index.ts
    - _Requirements: 5.1, 5.2, 5.3, 7.1_

  - [x] 2.7 Create backend entry point with startup validation
    - Create src/index.ts with Express app setup
    - Verify database connection before listening
    - Log startup status clearly
    - _Requirements: 6.4, 6.5_

- [x] 3. Checkpoint - Backend verification
  - Verify backend starts and connects to database
  - Test /api/health endpoint returns healthy status
  - Test /api/options returns seeded data
  - Ask user if questions arise

- [x] 4. Set up frontend project
  - [x] 4.1 Initialize React project with Vite and TypeScript
    - Create frontend folder with Vite React-TS template
    - Install dependencies: tailwindcss, @radix-ui/react-*, class-variance-authority, clsx, tailwind-merge, lucide-react
    - Configure Tailwind with dark theme
    - _Requirements: 8.3, 8.4_

  - [x] 4.2 Set up shadcn/ui components
    - Initialize shadcn/ui with dark theme
    - Add required components: Button, Slider, Card, Badge, Checkbox, Alert
    - Configure component aliases
    - _Requirements: 8.4_

  - [x] 4.3 Create TypeScript types for frontend
    - Create types/index.ts with all interfaces (Constraints, ComparisonResult, TradeOffExplanation, PivotResult, etc.)
    - Match backend response types exactly
    - _Requirements: 7.7_

  - [x] 4.4 Create API client with error handling
    - Create lib/api.ts with fetch wrapper
    - Implement health check, compare, getOptions, getIntegrations functions
    - Handle network errors, parse errors, validation errors
    - Return structured ApiError for failures
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 5. Implement frontend components
  - [x] 5.1 Create ErrorBoundary and LoadingState components
    - Create components/ErrorBoundary.tsx with error display and retry
    - Create components/LoadingState.tsx with spinner/skeleton
    - Style with dark theme
    - _Requirements: 7.3, 7.4, 7.6_

  - [x] 5.2 Implement ConstraintPanel component
    - Create components/ConstraintPanel.tsx
    - Budget range slider with min/max display
    - Scalability priority buttons (Low/Medium/High)
    - Integration checkboxes from available integrations
    - "Run Comparison" button with loading state
    - Error display for connection failures
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 5.3 Implement OptionCard component
    - Create components/OptionCard.tsx
    - Display option name and description
    - Show all four attributes with visual indicators (icons, badges, colors)
    - Rating-based styling (low=red, medium=yellow, high=green)
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 8.5_

  - [x] 5.4 Implement ComparisonView component
    - Create components/ComparisonView.tsx
    - Two OptionCards side-by-side
    - Loading state while fetching
    - Empty state prompting user to run comparison
    - Error state for malformed data
    - _Requirements: 2.1, 2.6, 2.7, 2.8_

  - [x] 5.5 Implement TradeOffPanel component
    - Create components/TradeOffPanel.tsx
    - Display explanation summary
    - Show strengths/weaknesses for each option
    - Fit score visualization
    - Empty state with usage guidance
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [x] 5.6 Implement PivotSummary component
    - Create components/PivotSummary.tsx
    - Display pivot statement prominently
    - Highlight conditional factors
    - Style as decision callout
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Wire frontend together
  - [x] 6.1 Create custom hooks for state management
    - Create hooks/useConstraints.ts for constraint state
    - Create hooks/useComparison.ts for comparison API calls and results
    - Create hooks/useApiHealth.ts for health check on load
    - _Requirements: 1.4, 7.1, 7.4_

  - [x] 6.2 Implement main App component with three-panel layout
    - Create App.tsx with grid layout
    - Left panel: ConstraintPanel
    - Center panel: ComparisonView
    - Right panel: TradeOffPanel
    - Bottom: PivotSummary
    - API health check on mount
    - Connection error display if API unavailable
    - _Requirements: 8.1, 8.2, 7.1, 7.2_

  - [x] 6.3 Add response validation
    - Create lib/validation.ts
    - Validate API responses before rendering
    - Graceful degradation for unexpected data
    - _Requirements: 7.7, 2.8_

- [x] 7. Checkpoint - Frontend verification
  - Verify frontend builds and runs
  - Verify API health check works
  - Verify constraint panel renders correctly
  - Ask user if questions arise

- [x] 8. Integration and polish
  - [x] 8.1 Connect frontend to backend
    - Configure CORS on backend for frontend origin
    - Set API base URL via environment variable
    - Test full comparison flow end-to-end
    - _Requirements: 7.1, 7.7_

  - [x] 8.2 Add environment configuration
    - Create .env.example files for both frontend and backend
    - Document required environment variables
    - Add startup validation for missing env vars
    - _Requirements: 6.4, 6.5_

  - [x] 8.3 Final UI polish
    - Ensure consistent dark theme throughout
    - Add smooth transitions for state changes
    - Verify responsive layout
    - _Requirements: 8.3, 8.6_

- [x] 9. Final checkpoint - Full system verification
  - Verify complete flow: constraints → comparison → explanation → pivot
  - Verify error handling for API failures
  - Verify database connection validation
  - Ensure no console errors or warnings
  - Ask user if questions arise

## Notes

- No unit tests or integration tests per project requirements
- Runtime validation ensures correctness through startup checks and input validation
- All error states display meaningful messages with suggested actions
- Database must be running and seeded before backend starts
