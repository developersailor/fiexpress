import { writeFileSafe } from "../utils.js";
import path from "path";
import fs from "fs";

export function generateI18nSupport(targetRoot, options = {}) {
  const { ts = false, languages = ['en', 'tr', 'es'] } = options;
  
  // i18n configuration
  const i18nConfig = generateI18nConfig(ts, languages);
  writeFileSafe(path.join(targetRoot, "src", "config", "i18n.config.js"), i18nConfig);
  
  // i18n middleware
  const i18nMiddleware = generateI18nMiddleware(ts);
  writeFileSafe(path.join(targetRoot, "src", "middleware", "i18n.middleware.js"), i18nMiddleware);
  
  // Translation files
  generateTranslationFiles(targetRoot, languages);
  
  // i18n utilities
  const i18nUtils = generateI18nUtils(ts);
  writeFileSafe(path.join(targetRoot, "src", "utils", "i18n.utils.js"), i18nUtils);
  
  // Update template files with i18n support
  updateTemplateFilesWithI18n(targetRoot, languages);
  
  // Update package.json with i18n dependencies
  updatePackageJsonWithI18n(targetRoot);
  
  console.log(`🌍 Internationalization support added successfully!`);
}

function generateI18nConfig(ts, languages) {
  if (ts) {
    return `export const i18nConfig = {
  // Supported languages
  languages: ${JSON.stringify(languages)},
  
  // Default language
  defaultLanguage: '${languages[0]}',
  
  // Fallback language
  fallbackLanguage: '${languages[0]}',
  
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

export default i18nConfig;`;
  } else {
    return `const i18nConfig = {
  // Supported languages
  languages: ${JSON.stringify(languages)},
  
  // Default language
  defaultLanguage: '${languages[0]}',
  
  // Fallback language
  fallbackLanguage: '${languages[0]}',
  
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
      en: (n) => n === 1 ? 'one' : 'other',
      tr: (n) => n === 1 ? 'one' : 'other',
      es: (n) => n === 1 ? 'one' : 'other'
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

module.exports = { i18nConfig };
module.exports.default = i18nConfig;
`;
  }
}

function generateI18nMiddleware(ts) {
  if (ts) {
    return `import { Request, Response, NextFunction } from 'express';
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
        loadPath: \`\${i18nConfig.translationFiles.path}/{{lng}}/{{ns}}.json\`,
        addPath: \`\${i18nConfig.translationFiles.path}/{{lng}}/{{ns}}.missing.json\`
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

export default setupI18n;`;
  } else {
    return `const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-express-middleware');
const { i18nConfig } = require('../config/i18n.config');

function setupI18n(app) {
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
        loadPath: \`\${i18nConfig.translationFiles.path}/{{lng}}/{{ns}}.json\`,
        addPath: \`\${i18nConfig.translationFiles.path}/{{lng}}/{{ns}}.missing.json\`
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
  app.use((req, res, next) => {
    // Add language switching helper
    res.locals.switchLanguage = (lang) => {
      req.language = lang;
      res.cookie(i18nConfig.detection.cookieName, lang, i18nConfig.detection.cookieOptions);
    };

    // Add translation helper
    res.locals.t = (key, options) => {
      return req.t(key, options);
    };

    // Add language info
    res.locals.currentLanguage = req.language;
    res.locals.availableLanguages = i18nConfig.languages;

    next();
  });
}

module.exports = { setupI18n };
module.exports.default = setupI18n;
`;
  }
}

function generateTranslationFiles(targetRoot, languages) {
  // Create locales directory structure
  const localesDir = path.join(targetRoot, "src", "locales");
  
  languages.forEach(lang => {
    const langDir = path.join(localesDir, lang);
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }
    
    // Generate translation files for each language
    generateLanguageFiles(targetRoot, lang);
  });
}

