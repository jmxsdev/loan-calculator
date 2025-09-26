// src/logic/amortization.test.js
import { describe, it, expect } from 'vitest';
import { calculateAmortization } from '../src/logic/amortization.js';

describe('Calculadora de Amortización - Pago Único', () => {
  it('debería calcular correctamente el interés y el pago total para un pago único', () => {
    const options = {
      amount: 10000,
      interest: 10, // 10% fijo
      amortizationType: 'single',
      grantDate: '2025-09-25',
      singlePaymentDate: '2026-09-25',
      openingFee: 0
    };

    const table = calculateAmortization(options);

    expect(table).toHaveLength(1);
    const payment = table[0];

    expect(payment.principal).toBe(10000);
    expect(payment.interest).toBe(1000); // 10% de 10000
    expect(payment.payment).toBe(11000);
    expect(payment.remaining).toBe(0);
  });
});
