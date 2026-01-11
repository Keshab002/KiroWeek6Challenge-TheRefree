import { Router, Request, Response } from 'express';
import {
  getOptionsByIds,
  getAttributesByOptionIds,
  getWeights,
  getOptionIntegrationsByOptionIds,
} from '../db/queries';
import { compare } from '../services/comparisonEngine';
import { generate, generatePivot } from '../services/explanationGenerator';
import { enhanceWithAI, generateFullAIComparison } from '../services/aiComparison';
import { validateCompareRequest, ValidatedCompareRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError, CompareResponse } from '../types';

const router = Router();

/**
 * POST /api/compare
 * Compares two options based on user constraints.
 * Query param: useAI=true for full AI comparison
 * Returns comparison matrix, trade-off explanation, and pivot statement.
 */
router.post(
  '/',
  validateCompareRequest,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { constraints, optionIds, additionalContext } = req.body as ValidatedCompareRequest & { additionalContext?: string };
    const useAI = req.query.useAI === 'true';

    // Fetch options from database
    const options = await getOptionsByIds(optionIds);

    // Validate that both options exist
    if (options.length !== 2) {
      const foundIds = options.map((o) => o.id);
      const missingIds = optionIds.filter((id) => !foundIds.includes(id));
      throw new AppError(
        `Option(s) not found: ${missingIds.join(', ')}`,
        404,
        'NOT_FOUND'
      );
    }

    // Fetch related data
    const [attributes, weights, optionIntegrations] = await Promise.all([
      getAttributesByOptionIds(optionIds),
      getWeights(),
      getOptionIntegrationsByOptionIds(optionIds),
    ]);

    // Run comparison engine
    const comparisonResult = compare({
      options,
      attributes,
      weights,
      optionIntegrations,
      constraints,
    });

    // Check if options were filtered out due to integration requirements
    if (comparisonResult.options.length < 2) {
      throw new AppError(
        'One or both options do not support the required integrations',
        400,
        'VALIDATION_ERROR'
      );
    }

    // Generate explanations
    const explanation = generate(comparisonResult, constraints);
    const pivot = generatePivot(comparisonResult, constraints, weights);

    // If useAI=true, do full AI comparison
    if (useAI) {
      const aiResult = await generateFullAIComparison(comparisonResult, constraints, additionalContext);
      
      if (aiResult) {
        const response: CompareResponse = {
          comparison: comparisonResult,
          explanation: {
            ...explanation,
            summary: aiResult.summary,
            optionAnalysis: explanation.optionAnalysis.map((analysis, index) => {
              const aiAnalysis = aiResult.detailedAnalysis[index];
              if (aiAnalysis) {
                return {
                  ...analysis,
                  strengths: aiAnalysis.pros,
                  weaknesses: aiAnalysis.cons,
                  fitReason: aiAnalysis.bestFor,
                };
              }
              return analysis;
            }),
          },
          pivot: {
            ...pivot,
            statement: aiResult.pivotStatement,
          },
          aiEnhanced: true,
          aiAnalysis: aiResult,
        };
        res.json(response);
        return;
      }
    }

    // Standard comparison (no AI or AI failed)
    const response: CompareResponse = {
      comparison: comparisonResult,
      explanation,
      pivot,
      aiEnhanced: false,
    };

    res.json(response);
  })
);

export default router;
