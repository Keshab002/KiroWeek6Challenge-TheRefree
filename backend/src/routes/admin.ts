import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../types';
import { z } from 'zod';
import { generateOptionDetails } from '../services/aiGenerator';
import { suggestIntegrations, generateOptionDetails as generateOptionDetailsAI } from '../services/aiComparison';

const router = Router();

// Validation schemas
const CreateOptionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1),
  category: z.string().min(1).max(50),
  attributes: z.object({
    cost_model: z.object({
      value: z.string(),
      rating: z.enum(['low', 'medium', 'high']),
      description: z.string().optional(),
    }),
    scalability: z.object({
      value: z.string(),
      rating: z.enum(['low', 'medium', 'high']),
      description: z.string().optional(),
    }),
    complexity: z.object({
      value: z.string(),
      rating: z.enum(['low', 'medium', 'high']),
      description: z.string().optional(),
    }),
    maintenance: z.object({
      value: z.string(),
      rating: z.enum(['low', 'medium', 'high']),
      description: z.string().optional(),
    }),
  }),
  integrations: z.array(z.string().uuid()).optional(),
});

const CreateIntegrationSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
});

/**
 * POST /api/admin/generate
 * Generate option details using AI
 */
router.post(
  '/generate',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      throw new AppError('Option name is required', 400, 'VALIDATION_ERROR');
    }

    // Try aiComparison first (uses Groq), fallback to aiGenerator
    let generated = await generateOptionDetailsAI(name);
    if (!generated) {
      generated = await generateOptionDetails(name);
    }
    res.json(generated);
  })
);

/**
 * POST /api/admin/suggest-integrations
 * Get AI suggestions for integrations
 */
router.post(
  '/suggest-integrations',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { optionName, useCase } = req.body;
    
    if (!optionName || typeof optionName !== 'string') {
      throw new AppError('Option name is required', 400, 'VALIDATION_ERROR');
    }

    const suggestions = await suggestIntegrations(optionName, useCase || 'general use');
    res.json({ suggestions });
  })
);

/**
 * GET /api/admin/options
 * Get all options with their attributes
 */
router.get(
  '/options',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const optionsResult = await pool.query(`
      SELECT o.id, o.name, o.description, o.category, o.created_at,
        json_agg(json_build_object(
          'type', a.attribute_type,
          'value', a.value,
          'rating', a.rating,
          'description', a.description
        )) as attributes
      FROM options o
      LEFT JOIN attributes a ON o.id = a.option_id
      GROUP BY o.id
      ORDER BY o.category, o.name
    `);

    res.json({ options: optionsResult.rows });
  })
);

/**
 * POST /api/admin/options
 * Create a new option with attributes
 */
router.post(
  '/options',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validation = CreateOptionSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError('Invalid option data', 400, 'VALIDATION_ERROR');
    }

    const { name, description, category, attributes, integrations } = validation.data;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert option
      const optionResult = await client.query(
        'INSERT INTO options (name, description, category) VALUES ($1, $2, $3) RETURNING id',
        [name, description, category]
      );
      const optionId = optionResult.rows[0].id;

      // Insert attributes
      for (const [attrType, attr] of Object.entries(attributes)) {
        await client.query(
          'INSERT INTO attributes (option_id, attribute_type, value, rating, description) VALUES ($1, $2, $3, $4, $5)',
          [optionId, attrType, attr.value, attr.rating, attr.description || null]
        );
      }

      // Auto-add ALL existing integrations to new option
      await client.query(`
        INSERT INTO option_integrations (option_id, integration_id, support_level)
        SELECT $1, id, 'native' FROM integrations
      `, [optionId]);

      await client.query('COMMIT');

      res.status(201).json({ id: optionId, message: 'Option created successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  })
);

/**
 * DELETE /api/admin/options/:id
 * Delete an option
 */
router.delete(
  '/options/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM options WHERE id = $1 RETURNING id', [id]);
    
    if (result.rowCount === 0) {
      throw new AppError('Option not found', 404, 'NOT_FOUND');
    }

    res.json({ message: 'Option deleted successfully' });
  })
);

/**
 * GET /api/admin/integrations
 * Get all integrations
 */
router.get(
  '/integrations',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await pool.query('SELECT * FROM integrations ORDER BY category, name');
    res.json({ integrations: result.rows });
  })
);

/**
 * POST /api/admin/integrations
 * Create a new integration
 */
router.post(
  '/integrations',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validation = CreateIntegrationSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError('Invalid integration data', 400, 'VALIDATION_ERROR');
    }

    const { name, category } = validation.data;

    const result = await pool.query(
      'INSERT INTO integrations (name, category) VALUES ($1, $2) RETURNING id',
      [name, category]
    );

    // Add this integration to all existing options
    await pool.query(`
      INSERT INTO option_integrations (option_id, integration_id, support_level)
      SELECT id, $1, 'native' FROM options
    `, [result.rows[0].id]);

    res.status(201).json({ id: result.rows[0].id, message: 'Integration created successfully' });
  })
);

/**
 * DELETE /api/admin/integrations/:id
 * Delete an integration
 */
router.delete(
  '/integrations/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM integrations WHERE id = $1 RETURNING id', [id]);
    
    if (result.rowCount === 0) {
      throw new AppError('Integration not found', 404, 'NOT_FOUND');
    }

    res.json({ message: 'Integration deleted successfully' });
  })
);

export default router;
