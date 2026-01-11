# Design Document: The Referee

## Overview

The Referee is a full-stack decision-support application built with React (Vite) + Tailwind + shadcn/ui on the frontend, Node.js + Express on the backend, and PostgreSQL for data persistence. The system enables users to compare two technical options by dynamically computing trade-off scores based on user-defined constraints.

The architecture prioritizes runtime correctness over test coverage, with explicit connection validation, graceful error handling, and predictable state management throughout the stack.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (React + Vite)                        │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐               │
│  │  Constraint  │  │   Comparison     │  │   Trade-Off     │               │
│  │    Panel     │  │     View         │  │     Panel       │               │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬────────┘               │
│         │                   │                     │                         │
│         └───────────────────┼─────────────────────┘                         │
│                             │                                               │
│                    ┌────────▼────────┐                                      │
│                    │   App State     │                                      │
│                    │  (React State)  │                                      │
│                    └────────┬────────┘                                      │
│                             │                                               │
│                    ┌────────▼────────┐                                      │
│                    │   API Client    │                                      │
│                    │  (fetch + error │                                      │
│                    │   handling)     │                                      │
│                    └────────┬────────┘                                      │
└─────────────────────────────┼───────────────────────────────────────────────┘
                              │ HTTP/REST
                              │
┌─────────────────────────────┼───────────────────────────────────────────────┐
│                     Backend (Node.js + Express)                             │
│                    ┌────────▼────────┐                                      │
│                    │  Express Router │                                      │
│                    │  POST /api/     │                                      │
│                    │    compare      │                                      │
│                    └────────┬────────┘                                      │
│                             │                                               │
│         ┌───────────────────┼───────────────────┐                           │
│         │                   │                   │                           │
│  ┌──────▼──────┐   ┌────────▼────────┐  ┌──────▼──────┐                    │
│  │  Validator  │   │   Comparison    │  │ Explanation │                    │
│  │  Middleware │   │     Engine      │  │  Generator  │                    │
│  └─────────────┘   └────────┬────────┘  └─────────────┘                    │
│                             │                                               │
│                    ┌────────▼────────┐                                      │
│                    │   Data Access   │                                      │
│                    │     Layer       │                                      │
│                    └────────┬────────┘                                      │
└─────────────────────────────┼───────────────────────────────────────────────┘
                              │ SQL
                              │
┌─────────────────────────────┼───────────────────────────────────────────────┐
│                        PostgreSQL                                           │
│                    ┌────────▼────────┐                                      │
│                    │     options     │                                      │
│                    │   attributes    │                                      │
│                    │     weights     │                                      │
│                    │  integrations   │                                      │
│                    └─────────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Request Flow

1. User configures constraints in Constraint_Panel
2. User clicks "Run Comparison"
3. Frontend validates constraints locally, sends POST to /api/compare
4. Backend validates input, queries database for options/attributes
5. Comparison_Engine computes weighted scores
6. Explanation_Generator produces trade-off text and pivot summary
7. Backend returns structured JSON response
8. Frontend updates state, renders Comparison_View and Trade_Off_Panel

## Components and Interfaces

### Frontend Components

#### ConstraintPanel
```typescript
interface ConstraintPanelProps {
  constraints: Constraints;
  onConstraintsChange: (constraints: Constraints) => void;
  onRunComparison: () => void;
  isLoading: boolean;
  availableIntegrations: Integration[];
}

interface Constraints {
  budgetMin: number;
  budgetMax: number;
  scalabilityPriority: 'low' | 'medium' | 'high';
  requiredIntegrations: string[];
}
```

#### ComparisonView
```typescript
interface ComparisonViewProps {
  comparison: ComparisonResult | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}

interface ComparisonResult {
  options: OptionComparison[];
  matrix: AttributeMatrix;
}

interface OptionComparison {
  id: string;
  name: string;
  description: string;
  attributes: {
    costModel: AttributeValue;
    scalability: AttributeValue;
    complexity: AttributeValue;
    maintenance: AttributeValue;
  };
  score: number;
}

interface AttributeValue {
  value: string;
  rating: 'low' | 'medium' | 'high';
  icon: string;
}
```

