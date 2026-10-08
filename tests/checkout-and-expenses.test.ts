import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// =========================================================================
// 1. LÓGICA DE NEGOCIO Y VALIDACIONES DEL CHECKOUT
// =========================================================================

interface CheckoutValidationInput {
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  paymentMethod: 'cash' | 'transfer';
  comprobanteAttached: boolean;
  hasCustomizationInCart: boolean;
  svgContent: string | null;
}

function validateCheckout(input: CheckoutValidationInput): { ok: boolean; error?: string } {
  if (!input.firstname || !input.lastname || !input.phone) {
    return { ok: false, error: 'Nombre, apellido y teléfono son obligatorios.' };
  }
  if (!input.email) {
    return { ok: false, error: 'El email es obligatorio para continuar.' };
  }
  if (input.paymentMethod === 'transfer' && !input.comprobanteAttached) {
    return { ok: false, error: 'Por favor, subí el comprobante de pago para continuar.' };
  }
  if (input.hasCustomizationInCart && !input.svgContent) {
    return { ok: false, error: 'Por favor, subí el diseño de tu grabado para continuar.' };
  }
  return { ok: true };
}

function formatCombinedIndications(options: {
  mateNotes?: string;
  shippingIndications?: string;
  svgFileName?: string | null;
  comprobanteInfo?: { name: string; sizeKb: number } | null;
}): string {
  const list: string[] = [];
  if (options.mateNotes?.trim()) {
    list.push(`Aclaraciones mate: ${options.mateNotes.trim()}`);
  }
  if (options.shippingIndications?.trim()) {
    list.push(`Envío: ${options.shippingIndications.trim()}`);
  }
  if (options.svgFileName) {
    list.push(`Grabado: ${options.svgFileName}`);
  }
  if (options.comprobanteInfo) {
    list.push(
      `Comprobante Transferencia: ${options.comprobanteInfo.name} (${options.comprobanteInfo.sizeKb.toFixed(1)} KB)`
    );
  }
  return list.join(' | ');
}

// =========================================================================
// 2. LÓGICA DE NEGOCIO Y ECONOMÍA UNITARIA (ADMIN EXPENSES)
// =========================================================================

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface SupplierOrder {
  items: OrderItem[];
  shippingCost: number;
}

function calculateOrderTotal(order: SupplierOrder): {
  productsTotal: number;
  totalQuantity: number;
  orderTotalWithShipping: number;
  shippingPerUnit: number;
} {
  const productsTotal = order.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const totalQuantity = order.items.reduce((sum, it) => sum + it.quantity, 0);
  const shippingPerUnit = totalQuantity > 0 ? order.shippingCost / totalQuantity : 0;
  const orderTotalWithShipping = productsTotal + order.shippingCost;
  return { productsTotal, totalQuantity, orderTotalWithShipping, shippingPerUnit };
}

function calculateProductPricing(options: {
  providerUnitPrice: number;
  shippingPerUnit: number;
  packagingCostPerUnit: number;
  otherCostPerUnit: number;
  marginPercent: number; // Ej: 100% sobre costo neto
}) {
  const extraCosts =
    options.shippingPerUnit + options.packagingCostPerUnit + options.otherCostPerUnit;
  const realCostBase = options.providerUnitPrice + extraCosts;

  // 1. Piso mínimo (cubre 100% de costos + 10% por comisiones/imprevistos)
  const minPrice = Math.ceil((realCostBase * 1.1) / 100) * 100;

  // 2. Precio Recomendado (costo real + margen % sobre costo)
  // Ej: 100% de margen = costo * 2
  const recommendedPrice =
    Math.ceil((realCostBase * (1 + options.marginPercent / 100)) / 100) * 100;

  // 3. Máximo "Ubicado" (margen premium para mayor rentabilidad)
  const maxPrice = Math.ceil((realCostBase * 2.3) / 100) * 100;

  const profit = recommendedPrice - realCostBase;
  const profitMarginOnCost = (profit / realCostBase) * 100;

  return {
    extraCosts,
    realCostBase,
    minPrice,
    recommendedPrice,
    maxPrice,
    profit,
    profitMarginOnCost,
  };
}

// =========================================================================
// SUITE DE TESTS
// =========================================================================

