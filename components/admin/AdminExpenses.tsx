'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Download,
  DollarSign,
  Truck,
  CreditCard,
  Layers,
  TrendingUp,
  AlertCircle,
  X,
  Package,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Modelos de datos
export interface OrderProductItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface SupplierOrder {
  id: string;
  date: string;
  title: string;
  items: OrderProductItem[];
  shippingCost: number;
  notes?: string;
}

export interface CardExpense {
  id: string;
  date: string;
  title: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface OtherExpense {
  id: string;
  date: string;
  concept: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

const STORAGE_KEY = 'pm-admin-expenses-data-v1';

// Datos iniciales de demostración
const DEFAULT_ORDERS: SupplierOrder[] = [
  {
    id: 'ord-1',
    date: new Date().toISOString().split('T')[0],
    title: 'Pedido Mates Imperiales y Camioneros',
    items: [
      { id: 'it-1', name: 'Mate Imperial Premium Calabaza', quantity: 10, unitPrice: 18000 },
      { id: 'it-2', name: 'Mate Camionero Cuero Vacuno', quantity: 10, unitPrice: 15000 },
    ],
    shippingCost: 3500,
    notes: 'Envío por encomienda de fábrica',
  },
];

const DEFAULT_CARDS: CardExpense[] = [
  {
    id: 'card-1',
    date: new Date().toISOString().split('T')[0],
    title: 'Tarjetas de Agradecimiento e Instrucciones de Curado',
    quantity: 500,
    unitPrice: 80,
    notes: 'Impresión en papel kraft con logo',
  },
];

const DEFAULT_OTHERS: OtherExpense[] = [
  {
    id: 'oth-1',
    date: new Date().toISOString().split('T')[0],
    concept: 'Tinta para sello de bolsas',
    quantity: 2,
    unitPrice: 3200,
    notes: 'Para estampar las bolsas de entrega',
  },
  {
    id: 'oth-2',
    date: new Date().toISOString().split('T')[0],
    concept: 'Servidor y Hosting Web PM',
    quantity: 1,
    unitPrice: 8500,
    notes: 'Alojamiento mensual de la tienda online',
  },
];

export default function AdminExpenses() {
  // Pestañas (Hojas de Excel): 'gastos' | 'precios' | 'resumen'
  const [activeSheet, setActiveSheet] = useState<'gastos' | 'precios' | 'resumen'>('gastos');

  // Sub-vista dentro de Hoja 1: 'menu' | 'pedidos' | 'packaging' | 'otros'
  const [expenseSubView, setExpenseSubView] = useState<'menu' | 'pedidos' | 'packaging' | 'otros'>(
    'menu'
  );

  // Registros
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [cards, setCards] = useState<CardExpense[]>([]);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpense[]>([]);

  // Margen deseado: 100% sobre el precio neto (costo x 2)
  const [marginPercent, setMarginPercent] = useState<number>(100);

  // Estados de Modales
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showOtherModal, setShowOtherModal] = useState(false);

  // Formulario Pedido
  const [orderFormTitle, setOrderFormTitle] = useState('');
  const [orderFormShipping, setOrderFormShipping] = useState<number | ''>('');
  const [orderFormNotes, setOrderFormNotes] = useState('');
  const [orderFormItems, setOrderFormItems] = useState<
    { id: string; name: string; quantity: number | ''; unitPrice: number | '' }[]
  >([{ id: '1', name: '', quantity: '', unitPrice: '' }]);

  // Formulario Packaging / Tarjetas
  const [cardFormTitle, setCardFormTitle] = useState('Tarjetas de agradecimiento / packaging');
  const [cardFormQty, setCardFormQty] = useState<number | ''>('');
  const [cardFormUnitPrice, setCardFormUnitPrice] = useState<number | ''>('');
  const [cardFormNotes, setCardFormNotes] = useState('');

  // Formulario Otros
  const [otherFormConcept, setOtherFormConcept] = useState('');
  const [otherFormQty, setOtherFormQty] = useState<number | ''>(1);
  const [otherFormUnitPrice, setOtherFormUnitPrice] = useState<number | ''>('');
  const [otherFormNotes, setOtherFormNotes] = useState('');

  // Cargar desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setOrders(parsed.orders || []);
        setCards(parsed.cards || []);
        setOtherExpenses(parsed.otherExpenses || []);
        if (parsed.marginPercent !== undefined) {
          setMarginPercent(parsed.marginPercent);
        } else {
          setMarginPercent(100);
        }
      } else {
        setOrders(DEFAULT_ORDERS);
        setCards(DEFAULT_CARDS);
        setOtherExpenses(DEFAULT_OTHERS);
      }
    } catch {
      setOrders(DEFAULT_ORDERS);
      setCards(DEFAULT_CARDS);
      setOtherExpenses(DEFAULT_OTHERS);
    }
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    try {
      const data = { orders, cards, otherExpenses, marginPercent };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignorar errores de storage
    }
  }, [orders, cards, otherExpenses, marginPercent]);

  // ==========================================
  // CÁLCULOS GLOBALES Y PRORRATEOS
  // ==========================================

  const totalProductsQuantity = orders.reduce((acc, ord) => {
    return acc + ord.items.reduce((itemAcc, item) => itemAcc + Number(item.quantity || 0), 0);
  }, 0);

  const totalProductsCost = orders.reduce((acc, ord) => {
    return (
      acc +
      ord.items.reduce(
        (itemAcc, item) => itemAcc + Number(item.quantity || 0) * Number(item.unitPrice || 0),
        0
      )
    );
  }, 0);

  const totalShippingCost = orders.reduce((acc, ord) => acc + Number(ord.shippingCost || 0), 0);
  const totalOrdersCost = totalProductsCost + totalShippingCost;

  const totalCardsCost = cards.reduce(
    (acc, card) => acc + Number(card.quantity || 0) * Number(card.unitPrice || 0),
    0
  );
  const totalCardsCount = cards.reduce((acc, card) => acc + Number(card.quantity || 0), 0);
  const cardCostPerUnit = totalCardsCount > 0 ? totalCardsCost / totalCardsCount : 0;

  const totalOtherCost = otherExpenses.reduce(
    (acc, oth) => acc + Number(oth.quantity || 0) * Number(oth.unitPrice || 0),
    0
  );
  const otherCostPerProductUnit =
    totalProductsQuantity > 0 ? totalOtherCost / totalProductsQuantity : 0;

  const grandTotalCost = totalOrdersCost + totalCardsCost + totalOtherCost;

  // ==========================================
  // MANEJADORES
  // ==========================================

  const handleAddOrderItemRow = () => {
    setOrderFormItems([
      ...orderFormItems,
      { id: Date.now().toString(), name: '', quantity: '', unitPrice: '' },
    ]);
  };

  const handleRemoveOrderItemRow = (index: number) => {
    if (orderFormItems.length === 1) return;
    setOrderFormItems(orderFormItems.filter((_, idx) => idx !== index));
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderFormTitle.trim()) {
      toast.error('Ingresá una referencia para el pedido');
      return;
    }

    const validItems = orderFormItems
      .filter((it) => it.name.trim() && Number(it.quantity) > 0 && Number(it.unitPrice) > 0)
      .map((it) => ({
        id: it.id,
        name: it.name.trim(),
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
      }));

    if (validItems.length === 0) {
      toast.error('Agregá al menos un producto con cantidad y precio válidos');
      return;
    }

    const newOrder: SupplierOrder = {
      id: 'ord-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      title: orderFormTitle.trim(),
      items: validItems,
      shippingCost: Number(orderFormShipping) || 0,
      notes: orderFormNotes.trim() || undefined,
    };

    setOrders([newOrder, ...orders]);
    setShowOrderModal(false);
    setOrderFormTitle('');
    setOrderFormShipping('');
    setOrderFormNotes('');
    setOrderFormItems([{ id: '1', name: '', quantity: '', unitPrice: '' }]);
    toast.success('¡Pedido guardado!');
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(cardFormQty);
    const unitPrice = Number(cardFormUnitPrice);

    if (!qty || qty <= 0 || !unitPrice || unitPrice <= 0) {
      toast.error('Ingresá una cantidad y precio unitario válidos');
      return;
    }

    const newCard: CardExpense = {
      id: 'card-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      title: cardFormTitle.trim() || 'Packaging / Tarjetas',
      quantity: qty,
      unitPrice,
      notes: cardFormNotes.trim() || undefined,
    };

    setCards([newCard, ...cards]);
    setShowCardModal(false);
    setCardFormQty('');
    setCardFormUnitPrice('');
    setCardFormNotes('');
    toast.success('¡Gasto en packaging guardado!');
  };

  const handleSaveOther = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherFormConcept.trim()) {
      toast.error('Por favor, indicá qué es ese gasto');
      return;
    }
    const qty = Number(otherFormQty) || 1;
    const unitPrice = Number(otherFormUnitPrice);

    if (!unitPrice || unitPrice <= 0) {
      toast.error('Ingresá un monto válido');
      return;
    }

    const newOther: OtherExpense = {
      id: 'oth-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      concept: otherFormConcept.trim(),
      quantity: qty,
      unitPrice,
      notes: otherFormNotes.trim() || undefined,
    };

    setOtherExpenses([newOther, ...otherExpenses]);
    setShowOtherModal(false);
    setOtherFormConcept('');
    setOtherFormQty(1);
    setOtherFormUnitPrice('');
    setOtherFormNotes('');
    toast.success('¡Gasto guardado!');
  };

  const handleExportCSV = () => {
    const rows = [
      ['Tipo', 'Descripción / Concepto', 'Fecha', 'Cantidad', 'Precio Unitario', 'Total'],
    ];

    orders.forEach((ord) => {
      ord.items.forEach((it) => {
        rows.push([
          'Pedido',
          `${ord.title} - ${it.name}`,
          ord.date,
          it.quantity.toString(),
          it.unitPrice.toString(),
          (it.quantity * it.unitPrice).toString(),
        ]);
      });
      if (ord.shippingCost > 0) {
        rows.push([
          'Envío de Pedido',
          `Flete de ${ord.title}`,
          ord.date,
          '1',
          ord.shippingCost.toString(),
          ord.shippingCost.toString(),
        ]);
      }
    });

    cards.forEach((c) => {
      rows.push([
        'Packaging',
        c.title,
        c.date,
        c.quantity.toString(),
        c.unitPrice.toString(),
        (c.quantity * c.unitPrice).toString(),
      ]);
    });

    otherExpenses.forEach((o) => {
      rows.push([
        'Otro Gasto',
        o.concept,
        o.date,
        o.quantity.toString(),
        o.unitPrice.toString(),
        (o.quantity * o.unitPrice).toString(),
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `gastos_puros_mates_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('¡Planilla descargada!');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ===================================================================== */}
      {/* HOJA 1: GASTOS (DISEÑO MINIMALISTA DEL BOCETO DE LULITA)              */}
      {/* ===================================================================== */}
      {activeSheet === 'gastos' && (
        <div className="space-y-6">
          {/* Sub-vista: Menú Principal de Gastos (Boceto Superior) */}
          {expenseSubView === 'menu' && (
            <div className="mx-auto max-w-xl rounded-2xl border border-gray-300 bg-white p-8 shadow-xs">
              {/* Encabezado Superior: CONTROL DE GASTOS */}
              <div className="mb-8 flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-stone-50 py-3 text-center shadow-xs">
                <div className="rounded-md bg-[#254642] p-1.5 text-white">
                  <FileSpreadsheet className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <h2 className="font-bold tracking-wider text-gray-800 uppercase">
                  CONTROL DE GASTOS
                </h2>
              </div>

              {/* Botones Grandes Centrales: PEDIDOS / PACKAGING / OTROS... */}
              <div className="space-y-4 px-4 py-2">
                <button
                  type="button"
                  onClick={() => setExpenseSubView('pedidos')}
                  className="group flex w-full items-center justify-between rounded-xl border-2 border-gray-300 bg-white px-6 py-4 text-center font-bold tracking-wider text-gray-800 uppercase shadow-xs transition hover:border-[#254642] hover:bg-stone-50 hover:text-[#254642]"
                >
                  <span className="w-full text-center text-sm font-extrabold sm:text-base">
                    PEDIDOS
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#254642]" />
                </button>

                <button
                  type="button"
                  onClick={() => setExpenseSubView('packaging')}
                  className="group flex w-full items-center justify-between rounded-xl border-2 border-gray-300 bg-white px-6 py-4 text-center font-bold tracking-wider text-gray-800 uppercase shadow-xs transition hover:border-[#254642] hover:bg-stone-50 hover:text-[#254642]"
                >
                  <span className="w-full text-center text-sm font-extrabold sm:text-base">
                    PACKAGING
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#254642]" />
                </button>

                <button
                  type="button"
                  onClick={() => setExpenseSubView('otros')}
                  className="group flex w-full items-center justify-between rounded-xl border-2 border-gray-300 bg-white px-6 py-4 text-center font-bold tracking-wider text-gray-800 uppercase shadow-xs transition hover:border-[#254642] hover:bg-stone-50 hover:text-[#254642]"
                >
                  <span className="w-full text-center text-sm font-extrabold sm:text-base">
                    OTROS...
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#254642]" />
                </button>
              </div>
            </div>
          )}

          {/* Sub-vista: PEDIDOS (Boceto Fila 2 Izquierda) */}
          {expenseSubView === 'pedidos' && (
            <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-xs">
              <div className="mb-6 flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setExpenseSubView('menu')}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                  </button>
                  <div className="rounded-lg border border-gray-300 bg-stone-50 px-4 py-1.5">
                    <h3 className="font-bold tracking-wide text-gray-800 uppercase">PEDIDOS</h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOrderModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-[#254642] bg-[#254642] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#1a3330]"
                >
                  <Plus className="h-4 w-4" />+ NUEVO PEDIDO
                </button>
              </div>

              {/* Lista de Pedidos */}
              {orders.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  No tenés pedidos cargados todavía. Tocá en &ldquo;+ NUEVO PEDIDO&rdquo; para
                  cargar el primero.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => {
                    const orderItemsTotal = ord.items.reduce(
                      (sum, it) => sum + it.quantity * it.unitPrice,
                      0
                    );
                    const orderTotalQty = ord.items.reduce((sum, it) => sum + it.quantity, 0);
                    const shippingPerUnit =
                      orderTotalQty > 0 ? ord.shippingCost / orderTotalQty : 0;

                    return (
                      <div
                        key={ord.id}
                        className="rounded-xl border border-gray-200 bg-stone-50/40 p-4 transition hover:bg-white"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-gray-900">{ord.title}</h5>
                              <span className="rounded bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                                {ord.date}
                              </span>
                            </div>
                            {ord.notes && <p className="text-xs text-gray-500">{ord.notes}</p>}
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-[11px] text-gray-500">Total con envío:</span>
                              <p className="font-mono text-base font-bold text-[#254642]">
                                ${(orderItemsTotal + ord.shippingCost).toLocaleString('es-AR')}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('¿Eliminar este pedido?')) {
                                  setOrders(orders.filter((o) => o.id !== ord.id));
                                  toast.success('Pedido eliminado');
                                }
                              }}
                              className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              title="Eliminar pedido"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white p-3">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b text-gray-400">
                                <th className="pb-1 font-medium">Producto</th>
                                <th className="pb-1 text-center font-medium">Cantidad</th>
                                <th className="pb-1 text-right font-medium">Precio Proveedor</th>
                                <th className="pb-1 text-right font-medium">Subtotal</th>
                                <th className="pb-1 text-right font-medium text-blue-600">
                                  Envío x Unidad
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {ord.items.map((it) => (
                                <tr key={it.id}>
                                  <td className="py-2 font-medium text-gray-800">{it.name}</td>
                                  <td className="py-2 text-center font-semibold text-gray-700">
                                    {it.quantity} u.
                                  </td>
                                  <td className="py-2 text-right font-mono text-gray-700">
                                    ${it.unitPrice.toLocaleString('es-AR')}
                                  </td>
                                  <td className="py-2 text-right font-mono font-bold text-gray-900">
                                    ${(it.quantity * it.unitPrice).toLocaleString('es-AR')}
                                  </td>
                                  <td className="py-2 text-right font-mono font-semibold text-blue-600">
                                    +${shippingPerUnit.toFixed(1)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-gray-200 text-gray-500">
                                <td colSpan={3} className="pt-2 font-medium">
                                  Costo de envío / flete del pedido:
                                </td>
                                <td colSpan={2} className="pt-2 text-right font-bold text-blue-600">
                                  ${ord.shippingCost.toLocaleString('es-AR')}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sub-vista: PACKAGING (Boceto Fila 2 Centro) */}
          {expenseSubView === 'packaging' && (
            <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-xs">
              <div className="mb-6 flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setExpenseSubView('menu')}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                  </button>
                  <div className="rounded-lg border border-gray-300 bg-stone-50 px-4 py-1.5">
                    <h3 className="font-bold tracking-wide text-gray-800 uppercase">PACKAGING</h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCardModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-600 bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-amber-700"
                >
                  <Plus className="h-4 w-4" />+ NUEVO GASTO
                </button>
              </div>

              {cards.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  No hay gastos de packaging o tarjetas cargados. Tocá &ldquo;+ NUEVO GASTO&rdquo;
                  para cargar uno.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-gray-500">
                        <th className="px-4 py-3 font-medium">Descripción</th>
                        <th className="px-4 py-3 font-medium">Fecha</th>
                        <th className="px-4 py-3 text-center font-medium">Cantidad</th>
                        <th className="px-4 py-3 text-right font-medium">Precio Unit.</th>
                        <th className="px-4 py-3 text-right font-medium">Total Gastado</th>
                        <th className="px-4 py-3 text-center font-medium">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cards.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {c.title}
                            {c.notes && <p className="text-[11px] text-gray-400">{c.notes}</p>}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{c.date}</td>
                          <td className="px-4 py-3 text-center font-bold text-gray-700">
                            {c.quantity.toLocaleString('es-AR')} u.
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-700">
                            ${c.unitPrice.toLocaleString('es-AR')}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-amber-900">
                            ${(c.quantity * c.unitPrice).toLocaleString('es-AR')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('¿Eliminar este registro?')) {
                                  setCards(cards.filter((card) => card.id !== c.id));
                                  toast.success('Eliminado');
                                }
                              }}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sub-vista: OTROS (Boceto Fila 2 Derecha) */}
          {expenseSubView === 'otros' && (
            <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-xs">
              <div className="mb-6 flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setExpenseSubView('menu')}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                  </button>
                  <div className="rounded-lg border border-gray-300 bg-stone-50 px-4 py-1.5">
                    <h3 className="font-bold tracking-wide text-gray-800 uppercase">OTROS...</h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOtherModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-purple-700 bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-purple-800"
                >
                  <Plus className="h-4 w-4" />+ NUEVO GASTO
                </button>
              </div>

              {otherExpenses.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  No hay otros gastos cargados. Tocá &ldquo;+ NUEVO GASTO&rdquo; para agregar
                  tintas, servidor, etc.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-gray-500">
                        <th className="px-4 py-3 font-medium">Concepto / Gasto</th>
                        <th className="px-4 py-3 font-medium">Fecha</th>
                        <th className="px-4 py-3 text-center font-medium">Unidades</th>
                        <th className="px-4 py-3 text-right font-medium">Precio Unit.</th>
                        <th className="px-4 py-3 text-right font-medium">Total Gastado</th>
                        <th className="px-4 py-3 text-center font-medium">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {otherExpenses.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {o.concept}
                            {o.notes && <p className="text-[11px] text-gray-400">{o.notes}</p>}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{o.date}</td>
                          <td className="px-4 py-3 text-center font-bold text-gray-700">
                            {o.quantity} u.
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-700">
                            ${o.unitPrice.toLocaleString('es-AR')}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-purple-900">
                            ${(o.quantity * o.unitPrice).toLocaleString('es-AR')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('¿Eliminar este gasto?')) {
                                  setOtherExpenses(otherExpenses.filter((oth) => oth.id !== o.id));
                                  toast.success('Eliminado');
                                }
                              }}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* HOJA 2: PRECIOS RECOMENDADOS (Boceto Inferior: Tabla Limpia)          */}
      {/* ===================================================================== */}
      {activeSheet === 'precios' && (
        <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-xs">
          <div className="mb-6 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-bold text-gray-900 uppercase">
                PRECIOS RECOMENDADOS PARA LA WEB
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Basado en el costo neto a proveedor + envío + extras + margen del {marginPercent}%
              </p>
            </div>

            {/* Selector de margen (100% por defecto) */}
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-stone-50 px-3 py-1.5">
              <span className="text-xs font-semibold text-gray-600">Margen sobre costo:</span>
              <input
                type="number"
                min={10}
                max={300}
                value={marginPercent}
                onChange={(e) => setMarginPercent(Number(e.target.value) || 0)}
                className="w-16 rounded border border-gray-300 bg-white px-2 py-0.5 text-center text-xs font-bold text-gray-800"
              />
              <span className="text-xs font-bold text-gray-600">%</span>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No hay pedidos cargados en la Hoja 1. Agregá al menos un pedido para ver los precios
              recomendados.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-600">
                    <th className="px-4 py-3 font-bold">Producto</th>
                    <th className="px-4 py-3 text-right font-bold">Precio Unit. Proveedor</th>
                    <th className="px-4 py-3 text-right font-bold text-blue-700">Gastos Extras</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-900">
                      Costo Real Base
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-[#254642]">
                      Intervalo Sugerido Web
                    </th>
                    <th className="px-4 py-3 text-right font-bold text-green-700">
                      Ganancia Estimada
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.flatMap((ord) => {
                    const orderTotalQty = ord.items.reduce((s, it) => s + it.quantity, 0);
                    const shippingPerUnit =
                      orderTotalQty > 0 ? ord.shippingCost / orderTotalQty : 0;

                    return ord.items.map((it) => {
                      const totalExtras =
                        shippingPerUnit + cardCostPerUnit + otherCostPerProductUnit;
                      const realCost = it.unitPrice + totalExtras;

                      // 1. Mínimo (Piso donde no pierde un peso, cubre 100% de costos + 10% colchón)
                      const minPrice = Math.ceil((realCost * 1.1) / 100) * 100;

                      // 2. Recomendado: 100% sobre costo neto (Costo x 2)
                      const recommendedPrice =
                        Math.ceil((realCost * (1 + marginPercent / 100)) / 100) * 100;

                      // 3. Máximo Ubicado: precio premium de mercado
                      const maxPrice = Math.ceil((realCost * 2.3) / 100) * 100;

                      const profit = recommendedPrice - realCost;

                      return (
                        <tr key={`${ord.id}-${it.id}`} className="hover:bg-stone-50/50">
                          {/* Nombre */}
                          <td className="px-4 py-3">
                            <p className="font-bold text-gray-900">{it.name}</p>
                            <span className="text-[10px] text-gray-400">Pedido: {ord.title}</span>
                          </td>

                          {/* Precio Unitario Proveedor */}
                          <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-800">
                            ${it.unitPrice.toLocaleString('es-AR')}
                          </td>

                          {/* Gastos Extras */}
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono text-sm font-bold text-blue-700">
                              +${Math.round(totalExtras).toLocaleString('es-AR')}
                            </span>
                            <div className="text-[10px] text-gray-400">
                              Env: ${shippingPerUnit.toFixed(0)} | Pack: $
                              {cardCostPerUnit.toFixed(0)}
                            </div>
                          </td>

                          {/* Costo Real Base */}
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono text-sm font-black text-gray-900">
                              ${Math.round(realCost).toLocaleString('es-AR')}
                            </span>
                            <span className="block text-[10px] text-gray-400">Piso real</span>
                          </td>

                          {/* Intervalo Recomendado */}
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                              {/* Mínimo */}
                              <div className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-center">
                                <span className="block text-[9px] tracking-wider text-gray-500 uppercase">
                                  Mínimo
                                </span>
                                <span className="font-mono font-bold text-gray-700">
                                  ${minPrice.toLocaleString('es-AR')}
                                </span>
                              </div>

                              <span className="text-gray-300">→</span>

                              {/* Recomendado (100%) */}
                              <div className="rounded-md border-2 border-[#D4AF37] bg-amber-50/70 px-2.5 py-1 text-center shadow-xs">
                                <span className="block text-[9px] font-bold tracking-wider text-[#254642] uppercase">
                                  Sugerido Web ({marginPercent}%)
                                </span>
                                <span className="font-mono text-sm font-black text-[#254642]">
                                  ${recommendedPrice.toLocaleString('es-AR')}
                                </span>
                              </div>

                              <span className="text-gray-300">→</span>

                              {/* Máximo Ubicado */}
                              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-center">
                                <span className="block text-[9px] tracking-wider text-emerald-700 uppercase">
                                  Máx. Ubicado
                                </span>
                                <span className="font-mono font-bold text-emerald-800">
                                  ${maxPrice.toLocaleString('es-AR')}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Ganancia */}
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono text-sm font-black text-green-700">
                              +${Math.round(profit).toLocaleString('es-AR')}
                            </span>
                            <span className="block text-[10px] font-semibold text-green-600">
                              +{marginPercent}% sobre costo
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* HOJA 3: RESUMEN Y BALANCE GENERAL (LOS CUADRADOS DE CADA GASTO)      */}
      {/* ===================================================================== */}
      {activeSheet === 'resumen' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-xs">
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 uppercase">
                  BALANCE GENERAL Y TOTALES
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Resumen consolidado de todos los gastos registrados en Puros Mates
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50"
              >
                <Download className="h-4 w-4 text-gray-500" />
                <span>Descargar en Excel (CSV)</span>
              </button>
            </div>

            {/* Cuadrados de cada gasto sumado */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Cuadro 1: Mercadería */}
              <div className="rounded-xl border border-gray-200 bg-stone-50/70 p-4 shadow-xs">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-bold uppercase">Mercadería Pura</span>
                  <Package className="h-5 w-5 text-[#254642]" />
                </div>
                <p className="mt-2 text-2xl font-black text-gray-900">
                  ${totalProductsCost.toLocaleString('es-AR')}
                </p>
                <span className="mt-1 block text-xs text-gray-500">
                  {totalProductsQuantity} productos en {orders.length} pedidos
                </span>
              </div>

              {/* Cuadro 2: Envíos */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-xs">
                <div className="flex items-center justify-between text-blue-700">
                  <span className="text-xs font-bold uppercase">Envíos / Fletes</span>
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <p className="mt-2 text-2xl font-black text-blue-950">
                  ${totalShippingCost.toLocaleString('es-AR')}
                </p>
                <span className="mt-1 block text-xs text-blue-700">Flete de todos los pedidos</span>
              </div>

              {/* Cuadro 3: Packaging */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
                <div className="flex items-center justify-between text-amber-700">
                  <span className="text-xs font-bold uppercase">Packaging & Tarjetas</span>
                  <CreditCard className="h-5 w-5 text-amber-600" />
                </div>
                <p className="mt-2 text-2xl font-black text-amber-950">
                  ${totalCardsCost.toLocaleString('es-AR')}
                </p>
                <span className="mt-1 block text-xs text-amber-700">
                  ${cardCostPerUnit.toFixed(1)} c/u ({totalCardsCount} u. compradas)
                </span>
              </div>

              {/* Cuadro 4: Otros Gastos */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 shadow-xs">
                <div className="flex items-center justify-between text-purple-700">
                  <span className="text-xs font-bold uppercase">Otros Gastos Libres</span>
                  <Layers className="h-5 w-5 text-purple-600" />
                </div>
                <p className="mt-2 text-2xl font-black text-purple-950">
                  ${totalOtherCost.toLocaleString('es-AR')}
                </p>
                <span className="mt-1 block text-xs text-purple-700">
                  {otherExpenses.length} conceptos (servidor, tintas, etc.)
                </span>
              </div>
            </div>

            {/* Gran Total Invertido */}
            <div className="mt-6 rounded-2xl border-2 border-[#D4AF37] bg-amber-50/50 p-6 text-center shadow-xs">
              <span className="text-xs font-bold tracking-wider text-[#254642] uppercase">
                GRAN TOTAL INVERTIDO EN EL NEGOCIO
              </span>
              <p className="mt-1 text-3xl font-black text-[#254642] sm:text-4xl">
                ${grandTotalCost.toLocaleString('es-AR')}
              </p>
              <p className="mt-1 text-xs text-amber-800">
                Suma total de mercadería + fletes + packaging + otros gastos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* NAVEGADOR INFERIOR DE HOJAS (COMO EN EXCEL / BOCETO DE LULITA)       */}
      {/* ===================================================================== */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            setActiveSheet('gastos');
            setExpenseSubView('menu');
          }}
          className={`rounded-xl border-2 px-5 py-2.5 text-xs font-extrabold tracking-wider uppercase shadow-xs transition ${
            activeSheet === 'gastos'
              ? 'border-[#254642] bg-[#254642] text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
        >
          HOJA UNO -&gt; GASTOS
        </button>

        <button
          type="button"
          onClick={() => setActiveSheet('precios')}
          className={`rounded-xl border-2 px-5 py-2.5 text-xs font-extrabold tracking-wider uppercase shadow-xs transition ${
            activeSheet === 'precios'
              ? 'border-[#254642] bg-[#254642] text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
        >
          HOJA DOS -&gt; PRECIOS RECOMENDADOS
        </button>

        <button
          type="button"
          onClick={() => setActiveSheet('resumen')}
          className={`rounded-xl border-2 px-5 py-2.5 text-xs font-extrabold tracking-wider uppercase shadow-xs transition ${
            activeSheet === 'resumen'
              ? 'border-[#254642] bg-[#254642] text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
        >
          HOJA TRES -&gt; TOTALES Y BALANCE
        </button>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: NUEVO PEDIDO                                                 */}
      {/* ===================================================================== */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#254642]" />
                <h3 className="text-lg font-bold text-[#254642]">Cargar Nuevo Pedido</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Nombre o Referencia del Pedido *
                </label>
                <input
                  type="text"
                  required
                  value={orderFormTitle}
                  onChange={(e) => setOrderFormTitle(e.target.value)}
                  placeholder="Ej: Pedido Mayorista Mates Mayo"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">
                    Productos incluidos en este pedido *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOrderItemRow}
                    className="inline-flex items-center gap-1 rounded bg-[#254642] px-2.5 py-1 text-xs font-bold text-white transition hover:bg-[#1b3330]"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar otro producto
                  </button>
                </div>

                <div className="space-y-2">
                  {orderFormItems.map((item, index) => {
                    const rowSubtotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);

                    return (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/60 p-2.5"
                      >
                        <div className="min-w-[160px] flex-1">
                          <span className="text-[10px] text-gray-400">Producto</span>
                          <input
                            type="text"
                            required
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...orderFormItems];
                              updated[index].name = e.target.value;
                              setOrderFormItems(updated);
                            }}
                            placeholder="Nombre del mate o accesorio"
                            className="w-full rounded border border-gray-300 bg-white p-1.5 text-xs focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>

                        <div className="w-20">
                          <span className="text-[10px] text-gray-400">Cantidad</span>
                          <input
                            type="number"
                            required
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...orderFormItems];
                              updated[index].quantity =
                                e.target.value === '' ? '' : Number(e.target.value);
                              setOrderFormItems(updated);
                            }}
                            placeholder="Cant."
                            className="w-full rounded border border-gray-300 bg-white p-1.5 text-center text-xs focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>

                        <div className="w-28">
                          <span className="text-[10px] text-gray-400">Precio Unit. ($)</span>
                          <input
                            type="number"
                            required
                            min={1}
                            value={item.unitPrice}
                            onChange={(e) => {
                              const updated = [...orderFormItems];
                              updated[index].unitPrice =
                                e.target.value === '' ? '' : Number(e.target.value);
                              setOrderFormItems(updated);
                            }}
                            placeholder="Unitario $"
                            className="w-full rounded border border-gray-300 bg-white p-1.5 text-right text-xs focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>

                        <div className="w-24 text-right">
                          <span className="text-[10px] text-gray-400">Subtotal</span>
                          <p className="font-mono text-xs font-bold text-[#254642]">
                            ${rowSubtotal.toLocaleString('es-AR')}
                          </p>
                        </div>

                        {orderFormItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOrderItemRow(index)}
                            className="text-gray-400 hover:text-red-600"
                            title="Quitar fila"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Costo de Envío */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <label className="block text-xs font-bold text-blue-900">
                      Costo del Envío / Flete de este pedido ($)
                    </label>
                    <span className="text-[11px] text-blue-700">
                      El sistema dividirá este envío automáticamente entre todos los productos de
                      este pedido.
                    </span>
                  </div>
                  <div className="w-36">
                    <input
                      type="number"
                      min={0}
                      value={orderFormShipping}
                      onChange={(e) =>
                        setOrderFormShipping(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="Ej: 3500"
                      className="w-full rounded-lg border border-blue-300 bg-white p-2 text-right font-mono text-sm font-bold text-blue-950 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Notas o aclaraciones (Opcional)
                </label>
                <input
                  type="text"
                  value={orderFormNotes}
                  onChange={(e) => setOrderFormNotes(e.target.value)}
                  placeholder="Ej: Pagado por transferencia bancaria"
                  className="w-full rounded-lg border border-gray-300 p-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#254642] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1a3330]"
                >
                  Guardar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: NUEVO PACKAGING                                              */}
      {/* ===================================================================== */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-bold text-gray-800">Cargar Packaging / Tarjetas</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Descripción / Detalle *
                </label>
                <input
                  type="text"
                  required
                  value={cardFormTitle}
                  onChange={(e) => setCardFormTitle(e.target.value)}
                  placeholder="Ej: Tarjetas de agradecimiento con logo"
                  className="w-full rounded-lg border border-gray-300 p-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={cardFormQty}
                    onChange={(e) =>
                      setCardFormQty(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Ej: 500"
                    className="w-full rounded-lg border border-gray-300 p-2 text-center text-sm font-bold focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Precio Unitario ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0.1}
                    step="any"
                    value={cardFormUnitPrice}
                    onChange={(e) =>
                      setCardFormUnitPrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Ej: 80"
                    className="w-full rounded-lg border border-gray-300 p-2 text-right text-sm font-bold focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-right">
                <span className="text-xs text-amber-800">Total calculado:</span>
                <p className="font-mono text-base font-black text-amber-950">
                  $
                  {(Number(cardFormQty || 0) * Number(cardFormUnitPrice || 0)).toLocaleString(
                    'es-AR'
                  )}
                </p>
                <span className="text-[10px] text-gray-500">
                  Se sumará a los costos extras de tus productos.
                </span>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Notas (Opcional)
                </label>
                <input
                  type="text"
                  value={cardFormNotes}
                  onChange={(e) => setCardFormNotes(e.target.value)}
                  placeholder="Ej: Papel kraft con sello"
                  className="w-full rounded-lg border border-gray-300 p-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowCardModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-800"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: NUEVO OTRO GASTO                                             */}
      {/* ===================================================================== */}
      {showOtherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-700" />
                <h3 className="text-lg font-bold text-gray-800">Cargar Otro Gasto</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOtherModal(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOther} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  ¿Qué es este gasto? (Concepto) *
                </label>
                <input
                  type="text"
                  required
                  value={otherFormConcept}
                  onChange={(e) => setOtherFormConcept(e.target.value)}
                  placeholder="Ej: Servidor web, Tinta para sellos, Cinta"
                  className="w-full rounded-lg border border-gray-300 p-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Unidades / Cantidad *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={otherFormQty}
                    onChange={(e) =>
                      setOtherFormQty(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Ej: 1"
                    className="w-full rounded-lg border border-gray-300 p-2 text-center text-sm font-bold focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Monto / Precio Unit. ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={otherFormUnitPrice}
                    onChange={(e) =>
                      setOtherFormUnitPrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Ej: 8000"
                    className="w-full rounded-lg border border-gray-300 p-2 text-right text-sm font-bold focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-3 text-right">
                <span className="text-xs text-purple-800">Total del gasto:</span>
                <p className="font-mono text-base font-black text-purple-950">
                  $
                  {(Number(otherFormQty || 1) * Number(otherFormUnitPrice || 0)).toLocaleString(
                    'es-AR'
                  )}
                </p>
                <span className="text-[10px] text-gray-500">
                  Se dividirá entre tus productos para no perder margen.
                </span>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Notas (Opcional)
                </label>
                <input
                  type="text"
                  value={otherFormNotes}
                  onChange={(e) => setOtherFormNotes(e.target.value)}
                  placeholder="Ej: Pago mensual recurrente"
                  className="w-full rounded-lg border border-gray-300 p-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowOtherModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-800 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-900"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