#### TradeOffPanel
```typescript
interface TradeOffPanelProps {
  explanation: TradeOffExplanation | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

interface TradeOffExplanation {
  summary: string;
  optionAnalysis: OptionAnalysis[];
  constraintImpact: ConstraintImpact[];
}

interface OptionAnalysis {
  optionId: string;
  optionName: string;
  strengths: string[];
  weaknesses: string[];
  fitScore: number;
  fitReason: string;
}
```

#### PivotSummary
```typescript
interface PivotSummaryProps {
  pivot: PivotResult | null;
}

interface PivotResult {
  statement: string;  // "If X matters more than Y, choose A; otherwise choose B"
  primaryFactor: string;
  secondaryFactor: string;
  optionA: string;
  optionB: string;
}
```

### Backend Interfaces

#### API Endpoint: POST /api/compare
```typescript
// Request
interface CompareRequest {
  constraints: {
    budgetMin: number;
    budgetMax: number;
    scalabilityPriority: 'low' | 'medium' | 'high';
    requiredIntegrations: string[];
  };
  optionIds: [string, string];  // Exactly two options to compare
}

// Response
interface CompareResponse {
  comparison: {
    options: OptionComparison[];
    matrix: AttributeMatrix;
  };
  explanation: TradeOffExplanation;
  pivot: PivotResult;
}

// Error Response
interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, string>;
}
```

#### API Endpoint: GET /api/options
```typescript
// Response
interface OptionsResponse {
  options: Option[];
}

interface Option {
  id: string;
  name: string;
  description: string;
  category: string;
}
```

#### API Endpoint: GET /api/integrations
```typescript
// Response
interface IntegrationsResponse {
  integrations: Integration[];
}

interface Integration {
  id: string;
  name: string;
  category: string;
}
```

#### API Endpoint: GET /api/health
```typescript
// Response
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: 'connected' | 'disconnected';
  timestamp: string;
}
```

### Comparison Engine Interface
```typescript
interface ComparisonEngine {
  compare(
    options: Option[],
    attributes: Attribute[],
    weights: Weight[],
    constraints: Constraints
  ): ComparisonResult;
}
```

### Explanation Generator Interface
```typescript
interface ExplanationGenerator {
  generate(
    comparison: ComparisonResult,
    constraints: Constraints
  ): TradeOffExplanation;
  
  generatePivot(
    comparison: ComparisonResult,
    constraints: Constraints
  ): PivotResult;
}
```

## Data Models

### Database Schema

```sql
-- Options table: stores technical options to compare
CREATE TABLE options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attributes table: stores attribute values for each option
CREATE TABLE attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES options(id) ON DELETE CASCADE,
  attribute_type VARCHAR(50) NOT NULL,  -- 'cost_model', 'scalability', 'complexity', 'maintenance'
  value VARCHAR(100) NOT NULL,
  rating VARCHAR(10) NOT NULL CHECK (rating IN ('low', 'medium', 'high')),
  description TEXT,
  UNIQUE(option_id, attribute_type)
);

-- Weights table: stores default weights for attributes
CREATE TABLE weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_type VARCHAR(50) NOT NULL UNIQUE,
  default_weight DECIMAL(3,2) NOT NULL CHECK (default_weight >= 0 AND default_weight <= 1),
  scalability_low_modifier DECIMAL(3,2) DEFAULT 1.0,
  scalability_medium_modifier DECIMAL(3,2) DEFAULT 1.0,
  scalability_high_modifier DECIMAL(3,2) DEFAULT 1.0
);

-- Integrations table: stores available integrations
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL
);

-- Option integrations: many-to-many relationship
CREATE TABLE option_integrations (
  option_id UUID NOT NULL REFERENCES options(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  support_level VARCHAR(20) NOT NULL CHECK (support_level IN ('native', 'plugin', 'custom')),
  PRIMARY KEY (option_id, integration_id)
);

-- Indexes for query performance
CREATE INDEX idx_attributes_option_id ON attributes(option_id);
CREATE INDEX idx_option_integrations_option_id ON option_integrations(option_id);
CREATE INDEX idx_option_integrations_integration_id ON option_integrations(integration_id);
```

### TypeScript Data Models

