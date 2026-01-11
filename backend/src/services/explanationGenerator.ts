import {
  Constraints,
  ComparisonResult,
  TradeOffExplanation,
  OptionAnalysis,
  ConstraintImpact,
  PivotResult,
  OptionComparison,
  WeightRow,
} from '../types';
import { getEffectiveWeights, getPrimaryAttribute } from './comparisonEngine';

// Human-readable attribute names
const ATTRIBUTE_NAMES: Record<string, string> = {
  cost_model: 'cost efficiency',
  scalability: 'scalability',
  complexity: 'operational simplicity',
  maintenance: 'maintenance overhead',
};

// Rating descriptions for strengths/weaknesses
const RATING_DESCRIPTIONS: Record<string, Record<string, string>> = {
  cost_model: {
    high: 'excellent cost efficiency',
    medium: 'moderate cost structure',
    low: 'higher cost requirements',
  },
  scalability: {
    high: 'excellent scalability characteristics',
    medium: 'adequate scaling capabilities',
    low: 'limited scalability options',
  },
  complexity: {
    high: 'straightforward operations',
    medium: 'manageable complexity',
    low: 'significant operational complexity',
  },
  maintenance: {
    high: 'minimal maintenance burden',
    medium: 'standard maintenance needs',
    low: 'substantial maintenance requirements',
  },
};

/**
 * Determines strengths for an option based on high-rated attributes.
 */
function getStrengths(option: OptionComparison): string[] {
  const strengths: string[] = [];
  const attrs = option.attributes;

  if (attrs.costModel.rating === 'high') {
    strengths.push(RATING_DESCRIPTIONS.cost_model.high);
  }
  if (attrs.scalability.rating === 'high') {
    strengths.push(RATING_DESCRIPTIONS.scalability.high);
  }
  if (attrs.complexity.rating === 'high') {
    strengths.push(RATING_DESCRIPTIONS.complexity.high);
  }
  if (attrs.maintenance.rating === 'high') {
    strengths.push(RATING_DESCRIPTIONS.maintenance.high);
  }

  return strengths.length > 0 ? strengths : ['balanced performance across attributes'];
}

/**
 * Determines weaknesses for an option based on low-rated attributes.
 */
function getWeaknesses(option: OptionComparison): string[] {
  const weaknesses: string[] = [];
  const attrs = option.attributes;

  if (attrs.costModel.rating === 'low') {
    weaknesses.push(RATING_DESCRIPTIONS.cost_model.low);
  }
  if (attrs.scalability.rating === 'low') {
    weaknesses.push(RATING_DESCRIPTIONS.scalability.low);
  }
  if (attrs.complexity.rating === 'low') {
    weaknesses.push(RATING_DESCRIPTIONS.complexity.low);
  }
  if (attrs.maintenance.rating === 'low') {
    weaknesses.push(RATING_DESCRIPTIONS.maintenance.low);
  }

  return weaknesses.length > 0 ? weaknesses : ['no significant weaknesses identified'];
}

/**
 * Generates a fit reason based on score and constraints.
 */
function generateFitReason(
  option: OptionComparison,
  constraints: Constraints
): string {
  const { scalabilityPriority } = constraints;
  const scalabilityRating = option.attributes.scalability.rating;

  if (scalabilityPriority === 'high' && scalabilityRating === 'high') {
    return `Strong fit for high-scalability requirements with ${scalabilityRating} scalability rating`;
  }
  if (scalabilityPriority === 'low' && option.attributes.costModel.rating === 'high') {
    return 'Well-suited for cost-conscious scenarios with excellent cost efficiency';
  }
  if (option.score >= 70) {
    return 'Good overall fit based on weighted attribute scores';
  }
  if (option.score >= 50) {
    return 'Moderate fit with some trade-offs to consider';
  }
  return 'May require careful consideration of trade-offs for your constraints';
}

/**
 * Analyzes a single option for the trade-off explanation.
 */
function analyzeOption(
  option: OptionComparison,
  constraints: Constraints
): OptionAnalysis {
  return {
    optionId: option.id,
    optionName: option.name,
    strengths: getStrengths(option),
    weaknesses: getWeaknesses(option),
    fitScore: option.score,
    fitReason: generateFitReason(option, constraints),
  };
}

/**
 * Generates constraint impact descriptions.
 */
function generateConstraintImpacts(constraints: Constraints): ConstraintImpact[] {
  const impacts: ConstraintImpact[] = [];

  // Budget impact
  impacts.push({
    constraint: 'Budget Range',
    impact: `Budget constraints ($${constraints.budgetMin}-$${constraints.budgetMax}) influence cost model weighting`,
  });

  // Scalability priority impact
  const scalabilityImpacts: Record<string, string> = {
    low: 'Lower scalability priority reduces weight on scaling capabilities, favoring cost efficiency',
    medium: 'Balanced scalability priority maintains equal consideration across attributes',
    high: 'High scalability priority increases weight on scaling capabilities significantly',
  };
  impacts.push({
    constraint: 'Scalability Priority',
    impact: scalabilityImpacts[constraints.scalabilityPriority],
  });

  // Integration requirements impact
  if (constraints.requiredIntegrations.length > 0) {
    impacts.push({
      constraint: 'Required Integrations',
      impact: `${constraints.requiredIntegrations.length} required integration(s) filter available options`,
    });
  }

  return impacts;
}

