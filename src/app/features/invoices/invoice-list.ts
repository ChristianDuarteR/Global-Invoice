import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InvoiceApi } from '../../core/api/invoice.api';
import { AuthService } from '../../core/auth/auth.service';
import { Invoice } from '../../core/models/invoice.model';
import { TypeBadge } from '../../shared/type-badge/type-badge';

@Component({
  selector: 'app-invoice-list',
  imports: [RouterLink, CurrencyPipe, DatePipe, TypeBadge],
  templateUrl: './invoice-list.html',
})
export class InvoiceListPage implements OnInit {
  private readonly api = inject(InvoiceApi);
  readonly auth = inject(AuthService);

  readonly rows = signal<Invoice[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.list().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el listado.');
        this.loading.set(false);
      },
    });
  }
}