```typescript
// Database row types
interface OptionRow {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at: Date;
}

interface AttributeRow {
  id: string;
  option_id: string;
  attribute_type: 'cost_model' | 'scalability' | 'complexity' | 'maintenance';
  value: string;
  rating: 'low' | 'medium' | 'high';
  description: string | null;
}

interface WeightRow {
  id: string;
  attribute_type: string;
  default_weight: number;
  scalability_low_modifier: number;
  scalability_medium_modifier: number;
  scalability_high_modifier: number;
}

interface IntegrationRow {
  id: string;
  name: string;
  category: string;
}

interface OptionIntegrationRow {
  option_id: string;
  integration_id: string;
  support_level: 'native' | 'plugin' | 'custom';
}
```

### Application State Model

```typescript
interface AppState {
  // Constraint state
  constraints: Constraints;
  
  // Available data from backend
  availableOptions: Option[];
  availableIntegrations: Integration[];
  
  // Selected options for comparison
  selectedOptions: [string, string] | null;
  
  // Comparison results
  comparison: ComparisonResult | null;
  explanation: TradeOffExplanation | null;
  pivot: PivotResult | null;
  
  // UI state
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  
  // Connection state
  apiHealthy: boolean;
  lastHealthCheck: Date | null;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*



### Property 1: Constraint State Consistency

*For any* constraint change (budget adjustment, scalability selection, or integration toggle), the application state SHALL update to reflect the new value without requiring page reload or losing other constraint values.

**Validates: Requirements 1.4**

### Property 2: Comparison Card Rendering

*For any* valid comparison response from the API, the Comparison_View SHALL render exactly two option cards, one for each compared option.

**Validates: Requirements 2.1**

### Property 3: Attribute Display Completeness

*For any* option in a comparison result, all four attributes (cost_model, scalability, complexity, maintenance) SHALL be displayed with their corresponding visual indicators (icons, badges, colors based on rating).

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 8.5**

### Property 4: Malformed Data Error Handling

*For any* malformed or incomplete comparison data received from the API, the Comparison_View SHALL display an error state with a human-readable explanation rather than crashing or showing broken UI.

**Validates: Requirements 2.8**

### Property 5: Trade-Off Explanation Completeness

*For any* successful comparison, the Trade_Off_Panel SHALL display explanation text that references both compared options, including strengths, weaknesses, and fit analysis for each.

**Validates: Requirements 3.1, 3.2**

### Property 6: No Absolute Winner Declaration

*For any* generated explanation or pivot text, the content SHALL NOT contain absolute winner language (e.g., "X is the best", "always choose Y", "winner is Z"). All recommendations must be conditional on constraints.

**Validates: Requirements 3.3**

### Property 7: Pivot Statement Format

*For any* pivot result, the statement SHALL follow the conditional format pattern: "If [factor] matters more than [other factor], choose [option]; otherwise choose [other option]" - containing exactly two options and at least one conditional factor.

**Validates: Requirements 4.1, 4.2**

### Property 8: Constraint Sensitivity (Metamorphic)

*For any* two meaningfully different constraint configurations (e.g., low vs high scalability priority, different budget ranges), running comparison on the same options SHALL produce different scores, explanations, or pivot recommendations that reflect the constraint differences.

**Validates: Requirements 3.4, 4.3, 4.4**

### Property 9: Valid API Response Structure

*For any* valid POST request to /api/compare with properly formatted constraints and two valid option IDs, the response SHALL contain all three required components: comparison matrix, trade-off explanation, and pivot result.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 10: Invalid Input Rejection

*For any* POST request to /api/compare with invalid constraints (missing fields, out-of-range values, invalid option IDs), the API SHALL return HTTP 400 with a descriptive error message identifying the validation failure.

**Validates: Requirements 5.4**

### Property 11: Crash Resistance

*For any* malformed input to the /api/compare endpoint (invalid JSON, wrong types, unexpected fields), the API SHALL return an appropriate error response (4xx) rather than crashing or returning 5xx server errors.

**Validates: Requirements 5.7**

### Property 12: Meaningful Error Messages

*For any* error state in the application (API failure, validation error, connection issue), the displayed error message SHALL include: what failed, why it might have failed, and a suggested action to resolve it.

**Validates: Requirements 7.3, 7.6**

### Property 13: Loading State Coverage

*For any* asynchronous operation (API health check, comparison request, data fetching), the UI SHALL display a loading indicator while the operation is in progress.

**Validates: Requirements 7.4**

## Error Handling

### Frontend Error Handling Strategy

```typescript
// Error boundary for React components
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

// API error handling
interface ApiError {
  message: string;
  code: string;
  suggestion: string;
}

