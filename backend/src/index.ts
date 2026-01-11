import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { validateDatabaseConnection, closePool } from './db/pool';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import optionsRoutes from './routes/options';
import compareRoutes from './routes/compare';
import adminRoutes from './routes/admin';

// Load environment variables
dotenv.config();

// Environment variable validation
interface EnvConfig {
  DATABASE_URL: string;
  PORT: number;
  FRONTEND_URL: string;
}

function validateEnvironment(): EnvConfig {
  const errors: string[] = [];
  
  // Required: DATABASE_URL
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required but not set');
  }
  
  // Optional with defaults
  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push(`PORT must be a valid port number (1-65535), got: ${process.env.PORT}`);
  }
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    new URL(frontendUrl);
  } catch {
    errors.push(`FRONTEND_URL must be a valid URL, got: ${frontendUrl}`);
  }
  
  if (errors.length > 0) {
    console.error('═══════════════════════════════════════════════════════════');
    console.error('  FATAL: Environment configuration errors');
    console.error('═══════════════════════════════════════════════════════════');
    errors.forEach(err => console.error(`  ✗ ${err}`));
    console.error('');
    console.error('  Please check your .env file or environment variables.');
    console.error('  See .env.example for required configuration.');
    console.error('═══════════════════════════════════════════════════════════');
    process.exit(1);
  }
  
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    PORT: port,
    FRONTEND_URL: frontendUrl,
  };
}

// Validate environment before anything else
const config = validateEnvironment();

const app = express();
const PORT = config.PORT;

// CORS configuration - allow frontend origin
const FRONTEND_URL = config.FRONTEND_URL;
const corsOptions: cors.CorsOptions = {
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/options', optionsRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Startup function
async function start(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  The Referee - Decision Support API');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('Environment configuration:');
  console.log(`  DATABASE_URL: ${config.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`  PORT: ${config.PORT}`);
  console.log(`  FRONTEND_URL: ${config.FRONTEND_URL}`);
  console.log('');

  // Validate database connection before starting server
  await validateDatabaseConnection();

  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ CORS enabled for: ${FRONTEND_URL}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  GET  /api/health       - Health check`);
    console.log(`  GET  /api/options      - List all options`);
    console.log(`  GET  /api/options/integrations - List all integrations`);
    console.log(`  POST /api/compare      - Compare two options`);
    console.log('═══════════════════════════════════════════════════════════');
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await closePool();
  process.exit(0);
});

// Start the server
start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
