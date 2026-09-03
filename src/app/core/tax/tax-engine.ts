import { InvoiceType } from '../models/invoice.model';

export interface TaxPreview {
  iva: number;
  withholding: number;
  total: number;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function previewTax(type: InvoiceType, subtotal: number): TaxPreview {
  const base = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  switch (type) {
    case 'NACIONAL': {
      const iva = roundMoney(base * 0.19);
      return { iva, withholding: 0, total: roundMoney(base + iva) };
    }
    case 'EXPORTACION':
      return { iva: 0, withholding: 0, total: roundMoney(base) };
    case 'GUBERNAMENTAL': {
      const iva = roundMoney(base * 0.19);
      const withholding = roundMoney(base * 0.05);
      return { iva, withholding, total: roundMoney(base + iva - withholding) };
    }
  }
}

export const INVOICE_TYPES: {
  id: InvoiceType;
  label: string;
  hint: string;
  formula: string;
}[] = [
  {
    id: 'NACIONAL',
    label: 'Nacional',
    hint: 'Mercado interno',
    formula: 'Subtotal + 19% IVA',
  },
  {
    id: 'EXPORTACION',
    label: 'Exportación',
    hint: 'Requiere código aduanero',
    formula: 'Subtotal + 0% IVA',
  },
  {
    id: 'GUBERNAMENTAL',
    label: 'Gubernamental',
    hint: 'IVA y retención',
    formula: 'Subtotal + 19% IVA − 5% retención',
  },
];
