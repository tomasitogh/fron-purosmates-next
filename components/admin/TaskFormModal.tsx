'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  Check,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  UserCheck,
  Flame,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AppDispatch, RootState } from '@/redux/store';
import {
  AdminTask,
  TaskAssignee,
  TaskPriority,
  createTask,
  updateTask,
  deleteTask,
} from '@/redux/taskSlice';
import { TokenGetter } from '@/lib/apiClient';

interface TaskFormModalProps {
  task: AdminTask | null; // null = crear nueva
  defaultDueDate?: string; // YYYY-MM-DD pre-seleccionada
  getToken: TokenGetter;
  onClose: () => void;
}

const ASSIGNEE_OPTIONS: { value: TaskAssignee; label: string; initials: string; role: string }[] = [
  { value: 'TOMAS', label: 'Tomás', initials: 'T', role: 'Admin' },
  { value: 'LUCIANA', label: 'Luciana', initials: 'L', role: 'Admin' },
  { value: 'AMBOS', label: 'Puros Mates', initials: 'PM', role: 'Equipo' },
];

const PRIORITY_OPTIONS: {
  value: TaskPriority;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
  dotClass: string;
}[] = [
  {
    value: 'URGENTE',
    label: 'Urgente',
    icon: Flame,
    activeClass: 'bg-red-500 text-white border-red-600 shadow-xs ring-2 ring-red-300/50',
    dotClass: 'bg-red-500',
  },
  {
    value: 'NORMAL',
    label: 'Normal',
    icon: CheckCircle2,
    activeClass: 'bg-[#254642] text-white border-[#254642] shadow-xs ring-2 ring-[#254642]/30',
    dotClass: 'bg-[#254642]',
  },
  {
    value: 'BAJA',
    label: 'Baja',
    icon: Clock,
    activeClass: 'bg-gray-700 text-white border-gray-700 shadow-xs ring-2 ring-gray-300/50',
    dotClass: 'bg-gray-400',
  },
];

function toInputDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export default function TaskFormModal({
  task,
  defaultDueDate,
  getToken,
  onClose,
}: TaskFormModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { mutating } = useSelector((state: RootState) => state.tasks);
  const isEdit = task !== null;

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState(
    task?.dueDate ?? defaultDueDate ?? toInputDate(new Date())
  );
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'NORMAL');
  const [assignee, setAssignee] = useState<TaskAssignee>(task?.assignee ?? 'AMBOS');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setFormError('El nombre de la tarea es obligatorio.');
      return;
    }
    if (!dueDate) {
      setFormError('La fecha de vencimiento es obligatoria.');
      return;
    }
    setFormError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate,
      priority,
      assignee,
    };

    try {
      if (isEdit) {
        await dispatch(updateTask({ id: task.id, payload, getToken })).unwrap();
      } else {
        await dispatch(createTask({ payload, getToken })).unwrap();
      }
      onClose();
    } catch {
      // Error handled via Redux slice and toast in AdminCalendar
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (window.confirm(`¿Eliminar la tarea "${task.title}"? Esta acción no se puede deshacer.`)) {
      try {
        await dispatch(deleteTask({ id: task.id, getToken })).unwrap();
        onClose();
      } catch {
        // Error handled via Redux slice
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-xs transition-all duration-200 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !mutating) onClose();
      }}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200/90 bg-white shadow-2xl transition-all sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-task-title"
      >
        {/* Header Vercel-style */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#254642]/10 text-[#254642]">
              {isEdit ? <Sparkles className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            </div>
            <div>
              <h2
                id="modal-task-title"
                className="text-base font-semibold tracking-tight text-[#17211F]"
              >
                {isEdit ? 'Modificar tarea' : 'Nueva tarea'}
              </h2>
              <p className="text-xs text-gray-500">
                {isEdit
                  ? 'Actualizá los detalles de la tarea'
                  : 'Crea una tarea para el equipo de Puros Mates'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={mutating}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body con Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            {/* Mensaje de error si falta campo */}
            {formError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-xs font-medium text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            {/* Título de la tarea */}
            <div>
              <label
                htmlFor="task-title"
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Título de la tarea <span className="text-red-500">*</span>
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Empaquetar pedidos mayoristas de Córdoba"
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#17211F] placeholder-gray-400 shadow-2xs transition hover:border-gray-300 focus:border-[#254642] focus:ring-2 focus:ring-[#254642]/15 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Descripción */}
            <div>
              <label
                htmlFor="task-description"
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Descripción o notas <span className="text-xs text-gray-400">(opcional)</span>
              </label>
              <textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles, números de remito, stock a verificar o indicaciones especiales..."
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#17211F] placeholder-gray-400 shadow-2xs transition hover:border-gray-300 focus:border-[#254642] focus:ring-2 focus:ring-[#254642]/15 focus:outline-none"
              />
            </div>

            {/* Fecha de vencimiento & Prioridad */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="task-due-date"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700"
                >
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  Fecha límite <span className="text-red-500">*</span>
                </label>
                <input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#17211F] shadow-2xs transition hover:border-gray-300 focus:border-[#254642] focus:ring-2 focus:ring-[#254642]/15 focus:outline-none"
                />
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-gray-700">Prioridad</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {PRIORITY_OPTIONS.map((opt) => {
                    const isActive = priority === opt.value;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPriority(opt.value)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-medium transition-all ${
                          isActive
                            ? opt.activeClass
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50/80'
                        }`}
                        aria-pressed={isActive}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Asignado a */}
            <div>
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <UserCheck className="h-3.5 w-3.5 text-gray-400" />
                Responsable
              </span>
              <div className="grid grid-cols-3 gap-2">
                {ASSIGNEE_OPTIONS.map((opt) => {
                  const isActive = assignee === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAssignee(opt.value)}
                      className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                        isActive
                          ? 'border-[#254642] bg-[#254642]/5 ring-1 ring-[#254642]'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                      }`}
                      aria-pressed={isActive}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition ${
                          isActive
                            ? 'bg-[#254642] text-white shadow-xs'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {opt.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-xs font-semibold ${
                            isActive ? 'text-[#254642]' : 'text-gray-800'
                          }`}
                        >
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-gray-400">{opt.role}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Vercel-style */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3.5 sm:px-6">
            {isEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={mutating}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Eliminar</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={mutating}
                className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 shadow-2xs transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#254642] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1d3734] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mutating ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>{isEdit ? 'Guardar cambios' : 'Crear tarea'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
