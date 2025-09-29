import { writeFileSafe } from "../utils.js";
import path from "path";

export function generateTemplateEngineSupport(targetRoot, options = {}) {
  const { ts = false, engine = 'ejs' } = options;
  
  // Template engine configuration
  const engineConfig = generateTemplateEngineConfig(ts, engine);
  writeFileSafe(path.join(targetRoot, "src", "config", "template.config.js"), engineConfig);
  
  // Template engine middleware
  const engineMiddleware = generateTemplateEngineMiddleware(ts, engine);
  writeFileSafe(path.join(targetRoot, "src", "middleware", "template.middleware.js"), engineMiddleware);
  
  // View routes
  const viewRoutes = generateViewRoutes(ts, engine);
  writeFileSafe(path.join(targetRoot, "src", "routes", "views.js"), viewRoutes);
  
  // Template files
  generateTemplateFiles(targetRoot, engine);
  
  // Static assets
  generateStaticAssets(targetRoot);
  
  // Update package.json with template engine dependencies
  updatePackageJsonWithTemplateEngine(targetRoot, engine);
  
  console.log(`🎨 Template engine (${engine}) support added successfully!`);
}

function generateTemplateEngineConfig(ts, engine) {
  const engineConfigs = {
    ejs: {
      package: 'ejs',
      viewEngine: 'ejs',
      viewExtension: 'ejs',
      config: {
        cache: false,
        debug: process.env.NODE_ENV !== 'production'
      }
    },
    pug: {
      package: 'pug',
      viewEngine: 'pug',
      viewExtension: 'pug',
      config: {
        pretty: process.env.NODE_ENV !== 'production',
        compileDebug: process.env.NODE_ENV !== 'production'
      }
    },
    handlebars: {
      package: 'hbs',
      viewEngine: 'hbs',
      viewExtension: 'hbs',
      config: {
        extname: '.hbs',
        defaultLayout: 'main',
        layoutsDir: 'views/layouts',
        partialsDir: 'views/partials'
      }
    },
    mustache: {
      package: 'mustache-express',
      viewEngine: 'mustache',
      viewExtension: 'mustache',
      config: {
        ext: '.mustache',
        partialsDir: 'views/partials'
      }
    }
  };
  
  const config = engineConfigs[engine] || engineConfigs.ejs;
  
  if (ts) {
    return `import express from 'express';
import path from 'path';

export const templateConfig = {
  engine: '${config.viewEngine}',
  extension: '${config.viewExtension}',
  viewsPath: path.join(process.cwd(), 'views'),
  partialsPath: path.join(process.cwd(), 'views', 'partials'),
  layoutsPath: path.join(process.cwd(), 'views', 'layouts'),
  staticPath: path.join(process.cwd(), 'public'),
  
  // Engine-specific configuration
  engineConfig: ${JSON.stringify(config.config, null, 2)},
  
  // Global template variables
  globals: {
    appName: process.env.APP_NAME || 'Express App',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    currentYear: new Date().getFullYear()
  },
  
  // Helper functions
  helpers: {
    formatDate: (date: Date, format: string = 'YYYY-MM-DD') => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    },
    
    formatCurrency: (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    },
    
    truncate: (text: string, length: number = 100) => {
      return text.length > length ? text.substring(0, length) + '...' : text;
    },
    
    capitalize: (text: string) => {
      return text.charAt(0).toUpperCase() + text.slice(1);
    },
    
    eq: (a: any, b: any) => a === b,
    ne: (a: any, b: any) => a !== b,
    lt: (a: number, b: number) => a < b,
    gt: (a: number, b: number) => a > b,
    lte: (a: number, b: number) => a <= b,
    gte: (a: number, b: number) => a >= b
  }
};

export default templateConfig;`;
  } else {
    return `const express = require('express');
const path = require('path');

const templateConfig = {
  engine: '${config.viewEngine}',
  extension: '${config.viewExtension}',
  viewsPath: path.join(process.cwd(), 'views'),
  partialsPath: path.join(process.cwd(), 'views', 'partials'),
  layoutsPath: path.join(process.cwd(), 'views', 'layouts'),
  staticPath: path.join(process.cwd(), 'public'),
  
  // Engine-specific configuration
  engineConfig: ${JSON.stringify(config.config, null, 2)},
  
  // Global template variables
  globals: {
    appName: process.env.APP_NAME || 'Express App',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    currentYear: new Date().getFullYear()
  },
  
  // Helper functions
  helpers: {
    formatDate: (date, format = 'YYYY-MM-DD') => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    },
    
    formatCurrency: (amount, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    },
    
    truncate: (text, length = 100) => {
      return text.length > length ? text.substring(0, length) + '...' : text;
    },
    
    capitalize: (text) => {
      return text.charAt(0).toUpperCase() + text.slice(1);
    },
    
    eq: (a, b) => a === b,
    ne: (a, b) => a !== b,
    lt: (a, b) => a < b,
    gt: (a, b) => a > b,
    lte: (a, b) => a <= b,
    gte: (a, b) => a >= b
  }
};

module.exports = { templateConfig };
module.exports.default = templateConfig;
`;
  }
}

