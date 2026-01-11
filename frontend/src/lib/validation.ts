import type {
  CompareResponse,
  ComparisonResult,
  TradeOffExplanation,
  PivotResult,
  OptionComparison,
  AttributeValue,
  OptionAnalysis,
  HealthResponse,
  OptionsResponse,
  IntegrationsResponse,
} from '@/types';

/**
 * Validation error class for API response validation failures.
 */
export class ValidationError extends Error {
  field: string;
  
  constructor(message: string, field: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Validates that a value is a non-null object.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates that a value is a non-empty string.
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validates that a value is a valid rating.
 */
function isValidRating(value: unknown): value is 'low' | 'medium' | 'high' {
  return value === 'low' || value === 'medium' || value === 'high';
}

/**
 * Validates an AttributeValue object.
 */
function validateAttributeValue(data: unknown, fieldPath: string): AttributeValue {
  if (!isObject(data)) {
    throw new ValidationError(`Expected object for attribute value`, fieldPath);
  }

  if (!isNonEmptyString(data.value)) {
    throw new ValidationError(`Missing or invalid 'value' field`, `${fieldPath}.value`);
  }

  if (!isValidRating(data.rating)) {
    throw new ValidationError(
      `Invalid rating: expected 'low', 'medium', or 'high'`,
      `${fieldPath}.rating`
    );
  }

  return {
    value: data.value,
    rating: data.rating,
    icon: typeof data.icon === 'string' ? data.icon : '',
  };
}

/**
 * Validates an OptionComparison object.
 */
function validateOptionComparison(data: unknown, index: number): OptionComparison {
  const fieldPath = `options[${index}]`;

  if (!isObject(data)) {
    throw new ValidationError(`Expected object for option`, fieldPath);
  }

  if (!isNonEmptyString(data.id)) {
    throw new ValidationError(`Missing or invalid 'id' field`, `${fieldPath}.id`);
  }

  if (!isNonEmptyString(data.name)) {
    throw new ValidationError(`Missing or invalid 'name' field`, `${fieldPath}.name`);
  }

  if (typeof data.description !== 'string') {
    throw new ValidationError(`Missing 'description' field`, `${fieldPath}.description`);
  }

  if (typeof data.score !== 'number' || isNaN(data.score)) {
    throw new ValidationError(`Missing or invalid 'score' field`, `${fieldPath}.score`);
  }

  if (!isObject(data.attributes)) {
    throw new ValidationError(`Missing 'attributes' object`, `${fieldPath}.attributes`);
  }

  const attributes = data.attributes as Record<string, unknown>;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    score: data.score,
    attributes: {
      costModel: validateAttributeValue(attributes.costModel, `${fieldPath}.attributes.costModel`),
      scalability: validateAttributeValue(attributes.scalability, `${fieldPath}.attributes.scalability`),
      complexity: validateAttributeValue(attributes.complexity, `${fieldPath}.attributes.complexity`),
      maintenance: validateAttributeValue(attributes.maintenance, `${fieldPath}.attributes.maintenance`),
    },
  };
}

/**
 * Validates a ComparisonResult object.
 */
function validateComparisonResult(data: unknown): ComparisonResult {
  if (!isObject(data)) {
    throw new ValidationError('Expected object for comparison result', 'comparison');
  }

  if (!Array.isArray(data.options)) {
    throw new ValidationError('Missing or invalid options array', 'comparison.options');
  }

  if (data.options.length !== 2) {
    throw new ValidationError(
      `Expected exactly 2 options, got ${data.options.length}`,
      'comparison.options'
    );
  }

  const options = data.options.map((opt, i) => validateOptionComparison(opt, i));

  return {
    options,
    matrix: isObject(data.matrix) ? (data.matrix as ComparisonResult['matrix']) : {},
  };
}

/**
 * Validates an OptionAnalysis object.
 */
function validateOptionAnalysis(data: unknown, index: number): OptionAnalysis {
  const fieldPath = `explanation.optionAnalysis[${index}]`;

  if (!isObject(data)) {
    throw new ValidationError(`Expected object for option analysis`, fieldPath);
  }

  return {
    optionId: isNonEmptyString(data.optionId) ? data.optionId : '',
    optionName: isNonEmptyString(data.optionName) ? data.optionName : 'Unknown',
    strengths: Array.isArray(data.strengths) ? data.strengths.filter(isNonEmptyString) : [],
    weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses.filter(isNonEmptyString) : [],
    fitScore: typeof data.fitScore === 'number' ? data.fitScore : 0,
    fitReason: typeof data.fitReason === 'string' ? data.fitReason : '',
  };
}

/**
 * Validates a TradeOffExplanation object.
 */
function validateTradeOffExplanation(data: unknown): TradeOffExplanation {
  if (!isObject(data)) {
    throw new ValidationError('Expected object for explanation', 'explanation');
  }

  const optionAnalysis = Array.isArray(data.optionAnalysis)
    ? data.optionAnalysis.map((a, i) => validateOptionAnalysis(a, i))
    : [];

  const constraintImpact = Array.isArray(data.constraintImpact)
    ? data.constraintImpact
        .filter(isObject)
        .map((c) => ({
          constraint: typeof c.constraint === 'string' ? c.constraint : '',
          impact: typeof c.impact === 'string' ? c.impact : '',
        }))
    : [];

  return {
    summary: typeof data.summary === 'string' ? data.summary : '',
    optionAnalysis,
    constraintImpact,
  };
}

/**
 * Validates a PivotResult object.
 */
function validatePivotResult(data: unknown): PivotResult {
  if (!isObject(data)) {
    throw new ValidationError('Expected object for pivot result', 'pivot');
  }

  return {
    statement: typeof data.statement === 'string' ? data.statement : '',
    primaryFactor: typeof data.primaryFactor === 'string' ? data.primaryFactor : '',
    secondaryFactor: typeof data.secondaryFactor === 'string' ? data.secondaryFactor : '',
    optionA: typeof data.optionA === 'string' ? data.optionA : '',
    optionB: typeof data.optionB === 'string' ? data.optionB : '',
  };
}

/**
 * Validates a complete CompareResponse from the API.
 * Provides graceful degradation for unexpected data.
 * 
 * Requirements: 7.7, 2.8
 */
export function validateCompareResponse(data: unknown): CompareResponse {
  if (!isObject(data)) {
    throw new ValidationError('Invalid response format: expected object', 'response');
  }

  if (!data.comparison) {
    throw new ValidationError('Missing comparison data in response', 'comparison');
  }

  if (!data.explanation) {
    throw new ValidationError('Missing explanation data in response', 'explanation');
  }

  if (!data.pivot) {
    throw new ValidationError('Missing pivot data in response', 'pivot');
  }

  // Build response with optional AI fields
  const response: CompareResponse = {
    comparison: validateComparisonResult(data.comparison),
    explanation: validateTradeOffExplanation(data.explanation),
    pivot: validatePivotResult(data.pivot),
  };

  // Include AI-enhanced fields if present
  if (data.aiEnhanced === true) {
    response.aiEnhanced = true;
  }

  if (isObject(data.aiAnalysis)) {
    const ai = data.aiAnalysis as Record<string, unknown>;
    response.aiAnalysis = {
      summary: typeof ai.summary === 'string' ? ai.summary : '',
      recommendation: typeof ai.recommendation === 'string' ? ai.recommendation : '',
      decisionGuidance: typeof ai.decisionGuidance === 'string' ? ai.decisionGuidance : undefined,
      personalizedInsights: Array.isArray(ai.personalizedInsights) 
        ? ai.personalizedInsights.filter((s): s is string => typeof s === 'string')
        : undefined,
      detailedAnalysis: Array.isArray(ai.detailedAnalysis) 
        ? ai.detailedAnalysis.map((a: unknown) => {
            const analysis = a as Record<string, unknown>;
            return {
              optionName: typeof analysis.optionName === 'string' ? analysis.optionName : '',
              pros: Array.isArray(analysis.pros) ? analysis.pros.filter((s): s is string => typeof s === 'string') : [],
              cons: Array.isArray(analysis.cons) ? analysis.cons.filter((s): s is string => typeof s === 'string') : [],
              bestFor: typeof analysis.bestFor === 'string' ? analysis.bestFor : '',
            };
          })
        : [],
      pivotStatement: typeof ai.pivotStatement === 'string' ? ai.pivotStatement : '',
      confidenceScore: typeof ai.confidenceScore === 'number' ? ai.confidenceScore : 0,
    };
  }

  return response;
}

/**
 * Validates a HealthResponse from the API.
 */
export function validateHealthResponse(data: unknown): HealthResponse {
  if (!isObject(data)) {
    throw new ValidationError('Invalid health response format', 'health');
  }

  const status = data.status;
  const database = data.database;

  if (status !== 'healthy' && status !== 'degraded' && status !== 'unhealthy') {
    throw new ValidationError('Invalid health status', 'health.status');
  }

  if (database !== 'connected' && database !== 'disconnected') {
    throw new ValidationError('Invalid database status', 'health.database');
  }

  return {
    status,
    database,
    timestamp: typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString(),
  };
}

/**
 * Validates an OptionsResponse from the API.
 */
export function validateOptionsResponse(data: unknown): OptionsResponse {
  if (!isObject(data)) {
    throw new ValidationError('Invalid options response format', 'options');
  }

  if (!Array.isArray(data.options)) {
    throw new ValidationError('Missing options array', 'options');
  }

  const options = data.options
    .filter(isObject)
    .map((opt) => ({
      id: isNonEmptyString(opt.id) ? opt.id : '',
      name: isNonEmptyString(opt.name) ? opt.name : 'Unknown',
      description: typeof opt.description === 'string' ? opt.description : '',
      category: typeof opt.category === 'string' ? opt.category : '',
    }))
    .filter((opt) => opt.id !== '');

  return { options };
}

/**
 * Validates an IntegrationsResponse from the API.
 */
export function validateIntegrationsResponse(data: unknown): IntegrationsResponse {
  if (!isObject(data)) {
    throw new ValidationError('Invalid integrations response format', 'integrations');
  }

  if (!Array.isArray(data.integrations)) {
    throw new ValidationError('Missing integrations array', 'integrations');
  }

  const integrations = data.integrations
    .filter(isObject)
    .map((int) => ({
      id: isNonEmptyString(int.id) ? int.id : '',
      name: isNonEmptyString(int.name) ? int.name : 'Unknown',
      category: typeof int.category === 'string' ? int.category : '',
    }))
    .filter((int) => int.id !== '');

  return { integrations };
}

/**
 * Safe wrapper that validates data and returns null on failure.
 * Useful for graceful degradation.
 */
export function safeValidate<T>(
  validator: (data: unknown) => T,
  data: unknown,
  onError?: (error: ValidationError) => void
): T | null {
  try {
    return validator(data);
  } catch (error) {
    if (error instanceof ValidationError && onError) {
      onError(error);
    }
    return null;
  }
}
