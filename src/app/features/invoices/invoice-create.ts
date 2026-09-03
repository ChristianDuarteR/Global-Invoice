import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, startWith } from 'rxjs';
import { InvoiceApi } from '../../core/api/invoice.api';
import { CreateInvoiceRequest, InvoiceType } from '../../core/models/invoice.model';
import { INVOICE_TYPES, previewTax } from '../../core/tax/tax-engine';
import { ToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-invoice-create',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './invoice-create.html',
})
export class InvoiceCreatePage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(InvoiceApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly types = INVOICE_TYPES;
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<InvoiceType>('NACIONAL'),
    clientName: ['', [Validators.required, Validators.minLength(1)]],
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
      clientName: raw.clientName.trim(),
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
        this.toast.show('ok', 'Factura emitida', `Total ${invoice.total} · el dashboard del auditor ya recibió el evento.`);
        void this.router.navigate(['/invoices', invoice.id]);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err.status === 403) {
          this.error.set('Tu rol no puede emitir facturas.');
          return;
        }
        this.error.set('No se pudo emitir. Revisa el código aduanero y el subtotal.');
      },
    });
  }
}
