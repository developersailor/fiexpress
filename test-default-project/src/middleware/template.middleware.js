import express from 'express';
import path from 'path';
import { templateConfig } from '../config/template.config';

export function setupTemplateEngine(app: express.Application) {
  // Set view engine
  app.set('view engine', templateConfig.engine);
  app.set('views', templateConfig.viewsPath);
  
  // Configure template engine
  switch (templateConfig.engine) {
    case 'ejs':
      app.set('view options', templateConfig.engineConfig);
      break;
    case 'pug':
      app.set('view options', templateConfig.engineConfig);
      break;
    case 'hbs':
      const hbs = require('hbs');
      hbs.registerPartials(templateConfig.partialsPath);
      hbs.registerHelper('formatDate', templateConfig.helpers.formatDate);
      hbs.registerHelper('formatCurrency', templateConfig.helpers.formatCurrency);
      hbs.registerHelper('truncate', templateConfig.helpers.truncate);
      hbs.registerHelper('capitalize', templateConfig.helpers.capitalize);
      hbs.registerHelper('eq', templateConfig.helpers.eq);
      hbs.registerHelper('ne', templateConfig.helpers.ne);
      hbs.registerHelper('lt', templateConfig.helpers.lt);
      hbs.registerHelper('gt', templateConfig.helpers.gt);
      hbs.registerHelper('lte', templateConfig.helpers.lte);
      hbs.registerHelper('gte', templateConfig.helpers.gte);
      break;
    case 'mustache':
      const mustacheExpress = require('mustache-express');
      const mustache = mustacheExpress(templateConfig.engineConfig.ext, templateConfig.engineConfig);
      app.engine('mustache', mustache);
      break;
  }
  
  // Serve static files
  app.use(express.static(templateConfig.staticPath));
  
  // Template middleware
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Add global variables to all templates
    res.locals = {
      ...res.locals,
      ...templateConfig.globals,
      user: (req as any).user || null,
      flash: (req as any).flash || null,
      csrfToken: (req as any).csrfToken || null
    };
    next();
  });
}

export default setupTemplateEngine;