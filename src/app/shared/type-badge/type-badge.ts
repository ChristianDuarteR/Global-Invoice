import { Component, input } from '@angular/core';
import { InvoiceType } from '../../core/models/invoice.model';

@Component({
  selector: 'app-type-badge',
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase"
      [class]="tone()"
    >
      <span class="size-1.5 rounded-full bg-current"></span>
      {{ label() }}
    </span>
  `,
})
export class TypeBadge {
  readonly type = input.required<InvoiceType>();

  label(): string {
    const map: Record<InvoiceType, string> = {
      NACIONAL: 'Nacional',
      EXPORTACION: 'Exportación',
      GUBERNAMENTAL: 'Gubernamental',
    };
    return map[this.type()];
  }

  tone(): string {
    const map: Record<InvoiceType, string> = {
      NACIONAL: 'bg-teal-400/10 text-teal-300',
      EXPORTACION: 'bg-violet-400/10 text-violet-300',
      GUBERNAMENTAL: 'bg-amber-400/10 text-amber-300',
    };
    return map[this.type()];
  }
}