function generateTemplateEngineMiddleware(ts) {
  if (ts) {
    return `import express from 'express';
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

export default setupTemplateEngine;`;
  } else {
    return `const express = require('express');
const path = require('path');
const { templateConfig } = require('../config/template.config');

function setupTemplateEngine(app) {
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
  app.use((req, res, next) => {
    // Add global variables to all templates
    res.locals = {
      ...res.locals,
      ...templateConfig.globals,
      user: req.user || null,
      flash: req.flash || null,
      csrfToken: req.csrfToken || null
    };
    next();
  });
}

module.exports = { setupTemplateEngine };
module.exports.default = setupTemplateEngine;
`;
  }
}

function generateViewRoutes(ts, engine) {
  if (ts) {
    return `import express from 'express';
import { Request, Response } from 'express';

const router = express.Router();

// Home page
router.get('/', (req: Request, res: Response) => {
  res.render('index', {
    title: 'Home',
    message: 'Welcome to Express.js with ${engine.toUpperCase()}!',
    features: [
      'Template Engine: ${engine.toUpperCase()}',
      'Static File Serving',
      'Global Variables',
      'Helper Functions'
    ]
  });
});

// About page
router.get('/about', (req: Request, res: Response) => {
  res.render('about', {
    title: 'About',
    description: 'This is a sample Express.js application with ${engine.toUpperCase()} template engine.'
  });
});

// Contact page
router.get('/contact', (req: Request, res: Response) => {
  res.render('contact', {
    title: 'Contact',
    formData: {
      name: '',
      email: '',
      message: ''
    }
  });
});

// Handle contact form submission
router.post('/contact', (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  
  // In a real app, you'd save this to a database
  console.log('Contact form submission:', { name, email, message });
  
  res.render('contact', {
    title: 'Contact',
    formData: { name, email, message },
    success: true,
    message: 'Thank you for your message!'
  });
});

// Error page
router.get('/error', (req: Request, res: Response) => {
  res.status(500).render('error', {
    title: 'Error',
    error: {
      message: 'Something went wrong!',
      status: 500
    }
  });
});

export default router;`;
  } else {
    return `const express = require('express');

const router = express.Router();

// Home page
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Home',
    message: 'Welcome to Express.js with ${engine.toUpperCase()}!',
    features: [
      'Template Engine: ${engine.toUpperCase()}',
      'Static File Serving',
      'Global Variables',
      'Helper Functions'
    ]
  });
});

// About page
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About',
    description: 'This is a sample Express.js application with ${engine.toUpperCase()} template engine.'
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact',
    formData: {
      name: '',
      email: '',
      message: ''
    }
  });
});

// Handle contact form submission
router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  
  // In a real app, you'd save this to a database
  console.log('Contact form submission:', { name, email, message });
  
  res.render('contact', {
    title: 'Contact',
    formData: { name, email, message },
    success: true,
    message: 'Thank you for your message!'
  });
});

// Error page
router.get('/error', (req, res) => {
  res.status(500).render('error', {
    title: 'Error',
    error: {
      message: 'Something went wrong!',
      status: 500
    }
  });
});

module.exports = router;
`;
  }
}

