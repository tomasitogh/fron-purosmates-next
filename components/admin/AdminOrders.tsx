'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllOrders,
  updateOrder,
  deleteOrder,
  clearAdminMessages,
  Order,
} from '@/redux/adminSlice';

interface ExtendedOrder extends Order {
  shippingPreference?: string;
  locality?: string;
  address?: string;
  floorApartment?: string;
  extraIndications?: string;
}
import { Copy, PenSquare, Trash2, Info, X, ShoppingBag } from 'lucide-react';
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

interface AdminOrdersProps {
  getToken: TokenGetter;
}

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
      {/* Dropdown de filtros */}
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
                      {order.user ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{order.user.name}</span>
                          <span className="text-xs text-gray-400">{order.user.email}</span>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-500 italic">Invitado</span>
                      )}
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
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Pedido #{order.id}</span>
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
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
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
                    {viewingOrderItems.user
                      ? viewingOrderItems.user.name
                      : `${viewingOrderItems.guestFirstname || ''} ${viewingOrderItems.guestLastname || ''}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs tracking-wide text-gray-500 uppercase">Email</p>
                  <p className="font-medium text-gray-900">
                    {viewingOrderItems.user
                      ? viewingOrderItems.user.email
                      : viewingOrderItems.guestEmail || '-'}
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
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-gray-200 text-xs font-medium text-gray-500">
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={item.product?.name}
                            className="h-full w-full rounded object-cover"
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
    </div>
  );
}
