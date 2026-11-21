/**
-- ==============================================================================
-- PRINT PLATFORM BACKEND (EXPRESS APPLICATION ENTRYPOINT)
-- ==============================================================================
*/

import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { getEnv } from './configs/env';

// 1. Export core modules & configs for reusability
export * from './configs/constants';
export * from './configs/env';
export * from './configs/supabase';
export * from './types/database.types';
export * from './middlewares';
export * from './tables';
export * from './services/notificationService';
export * from './utils/pricing';
export * from './utils/orderCode';
export * from './utils/validation';
export * from './utils/xeroExport';
export * from './utils/printFileGenerator';
export * from './utils/response';
export * from './controllers';
export { default as apiRoutes } from './routes';

// 2. Initialize Express App
const app: Application = express();

// 3. Global Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, server-to-server) or Vercel deployments
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        // Fallback allow for dynamic preview URLs
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-test-user-id'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 5. Mount Root API Router
app.use('/api', apiRoutes);

// 6. 404 Handler for undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

export default app;
export { app };

// If executed directly, start listening
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Print Platform Express API Server listening on port ${PORT}`);
  });
}
