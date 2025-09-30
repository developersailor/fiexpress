export const i18nConfig = {
  // Supported languages
  languages: ["en","tr","es"],
  
  // Default language
  defaultLanguage: 'en',
  
  // Fallback language
  fallbackLanguage: 'en',
  
  // Language detection
  detection: {
    order: ['header', 'cookie', 'query', 'session'],
    caches: ['cookie', 'session'],
    cookieName: 'i18n',
    cookieOptions: {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    }
  },
  
  // Translation files
  translationFiles: {
    path: 'src/locales',
    extension: '.json'
  },
  
  // Date and time formatting
  dateTime: {
    formats: {
      short: 'MM/DD/YYYY',
      medium: 'MMM DD, YYYY',
      long: 'MMMM DD, YYYY',
      full: 'EEEE, MMMM DD, YYYY'
    },
    timezone: process.env.TZ || 'UTC'
  },
  
  // Number formatting
  number: {
    formats: {
      currency: {
        style: 'currency',
        currency: 'USD'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2
      },
      percent: {
        style: 'percent',
        minimumFractionDigits: 2
      }
    }
  },
  
  // Pluralization
  pluralization: {
    rules: {
      en: (n: number) => n === 1 ? 'one' : 'other',
      tr: (n: number) => n === 1 ? 'one' : 'other',
      es: (n: number) => n === 1 ? 'one' : 'other'
    }
  },
  
  // Namespace configuration
  namespaces: {
    common: 'common',
    auth: 'auth',
    errors: 'errors',
    validation: 'validation'
  }
};

export default i18nConfig;