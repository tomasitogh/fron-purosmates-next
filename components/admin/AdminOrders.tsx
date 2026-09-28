'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllOrders,
  updateOrder,
  deleteOrder,
  createManualOrder,
  clearAdminMessages,
  Order,
} from '@/redux/adminSlice';
import { fetchAllProductsAdmin } from '@/redux/productSlice';

interface ExtendedOrder extends Order {
  shippingPreference?: string;
  locality?: string;
  address?: string;
  floorApartment?: string;
  extraIndications?: string;
  receiptUrl?: string;
}
import {
  Copy,
  PenSquare,
  Trash2,
  Info,
  X,
  ShoppingBag,
  PlusCircle,
  Plus,
  Trash,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppDispatch, RootState } from '@/redux/store';
import { TokenGetter } from '@/lib/apiClient';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  SHIPPED: { label: 'Enviado', color: 'bg-indigo-100 text-indigo-800' },
  DELIVERED: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Sin pagar', color: 'bg-gray-100 text-gray-800' },
  PAID_MP: { label: 'Pagado (MP)', color: 'bg-green-100 text-green-800' },
  REJECTED_MP: { label: 'Rechazado (MP)', color: 'bg-red-100 text-red-800' },
  PAID_CASH: { label: 'Pagado (Efectivo)', color: 'bg-blue-100 text-blue-800' },
};

const ORDER_STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

interface ManualItemRow {
  productId: number;
  productName: string;
  variantId: number;
  variantName: string;
  variantSku?: string;
  variantStock: number;
  unitPrice: number;
  quantity: number;
  hasCustomization: boolean;
  customizationCost: number;
  imageUrl?: string;
}

interface AdminOrdersProps {
  getToken: TokenGetter;
}

const getDownloadUrl = (url?: string) => {
  if (!url) return '';
  if (url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/fl_attachment/');
  }
  return url;
};

