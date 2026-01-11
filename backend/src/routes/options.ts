import { Router, Request, Response } from 'express';
import { getOptions, getIntegrations, getOptionIntegrationsByOptionIds } from '../db/queries';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/options
 * Returns all available options for comparison.
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const options = await getOptions();
    
    res.json({
      options: options.map((opt) => ({
        id: opt.id,
        name: opt.name,
        description: opt.description,
        category: opt.category,
      })),
    });
  })
);

/**
 * GET /api/options/integrations
 * Returns all available integrations.
 */
router.get(
  '/integrations',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const integrations = await getIntegrations();
    
    res.json({
      integrations: integrations.map((int) => ({
        id: int.id,
        name: int.name,
        category: int.category,
      })),
    });
  })
);

/**
 * GET /api/options/supported-integrations?optionIds=id1,id2
 * Returns integrations supported by ALL specified options.
 */
router.get(
  '/supported-integrations',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const optionIdsParam = req.query.optionIds as string;
    
    if (!optionIdsParam) {
      // Return all integrations if no options specified
      const integrations = await getIntegrations();
      res.json({
        integrations: integrations.map((int) => ({
          id: int.id,
          name: int.name,
          category: int.category,
        })),
      });
      return;
    }

    const optionIds = optionIdsParam.split(',').filter(id => id.trim());
    
    if (optionIds.length === 0) {
      const integrations = await getIntegrations();
      res.json({
        integrations: integrations.map((int) => ({
          id: int.id,
          name: int.name,
          category: int.category,
        })),
      });
      return;
    }

    // Get integrations supported by each option
    const optionIntegrations = await getOptionIntegrationsByOptionIds(optionIds);
    const allIntegrations = await getIntegrations();

    // Find integrations supported by ALL selected options
    const integrationCounts = new Map<string, number>();
    
    for (const oi of optionIntegrations) {
      const count = integrationCounts.get(oi.integration_id) || 0;
      integrationCounts.set(oi.integration_id, count + 1);
    }

    // Only include integrations supported by ALL options
    const supportedIntegrationIds = Array.from(integrationCounts.entries())
      .filter(([_, count]) => count >= optionIds.length)
      .map(([id]) => id);

    const supportedIntegrations = allIntegrations.filter(int => 
      supportedIntegrationIds.includes(int.id)
    );

    res.json({
      integrations: supportedIntegrations.map((int) => ({
        id: int.id,
        name: int.name,
        category: int.category,
      })),
    });
  })
);

export default router;
