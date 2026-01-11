import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { ErrorResponse } from '../types';

/**
 * Zod schema for constraint validation.
 */
export const ConstraintsSchema = z.object({
  budgetMin: z
    .number({ required_error: 'budgetMin is required' })
    .min(0, 'budgetMin must be non-negative'),
  budgetMax: z
    .number({ required_error: 'budgetMax is required' })
    .min(0, 'budgetMax must be non-negative'),
  scalabilityPriority: z.enum(['low', 'medium', 'high'], {
    required_error: 'scalabilityPriority is required',
    invalid_type_error: 'scalabilityPriority must be one of: low, medium, high',
  }),
  requiredIntegrations: z
    .array(z.string().uuid('Each integration ID must be a valid UUID'))
    .default([]),
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: 'budgetMax must be greater than or equal to budgetMin',
  path: ['budgetMax'],
});

/**
 * Zod schema for compare request validation.
 */
export const CompareRequestSchema = z.object({
  constraints: ConstraintsSchema,
  optionIds: z
    .tuple([
      z.string().uuid('First option ID must be a valid UUID'),
      z.string().uuid('Second option ID must be a valid UUID'),
    ])
    .refine((ids) => ids[0] !== ids[1], {
      message: 'Option IDs must be different',
    }),
});

/**
 * Type inference from schema.
 */
export type ValidatedCompareRequest = z.infer<typeof CompareRequestSchema>;

/**
 * Formats Zod validation errors into a readable structure.
 */
function formatZodErrors(error: ZodError): Record<string, string> {
  const details: Record<string, string> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    details[path || 'root'] = issue.message;
  }
  
  return details;
}

/**
 * Creates a validation middleware for a given Zod schema.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errorResponse: ErrorResponse = {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: formatZodErrors(result.error),
          timestamp: new Date().toISOString(),
        };
        
        res.status(400).json(errorResponse);
        return;
      }
      
      // Attach validated data to request
      req.body = result.data;
      next();
    } catch (err) {
      // Handle unexpected errors during validation
      const errorResponse: ErrorResponse = {
        error: 'Invalid request body',
        code: 'PARSE_ERROR',
        details: { body: 'Request body must be valid JSON' },
        timestamp: new Date().toISOString(),
      };
      
      res.status(400).json(errorResponse);
    }
  };
}

/**
 * Middleware to validate compare request body.
 */
export const validateCompareRequest = validateBody(CompareRequestSchema);

/**
 * Validates query parameters for UUID format.
 */
export function validateUuidParam(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    
    if (!value) {
      const errorResponse: ErrorResponse = {
        error: `Missing required parameter: ${paramName}`,
        code: 'VALIDATION_ERROR',
        details: { [paramName]: 'Parameter is required' },
        timestamp: new Date().toISOString(),
      };
      
      res.status(400).json(errorResponse);
      return;
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(value)) {
      const errorResponse: ErrorResponse = {
        error: `Invalid ${paramName} format`,
        code: 'VALIDATION_ERROR',
        details: { [paramName]: 'Must be a valid UUID' },
        timestamp: new Date().toISOString(),
      };
      
      res.status(400).json(errorResponse);
      return;
    }
    
    next();
  };
}
