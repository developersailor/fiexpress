import { writeFileSafe } from "../utils.js";
import path from "path";
import fs from "fs";

export function generateCSSFrameworkSupport(targetRoot, options = {}) {
  const { ts = false, framework = 'bootstrap' } = options;
  
  // CSS framework configuration
  const frameworkConfig = generateCSSFrameworkConfig(ts, framework);
  writeFileSafe(path.join(targetRoot, "src", "config", "css.config.js"), frameworkConfig);
  
  // CSS framework middleware
  const cssMiddleware = generateCSSFrameworkMiddleware(ts, framework);
  writeFileSafe(path.join(targetRoot, "src", "middleware", "css.middleware.js"), cssMiddleware);
  
  // Update template files with framework classes
  updateTemplateFiles(targetRoot);
  
  // Generate custom CSS
  const customCSS = generateCustomCSS(framework);
  writeFileSafe(path.join(targetRoot, "public", "css", "custom.css"), customCSS);
  
  // Update package.json with CSS framework dependencies
  updatePackageJsonWithCSSFramework(targetRoot, framework);
  
  console.log(`🎨 CSS framework (${framework}) support added successfully!`);
}

function generateCSSFrameworkConfig(ts, framework) {
  const frameworkConfigs = {
    bootstrap: {
      package: 'bootstrap',
      version: '^5.3.0',
      cdn: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
      js: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
      icons: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css'
    },
    tailwind: {
      package: 'tailwindcss',
      version: '^3.3.0',
      cdn: null, // Tailwind is typically built locally
      config: {
        content: ['./views/**/*.{html,js,ejs,pug,hbs,mustache}', './public/**/*.js'],
        theme: {
          extend: {}
        },
        plugins: []
      }
    },
    bulma: {
      package: 'bulma',
      version: '^0.9.4',
      cdn: 'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css',
      js: null
    },
    foundation: {
      package: 'foundation-sites',
      version: '^6.7.5',
      cdn: 'https://cdn.jsdelivr.net/npm/foundation-sites@6.7.5/dist/css/foundation.min.css',
      js: 'https://cdn.jsdelivr.net/npm/foundation-sites@6.7.5/dist/js/foundation.min.js'
    }
  };
  
  const config = frameworkConfigs[framework] || frameworkConfigs.bootstrap;
  
  if (ts) {
    return `export const cssFrameworkConfig = {
  framework: '${framework}',
  package: '${config.package}',
  version: '${config.version}',
  cdn: '${config.cdn}',
  js: '${config.js}',
  icons: '${config.icons || ''}',
  
  // Framework-specific configuration
  config: ${JSON.stringify(config.config || {}, null, 2)},
  
  // Build configuration
  build: {
    source: 'src/scss/',
    output: 'public/css/',
    watch: process.env.NODE_ENV === 'development'
  },
  
  // Custom variables
  variables: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40'
  },
  
  // Responsive breakpoints
  breakpoints: {
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1400px'
  }
};

export default cssFrameworkConfig;`;
  } else {
    return `const cssFrameworkConfig = {
  framework: '${framework}',
  package: '${config.package}',
  version: '${config.version}',
  cdn: '${config.cdn}',
  js: '${config.js}',
  icons: '${config.icons || ''}',
  
  // Framework-specific configuration
  config: ${JSON.stringify(config.config || {}, null, 2)},
  
  // Build configuration
  build: {
    source: 'src/scss/',
    output: 'public/css/',
    watch: process.env.NODE_ENV === 'development'
  },
  
  // Custom variables
  variables: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40'
  },
  
  // Responsive breakpoints
  breakpoints: {
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1400px'
  }
};

module.exports = { cssFrameworkConfig };
module.exports.default = cssFrameworkConfig;
`;
  }
}

