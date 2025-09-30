import { Request, Response, NextFunction } from 'express';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-express-middleware';
import { i18nConfig } from '../config/i18n.config';

export function setupI18n(app: any) {
  // Initialize i18next
  i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init({
      lng: i18nConfig.defaultLanguage,
      fallbackLng: i18nConfig.fallbackLanguage,
      debug: process.env.NODE_ENV === 'development',
      
      // Backend configuration
      backend: {
        loadPath: `${i18nConfig.translationFiles.path}/{{lng}}/{{ns}}.json`,
        addPath: `${i18nConfig.translationFiles.path}/{{lng}}/{{ns}}.missing.json`
      },
      
      // Detection configuration
      detection: i18nConfig.detection,
      
      // Namespace configuration
      ns: Object.values(i18nConfig.namespaces),
      defaultNS: i18nConfig.namespaces.common,
      
      // Interpolation configuration
      interpolation: {
        escapeValue: false
      }
    });

  // Add i18n middleware
  app.use(middleware.handle(i18next));

  // Add language switching middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Add language switching helper
    res.locals.switchLanguage = (lang: string) => {
      req.language = lang;
      res.cookie(i18nConfig.detection.cookieName, lang, i18nConfig.detection.cookieOptions);
    };

    // Add translation helper
    res.locals.t = (key: string, options?: any) => {
      return req.t(key, options);
    };

    // Add language info
    res.locals.currentLanguage = req.language;
    res.locals.availableLanguages = i18nConfig.languages;

    next();
  });
}

export default setupI18n;