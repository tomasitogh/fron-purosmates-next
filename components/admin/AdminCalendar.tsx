'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ListTodo,
  CalendarDays,
  Plus,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Calendar as CalendarIcon,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppDispatch, RootState } from '@/redux/store';
import {
  AdminTask,
  TaskAssignee,
  TaskPriority,
  clearTaskMessages,
  fetchTasks,
  setTaskCompleted,
} from '@/redux/taskSlice';
import { TokenGetter } from '@/lib/apiClient';
import TaskFormModal from './TaskFormModal';

type ViewMode = 'list' | 'calendar';
type StatusFilter = 'PENDING' | 'ALL' | 'URGENT' | 'COMPLETED';

// ─── Helpers de fecha (timezone local seguro) ────────────────────────────────
function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function formatDueDate(s: string): string {
  const d = parseDate(s);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}/${d.getFullYear()}`;
}

function formatFullSpanishDate(s: string): string {
  const d = parseDate(s);
  const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

function formatCompletedAt(s?: string | null): string {
  if (!s) return '';
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getRelativeDueInfo(dueDateStr: string): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
} {
  const [y, m, d] = dueDateStr.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return {
      label: abs === 1 ? 'Venció ayer' : `Venció hace ${abs} días`,
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
    };
  }
  if (diffDays === 0) {
    return { label: 'Vence hoy', isOverdue: false, isToday: true, isTomorrow: false };
  }
  if (diffDays === 1) {
    return { label: 'Vence mañana', isOverdue: false, isToday: false, isTomorrow: true };
  }
  if (diffDays <= 7) {
    return { label: `En ${diffDays} días`, isOverdue: false, isToday: false, isTomorrow: false };
  }
  return { label: formatDueDate(dueDateStr), isOverdue: false, isToday: false, isTomorrow: false };
}

// ─── Metadata de asignados y prioridades ─────────────────────────────────────
const ASSIGNEE_META: Record<
  TaskAssignee,
  { label: string; initials: string; badgeClass: string; avatarClass: string }
> = {
  TOMAS: {
    label: 'Tomás',
    initials: 'T',
    badgeClass: 'bg-[#254642]/10 text-[#254642]',
    avatarClass: 'bg-[#254642] text-white',
  },
  LUCIANA: {
    label: 'Luciana',
    initials: 'L',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    avatarClass: 'bg-emerald-700 text-white',
  },
  AMBOS: {
    label: 'Puros Mates',
    initials: 'PM',
    badgeClass: 'bg-[#D4AF37]/15 text-[#91721F]',
    avatarClass: 'bg-[#D4AF37] text-[#254642]',
  },
};

const PRIORITY_META: Record<
  TaskPriority,
  {
    label: string;
    chip: string;
    dot: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  URGENTE: {
    label: 'Urgente',
    chip: 'bg-red-50 text-red-700 border-red-200/80',
    dot: 'bg-red-500',
    border: 'border-l-red-500',
    icon: Flame,
  },
  NORMAL: {
    label: 'Normal',
    chip: 'bg-[#254642]/5 text-[#254642] border-[#254642]/15',
    dot: 'bg-[#254642]',
    border: 'border-l-[#254642]',
    icon: CheckCircle2,
  },
  BAJA: {
    label: 'Baja',
    chip: 'bg-gray-50 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
    border: 'border-l-gray-300',
    icon: Clock,
  },
};

export default function AdminCalendar({ getToken }: { getToken: TokenGetter }) {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, loading, error, successMessage } = useSelector((state: RootState) => state.tasks);

  const [view, setView] = useState<ViewMode>('list');
  const [modalTask, setModalTask] = useState<AdminTask | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);

  // Filtros de listado
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [assigneeFilter, setAssigneeFilter] = useState<TaskAssignee | 'ALL'>('ALL');

  // Estado del calendario
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(toKey(today));

  useEffect(() => {
    dispatch(fetchTasks(getToken));
  }, [dispatch, getToken]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearTaskMessages());
    }
    if (error) {
      toast.error(error);
      dispatch(clearTaskMessages());
    }
  }, [successMessage, error, dispatch]);

  const openCreate = (defaultDate?: string) => {
    setModalTask(null);
    setModalDefaultDate(defaultDate);
    setModalOpen(true);
  };

  const openEdit = (task: AdminTask) => {
    setModalTask(task);
    setModalDefaultDate(undefined);
    setModalOpen(true);
  };

  const toggleCompleted = (task: AdminTask) => {
    dispatch(setTaskCompleted({ id: task.id, completed: !task.completed, getToken }));
  };

  // ─── Estadísticas y agrupación ─────────────────────────────────────────────
  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);

  const pendingByAssignee = useMemo(() => {
    const counts: Record<TaskAssignee, number> = { TOMAS: 0, LUCIANA: 0, AMBOS: 0 };
    for (const t of pendingTasks) counts[t.assignee] += 1;
    return counts;
  }, [pendingTasks]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, AdminTask[]>();
    for (const t of tasks) {
      const list = map.get(t.dueDate) ?? [];
      list.push(t);
      map.set(t.dueDate, list);
    }
    return map;
  }, [tasks]);

  const selectedDayTasks = useMemo(
    () =>
      (tasksByDate.get(selectedDate) ?? [])
        .slice()
        .sort((a, b) => Number(a.completed) - Number(b.completed)),
    [tasksByDate, selectedDate]
  );

  // ─── Filtrado para la vista lista ──────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Filtro de estado
      if (statusFilter === 'PENDING' && task.completed) return false;
      if (statusFilter === 'COMPLETED' && !task.completed) return false;
      if (statusFilter === 'URGENT' && (task.priority !== 'URGENTE' || task.completed))
        return false;

      // Filtro de responsable
      if (assigneeFilter !== 'ALL' && task.assignee !== assigneeFilter) return false;

      // Filtro de búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchDesc = task.description?.toLowerCase().includes(query) ?? false;
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, assigneeFilter, searchQuery]);

  // ─── Generación de celdas del calendario (Lunes a Domingo) ──────────────────
  const calendarCells = useMemo(() => {
    const firstOfMonth = new Date(calYear, calMonth, 1);
    const dayOfWeek = firstOfMonth.getDay(); // 0 = Domingo, 1 = Lunes
    // Argentina standard: Lunes como primer día de la semana
    const startOffset = (dayOfWeek + 6) % 7;
    const start = new Date(calYear, calMonth, 1 - startOffset);
    const cells: { date: Date; key: string; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      cells.push({ date: d, key: toKey(d), inMonth: d.getMonth() === calMonth });
    }
    return cells;
  }, [calYear, calMonth]);

  const shiftMonth = (delta: number) => {
    const next = new Date(calYear, calMonth + delta, 1);
    setCalYear(next.getFullYear());
    setCalMonth(next.getMonth());
    setSelectedDate(toKey(next));
  };

  // ─── Sub-componentes visuales ──────────────────────────────────────────────
  const renderPriorityBadge = (priority: TaskPriority) => {
    const meta = PRIORITY_META[priority];
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${meta.chip}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
        {meta.label}
      </span>
    );
  };

  const renderAssigneeBadge = (assignee: TaskAssignee) => {
    const meta = ASSIGNEE_META[assignee];
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium text-gray-600">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${meta.avatarClass}`}
        >
          {meta.initials}
        </span>
        <span className="text-xs text-gray-700">{meta.label}</span>
      </span>
    );
  };

  const renderCheckbox = (task: AdminTask) => {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleCompleted(task);
        }}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-150 focus:ring-2 focus:ring-[#254642]/30 focus:outline-none ${
          task.completed
            ? 'border-[#254642] bg-[#254642] text-white shadow-2xs'
            : 'border-gray-300 bg-white hover:border-[#254642] hover:bg-gray-50'
        }`}
        aria-label={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
      >
        {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
      </button>
    );
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex min-h-[360px] items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#254642] border-t-transparent" />
          <span className="text-sm font-medium text-gray-500">Cargando tareas del taller...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header Principal estilo Vercel ─────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200/80 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-[#D4AF37] uppercase">
              Taller · Puros Mates
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-500">
              {pendingTasks.length} {pendingTasks.length === 1 ? 'pendiente' : 'pendientes'}
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#254642] sm:text-3xl">
            Tareas y Organización
          </h1>
          <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
            Gestión interna de pedidos, stock y compromisos compartidos.
          </p>
        </div>

        {/* Acciones principales: Switcher & Botón Nueva Tarea */}
        <div className="flex items-center gap-2.5">
          {/* Segmented Control Vercel */}
          <div className="flex items-center rounded-xl border border-gray-200/80 bg-gray-100/80 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                view === 'list'
                  ? 'border border-gray-200/60 bg-white text-[#17211F] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              aria-pressed={view === 'list'}
            >
              <ListTodo className="h-3.5 w-3.5" />
              <span>Listado</span>
            </button>
            <button
              type="button"
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                view === 'calendar'
                  ? 'border border-gray-200/60 bg-white text-[#17211F] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              aria-pressed={view === 'calendar'}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Calendario</span>
            </button>
          </div>

          {/* Botón Nueva Tarea Desktop */}
          <button
            type="button"
            onClick={() => openCreate(view === 'calendar' ? selectedDate : undefined)}
            className="hidden items-center gap-1.5 rounded-xl bg-[#254642] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#1d3734] hover:shadow-sm sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva tarea</span>
          </button>
        </div>
      </div>

      {/* ─── Cards de métricas por responsable (Accesos rápidos) ───────────── */}
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:gap-3">
        {(['TOMAS', 'LUCIANA', 'AMBOS'] as TaskAssignee[]).map((a) => {
          const meta = ASSIGNEE_META[a];
          const count = pendingByAssignee[a];
          const isSelected = assigneeFilter === a && view === 'list';

          return (
            <button
              key={a}
              type="button"
              onClick={() => {
                if (view === 'list') {
                  setAssigneeFilter(assigneeFilter === a ? 'ALL' : a);
                }
              }}
              className={`group flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all duration-150 sm:p-3.5 ${
                isSelected
                  ? 'border-[#254642] bg-[#254642]/5 ring-1 ring-[#254642]'
                  : 'border-gray-200/80 bg-white shadow-2xs hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold shadow-2xs transition sm:h-8 sm:w-8 ${meta.avatarClass}`}
                >
                  {meta.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#17211F] sm:text-sm">
                    {meta.label}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {count} {count === 1 ? 'activa' : 'activas'}
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold transition ${
                  count > 0
                    ? isSelected
                      ? 'bg-[#254642] text-white'
                      : 'bg-[#254642]/10 text-[#254642]'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── VISTA LISTADO ─────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="space-y-4">
          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-gray-200/80 bg-white p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            {/* Buscador */}
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título o detalle..."
                className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pr-8 pl-8.5 text-xs text-[#17211F] placeholder-gray-400 transition hover:border-gray-300 focus:border-[#254642] focus:ring-1 focus:ring-[#254642] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Chips de estado */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="hidden items-center gap-1 text-[11px] font-medium text-gray-400 lg:flex">
                <Filter className="h-3 w-3" />
                <span>Estado:</span>
              </div>

              {[
                { id: 'PENDING' as StatusFilter, label: 'Pendientes', count: pendingTasks.length },
                { id: 'ALL' as StatusFilter, label: 'Todas', count: tasks.length },
                {
                  id: 'URGENT' as StatusFilter,
                  label: 'Urgentes',
                  count: pendingTasks.filter((t) => t.priority === 'URGENTE').length,
                },
                {
                  id: 'COMPLETED' as StatusFilter,
                  label: 'Completadas',
                  count: completedTasks.length,
                },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setStatusFilter(pill.id)}
                  className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                    statusFilter === pill.id
                      ? 'border-[#254642] bg-[#254642] text-white shadow-2xs'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span
                    className={`py-0.2 rounded-full px-1.5 text-[10px] ${
                      statusFilter === pill.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              ))}

              {assigneeFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setAssigneeFilter('ALL')}
                  className="flex items-center gap-1 rounded-lg border border-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 text-xs font-semibold text-[#8C6D1F]"
                >
                  <span>Filtro: {ASSIGNEE_META[assigneeFilter].label}</span>
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Listado de Tareas */}
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#254642]/5 text-[#254642]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[#17211F]">
                No hay tareas que mostrar
              </h3>
              <p className="mt-1 max-w-sm text-xs text-gray-500">
                {searchQuery || assigneeFilter !== 'ALL' || statusFilter !== 'PENDING'
                  ? 'Probá ajustando o limpiando los filtros para ver otros resultados.'
                  : 'Todo el taller está al día. Podés crear una nueva tarea cuando surja un pendiente.'}
              </p>
              <button
                type="button"
                onClick={() => openCreate()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#254642] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1d3734]"
              >
                <Plus className="h-4 w-4" />
                <span>Crear nueva tarea</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => {
                const dueInfo = getRelativeDueInfo(task.dueDate);

                return (
                  <div
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openEdit(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openEdit(task);
                      }
                    }}
                    className={`group relative flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3.5 text-left shadow-2xs transition-all duration-150 hover:border-gray-300 hover:shadow-xs sm:p-4 ${
                      task.completed
                        ? 'border-gray-200/60 bg-gray-50/40 opacity-75'
                        : 'border-gray-200/90'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="pt-0.5">{renderCheckbox(task)}</div>

                    {/* Contenido */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3
                          className={`text-sm font-medium tracking-tight text-[#17211F] transition ${
                            task.completed
                              ? 'text-gray-400 line-through'
                              : 'group-hover:text-[#254642]'
                          }`}
                        >
                          {task.title}
                        </h3>

                        {/* Badges de estado en móvil y desktop */}
                        <div className="flex items-center gap-1.5">
                          {renderPriorityBadge(task.priority)}
                          {renderAssigneeBadge(task.assignee)}
                        </div>
                      </div>

                      {task.description && (
                        <p
                          className={`mt-1 line-clamp-2 text-xs text-gray-500 ${
                            task.completed ? 'text-gray-400 line-through' : ''
                          }`}
                        >
                          {task.description}
                        </p>
                      )}

                      {/* Footer de la tarjeta con Fechas */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                        {task.completed ? (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                            <Check className="h-3 w-3" />
                            Completada {formatCompletedAt(task.completedAt)}
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${
                              dueInfo.isOverdue
                                ? 'text-red-600'
                                : dueInfo.isToday
                                  ? 'font-semibold text-[#254642]'
                                  : 'text-gray-500'
                            }`}
                          >
                            {dueInfo.isOverdue ? (
                              <AlertTriangle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            <span>
                              {dueInfo.label} • {formatDueDate(task.dueDate)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── VISTA CALENDARIO ───────────────────────────────────────────────── */}
      {view === 'calendar' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Grilla del Calendario (7 col en desktop) */}
          <div className="space-y-3 lg:col-span-7">
            {/* Barra de navegación del mes */}
            <div className="flex items-center justify-between rounded-xl border border-gray-200/80 bg-white p-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-[#D4AF37]" />
                <h2 className="font-serif text-lg font-bold text-[#254642] sm:text-xl">
                  {MESES[calMonth]}{' '}
                  <span className="font-sans text-sm font-normal text-gray-400">{calYear}</span>
                </h2>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="rounded-lg border border-gray-200/80 p-1.5 text-gray-600 transition hover:bg-gray-100 hover:text-[#254642]"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalYear(today.getFullYear());
                    setCalMonth(today.getMonth());
                    setSelectedDate(toKey(today));
                  }}
                  className="rounded-lg border border-gray-200/80 px-2.5 py-1 text-xs font-semibold text-[#254642] transition hover:bg-gray-100"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="rounded-lg border border-gray-200/80 p-1.5 text-gray-600 transition hover:bg-gray-100 hover:text-[#254642]"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Matriz del mes */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xs">
              {/* Encabezados de días */}
              <div className="grid grid-cols-7 border-b border-gray-200/80 bg-gray-50/80">
                {WEEKDAYS.map((day, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 text-center text-[11px] font-semibold tracking-wider text-gray-400 uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Días */}
              <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
                {calendarCells.map((cell) => {
                  const dayTasks = tasksByDate.get(cell.key) ?? [];
                  const pendingCount = dayTasks.filter((t) => !t.completed).length;
                  const completedCount = dayTasks.length - pendingCount;
                  const isSelected = cell.key === selectedDate;
                  const isToday = cell.key === toKey(today);

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => setSelectedDate(cell.key)}
                      aria-pressed={isSelected}
                      className={`relative flex min-h-[58px] flex-col items-center justify-between p-1.5 text-left transition-all duration-150 sm:min-h-[72px] sm:p-2 ${
                        isSelected
                          ? 'bg-[#254642] text-white shadow-inner'
                          : isToday
                            ? 'bg-amber-50/40 text-[#254642] hover:bg-amber-50/80'
                            : cell.inMonth
                              ? 'bg-white text-[#17211F] hover:bg-gray-50/80'
                              : 'bg-gray-50/30 text-gray-300 hover:bg-gray-50/60'
                      }`}
                    >
                      {/* Número del día */}
                      <div className="flex w-full items-center justify-between">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            isSelected
                              ? 'bg-white text-[#254642]'
                              : isToday
                                ? 'bg-[#254642] font-bold text-white'
                                : cell.inMonth
                                  ? 'text-gray-800'
                                  : 'text-gray-300'
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>

                        {isToday && !isSelected && (
                          <span className="hidden text-[9px] font-bold text-[#D4AF37] uppercase sm:inline">
                            Hoy
                          </span>
                        )}
                      </div>

                      {/* Indicadores de Tareas */}
                      <div className="mt-1 flex w-full flex-wrap items-center justify-start gap-1">
                        {dayTasks.length > 0 && (
                          <div className="flex items-center gap-1">
                            {pendingCount > 0 && (
                              <span
                                className={`py-0.2 flex items-center gap-0.5 rounded-full px-1 text-[9px] font-bold ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#254642]/10 text-[#254642]'
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    isSelected ? 'bg-white' : 'bg-[#254642]'
                                  }`}
                                />
                                <span>{pendingCount}</span>
                              </span>
                            )}

                            {completedCount > 0 && (
                              <span
                                className={`py-0.2 flex items-center gap-0.5 rounded-full px-1 text-[9px] font-bold ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    isSelected ? 'bg-emerald-300' : 'bg-emerald-600'
                                  }`}
                                />
                                <span>{completedCount}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panel Lateral: Detalle del Día Seleccionado (5 col en desktop) */}
          <div className="lg:col-span-5">
            <div className="sticky top-20 space-y-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs sm:p-5">
              {/* Header del Día */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-[#D4AF37] uppercase">
                    Día seleccionado
                  </span>
                  <h3 className="font-serif text-base font-bold text-[#254642] sm:text-lg">
                    {formatFullSpanishDate(selectedDate)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => openCreate(selectedDate)}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#254642] px-2.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#1d3734]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Agregar</span>
                </button>
              </div>

              {/* Lista de tareas de ese día */}
              {selectedDayTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-8 text-center">
                  <Clock className="h-7 w-7 text-gray-300" />
                  <p className="mt-2 text-xs font-medium text-gray-600">
                    No hay tareas para este día
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Hacé clic en Agregar para programar una.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayTasks.map((task) => (
                    <div
                      key={task.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openEdit(task)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openEdit(task);
                        }
                      }}
                      className={`group flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-left transition-all hover:border-gray-300 hover:shadow-2xs ${
                        task.completed
                          ? 'border-gray-200/60 bg-gray-50/40 opacity-75'
                          : 'border-gray-200/90 bg-white'
                      }`}
                    >
                      <div className="pt-0.5">{renderCheckbox(task)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <h4
                            className={`text-xs font-semibold text-[#17211F] ${
                              task.completed ? 'text-gray-400 line-through' : ''
                            }`}
                          >
                            {task.title}
                          </h4>
                          {renderPriorityBadge(task.priority)}
                        </div>

                        {task.description && (
                          <p className="mt-1 line-clamp-1 text-[11px] text-gray-500">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                          {renderAssigneeBadge(task.assignee)}
                          <span className="text-[10px] text-gray-400">
                            {task.completed ? 'Completada' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Botón Flotante (FAB) para Mobile ──────────────────────────────── */}
      <button
        type="button"
        onClick={() => openCreate(view === 'calendar' ? selectedDate : undefined)}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#254642] px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-all hover:bg-[#1d3734] hover:shadow-xl sm:hidden"
        aria-label="Crear nueva tarea"
      >
        <Plus className="h-4 w-4" />
        <span>Nueva tarea</span>
      </button>

      {/* ─── Modal de Formulario ───────────────────────────────────────────── */}
      {modalOpen && (
        <TaskFormModal
          task={modalTask}
          defaultDueDate={modalDefaultDate}
          getToken={getToken}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