function generateCSSFrameworkMiddleware(ts) {
  if (ts) {
    return `import express from 'express';
import path from 'path';
import { cssFrameworkConfig } from '../config/css.config';

export function setupCSSFramework(app: express.Application) {
  // Serve CSS framework files
  if (cssFrameworkConfig.cdn) {
    // If using CDN, add middleware to inject CDN links
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.locals.cssFramework = {
        css: cssFrameworkConfig.cdn,
        js: cssFrameworkConfig.js,
        icons: cssFrameworkConfig.icons
      };
      next();
    });
  } else {
    // Serve local CSS framework files
    app.use(express.static(path.join(process.cwd(), 'node_modules', cssFrameworkConfig.package, 'dist')));
  }
  
  // Serve custom CSS
  app.use('/css', express.static(path.join(process.cwd(), 'public', 'css')));
  
  // Add CSS framework classes to res.locals
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.locals.cssClasses = getCSSClasses(cssFrameworkConfig.framework);
    next();
  });
}

function getCSSClasses(framework: string): Record<string, string> {
  const classes = {
    bootstrap: {
      container: 'container',
      row: 'row',
      col: 'col',
      btn: 'btn',
      btnPrimary: 'btn btn-primary',
      btnSecondary: 'btn btn-secondary',
      btnSuccess: 'btn btn-success',
      btnDanger: 'btn btn-danger',
      btnWarning: 'btn btn-warning',
      btnInfo: 'btn btn-info',
      btnLight: 'btn btn-light',
      btnDark: 'btn btn-dark',
      formGroup: 'mb-3',
      formControl: 'form-control',
      formLabel: 'form-label',
      alert: 'alert',
      alertPrimary: 'alert alert-primary',
      alertSecondary: 'alert alert-secondary',
      alertSuccess: 'alert alert-success',
      alertDanger: 'alert alert-danger',
      alertWarning: 'alert alert-warning',
      alertInfo: 'alert alert-info',
      card: 'card',
      cardBody: 'card-body',
      cardTitle: 'card-title',
      cardText: 'card-text',
      navbar: 'navbar navbar-expand-lg navbar-light bg-light',
      navbarBrand: 'navbar-brand',
      navbarNav: 'navbar-nav',
      navItem: 'nav-item',
      navLink: 'nav-link'
    },
    tailwind: {
      container: 'container mx-auto px-4',
      row: 'flex flex-wrap',
      col: 'flex-1',
      btn: 'px-4 py-2 rounded font-medium',
      btnPrimary: 'bg-blue-500 text-white hover:bg-blue-600',
      btnSecondary: 'bg-gray-500 text-white hover:bg-gray-600',
      btnSuccess: 'bg-green-500 text-white hover:bg-green-600',
      btnDanger: 'bg-red-500 text-white hover:bg-red-600',
      btnWarning: 'bg-yellow-500 text-white hover:bg-yellow-600',
      btnInfo: 'bg-cyan-500 text-white hover:bg-cyan-600',
      formGroup: 'mb-4',
      formControl: 'w-full px-3 py-2 border border-gray-300 rounded-md',
      formLabel: 'block text-sm font-medium text-gray-700',
      alert: 'p-4 rounded-md',
      alertPrimary: 'bg-blue-100 text-blue-800',
      alertSecondary: 'bg-gray-100 text-gray-800',
      alertSuccess: 'bg-green-100 text-green-800',
      alertDanger: 'bg-red-100 text-red-800',
      alertWarning: 'bg-yellow-100 text-yellow-800',
      alertInfo: 'bg-cyan-100 text-cyan-800',
      card: 'bg-white rounded-lg shadow-md',
      cardBody: 'p-6',
      cardTitle: 'text-xl font-semibold mb-2',
      cardText: 'text-gray-600',
      navbar: 'bg-white shadow-md',
      navbarBrand: 'text-xl font-bold text-blue-600',
      navbarNav: 'flex space-x-4',
      navItem: 'px-3 py-2',
      navLink: 'text-gray-600 hover:text-blue-600'
    },
    bulma: {
      container: 'container',
      row: 'columns',
      col: 'column',
      btn: 'button',
      btnPrimary: 'button is-primary',
      btnSecondary: 'button is-secondary',
      btnSuccess: 'button is-success',
      btnDanger: 'button is-danger',
      btnWarning: 'button is-warning',
      btnInfo: 'button is-info',
      btnLight: 'button is-light',
      btnDark: 'button is-dark',
      formGroup: 'field',
      formControl: 'input',
      formLabel: 'label',
      alert: 'notification',
      alertPrimary: 'notification is-primary',
      alertSecondary: 'notification is-secondary',
      alertSuccess: 'notification is-success',
      alertDanger: 'notification is-danger',
      alertWarning: 'notification is-warning',
      alertInfo: 'notification is-info',
      card: 'card',
      cardBody: 'card-content',
      cardTitle: 'title',
      cardText: 'content',
      navbar: 'navbar',
      navbarBrand: 'navbar-brand',
      navbarNav: 'navbar-menu',
      navItem: 'navbar-item',
      navLink: 'navbar-link'
    },
    foundation: {
      container: 'grid-container',
      row: 'grid-x',
      col: 'cell',
      btn: 'button',
      btnPrimary: 'button primary',
      btnSecondary: 'button secondary',
      btnSuccess: 'button success',
      btnDanger: 'button alert',
      btnWarning: 'button warning',
      btnInfo: 'button info',
      formGroup: 'form-group',
      formControl: 'form-control',
      formLabel: 'form-label',
      alert: 'callout',
      alertPrimary: 'callout primary',
      alertSecondary: 'callout secondary',
      alertSuccess: 'callout success',
      alertDanger: 'callout alert',
      alertWarning: 'callout warning',
      alertInfo: 'callout info',
      card: 'card',
      cardBody: 'card-section',
      cardTitle: 'card-title',
      cardText: 'card-text',
      navbar: 'top-bar',
      navbarBrand: 'top-bar-title',
      navbarNav: 'top-bar-right',
      navItem: 'menu-item',
      navLink: 'menu-text'
    }
  };
  
  return classes[framework] || classes.bootstrap;
}

export default setupCSSFramework;`;
  } else {
    return `const express = require('express');
const path = require('path');
const { cssFrameworkConfig } = require('../config/css.config');

function setupCSSFramework(app) {
  // Serve CSS framework files
  if (cssFrameworkConfig.cdn) {
    // If using CDN, add middleware to inject CDN links
    app.use((req, res, next) => {
      res.locals.cssFramework = {
        css: cssFrameworkConfig.cdn,
        js: cssFrameworkConfig.js,
        icons: cssFrameworkConfig.icons
      };
      next();
    });
  } else {
    // Serve local CSS framework files
    app.use(express.static(path.join(process.cwd(), 'node_modules', cssFrameworkConfig.package, 'dist')));
  }
  
  // Serve custom CSS
  app.use('/css', express.static(path.join(process.cwd(), 'public', 'css')));
  
  // Add CSS framework classes to res.locals
  app.use((req, res, next) => {
    res.locals.cssClasses = getCSSClasses(cssFrameworkConfig.framework);
    next();
  });
}

function getCSSClasses(framework) {
  const classes = {
    bootstrap: {
      container: 'container',
      row: 'row',
      col: 'col',
      btn: 'btn',
      btnPrimary: 'btn btn-primary',
      btnSecondary: 'btn btn-secondary',
      btnSuccess: 'btn btn-success',
      btnDanger: 'btn btn-danger',
      btnWarning: 'btn btn-warning',
      btnInfo: 'btn btn-info',
      btnLight: 'btn btn-light',
      btnDark: 'btn btn-dark',
      formGroup: 'mb-3',
      formControl: 'form-control',
      formLabel: 'form-label',
      alert: 'alert',
      alertPrimary: 'alert alert-primary',
      alertSecondary: 'alert alert-secondary',
      alertSuccess: 'alert alert-success',
      alertDanger: 'alert alert-danger',
      alertWarning: 'alert alert-warning',
      alertInfo: 'alert alert-info',
      card: 'card',
      cardBody: 'card-body',
      cardTitle: 'card-title',
      cardText: 'card-text',
      navbar: 'navbar navbar-expand-lg navbar-light bg-light',
      navbarBrand: 'navbar-brand',
      navbarNav: 'navbar-nav',
      navItem: 'nav-item',
      navLink: 'nav-link'
    },
    tailwind: {
      container: 'container mx-auto px-4',
      row: 'flex flex-wrap',
      col: 'flex-1',
      btn: 'px-4 py-2 rounded font-medium',
      btnPrimary: 'bg-blue-500 text-white hover:bg-blue-600',
      btnSecondary: 'bg-gray-500 text-white hover:bg-gray-600',
      btnSuccess: 'bg-green-500 text-white hover:bg-green-600',
      btnDanger: 'bg-red-500 text-white hover:bg-red-600',
      btnWarning: 'bg-yellow-500 text-white hover:bg-yellow-600',
      btnInfo: 'bg-cyan-500 text-white hover:bg-cyan-600',
      formGroup: 'mb-4',
      formControl: 'w-full px-3 py-2 border border-gray-300 rounded-md',
      formLabel: 'block text-sm font-medium text-gray-700',
      alert: 'p-4 rounded-md',
      alertPrimary: 'bg-blue-100 text-blue-800',
      alertSecondary: 'bg-gray-100 text-gray-800',
      alertSuccess: 'bg-green-100 text-green-800',
      alertDanger: 'bg-red-100 text-red-800',
      alertWarning: 'bg-yellow-100 text-yellow-800',
      alertInfo: 'bg-cyan-100 text-cyan-800',
      card: 'bg-white rounded-lg shadow-md',
      cardBody: 'p-6',
      cardTitle: 'text-xl font-semibold mb-2',
      cardText: 'text-gray-600',
      navbar: 'bg-white shadow-md',
      navbarBrand: 'text-xl font-bold text-blue-600',
      navbarNav: 'flex space-x-4',
      navItem: 'px-3 py-2',
      navLink: 'text-gray-600 hover:text-blue-600'
    },
    bulma: {
      container: 'container',
      row: 'columns',
      col: 'column',
      btn: 'button',
      btnPrimary: 'button is-primary',
      btnSecondary: 'button is-secondary',
      btnSuccess: 'button is-success',
      btnDanger: 'button is-danger',
      btnWarning: 'button is-warning',
      btnInfo: 'button is-info',
      btnLight: 'button is-light',
      btnDark: 'button is-dark',
      formGroup: 'field',
      formControl: 'input',
      formLabel: 'label',
      alert: 'notification',
      alertPrimary: 'notification is-primary',
      alertSecondary: 'notification is-secondary',
      alertSuccess: 'notification is-success',
      alertDanger: 'notification is-danger',
      alertWarning: 'notification is-warning',
      alertInfo: 'notification is-info',
      card: 'card',
      cardBody: 'card-content',
      cardTitle: 'title',
      cardText: 'content',
      navbar: 'navbar',
      navbarBrand: 'navbar-brand',
      navbarNav: 'navbar-menu',
      navItem: 'navbar-item',
      navLink: 'navbar-link'
    },
    foundation: {
      container: 'grid-container',
      row: 'grid-x',
      col: 'cell',
      btn: 'button',
      btnPrimary: 'button primary',
      btnSecondary: 'button secondary',
      btnSuccess: 'button success',
      btnDanger: 'button alert',
      btnWarning: 'button warning',
      btnInfo: 'button info',
      formGroup: 'form-group',
      formControl: 'form-control',
      formLabel: 'form-label',
      alert: 'callout',
      alertPrimary: 'callout primary',
      alertSecondary: 'callout secondary',
      alertSuccess: 'callout success',
      alertDanger: 'callout alert',
      alertWarning: 'callout warning',
      alertInfo: 'callout info',
      card: 'card',
      cardBody: 'card-section',
      cardTitle: 'card-title',
      cardText: 'card-text',
      navbar: 'top-bar',
      navbarBrand: 'top-bar-title',
      navbarNav: 'top-bar-right',
      navItem: 'menu-item',
      navLink: 'menu-text'
    }
  };
  
  return classes[framework] || classes.bootstrap;
}

module.exports = { setupCSSFramework };
module.exports.default = setupCSSFramework;
`;
  }
}

