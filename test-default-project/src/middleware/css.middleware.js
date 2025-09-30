import express from 'express';
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

export default setupCSSFramework;