function generateTemplateFiles(targetRoot, engine) {
  // Create views directory structure
  const viewsDir = path.join(targetRoot, "views");
  const layoutsDir = path.join(viewsDir, "layouts");
  const partialsDir = path.join(viewsDir, "partials");
  
  // Create directories
  [viewsDir, layoutsDir, partialsDir].forEach(dir => {
    if (!require('fs').existsSync(dir)) {
      require('fs').mkdirSync(dir, { recursive: true });
    }
  });
  
  // Generate template files based on engine
  switch (engine) {
    case 'ejs':
      generateEJSTemplates(targetRoot);
      break;
    case 'pug':
      generatePugTemplates(targetRoot);
      break;
    case 'hbs':
      generateHandlebarsTemplates(targetRoot);
      break;
    case 'mustache':
      generateMustacheTemplates(targetRoot);
      break;
  }
}

function generateEJSTemplates(targetRoot) {
  // Layout template
  const layout = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %> - <%= appName %></title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <a href="/" class="nav-brand"><%= appName %></a>
            <ul class="nav-menu">
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
            </ul>
        </div>
    </nav>
    
    <main class="main-content">
        <%- body %>
    </main>
    
    <footer class="footer">
        <p>&copy; <%= currentYear %> <%= appName %>. All rights reserved.</p>
    </footer>
    
    <script src="/js/app.js"></script>
</body>
</html>`;
  
  writeFileSafe(path.join(targetRoot, "views", "layouts", "main.ejs"), layout);
  
  // Index template
  const index = `<div class="hero">
    <h1><%= message %></h1>
    <p>Built with Express.js and EJS template engine</p>
</div>

<div class="features">
    <h2>Features</h2>
    <ul>
        <% features.forEach(feature => { %>
            <li><%= feature %></li>
        <% }); %>
    </ul>
</div>

<div class="cta">
    <a href="/contact" class="btn btn-primary">Get Started</a>
</div>`;
  
  writeFileSafe(path.join(targetRoot, "views", "index.ejs"), index);
  
  // About template
  const about = `<div class="page-header">
    <h1><%= title %></h1>
</div>

<div class="content">
    <p><%= description %></p>
    
    <h2>Technology Stack</h2>
    <ul>
        <li>Node.js</li>
        <li>Express.js</li>
        <li>EJS Template Engine</li>
        <li>CSS3</li>
        <li>JavaScript</li>
    </ul>
</div>`;
  
  writeFileSafe(path.join(targetRoot, "views", "about.ejs"), about);
  
  // Contact template
  const contact = `<div class="page-header">
    <h1><%= title %></h1>
</div>

<div class="content">
    <% if (success) { %>
        <div class="alert alert-success">
            <%= message %>
        </div>
    <% } %>
    
    <form method="POST" action="/contact" class="contact-form">
        <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" value="<%= formData.name %>" required>
        </div>
        
        <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" value="<%= formData.email %>" required>
        </div>
        
        <div class="form-group">
            <label for="message">Message</label>
            <textarea id="message" name="message" rows="5" required><%= formData.message %></textarea>
        </div>
        
        <button type="submit" class="btn btn-primary">Send Message</button>
    </form>
</div>`;
  
  writeFileSafe(path.join(targetRoot, "views", "contact.ejs"), contact);
  
  // Error template
  const error = `<div class="error-page">
    <h1>Oops! Something went wrong</h1>
    <p><%= error.message %></p>
    <a href="/" class="btn btn-primary">Go Home</a>
</div>`;
  
  writeFileSafe(path.join(targetRoot, "views", "error.ejs"), error);
}

function generatePugTemplates(targetRoot) {
  // Layout template
  const layout = `doctype html
html(lang="en")
  head
    meta(charset="UTF-8")
    meta(name="viewport", content="width=device-width, initial-scale=1.0")
    title #{title} - #{appName}
    link(rel="stylesheet", href="/css/style.css")
  body
    nav.navbar
      .nav-container
        a.nav-brand(href="/") #{appName}
        ul.nav-menu
          li
            a(href="/") Home
          li
            a(href="/about") About
          li
            a(href="/contact") Contact
    
    main.main-content
      block content
    
    footer.footer
      p &copy; #{currentYear} #{appName}. All rights reserved.
    
    script(src="/js/app.js")`;
  
  writeFileSafe(path.join(targetRoot, "views", "layouts", "main.pug"), layout);
  
  // Index template
  const index = `extends layouts/main

block content
  .hero
    h1 #{message}
    p Built with Express.js and Pug template engine
  
  .features
    h2 Features
    ul
      each feature in features
        li #{feature}
  
  .cta
    a.btn.btn-primary(href="/contact") Get Started`;
  
  writeFileSafe(path.join(targetRoot, "views", "index.pug"), index);
  
  // About template
  const about = `extends layouts/main

block content
  .page-header
    h1 #{title}
  
  .content
    p #{description}
    
    h2 Technology Stack
    ul
      li Node.js
      li Express.js
      li Pug Template Engine
      li CSS3
      li JavaScript`;
  
  writeFileSafe(path.join(targetRoot, "views", "about.pug"), about);
  
  // Contact template
  const contact = `extends layouts/main

block content
  .page-header
    h1 #{title}
  
  .content
    if success
      .alert.alert-success #{message}
    
    form.contact-form(method="POST", action="/contact")
      .form-group
        label(for="name") Name
        input#name(type="text", name="name", value=formData.name, required)
      
      .form-group
        label(for="email") Email
        input#email(type="email", name="email", value=formData.email, required)
      
      .form-group
        label(for="message") Message
        textarea#message(name="message", rows="5", required) #{formData.message}
      
      button.btn.btn-primary(type="submit") Send Message`;
  
  writeFileSafe(path.join(targetRoot, "views", "contact.pug"), contact);
  
  // Error template
  const error = `extends layouts/main

block content
  .error-page
    h1 Oops! Something went wrong
    p #{error.message}
    a.btn.btn-primary(href="/") Go Home`;
  
  writeFileSafe(path.join(targetRoot, "views", "error.pug"), error);
}

function generateHandlebarsTemplates(targetRoot) {
  // Layout template
  const layout = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - {{appName}}</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <a href="/" class="nav-brand">{{appName}}</a>
            <ul class="nav-menu">
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
            </ul>
        </div>
    </nav>
    
    <main class="main-content">
        {{{body}}}
    </main>
    
    <footer class="footer">
        <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
    </footer>
    
    <script src="/js/app.js"></script>
</body>
</html>`;
  
  writeFileSafe(path.join(targetRoot, "views", "layouts", "main.hbs"), layout);
  
  // Index template
  const index = `<div class="hero">
    <h1>{{message}}</h1>
    <p>Built with Express.js and Handlebars template engine</p>
</div>

<div class="features">
    <h2>Features</h2>
    <ul>
        {{#each features}}
            <li>{{this}}</li>
        {{/each}}
    </ul>
</div>

<div class="cta">
    <a href="/contact" class="btn btn-primary">Get Started</a>
</div>`;
  
  writeFileSafe(path.join(targetRoot, "views", "index.hbs"), index);
  
  // About template
  const about = `<div class="page-header">
    <h1>{{title}}</h1>
</div>

<div class="content">
    <p>{{description}}</p>
    
    <h2>Technology Stack</h2>
    <ul>
        <li>Node.js</li>
        <li>Express.js</li>
        <li>Handlebars Template Engine</li>
        <li>CSS3</li>
        <li>JavaScript</li>
    </ul>
</div>`;
  
  writeFileSafe(path.join(targetRoot, "views", "about.hbs"), about);
  
  // Contact template
  const contact = `<div class="page-header">
    <h1>{{title}}</h1>
</div>

<div class="content">
    {{#if success}}
        <div class="alert alert-success">
            {{message}}
        </div>
    {{/if}}
    
    <form method="POST" action="/contact" class="contact-form">
        <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" value="{{formData.name}}" required>
        </div>
        
        <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" value="{{formData.email}}" required>
        </div>
        
        <div class="form-group">
            <label for="message">Message</label>
            <textarea id="message" name="message" rows="5" required>{{formData.message}}</textarea>
        </div>
        
        <button type="submit" class="btn btn-primary">Send Message</button>
    </form>
</div>`;
  
  writeFileSafe(path.join(targetRoot, "views", "contact.hbs"), contact);
  
  // Error template
  const error = `<div class="error-page">
    <h1>Oops! Something went wrong</h1>
    <p>{{error.message}}</p>
    <a href="/" class="btn btn-primary">Go Home</a>
</div>`;
  
  writeFileSafe(path.join(targetRoot, "views", "error.hbs"), error);
}

