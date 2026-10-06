'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Download,
  CreditCard,
  Layers,
  X,
  Package,
  ArrowLeft,
  ChevronRight,
  Calendar,
  Building2,
  Check,
  Eye,
  Pencil,
  Truck,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AppDispatch, RootState } from '@/redux/store';
import { fetchAllProductsAdmin, fetchProducts, Product } from '@/redux/productSlice';
import { TokenGetter } from '@/lib/apiClient';

// Modelos de datos
export interface OrderProductItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  productId?: number;
  color?: string;
}

export interface SupplierOrder {
  id: string;
  date: string;
  title: string;
  supplier?: string;
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
const SUPPLIERS_STORAGE_KEY = 'pm-admin-suppliers-v1';

// Proveedores preestablecidos
const DEFAULT_SUPPLIERS = ['Argentino al Límite', 'Aquiles Rosas', 'Ponele H'];

// Colores habituales en Puros Mates
const PUROS_COLORS = [
  'Negro',
  'Marrón',
  'Suela',
  'Chocolate',
  'Crudo / Natural',
  'Bordó',
  'Blanco',
  'Verde',
];

// Datos iniciales de demostración
const DEFAULT_ORDERS: SupplierOrder[] = [
  {
    id: 'ord-1',
    date: new Date().toISOString().split('T')[0],
    title: 'Argentino al Límite - Mates Imperiales y Camioneros',
    supplier: 'Argentino al Límite',
    items: [
      {
        id: 'it-1',
        name: 'Mate Imperial Premium Calabaza',
        color: 'Negro',
        quantity: 10,
        unitPrice: 18000,
      },
      {
        id: 'it-2',
        name: 'Mate Camionero Cuero Vacuno',
        color: 'Suela',
        quantity: 10,
        unitPrice: 15000,
      },
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

interface OrderFormItemState {
  id: string;
  productId?: number;
  name: string;
  color?: string;
  quantity: number | '';
  unitPrice: number | '';
  totalPrice: number | '';
}

interface AdminExpensesProps {
  getToken?: TokenGetter;
}

export default function AdminExpenses({ getToken }: AdminExpensesProps = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const { items: products } = useSelector((state: RootState) => state.products);

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

  // Lista de Proveedores
  const [suppliers, setSuppliers] = useState<string[]>(DEFAULT_SUPPLIERS);

  // Margen deseado: 100% sobre el precio neto (costo x 2)
  const [marginPercent, setMarginPercent] = useState<number>(100);

  // Estados de Modales
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showOtherModal, setShowOtherModal] = useState(false);

  // Estados para Edición y Visor
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [viewingOrder, setViewingOrder] = useState<SupplierOrder | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingOtherId, setEditingOtherId] = useState<string | null>(null);

  // Estado para autocompletado interactivo al escribir en filas de pedido
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);

  // Formulario Pedido
  const [orderFormSupplier, setOrderFormSupplier] = useState<string>('Argentino al Límite');
  const [isAddingNewSupplier, setIsAddingNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [orderFormRef, setOrderFormRef] = useState('');
  const [orderFormDate, setOrderFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderFormShipping, setOrderFormShipping] = useState<number | ''>('');
  const [orderFormNotes, setOrderFormNotes] = useState('');
  const [orderFormItems, setOrderFormItems] = useState<OrderFormItemState[]>([
    { id: '1', name: '', color: '', quantity: 1, unitPrice: '', totalPrice: '' },
  ]);

  // Formulario Packaging / Tarjetas
  const [cardFormDate, setCardFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [cardFormTitle, setCardFormTitle] = useState('');
  const [cardFormQty, setCardFormQty] = useState<number | ''>('');
  const [cardFormUnitPrice, setCardFormUnitPrice] = useState<number | ''>('');
  const [cardFormTotalPrice, setCardFormTotalPrice] = useState<number | ''>('');
  const [cardFormNotes, setCardFormNotes] = useState('');

  // Formulario Otros
  const [otherFormDate, setOtherFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [otherFormConcept, setOtherFormConcept] = useState('');
  const [otherFormQty, setOtherFormQty] = useState<number | ''>(1);
  const [otherFormUnitPrice, setOtherFormUnitPrice] = useState<number | ''>('');
  const [otherFormNotes, setOtherFormNotes] = useState('');

  // Cargar productos de la tienda (activos e inactivos si hay token admin)
  useEffect(() => {
    if (getToken) {
      dispatch(fetchAllProductsAdmin(getToken));
    } else {
      dispatch(fetchProducts());
    }
  }, [dispatch, getToken]);

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

    try {
      const savedSuppliers = localStorage.getItem(SUPPLIERS_STORAGE_KEY);
      if (savedSuppliers) {
        const parsedSuppliers = JSON.parse(savedSuppliers);
        if (Array.isArray(parsedSuppliers) && parsedSuppliers.length > 0) {
          const merged = Array.from(new Set([...DEFAULT_SUPPLIERS, ...parsedSuppliers]));
          setSuppliers(merged);
        }
      }
    } catch {
      // Ignorar errores
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
  // MANEJADORES DE APERTURA Y EDICIÓN
  // ==========================================

  // Abrir nuevo pedido
  const handleOpenNewOrderModal = () => {
    setEditingOrderId(null);
    setOrderFormSupplier(suppliers[0] || 'Argentino al Límite');
    setIsAddingNewSupplier(false);
    setNewSupplierName('');
    setOrderFormRef('');
    setOrderFormDate(new Date().toISOString().split('T')[0]);
    setOrderFormShipping('');
    setOrderFormNotes('');
    setOrderFormItems([
      { id: '1', name: '', color: '', quantity: 1, unitPrice: '', totalPrice: '' },
    ]);
    setShowOrderModal(true);
  };

  // Modificar pedido existente
  const handleEditOrder = (ord: SupplierOrder) => {
    setEditingOrderId(ord.id);
    setOrderFormSupplier(ord.supplier || ord.title);
    setIsAddingNewSupplier(false);
    setNewSupplierName('');
    if (ord.supplier && ord.title.startsWith(ord.supplier)) {
      const remaining = ord.title.replace(ord.supplier, '').replace(/^(\s*-\s*)/, '');
      setOrderFormRef(remaining);
    } else {
      setOrderFormRef('');
    }
    setOrderFormDate(ord.date);
    setOrderFormShipping(ord.shippingCost || '');
    setOrderFormNotes(ord.notes || '');
    setOrderFormItems(
      ord.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        name: it.name,
        color: it.color || '',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.quantity * it.unitPrice,
      }))
    );
    setShowOrderModal(true);
  };

  // Abrir nuevo packaging
  const handleOpenNewCardModal = () => {
    setEditingCardId(null);
    setCardFormDate(new Date().toISOString().split('T')[0]);
    setCardFormTitle('');
    setCardFormQty('');
    setCardFormUnitPrice('');
    setCardFormTotalPrice('');
    setCardFormNotes('');
    setShowCardModal(true);
  };

  // Modificar packaging existente
  const handleEditCard = (c: CardExpense) => {
    setEditingCardId(c.id);
    setCardFormDate(c.date);
    setCardFormTitle(c.title);
    setCardFormQty(c.quantity);
    setCardFormUnitPrice(c.unitPrice);
    setCardFormTotalPrice(c.quantity * c.unitPrice);
    setCardFormNotes(c.notes || '');
    setShowCardModal(true);
  };

  // Abrir nuevo otro gasto
  const handleOpenNewOtherModal = () => {
    setEditingOtherId(null);
    setOtherFormDate(new Date().toISOString().split('T')[0]);
    setOtherFormConcept('');
    setOtherFormQty(1);
    setOtherFormUnitPrice('');
    setOtherFormNotes('');
    setShowOtherModal(true);
  };

  // Modificar otro gasto existente
  const handleEditOther = (o: OtherExpense) => {
    setEditingOtherId(o.id);
    setOtherFormDate(o.date);
    setOtherFormConcept(o.concept);
    setOtherFormQty(o.quantity);
    setOtherFormUnitPrice(o.unitPrice);
    setOtherFormNotes(o.notes || '');
    setShowOtherModal(true);
  };

  // ==========================================
  // MANEJADORES DE FILAS EN PEDIDO
  // ==========================================
  const handleAddOrderItemRow = () => {
    setOrderFormItems([
      ...orderFormItems,
      {
        id: Date.now().toString(),
        name: '',
        color: '',
        quantity: 1,
        unitPrice: '',
        totalPrice: '',
      },
    ]);
  };

  const handleRemoveOrderItemRow = (index: number) => {
    if (orderFormItems.length === 1) return;
    setOrderFormItems(orderFormItems.filter((_, idx) => idx !== index));
  };

  // Sincronización inteligente de precios en Pedido
  const handleItemQtyChange = (index: number, val: string) => {
    const updated = [...orderFormItems];
    const q = val === '' ? '' : Number(val);
    updated[index].quantity = q;
    const numQ = Number(q) > 0 ? Number(q) : 1;
    if (updated[index].totalPrice !== '') {
      updated[index].unitPrice = Math.round((Number(updated[index].totalPrice) / numQ) * 100) / 100;
    } else if (updated[index].unitPrice !== '') {
      updated[index].totalPrice = Math.round(Number(updated[index].unitPrice) * numQ);
    }
    setOrderFormItems(updated);
  };

  const handleItemUnitChange = (index: number, val: string) => {
    const updated = [...orderFormItems];
    const u = val === '' ? '' : Number(val);
    updated[index].unitPrice = u;
    const q = Number(updated[index].quantity) > 0 ? Number(updated[index].quantity) : 1;
    if (u !== '') {
      updated[index].totalPrice = Math.round(Number(u) * q);
      if (updated[index].quantity === '') updated[index].quantity = 1;
    }
    setOrderFormItems(updated);
  };

  const handleItemTotalChange = (index: number, val: string) => {
    const updated = [...orderFormItems];
    const t = val === '' ? '' : Number(val);
    updated[index].totalPrice = t;
    const q = Number(updated[index].quantity) > 0 ? Number(updated[index].quantity) : 1;
    if (t !== '') {
      updated[index].unitPrice = Math.round((Number(t) / q) * 100) / 100;
      if (updated[index].quantity === '') updated[index].quantity = 1;
    }
    setOrderFormItems(updated);
  };

  // Guardar nuevo proveedor en la lista
  const handleSaveNewSupplier = () => {
    const trimmed = newSupplierName.trim();
    if (!trimmed) {
      toast.error('Ingresá el nombre del nuevo proveedor');
      return;
    }
    if (!suppliers.includes(trimmed)) {
      const updated = [...suppliers, trimmed];
      setSuppliers(updated);
      try {
        localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignorar
      }
    }
    setOrderFormSupplier(trimmed);
    setNewSupplierName('');
    setIsAddingNewSupplier(false);
    toast.success(`Proveedor "${trimmed}" agregado`);
  };

  // Guardar o Actualizar Pedido
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();

    let finalSupplier = orderFormSupplier;
    if (isAddingNewSupplier) {
      if (!newSupplierName.trim()) {
        toast.error('Ingresá el nombre del nuevo proveedor');
        return;
      }
      finalSupplier = newSupplierName.trim();
      if (!suppliers.includes(finalSupplier)) {
        const updated = [...suppliers, finalSupplier];
        setSuppliers(updated);
        try {
          localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignorar
        }
      }
    }

    if (!finalSupplier) {
      toast.error('Seleccioná o ingresá un proveedor');
      return;
    }

    const validItems = orderFormItems
      .filter((it) => it.name.trim() && (Number(it.unitPrice) > 0 || Number(it.totalPrice) > 0))
      .map((it) => {
        const qty = Number(it.quantity) > 0 ? Number(it.quantity) : 1;
        const unitPrice =
          Number(it.unitPrice) > 0
            ? Number(it.unitPrice)
            : Number(it.totalPrice) > 0
              ? Number(it.totalPrice) / qty
              : 0;

        return {
          id: it.id,
          productId: it.productId,
          name: it.name.trim(),
          color: it.color?.trim() || undefined,
          quantity: qty,
          unitPrice,
        };
      });

    if (validItems.length === 0) {
      toast.error('Agregá al menos un producto con nombre y precio (total o unitario)');
      return;
    }

    const orderTitle = orderFormRef.trim()
      ? `${finalSupplier} - ${orderFormRef.trim()}`
      : `${finalSupplier}`;

    // Si estamos editando un pedido existente
    if (editingOrderId) {
      setOrders(
        orders.map((o) =>
          o.id === editingOrderId
            ? {
                ...o,
                date: orderFormDate || new Date().toISOString().split('T')[0],
                title: orderTitle,
                supplier: finalSupplier,
                items: validItems,
                shippingCost: Number(orderFormShipping) || 0,
                notes: orderFormNotes.trim() || undefined,
              }
            : o
        )
      );
      setEditingOrderId(null);
      setShowOrderModal(false);
      setOrderFormRef('');
      setIsAddingNewSupplier(false);
      setNewSupplierName('');
      setOrderFormShipping('');
      setOrderFormNotes('');
      setOrderFormItems([
        { id: '1', name: '', color: '', quantity: 1, unitPrice: '', totalPrice: '' },
      ]);
      toast.success('¡Pedido modificado con éxito!');
      return;
    }

    // Si es un pedido nuevo
    const newOrder: SupplierOrder = {
      id: 'ord-' + Date.now(),
      date: orderFormDate || new Date().toISOString().split('T')[0],
      title: orderTitle,
      supplier: finalSupplier,
      items: validItems,
      shippingCost: Number(orderFormShipping) || 0,
      notes: orderFormNotes.trim() || undefined,
    };

    setOrders([newOrder, ...orders]);
    setShowOrderModal(false);
    setOrderFormRef('');
    setIsAddingNewSupplier(false);
    setNewSupplierName('');
    setOrderFormShipping('');
    setOrderFormNotes('');
    setOrderFormItems([
      { id: '1', name: '', color: '', quantity: 1, unitPrice: '', totalPrice: '' },
    ]);
    toast.success('¡Pedido guardado con éxito!');
  };

  // ==========================================
  // MANEJADORES DE PACKAGING
  // ==========================================
  const handleCardQtyChange = (val: string) => {
    const q = val === '' ? '' : Number(val);
    setCardFormQty(q);
    const numQ = Number(q) > 0 ? Number(q) : 1;
    if (cardFormTotalPrice !== '') {
      setCardFormUnitPrice(Math.round((Number(cardFormTotalPrice) / numQ) * 100) / 100);
    } else if (cardFormUnitPrice !== '') {
      setCardFormTotalPrice(Math.round(Number(cardFormUnitPrice) * numQ));
    }
  };

  const handleCardUnitChange = (val: string) => {
    const u = val === '' ? '' : Number(val);
    setCardFormUnitPrice(u);
    const q = Number(cardFormQty) > 0 ? Number(cardFormQty) : 1;
    if (u !== '') {
      setCardFormTotalPrice(Math.round(Number(u) * q));
      if (cardFormQty === '') setCardFormQty(1);
    }
  };

  const handleCardTotalChange = (val: string) => {
    const t = val === '' ? '' : Number(val);
    setCardFormTotalPrice(t);
    const q = Number(cardFormQty) > 0 ? Number(cardFormQty) : 1;
    if (t !== '') {
      setCardFormUnitPrice(Math.round((Number(t) / q) * 100) / 100);
      if (cardFormQty === '') setCardFormQty(1);
    }
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardFormTitle.trim()) {
      toast.error('Ingresá una descripción para el packaging');
      return;
    }

    const qty = Number(cardFormQty) > 0 ? Number(cardFormQty) : 1;
    const unitPrice =
      Number(cardFormUnitPrice) > 0
        ? Number(cardFormUnitPrice)
        : Number(cardFormTotalPrice) > 0
          ? Number(cardFormTotalPrice) / qty
          : 0;

    if (!unitPrice || unitPrice <= 0) {
      toast.error('Ingresá el precio total o unitario del packaging');
      return;
    }

    // Si estamos editando packaging existente
    if (editingCardId) {
      setCards(
        cards.map((c) =>
          c.id === editingCardId
            ? {
                ...c,
                date: cardFormDate || new Date().toISOString().split('T')[0],
                title: cardFormTitle.trim(),
                quantity: qty,
                unitPrice,
                notes: cardFormNotes.trim() || undefined,
              }
            : c
        )
      );
      setEditingCardId(null);
      setShowCardModal(false);
      setCardFormTitle('');
      setCardFormQty('');
      setCardFormUnitPrice('');
      setCardFormTotalPrice('');
      setCardFormNotes('');
      toast.success('¡Gasto en packaging modificado!');
      return;
    }

    // Nuevo registro de packaging
    const newCard: CardExpense = {
      id: 'card-' + Date.now(),
      date: cardFormDate || new Date().toISOString().split('T')[0],
      title: cardFormTitle.trim(),
      quantity: qty,
      unitPrice,
      notes: cardFormNotes.trim() || undefined,
    };

    setCards([newCard, ...cards]);
    setShowCardModal(false);
    setCardFormTitle('');
    setCardFormQty('');
    setCardFormUnitPrice('');
    setCardFormTotalPrice('');
    setCardFormNotes('');
    toast.success('¡Gasto en packaging guardado!');
  };

