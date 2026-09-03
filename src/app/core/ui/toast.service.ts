import { isPlatformBrowser } from '@angular/common';
import { Injectable, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { InvoiceType } from '../models/invoice.model';

export interface Toast {
  id: number;
  kind: 'ok' | 'err' | 'info';
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly platformId = inject(PLATFORM_ID);
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);
  readonly latest = computed(() => this.toasts().at(-1) ?? null);

  show(kind: Toast['kind'], title: string, message: string, ttl = 4200): void {
    const id = ++this.seq;
    this.toasts.update((list) => [...list, { id, kind, title, message }]);
    if (isPlatformBrowser(this.platformId)) {
      window.setTimeout(() => this.dismiss(id), ttl);
    }
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  invoiceTypeLabel(type: InvoiceType): string {
    const map: Record<InvoiceType, string> = {
      NACIONAL: 'Nacional',
      EXPORTACION: 'Exportación',
      GUBERNAMENTAL: 'Gubernamental',
    };
    return map[type];
  }
}
