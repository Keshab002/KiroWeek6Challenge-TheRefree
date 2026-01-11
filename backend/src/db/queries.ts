import { pool } from './pool';
import {
  OptionRow,
  AttributeRow,
  WeightRow,
  IntegrationRow,
  OptionIntegrationRow,
  AppError,
} from '../types';

/**
 * Wraps database queries with error handling.
 * Converts database errors to AppError for consistent error responses.
 */
async function safeQuery<T>(
  query: string,
  params?: (string | number | boolean | null)[]
): Promise<T[]> {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    
    // Check for connection errors
    if (error && typeof error === 'object' && 'code' in error) {
      const pgError = error as { code: string };
      if (pgError.code === 'ECONNREFUSED' || pgError.code === 'ENOTFOUND') {
        throw new AppError('Database connection lost', 503, 'DATABASE_CONNECTION_ERROR');
      }
    }
    
    throw new AppError(`Database query failed: ${errorMessage}`, 500, 'DATABASE_ERROR');
  }
}

/**
 * Retrieves all options from the database.
 */
export async function getOptions(): Promise<OptionRow[]> {
  const query = `
    SELECT id, name, description, category, created_at
    FROM options
    ORDER BY category, name
  `;
  return safeQuery<OptionRow>(query);
}

/**
 * Retrieves a single option by ID.
 */
export async function getOptionById(id: string): Promise<OptionRow | null> {
  const query = `
    SELECT id, name, description, category, created_at
    FROM options
    WHERE id = $1
  `;
  const rows = await safeQuery<OptionRow>(query, [id]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Retrieves multiple options by their IDs.
 */
export async function getOptionsByIds(ids: string[]): Promise<OptionRow[]> {
  if (ids.length === 0) return [];
  
  const query = `
    SELECT id, name, description, category, created_at
    FROM options
    WHERE id = ANY($1)
  `;
  return safeQuery<OptionRow>(query, [ids as unknown as string]);
}

/**
 * Retrieves all attributes for a specific option.
 */
export async function getAttributesByOptionId(optionId: string): Promise<AttributeRow[]> {
  const query = `
    SELECT id, option_id, attribute_type, value, rating, description
    FROM attributes
    WHERE option_id = $1
  `;
  return safeQuery<AttributeRow>(query, [optionId]);
}

/**
 * Retrieves attributes for multiple options.
 */
export async function getAttributesByOptionIds(optionIds: string[]): Promise<AttributeRow[]> {
  if (optionIds.length === 0) return [];
  
  const query = `
    SELECT id, option_id, attribute_type, value, rating, description
    FROM attributes
    WHERE option_id = ANY($1)
  `;
  return safeQuery<AttributeRow>(query, [optionIds as unknown as string]);
}

/**
 * Retrieves all attribute weights.
 */
export async function getWeights(): Promise<WeightRow[]> {
  const query = `
    SELECT id, attribute_type, default_weight, 
           scalability_low_modifier, scalability_medium_modifier, scalability_high_modifier
    FROM weights
  `;
  return safeQuery<WeightRow>(query);
}

/**
 * Retrieves all available integrations.
 */
export async function getIntegrations(): Promise<IntegrationRow[]> {
  const query = `
    SELECT id, name, category
    FROM integrations
    ORDER BY category, name
  `;
  return safeQuery<IntegrationRow>(query);
}

/**
 * Retrieves integrations supported by a specific option.
 */
export async function getOptionIntegrations(optionId: string): Promise<OptionIntegrationRow[]> {
  const query = `
    SELECT option_id, integration_id, support_level
    FROM option_integrations
    WHERE option_id = $1
  `;
  return safeQuery<OptionIntegrationRow>(query, [optionId]);
}

/**
 * Retrieves integrations for multiple options.
 */
export async function getOptionIntegrationsByOptionIds(
  optionIds: string[]
): Promise<OptionIntegrationRow[]> {
  if (optionIds.length === 0) return [];
  
  const query = `
    SELECT option_id, integration_id, support_level
    FROM option_integrations
    WHERE option_id = ANY($1)
  `;
  return safeQuery<OptionIntegrationRow>(query, [optionIds as unknown as string]);
}

/**
 * Checks if an option supports all required integrations.
 */
export async function optionSupportsIntegrations(
  optionId: string,
  requiredIntegrationIds: string[]
): Promise<boolean> {
  if (requiredIntegrationIds.length === 0) return true;
  
  const query = `
    SELECT COUNT(DISTINCT integration_id) as count
    FROM option_integrations
    WHERE option_id = $1 AND integration_id = ANY($2)
  `;
  const rows = await safeQuery<{ count: string }>(query, [
    optionId,
    requiredIntegrationIds as unknown as string,
  ]);
  
  return parseInt(rows[0]?.count || '0', 10) === requiredIntegrationIds.length;
}
