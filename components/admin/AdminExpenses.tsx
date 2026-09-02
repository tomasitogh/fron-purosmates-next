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

// Datos de ejemplo para que Lulita vea cómo funciona de inmediato
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
  // Pestaña activa (como hojas de Excel)
  const [activeSheet, setActiveSheet] = useState<'expenses' | 'prices'>('expenses');

  // Estado de los registros
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [cards, setCards] = useState<CardExpense[]>([]);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpense[]>([]);

  // Margen deseado para el precio recomendado (por defecto 55%)
  const [marginPercent, setMarginPercent] = useState<number>(55);

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

  // Formulario Tarjetas
  const [cardFormTitle, setCardFormTitle] = useState('Tarjetas de agradecimiento / packaging');
  const [cardFormQty, setCardFormQty] = useState<number | ''>('');
  const [cardFormUnitPrice, setCardFormUnitPrice] = useState<number | ''>('');
  const [cardFormNotes, setCardFormNotes] = useState('');

  // Formulario Otros
  const [otherFormConcept, setOtherFormConcept] = useState('');
  const [otherFormQty, setOtherFormQty] = useState<number | ''>(1);
  const [otherFormUnitPrice, setOtherFormUnitPrice] = useState<number | ''>('');
  const [otherFormNotes, setOtherFormNotes] = useState('');

  // Carga inicial de datos desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setOrders(parsed.orders || []);
        setCards(parsed.cards || []);
        setOtherExpenses(parsed.otherExpenses || []);
        if (parsed.marginPercent) setMarginPercent(parsed.marginPercent);
      } else {
        // Sembrar datos iniciales de ejemplo
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

  // Guardar en localStorage automáticamente al cambiar
  useEffect(() => {
    try {
      const data = { orders, cards, otherExpenses, marginPercent };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignorar errores de quota de storage
    }
  }, [orders, cards, otherExpenses, marginPercent]);

  // ==========================================
  // CÁLCULOS GLOBALES Y PRORRATEOS
  // ==========================================

  // Total de unidades de productos comprados en todos los pedidos
  const totalProductsQuantity = orders.reduce((acc, ord) => {
    return acc + ord.items.reduce((itemAcc, item) => itemAcc + Number(item.quantity || 0), 0);
  }, 0);

  // Total gastado en mercadería pura
  const totalProductsCost = orders.reduce((acc, ord) => {
    return (
      acc +
      ord.items.reduce(
        (itemAcc, item) => itemAcc + Number(item.quantity || 0) * Number(item.unitPrice || 0),
        0
      )
    );
  }, 0);

  // Total gastado en envíos de proveedor
  const totalShippingCost = orders.reduce((acc, ord) => acc + Number(ord.shippingCost || 0), 0);

  // Total gastado en pedidos (Mercadería + Envío)
  const totalOrdersCost = totalProductsCost + totalShippingCost;

  // Total tarjetas y costo unitario por tarjeta
  const totalCardsCost = cards.reduce(
    (acc, card) => acc + Number(card.quantity || 0) * Number(card.unitPrice || 0),
    0
  );
  const totalCardsCount = cards.reduce((acc, card) => acc + Number(card.quantity || 0), 0);
  const cardCostPerUnit = totalCardsCount > 0 ? totalCardsCost / totalCardsCount : 0;

  // Total otros gastos y prorrateo por unidad de producto
  const totalOtherCost = otherExpenses.reduce(
    (acc, oth) => acc + Number(oth.quantity || 0) * Number(oth.unitPrice || 0),
    0
  );
  const otherCostPerProductUnit =
    totalProductsQuantity > 0 ? totalOtherCost / totalProductsQuantity : 0;

  // Gran total invertido en el negocio
  const grandTotalCost = totalOrdersCost + totalCardsCost + totalOtherCost;

  // ==========================================
  // MANEJADORES DE FORMULARIOS
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
      toast.error('Por favor, ingresá un nombre o referencia para el pedido');
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
    // Reset
    setOrderFormTitle('');
    setOrderFormShipping('');
    setOrderFormNotes('');
    setOrderFormItems([{ id: '1', name: '', quantity: '', unitPrice: '' }]);
    toast.success('¡Pedido a proveedor guardado!');
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
      title: cardFormTitle.trim() || 'Tarjetas de presentación / agradecimiento',
      quantity: qty,
      unitPrice,
      notes: cardFormNotes.trim() || undefined,
    };

    setCards([newCard, ...cards]);
    setShowCardModal(false);
    setCardFormQty('');
    setCardFormUnitPrice('');
    setCardFormNotes('');
    toast.success('¡Gasto en tarjetas guardado!');
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
      toast.error('Ingresá un monto o precio unitario válido');
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
    toast.success('¡Otro gasto guardado!');
  };

  // Exportar a archivo CSV para Excel
  const handleExportCSV = () => {
    const rows = [
      ['Tipo', 'Descripción / Concepto', 'Fecha', 'Cantidad', 'Precio Unitario', 'Total'],
    ];

    orders.forEach((ord) => {
      ord.items.forEach((it) => {
        rows.push([
          'Pedido (Mercadería)',
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
        'Tarjetas',
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
    toast.success('¡Planilla de gastos descargada!');
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Navegación de Hojas tipo Excel */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[#254642] p-2 text-white shadow-xs">
              <FileSpreadsheet className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#254642]">Control de Gastos y Precios Web</h2>
              <p className="text-xs text-gray-500">
                Planilla de costos, prorrateo de envíos/extras y calculadora de rentabilidad
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Hoja (Estilo Excel) */}
        <div className="flex items-center rounded-lg border border-gray-300 bg-gray-100 p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveSheet('expenses')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition sm:text-sm ${
              activeSheet === 'expenses'
                ? 'bg-white text-[#254642] shadow-xs'
                : 'text-gray-600 hover:text-[#254642]'
            }`}
          >
            <span>📝 Hoja 1: Registro de Gastos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSheet('prices')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition sm:text-sm ${
              activeSheet === 'prices'
                ? 'bg-white text-[#254642] shadow-xs'
                : 'text-gray-600 hover:text-[#254642]'
            }`}
          >
            <span>🏷️ Hoja 2: Precios Recomendados</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero Rápido */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Mercadería</span>
            <Package className="h-4 w-4 text-[#254642]" />
          </div>
          <p className="mt-1 text-base font-bold text-gray-800 sm:text-lg">
            ${totalProductsCost.toLocaleString('es-AR')}
          </p>
          <span className="text-[11px] text-gray-400">
            {totalProductsQuantity} productos comprados
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Envíos Proveedor</span>
            <Truck className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-1 text-base font-bold text-gray-800 sm:text-lg">
            ${totalShippingCost.toLocaleString('es-AR')}
          </p>
          <span className="text-[11px] text-gray-400">{orders.length} pedidos con flete</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Tarjetas & Pack</span>
            <CreditCard className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-1 text-base font-bold text-gray-800 sm:text-lg">
            ${totalCardsCost.toLocaleString('es-AR')}
          </p>
          <span className="text-[11px] text-gray-400">
            ${cardCostPerUnit.toFixed(1)} c/u ({totalCardsCount} u.)
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Otros Gastos</span>
            <Layers className="h-4 w-4 text-purple-600" />
          </div>
          <p className="mt-1 text-base font-bold text-gray-800 sm:text-lg">
            ${totalOtherCost.toLocaleString('es-AR')}
          </p>
          <span className="text-[11px] text-gray-400">{otherExpenses.length} conceptos varios</span>
        </div>

        <div className="col-span-2 rounded-xl border-2 border-[#D4AF37]/50 bg-amber-50/40 p-3.5 shadow-xs sm:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between text-[#254642]">
            <span className="text-xs font-bold">Total Invertido</span>
            <DollarSign className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <p className="mt-1 text-lg font-black text-[#254642]">
            ${grandTotalCost.toLocaleString('es-AR')}
          </p>
          <span className="text-[11px] font-medium text-amber-700">Gastos en limpio</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* HOJA 1: REGISTRO DE GASTOS                                            */}
      {/* ===================================================================== */}
      {activeSheet === 'expenses' && (
        <div className="space-y-6">
          {/* Botonera de Acciones Rápidas */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-bold text-gray-800">Cargar un nuevo gasto o compra</h3>
                <p className="text-xs text-gray-500">
                  Elegí el tipo de gasto que hiciste para agregarlo a la planilla
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

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Botón 1: Pedido */}
              <button
                type="button"
                onClick={() => setShowOrderModal(true)}
                className="flex items-center gap-3 rounded-xl border-2 border-[#254642]/20 bg-stone-50/70 p-4 text-left transition hover:border-[#254642] hover:bg-white hover:shadow-sm"
              >
                <div className="rounded-lg bg-[#254642] p-2.5 text-white">
                  <Package className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-[#254642]">
                    + Pedido a Proveedor
                  </span>
                  <span className="text-xs text-gray-500">
                    Productos, cantidades, precios y costo de envío
                  </span>
                </div>
              </button>

              {/* Botón 2: Tarjetas */}
              <button
                type="button"
                onClick={() => setShowCardModal(true)}
                className="flex items-center gap-3 rounded-xl border-2 border-amber-300/40 bg-amber-50/30 p-4 text-left transition hover:border-amber-400 hover:bg-white hover:shadow-sm"
              >
                <div className="rounded-lg bg-amber-600 p-2.5 text-white">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-gray-800">
                    + Tarjetas y Packaging
                  </span>
                  <span className="text-xs text-gray-500">
                    Tarjetas de gracias, folletos o packaging
                  </span>
                </div>
              </button>

              {/* Botón 3: Otros Gastos */}
              <button
                type="button"
                onClick={() => setShowOtherModal(true)}
                className="flex items-center gap-3 rounded-xl border-2 border-purple-200 bg-purple-50/30 p-4 text-left transition hover:border-purple-400 hover:bg-white hover:shadow-sm"
              >
                <div className="rounded-lg bg-purple-700 p-2.5 text-white">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-gray-800">+ Otro Gasto Libre</span>
                  <span className="text-xs text-gray-500">
                    Servidor web, tinta de sellos, cinta, etc.
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Listado 1: Pedidos a Proveedor */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
            <div className="border-b border-gray-200 bg-stone-50/60 px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#254642]" />
                  <h4 className="text-sm font-bold text-[#254642]">
                    Historial de Pedidos de Mercadería ({orders.length})
                  </h4>
                </div>
                <span className="text-xs font-semibold text-gray-500">
                  Total Pedidos: ${totalOrdersCost.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                No hay pedidos de mercadería cargados todavía. Tocá &ldquo;+ Pedido a
                Proveedor&rdquo; para empezar.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {orders.map((ord) => {
                  const orderItemsTotal = ord.items.reduce(
                    (sum, it) => sum + it.quantity * it.unitPrice,
                    0
                  );
                  const orderTotalQty = ord.items.reduce((sum, it) => sum + it.quantity, 0);
                  const shippingPerUnit = orderTotalQty > 0 ? ord.shippingCost / orderTotalQty : 0;

                  return (
                    <div key={ord.id} className="p-4 transition hover:bg-stone-50/40">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-bold text-gray-800">{ord.title}</h5>
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                              {ord.date}
                            </span>
                          </div>
                          {ord.notes && <p className="text-xs text-gray-500">{ord.notes}</p>}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs text-gray-500">Total con envío:</span>
                            <p className="text-sm font-bold text-[#254642]">
                              ${(orderItemsTotal + ord.shippingCost).toLocaleString('es-AR')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('¿Eliminar este pedido de la planilla?')) {
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

                      {/* Tabla interna de productos del pedido */}
                      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100 bg-gray-50/50 p-2.5">
                        <table className="w-full text-left text-xs text-gray-600">
                          <thead>
                            <tr className="border-b border-gray-200 text-gray-400">
                              <th className="pb-1 font-medium">Producto</th>
                              <th className="pb-1 text-center font-medium">Cantidad</th>
                              <th className="pb-1 text-right font-medium">
                                Precio Unit. Proveedor
                              </th>
                              <th className="pb-1 text-right font-medium">Subtotal</th>
                              <th className="pb-1 text-right font-medium text-blue-600">
                                Flete x Unidad
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {ord.items.map((it) => (
                              <tr key={it.id}>
                                <td className="py-1.5 font-medium text-gray-800">{it.name}</td>
                                <td className="py-1.5 text-center">{it.quantity} u.</td>
                                <td className="py-1.5 text-right font-mono">
                                  ${it.unitPrice.toLocaleString('es-AR')}
                                </td>
                                <td className="py-1.5 text-right font-mono font-bold text-gray-700">
                                  ${(it.quantity * it.unitPrice).toLocaleString('es-AR')}
                                </td>
                                <td className="py-1.5 text-right font-mono text-blue-600">
                                  +${shippingPerUnit.toFixed(1)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-gray-200 pt-1 text-gray-500">
                              <td colSpan={3} className="pt-2 font-medium">
                                Costo de flete/envío total de este pedido:
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

          {/* Listado 2: Tarjetas y Packaging */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
            <div className="border-b border-gray-200 bg-amber-50/40 px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-amber-700" />
                  <h4 className="text-sm font-bold text-amber-900">
                    Tarjetas y Packaging ({cards.length})
                  </h4>
                </div>
                <span className="text-xs font-semibold text-amber-900">
                  Total: ${totalCardsCost.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {cards.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                No hay compras de tarjetas cargadas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                      <th className="px-4 py-2 font-medium">Descripción</th>
                      <th className="px-4 py-2 font-medium">Fecha</th>
                      <th className="px-4 py-2 text-center font-medium">Cantidad</th>
                      <th className="px-4 py-2 text-right font-medium">Precio Unit.</th>
                      <th className="px-4 py-2 text-right font-medium">Total Gastado</th>
                      <th className="px-4 py-2 text-center font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cards.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">
                          {c.title}
                          {c.notes && <p className="text-[11px] text-gray-400">{c.notes}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">{c.date}</td>
                        <td className="px-4 py-2.5 text-center font-semibold text-gray-700">
                          {c.quantity.toLocaleString('es-AR')} u.
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                          ${c.unitPrice.toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-[#254642]">
                          ${(c.quantity * c.unitPrice).toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('¿Eliminar este registro de tarjetas?')) {
                                setCards(cards.filter((card) => card.id !== c.id));
                                toast.success('Tarjetas eliminadas');
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

          {/* Listado 3: Otros Gastos */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
            <div className="border-b border-gray-200 bg-purple-50/40 px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-700" />
                  <h4 className="text-sm font-bold text-purple-900">
                    Otros Gastos Libres ({otherExpenses.length})
                  </h4>
                </div>
                <span className="text-xs font-semibold text-purple-900">
                  Total: ${totalOtherCost.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {otherExpenses.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                No hay otros gastos cargados. Tocá &ldquo;+ Otro Gasto Libre&rdquo; para registrar
                tintas, servidor, etc.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                      <th className="px-4 py-2 font-medium">Concepto / Gasto</th>
                      <th className="px-4 py-2 font-medium">Fecha</th>
                      <th className="px-4 py-2 text-center font-medium">Unidades</th>
                      <th className="px-4 py-2 text-right font-medium">Precio Unit.</th>
                      <th className="px-4 py-2 text-right font-medium">Total Gastado</th>
                      <th className="px-4 py-2 text-center font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {otherExpenses.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">
                          {o.concept}
                          {o.notes && <p className="text-[11px] text-gray-400">{o.notes}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">{o.date}</td>
                        <td className="px-4 py-2.5 text-center font-semibold text-gray-700">
                          {o.quantity} u.
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                          ${o.unitPrice.toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-purple-900">
                          ${(o.quantity * o.unitPrice).toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('¿Eliminar este gasto?')) {
                                setOtherExpenses(otherExpenses.filter((oth) => oth.id !== o.id));
                                toast.success('Gasto eliminado');
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* HOJA 2: PRECIOS RECOMENDADOS PARA LA WEB                              */}
      {/* ===================================================================== */}
      {activeSheet === 'prices' && (
        <div className="space-y-6">
          {/* Panel Explicativo y Slider de Margen */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-gray-900">
                  <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
                  Calculadora de Precios Sugeridos y Rentabilidad
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  El sistema toma el <strong>precio que le pagás al proveedor</strong>, le suma{' '}
                  <strong>su parte del envío</strong>, el <strong>costo de tarjetas</strong> y los{' '}
                  <strong>gastos extras</strong>, y calcula el precio ideal para vender en la tienda
                  online.
                </p>
              </div>

              {/* Control de % de Ganancia Deseada */}
              <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <div>
                  <span className="block text-xs font-bold text-amber-900">
                    Margen de Ganancia Deseado:
                  </span>
                  <span className="text-[11px] text-amber-700">Por defecto: 55%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(Number(e.target.value) || 0)}
                    className="w-16 rounded border border-gray-300 bg-white px-2 py-1 text-center font-bold text-gray-800"
                  />
                  <span className="font-bold text-gray-700">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Precios Recomendados */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
            <div className="border-b border-gray-200 bg-stone-50 px-5 py-3">
              <h4 className="text-sm font-bold text-[#254642]">
                Lista de Productos y Precios para la Tienda
              </h4>
            </div>

            {orders.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                Aún no hay productos cargados en la Hoja 1. Agregá al menos un pedido a proveedor
                para ver las recomendaciones de precios.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                      <th className="px-4 py-3 font-semibold">Producto</th>
                      <th className="px-4 py-3 text-right font-semibold">Precio Unit. Proveedor</th>
                      <th className="px-4 py-3 text-right font-semibold text-blue-700">
                        Gastos Extras Unit.
                        <span className="block text-[10px] font-normal text-gray-400">
                          (Envío + Tarjeta + Otros)
                        </span>
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900">
                        Costo Real Base
                        <span className="block text-[10px] font-normal text-gray-400">
                          (Piso absoluto)
                        </span>
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-amber-900">
                        Intervalo Recomendado para la Web
                        <span className="block text-[10px] font-normal text-gray-400">
                          Mínimo vs Recomendado ({marginPercent}%) vs Máximo
                        </span>
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-green-700">
                        Ganancia x Unidad
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Agrupamos por producto de cada pedido */}
                    {orders.flatMap((ord) => {
                      const orderTotalQty = ord.items.reduce((s, it) => s + it.quantity, 0);
                      const shippingPerUnit =
                        orderTotalQty > 0 ? ord.shippingCost / orderTotalQty : 0;

                      return ord.items.map((it) => {
                        // Gastos extras unitarios
                        const totalExtras =
                          shippingPerUnit + cardCostPerUnit + otherCostPerProductUnit;

                        // Costo real unitario
                        const realCost = it.unitPrice + totalExtras;

                        // Intervalo de Precios:
                        // 1. Mínimo (donde no pierde un peso, cubre costos + 10% por imprevistos/comisiones)
                        const minPrice = Math.ceil((realCost * 1.1) / 100) * 100;

                        // 2. Recomendado (con el margen indicado, ej. 55% sobre costo / markup)
                        const recommendedPrice =
                          Math.ceil((realCost * (1 + marginPercent / 100)) / 100) * 100;

                        // 3. Máximo "Ubicado" (margen premium para mayor ganancia sin quedar fuera de mercado)
                        const maxPrice = Math.ceil((realCost * 2.2) / 100) * 100;

                        // Ganancia con el precio recomendado
                        const profit = recommendedPrice - realCost;
                        const profitPercent = ((profit / realCost) * 100).toFixed(0);

                        return (
                          <tr key={`${ord.id}-${it.id}`} className="hover:bg-stone-50/60">
                            {/* Producto */}
                            <td className="px-4 py-3">
                              <span className="font-bold text-gray-900">{it.name}</span>
                              <p className="text-[11px] text-gray-400">De: {ord.title}</p>
                            </td>

                            {/* 1. Precio Unitario Proveedor */}
                            <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-800">
                              ${it.unitPrice.toLocaleString('es-AR')}
                            </td>

                            {/* 2. Gastos Extras Unitarios */}
                            <td className="px-4 py-3 text-right">
                              <span className="font-mono text-sm font-bold text-blue-700">
                                +${Math.round(totalExtras).toLocaleString('es-AR')}
                              </span>
                              <div className="text-[10px] text-gray-400">
                                Envío: ${shippingPerUnit.toFixed(0)} | Tarjeta: $
                                {cardCostPerUnit.toFixed(0)} | Otros: $
                                {otherCostPerProductUnit.toFixed(0)}
                              </div>
                            </td>

                            {/* 3. Costo Real Base */}
                            <td className="px-4 py-3 text-right">
                              <span className="font-mono text-sm font-black text-gray-900">
                                ${Math.round(realCost).toLocaleString('es-AR')}
                              </span>
                              <span className="block text-[10px] text-gray-400">Costo total</span>
                            </td>

                            {/* 4. Intervalo Recomendado */}
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                                {/* Mínimo */}
                                <div className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-center">
                                  <span className="block text-[9px] tracking-wider text-gray-500 uppercase">
                                    Mínimo (Piso)
                                  </span>
                                  <span className="font-mono font-bold text-gray-700">
                                    ${minPrice.toLocaleString('es-AR')}
                                  </span>
                                </div>

                                <span className="text-gray-300">→</span>

                                {/* Recomendado */}
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

                            {/* 5. Ganancia */}
                            <td className="px-4 py-3 text-right">
                              <span className="font-mono text-sm font-black text-green-700">
                                +${Math.round(profit).toLocaleString('es-AR')}
                              </span>
                              <span className="block text-[10px] font-semibold text-green-600">
                                {profitPercent}% ganancia
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

          {/* Tips de Negocio para Lulita */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-900">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
              <div>
                <p className="font-bold">¿Cómo interpretar estos números en Puros Mates?</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-blue-800">
                  <li>
                    <strong>Precio Mínimo:</strong> Es el valor piso. Vendiéndolo a este precio no
                    perdés ni un peso (cubre mercadería, flete, tarjetitas y otros gastos).
                  </li>
                  <li>
                    <strong>Precio Sugerido Web:</strong> Es el precio ideal para publicar en la web
                    con tu margen del {marginPercent}%. Podés ajustarlo desde el casillero de arriba
                    cuando quieras.
                  </li>
                  <li>
                    <strong>Máximo Ubicado:</strong> Te permite cobrar un extra en mates con
                    detalles especiales, virolas cinceladas o combos con bombilla sin quedar fuera
                    de mercado.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: NUEVO PEDIDO A PROVEEDOR                                     */}
      {/* ===================================================================== */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#254642]" />
                <h3 className="text-lg font-bold text-[#254642]">
                  Cargar Nuevo Pedido a Proveedor
                </h3>
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

              {/* Lista dinámica de productos */}
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

              {/* Costo de Envío del pedido */}
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
                  placeholder="Ej: Proveedor Misiones - Pagado por transferencia"
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
      {/* MODAL 2: NUEVA COMPRA DE TARJETAS                                     */}
      {/* ===================================================================== */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-bold text-gray-800">Cargar Compra de Tarjetas</h3>
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
                    Cantidad Comprada *
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
                    placeholder="Ej: 50"
                    className="w-full rounded-lg border border-gray-300 p-2 text-right text-sm font-bold focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-right">
                <span className="text-xs text-amber-800">Total calculado de la compra:</span>
                <p className="font-mono text-base font-black text-amber-950">
                  $
                  {(Number(cardFormQty || 0) * Number(cardFormUnitPrice || 0)).toLocaleString(
                    'es-AR'
                  )}
                </p>
                <span className="text-[10px] text-gray-500">
                  Se sumará a los gastos extras de tus mates.
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
                  placeholder="Ej: Imprenta local en papel ilustración"
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
                  Guardar Tarjetas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: NUEVO OTRO GASTO LIBRE                                       */}
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
                  placeholder="Ej: Servidor web, Tinta para sellos, Cinta de embalar"
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