function generateLanguageFiles(targetRoot, lang) {
  const langDir = path.join(targetRoot, "src", "locales", lang);
  
  // Common translations
  const commonTranslations = generateCommonTranslations(lang);
  writeFileSafe(path.join(langDir, "common.json"), commonTranslations);
  
  // Auth translations
  const authTranslations = generateAuthTranslations(lang);
  writeFileSafe(path.join(langDir, "auth.json"), authTranslations);
  
  // Error translations
  const errorTranslations = generateErrorTranslations(lang);
  writeFileSafe(path.join(langDir, "errors.json"), errorTranslations);
  
  // Validation translations
  const validationTranslations = generateValidationTranslations(lang);
  writeFileSafe(path.join(langDir, "validation.json"), validationTranslations);
}

function generateCommonTranslations(lang) {
  const translations = {
    en: {
      "app.name": "Express App",
      "app.description": "A simple Express.js application",
      "nav.home": "Home",
      "nav.about": "About",
      "nav.contact": "Contact",
      "nav.login": "Login",
      "nav.logout": "Logout",
      "nav.register": "Register",
      "nav.dashboard": "Dashboard",
      "nav.profile": "Profile",
      "nav.settings": "Settings",
      "button.save": "Save",
      "button.cancel": "Cancel",
      "button.delete": "Delete",
      "button.edit": "Edit",
      "button.create": "Create",
      "button.update": "Update",
      "button.submit": "Submit",
      "button.reset": "Reset",
      "button.back": "Back",
      "button.next": "Next",
      "button.previous": "Previous",
      "button.close": "Close",
      "button.confirm": "Confirm",
      "button.yes": "Yes",
      "button.no": "No",
      "button.ok": "OK",
      "loading": "Loading...",
      "error": "Error",
      "success": "Success",
      "warning": "Warning",
      "info": "Information",
      "search": "Search",
      "filter": "Filter",
      "sort": "Sort",
      "page": "Page",
      "of": "of",
      "items": "items",
      "per.page": "per page",
      "total": "Total",
      "no.data": "No data available",
      "no.results": "No results found",
      "try.again": "Try again",
      "refresh": "Refresh",
      "copy": "Copy",
      "paste": "Paste",
      "cut": "Cut",
      "undo": "Undo",
      "redo": "Redo",
      "select.all": "Select All",
      "deselect.all": "Deselect All",
      "select.none": "Select None",
      "select.some": "Select Some"
    },
    tr: {
      "app.name": "Express Uygulaması",
      "app.description": "Basit bir Express.js uygulaması",
      "nav.home": "Ana Sayfa",
      "nav.about": "Hakkında",
      "nav.contact": "İletişim",
      "nav.login": "Giriş",
      "nav.logout": "Çıkış",
      "nav.register": "Kayıt Ol",
      "nav.dashboard": "Kontrol Paneli",
      "nav.profile": "Profil",
      "nav.settings": "Ayarlar",
      "button.save": "Kaydet",
      "button.cancel": "İptal",
      "button.delete": "Sil",
      "button.edit": "Düzenle",
      "button.create": "Oluştur",
      "button.update": "Güncelle",
      "button.submit": "Gönder",
      "button.reset": "Sıfırla",
      "button.back": "Geri",
      "button.next": "İleri",
      "button.previous": "Önceki",
      "button.close": "Kapat",
      "button.confirm": "Onayla",
      "button.yes": "Evet",
      "button.no": "Hayır",
      "button.ok": "Tamam",
      "loading": "Yükleniyor...",
      "error": "Hata",
      "success": "Başarılı",
      "warning": "Uyarı",
      "info": "Bilgi",
      "search": "Ara",
      "filter": "Filtrele",
      "sort": "Sırala",
      "page": "Sayfa",
      "of": "of",
      "items": "öğe",
      "per.page": "sayfa başına",
      "total": "Toplam",
      "no.data": "Veri bulunamadı",
      "no.results": "Sonuç bulunamadı",
      "try.again": "Tekrar dene",
      "refresh": "Yenile",
      "copy": "Kopyala",
      "paste": "Yapıştır",
      "cut": "Kes",
      "undo": "Geri Al",
      "redo": "Yinele",
      "select.all": "Tümünü Seç",
      "deselect.all": "Tümünü Kaldır",
      "select.none": "Hiçbirini Seçme",
      "select.some": "Bazılarını Seç"
    },
    es: {
      "app.name": "Aplicación Express",
      "app.description": "Una aplicación simple de Express.js",
      "nav.home": "Inicio",
      "nav.about": "Acerca de",
      "nav.contact": "Contacto",
      "nav.login": "Iniciar Sesión",
      "nav.logout": "Cerrar Sesión",
      "nav.register": "Registrarse",
      "nav.dashboard": "Panel de Control",
      "nav.profile": "Perfil",
      "nav.settings": "Configuración",
      "button.save": "Guardar",
      "button.cancel": "Cancelar",
      "button.delete": "Eliminar",
      "button.edit": "Editar",
      "button.create": "Crear",
      "button.update": "Actualizar",
      "button.submit": "Enviar",
      "button.reset": "Restablecer",
      "button.back": "Atrás",
      "button.next": "Siguiente",
      "button.previous": "Anterior",
      "button.close": "Cerrar",
      "button.confirm": "Confirmar",
      "button.yes": "Sí",
      "button.no": "No",
      "button.ok": "OK",
      "loading": "Cargando...",
      "error": "Error",
      "success": "Éxito",
      "warning": "Advertencia",
      "info": "Información",
      "search": "Buscar",
      "filter": "Filtrar",
      "sort": "Ordenar",
      "page": "Página",
      "of": "de",
      "items": "elementos",
      "per.page": "por página",
      "total": "Total",
      "no.data": "No hay datos disponibles",
      "no.results": "No se encontraron resultados",
      "try.again": "Intentar de nuevo",
      "refresh": "Actualizar",
      "copy": "Copiar",
      "paste": "Pegar",
      "cut": "Cortar",
      "undo": "Deshacer",
      "redo": "Rehacer",
      "select.all": "Seleccionar Todo",
      "deselect.all": "Deseleccionar Todo",
      "select.none": "No Seleccionar",
      "select.some": "Seleccionar Algunos"
    }
  };
  
  return JSON.stringify(translations[lang] || translations.en, null, 2);
}

