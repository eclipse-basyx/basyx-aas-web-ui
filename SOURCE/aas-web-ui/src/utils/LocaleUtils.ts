import countries from 'i18n-iso-countries';
import english from 'i18n-iso-countries/langs/en.json';
import ISO6391 from 'iso-639-1';

/**
 * Retrieves the name of a country based on its country code.
 *
 * @param {string} countryCode - The ISO 3166-1 alpha-2 country code.
 * @param {string} [language='en'] - The optional language code for localization (default is 'en').
 * @returns {string} The localized country name or an empty string if the country code is invalid.
 */
export function getCountryName(countryCode: string, language: string = 'en'): string {
    if (!countryCode || countryCode.trim() === '') return '';

    // Ensure the countries locale is registered
    countries.registerLocale(english);

    // Attempt to get the country name, return empty string if not found
    return countries.getName(countryCode, language) || '';
}

/**
 * Retrieves the name of a language based on its ISO 639-1 code.
 *
 * @param {string} languageCode - The ISO 639-1 language code.
 * @returns {string} The name of the language or an empty string if the language code is invalid.
 */
export function getLanguageName(languageCode: string): string {
    if (!languageCode || languageCode.trim() === '') return '';

    // Attempt to get the language name, return empty string if not found
    return ISO6391.getName(languageCode.trim().toLowerCase()) || '';
}
