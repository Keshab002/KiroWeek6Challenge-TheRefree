// Database row types
export interface OptionRow {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at: Date;
}

export interface AttributeRow {
  id: string;
  option_id: string;
  attribute_type: 'cost_model' | 'scalability' | 'complexity' | 'maintenance';
  value: string;
  rating: 'low' | 'medium' | 'high';
  description: string | null;
}

export interface WeightRow {
  id: string;
  attribute_type: string;
  default_weight: number;
  scalability_low_modifier: number;
  scalability_medium_modifier: number;
  scalability_high_modifier: number;
}

export interface IntegrationRow {
  id: string;
  name: string;
  category: string;
}

export interface OptionIntegrationRow {
  option_id: string;
  integration_id: string;
  support_level: 'native' | 'plugin' | 'custom';
}

// API types
export interface Constraints {
  budgetMin: number;
  budgetMax: number;
  scalabilityPriority: 'low' | 'medium' | 'high';
  requiredIntegrations: string[];
}

export interface AttributeValue {
  value: string;
  rating: 'low' | 'medium' | 'high';
  icon: string;
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

export interface AttributeMatrix {
  [attributeType: string]: {
    [optionId: string]: AttributeValue;
  };
}

export interface ComparisonResult {
  options: OptionComparison[];
  matrix: AttributeMatrix;
}

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

export interface PivotResult {
  statement: string;
  primaryFactor: string;
  secondaryFactor: string;
  optionA: string;
  optionB: string;
}

export interface CompareRequest {
  constraints: Constraints;
  optionIds: [string, string];
}

export interface AIDetailedAnalysis {
  optionName: string;
  pros: string[];
  cons: string[];
  bestFor: string;
}

export interface AIComparisonResult {
  summary: string;
  recommendation: string;
  detailedAnalysis: AIDetailedAnalysis[];
  pivotStatement: string;
  confidenceScore: number;
}

export interface CompareResponse {
  comparison: ComparisonResult;
  explanation: TradeOffExplanation;
  pivot: PivotResult;
  aiEnhanced?: boolean;
  aiAnalysis?: AIComparisonResult;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, string>;
  timestamp: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: 'connected' | 'disconnected';
  timestamp: string;
}

// Application error class
export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
