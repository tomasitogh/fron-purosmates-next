'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllOrders, updateOrder, deleteOrder } from '@/redux/adminSlice';
import { useAuth } from '@/context/AuthContext';
import { Copy, PenSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppDispatch, RootState } from '@/redux/store';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    'PENDING': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    'CONFIRMED': { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
    'SHIPPED': { label: 'Enviado', color: 'bg-indigo-100 text-indigo-800' },
    'DELIVERED': { label: 'Entregado', color: 'bg-green-100 text-green-800' },
    'CANCELLED': { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
};

const ORDER_STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersPanel() {
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useAuth();
    const { orders, loading } = useSelector((state: RootState) => state.admin);
    const [filterStatus, setFilterStatus] = useState('ALL');

    // Edit State
    const [editingOrder, setEditingOrder] = useState<any | null>(null);
    const [editFormData, setEditFormData] = useState({
        status: '',
        total: ''
    });

    useEffect(() => {
        if (token) {
            dispatch(fetchAllOrders(token));
        }
    }, [dispatch, token]);

    const filteredOrders = orders?.filter(order => {
        if (filterStatus === 'ALL') return true;
        return order.status === filterStatus;
    }) || [];

    const handleEditClick = (order: any) => {
        setEditingOrder(order);
        setEditFormData({
            status: order.status || '',
            total: order.total?.toString() || ''
        });
    };

    const closeEditModal = () => {
        setEditingOrder(null);
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !editingOrder) return;

        try {
            await dispatch(updateOrder({
                orderId: editingOrder.id,
                status: editFormData.status,
                total: parseFloat(editFormData.total),
                token
            })).unwrap();
            closeEditModal();
            toast.success('Pedido actualizado exitosamente');
        } catch (error: any) {
            toast.error('Error al actualizar: ' + (error.message || 'Error desconocido'));
        }
    };

    if (loading && !editingOrder) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="text-xl text-gray-500">Cargando pedidos...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filtros de Estado */}
            <div className="flex flex-wrap gap-2">
                {ORDER_STATUSES.map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === status
                            ? 'bg-[#2d5d52] text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        {status === 'ALL' ? 'Todos' : STATUS_LABELS[status]?.label || status}
                    </button>
                ))}
            </div>

            {/* Tabla de Pedidos */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID Pedido
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Teléfono
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Items
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
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
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">
                                                    {order.user?.firstname} {order.user?.lastname}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {order.user?.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <span>{order.user?.phoneNumber || '-'}</span>
                                                {order.user?.phoneNumber && (
                                                    <button
                                                        onClick={() => {
                                                            const prefixes = ['+54', '+598', '+56', '+55', '+595', '+1', '+34'];
                                                            let phoneToCopy = order.user.phoneNumber;

                                                            // Intentar remover el prefijo si existe
                                                            for (const prefix of prefixes) {
                                                                if (phoneToCopy.startsWith(prefix)) {
                                                                    phoneToCopy = phoneToCopy.substring(prefix.length);
                                                                    break; // Solo remover el primer match
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
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_LABELS[order.status]?.color || 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {STATUS_LABELS[order.status]?.label || order.status || 'Desconocido'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="max-w-xs truncate">
                                                {order.items?.map((item: any) =>
                                                    `${item.quantity}x ${item.product?.name}`
                                                ).join(', ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(order)}
                                                    className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50 transition"
                                                    title="Editar Pedido"
                                                >
                                                    <PenSquare className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('¿Está seguro de eliminar este pedido? Esta acción no se puede deshacer.') && token) {
                                                            dispatch(deleteOrder({ orderId: order.id, token }));
                                                        }
                                                    }}
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
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        No se encontraron pedidos
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d52]"
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
                                        Total ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editFormData.total}
                                        onChange={(e) => setEditFormData({ ...editFormData, total: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d5d52]"
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
                                    className="px-4 py-2 text-white bg-[#2d5d52] rounded-lg hover:bg-[#2d5d52]/90 transition"
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
