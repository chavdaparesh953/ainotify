import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import requestLogger from './middlewares/requestLogger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  // 1. Security & Diagnostic Middlewares
  app.use(helmet());
  app.use(cors());
  app.use(requestLogger);

  // 2. Body Parsing (Preserves rawBody Buffer for downstream webhook HMAC validation)
  app.use(
    express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 3. Application Routes
  app.use('/', routes);

  // 4. Catch-all 404 & Global Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
