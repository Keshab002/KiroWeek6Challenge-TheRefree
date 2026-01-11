# Requirements Document

## Introduction

The Referee is a decision-support tool that helps users compare two technical options by analyzing trade-offs based on user-defined constraints. Unlike static comparison charts, it dynamically adapts recommendations based on budget, scalability needs, and integration requirements, providing contextual explanations rather than absolute winners.

## Glossary

- **Comparison_Engine**: The backend service that computes trade-off scores and generates explanations based on user constraints and option attributes
- **Constraint_Panel**: The left UI panel where users configure budget, scalability priority, and required integrations
- **Comparison_View**: The center UI panel displaying side-by-side option cards with structured attribute comparisons
- **Trade_Off_Panel**: The right UI panel showing generated explanations for why options fit better under current constraints
- **Pivot_Summary**: A human-readable decision statement explaining when to choose each option
- **Option**: A technical choice being compared (e.g., AWS Lambda vs EC2, PostgreSQL vs MongoDB)
- **Attribute**: A measurable characteristic of an option (cost model, scalability behavior, operational complexity, maintenance overhead)
- **Weight**: A numeric value representing how important an attribute is based on user constraints
- **Constraint**: User-defined parameters that influence comparison scoring (budget range, scalability priority, required integrations)

## Requirements

### Requirement 1: Constraint Configuration

**User Story:** As a user, I want to configure my constraints (budget, scalability, integrations), so that the comparison adapts to my specific situation.

#### Acceptance Criteria

1. WHEN the application loads, THE Constraint_Panel SHALL display a budget range slider with configurable min/max values
2. WHEN the application loads, THE Constraint_Panel SHALL display scalability priority options (Low, Medium, High) as selectable buttons
3. WHEN the application loads, THE Constraint_Panel SHALL display required integrations as checkboxes
4. WHEN a user adjusts any constraint, THE Constraint_Panel SHALL update local state without page reload
5. WHEN a user clicks "Run Comparison", THE Constraint_Panel SHALL send current constraints to the Comparison_Engine
6. IF the Comparison_Engine is unreachable, THEN THE Constraint_Panel SHALL display a clear error message explaining the connection failure

### Requirement 2: Side-by-Side Comparison Display

**User Story:** As a user, I want to see two options displayed side-by-side with structured attributes, so that I can visually compare their characteristics.

#### Acceptance Criteria

1. WHEN comparison data is received, THE Comparison_View SHALL display two option cards side-by-side
2. THE Comparison_View SHALL display cost model information for each option with visual indicators
3. THE Comparison_View SHALL display scalability behavior for each option with visual indicators
4. THE Comparison_View SHALL display operational complexity for each option with visual indicators
5. THE Comparison_View SHALL display maintenance overhead for each option with visual indicators
6. WHEN comparison is loading, THE Comparison_View SHALL display a loading state
7. WHEN no comparison has been run, THE Comparison_View SHALL display an empty state prompting user action
8. IF comparison data is malformed, THEN THE Comparison_View SHALL display an error state with explanation

### Requirement 3: Trade-Off Explanation Generation

**User Story:** As a user, I want to see contextual explanations of trade-offs based on my constraints, so that I understand why one option might fit better.

#### Acceptance Criteria

1. WHEN comparison completes, THE Trade_Off_Panel SHALL display generated explanation text
2. THE Trade_Off_Panel SHALL explain why each option fits better or worse under current constraints
3. THE Trade_Off_Panel SHALL never declare an absolute winner
4. WHEN constraints change and comparison is re-run, THE Trade_Off_Panel SHALL update explanations to reflect new constraint weights
5. WHEN no comparison has been run, THE Trade_Off_Panel SHALL display guidance on how to use the tool

### Requirement 4: Pivot Point Summary

**User Story:** As a user, I want a clear decision summary that tells me when to choose each option, so that I can make an informed decision.

#### Acceptance Criteria

1. WHEN comparison completes, THE Pivot_Summary SHALL display a human-readable decision statement
2. THE Pivot_Summary SHALL follow the format: "If X matters more than Y, choose A; otherwise choose B"
3. THE Pivot_Summary SHALL be derived from constraint weights and option scores, not hardcoded
4. WHEN constraints change significantly, THE Pivot_Summary SHALL reflect the shifted decision logic

### Requirement 5: Backend Comparison API

**User Story:** As a frontend client, I want to send constraints and receive structured comparison data, so that the UI can render dynamic comparisons.

#### Acceptance Criteria

1. WHEN a POST request is sent to /api/compare with valid constraints, THE Comparison_Engine SHALL return a comparison matrix
2. WHEN a POST request is sent to /api/compare with valid constraints, THE Comparison_Engine SHALL return trade-off explanation text
3. WHEN a POST request is sent to /api/compare with valid constraints, THE Comparison_Engine SHALL return pivot logic result
4. IF constraints are missing or invalid, THEN THE Comparison_Engine SHALL return HTTP 400 with descriptive error message
5. IF database is unreachable, THEN THE Comparison_Engine SHALL return HTTP 503 with service unavailable message
6. THE Comparison_Engine SHALL validate all inputs before processing
7. THE Comparison_Engine SHALL never crash on malformed input data

### Requirement 6: Database Schema and Data Access

**User Story:** As a system administrator, I want option definitions, attributes, and weights stored in PostgreSQL, so that comparison logic is data-driven and maintainable.

#### Acceptance Criteria

1. THE Database SHALL store option definitions with name, description, and category
2. THE Database SHALL store attributes for each option (cost_model, scalability, complexity, maintenance)
3. THE Database SHALL store default weights for attributes
4. WHEN the backend starts, THE Comparison_Engine SHALL verify database connection
5. IF database connection fails on startup, THEN THE Comparison_Engine SHALL fail fast with readable error message
6. THE Database schema SHALL be normalized and explicitly defined

### Requirement 7: Frontend-Backend Connection Integrity

**User Story:** As a user, I want the application to gracefully handle connection issues, so that I understand when something is wrong and what to do.

#### Acceptance Criteria

1. WHEN the frontend loads, THE Application SHALL validate API availability
2. IF the API is unavailable on load, THEN THE Application SHALL display a connection error with retry option
3. WHEN an API request fails, THE Application SHALL display meaningful error messages
4. THE Application SHALL handle loading states for all async operations
5. THE Application SHALL handle empty states when no data is available
6. THE Application SHALL handle error states with explanations and suggested actions
7. THE Application SHALL never assume backend success without verification

### Requirement 8: Visual Design and Layout

**User Story:** As a user, I want a dark, modern SaaS interface with clear visual hierarchy, so that I can easily navigate and understand the comparison tool.

#### Acceptance Criteria

1. THE Application SHALL use a three-panel layout (constraints left, comparison center, trade-offs right)
2. THE Application SHALL display a pivot summary section at the bottom
3. THE Application SHALL use dark theme styling consistent with modern SaaS design
4. THE Application SHALL use shadcn/ui components for all UI elements
5. THE Application SHALL use visual indicators (icons, badges, colors) to communicate attribute values
6. THE Application SHALL be responsive and maintain usability across screen sizes
