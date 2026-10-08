import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { BrandingService } from 'app/shared/services/branding.service';
import { Country, DetectionSource, detectCountry, findCountryByCode, normalizeCountryCode } from 'app/shared/utils/country-detection';

type CountryOrigin = DetectionSource | 'user' | 'skipped' | 'tenant';

export type CountryAskResult = 'selected' | 'skipped' | 'cancelled';

// localStorage holds the country chosen by the user (ISO code) or SKIPPED_MARK when they declined to give one.
const STORAGE_KEY = 'dxgpt_country';
const DETECTION_TRACKED_KEY = 'dxgpt_country_detected';
const SKIPPED_MARK = '-';
const COUNTRIES_URL = 'assets/jsons/countries.json';
// Only a reliable detection or an explicit choice reaches the diagnosis.
const SENDABLE_ORIGINS: readonly CountryOrigin[] = ['timezone', 'user', 'tenant'];

/**
 * Where the patient is, to tune the diagnosis towards locally common conditions.
 * Inferred from the browser (time zone, language), never from the IP, so a VPN
 * does not change it. A guess based only on the language is offered as a
 * suggestion and has to be confirmed.
 */
@Injectable({ providedIn: 'root' })
export class CountryContextService {
    loaded = false;

    private countries: Country[] = [];
    private selected: Country | null = null;
    private suggested: Country | null = null;
    private origin: CountryOrigin = 'none';
    private initialization?: Promise<void>;
    private readonly displayNames = new Map<string, Intl.DisplayNames | null>();

    constructor(
        private http: HttpClient,
        private translate: TranslateService,
        private insights: InsightsService,
        private branding: BrandingService
    ) {}

    /** Idempotent. Browser only. */
    ready(): Promise<void> {
        this.initialization ??= this.initialize();
        return this.initialization;
    }

    /** Country that will be sent with the diagnosis. Empty when unknown. */
    get code(): string {
        return this.selected && SENDABLE_ORIGINS.includes(this.origin) ? this.selected.code : '';
    }

    get englishName(): string {
        return this.code ? this.selected!.nameEn : '';
    }

    get displayName(): string {
        return this.code ? this.localizedName(this.selected!) : '';
    }

    /** The tenant sets the country: the user is neither asked nor shown it. */
    get fixedByTenant(): boolean {
        return this.origin === 'tenant';
    }

    /** False only when the country is unknown and the user has not decided yet. */
    get needsConfirmation(): boolean {
        return this.loaded && this.origin !== 'skipped' && !this.code;
    }

    /** Opens the country picker. `selected` also covers confirming the current one. */
    async ask(trigger: 'search' | 'change'): Promise<CountryAskResult> {
        await this.ready();
        const previous = this.code;
        const preset = this.selected || this.suggested;
        const result = await Swal.fire({
            title: this.translate.instant('country.ask.title'),
            text: this.translate.instant('country.ask.text'),
            icon: 'question',
            input: 'select',
            inputOptions: this.options(),
            inputValue: preset ? preset.code : '',
            inputPlaceholder: this.translate.instant('country.ask.placeholder'),
            inputValidator: (value: string) => (value ? undefined : this.translate.instant('country.ask.required')),
            confirmButtonText: this.translate.instant('country.ask.confirm'),
            showCancelButton: true,
            cancelButtonText: this.translate.instant('generics.Cancel'),
            // A country is optional: without one the diagnosis runs as before.
            showDenyButton: this.needsConfirmation,
            denyButtonText: this.translate.instant('country.ask.skip'),
            customClass: { denyButton: 'swal2-deny--quiet' },
            allowOutsideClick: false
        });

        if (result.isConfirmed && result.value) {
            this.selected = findCountryByCode(this.countries, result.value);
            this.origin = 'user';
            this.remember(this.selected?.code || '');
            this.track('CountrySelected', trigger, previous);
            return 'selected';
        }
        if (result.isDenied) {
            this.origin = 'skipped';
            this.remember(SKIPPED_MARK);
            this.track('CountrySkipped', trigger, previous);
            return 'skipped';
        }
        return 'cancelled';
    }

