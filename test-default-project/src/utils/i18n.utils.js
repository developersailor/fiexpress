import { Request } from 'express';
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

export default I18nUtils;