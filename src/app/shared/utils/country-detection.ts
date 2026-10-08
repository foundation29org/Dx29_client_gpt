export interface Country {
    name: string;
    nameEn: string;
    code: string;
    timezones: string[];
}

/**
 * - `timezone`: the browser time zone maps to exactly one country. Reliable.
 * - `locale`: only the browser language carries a region (`es-MX`). A guess:
 *   the user must confirm it before it reaches the diagnosis.
 * - `none`: nothing usable (UTC, unknown zone, language without region).
 */
export type DetectionSource = 'timezone' | 'locale' | 'none';

export interface CountryDetection {
    country: Country | null;
    source: DetectionSource;
}

// ISO codes that browsers or old datasets still emit.
const LEGACY_CODES: Readonly<Record<string, string>> = Object.freeze({
    FX: 'FR',
    UK: 'GB',
    SU: 'RU',
    YU: 'RS',
    TP: 'TL',
    DY: 'BJ',
    HV: 'BF'
});

export function normalizeCountryCode(code: string): string {
    const normalized = (code || '').toUpperCase().trim();
    return LEGACY_CODES[normalized] || normalized;
}

export function findCountryByCode(countries: Country[], code: string): Country | null {
    const wanted = normalizeCountryCode(code);
    if (!wanted) return null;
    return countries.find(country => normalizeCountryCode(country.code) === wanted) || null;
}

// `new Intl.Locale('en-US').region` is explicit; unlike `maximize()` it does not
// invent a region from the language (`hi` -> `IN`, `en` -> `US`).
function regionOf(tag: string): string {
    try {
        return new Intl.Locale(tag).region || '';
    } catch {
        return '';
    }
}

export function detectCountry(countries: Country[], timeZone: string, localeTags: readonly string[]): CountryDetection {
    const byTimeZone = timeZone
        ? countries.filter(country => country.timezones.includes(timeZone))
        : [];
    if (byTimeZone.length === 1) {
        return { country: byTimeZone[0], source: 'timezone' };
    }

    for (const tag of localeTags) {
        const country = findCountryByCode(countries, regionOf(tag));
        if (country) {
            return { country, source: 'locale' };
        }
    }
    return { country: null, source: 'none' };
}
