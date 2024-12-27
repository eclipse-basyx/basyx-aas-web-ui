import countries from 'i18n-iso-countries';
import english from 'i18n-iso-countries/langs/en.json';
import ISO6391 from 'iso-639-1';

// Function to get country name by country code (e.g. DE --> Germany)
export function getCountryName(countryCode: string, language: string = 'en'): string {
    // console.log('getCountryName()', 'countryCode:', countryCode);

    const failReturn = '';

    if (!countryCode || countryCode.trim() === '') return failReturn;

    countries.registerLocale(english);

    return countries.getName(countryCode, language) || failReturn;
}

// Function to get language name by language code (e.g. de --> German)
export function getLanguageName(languageCode: string): string {
    // console.log('getLanguageName()', 'languageCode:', languageCode);

    const failReturn = '';

    if (!languageCode || languageCode.trim() === '') return failReturn;

    countries.registerLocale(english);

    return ISO6391.getName(languageCode) || failReturn;
}