function generateAuthTranslations(lang) {
  const translations = {
    en: {
      "login.title": "Login",
      "login.email": "Email",
      "login.password": "Password",
      "login.remember": "Remember me",
      "login.forgot": "Forgot password?",
      "login.submit": "Login",
      "login.no.account": "Don't have an account?",
      "login.signup": "Sign up",
      "logout.title": "Logout",
      "logout.confirm": "Are you sure you want to logout?",
      "register.title": "Register",
      "register.firstName": "First Name",
      "register.lastName": "Last Name",
      "register.email": "Email",
      "register.password": "Password",
      "register.confirmPassword": "Confirm Password",
      "register.terms": "I agree to the terms and conditions",
      "register.submit": "Register",
      "register.have.account": "Already have an account?",
      "register.signin": "Sign in",
      "profile.title": "Profile",
      "profile.edit": "Edit Profile",
      "profile.save": "Save Changes",
      "profile.cancel": "Cancel",
      "profile.updated": "Profile updated successfully",
      "profile.error": "Error updating profile"
    },
    tr: {
      "login.title": "Giriş",
      "login.email": "E-posta",
      "login.password": "Şifre",
      "login.remember": "Beni hatırla",
      "login.forgot": "Şifremi unuttum?",
      "login.submit": "Giriş Yap",
      "login.no.account": "Hesabınız yok mu?",
      "login.signup": "Kayıt ol",
      "logout.title": "Çıkış",
      "logout.confirm": "Çıkış yapmak istediğinizden emin misiniz?",
      "register.title": "Kayıt Ol",
      "register.firstName": "Ad",
      "register.lastName": "Soyad",
      "register.email": "E-posta",
      "register.password": "Şifre",
      "register.confirmPassword": "Şifre Tekrar",
      "register.terms": "Şartları ve koşulları kabul ediyorum",
      "register.submit": "Kayıt Ol",
      "register.have.account": "Zaten hesabınız var mı?",
      "register.signin": "Giriş yap",
      "profile.title": "Profil",
      "profile.edit": "Profili Düzenle",
      "profile.save": "Değişiklikleri Kaydet",
      "profile.cancel": "İptal",
      "profile.updated": "Profil başarıyla güncellendi",
      "profile.error": "Profil güncellenirken hata oluştu"
    },
    es: {
      "login.title": "Iniciar Sesión",
      "login.email": "Correo Electrónico",
      "login.password": "Contraseña",
      "login.remember": "Recordarme",
      "login.forgot": "¿Olvidaste tu contraseña?",
      "login.submit": "Iniciar Sesión",
      "login.no.account": "¿No tienes una cuenta?",
      "login.signup": "Regístrate",
      "logout.title": "Cerrar Sesión",
      "logout.confirm": "¿Estás seguro de que quieres cerrar sesión?",
      "register.title": "Registrarse",
      "register.firstName": "Nombre",
      "register.lastName": "Apellido",
      "register.email": "Correo Electrónico",
      "register.password": "Contraseña",
      "register.confirmPassword": "Confirmar Contraseña",
      "register.terms": "Acepto los términos y condiciones",
      "register.submit": "Registrarse",
      "register.have.account": "¿Ya tienes una cuenta?",
      "register.signin": "Iniciar sesión",
      "profile.title": "Perfil",
      "profile.edit": "Editar Perfil",
      "profile.save": "Guardar Cambios",
      "profile.cancel": "Cancelar",
      "profile.updated": "Perfil actualizado exitosamente",
      "profile.error": "Error al actualizar el perfil"
    }
  };
  
  return JSON.stringify(translations[lang] || translations.en, null, 2);
}

