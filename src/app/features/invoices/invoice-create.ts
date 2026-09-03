import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, finalize, map, startWith, switchMap, tap } from 'rxjs';
import { ClientApi } from '../../core/api/client.api';
import { Client } from '../../core/models/client.model';
import { InvoiceApi } from '../../core/api/invoice.api';
import { CreateInvoiceRequest, InvoiceType } from '../../core/models/invoice.model';
import { INVOICE_TYPES, previewTax } from '../../core/tax/tax-engine';
import { ToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-invoice-create',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './invoice-create.html',
  styleUrl: './invoice-create.scss',
})
export class InvoiceCreatePage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(InvoiceApi);
  private readonly clientApi = inject(ClientApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly types = INVOICE_TYPES;
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly clients = signal<Client[]>([]);
  readonly clientsLoading = signal(true);
  readonly clientsError = signal<string | null>(null);
  readonly clientSearch = new FormControl('', { nonNullable: true });

  readonly form = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<InvoiceType>('NACIONAL'),
    clientId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
    subtotal: this.fb.nonNullable.control<number>(100, [Validators.required, Validators.min(0.01)]),
    customsCode: [''],
    description: [''],
  });

  private readonly typeValue = toSignal(
    this.form.controls.type.valueChanges.pipe(startWith(this.form.controls.type.value)),
    { initialValue: this.form.controls.type.value },
  );

  private readonly subtotalValue = toSignal(
    this.form.controls.subtotal.valueChanges.pipe(
      startWith(this.form.controls.subtotal.value),
      map((v) => Number(v) || 0),
    ),
    { initialValue: Number(this.form.controls.subtotal.value) || 0 },
  );

  readonly isExport = computed(() => this.typeValue() === 'EXPORTACION');
  readonly preview = computed(() => previewTax(this.typeValue(), this.subtotalValue()));

  constructor() {
    this.clientSearch.valueChanges
      .pipe(
        startWith(this.clientSearch.value),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          this.clientsLoading.set(true);
          this.clientsError.set(null);
        }),
        switchMap((query) =>
          this.clientApi.list(query, 0, 10).pipe(
            catchError(() => {
              this.clientsError.set('No pudimos cargar los clientes.');
              this.clients.set([]);
              return EMPTY;
            }),
            finalize(() => this.clientsLoading.set(false)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => this.clients.set(response.content));

    this.form.controls.type.valueChanges.subscribe((type) => {
      const ctrl = this.form.controls.customsCode;
      if (type === 'EXPORTACION') {
        ctrl.setValidators([Validators.required, Validators.minLength(1)]);
      } else {
        ctrl.clearValidators();
        ctrl.setValue('');
      }
      ctrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  selectType(type: InvoiceType): void {
    this.form.controls.type.setValue(type);
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload: CreateInvoiceRequest = {
      type: raw.type,
      subtotal: Number(raw.subtotal),
      clientId: raw.clientId,
    };
    if (raw.description.trim()) {
      payload.description = raw.description.trim();
    }
    if (raw.type === 'EXPORTACION') {
      payload.customsCode = raw.customsCode.trim();
    }

    this.submitting.set(true);
    this.error.set(null);
    this.api.create(payload).subscribe({
      next: (invoice) => {
        this.toast.show('ok', 'Factura registrada', `Total ${invoice.total} · Se emitio un evento para sincronizar las metricas.`);
        void this.router.navigate(['/invoices', invoice.id]);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err.status === 403) {
          this.error.set('Parece que no tienes permitido emitir facturas.');
          return;
        }
        this.error.set('No se pudo emitir. Revisa el código aduanero y el subtotal.');
      },
    });
  }
}