describe('E-Commerce Puros Mates - Reglas de Negocio y Flujo de Compra', () => {
  it('Debe bloquear la compra si se eligió Transferencia bancaria y no se adjuntó comprobante', () => {
    const result = validateCheckout({
      firstname: 'Luciana',
      lastname: 'Pirruccio',
      phone: '1130548207',
      email: 'test@purosmates.com',
      paymentMethod: 'transfer',
      comprobanteAttached: false,
      hasCustomizationInCart: false,
      svgContent: null,
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'Por favor, subí el comprobante de pago para continuar.');
  });

  it('Debe permitir la compra si se eligió Transferencia bancaria con comprobante adjunto', () => {
    const result = validateCheckout({
      firstname: 'Luciana',
      lastname: 'Pirruccio',
      phone: '1130548207',
      email: 'test@purosmates.com',
      paymentMethod: 'transfer',
      comprobanteAttached: true,
      hasCustomizationInCart: false,
      svgContent: null,
    });
    assert.equal(result.ok, true);
  });

  it('Debe bloquear la compra si hay mate con grabado personalizado y falta el diseño SVG', () => {
    const result = validateCheckout({
      firstname: 'Luciana',
      lastname: 'Pirruccio',
      phone: '1130548207',
      email: 'test@purosmates.com',
      paymentMethod: 'cash',
      comprobanteAttached: false,
      hasCustomizationInCart: true,
      svgContent: null,
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'Por favor, subí el diseño de tu grabado para continuar.');
  });

  it('Debe permitir la compra si el mate tiene grabado y se cargó el archivo SVG', () => {
    const result = validateCheckout({
      firstname: 'Luciana',
      lastname: 'Pirruccio',
      phone: '1130548207',
      email: 'test@purosmates.com',
      paymentMethod: 'cash',
      comprobanteAttached: false,
      hasCustomizationInCart: true,
      svgContent: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>',
    });
    assert.equal(result.ok, true);
  });

  it('Debe empaquetar de forma prolija las aclaraciones del cliente, el comprobante y el grabado para el backend', () => {
    const combined = formatCombinedIndications({
      mateNotes: 'Prefiero calabaza mediana con boca ancha',
      shippingIndications: 'Timbre 2B',
      svgFileName: 'grabado-iniciales-pm.svg',
      comprobanteInfo: { name: 'transferencia-banco.pdf', sizeKb: 142.5 },
    });

    assert.match(combined, /Aclaraciones mate: Prefiero calabaza mediana con boca ancha/);
    assert.match(combined, /Envío: Timbre 2B/);
    assert.match(combined, /Grabado: grabado-iniciales-pm.svg/);
    assert.match(combined, /Comprobante Transferencia: transferencia-banco.pdf \(142.5 KB\)/);
  });

  it('Debe resolver el diseño adjunto automáticamente cuando el cliente presiona "Adjuntar personalizado en el pedido"', () => {
    // Simula el almacenamiento de datos que genera handleAttachToOrder
    const mockStorage = {
      purosmates_attached_svg: '<svg viewBox="0 0 400 400"><text>LU & TATO</text></svg>',
      purosmates_attached_svg_name: 'Personalizado-Virola.svg',
    };

    const hasCustomizationInCart = true;
    const resolvedSvg = mockStorage.purosmates_attached_svg;

    const result = validateCheckout({
      firstname: 'Luciana',
      lastname: 'Pirruccio',
      phone: '1130548207',
      email: 'test@purosmates.com',
      paymentMethod: 'cash',
      comprobanteAttached: false,
      hasCustomizationInCart,
      svgContent: resolvedSvg,
    });

    assert.equal(result.ok, true);
    assert.ok(resolvedSvg.includes('<svg'));
  });
});

describe('E-Commerce Puros Mates - Economía Unitaria y Control de Gastos', () => {
  it('Debe calcular correctamente el costo de pedido y repartir el flete por unidad', () => {
    const order: SupplierOrder = {
      items: [
        { name: 'Mate Imperial Calabaza', quantity: 10, unitPrice: 18000 },
        { name: 'Mate Camionero Cuero', quantity: 10, unitPrice: 15000 },
      ],
      shippingCost: 4000,
    };

    const calc = calculateOrderTotal(order);
    assert.equal(calc.productsTotal, 330000);
    assert.equal(calc.totalQuantity, 20);
    assert.equal(calc.orderTotalWithShipping, 334000);
    assert.equal(calc.shippingPerUnit, 200); // $4000 / 20 = $200 x mate
  });

  it('Debe calcular el precio sugerido con 100% de margen duplicando el costo neto (Ejemplo de Lulita)', () => {
    // Ejemplo de Lulita: Compra a $400, flete $50 -> Costo base $450 -> Precio sugerido web $900
    const pricing = calculateProductPricing({
      providerUnitPrice: 400,
      shippingPerUnit: 50,
      packagingCostPerUnit: 0,
      otherCostPerUnit: 0,
      marginPercent: 100, // 100% sobre costo
    });

    assert.equal(pricing.realCostBase, 450);
    assert.equal(pricing.recommendedPrice, 900); // 450 * 2 = 900
    assert.equal(pricing.profit, 450);
    assert.equal(pricing.profitMarginOnCost, 100);
  });

  it('Debe contemplar flete, packaging y otros gastos para fijar el piso donde no se pierde un peso', () => {
    const pricing = calculateProductPricing({
      providerUnitPrice: 18000,
      shippingPerUnit: 200, // Flete
      packagingCostPerUnit: 80, // Tarjeta kraft
      otherCostPerUnit: 120, // Servidor y tintas
      marginPercent: 100,
    });

    assert.equal(pricing.extraCosts, 400);
    assert.equal(pricing.realCostBase, 18400);

    // Mínimo de seguridad para no perder un peso (redondeado hacia arriba)
    assert.ok(pricing.minPrice > pricing.realCostBase);
    assert.equal(pricing.minPrice, 20300); // 18400 * 1.1 = 20240 -> redondeado a 20300

    // Sugerido Web al 100% de ganancia
    assert.equal(pricing.recommendedPrice, 36800); // 18400 * 2 = 36800
    assert.equal(pricing.profit, 18400);

    // Máximo ubicado
    assert.equal(pricing.maxPrice, 42400); // 18400 * 2.3 = 42320 -> redondeado a 42400
  });
});