const ERROR_MESSAGES: Record<string, ApiError> = {
  NETWORK_ERROR: {
    message: "Unable to connect to the server",
    code: "NETWORK_ERROR",
    suggestion: "Check your internet connection and try again"
  },
  API_UNAVAILABLE: {
    message: "The comparison service is currently unavailable",
    code: "API_UNAVAILABLE",
    suggestion: "Please try again in a few moments"
  },
  INVALID_RESPONSE: {
    message: "Received unexpected data from the server",
    code: "INVALID_RESPONSE",
    suggestion: "Please refresh the page and try again"
  },
  VALIDATION_ERROR: {
    message: "Invalid input provided",
    code: "VALIDATION_ERROR",
    suggestion: "Please check your constraint values and try again"
  }
};
```

### Backend Error Handling Strategy

```typescript
// Centralized error handler middleware
interface AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;
}

// Error response format
interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, string>;
  timestamp: string;
}

// HTTP status code mapping
const ERROR_STATUS_CODES = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  DATABASE_ERROR: 503,
  INTERNAL_ERROR: 500
};
```

### Database Connection Error Handling

```typescript
// Startup validation
async function validateDatabaseConnection(): Promise<void> {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection verified');
  } catch (error) {
    console.error('FATAL: Database connection failed:', error.message);
    console.error('Please verify DATABASE_URL environment variable');
    process.exit(1);
  }
}

// Runtime query error handling
async function safeQuery<T>(query: string, params?: any[]): Promise<T[]> {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new AppError('Database connection lost', 503, 'DATABASE_ERROR');
    }
    throw new AppError('Database query failed', 500, 'DATABASE_ERROR');
  }
}
```

## Testing Strategy

### Runtime Validation Approach

Since this project explicitly avoids unit tests and integration tests, correctness is ensured through:

1. **Startup Validation**
   - Database connection verification on backend start
   - Environment variable validation
   - API health check on frontend load

2. **Input Validation**
   - Schema validation for all API inputs using Zod
   - Type checking at runtime boundaries
   - Constraint range validation

3. **Response Validation**
   - Frontend validates API response structure before rendering
   - Graceful degradation for unexpected data shapes

4. **Error Boundaries**
   - React error boundaries catch rendering failures
   - Express error middleware catches all unhandled errors
   - No silent failures - all errors logged and displayed

### Validation Checkpoints

```typescript
// Frontend: API response validation
function validateCompareResponse(data: unknown): CompareResponse {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid response format');
  }
  
  const response = data as Record<string, unknown>;
  
  if (!response.comparison || !response.explanation || !response.pivot) {
    throw new ValidationError('Missing required response fields');
  }
  
  // Validate nested structures...
  return data as CompareResponse;
}

// Backend: Input validation with Zod
const CompareRequestSchema = z.object({
  constraints: z.object({
    budgetMin: z.number().min(0),
    budgetMax: z.number().min(0),
    scalabilityPriority: z.enum(['low', 'medium', 'high']),
    requiredIntegrations: z.array(z.string().uuid())
  }),
  optionIds: z.tuple([z.string().uuid(), z.string().uuid()])
});
```

### Health Check Endpoints

```typescript
// GET /api/health
interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: 'connected' | 'disconnected';
    uptime: number;
  };
  timestamp: string;
}
```

## Project Structure

```
the-referee/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── ConstraintPanel.tsx
│   │   │   ├── ComparisonView.tsx
│   │   │   ├── TradeOffPanel.tsx
│   │   │   ├── PivotSummary.tsx
│   │   │   ├── OptionCard.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── LoadingState.tsx
│   │   ├── lib/
│   │   │   ├── api.ts                 # API client with error handling
│   │   │   ├── validation.ts          # Response validation
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   ├── useComparison.ts
│   │   │   ├── useConstraints.ts
│   │   │   └── useApiHealth.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── compare.ts
│   │   │   ├── options.ts
│   │   │   └── health.ts
│   │   ├── services/
│   │   │   ├── comparisonEngine.ts
│   │   │   └── explanationGenerator.ts
│   │   ├── db/
│   │   │   ├── pool.ts
│   │   │   ├── queries.ts
│   │   │   └── seed.ts
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   └── validation.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── database/
│   ├── schema.sql
│   └── seed.sql
└── README.md
```
