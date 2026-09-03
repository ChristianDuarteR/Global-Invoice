import { previewTax, roundMoney } from './tax-engine';

describe('previewTax', () => {
  it('aplica 19% IVA en NACIONAL', () => {
    expect(previewTax('NACIONAL', 100)).toEqual({ iva: 19, withholding: 0, total: 119 });
  });

  it('deja IVA en 0 para EXPORTACION', () => {
    expect(previewTax('EXPORTACION', 200)).toEqual({ iva: 0, withholding: 0, total: 200 });
  });

  it('resta 5% de retención en GUBERNAMENTAL', () => {
    expect(previewTax('GUBERNAMENTAL', 100)).toEqual({
      iva: 19,
      withholding: 5,
      total: 114,
    });
  });

  it('redondea a dos decimales', () => {
    expect(roundMoney(10.125)).toBe(10.13);
  });
});
