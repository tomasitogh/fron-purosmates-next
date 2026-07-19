'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllOrders, updateOrder, deleteOrder, clearAdminMessages, Order } from '@/redux/adminSlice';

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
    'PENDING': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    'CONFIRMED': { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
    'SHIPPED': { label: 'Enviado', color: 'bg-indigo-100 text-indigo-800' },
    'DELIVERED': { label: 'Entregado', color: 'bg-green-100 text-green-800' },
    'CANCELLED': { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    'PENDING': { label: 'Sin pagar', color: 'bg-gray-100 text-gray-800' },
    'PAID_MP': { label: 'Pagado (MP)', color: 'bg-green-100 text-green-800' },
    'REJECTED_MP': { label: 'Rechazado (MP)', color: 'bg-red-100 text-red-800' },
    'PAID_CASH': { label: 'Pagado (Efectivo)', color: 'bg-blue-100 text-blue-800' }
};

const ORDER_STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

interface AdminOrdersProps {
  getToken: TokenGetter;
}

export default function AdminOrders({ getToken }: AdminOrdersProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { orders, loading, successMessage, error: adminError } = useSelector((state: RootState) => state.admin);
    const [filterStatus, setFilterStatus] = useState('ALL');

    const [editingOrder, setEditingOrder] = useState<ExtendedOrder | null>(null);
    const [editFormData, setEditFormData] = useState({
        status: '',
        paymentStatus: '',
        total: ''
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

    const filteredOrders = (orders as ExtendedOrder[] | undefined)?.filter(order => {
        if (filterStatus === 'ALL') return true;
        return order.status === filterStatus;
    }) || [];

    const handleEditClick = (order: ExtendedOrder) => {
        setEditingOrder(order);
        setEditFormData({
            status: order.status || '',
            paymentStatus: order.paymentStatus || 'PENDING',
            total: order.total?.toString() || ''
        });
    };

    const closeEditModal = () => {
        setEditingOrder(null);
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrder) return;

        try {
            await dispatch(updateOrder({
                orderId: editingOrder.id,
                status: editFormData.status,
                paymentStatus: editFormData.paymentStatus,
                total: parseFloat(editFormData.total),
                getToken
            })).unwrap();
            closeEditModal();
        } catch (error: unknown) {
            console.error('Update failed:', error);
        }
    };

    const handleDelete = async (orderId: number) => {
        if (!window.confirm('¿Está seguro de eliminar este pedido? Esta acción no se puede deshacer.')) return;
        dispatch(deleteOrder({ orderId, getToken }));
    };

    if (loading && !editingOrder && !viewingOrderItems) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#254642] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Cargando pedidos...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Dropdown de filtros */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Filtrar por estado:</label>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#254642] focus:border-[#254642] w-full md:w-auto"
                >
                    {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                            {status === 'ALL' ? 'Todos' : STATUS_LABELS[status]?.label || status}
                        </option>
                    ))}
                </select>
            </div>

            {/* Vista Desktop */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Pedido</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            #{order.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.user ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">
                                                        {order.user.name}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {order.user.email}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="font-medium text-gray-500 italic">Invitado</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                                                        className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                                        title="Copiar número (sin prefijo)"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-AR') : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                            ${order.total?.toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_LABELS[order.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                                                {STATUS_LABELS[order.status]?.label || order.status || 'Desconocido'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${PAYMENT_STATUS_LABELS[order.paymentStatus || 'PENDING']?.color || 'bg-gray-100 text-gray-800'}`}>
                                                {PAYMENT_STATUS_LABELS[order.paymentStatus || 'PENDING']?.label || 'Sin pagar'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setViewingOrderItems(order)}
                                                    className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50 transition"
                                                    title="Ver Productos"
                                                >
                                                    <Info className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(order)}
                                                    className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50 transition"
                                                    title="Editar Pedido"
                                                >
                                                    <PenSquare className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(order.id)}
                                                    className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition"
                                                    title="Eliminar Pedido"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No se encontraron pedidos</p>
                                        {filterStatus !== 'ALL' && (
                                            <p className="text-gray-400 text-sm mt-1">Probá con otro filtro</p>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vista Mobile */}
            <div className="md:hidden space-y-3">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-900">Pedido #{order.id}</span>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_LABELS[order.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                                    {STATUS_LABELS[order.status]?.label || order.status || 'Desconocido'}
                                </span>
                            </div>
                            <div className="flex justify-end gap-1 pt-2 border-t border-gray-100">
                                <button onClick={() => setViewingOrderItems(order)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Ver Productos">
                                    <Info className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleEditClick(order)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Editar Pedido">
                                    <PenSquare className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(order.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar Pedido">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                        <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No se encontraron pedidos</p>
                    </div>
                )}
            </div>

            {/* View Items Modal */}
            {viewingOrderItems && (
                <div
                    className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 bg-black/50"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setViewingOrderItems(null);
                    }}
                >
                    <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setViewingOrderItems(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-lg font-bold mb-4 text-gray-900">
                            {viewingOrderItems.user ? `Pedido #${viewingOrderItems.id}` : `Pedido #${viewingOrderItems.id} (Invitado)`}
                        </h3>

                        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">Datos del Cliente y Envío</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Nombre</p>
                                    <p className="font-medium text-gray-900">
                                        {viewingOrderItems.user ? viewingOrderItems.user.name : `${viewingOrderItems.guestFirstname || ''} ${viewingOrderItems.guestLastname || ''}`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Email</p>
                                    <p className="font-medium text-gray-900">{viewingOrderItems.user ? viewingOrderItems.user.email : (viewingOrderItems.guestEmail || '-')}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Teléfono</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">{viewingOrderItems.user?.phoneNumber || viewingOrderItems.guestPhone || '-'}</p>
                                        {(viewingOrderItems.user?.phoneNumber || viewingOrderItems.guestPhone) && (
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(viewingOrderItems.user?.phoneNumber || viewingOrderItems.guestPhone || '');
                                                    toast.success('Copiado');
                                                }}
                                                className="text-gray-400 hover:text-gray-600"
                                                title="Copiar"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="sm:col-span-1">
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Preferencia de envío</p>
                                    <p className="font-medium text-blue-800 bg-blue-100 rounded px-2 w-max mt-1 py-0.5">
                                        {viewingOrderItems.shippingPreference === 'correo' ? 'Correo Argentino' : (viewingOrderItems.shippingPreference === 'vendedor' ? 'Coordinar con vendedor' : 'No especificado')}
                                    </p>
                                </div>
                                {viewingOrderItems.shippingPreference === 'correo' && (
                                    <>
                                        <div>
                                            <p className="text-gray-500 text-xs uppercase tracking-wide">Localidad</p>
                                            <p className="font-medium text-gray-900">{viewingOrderItems.locality || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs uppercase tracking-wide">Dirección</p>
                                            <p className="font-medium text-gray-900">{viewingOrderItems.address || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs uppercase tracking-wide">Piso / Depto</p>
                                            <p className="font-medium text-gray-900">{viewingOrderItems.floorApartment || '-'}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <p className="text-gray-500 text-xs uppercase tracking-wide">Indicaciones extras</p>
                                            <p className="font-medium text-gray-900">{viewingOrderItems.extraIndications || '-'}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <h4 className="font-bold text-gray-900 mb-2">Productos</h4>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {viewingOrderItems.items?.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500 font-medium">
                                            {item.product?.imageUrl ?
                                                <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover rounded" />
                                                : 'N/A'
                                            }
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{item.product?.name}</p>
                                            <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">
                                            ${(item.price * item.quantity).toLocaleString('es-AR')}
                                        </p>
                                        <div className="text-xs text-gray-500 flex flex-col items-end mt-1 space-y-0.5">
                                            {item.hasCustomization ? (
                                                <>
                                                    <span>Base: ${(item.price - (item.product?.customizationCost || 0)).toLocaleString('es-AR')}</span>
                                                    <span className="text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
                                                        Personalizado (+${item.product?.customizationCost?.toLocaleString('es-AR')})
                                                    </span>
                                                </>
                                            ) : (
                                                <span>${item.price.toLocaleString('es-AR')} c/u</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!viewingOrderItems.items || viewingOrderItems.items.length === 0) && (
                                <p className="text-center text-gray-500 py-4">No hay productos en este pedido.</p>
                            )}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Total del Pedido</span>
                            <span className="text-xl font-bold text-[#254642]">
                                ${viewingOrderItems.total?.toLocaleString('es-AR')}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingOrder && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
                        <h3 className="text-lg font-bold mb-4">Editar Pedido #{editingOrder.id}</h3>
                        <form onSubmit={handleUpdateSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estado
                                    </label>
                                    <select
                                        value={editFormData.status}
                                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#254642]"
                                    >
                                        {Object.keys(STATUS_LABELS).map(status => (
                                            <option key={status} value={status}>
                                                {STATUS_LABELS[status].label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estado de Pago
                                    </label>
                                    <select
                                        value={editFormData.paymentStatus}
                                        onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#254642]"
                                    >
                                        {Object.keys(PAYMENT_STATUS_LABELS).map(status => (
                                            <option key={status} value={status}>
                                                {PAYMENT_STATUS_LABELS[status].label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Total ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editFormData.total}
                                        onChange={(e) => setEditFormData({ ...editFormData, total: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#254642]"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-[#254642] rounded-lg hover:bg-[#254642]/90 transition"
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