function generateErrorTranslations(lang) {
  const translations = {
    en: {
      "error.400": "Bad Request",
      "error.401": "Unauthorized",
      "error.403": "Forbidden",
      "error.404": "Not Found",
      "error.500": "Internal Server Error",
      "error.network": "Network Error",
      "error.timeout": "Request Timeout",
      "error.validation": "Validation Error",
      "error.database": "Database Error",
      "error.auth": "Authentication Error",
      "error.permission": "Permission Denied",
      "error.not.found": "Resource not found",
      "error.already.exists": "Resource already exists",
      "error.invalid.input": "Invalid input",
      "error.server.error": "Server error occurred",
      "error.unknown": "Unknown error occurred"
    },
    tr: {
      "error.400": "Geçersiz İstek",
      "error.401": "Yetkisiz",
      "error.403": "Yasak",
      "error.404": "Bulunamadı",
      "error.500": "Sunucu Hatası",
      "error.network": "Ağ Hatası",
      "error.timeout": "İstek Zaman Aşımı",
      "error.validation": "Doğrulama Hatası",
      "error.database": "Veritabanı Hatası",
      "error.auth": "Kimlik Doğrulama Hatası",
      "error.permission": "İzin Reddedildi",
      "error.not.found": "Kaynak bulunamadı",
      "error.already.exists": "Kaynak zaten mevcut",
      "error.invalid.input": "Geçersiz giriş",
      "error.server.error": "Sunucu hatası oluştu",
      "error.unknown": "Bilinmeyen hata oluştu"
    },
    es: {
      "error.400": "Solicitud Incorrecta",
      "error.401": "No Autorizado",
      "error.403": "Prohibido",
      "error.404": "No Encontrado",
      "error.500": "Error del Servidor",
      "error.network": "Error de Red",
      "error.timeout": "Tiempo de Espera Agotado",
      "error.validation": "Error de Validación",
      "error.database": "Error de Base de Datos",
      "error.auth": "Error de Autenticación",
      "error.permission": "Permiso Denegado",
      "error.not.found": "Recurso no encontrado",
      "error.already.exists": "El recurso ya existe",
      "error.invalid.input": "Entrada inválida",
      "error.server.error": "Ocurrió un error del servidor",
      "error.unknown": "Ocurrió un error desconocido"
    }
  };
  
  return JSON.stringify(translations[lang] || translations.en, null, 2);
}