function updateTemplateFiles(targetRoot) {
  // This function would update existing template files to use the CSS framework classes
  // For now, we'll create a sample template that demonstrates the framework usage
  
  const sampleTemplate = generateSampleTemplate();
  writeFileSafe(path.join(targetRoot, "views", "sample.ejs"), sampleTemplate);
}

function generateSampleTemplate() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bootstrap Sample</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="#">Brand</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="#">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">About</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#">Contact</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container mt-5">
        <div class="row">
            <div class="col-md-8">
                <h1 class="display-4">Welcome to Bootstrap</h1>
                <p class="lead">This is a sample page using Bootstrap framework.</p>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Card Title</h5>
                                <p class="card-text">Some quick example text to build on the card title.</p>
                                <a href="#" class="btn btn-primary">Go somewhere</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Another Card</h5>
                                <p class="card-text">Some quick example text to build on the card title.</p>
                                <a href="#" class="btn btn-secondary">Go somewhere</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5>Sidebar</h5>
                    </div>
                    <div class="card-body">
                        <p>This is a sidebar content.</p>
                        <button class="btn btn-success">Success Button</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

function generateCustomCSS(framework) {
  const customCSS = {
    bootstrap: `/* Custom Bootstrap overrides */
:root {
  --bs-primary: #007bff;
  --bs-secondary: #6c757d;
  --bs-success: #28a745;
  --bs-danger: #dc3545;
  --bs-warning: #ffc107;
  --bs-info: #17a2b8;
}

/* Custom styles */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 0;
}

.custom-card {
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.custom-card:hover {
  transform: translateY(-5px);
}

.btn-custom {
  border-radius: 25px;
  padding: 10px 30px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .hero-section {
    padding: 40px 0;
  }
  
  .hero-section h1 {
    font-size: 2rem;
  }
}`,
    
    tailwind: `/* Custom Tailwind CSS */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom components */
@layer components {
  .btn-custom {
    @apply px-6 py-3 rounded-full font-semibold text-sm uppercase tracking-wider transition-all duration-300;
  }
  
  .btn-primary {
    @apply bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg;
  }
  
  .btn-secondary {
    @apply bg-gray-500 text-white hover:bg-gray-600 hover:shadow-lg;
  }
  
  .card-custom {
    @apply bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300;
  }
  
  .hero-gradient {
    @apply bg-gradient-to-br from-blue-500 to-purple-600;
  }
}

/* Custom utilities */
@layer utilities {
  .text-shadow {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .backdrop-blur {
    backdrop-filter: blur(10px);
  }
}`,
    
    bulma: `/* Custom Bulma overrides */
:root {
  --primary: #007bff;
  --secondary: #6c757d;
  --success: #28a745;
  --danger: #dc3545;
  --warning: #ffc107;
  --info: #17a2b8;
}

/* Custom styles */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 0;
}

.custom-card {
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.custom-card:hover {
  transform: translateY(-5px);
}

.button-custom {
  border-radius: 25px;
  padding: 10px 30px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Responsive adjustments */
@media screen and (max-width: 768px) {
  .hero-section {
    padding: 40px 0;
  }
  
  .hero-section .title {
    font-size: 2rem;
  }
}`,
    
    foundation: `/* Custom Foundation overrides */
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #17a2b8;
}

/* Custom styles */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 0;
}

.custom-card {
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.custom-card:hover {
  transform: translateY(-5px);
}

.button-custom {
  border-radius: 25px;
  padding: 10px 30px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Responsive adjustments */
@media screen and (max-width: 768px) {
  .hero-section {
    padding: 40px 0;
  }
  
  .hero-section h1 {
    font-size: 2rem;
  }
}`
  };
  
  return customCSS[framework] || customCSS.bootstrap;
}

