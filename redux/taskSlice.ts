import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { TokenGetter, withAuthRetry } from '@/lib/apiClient';

const TASKS_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/tasks`
  : 'http://localhost:8080/api/v1/tasks';

// El backend devuelve { error, message } en los errores (GlobalExceptionHandler).
function throwReadableError(e: unknown): never {
  if (axios.isAxiosError(e) && e.response?.data) {
    const body = e.response.data as { message?: string; error?: string };
    const msg = body?.message || body?.error;
    if (typeof msg === 'string' && msg.trim()) {
      throw new Error(msg);
    }
  }
  throw e;
}

export type TaskAssignee = 'TOMAS' | 'LUCIANA' | 'AMBOS';
export type TaskPriority = 'URGENTE' | 'NORMAL' | 'BAJA';

export interface AdminTask {
  id: number;
  title: string;
  description?: string | null;
  dueDate: string; // YYYY-MM-DD (LocalDate del backend)
  priority: TaskPriority;
  assignee: TaskAssignee;
  completed: boolean;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskPayload {
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  assignee: TaskAssignee;
}

interface TasksState {
  tasks: AdminTask[];
  loading: boolean;
  mutating: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: TasksState = {
  tasks: [],
  loading: false,
  mutating: false,
  error: null,
  successMessage: null,
};

export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async (getToken: TokenGetter) => {
  try {
    const { data } = await withAuthRetry(getToken, (token) =>
      axios.get<AdminTask[]>(TASKS_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    return data;
  } catch (e) {
    throwReadableError(e);
  }
});

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async ({ payload, getToken }: { payload: TaskPayload; getToken: TokenGetter }) => {
    try {
      const { data } = await withAuthRetry(getToken, (token) =>
        axios.post<AdminTask>(TASKS_API_URL, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      return data;
    } catch (e) {
      throwReadableError(e);
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({
    id,
    payload,
    getToken,
  }: {
    id: number;
    payload: TaskPayload;
    getToken: TokenGetter;
  }) => {
    try {
      const { data } = await withAuthRetry(getToken, (token) =>
        axios.put<AdminTask>(`${TASKS_API_URL}/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      return data;
    } catch (e) {
      throwReadableError(e);
    }
  }
);

export const setTaskCompleted = createAsyncThunk(
  'tasks/setTaskCompleted',
  async ({
    id,
    completed,
    getToken,
  }: {
    id: number;
    completed: boolean;
    getToken: TokenGetter;
  }) => {
    try {
      const { data } = await withAuthRetry(getToken, (token) =>
        axios.patch<AdminTask>(
          `${TASKS_API_URL}/${id}/complete`,
          { completed },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      return data;
    } catch (e) {
      throwReadableError(e);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async ({ id, getToken }: { id: number; getToken: TokenGetter }) => {
    try {
      await withAuthRetry(getToken, (token) =>
        axios.delete(`${TASKS_API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      return id;
    } catch (e) {
      throwReadableError(e);
    }
  }
);

// Pendientes primero (por vencimiento asc), completadas al final (más recientes primero)
function sortTasks(tasks: AdminTask[]): AdminTask[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.completed) return a.dueDate.localeCompare(b.dueDate);
    return (b.completedAt ?? '').localeCompare(a.completedAt ?? '');
  });
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTaskMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = sortTasks(action.payload);
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar las tareas';
      })
      // Create
      .addCase(createTask.pending, (state) => {
        state.mutating = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.mutating = false;
        state.tasks = sortTasks([...state.tasks, action.payload]);
        state.successMessage = 'Tarea creada correctamente';
      })
      .addCase(createTask.rejected, (state, action) => {
        state.mutating = false;
        state.error = action.error.message || 'Error al crear la tarea';
      })
      // Update
      .addCase(updateTask.pending, (state) => {
        state.mutating = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.mutating = false;
        state.tasks = sortTasks(
          state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t))
        );
        state.successMessage = 'Tarea actualizada correctamente';
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.mutating = false;
        state.error = action.error.message || 'Error al actualizar la tarea';
      })
      // Toggle completed (sin flag `mutating`: es una acción rápida y frecuente)
      .addCase(setTaskCompleted.fulfilled, (state, action) => {
        state.tasks = sortTasks(
          state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t))
        );
      })
      .addCase(setTaskCompleted.rejected, (state, action) => {
        state.error = action.error.message || 'Error al actualizar la tarea';
      })
      // Delete
      .addCase(deleteTask.pending, (state) => {
        state.mutating = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.mutating = false;
        state.tasks = state.tasks.filter((t) => t.id !== action.payload);
        state.successMessage = 'Tarea eliminada correctamente';
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.mutating = false;
        state.error = action.error.message || 'Error al eliminar la tarea';
      });
  },
});

export const { clearTaskMessages } = tasksSlice.actions;
export default tasksSlice.reducer;