function generateValidationTranslations(lang) {
  const translations = {
    en: {
      "validation.required": "This field is required",
      "validation.email": "Please enter a valid email address",
      "validation.password": "Password must be at least 8 characters long",
      "validation.confirmPassword": "Passwords do not match",
      "validation.minLength": "Must be at least {{min}} characters long",
      "validation.maxLength": "Must be no more than {{max}} characters long",
      "validation.min": "Must be at least {{min}}",
      "validation.max": "Must be no more than {{max}}",
      "validation.numeric": "Must be a number",
      "validation.alpha": "Must contain only letters",
      "validation.alphanumeric": "Must contain only letters and numbers",
      "validation.url": "Must be a valid URL",
      "validation.phone": "Must be a valid phone number",
      "validation.date": "Must be a valid date",
      "validation.time": "Must be a valid time",
      "validation.datetime": "Must be a valid date and time",
      "validation.unique": "This value is already taken",
      "validation.exists": "This value does not exist",
      "validation.regex": "Must match the required pattern",
      "validation.custom": "Custom validation failed"
    },
    tr: {
      "validation.required": "Bu alan zorunludur",
      "validation.email": "Lütfen geçerli bir e-posta adresi girin",
      "validation.password": "Şifre en az 8 karakter uzunluğunda olmalıdır",
      "validation.confirmPassword": "Şifreler eşleşmiyor",
      "validation.minLength": "En az {{min}} karakter uzunluğunda olmalıdır",
      "validation.maxLength": "En fazla {{max}} karakter uzunluğunda olmalıdır",
      "validation.min": "En az {{min}} olmalıdır",
      "validation.max": "En fazla {{max}} olmalıdır",
      "validation.numeric": "Sayı olmalıdır",
      "validation.alpha": "Sadece harf içermelidir",
      "validation.alphanumeric": "Sadece harf ve sayı içermelidir",
      "validation.url": "Geçerli bir URL olmalıdır",
      "validation.phone": "Geçerli bir telefon numarası olmalıdır",
      "validation.date": "Geçerli bir tarih olmalıdır",
      "validation.time": "Geçerli bir saat olmalıdır",
      "validation.datetime": "Geçerli bir tarih ve saat olmalıdır",
      "validation.unique": "Bu değer zaten alınmış",
      "validation.exists": "Bu değer mevcut değil",
      "validation.regex": "Gerekli desenle eşleşmelidir",
      "validation.custom": "Özel doğrulama başarısız"
    },
    es: {
      "validation.required": "Este campo es obligatorio",
      "validation.email": "Por favor ingresa una dirección de correo válida",
      "validation.password": "La contraseña debe tener al menos 8 caracteres",
      "validation.confirmPassword": "Las contraseñas no coinciden",
      "validation.minLength": "Debe tener al menos {{min}} caracteres",
      "validation.maxLength": "No debe tener más de {{max}} caracteres",
      "validation.min": "Debe ser al menos {{min}}",
      "validation.max": "No debe ser más de {{max}}",
      "validation.numeric": "Debe ser un número",
      "validation.alpha": "Debe contener solo letras",
      "validation.alphanumeric": "Debe contener solo letras y números",
      "validation.url": "Debe ser una URL válida",
      "validation.phone": "Debe ser un número de teléfono válido",
      "validation.date": "Debe ser una fecha válida",
      "validation.time": "Debe ser una hora válida",
      "validation.datetime": "Debe ser una fecha y hora válidas",
      "validation.unique": "Este valor ya está tomado",
      "validation.exists": "Este valor no existe",
      "validation.regex": "Debe coincidir con el patrón requerido",
      "validation.custom": "La validación personalizada falló"
    }
  };
  
  return JSON.stringify(translations[lang] || translations.en, null, 2);
}

