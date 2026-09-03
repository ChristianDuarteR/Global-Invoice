import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CreateInvoiceRequest, Invoice, InvoiceDetail, InvoicePage } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.javaApi}/api/invoices`;

  list(query = '', page = 0, size = 10) {
    const params: Record<string, string | number> = { page, size };
    const cleanQuery = query.trim();
    if (cleanQuery) {
      params['q'] = cleanQuery;
    }
    return this.http.get<InvoicePage>(this.base, { params });
  }

  create(body: CreateInvoiceRequest) {
    return this.http.post<Invoice>(this.base, body);
  }

  detail(id: number) {
    return this.http.get<InvoiceDetail>(`${this.base}/${id}`);
  }
}
