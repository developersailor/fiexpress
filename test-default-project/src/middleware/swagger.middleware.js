import { Request, Response, NextFunction } from 'express';
import { swaggerUi, specs } from '../swagger/swagger.config';

export function setupSwagger(app: Express) {
  // Swagger documentation route
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Documentation',
  }));

  // Swagger JSON endpoint
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger documentation available at /api-docs');
}