function generateI18nUtils(ts) {
  if (ts) {
    return `import { Request } from 'express';
import { i18nConfig } from '../config/i18n.config';

export class I18nUtils {
  // Format date according to locale
  static formatDate(date: Date, locale: string, format: string = 'medium'): string {
    const dateFormat = i18nConfig.dateTime.formats[format];
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }

  // Format time according to locale
  static formatTime(date: Date, locale: string): string {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  // Format number according to locale
  static formatNumber(number: number, locale: string, options: Intl.NumberFormatOptions = {}): string {
    return new Intl.NumberFormat(locale, options).format(number);
  }

  // Format currency according to locale
  static formatCurrency(amount: number, locale: string, currency: string = 'USD'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Format percentage according to locale
  static formatPercentage(value: number, locale: string): string {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 2
    }).format(value);
  }

  // Get plural form
  static getPluralForm(count: number, locale: string): string {
    const rules = i18nConfig.pluralization.rules[locale];
    if (rules) {
      return rules(count);
    }
    return count === 1 ? 'one' : 'other';
  }

  // Get language name in its own language
  static getLanguageName(locale: string): string {
    return new Intl.DisplayNames([locale], { type: 'language' }).of(locale);
  }

  // Get language name in English
  static getLanguageNameEnglish(locale: string): string {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(locale);
  }

  // Get country name
  static getCountryName(countryCode: string, locale: string): string {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(countryCode);
  }

  // Get currency name
  static getCurrencyName(currencyCode: string, locale: string): string {
    return new Intl.DisplayNames([locale], { type: 'currency' }).of(currencyCode);
  }

  // Get relative time
  static getRelativeTime(date: Date, locale: string): string {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const diff = date.getTime() - Date.now();
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    
    if (Math.abs(days) < 1) {
      const hours = Math.round(diff / (1000 * 60 * 60));
      return rtf.format(hours, 'hour');
    } else if (Math.abs(days) < 7) {
      return rtf.format(days, 'day');
    } else if (Math.abs(days) < 30) {
      const weeks = Math.round(days / 7);
      return rtf.format(weeks, 'week');
    } else if (Math.abs(days) < 365) {
      const months = Math.round(days / 30);
      return rtf.format(months, 'month');
    } else {
      const years = Math.round(days / 365);
      return rtf.format(years, 'year');
    }
  }

  // Get list format
  static getListFormat(items: string[], locale: string): string {
    return new Intl.ListFormat(locale, { type: 'conjunction' }).format(items);
  }

  // Get collator for sorting
  static getCollator(locale: string, options: Intl.CollatorOptions = {}): Intl.Collator {
    return new Intl.Collator(locale, options);
  }

  // Sort array by locale
  static sortByLocale(array: string[], locale: string): string[] {
    return array.sort(new Intl.Collator(locale).compare);
  }
}

export default I18nUtils;`;
  } else {
    return `const { i18nConfig } = require('../config/i18n.config');

class I18nUtils {
  // Format date according to locale
  static formatDate(date, locale, format = 'medium') {
    const dateFormat = i18nConfig.dateTime.formats[format];
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }

  // Format time according to locale
  static formatTime(date, locale) {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  // Format number according to locale
  static formatNumber(number, locale, options = {}) {
    return new Intl.NumberFormat(locale, options).format(number);
  }

  // Format currency according to locale
  static formatCurrency(amount, locale, currency = 'USD') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Format percentage according to locale
  static formatPercentage(value, locale) {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 2
    }).format(value);
  }

  // Get plural form
  static getPluralForm(count, locale) {
    const rules = i18nConfig.pluralization.rules[locale];
    if (rules) {
      return rules(count);
    }
    return count === 1 ? 'one' : 'other';
  }

  // Get language name in its own language
  static getLanguageName(locale) {
    return new Intl.DisplayNames([locale], { type: 'language' }).of(locale);
  }

  // Get language name in English
  static getLanguageNameEnglish(locale) {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(locale);
  }

  // Get country name
  static getCountryName(countryCode, locale) {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(countryCode);
  }

  // Get currency name
  static getCurrencyName(currencyCode, locale) {
    return new Intl.DisplayNames([locale], { type: 'currency' }).of(currencyCode);
  }

  // Get relative time
  static getRelativeTime(date, locale) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const diff = date.getTime() - Date.now();
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    
    if (Math.abs(days) < 1) {
      const hours = Math.round(diff / (1000 * 60 * 60));
      return rtf.format(hours, 'hour');
    } else if (Math.abs(days) < 7) {
      return rtf.format(days, 'day');
    } else if (Math.abs(days) < 30) {
      const weeks = Math.round(days / 7);
      return rtf.format(weeks, 'week');
    } else if (Math.abs(days) < 365) {
      const months = Math.round(days / 30);
      return rtf.format(months, 'month');
    } else {
      const years = Math.round(days / 365);
      return rtf.format(years, 'year');
    }
  }

  // Get list format
  static getListFormat(items, locale) {
    return new Intl.ListFormat(locale, { type: 'conjunction' }).format(items);
  }

  // Get collator for sorting
  static getCollator(locale, options = {}) {
    return new Intl.Collator(locale, options);
  }

  // Sort array by locale
  static sortByLocale(array, locale) {
    return array.sort(new Intl.Collator(locale).compare);
  }
}

module.exports = { I18nUtils };
module.exports.default = I18nUtils;
`;
  }
}