    explain(): void {
        this.insights.trackEvent('CountryInfoOpened');
        Swal.fire({
            title: this.translate.instant('country.info.title'),
            html: this.translate.instant('country.info.body'),
            icon: 'info',
            confirmButtonText: this.translate.instant('generics.Close')
        });
    }

    private async initialize(): Promise<void> {
        try {
            this.countries = await this.loadCountries();
        } catch (error) {
            // Without the list there is nothing to pick from: stay unloaded, so the
            // line is hidden and the user is never asked.
            this.insights.trackException(error);
            return;
        }

        // A tenant whose patients all live in one country (branding-config `patientCountry`)
        // needs neither detection nor questions, and wins over any earlier choice.
        const tenantCountry = findCountryByCode(this.countries, (await this.branding.whenLoaded())?.patientCountry || '');
        if (tenantCountry) {
            this.selected = tenantCountry;
            this.origin = 'tenant';
            this.loaded = true;
            this.trackDetectionOncePerSession();
            return;
        }

        const stored = this.storedValue();
        const chosen = findCountryByCode(this.countries, stored);
        if (chosen) {
            this.selected = chosen;
            this.origin = 'user';
        } else {
            const detection = detectCountry(this.countries, this.browserTimeZone(), this.browserLocales());
            this.selected = detection.country;
            this.suggested = detection.source === 'locale' ? detection.country : null;
            // A declined question stays declined, unless the time zone now identifies the country.
            this.origin = stored === SKIPPED_MARK && detection.source !== 'timezone' ? 'skipped' : detection.source;
        }
        this.loaded = true;
        this.trackDetectionOncePerSession();
    }

    // The detection runs on every page load; the metric is about people, not reloads.
    private trackDetectionOncePerSession(): void {
        try {
            if (sessionStorage.getItem(DETECTION_TRACKED_KEY)) {
                return;
            }
            sessionStorage.setItem(DETECTION_TRACKED_KEY, '1');
        } catch {
            // No sessionStorage (SSR, private mode): better a repeated event than none.
        }
        this.insights.trackEvent('CountryDetected', {
            source: this.origin,
            code: this.selected?.code || '',
            timeZone: this.browserTimeZone()
        });
    }

    private loadCountries(): Promise<Country[]> {
        return new Promise((resolve, reject) => {
            this.http.get<Country[]>(COUNTRIES_URL).subscribe({ next: resolve, error: reject });
        });
    }

    private browserTimeZone(): string {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    }

    private browserLocales(): string[] {
        const tags = [...(navigator.languages || []), navigator.language, Intl.DateTimeFormat().resolvedOptions().locale];
        return tags.filter((tag, index) => !!tag && tags.indexOf(tag) === index);
    }

    // Uninhabited or retired territories have no time zone and cannot be a patient location.
    private options(): Record<string, string> {
        const collator = new Intl.Collator(this.language());
        return Object.fromEntries(
            this.countries
                .filter(country => country.timezones.length > 0)
                .map(country => [normalizeCountryCode(country.code), this.localizedName(country)] as const)
                .sort((a, b) => collator.compare(a[1], b[1]))
        );
    }

    private localizedName(country: Country): string {
        try {
            return this.regionNames()?.of(country.code) || country.nameEn;
        } catch {
            return country.nameEn;
        }
    }

    private regionNames(): Intl.DisplayNames | null {
        const language = this.language();
        if (!this.displayNames.has(language)) {
            try {
                this.displayNames.set(language, new Intl.DisplayNames([language], { type: 'region' }));
            } catch {
                this.displayNames.set(language, null);
            }
        }
        return this.displayNames.get(language) ?? null;
    }

    private language(): string {
        return this.translate.currentLang || this.translate.defaultLang || 'en';
    }

    private storedValue(): string {
        try {
            return localStorage.getItem(STORAGE_KEY) || '';
        } catch {
            return '';
        }
    }

    private remember(value: string): void {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch {
            // Private mode: the choice just lasts for this visit.
        }
    }

    private track(event: string, trigger: string, previous: string): void {
        this.insights.trackEvent(event, { trigger, previous, code: this.code });
    }
}