export default function AdminOrders({ getToken }: AdminOrdersProps) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    orders,
    loading,
    successMessage,
    error: adminError,
  } = useSelector((state: RootState) => state.admin);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [editingOrder, setEditingOrder] = useState<ExtendedOrder | null>(null);
  const [editFormData, setEditFormData] = useState({
    status: '',
    paymentStatus: '',
    total: '',
  });

  const [viewingOrderItems, setViewingOrderItems] = useState<ExtendedOrder | null>(null);

  const { items: products } = useSelector((state: RootState) => state.products);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const [manualForm, setManualForm] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    shippingPreference: 'vendedor',
    locality: '',
    address: '',
    floorApartment: '',
    extraIndications: '',
    status: 'CONFIRMED',
    paymentStatus: 'PENDING',
    paymentMethod: 'cash',
    sendEmail: false,
  });

  const [manualItems, setManualItems] = useState<ManualItemRow[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedVariantId, setSelectedVariantId] = useState<number | ''>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [selectedCustomization, setSelectedCustomization] = useState<boolean>(false);

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const activeVariants = selectedProduct?.variants?.filter((v) => v.active) || [];
  const selectedVariant = activeVariants.find((v) => v.id === Number(selectedVariantId));

  const handleProductChange = (productId: number | '') => {
    setSelectedProductId(productId);
    if (!productId) {
      setSelectedVariantId('');
      return;
    }
    const prod = products.find((p) => p.id === productId);
    const variants = prod?.variants?.filter((v) => v.active) || [];
    if (variants.length > 0) {
      setSelectedVariantId(variants[0].id);
    } else {
      setSelectedVariantId('');
    }
    setSelectedQty(1);
    setSelectedCustomization(false);
  };

  const handleAddManualItem = () => {
    if (!selectedProduct || !selectedVariant) {
      toast.error('Por favor seleccioná un producto y su variante');
      return;
    }
    if (selectedQty <= 0) {
      toast.error('La cantidad debe ser al menos 1');
      return;
    }
    if (selectedVariant.stock < selectedQty) {
      toast.error(
        `Stock insuficiente. Solo quedan ${selectedVariant.stock} unidades de ${selectedVariant.name}`
      );
      return;
    }

    const customizationCost = selectedCustomization ? selectedProduct.customizationCost || 0 : 0;

    const existingIndex = manualItems.findIndex(
      (item) =>
        item.variantId === selectedVariant.id && item.hasCustomization === selectedCustomization
    );

    if (existingIndex !== -1) {
      const newQty = manualItems[existingIndex].quantity + selectedQty;
      if (newQty > selectedVariant.stock) {
        toast.error(`No podés superar el stock disponible (${selectedVariant.stock})`);
        return;
      }
      const updated = [...manualItems];
      updated[existingIndex].quantity = newQty;
      setManualItems(updated);
    } else {
      setManualItems([
        ...manualItems,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          variantId: selectedVariant.id,
          variantName: selectedVariant.name,
          variantSku: selectedVariant.sku,
          variantStock: selectedVariant.stock,
          unitPrice: selectedProduct.price,
          quantity: selectedQty,
          hasCustomization: selectedCustomization,
          customizationCost,
          imageUrl: selectedVariant.imageUrl || selectedProduct.images?.[0]?.url,
        },
      ]);
    }

    setSelectedQty(1);
    setSelectedCustomization(false);
    toast.success('Producto sumado al pedido');
  };

  const handleRemoveManualItem = (index: number) => {
    setManualItems(manualItems.filter((_, i) => i !== index));
  };

  const manualTotal = manualItems.reduce(
    (acc, item) =>
      acc + (item.unitPrice + (item.hasCustomization ? item.customizationCost : 0)) * item.quantity,
    0
  );

  const handleCreateManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.firstname.trim() || !manualForm.lastname.trim()) {
      toast.error('Nombre y apellido del cliente son obligatorios');
      return;
    }
    if (!manualForm.phone.trim()) {
      toast.error('El teléfono del cliente es obligatorio');
      return;
    }
    if (manualItems.length === 0) {
      toast.error('Debés agregar al menos un producto al pedido');
      return;
    }
    if (manualForm.shippingPreference === 'correo') {
      if (!manualForm.locality.trim() || !manualForm.address.trim()) {
        toast.error('Para envío por Correo Argentino, la localidad y dirección son obligatorias');
        return;
      }
    }

    setIsSubmittingManual(true);
    try {
      await dispatch(
        createManualOrder({
          orderData: {
            guestFirstname: manualForm.firstname.trim(),
            guestLastname: manualForm.lastname.trim(),
            guestEmail: manualForm.email.trim() || undefined,
            guestPhone: manualForm.phone.trim(),
            shippingPreference: manualForm.shippingPreference,
            locality: manualForm.locality.trim() || undefined,
            address: manualForm.address.trim() || undefined,
            floorApartment: manualForm.floorApartment.trim() || undefined,
            extraIndications: manualForm.extraIndications.trim() || undefined,
            status: manualForm.status,
            paymentStatus: manualForm.paymentStatus,
            paymentMethod: manualForm.paymentMethod,
            sendEmail: manualForm.sendEmail,
            total: manualTotal,
            items: manualItems.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              hasCustomization: item.hasCustomization,
              unitPrice: item.unitPrice + (item.hasCustomization ? item.customizationCost : 0),
            })),
          },
          getToken,
        })
      ).unwrap();

      toast.success('¡Pedido manual creado exitosamente!');
      setIsCreateModalOpen(false);
      setManualItems([]);
      setManualForm({
        firstname: '',
        lastname: '',
        phone: '',
        email: '',
        shippingPreference: 'vendedor',
        locality: '',
        address: '',
        floorApartment: '',
        extraIndications: '',
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        paymentMethod: 'cash',
        sendEmail: false,
      });
      dispatch(fetchAllOrders(getToken));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear pedido manual';
      toast.error(errorMsg);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  useEffect(() => {
    dispatch(fetchAllOrders(getToken));
  }, [dispatch, getToken]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearAdminMessages());
    }
    if (adminError) {
      toast.error(`Error: ${adminError}`);
      dispatch(clearAdminMessages());
    }
  }, [successMessage, adminError, dispatch]);

  const filteredOrders =
    (orders as ExtendedOrder[] | undefined)?.filter((order) => {
      if (filterStatus === 'ALL') return true;
      return order.status === filterStatus;
    }) || [];

  const handleEditClick = (order: ExtendedOrder) => {
    setEditingOrder(order);
    setEditFormData({
      status: order.status || '',
      paymentStatus: order.paymentStatus || 'PENDING',
      total: order.total?.toString() || '',
    });
  };

  const closeEditModal = () => {
    setEditingOrder(null);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      await dispatch(
        updateOrder({
          orderId: editingOrder.id,
          status: editFormData.status,
          paymentStatus: editFormData.paymentStatus,
          total: parseFloat(editFormData.total),
          getToken,
        })
      ).unwrap();
      closeEditModal();
    } catch (error: unknown) {
      console.error('Update failed:', error);
    }
  };

  const handleDelete = async (orderId: number) => {
    if (!window.confirm('¿Está seguro de eliminar este pedido? Esta acción no se puede deshacer.'))
      return;
    dispatch(deleteOrder({ orderId, getToken }));
  };

  if (loading && !editingOrder && !viewingOrderItems) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#254642] border-t-transparent" />
          <span className="text-sm text-gray-500">Cargando pedidos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra superior: Filtro y Botón Nuevo Pedido */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium whitespace-nowrap text-gray-600">
            Filtrar por estado:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:ring-2 focus:ring-[#254642] focus:outline-none md:w-auto"
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'Todos' : STATUS_LABELS[status]?.label || status}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setIsCreateModalOpen(true);
            if (!products || products.length === 0) {
              dispatch(fetchAllProductsAdmin(getToken));
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#254642] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b3330]"
        >
          <PlusCircle className="h-4 w-4 text-[#D4AF37]" />
          <span>+ Crear Pedido Manual</span>
        </button>
      </div>

      {/* Vista Desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-100 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  ID Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Pago
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      {(() => {
                        const customerName =
                          order.guestFirstname || order.guestLastname
                            ? `${order.guestFirstname || ''} ${order.guestLastname || ''}`.trim()
                            : order.user?.name || 'Invitado';
                        const customerEmail = order.guestEmail || order.user?.email;
                        return (
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{customerName}</span>
                            {customerEmail && (
                              <span className="text-xs text-gray-400">{customerEmail}</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      <div className="flex items-center gap-2">
                        <span>{order.user?.phoneNumber || order.guestPhone || '-'}</span>
                        {(order.user?.phoneNumber || order.guestPhone) && (
                          <button
                            onClick={() => {
                              const phoneNumber = order.user?.phoneNumber || order.guestPhone;
                              if (!phoneNumber) return;
                              const prefixes = ['+54', '+598', '+56', '+55', '+595', '+1', '+34'];
                              let phoneToCopy = phoneNumber;
                              for (const prefix of prefixes) {
                                if (phoneToCopy.startsWith(prefix)) {
                                  phoneToCopy = phoneToCopy.substring(prefix.length);
                                  break;
                                }
                              }
                              navigator.clipboard.writeText(phoneToCopy);
                              toast.success('Número copiado: ' + phoneToCopy);
                            }}
                            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            title="Copiar número (sin prefijo)"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('es-AR')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-green-600">
                      ${order.total?.toLocaleString('es-AR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${STATUS_LABELS[order.status]?.color || 'bg-gray-100 text-gray-800'}`}
                      >
                        {STATUS_LABELS[order.status]?.label || order.status || 'Desconocido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${PAYMENT_STATUS_LABELS[order.paymentStatus || 'PENDING']?.color || 'bg-gray-100 text-gray-800'}`}
                      >
                        {PAYMENT_STATUS_LABELS[order.paymentStatus || 'PENDING']?.label ||
                          'Sin pagar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setViewingOrderItems(order)}
                          className="rounded-full p-2 text-blue-600 transition hover:bg-blue-50 hover:text-blue-900"
                          title="Ver Productos"
                        >
                          <Info className="h-5 w-5" />
                        </button>
                        {order.receiptUrl && (
                          <a
                            href={getDownloadUrl(order.receiptUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="rounded-full p-2 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-900"
                            title="Descargar comprobante de pago"
                          >
                            <Download className="h-5 w-5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleEditClick(order)}
                          className="rounded-full p-2 text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-900"
                          title="Editar Pedido"
                        >
                          <PenSquare className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="rounded-full p-2 text-red-600 transition hover:bg-red-50 hover:text-red-900"
                          title="Eliminar Pedido"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                    <p className="font-medium text-gray-500">No se encontraron pedidos</p>
                    {filterStatus !== 'ALL' && (
                      <p className="mt-1 text-sm text-gray-400">Probá con otro filtro</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista Mobile */}
      <div className="space-y-3 md:hidden">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="space-y-3 rounded-xl border border-gray-100 bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-bold text-gray-900">Pedido #{order.id}</span>
                  <p className="mt-0.5 text-xs font-medium text-gray-600">
                    {order.guestFirstname || order.guestLastname
                      ? `${order.guestFirstname || ''} ${order.guestLastname || ''}`.trim()
                      : order.user?.name || 'Invitado'}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-green-700">
                    ${order.total?.toLocaleString('es-AR')}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_LABELS[order.status]?.color || 'bg-gray-100 text-gray-800'}`}
                >
                  {STATUS_LABELS[order.status]?.label || order.status || 'Desconocido'}
                </span>
              </div>
              <div className="flex justify-end gap-1 border-t border-gray-100 pt-2">
                <button
                  onClick={() => setViewingOrderItems(order)}
                  className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                  title="Ver Productos"
                >
                  <Info className="h-4 w-4" />
                </button>
                {order.receiptUrl && (
                  <a
                    href={getDownloadUrl(order.receiptUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50"
                    title="Descargar comprobante"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => handleEditClick(order)}
                  className="rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50"
                  title="Editar Pedido"
                >
                  <PenSquare className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(order.id)}
                  className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                  title="Eliminar Pedido"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white py-16 text-center">
            <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-500">No se encontraron pedidos</p>
          </div>
        )}
      </div>

      {/* View Items Modal */}
      {viewingOrderItems && (
        <div
          className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingOrderItems(null);
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-xl sm:p-6">
            <button
              onClick={() => setViewingOrderItems(null)}
              className="absolute top-4 right-4 text-gray-400 transition-colors hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="mb-4 text-lg font-bold text-gray-900">
              {viewingOrderItems.user
                ? `Pedido #${viewingOrderItems.id}`
                : `Pedido #${viewingOrderItems.id} (Invitado)`}
            </h3>

            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h4 className="mb-3 border-b pb-2 font-semibold text-gray-800">
                Datos del Cliente y Envío
              </h4>
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs tracking-wide text-gray-500 uppercase">Nombre</p>
                  <p className="font-medium text-gray-900">
                    {viewingOrderItems.guestFirstname || viewingOrderItems.guestLastname
                      ? `${viewingOrderItems.guestFirstname || ''} ${viewingOrderItems.guestLastname || ''}`.trim()
                      : viewingOrderItems.user?.name || 'Invitado'}
                  </p>
                </div>
                <div>
                  <p className="text-xs tracking-wide text-gray-500 uppercase">Email</p>
                  <p className="font-medium text-gray-900">
                    {viewingOrderItems.guestEmail || viewingOrderItems.user?.email || '-'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs tracking-wide text-gray-500 uppercase">Teléfono</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {viewingOrderItems.user?.phoneNumber || viewingOrderItems.guestPhone || '-'}
                    </p>
                    {(viewingOrderItems.user?.phoneNumber || viewingOrderItems.guestPhone) && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            viewingOrderItems.user?.phoneNumber ||
                              viewingOrderItems.guestPhone ||
                              ''
                          );
                          toast.success('Copiado');
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copiar"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-1">
                  <p className="text-xs tracking-wide text-gray-500 uppercase">
                    Preferencia de envío
                  </p>
                  <p className="mt-1 w-max rounded bg-blue-100 px-2 py-0.5 font-medium text-blue-800">
                    {viewingOrderItems.shippingPreference === 'correo'
                      ? 'Correo Argentino'
                      : viewingOrderItems.shippingPreference === 'vendedor'
                        ? 'Coordinar con vendedor'
                        : 'No especificado'}
                  </p>
                </div>
                {viewingOrderItems.shippingPreference === 'correo' && (
                  <>
                    <div>
                      <p className="text-xs tracking-wide text-gray-500 uppercase">Localidad</p>
                      <p className="font-medium text-gray-900">
                        {viewingOrderItems.locality || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs tracking-wide text-gray-500 uppercase">Dirección</p>
                      <p className="font-medium text-gray-900">
                        {viewingOrderItems.address || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs tracking-wide text-gray-500 uppercase">Piso / Depto</p>
                      <p className="font-medium text-gray-900">
                        {viewingOrderItems.floorApartment || '-'}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs tracking-wide text-gray-500 uppercase">
                        Indicaciones extras
                      </p>
                      <p className="font-medium text-gray-900">
                        {viewingOrderItems.extraIndications || '-'}
                      </p>
                    </div>
                    {viewingOrderItems.receiptUrl && (
                      <div className="border-t border-gray-200 pt-3 sm:col-span-2">
                        <p className="mb-2 text-xs tracking-wide text-gray-500 uppercase">
                          Comprobante de pago adjunto
                        </p>
                        <a
                          href={getDownloadUrl(viewingOrderItems.receiptUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="inline-flex items-center gap-2 rounded-lg bg-[#254642] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#1d3530]"
                        >
                          <Download className="h-4 w-4" />
                          Descargar comprobante
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <h4 className="mb-2 font-bold text-gray-900">Productos</h4>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
              {viewingOrderItems.items?.map((item) => {
                // H2: thumbnail usa variantImageUrl si está; sino la del product.
                const thumbUrl = item.variantImageUrl ?? item.product?.imageUrl;
                // H2: chips de atributos — mismo formato que el ticket
                // (C6) y que el carrito (G2): "Marrón / Pampa".
                const attrValues = Object.values(item.variantAttributes ?? {});
                const attrLine = attrValues.length > 0 ? ` — ${attrValues.join(' / ')}` : '';
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-gray-200 text-xs font-medium text-gray-500">
                        {thumbUrl ? (
                          <Image
                            src={thumbUrl}
                            alt={item.product?.name ?? ''}
                            fill
                            className="rounded object-cover"
                          />
                        ) : (
                          'N/A'
                        )}
                      </div>
                      <div>
                        <p
                          className="font-medium text-gray-900"
                          title={item.variantSku} // H2: tooltip con el SKU
                        >
                          {item.product?.name}
                          {attrLine}
                        </p>
                        {attrValues.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {attrValues.map((v, i) => (
                              <span
                                key={i}
                                className="inline-block rounded-full bg-[#254642]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#254642]"
                              >
                                {v}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="mt-0.5 text-sm text-gray-500">Cantidad: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${(item.price * item.quantity).toLocaleString('es-AR')}
                      </p>
                      <div className="mt-1 flex flex-col items-end space-y-0.5 text-xs text-gray-500">
                        {item.hasCustomization ? (
                          <>
                            <span>
                              Base: $
                              {(item.price - (item.product?.customizationCost || 0)).toLocaleString(
                                'es-AR'
                              )}
                            </span>
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-600">
                              Personalizado (+$
                              {item.product?.customizationCost?.toLocaleString('es-AR')})
                            </span>
                          </>
                        ) : (
                          <span>${item.price.toLocaleString('es-AR')} c/u</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!viewingOrderItems.items || viewingOrderItems.items.length === 0) && (
                <p className="py-4 text-center text-gray-500">No hay productos en este pedido.</p>
              )}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="font-medium text-gray-600">Total del Pedido</span>
              <span className="text-xl font-bold text-[#254642]">
                ${viewingOrderItems.total?.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-bold">Editar Pedido #{editingOrder.id}</h3>
            <form onSubmit={handleUpdateSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#254642] focus:outline-none"
                  >
                    {Object.keys(STATUS_LABELS).map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Estado de Pago
                  </label>
                  <select
                    value={editFormData.paymentStatus}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, paymentStatus: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#254642] focus:outline-none"
                  >
                    {Object.keys(PAYMENT_STATUS_LABELS).map((status) => (
                      <option key={status} value={status}>
                        {PAYMENT_STATUS_LABELS[status].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Total ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.total}
                    onChange={(e) => setEditFormData({ ...editFormData, total: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#254642] focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#254642] px-4 py-2 text-white transition hover:bg-[#254642]/90"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: CREAR PEDIDO MANUAL */}
      {isCreateModalOpen && (
        <div
          className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateModalOpen(false);
          }}
        >
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-5 flex items-center gap-2 border-b pb-4">
              <PlusCircle className="h-6 w-6 text-[#254642]" />
              <div>
                <h3 className="text-xl font-bold text-gray-900">Crear Pedido Manual</h3>
                <p className="text-xs text-gray-500">
                  Registrá una venta sin enviar correos automáticos para no agotar la cuota gratis.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateManualSubmit} className="space-y-6">
              {/* Sección 1: Datos del Cliente */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <h4 className="mb-3 text-sm font-bold tracking-wide text-gray-800 uppercase">
                  1. Datos del Cliente
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Sofía"
                      value={manualForm.firstname}
                      onChange={(e) => setManualForm({ ...manualForm, firstname: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:ring-2 focus:ring-[#254642]/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Martínez"
                      value={manualForm.lastname}
                      onChange={(e) => setManualForm({ ...manualForm, lastname: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:ring-2 focus:ring-[#254642]/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Teléfono (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej: 11 3456 7890"
                      value={manualForm.phone}
                      onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:ring-2 focus:ring-[#254642]/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Email (Opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="cliente@email.com"
                      value={manualForm.email}
                      onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:ring-2 focus:ring-[#254642]/20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Método de Entrega */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <h4 className="mb-3 text-sm font-bold tracking-wide text-gray-800 uppercase">
                  2. Entrega y Envío
                </h4>
                <div className="mb-3 flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="shipping"
                      value="vendedor"
                      checked={manualForm.shippingPreference === 'vendedor'}
                      onChange={() =>
                        setManualForm({ ...manualForm, shippingPreference: 'vendedor' })
                      }
                      className="text-[#254642] focus:ring-[#254642]"
                    />
                    <span>Coordinar con vendedor / Retiro</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="shipping"
                      value="correo"
                      checked={manualForm.shippingPreference === 'correo'}
                      onChange={() =>
                        setManualForm({ ...manualForm, shippingPreference: 'correo' })
                      }
                      className="text-[#254642] focus:ring-[#254642]"
                    />
                    <span>Correo Argentino</span>
                  </label>
                </div>

                {manualForm.shippingPreference === 'correo' && (
                  <div className="mt-3 grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">
                        Localidad *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: CABA"
                        value={manualForm.locality}
                        onChange={(e) => setManualForm({ ...manualForm, locality: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">
                        Dirección *
                      </label>
                      <input
                        type="text"
                        placeholder="Calle y número"
                        value={manualForm.address}
                        onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">
                        Piso / Depto
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 3 B"
                        value={manualForm.floorApartment}
                        onChange={(e) =>
                          setManualForm({ ...manualForm, floorApartment: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Aclaraciones o notas del pedido
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Virola labrada flores, mate tamaño mediano..."
                    value={manualForm.extraIndications}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, extraIndications: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:outline-none"
                  />
                </div>
              </div>

              {/* Sección 3: Productos y Variantes */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <h4 className="mb-3 text-sm font-bold tracking-wide text-gray-800 uppercase">
                  3. Productos del Pedido
                </h4>

                {/* Selector de Producto */}
                <div className="grid grid-cols-1 items-end gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Producto
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) =>
                        handleProductChange(e.target.value ? Number(e.target.value) : '')
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:outline-none"
                    >
                      <option value="">-- Seleccionar Producto --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${p.price.toLocaleString('es-AR')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Variante (Color / Modelo)
                    </label>
                    <select
                      value={selectedVariantId}
                      onChange={(e) =>
                        setSelectedVariantId(e.target.value ? Number(e.target.value) : '')
                      }
                      disabled={!selectedProduct || activeVariants.length === 0}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:outline-none disabled:bg-gray-100"
                    >
                      {activeVariants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} (Stock: {v.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={selectedVariant ? selectedVariant.stock : 99}
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(Math.max(1, Number(e.target.value)))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:outline-none"
                    />
                  </div>

                  {selectedProduct?.isCustomizable && (
                    <div className="flex items-center gap-2 pt-1 sm:col-span-8">
                      <input
                        type="checkbox"
                        id="customizationCheck"
                        checked={selectedCustomization}
                        onChange={(e) => setSelectedCustomization(e.target.checked)}
                        className="h-4 w-4 rounded text-[#254642] focus:ring-[#254642]"
                      />
                      <label
                        htmlFor="customizationCheck"
                        className="cursor-pointer text-xs font-medium text-gray-700"
                      >
                        Grabado láser personalizado (+ $
                        {selectedProduct.customizationCost?.toLocaleString('es-AR') || 0})
                      </label>
                    </div>
                  )}

                  <div className="flex justify-end sm:col-span-4">
                    <button
                      type="button"
                      onClick={handleAddManualItem}
                      disabled={!selectedProduct || !selectedVariant}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#254642] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1b3330] disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Agregar Producto</span>
                    </button>
                  </div>
                </div>

                {/* Lista de Items Agregados */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    Productos cargados ({manualItems.length}):
                  </p>
                  {manualItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center text-xs text-gray-500">
                      Todavía no agregaste productos a este pedido.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {manualItems.map((item, idx) => {
                        const itemPrice =
                          item.unitPrice + (item.hasCustomization ? item.customizationCost : 0);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-2xs"
                          >
                            <div className="flex items-center gap-3">
                              {item.imageUrl ? (
                                <div className="relative h-10 w-10 overflow-hidden rounded bg-gray-100">
                                  <Image
                                    src={item.imageUrl}
                                    alt={item.productName}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                                  📦
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {item.productName} — {item.variantName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.quantity} x ${itemPrice.toLocaleString('es-AR')}
                                  {item.hasCustomization && (
                                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                                      Con grabado
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-900">
                                ${(itemPrice * item.quantity).toLocaleString('es-AR')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveManualItem(idx)}
                                className="rounded p-1 text-red-500 hover:bg-red-50"
                                title="Quitar"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sección 4: Estados, Pago y Emails */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <h4 className="mb-3 text-sm font-bold tracking-wide text-gray-800 uppercase">
                  4. Estado y Cobro
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Estado del Pedido
                    </label>
                    <select
                      value={manualForm.status}
                      onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:outline-none"
                    >
                      <option value="CONFIRMED">Confirmado</option>
                      <option value="PENDING">Pendiente</option>
                      <option value="SHIPPED">Enviado</option>
                      <option value="DELIVERED">Entregado</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Estado del Pago
                    </label>
                    <select
                      value={manualForm.paymentStatus}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, paymentStatus: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:outline-none"
                    >
                      <option value="PENDING">Sin pagar</option>
                      <option value="PAID_CASH">Pagado (Efectivo)</option>
                      <option value="PAID_MP">Pagado (Mercado Pago)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Método de Pago
                    </label>
                    <select
                      value={manualForm.paymentMethod}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, paymentMethod: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:outline-none"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="transfer">Transferencia Bancaria</option>
                      <option value="mp">Mercado Pago</option>
                    </select>
                  </div>
                </div>

                {/* Opción de Email (DESMARCADA por defecto) */}
                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                  <input
                    type="checkbox"
                    id="sendEmailCheck"
                    checked={manualForm.sendEmail}
                    onChange={(e) => setManualForm({ ...manualForm, sendEmail: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded text-[#254642] focus:ring-[#254642]"
                  />
                  <div>
                    <label
                      htmlFor="sendEmailCheck"
                      className="cursor-pointer text-xs font-bold text-gray-900"
                    >
                      Enviar correo electrónico de confirmación al cliente
                    </label>
                    <p className="text-[11px] text-gray-600">
                      Dejar desmarcado para <strong>ahorrar tu cupo de emails gratuitos</strong>. Si
                      lo marcás y pusiste un email, le llegará la factura por correo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Total y Botón Confirmar */}
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Total a cobrar:
                  </span>
                  <p className="text-2xl font-extrabold text-[#254642]">
                    ${manualTotal.toLocaleString('es-AR')}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingManual || manualItems.length === 0}
                    className="rounded-lg bg-[#254642] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#1b3330] disabled:opacity-50"
                  >
                    {isSubmittingManual ? 'Guardando...' : 'Guardar Pedido Manual'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