function updateTemplateFilesWithI18n(targetRoot) {
  // This function would update existing template files to use i18n
  // For now, we'll create a sample template that demonstrates i18n usage
  
  const sampleTemplate = generateI18nSampleTemplate();
  writeFileSafe(path.join(targetRoot, "views", "i18n-sample.ejs"), sampleTemplate);
}

function generateI18nSampleTemplate() {
  return `<!DOCTYPE html>
<html lang="<%= currentLanguage %>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= t('app.name') %></title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <a href="/" class="nav-brand"><%= t('app.name') %></a>
            <ul class="nav-menu">
                <li><a href="/"><%= t('nav.home') %></a></li>
                <li><a href="/about"><%= t('nav.about') %></a></li>
                <li><a href="/contact"><%= t('nav.contact') %></a></li>
            </ul>
            
            <!-- Language Switcher -->
            <div class="language-switcher">
                <select onchange="switchLanguage(this.value)">
                    <% availableLanguages.forEach(lang => { %>
                        <option value="<%= lang %>" <%= currentLanguage === lang ? 'selected' : '' %>>
                            <%= lang.toUpperCase() %>
                        </option>
                    <% }); %>
                </select>
            </div>
        </div>
    </nav>
    
    <main class="main-content">
        <div class="hero">
            <h1><%= t('app.name') %></h1>
            <p><%= t('app.description') %></p>
        </div>
        
        <div class="features">
            <h2><%= t('nav.features') %></h2>
            <ul>
                <li><%= t('feature.i18n') %></li>
                <li><%= t('feature.templates') %></li>
                <li><%= t('feature.responsive') %></li>
            </ul>
        </div>
        
        <div class="cta">
            <a href="/contact" class="btn btn-primary"><%= t('button.contact') %></a>
        </div>
    </main>
    
    <footer class="footer">
        <p>&copy; <%= currentYear %> <%= t('app.name') %>. <%= t('footer.rights') %></p>
    </footer>
    
    <script>
        function switchLanguage(lang) {
            document.cookie = 'i18n=' + lang + '; path=/; max-age=31536000';
            location.reload();
        }
    </script>
</body>
</html>`;
}

function updatePackageJsonWithI18n(targetRoot) {
  const pkgPath = path.join(targetRoot, "package.json");
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies["i18next"] = "^23.0.0";
    pkg.dependencies["i18next-fs-backend"] = "^2.0.0";
    pkg.dependencies["i18next-express-middleware"] = "^3.4.0";
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    console.error("Failed to update package.json with i18n dependencies:", error);
  }
}