function generateMustacheTemplates(targetRoot) {
  // Layout template
  const layout = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - {{appName}}</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <a href="/" class="nav-brand">{{appName}}</a>
            <ul class="nav-menu">
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
            </ul>
        </div>
    </nav>
    
    <main class="main-content">
        {{> content}}
    </main>
    
    <footer class="footer">
        <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
    </footer>
    
    <script src="/js/app.js"></script>
</body>
</html>`;
  
  writeFileSafe(path.join(targetRoot, "views", "layouts", "main.mustache"), layout);
  
  // Index template
  const index = `<div class="hero">
    <h1>{{message}}</h1>
    <p>Built with Express.js and Mustache template engine</p>
</div>

<div class="features">
    <h2>Features</h2>
    <ul>
        {{#features}}
            <li>{{.}}</li>
        {{/features}}
    </ul>
</div>

<div class="cta">
    <a href="/contact" class="btn btn-primary">Get Started</a>
</div>`;
  
  writeFileSafe(path.join(targetRoot, "views", "index.mustache"), index);
  
  // About template
  const about = `<div class="page-header">
    <h1>{{title}}</h1>
</div>

<div class="content">
    <p>{{description}}</p>
    
    <h2>Technology Stack</h2>
    <ul>
        <li>Node.js</li>
        <li>Express.js</li>
        <li>Mustache Template Engine</li>
        <li>CSS3</li>
        <li>JavaScript</li>
    </ul>
</div>`;
  
  writeFileSafe(path.join(targetRoot, "views", "about.mustache"), about);
  
  // Contact template
  const contact = `<div class="page-header">
    <h1>{{title}}</h1>
</div>

<div class="content">
    {{#success}}
        <div class="alert alert-success">
            {{message}}
        </div>
    {{/success}}
    
    <form method="POST" action="/contact" class="contact-form">
        <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" value="{{formData.name}}" required>
        </div>
        
        <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" value="{{formData.email}}" required>
        </div>
        
        <div class="form-group">
            <label for="message">Message</label>
            <textarea id="message" name="message" rows="5" required>{{formData.message}}</textarea>
        </div>
        
        <button type="submit" class="btn btn-primary">Send Message</button>
    </form>
</div>`;
  
  writeFileSafe(path.join(targetRoot, "views", "contact.mustache"), contact);
  
  // Error template
  const error = `<div class="error-page">
    <h1>Oops! Something went wrong</h1>
    <p>{{error.message}}</p>
    <a href="/" class="btn btn-primary">Go Home</a>
</div>`;
  
  writeFileSafe(path.join(targetRoot, "views", "error.mustache"), error);
}

function generateStaticAssets(targetRoot) {
  // Create public directory structure
  const publicDir = path.join(targetRoot, "public");
  const cssDir = path.join(publicDir, "css");
  const jsDir = path.join(publicDir, "js");
  const imagesDir = path.join(publicDir, "images");
  
  // Create directories
  [publicDir, cssDir, jsDir, imagesDir].forEach(dir => {
    if (!require('fs').existsSync(dir)) {
      require('fs').mkdirSync(dir, { recursive: true });
    }
  });
  
  // CSS file
  const css = `/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f8f9fa;
}

/* Navigation */
.navbar {
    background: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 1000;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 60px;
}

.nav-brand {
    font-size: 1.5rem;
    font-weight: bold;
    color: #007bff;
    text-decoration: none;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 30px;
}

.nav-menu a {
    color: #333;
    text-decoration: none;
    transition: color 0.3s;
}

.nav-menu a:hover {
    color: #007bff;
}

/* Main content */
.main-content {
    min-height: calc(100vh - 120px);
    padding: 40px 20px;
}

/* Hero section */
.hero {
    text-align: center;
    padding: 80px 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    margin: -40px -20px 40px -20px;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 20px;
}

.hero p {
    font-size: 1.2rem;
    opacity: 0.9;
}

/* Features */
.features {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
}

.features h2 {
    font-size: 2rem;
    margin-bottom: 30px;
    color: #333;
}

.features ul {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.features li {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.3s;
}

.features li:hover {
    transform: translateY(-2px);
}

/* CTA */
.cta {
    text-align: center;
    margin-top: 40px;
}

/* Buttons */
.btn {
    display: inline-block;
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.3s;
    cursor: pointer;
}

.btn-primary {
    background: #007bff;
    color: white;
}

.btn-primary:hover {
    background: #0056b3;
    transform: translateY(-1px);
}

/* Forms */
.contact-form {
    max-width: 600px;
    margin: 0 auto;
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #007bff;
}

/* Alerts */
.alert {
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 20px;
}

.alert-success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

/* Page header */
.page-header {
    text-align: center;
    margin-bottom: 40px;
}

.page-header h1 {
    font-size: 2.5rem;
    color: #333;
}

/* Content */
.content {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Error page */
.error-page {
    text-align: center;
    padding: 80px 20px;
}

.error-page h1 {
    font-size: 3rem;
    color: #dc3545;
    margin-bottom: 20px;
}

/* Footer */
.footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 20px;
    margin-top: 40px;
}

/* Responsive */
@media (max-width: 768px) {
    .nav-container {
        flex-direction: column;
        height: auto;
        padding: 20px;
    }
    
    .nav-menu {
        margin-top: 20px;
        flex-direction: column;
        gap: 15px;
    }
    
    .hero h1 {
        font-size: 2rem;
    }
    
    .features ul {
        grid-template-columns: 1fr;
    }
}`;
  
  writeFileSafe(path.join(targetRoot, "public", "css", "style.css"), css);
  
  // JavaScript file
  const js = `// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Express.js with template engine loaded!');
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    // Add form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = '#dc3545';
                    isValid = false;
                } else {
                    field.style.borderColor = '#28a745';
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                alert('Please fill in all required fields.');
            }
        });
    });
    
    // Add loading states for buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.type === 'submit') {
                this.style.opacity = '0.7';
                this.disabled = true;
            }
        });
    });
});

// Utility functions
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = \`alert alert-\${type}\`;
    alert.textContent = message;
    
    const container = document.querySelector('.main-content');
    if (container) {
        container.insertBefore(alert, container.firstChild);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}

// Export for use in other scripts
window.AppUtils = {
    showAlert
};`;
  
  writeFileSafe(path.join(targetRoot, "public", "js", "app.js"), js);
}

function updatePackageJsonWithTemplateEngine(targetRoot, engine) {
  const fs = require('fs');
  const pkgPath = path.join(targetRoot, "package.json");
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    
    pkg.dependencies = pkg.dependencies || {};
    
    // Add template engine specific dependency
    const engineDependencies = {
      ejs: { 'ejs': '^3.1.9' },
      pug: { 'pug': '^3.0.2' },
      hbs: { 'hbs': '^4.2.0' },
      mustache: { 'mustache-express': '^1.3.0' }
    };
    
    const deps = engineDependencies[engine] || engineDependencies.ejs;
    Object.assign(pkg.dependencies, deps);
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    console.error("Failed to update package.json with template engine dependencies:", error);
  }
}