  // ==========================================
  // MANEJADOR DE OTROS GASTOS
  // ==========================================
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

    // Si estamos editando un gasto existente
    if (editingOtherId) {
      setOtherExpenses(
        otherExpenses.map((oth) =>
          oth.id === editingOtherId
            ? {
                ...oth,
                date: otherFormDate || new Date().toISOString().split('T')[0],
                concept: otherFormConcept.trim(),
                quantity: qty,
                unitPrice,
                notes: otherFormNotes.trim() || undefined,
              }
            : oth
        )
      );
      setEditingOtherId(null);
      setShowOtherModal(false);
      setOtherFormConcept('');
      setOtherFormQty(1);
      setOtherFormUnitPrice('');
      setOtherFormNotes('');
      toast.success('¡Gasto modificado!');
      return;
    }

    // Nuevo gasto libre
    const newOther: OtherExpense = {
      id: 'oth-' + Date.now(),
      date: otherFormDate || new Date().toISOString().split('T')[0],
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

  // Exportar a CSV
  const handleExportCSV = () => {
    const rows = [
      [
        'Tipo',
        'Proveedor / Concepto',
        'Detalle',
        'Color',
        'Fecha',
        'Cantidad',
        'Precio Unitario',
        'Total',
      ],
    ];

    orders.forEach((ord) => {
      ord.items.forEach((it) => {
        rows.push([
          'Pedido',
          ord.supplier || 'Proveedor',
          `${ord.title} - ${it.name}`,
          it.color || '-',
          ord.date,
          it.quantity.toString(),
          it.unitPrice.toString(),
          (it.quantity * it.unitPrice).toString(),
        ]);
      });
      if (ord.shippingCost > 0) {
        rows.push([
          'Envío de Pedido',
          ord.supplier || 'Flete',
          `Flete de ${ord.title}`,
          '-',
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
        'Packaging & Envíos',
        c.title,
        '-',
        c.date,
        c.quantity.toString(),
        c.unitPrice.toString(),
        (c.quantity * c.unitPrice).toString(),
      ]);
    });

    otherExpenses.forEach((o) => {
      rows.push([
        'Otro Gasto',
        'General',
        o.concept,
        '-',
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
      {/* Lista de colores preestablecidos para datalist nativo */}
      <datalist id="puros-colors-list">
        {PUROS_COLORS.map((col) => (
          <option key={col} value={col} />
        ))}
      </datalist>

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

          {/* Sub-vista: PEDIDOS (Diseño Minimalista con Info General) */}
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
                  onClick={handleOpenNewOrderModal}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-[#254642] bg-[#254642] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#1a3330]"
                >
                  <Plus className="h-4 w-4" />+ NUEVO PEDIDO
                </button>
              </div>

              {/* Lista de Pedidos Minimalista */}
              {orders.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  No tenés pedidos cargados todavía. Tocá en &ldquo;+ NUEVO PEDIDO&rdquo; para
                  cargar el primero.
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => {
                    const orderItemsTotal = ord.items.reduce(
                      (sum, it) => sum + it.quantity * it.unitPrice,
                      0
                    );
                    const orderTotalQty = ord.items.reduce((sum, it) => sum + it.quantity, 0);
                    const totalOrderWithShipping = orderItemsTotal + ord.shippingCost;

                    return (
                      <div
                        key={ord.id}
                        className="group flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-2xs transition hover:border-[#254642]/40 sm:flex-row sm:items-center sm:justify-between"
                      >
                        {/* Lado Izquierdo: Nombre del proveedor, fecha e info general */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#254642] px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                              <Building2 className="h-3.5 w-3.5 text-[#D4AF37]" />
                              {ord.supplier || ord.title}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-stone-50 px-2 py-0.5 text-xs font-semibold text-gray-600">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {ord.date}
                            </span>
                          </div>

                          {/* Info general del pedido */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span className="font-medium text-gray-700">
                              {ord.items.length} producto{ord.items.length > 1 ? 's' : ''} (
                              {orderTotalQty} u.)
                            </span>
                            {ord.shippingCost > 0 && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-blue-700">
                                  Envío: ${ord.shippingCost.toLocaleString('es-AR')}
                                </span>
                              </>
                            )}
                            {ord.notes && (
                              <>
                                <span>•</span>
                                <span
                                  className="max-w-[200px] truncate text-gray-400 italic"
                                  title={ord.notes}
                                >
                                  &ldquo;{ord.notes}&rdquo;
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Lado Derecho: Total general + Acciones (Ojo, Lápiz, Tacho) */}
                        <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-2 sm:border-0 sm:pt-0">
                          <div className="text-right">
                            <span className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                              Total Pedido
                            </span>
                            <span className="font-mono text-base font-extrabold text-[#254642]">
                              ${totalOrderWithShipping.toLocaleString('es-AR')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* 1. OJO: Ver pedido entero */}
                            <button
                              type="button"
                              onClick={() => setViewingOrder(ord)}
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                              title="Ver pedido entero"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* 2. LÁPIZ: Modificar pedido */}
                            <button
                              type="button"
                              onClick={() => handleEditOrder(ord)}
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-stone-100 hover:text-[#254642]"
                              title="Modificar pedido"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            {/* 3. TACHO: Eliminar pedido */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('¿Eliminar este pedido?')) {
                                  setOrders(orders.filter((o) => o.id !== ord.id));
                                  toast.success('Pedido eliminado');
                                }
                              }}
                              className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                              title="Eliminar pedido"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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
                  onClick={handleOpenNewCardModal}
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
                            <div className="flex items-center justify-center gap-1">
                              {/* Modificar gasto */}
                              <button
                                type="button"
                                onClick={() => handleEditCard(c)}
                                className="rounded-md p-1.5 text-gray-400 transition hover:bg-amber-50 hover:text-amber-700"
                                title="Modificar gasto"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              {/* Eliminar gasto */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('¿Eliminar este registro?')) {
                                    setCards(cards.filter((card) => card.id !== c.id));
                                    toast.success('Eliminado');
                                  }
                                }}
                                className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                title="Eliminar gasto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
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
                  onClick={handleOpenNewOtherModal}
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
                            <div className="flex items-center justify-center gap-1">
                              {/* Modificar otro gasto */}
                              <button
                                type="button"
                                onClick={() => handleEditOther(o)}
                                className="rounded-md p-1.5 text-gray-400 transition hover:bg-purple-50 hover:text-purple-700"
                                title="Modificar gasto"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              {/* Eliminar otro gasto */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('¿Eliminar este gasto?')) {
                                    setOtherExpenses(
                                      otherExpenses.filter((oth) => oth.id !== o.id)
                                    );
                                    toast.success('Eliminado');
                                  }
                                }}
                                className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                title="Eliminar gasto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
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
                Compará el costo proveedor + extras con el precio actual en la web y los precios
                sugeridos.
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
                    <th className="px-4 py-3 text-right font-bold">Precio Proveedor</th>
                    <th className="px-4 py-3 text-right font-bold text-blue-700">Gastos Extras</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-900">
                      Costo Real Base
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-indigo-900">
                      Precio Actual en Web
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-[#254642]">
                      Precios Sugeridos ({marginPercent}%)
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

                      // Sugerido Web: 100% sobre costo neto (Costo x 2)
                      const recommendedPrice =
                        Math.ceil((realCost * (1 + marginPercent / 100)) / 100) * 100;

                      // Máximo Ubicado: precio premium de mercado
                      const maxPrice = Math.ceil((realCost * 2.3) / 100) * 100;

                      const profit = recommendedPrice - realCost;

                      // Buscar producto en la tienda web (activo o inactivo)
                      const webProduct = products.find(
                        (p) =>
                          (it.productId && p.id === it.productId) ||
                          p.name.trim().toLowerCase() === it.name.trim().toLowerCase()
                      );

                      return (
                        <tr key={`${ord.id}-${it.id}`} className="hover:bg-stone-50/50">
                          {/* Nombre y Color */}
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="font-bold text-gray-900">{it.name}</p>
                              {it.color && (
                                <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                                  {it.color}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                              {ord.supplier && (
                                <span className="font-medium text-gray-600">{ord.supplier}</span>
                              )}
                              <span>•</span>
                              <span>{ord.date}</span>
                            </div>
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

                          {/* Precio Actual en la Web */}
                          <td className="px-4 py-3 text-center">
                            {webProduct ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="font-mono text-sm font-black text-indigo-950">
                                  ${webProduct.price.toLocaleString('es-AR')}
                                </span>
                                <span
                                  className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    webProduct.active
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      webProduct.active ? 'bg-emerald-500' : 'bg-gray-400'
                                    }`}
                                  />
                                  {webProduct.active ? 'Activo en web' : 'Pausado'}
                                </span>
                                {webProduct.price < realCost && (
                                  <span className="mt-0.5 text-[9px] font-bold text-red-600">
                                    ⚠️ Menor al costo
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-gray-400">
                                <span className="font-mono text-xs">—</span>
                                <span className="block text-[10px]">No en web</span>
                              </div>
                            )}
                          </td>

                          {/* Precios Sugeridos: Sugerido Web y Máximo (Sin Mínimo) */}
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                              {/* Sugerido Web (100%) */}
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
      {/* MODAL 1: NUEVO O MODIFICAR PEDIDO                                     */}
      {/* ===================================================================== */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#254642]" />
                <h3 className="text-lg font-bold text-[#254642]">
                  {editingOrderId ? 'Modificar Pedido' : 'Cargar Nuevo Pedido'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowOrderModal(false);
                  setEditingOrderId(null);
                  setActiveSearchIndex(null);
                }}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="mt-4 space-y-4">
              {/* Sección Proveedor y Fecha */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Desplegable de Proveedor */}
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-800">Proveedor *</label>
                  {!isAddingNewSupplier ? (
                    <select
                      value={orderFormSupplier}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setIsAddingNewSupplier(true);
                        } else {
                          setOrderFormSupplier(e.target.value);
                        }
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm font-medium text-gray-800 focus:border-[#D4AF37] focus:outline-none"
                    >
                      {suppliers.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                      <option value="__new__">➕ Agregar nuevo proveedor...</option>
                    </select>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={newSupplierName}
                          onChange={(e) => setNewSupplierName(e.target.value)}
                          placeholder="Nombre del nuevo proveedor"
                          className="w-full rounded-lg border border-[#254642] p-2 text-sm focus:border-[#D4AF37] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSaveNewSupplier}
                          className="rounded-lg bg-[#254642] px-3 py-2 text-xs font-bold text-white hover:bg-[#1a3330]"
                          title="Confirmar proveedor"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewSupplier(false);
                          setNewSupplierName('');
                        }}
                        className="text-[11px] text-gray-500 underline hover:text-gray-700"
                      >
                        Cancelar y elegir de la lista
                      </button>
                    </div>
                  )}
                </div>

                {/* Fecha del Pedido */}
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-800">
                    Fecha del Pedido *
                  </label>
                  <input
                    type="date"
                    required
                    value={orderFormDate}
                    onChange={(e) => setOrderFormDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm text-gray-800 focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              {/* Referencia opcional */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Referencia o Detalle del Pedido (Opcional)
                </label>
                <input
                  type="text"
                  value={orderFormRef}
                  onChange={(e) => setOrderFormRef(e.target.value)}
                  placeholder="Ej: Lote Mates Imperiales Mayo"
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              {/* Lista de Productos del Pedido con Buscador Interactivo y Color */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-gray-800">
                      Productos incluidos en este pedido *
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Escribí para buscar (ej: &ldquo;camionero&rdquo;) y elegí de la lista. Color y
                      total opcionales.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOrderItemRow}
                    className="inline-flex items-center gap-1 rounded bg-[#254642] px-2.5 py-1 text-xs font-bold text-white transition hover:bg-[#1b3330]"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar otro producto
                  </button>
                </div>

                <div className="space-y-3">
                  {orderFormItems.map((item, index) => {
                    return (
                      <div
                        key={item.id}
                        className="relative space-y-2 rounded-xl border border-gray-200 bg-gray-50/80 p-3"
                      >
                        <div className="flex flex-wrap items-start gap-2">
                          {/* Buscador de Producto al escribir */}
                          <div className="relative min-w-[190px] flex-1">
                            <span className="text-[10px] font-bold text-gray-700">
                              Producto * (escribí para buscar)
                            </span>
                            <input
                              type="text"
                              required
                              value={item.name}
                              onFocus={() => setActiveSearchIndex(index)}
                              onBlur={() => setTimeout(() => setActiveSearchIndex(null), 250)}
                              onChange={(e) => {
                                const updated = [...orderFormItems];
                                updated[index].name = e.target.value;
                                setOrderFormItems(updated);
                                setActiveSearchIndex(index);
                              }}
                              placeholder="Ej: Camionero, Imperial, Bombilla..."
                              className="w-full rounded border border-gray-300 bg-white p-1.5 text-xs font-medium text-gray-800 focus:border-[#D4AF37] focus:outline-none"
                            />

                            {/* Dropdown flotante con coincidencias de la tienda */}
                            {activeSearchIndex === index &&
                              item.name.trim().length > 0 &&
                              (() => {
                                const query = item.name.trim().toLowerCase();
                                const matches = products.filter((p) =>
                                  p.name.toLowerCase().includes(query)
                                );

                                if (matches.length === 0) return null;

                                return (
                                  <div className="absolute top-full right-0 left-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-300 bg-white p-1 shadow-2xl">
                                    <div className="border-b border-gray-100 bg-stone-50 px-2 py-1 text-[10px] font-bold text-gray-500 uppercase">
                                      Productos en la web ({matches.length})
                                    </div>
                                    {matches.map((p) => (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          const updated = [...orderFormItems];
                                          updated[index].name = p.name;
                                          updated[index].productId = p.id;
                                          setOrderFormItems(updated);
                                          setActiveSearchIndex(null);
                                        }}
                                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition hover:bg-stone-100"
                                      >
                                        <div className="flex items-center gap-1.5 truncate">
                                          <span className="truncate font-semibold text-gray-900">
                                            {p.name}
                                          </span>
                                          <span
                                            className={`py-0.2 inline-flex items-center rounded px-1.5 text-[9px] font-bold ${
                                              p.active
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}
                                          >
                                            {p.active ? 'Activo' : 'Pausado'}
                                          </span>
                                        </div>
                                        <span className="shrink-0 font-mono text-xs font-bold text-indigo-950">
                                          ${p.price.toLocaleString('es-AR')}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                );
                              })()}
                          </div>

                          {/* Campo Color (Opcional con datalist de Puros) */}
                          <div className="w-28 sm:w-32">
                            <span className="text-[10px] font-medium text-gray-600">
                              Color (opcional)
                            </span>
                            <input
                              type="text"
                              list="puros-colors-list"
                              value={item.color || ''}
                              onChange={(e) => {
                                const updated = [...orderFormItems];
                                updated[index].color = e.target.value;
                                setOrderFormItems(updated);
                              }}
                              placeholder="Elegir o escribir"
                              className="w-full rounded border border-gray-300 bg-white p-1.5 text-xs text-gray-800 focus:border-[#D4AF37] focus:outline-none"
                            />
                          </div>

                          {/* Cantidad */}
                          <div className="w-18 sm:w-20">
                            <span className="text-[10px] text-gray-500">Cantidad</span>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleItemQtyChange(index, e.target.value)}
                              placeholder="Cant."
                              className="w-full rounded border border-gray-300 bg-white p-1.5 text-center text-xs font-bold text-gray-800 focus:border-[#D4AF37] focus:outline-none"
                            />
                          </div>

                          {/* Precio Unitario */}
                          <div className="w-24 sm:w-28">
                            <span className="text-[10px] text-gray-500">Precio Unit. ($)</span>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) => handleItemUnitChange(index, e.target.value)}
                              placeholder="Unitario $"
                              className="w-full rounded border border-gray-300 bg-white p-1.5 text-right font-mono text-xs font-semibold text-gray-800 focus:border-[#D4AF37] focus:outline-none"
                            />
                          </div>

                          {/* Precio Total (DIRECTO) */}
                          <div className="w-24 sm:w-28">
                            <span className="text-[10px] font-bold text-[#254642]">
                              Precio Total ($)
                            </span>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={item.totalPrice}
                              onChange={(e) => handleItemTotalChange(index, e.target.value)}
                              placeholder="Total fila $"
                              className="w-full rounded border-2 border-emerald-600/40 bg-white p-1.5 text-right font-mono text-xs font-bold text-[#254642] focus:border-[#254642] focus:outline-none"
                            />
                          </div>

                          {orderFormItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOrderItemRow(index)}
                              className="mt-5 text-gray-400 hover:text-red-600"
                              title="Quitar fila"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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

              {/* Notas opcionales */}
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
                  onClick={() => {
                    setShowOrderModal(false);
                    setEditingOrderId(null);
                    setActiveSearchIndex(null);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#254642] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1a3330]"
                >
                  {editingOrderId ? 'Guardar Cambios' : 'Guardar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL EMERGENTE: VER PEDIDO COMPLETO (EL OJO 👁️)                     */}
      {/* ===================================================================== */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[#254642] p-1.5 text-white">
                  <Package className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {viewingOrder.supplier || viewingOrder.title}
                  </h3>
                  <span className="text-xs text-gray-500">
                    Fecha del pedido: {viewingOrder.date}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Resumen rápido del pedido */}
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-stone-50 p-3 text-center">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase">
                  Productos
                </span>
                <span className="font-mono text-sm font-bold text-gray-800">
                  {viewingOrder.items.reduce((s, it) => s + it.quantity, 0)} u.
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-blue-500 uppercase">
                  Flete / Envío
                </span>
                <span className="font-mono text-sm font-bold text-blue-900">
                  ${viewingOrder.shippingCost.toLocaleString('es-AR')}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[#254642] uppercase">
                  Total Pedido
                </span>
                <span className="font-mono text-sm font-black text-[#254642]">
                  $
                  {(
                    viewingOrder.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0) +
                    viewingOrder.shippingCost
                  ).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Detalle de productos */}
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-500">
                    <th className="px-3 py-2 font-medium">Producto</th>
                    <th className="px-3 py-2 text-center font-medium">Cantidad</th>
                    <th className="px-3 py-2 text-right font-medium">Precio Proveedor</th>
                    <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                    <th className="px-3 py-2 text-right font-medium text-blue-600">
                      Envío x Unidad
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {viewingOrder.items.map((it) => {
                    const totalQty = viewingOrder.items.reduce((s, x) => s + x.quantity, 0);
                    const shippingPerUnit = totalQty > 0 ? viewingOrder.shippingCost / totalQty : 0;
                    return (
                      <tr key={it.id}>
                        <td className="px-3 py-2.5 font-medium text-gray-800">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span>{it.name}</span>
                            {it.color && (
                              <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                                🎨 {it.color}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-gray-700">
                          {it.quantity} u.
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-gray-700">
                          ${it.unitPrice.toLocaleString('es-AR')}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-900">
                          ${(it.quantity * it.unitPrice).toLocaleString('es-AR')}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-blue-600">
                          +${shippingPerUnit.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {viewingOrder.notes && (
              <div className="mt-3 rounded-lg bg-gray-50 p-2.5 text-xs text-gray-600">
                <span className="font-bold text-gray-700">Notas: </span>
                {viewingOrder.notes}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => {
                  const ordToEdit = viewingOrder;
                  setViewingOrder(null);
                  handleEditOrder(ordToEdit);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="h-3.5 w-3.5" /> Modificar este pedido
              </button>
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="rounded-lg bg-[#254642] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#1a3330]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: NUEVO O MODIFICAR PACKAGING                                  */}
      {/* ===================================================================== */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  {editingCardId ? 'Modificar Packaging / Tarjetas' : 'Cargar Packaging / Tarjetas'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCardModal(false);
                  setEditingCardId(null);
                }}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Descripción *
                </label>
                <input
                  type="text"
                  required
                  value={cardFormTitle}
                  onChange={(e) => setCardFormTitle(e.target.value)}
                  placeholder="Ej: Tarjetas de agradecimiento, Bolsas de tela"
                  className="w-full rounded-lg border border-gray-300 p-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Fecha del Gasto *
                </label>
                <input
                  type="date"
                  required
                  value={cardFormDate}
                  onChange={(e) => setCardFormDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Cantidad</label>
                  <input
                    type="number"
                    min={1}
                    value={cardFormQty}
                    onChange={(e) => handleCardQtyChange(e.target.value)}
                    placeholder="1"
                    className="w-full rounded-lg border border-gray-300 p-2 text-center text-sm font-bold focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Precio Unit. ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={cardFormUnitPrice}
                    onChange={(e) => handleCardUnitChange(e.target.value)}
                    placeholder="Unit. $"
                    className="w-full rounded-lg border border-gray-300 p-2 text-right text-sm font-bold focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-amber-900">
                    Precio Total ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={cardFormTotalPrice}
                    onChange={(e) => handleCardTotalChange(e.target.value)}
                    placeholder="Total $"
                    className="w-full rounded-lg border-2 border-amber-600 bg-amber-50/30 p-2 text-right text-sm font-black text-amber-950 focus:border-amber-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 text-right">
                <span className="text-[11px] text-amber-800">
                  Podés ingresar el <strong>Total</strong> directamente o la{' '}
                  <strong>Cantidad y Unitario</strong>.
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
                  onClick={() => {
                    setShowCardModal(false);
                    setEditingCardId(null);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-800"
                >
                  {editingCardId ? 'Guardar Cambios' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: NUEVO O MODIFICAR OTRO GASTO                                 */}
      {/* ===================================================================== */}
      {showOtherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-700" />
                <h3 className="text-lg font-bold text-gray-800">
                  {editingOtherId ? 'Modificar Gasto' : 'Cargar Otro Gasto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowOtherModal(false);
                  setEditingOtherId(null);
                }}
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

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Fecha del Gasto *
                </label>
                <input
                  type="date"
                  required
                  value={otherFormDate}
                  onChange={(e) => setOtherFormDate(e.target.value)}
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
                  onClick={() => {
                    setShowOtherModal(false);
                    setEditingOtherId(null);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-800 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-900"
                >
                  {editingOtherId ? 'Guardar Cambios' : 'Guardar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
