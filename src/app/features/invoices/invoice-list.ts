import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, finalize, startWith, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InvoiceApi } from '../../core/api/invoice.api';
import { AuthService } from '../../core/auth/auth.service';
import { Invoice, InvoicePage } from '../../core/models/invoice.model';
import { TypeBadge } from '../../shared/type-badge/type-badge';

@Component({
  selector: 'app-invoice-list',
  imports: [RouterLink, ReactiveFormsModule, CurrencyPipe, DatePipe, TypeBadge],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss',
})
export class InvoiceListPage implements OnInit {
  private readonly api = inject(InvoiceApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);

  readonly rows = signal<Invoice[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = new FormControl('', { nonNullable: true });
  readonly page = signal<InvoicePage | null>(null);
  readonly pageSize = 10;

  ngOnInit(): void {
    this.search.valueChanges
      .pipe(
        startWith(this.search.value),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => this.loadPage(query, 0)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  goToPage(page: number): void {
    const currentPage = this.page();
    if (!currentPage || page < 0 || page >= currentPage.totalPages || page === currentPage.number) {
      return;
    }
    this.loadPage(this.search.value, page).subscribe();
  }

  private loadPage(query: string, page: number) {
    this.loading.set(true);
    this.error.set(null);
    return this.api.list(query, page, this.pageSize).pipe(
      tap((response) => {
        this.page.set(response);
        this.rows.set(response.content);
      }),
      catchError(() => {
        this.page.set(null);
        this.rows.set([]);
        this.error.set('No se pudo cargar el listado.');
        return EMPTY;
      }),
      finalize(() => this.loading.set(false)),
    );
  }
}
