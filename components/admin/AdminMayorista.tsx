'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchInquiries,
  updateInquiryStatus,
  deleteInquiry,
  clearAdminMessages,
  CorporateGiftInquiry,
  InquiryStatus,
} from '@/redux/adminSlice';
import { Copy, Info, Trash2, X, Briefcase, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppDispatch, RootState } from '@/redux/store';
import { TokenGetter } from '@/lib/apiClient';

const STATUS_LABELS: Record<InquiryStatus, { label: string; color: string }> = {
  NUEVO: { label: 'Nuevo', color: 'bg-yellow-100 text-yellow-800' },
  CONTACTADO: { label: 'Contactado', color: 'bg-blue-100 text-blue-800' },
  CERRADO: { label: 'Cerrado', color: 'bg-green-100 text-green-800' },
  DESCARTADO: { label: 'Descartado', color: 'bg-gray-100 text-gray-800' },
};

const INQUIRY_STATUSES = ['ALL', 'NUEVO', 'CONTACTADO', 'CERRADO', 'DESCARTADO'];

interface AdminMayoristaProps {
  getToken: TokenGetter;
}

export default function AdminMayorista({ getToken }: AdminMayoristaProps) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    inquiries,
    loading,
    successMessage,
    error: adminError,
  } = useSelector((state: RootState) => state.admin);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [viewingInquiry, setViewingInquiry] = useState<CorporateGiftInquiry | null>(null);
  const [statusDraft, setStatusDraft] = useState<InquiryStatus>('NUEVO');

  useEffect(() => {
    dispatch(fetchInquiries(getToken));
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

  // Datos frescos del modal: tras un cambio de estado el store se actualiza,
  // así que preferimos la entidad del listado sobre el snapshot al abrir.
  const inquiry =
    viewingInquiry != null
      ? (inquiries.find((i) => i.id === viewingInquiry.id) ?? viewingInquiry)
      : null;

  const openDetail = (inquiry: CorporateGiftInquiry) => {
    setViewingInquiry(inquiry);
    setStatusDraft(inquiry.status);
  };

  const closeDetail = () => {
    setViewingInquiry(null);
  };

  const handleStatusSave = async () => {
    if (!viewingInquiry) return;
    try {
      await dispatch(
        updateInquiryStatus({
          inquiryId: viewingInquiry.id,
          status: statusDraft,
          getToken,
        })
      ).unwrap();
    } catch (error: unknown) {
      console.error('Update failed:', error);
    }
  };

  const handleDelete = async (inquiryId: number) => {
    if (!window.confirm('¿Eliminar esta consulta? Esta acción no se puede deshacer.')) return;
    try {
      await dispatch(deleteInquiry({ inquiryId, getToken })).unwrap();
      closeDetail();
    } catch (error: unknown) {
      console.error('Delete failed:', error);
    }
  };

  const copyPhone = (phone?: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    toast.success('Número copiado');
  };

  const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('es-AR') : '-');

  const filteredInquiries =
    inquiries?.filter((inquiry) => {
      if (filterStatus === 'ALL') return true;
      return inquiry.status === filterStatus;
    }) || [];

  if (loading && !viewingInquiry) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#254642] border-t-transparent" />
          <span className="text-sm text-gray-500">Cargando consultas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro por estado */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium whitespace-nowrap text-gray-600">
          Filtrar por estado:
        </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#254642] focus:ring-2 focus:ring-[#254642] focus:outline-none md:w-auto"
        >
          {INQUIRY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status === 'ALL' ? 'Todos' : STATUS_LABELS[status as InquiryStatus]?.label || status}
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
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredInquiries.length > 0 ? (
                filteredInquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                      {inquiry.empresa || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      <span className="font-medium text-gray-900">{inquiry.nombre}</span>
                      <span className="mt-0.5 block text-xs text-gray-400">{inquiry.email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${STATUS_LABELS[inquiry.status]?.color || 'bg-gray-100 text-gray-800'}`}
                      >
                        {STATUS_LABELS[inquiry.status]?.label || inquiry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      {formatDate(inquiry.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openDetail(inquiry)}
                          className="rounded-full p-2 text-blue-600 transition hover:bg-blue-50 hover:text-blue-900"
                          title="Ver detalle"
                        >
                          <Info className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(inquiry.id)}
                          className="rounded-full p-2 text-red-600 transition hover:bg-red-50 hover:text-red-900"
                          title="Eliminar consulta"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Briefcase className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                    <p className="font-medium text-gray-500">No hay consultas de mayoristas</p>
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
        {filteredInquiries.length > 0 ? (
          filteredInquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="space-y-3 rounded-xl border border-gray-100 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-gray-900">{inquiry.empresa || '-'}</p>
                  <p className="text-xs text-gray-500">{inquiry.nombre}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_LABELS[inquiry.status]?.color || 'bg-gray-100 text-gray-800'}`}
                >
                  {STATUS_LABELS[inquiry.status]?.label || inquiry.status}
                </span>
              </div>
              <p className="text-xs text-gray-400">{formatDate(inquiry.createdAt)}</p>
              <div className="flex justify-end gap-1 border-t border-gray-100 pt-2">
                <button
                  onClick={() => openDetail(inquiry)}
                  className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                  title="Ver detalle"
                >
                  <Info className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(inquiry.id)}
                  className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                  title="Eliminar consulta"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white py-16 text-center">
            <Briefcase className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-500">No hay consultas de mayoristas</p>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {viewingInquiry && inquiry && (
        <div
          className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDetail();
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <button
              onClick={closeDetail}
              className="absolute top-4 right-4 text-gray-400 transition-colors hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="mb-1 pr-8 text-lg font-bold text-gray-900">
              {inquiry.empresa || inquiry.nombre}
            </h3>
            <p className="mb-4 text-xs text-gray-400">
              Consulta recibida el {formatDate(inquiry.createdAt)}
            </p>

            {/* Datos del formulario */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h4 className="mb-3 border-b pb-2 font-semibold text-gray-800">Datos del contacto</h4>
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs tracking-wide text-gray-500 uppercase">Nombre</p>
                  <p className="font-medium text-gray-900">{inquiry.nombre}</p>
                </div>
                <div>
                  <p className="text-xs tracking-wide text-gray-500 uppercase">Empresa</p>
                  <p className="font-medium text-gray-900">{inquiry.empresa || '-'}</p>
                </div>
                <div>
                  <p className="text-xs tracking-wide text-gray-500 uppercase">Email</p>
                  <p className="font-medium break-all text-gray-900">{inquiry.email}</p>
                </div>
                <div>
                  <p className="text-xs tracking-wide text-gray-500 uppercase">Teléfono</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{inquiry.telefono}</p>
                    <button
                      onClick={() => copyPhone(inquiry.telefono)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copiar"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h4 className="mb-3 border-b pb-2 font-semibold text-gray-800">
                Requerimientos del pedido
              </h4>
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs tracking-wide text-gray-500 uppercase">Cantidad</p>
                  <p className="font-medium text-gray-900">{inquiry.cantidad || '-'}</p>
                </div>
                <div>
                  <p className="text-xs tracking-wide text-gray-500 uppercase">Tipo de regalo</p>
                  <p className="font-medium text-gray-900">{inquiry.tipoRegalo || '-'}</p>
                </div>
                <div>
                  <p className="text-xs tracking-wide text-gray-500 uppercase">Tipo de mate</p>
                  <p className="font-medium text-gray-900">{inquiry.tipoMate || '-'}</p>
                </div>
                <div>
                  <p className="text-xs tracking-wide text-gray-500 uppercase">
                    Fecha deseada de entrega
                  </p>
                  <p className="font-medium text-gray-900">{inquiry.fechaEntrega || '-'}</p>
                </div>
                {inquiry.presupuesto && (
                  <div>
                    <p className="text-xs tracking-wide text-gray-500 uppercase">Presupuesto</p>
                    <p className="font-medium text-gray-900">{inquiry.presupuesto}</p>
                  </div>
                )}
              </div>
              {inquiry.comentarios && (
                <div className="mt-4">
                  <p className="text-xs tracking-wide text-gray-500 uppercase">Comentarios</p>
                  <p className="mt-1 rounded bg-white p-3 leading-relaxed text-gray-700">
                    {inquiry.comentarios}
                  </p>
                </div>
              )}
            </div>

            {/* Cambio de estado */}
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as InquiryStatus)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#254642] focus:outline-none"
                >
                  {(Object.keys(STATUS_LABELS) as InquiryStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status].label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleStatusSave}
                disabled={statusDraft === inquiry.status || loading}
                className="w-full rounded-lg bg-[#254642] px-4 py-2 text-white transition hover:bg-[#254642]/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Guardar estado
              </button>
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row">
              <a
                href={`mailto:${inquiry.email}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 font-semibold text-[#254642] transition hover:bg-[#DAA520]"
              >
                <Mail className="h-4 w-4" />
                Contestar por mail
              </a>
              <button
                onClick={() => handleDelete(viewingInquiry.id)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
