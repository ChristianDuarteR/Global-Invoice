import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CreateInvoiceRequest, Invoice, InvoiceDetail } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.javaApi}/api/invoices`;

  list() {
    return this.http.get<Invoice[]>(this.base);
  }

  create(body: CreateInvoiceRequest) {
    return this.http.post<Invoice>(this.base, body);
  }

  detail(id: number) {
    return this.http.get<InvoiceDetail>(`${this.base}/${id}`);
  }
}
