import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CountryContextService } from 'app/shared/services/country-context.service';

/**
 * One line showing which country the results are tuned for, with a way to change
 * it and a short explanation. Emits `changed` only when the country actually changed.
 *
 * Usage: <app-country-context [disabled]="callingAI" (changed)="rerun()">
 */
@Component({
  selector: 'app-country-context',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './country-context.component.html',
  styleUrls: ['./country-context.component.scss']
})
export class CountryContextComponent {
  @Input() disabled = false;
  @Output() changed = new EventEmitter<void>();

  constructor(public country: CountryContextService) {}

  async change(): Promise<void> {
    if (this.disabled) return;
    const before = this.country.code;
    const result = await this.country.ask('change');
    if (result !== 'cancelled' && this.country.code !== before) {
      this.changed.emit();
    }
  }
}