/**
 * Generates the summary text for the trade-off explanation.
 */
function generateSummary(
  comparison: ComparisonResult,
  constraints: Constraints
): string {
  const options = comparison.options;
  
  if (options.length < 2) {
    return 'Insufficient options available for comparison based on current constraints.';
  }

  const [optionA, optionB] = options;
  const scoreDiff = Math.abs(optionA.score - optionB.score);

  if (scoreDiff < 10) {
    return `${optionA.name} and ${optionB.name} are closely matched under your current constraints. ` +
      `The decision depends on which specific attributes matter most to your use case.`;
  }

  const higher = optionA.score > optionB.score ? optionA : optionB;
  const lower = optionA.score > optionB.score ? optionB : optionA;

  return `Based on your constraints, ${higher.name} shows a stronger fit (score: ${higher.score}) ` +
    `compared to ${lower.name} (score: ${lower.score}). However, ${lower.name} may be preferable ` +
    `if certain attributes are more critical to your specific needs.`;
}

/**
 * Main function to generate trade-off explanations.
 */
export function generate(
  comparison: ComparisonResult,
  constraints: Constraints
): TradeOffExplanation {
  const optionAnalysis = comparison.options.map((option) =>
    analyzeOption(option, constraints)
  );

  return {
    summary: generateSummary(comparison, constraints),
    optionAnalysis,
    constraintImpact: generateConstraintImpacts(constraints),
  };
}

/**
 * Generates the pivot statement for decision-making.
 * Format: "If X matters more than Y, choose A; otherwise choose B"
 */
export function generatePivot(
  comparison: ComparisonResult,
  constraints: Constraints,
  weights: WeightRow[]
): PivotResult {
  const options = comparison.options;

  if (options.length < 2) {
    return {
      statement: 'Unable to generate pivot statement with fewer than two options.',
      primaryFactor: 'N/A',
      secondaryFactor: 'N/A',
      optionA: options[0]?.name || 'N/A',
      optionB: 'N/A',
    };
  }

  const [optionA, optionB] = options;
  
  // Determine primary differentiating factors
  const primaryAttr = getPrimaryAttribute(weights, constraints);
  const effectiveWeights = getEffectiveWeights(weights, constraints);
  
  // Find secondary factor (second highest weight)
  let secondaryAttr = 'cost_model';
  let secondHighestWeight = 0;
  for (const [attr, weight] of effectiveWeights) {
    if (attr !== primaryAttr && weight > secondHighestWeight) {
      secondHighestWeight = weight;
      secondaryAttr = attr;
    }
  }

  const primaryName = ATTRIBUTE_NAMES[primaryAttr] || primaryAttr;
  const secondaryName = ATTRIBUTE_NAMES[secondaryAttr] || secondaryAttr;

  // Determine which option is better for which factor
  const attrKeyMap: Record<string, keyof typeof optionA.attributes> = {
    cost_model: 'costModel',
    scalability: 'scalability',
    complexity: 'complexity',
    maintenance: 'maintenance',
  };

  const primaryKey = attrKeyMap[primaryAttr] || 'scalability';
  const secondaryKey = attrKeyMap[secondaryAttr] || 'costModel';

  const aRatingPrimary = optionA.attributes[primaryKey].rating;
  const bRatingPrimary = optionB.attributes[primaryKey].rating;
  const aRatingSecondary = optionA.attributes[secondaryKey].rating;
  const bRatingSecondary = optionB.attributes[secondaryKey].rating;

  // Determine recommendations based on attribute strengths
  let recommendForPrimary = optionA.name;
  let recommendForSecondary = optionB.name;

  const ratingValue = { low: 1, medium: 2, high: 3 };
  
  if (ratingValue[bRatingPrimary] > ratingValue[aRatingPrimary]) {
    recommendForPrimary = optionB.name;
    recommendForSecondary = optionA.name;
  } else if (ratingValue[aRatingSecondary] > ratingValue[bRatingSecondary]) {
    recommendForSecondary = optionA.name;
    if (recommendForPrimary === optionA.name) {
      recommendForSecondary = optionB.name;
    }
  }

  // Ensure we don't recommend the same option for both factors
  if (recommendForPrimary === recommendForSecondary) {
    recommendForSecondary = recommendForPrimary === optionA.name ? optionB.name : optionA.name;
  }

  const statement = `If ${primaryName} matters more than ${secondaryName}, ` +
    `choose ${recommendForPrimary}; otherwise choose ${recommendForSecondary}`;

  return {
    statement,
    primaryFactor: primaryName,
    secondaryFactor: secondaryName,
    optionA: optionA.name,
    optionB: optionB.name,
  };
}