function updatePackageJsonWithCSSFramework(targetRoot, framework) {
  const pkgPath = path.join(targetRoot, "package.json");
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    
    pkg.dependencies = pkg.dependencies || {};
    pkg.devDependencies = pkg.devDependencies || {};
    
    // Add CSS framework specific dependencies
    const frameworkDependencies = {
      bootstrap: {
        dependencies: { 'bootstrap': '^5.3.0' },
        devDependencies: { 'sass': '^1.64.0' }
      },
      tailwind: {
        dependencies: { 'tailwindcss': '^3.3.0' },
        devDependencies: { 'autoprefixer': '^10.4.0', 'postcss': '^8.4.0' }
      },
      bulma: {
        dependencies: { 'bulma': '^0.9.4' },
        devDependencies: { 'sass': '^1.64.0' }
      },
      foundation: {
        dependencies: { 'foundation-sites': '^6.7.5' },
        devDependencies: { 'sass': '^1.64.0' }
      }
    };
    
    const deps = frameworkDependencies[framework] || frameworkDependencies.bootstrap;
    Object.assign(pkg.dependencies, deps.dependencies);
    Object.assign(pkg.devDependencies, deps.devDependencies);
    
    // Add build scripts
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['build:css'] = `sass src/scss:public/css --style=compressed`;
    pkg.scripts['watch:css'] = `sass src/scss:public/css --watch`;
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    console.error("Failed to update package.json with CSS framework dependencies:", error);
  }
}