import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, input, numberAttribute, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InvoiceApi } from '../../core/api/invoice.api';
import { InvoiceDetail } from '../../core/models/invoice.model';
import { TypeBadge } from '../../shared/type-badge/type-badge';

@Component({
  selector: 'app-invoice-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, TypeBadge],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss',
})
export class InvoiceDetailPage implements OnInit {
  private readonly api = inject(InvoiceApi);
  readonly id = input.required({ transform: numberAttribute });

  readonly invoice = signal<InvoiceDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.detail(this.id()).subscribe({
      next: (row) => {
        this.invoice.set(row);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar el detalle de la factura.');
        this.loading.set(false);
      },
    });
  }
}
