import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

export const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err);
});

/**
 * Validates database connection on startup.
 * Fails fast with readable error if DB is unreachable.
 */
export async function validateDatabaseConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      console.log('✓ Database connection verified');
    } finally {
      client.release();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('═══════════════════════════════════════════════════════════');
    console.error('FATAL: Database connection failed');
    console.error('═══════════════════════════════════════════════════════════');
    console.error(`Error: ${errorMessage}`);
    console.error('');
    console.error('Please verify:');
    console.error('  1. DATABASE_URL environment variable is set correctly');
    console.error('  2. PostgreSQL server is running and accessible');
    console.error('  3. Database credentials are correct');
    console.error('  4. Network/firewall allows the connection');
    console.error('═══════════════════════════════════════════════════════════');
    process.exit(1);
  }
}

/**
 * Gracefully closes the database pool.
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('Database pool closed');
}
