import {
  Constraints,
  OptionRow,
  AttributeRow,
  WeightRow,
  OptionIntegrationRow,
  ComparisonResult,
  OptionComparison,
  AttributeValue,
  AttributeMatrix,
} from '../types';

// Rating to numeric score mapping
const RATING_SCORES: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

// Attribute type to icon mapping
const ATTRIBUTE_ICONS: Record<string, string> = {
  cost_model: '💰',
  scalability: '📈',
  complexity: '⚙️',
  maintenance: '🔧',
};

/**
 * Gets the scalability modifier key based on priority.
 */
function getScalabilityModifierKey(
  priority: 'low' | 'medium' | 'high'
): 'scalability_low_modifier' | 'scalability_medium_modifier' | 'scalability_high_modifier' {
  const modifierMap = {
    low: 'scalability_low_modifier' as const,
    medium: 'scalability_medium_modifier' as const,
    high: 'scalability_high_modifier' as const,
  };
  return modifierMap[priority];
}

/**
 * Calculates the effective weight for an attribute based on constraints.
 */
function calculateEffectiveWeight(
  weight: WeightRow,
  constraints: Constraints
): number {
  const modifierKey = getScalabilityModifierKey(constraints.scalabilityPriority);
  const modifier = Number(weight[modifierKey]) || 1.0;
  return Number(weight.default_weight) * modifier;
}

/**
 * Checks if an option supports all required integrations.
 * Returns true if no integrations required OR option supports all required ones.
 */
function optionSupportsRequiredIntegrations(
  optionId: string,
  optionIntegrations: OptionIntegrationRow[],
  requiredIntegrations: string[]
): boolean {
  // If no integrations required, always pass
  if (requiredIntegrations.length === 0) return true;
  
  const supportedIntegrationIds = optionIntegrations
    .filter((oi) => oi.option_id === optionId)
    .map((oi) => oi.integration_id);
  
  // If option has no integration mappings at all, assume it supports everything
  // (this handles newly added options that haven't been mapped yet)
  if (supportedIntegrationIds.length === 0) return true;
  
  return requiredIntegrations.every((reqId) =>
    supportedIntegrationIds.includes(reqId)
  );
}

/**
 * Converts an attribute row to an AttributeValue.
 */
function toAttributeValue(attr: AttributeRow): AttributeValue {
  return {
    value: attr.value,
    rating: attr.rating,
    icon: ATTRIBUTE_ICONS[attr.attribute_type] || '📊',
  };
}

/**
 * Calculates the weighted score for an option.
 */
function calculateOptionScore(
  attributes: AttributeRow[],
  weights: WeightRow[],
  constraints: Constraints
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const attr of attributes) {
    const weight = weights.find((w) => w.attribute_type === attr.attribute_type);
    if (!weight) continue;

    const effectiveWeight = calculateEffectiveWeight(weight, constraints);
    const ratingScore = RATING_SCORES[attr.rating] || 0;
    
    totalScore += ratingScore * effectiveWeight;
    totalWeight += effectiveWeight;
  }

  // Normalize score to 0-100 range
  if (totalWeight === 0) return 0;
  return Math.round((totalScore / (totalWeight * 3)) * 100);
}

/**
 * Builds the attribute matrix for comparison visualization.
 */
function buildAttributeMatrix(
  options: OptionRow[],
  attributes: AttributeRow[]
): AttributeMatrix {
  const matrix: AttributeMatrix = {};
  const attributeTypes = ['cost_model', 'scalability', 'complexity', 'maintenance'];

  for (const attrType of attributeTypes) {
    matrix[attrType] = {};
    for (const option of options) {
      const attr = attributes.find(
        (a) => a.option_id === option.id && a.attribute_type === attrType
      );
      if (attr) {
        matrix[attrType][option.id] = toAttributeValue(attr);
      }
    }
  }

  return matrix;
}

/**
 * Builds an OptionComparison object for a single option.
 */
function buildOptionComparison(
  option: OptionRow,
  attributes: AttributeRow[],
  weights: WeightRow[],
  constraints: Constraints
): OptionComparison {
  const optionAttrs = attributes.filter((a) => a.option_id === option.id);
  
  const getAttrValue = (type: string): AttributeValue => {
    const attr = optionAttrs.find((a) => a.attribute_type === type);
    if (attr) return toAttributeValue(attr);
    return { value: 'N/A', rating: 'medium', icon: '❓' };
  };

  return {
    id: option.id,
    name: option.name,
    description: option.description,
    attributes: {
      costModel: getAttrValue('cost_model'),
      scalability: getAttrValue('scalability'),
      complexity: getAttrValue('complexity'),
      maintenance: getAttrValue('maintenance'),
    },
    score: calculateOptionScore(optionAttrs, weights, constraints),
  };
}

export interface ComparisonEngineInput {
  options: OptionRow[];
  attributes: AttributeRow[];
  weights: WeightRow[];
  optionIntegrations: OptionIntegrationRow[];
  constraints: Constraints;
}

/**
 * Main comparison engine that computes trade-off scores.
 */
export function compare(input: ComparisonEngineInput): ComparisonResult {
  const { options, attributes, weights, optionIntegrations, constraints } = input;

  // Filter options by required integrations
  const filteredOptions = options.filter((option) =>
    optionSupportsRequiredIntegrations(
      option.id,
      optionIntegrations,
      constraints.requiredIntegrations
    )
  );

  // Build comparison for each option
  const optionComparisons = filteredOptions.map((option) =>
    buildOptionComparison(option, attributes, weights, constraints)
  );

  // Build attribute matrix
  const matrix = buildAttributeMatrix(filteredOptions, attributes);

  return {
    options: optionComparisons,
    matrix,
  };
}

/**
 * Gets the effective weights for all attributes based on constraints.
 * Useful for explanation generation.
 */
export function getEffectiveWeights(
  weights: WeightRow[],
  constraints: Constraints
): Map<string, number> {
  const effectiveWeights = new Map<string, number>();
  
  for (const weight of weights) {
    effectiveWeights.set(
      weight.attribute_type,
      calculateEffectiveWeight(weight, constraints)
    );
  }
  
  return effectiveWeights;
}

/**
 * Determines which attribute has the highest effective weight.
 */
export function getPrimaryAttribute(
  weights: WeightRow[],
  constraints: Constraints
): string {
  const effectiveWeights = getEffectiveWeights(weights, constraints);
  let maxWeight = 0;
  let primaryAttr = 'scalability';

  for (const [attr, weight] of effectiveWeights) {
    if (weight > maxWeight) {
      maxWeight = weight;
      primaryAttr = attr;
    }
  }

  return primaryAttr;
}
