import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import catalogRouter from './modules/catalog/router';
import articlesRouter from './modules/articles/router';
import homeRouter from './modules/home/router';
import cartRouter from './modules/cart/router';
import metaRouter from './modules/meta/router';
import adminRouter from './modules/admin/router';
import adminAuthRouter from './modules/admin/auth';
import publicRouter from './routes/public';
import userRouter from './routes/user';
import orderRouter from './routes/order';

export function createApp() {
  const app = express();

  // 1. Trust proxy (if behind Nginx)
  app.set('trust proxy', 1);

  // 2. Security middleware
  app.use(helmet());

  // 3. Logging middleware
  app.use(pinoHttp());

  // 4. Body parsing middleware
  app.use(express.json({ limit: '1mb' }));

  // 5. CORS middleware - simplified for development
  app.use(cors({ 
    origin: ['http://localhost:3000'], 
    credentials: true 
  }));

  // 6. Rate limiting on read-only paths only
  app.use(['/v1/home', '/v1/products', '/v1/articles', '/v1/meta'], rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }));

  // 7. API Routers - ensure these are all Router functions
  app.use('/v1/products', catalogRouter);
  app.use('/v1/home', homeRouter);
  app.use('/v1/cart', cartRouter);
  app.use('/v1/meta', metaRouter);
  app.use('/v1/articles', articlesRouter);
  app.use('/v1/admin', adminRouter);
  app.use('/api/admin/auth', adminAuthRouter);
  
  // Public API routes
  app.use('/api/public', publicRouter);
  app.use('/api/user', userRouter);
  app.use('/api/order', orderRouter);

  // 8. Base routes
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // 9. Home endpoint for Next.js
  app.get('/api/home', async (_req, res) => {
    res.json({ 
      ok: true, 
      message: 'home data',
      price: null,
      products: [],
      articles: []
    });
  });

  // 10. 404 handler
  app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

  // 11. Error handler
  app.use((err: any, req: any, res: any, _next: any) => {
    req?.log?.error?.(err);
    const status = Number(err?.status || 500);
    const isDev = process.env.NODE_ENV !== 'production';

    res.status(status).json({
      error: isDev ? String(err?.message || 'Error') : 'Internal Server Error',
      // Show stack only in dev
      details: isDev ? String(err?.stack || '') : undefined,
    });
  });

  return app;
}
