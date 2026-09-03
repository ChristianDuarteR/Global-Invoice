export type InvoiceType = 'NACIONAL' | 'EXPORTACION' | 'GUBERNAMENTAL';
export type UserRole = 'OPERADOR' | 'AUDITOR';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: UserRole;
}

export interface CreateInvoiceRequest {
  type: InvoiceType;
  subtotal: number;
  clientName: string;
  customsCode?: string;
  description?: string;
}

export interface Invoice {
  id: number;
  type: InvoiceType;
  subtotal: number;
  iva: number;
  withholding: number;
  total: number;
  customsCode?: string | null;
  clientName: string;
  description?: string | null;
  createdAt: string;
  createdBy: string;
}

export interface InvoicePage {
  content: Invoice[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface InvoiceDetail extends Invoice {
  totalInWords: string;
}

export interface TypeMetric {
  invoice_type: InvoiceType;
  total: string | number;
  count?: number;
}

export interface MetricsSnapshot {
  by_type: TypeMetric[];
  grand_total: string | number;
  invoice_count?: number;
}
