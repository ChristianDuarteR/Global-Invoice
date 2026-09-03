import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ClientPage } from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class ClientApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.javaApi}/api/clients`;

  list(query = '', page = 0, size = 10) {
    let params = new HttpParams().set('page', page).set('size', size);
    const cleanQuery = query.trim();
    if (cleanQuery) {
      params = params.set('q', cleanQuery);
    }
    return this.http.get<ClientPage>(this.base, { params });
  }
}
