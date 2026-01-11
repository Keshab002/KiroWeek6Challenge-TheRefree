// Constraint types
export interface Constraints {
  budgetMin: number;
  budgetMax: number;
  scalabilityPriority: 'low' | 'medium' | 'high';
  requiredIntegrations: string[];
}

// Attribute types
export interface AttributeValue {
  value: string;
  rating: 'low' | 'medium' | 'high';
  icon: string;
}

// Option types
export interface Option {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface OptionComparison {
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

// Comparison types
export interface AttributeMatrix {
  [attributeType: string]: {
    [optionId: string]: AttributeValue;
  };
}

export interface ComparisonResult {
  options: OptionComparison[];
  matrix: AttributeMatrix;
}

// Trade-off explanation types
export interface OptionAnalysis {
  optionId: string;
  optionName: string;
  strengths: string[];
  weaknesses: string[];
  fitScore: number;
  fitReason: string;
}

export interface ConstraintImpact {
  constraint: string;
  impact: string;
}

export interface TradeOffExplanation {
  summary: string;
  optionAnalysis: OptionAnalysis[];
  constraintImpact: ConstraintImpact[];
}

// Pivot types
export interface PivotResult {
  statement: string;
  primaryFactor: string;
  secondaryFactor: string;
  optionA: string;
  optionB: string;
}

// Integration types
export interface Integration {
  id: string;
  name: string;
  category: string;
}

// AI Comparison types
export interface AIDetailedAnalysis {
  optionName: string;
  pros: string[];
  cons: string[];
  bestFor: string;
}

export interface AIComparisonResult {
  summary: string;
  recommendation: string;
  decisionGuidance?: string;
  personalizedInsights?: string[];
  detailedAnalysis: AIDetailedAnalysis[];
  pivotStatement: string;
  confidenceScore: number;
}

// API Request/Response types
export interface CompareRequest {
  constraints: Constraints;
  optionIds: [string, string];
}

export interface CompareResponse {
  comparison: ComparisonResult;
  explanation: TradeOffExplanation;
  pivot: PivotResult;
  aiEnhanced?: boolean;
  aiAnalysis?: AIComparisonResult;
}

export interface OptionsResponse {
  options: Option[];
}

export interface IntegrationsResponse {
  integrations: Integration[];
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: 'connected' | 'disconnected';
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, string>;
  timestamp: string;
}

// API Error type for frontend error handling
export interface ApiError {
  message: string;
  code: string;
  suggestion: string;
}

// Application state types
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AppState {
  constraints: Constraints;
  availableOptions: Option[];
  availableIntegrations: Integration[];
  selectedOptions: [string, string] | null;
  comparison: ComparisonResult | null;
  explanation: TradeOffExplanation | null;
  pivot: PivotResult | null;
  aiEnhanced: boolean;
  aiAnalysis: AIComparisonResult | null;
  status: RequestStatus;
  error: string | null;
  apiHealthy: boolean;
  lastHealthCheck: Date | null;
}
