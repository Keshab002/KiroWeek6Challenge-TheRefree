import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { HealthResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint to verify API and database status.
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    let databaseStatus: 'connected' | 'disconnected' = 'disconnected';

    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
        databaseStatus = 'connected';
      } finally {
        client.release();
      }
    } catch {
      databaseStatus = 'disconnected';
    }

    const status = databaseStatus === 'connected' ? 'healthy' : 'unhealthy';

    const response: HealthResponse = {
      status,
      database: databaseStatus,
      timestamp: new Date().toISOString(),
    };

    const httpStatus = status === 'healthy' ? 200 : 503;
    res.status(httpStatus).json(response);
  })
);

export default router;
