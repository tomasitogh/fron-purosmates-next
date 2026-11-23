'use client';

/* eslint-disable @next/next/no-img-element -- fotos de proveedores externos, sin optimizar */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw, Search, X, Minus, Plus, Copy } from 'lucide-react';
import { TokenGetter, withAuthRetry } from '@/lib/apiClient';

/*
 * Sección "Compras": Lulita carga lo que le falta, el sistema mira el precio de
 * cada proveedor y arma un pedido por proveedor listo para mandar por WhatsApp.
 * Las uniones (qué producto es cuál en cada proveedor) las confirma ella por foto.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const COMPRAS_URL = `${API_BASE}/api/v1/compras`;
const PRODUCTS_URL = `${API_BASE}/products/admin/all`;

type SupId = 'ph' | 'ar' | 'al';
const SUPS: SupId[] = ['ph', 'ar', 'al'];
const SUP_FIELD: Record<SupId, keyof Union> = {
  ph: 'poneleH',
  ar: 'aquilesRosa',
  al: 'argentinoLimite',
};
const SUP_PLACE: Record<SupId, string> = {
  ph: 'Corrientes',
  ar: 'Santa Fe',
  al: '',
};
const SUP_COLOR: Record<SupId, string> = {
  ph: 'border-l-[#c0723a]',
  ar: 'border-l-[#7a5ea8]',
  al: 'border-l-[#2f7d6d]',
};

interface Tramo {
  desde: number;
  precio: number;
}
interface Oferta {
  nombre: string;
  precio: number;
  tramos: Tramo[];
  agotado: boolean;
  imagen: string | null;
}
interface ProveedorPrecios {
  id: SupId;
  nombre: string;
  url: string;
  actualizado: string | null;
  error: string | null;
  productos: Oferta[];
}
interface Union {
  productId: number;
  poneleH: string | null;
  aquilesRosa: string | null;
  argentinoLimite: string | null;
}
interface PmVariant {
  id: number;
  name: string;
  stock: number;
  imageUrl?: string | null;
  active?: boolean;
}
interface PmProduct {
  id: number;
  name: string;
  categoryName?: string;
  active?: boolean;
  images?: { url: string }[];
  variants?: PmVariant[];
}
interface Line {
  id: number;
  q: number;
  variant: number | null;
  to?: SupId;
}

// Precio de un proveedor para una cantidad (null = no lo vende).
interface Off {
  name: string;
  price: number | null;
  base: number;
  tier: number | null;
  sold: boolean;
  missing: boolean;
  next: Tramo | undefined;
}
const usable = (o: Off | null): o is Off & { price: number } => !!o && o.price != null && !o.sold;

interface AdminComprasProps {
  getToken: TokenGetter;
}

const money = (v: number) => '$' + Math.round(v).toLocaleString('es-AR');
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function haceCuanto(iso: string | null): string {
  if (!iso) return 'sin leer todavía';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} días`;
}

function leer<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function guardar(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* el navegador no deja guardar: no pasa nada */
  }
}

export default function AdminCompras({ getToken }: AdminComprasProps) {
  const [view, setView] = useState<'pedido' | 'unir'>('pedido');
  const [products, setProducts] = useState<PmProduct[]>([]);
  const [precios, setPrecios] = useState<ProveedorPrecios[]>([]);
  const [uniones, setUniones] = useState<Record<number, Union>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [margin, setMargin] = useState(1000);
  const [lines, setLines] = useState<Line[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [picking, setPicking] = useState<{ id: number; w: SupId } | null>(null);

  // Lo que estaba cargando queda guardado en este navegador, por si cierra la pestaña.
  useEffect(() => {
    setMargin(leer('compras.margen', 1000));
    setLines(leer('compras.lineas', [] as Line[]));
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) guardar('compras.lineas', lines);
  }, [lines, hydrated]);
  useEffect(() => {
    if (hydrated) guardar('compras.margen', margin);
  }, [margin, hydrated]);

  const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

  const cargarPrecios = useCallback(
    async (forzar: boolean) => {
      const { data } = await withAuthRetry(getToken, (token) =>
        axios.get<ProveedorPrecios[]>(`${COMPRAS_URL}/precios`, {
          ...auth(token),
          params: { actualizar: forzar },
          timeout: 120000,
        })
      );
      setPrecios(data.filter(Boolean));
    },
    [getToken]
  );

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [prods, unis] = await Promise.all([
          withAuthRetry(getToken, (token) => axios.get<PmProduct[]>(PRODUCTS_URL, auth(token))),
          withAuthRetry(getToken, (token) =>
            axios.get<Union[]>(`${COMPRAS_URL}/uniones`, auth(token))
          ),
        ]);
        if (cancel) return;
        setProducts(
          prods.data
            .filter((p) => p.active !== false)
            .sort((a, b) => a.name.localeCompare(b.name, 'es'))
        );
        setUniones(Object.fromEntries(unis.data.map((u) => [u.productId, u])));
      } catch {
        toast.error('No se pudieron cargar los productos');
      }
      try {
        await cargarPrecios(false);
      } catch {
        if (!cancel) toast.error('No se pudieron leer los precios de los proveedores');
      }
      if (!cancel) setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [getToken, cargarPrecios]);

  const actualizarAhora = async () => {
    setRefreshing(true);
    try {
      await cargarPrecios(true);
      toast.success('Precios actualizados');
    } catch {
      toast.error('No se pudieron actualizar los precios');
    } finally {
      setRefreshing(false);
    }
  };

  // ─── Precios y recomendación ───
  const lists = useMemo(() => {
    const out: Record<SupId, Map<string, Oferta>> = { ph: new Map(), ar: new Map(), al: new Map() };
    for (const p of precios) out[p.id] = new Map(p.productos.map((o) => [o.nombre, o]));
    return out;
  }, [precios]);
  const supName = useCallback(
    (w: SupId) => precios.find((p) => p.id === w)?.nombre ?? w,
    [precios]
  );
  const byId = useCallback((id: number) => products.find((p) => p.id === id), [products]);
  const supNameOf = useCallback(
    (id: number, w: SupId) => (uniones[id]?.[SUP_FIELD[w]] as string | null) ?? null,
    [uniones]
  );

  const offer = useCallback(
    (id: number, w: SupId, q = 1): Off | null => {
      const n = supNameOf(id, w);
      if (!n) return null;
      const o = lists[w].get(n);
      if (!o)
        return {
          name: n,
          price: null,
          base: 0,
          tier: null,
          sold: false,
          missing: true,
          next: undefined,
        };
      let price = o.precio;
      let tier: number | null = null;
      for (const t of o.tramos) {
        if (q >= t.desde && t.precio < price) {
          price = t.precio;
          tier = t.desde;
        }
      }
      const next = o.tramos.find((t) => t.desde > q);
      return { name: n, price, base: o.precio, tier, sold: o.agotado, missing: false, next };
    },
    [lists, supNameOf]
  );

  const verdict = useCallback(
    (id: number, q = 1) => {
      const os = SUPS.map((w) => [w, offer(id, w, q)] as const)
        .filter(([, o]) => usable(o))
        .sort((a, b) => (a[1]!.price as number) - (b[1]!.price as number));
      if (!os.length) {
        const any = SUPS.some((w) => supNameOf(id, w));
        const sold = SUPS.some((w) => offer(id, w, q)?.sold);
        return {
          k: 'none' as const,
          cands: [] as SupId[],
          solo: false,
          label: sold
            ? 'Agotado donde lo venden'
            : any
              ? 'No aparece en la lista hoy'
              : 'Ningún proveedor lo tiene',
        };
      }
      const best = os[0][1]!.price as number;
      const cands = os.filter(([, o]) => (o!.price as number) - best <= margin).map(([w]) => w);
      if (os.length === 1)
        return { k: os[0][0], cands, solo: true, label: 'Solo ' + supName(os[0][0]) };
      if (cands.length > 1)
        return {
          k: 'any' as const,
          cands,
          solo: false,
          label: 'Da igual entre ' + cands.map(supName).join(' y '),
        };
      return {
        k: os[0][0],
        cands,
        solo: false,
        label: `${supName(os[0][0])} · ahorrás ${money((os[1][1]!.price as number) - best)} c/u`,
      };
    },
    [offer, supNameOf, margin, supName]
  );

  // ─── Pedidos por proveedor ───
  const orders = useMemo(() => {
    const bag: Record<SupId, { l: Line; p: PmProduct; why: string }[]> = { ph: [], ar: [], al: [] };
    const none: { p: PmProduct; label: string }[] = [];
    const act = lines
      .filter((l) => l.q > 0 && byId(l.id))
      .map((l) => ({ l, p: byId(l.id)!, v: verdict(l.id, l.q) }));
    const movedTo = (l: Line) => (l.to && usable(offer(l.id, l.to, l.q)) ? l.to : null);
    for (const x of act) {
      if (x.v.k === 'none') none.push({ p: x.p, label: x.v.label });
      else if (x.v.k !== 'any') {
        const to = movedTo(x.l);
        bag[to ?? x.v.k].push({
          l: x.l,
          p: x.p,
          why:
            to && to !== x.v.k
              ? 'lo pasaste vos'
              : x.v.solo
                ? 'solo lo tiene este'
                : 'más barato acá',
        });
      }
    }
    // Los "da igual" van con el proveedor que ya tiene más cosas: así es un solo envío.
    for (const x of act.filter((y) => y.v.k === 'any')) {
      const to = movedTo(x.l);
      const w = to ?? [...x.v.cands].sort((a, b) => bag[b].length - bag[a].length)[0];
      bag[w].push({ l: x.l, p: x.p, why: to ? 'lo pasaste vos' : 'da igual, lo junté acá' });
    }
    return { bag, none };
  }, [lines, byId, verdict, offer]);

  const variantName = (p: PmProduct, l: Line) => {
    const vs = (p.variants ?? []).filter((v) => v.active !== false);
    const v = vs.find((x) => x.id === l.variant);
    return vs.length > 1 && v?.name ? ` (${v.name})` : '';
  };

  const copiar = async (w: SupId) => {
    const txt =
      'Hola! Te paso un pedido para Puros Mates:\n' +
      orders.bag[w].map(({ l }) => `• ${l.q} × ${supNameOf(l.id, w)}`).join('\n') +
      '\n¡Gracias!';
    try {
      await navigator.clipboard.writeText(txt);
      toast.success('Copiado. Pegalo en WhatsApp');
    } catch {
      toast.error('No se pudo copiar, probá de nuevo');
    }
  };

  // ─── Carga de líneas ───
  const [find, setFind] = useState('');
  const sugg = useMemo(() => {
    const words = norm(find.trim()).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return products
      .filter((p) => {
        const t = norm(`${p.name} ${p.categoryName ?? ''}`);
        return words.every((w) => t.includes(w));
      })
      .slice(0, 8);
  }, [find, products]);

  const addLine = (p: PmProduct) => {
    const vs = (p.variants ?? []).filter((v) => v.active !== false);
    setLines((ls) => [...ls, { id: p.id, q: 1, variant: vs[0]?.id ?? null }]);
    setFind('');
  };
  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  // ─── Uniones ───
  const saveUnion = async (id: number, w: SupId, nombre: string | null) => {
    const prev = uniones[id] ?? {
      productId: id,
      poneleH: null,
      aquilesRosa: null,
      argentinoLimite: null,
    };
    const next = { ...prev, [SUP_FIELD[w]]: nombre };
    setUniones((u) => ({ ...u, [id]: next }));
    try {
      const { data } = await withAuthRetry(getToken, (token) =>
        axios.put<Union>(
          `${COMPRAS_URL}/uniones/${id}`,
          {
            poneleH: next.poneleH,
            aquilesRosa: next.aquilesRosa,
            argentinoLimite: next.argentinoLimite,
          },
          auth(token)
        )
      );
      setUniones((u) => ({ ...u, [id]: data }));
      toast.success('Guardado');
    } catch {
      setUniones((u) => ({ ...u, [id]: prev }));
      toast.error('No se pudo guardar, probá de nuevo');
    }
  };

  const pmImg = (p: PmProduct | undefined) =>
    p?.images?.[0]?.url || p?.variants?.find((v) => v.imageUrl)?.imageUrl || null;

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin text-[#254642]" />
        <span className="text-sm">Leyendo los precios de los proveedores…</span>
      </div>
    );
  }

  const pendientes = products.filter((p) => !uniones[p.id]);

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#254642]">Compras</h2>
          <p className="text-sm text-gray-500">
            Cargá lo que te falta y te digo a quién conviene comprarle.
          </p>
        </div>
        <div
          className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm"
          role="tablist"
        >
          {(
            [
              ['pedido', 'Armar pedido'],
              ['unir', `Unir productos${pendientes.length ? ` (${pendientes.length})` : ''}`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                view === id
                  ? 'bg-white text-[#254642] shadow-sm'
                  : 'text-gray-500 hover:text-[#254642]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Estado de las listas */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-[#f5f5f0] px-3 py-2 text-xs text-gray-600">
        {precios.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${p.error ? 'bg-amber-500' : 'bg-emerald-500'}`}
            />
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium hover:underline"
            >
              {p.nombre}
            </a>
            <span className="text-gray-400">
              {p.error
                ? `no se pudo leer · muestro la de ${haceCuanto(p.actualizado)}`
                : haceCuanto(p.actualizado)}
            </span>
          </span>
        ))}
        <button
          type="button"
          onClick={actualizarAhora}
          disabled={refreshing}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1 font-medium text-[#254642] transition hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualizando…' : 'Actualizar ahora'}
        </button>
      </div>

      {view === 'pedido' ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Qué te falta */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-[#254642]">¿Qué te falta?</h3>
              <label className="flex items-center gap-2 text-xs text-gray-500">
                Da igual si la diferencia es menor a
                <span className="relative">
                  <span className="absolute top-1/2 left-2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={margin}
                    onChange={(e) => setMargin(Math.max(0, Number(e.target.value) || 0))}
                    className="w-24 rounded-md border border-gray-300 py-1 pr-2 pl-5 text-right text-sm text-[#254642]"
                  />
                </span>
              </label>
            </div>

            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={find}
                onChange={(e) => setFind(e.target.value)}
                placeholder="Buscá un producto: imperial, bombilla, yerbera…"
                className="w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-9 text-sm focus:border-[#254642] focus:outline-none"
              />
              {find.trim() && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                  {sugg.length ? (
                    sugg.map((p) => {
                      const st = (p.variants || []).reduce((s, v) => s + (v.stock || 0), 0);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => addLine(p)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <Thumb src={pmImg(p)} size="sm" />
                          <span className="flex-1">{p.name}</span>
                          <span className="text-xs text-gray-400">hay {st}</span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="px-3 py-2 text-sm text-gray-400">
                      No hay productos con ese nombre.
                    </p>
                  )}
                </div>
              )}
            </div>

            {lines.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-400">
                Todavía no cargaste nada. Buscá arriba lo que te falta.
              </p>
            ) : (
              <ul className="space-y-2">
                {lines.map((l, i) => {
                  const p = byId(l.id);
                  if (!p) return null;
                  const v = verdict(l.id, l.q);
                  const vs = (p.variants || []).filter((x) => x.active !== false);
                  const cur = vs.find((x) => x.id === l.variant);
                  return (
                    <li key={i} className="flex gap-3 rounded-lg border border-gray-200 p-3">
                      <Thumb src={cur?.imageUrl || pmImg(p)} size="md" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-[#254642]">{p.name}</span>
                          <button
                            type="button"
                            onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                            className="text-gray-300 hover:text-red-500"
                            aria-label={`Quitar ${p.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          {vs.length > 1 && (
                            <select
                              aria-label="Color"
                              value={l.variant || ''}
                              onChange={(e) => setLine(i, { variant: Number(e.target.value) })}
                              className="rounded border border-gray-200 py-0.5 text-xs"
                            >
                              {vs.map((x) => (
                                <option key={x.id} value={x.id}>
                                  {x.name}
                                </option>
                              ))}
                            </select>
                          )}
                          <span>hay {cur?.stock || 0}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                          {SUPS.map((w) => {
                            const o = offer(l.id, w, l.q);
                            const win = v.k === w || (v.k === 'any' && v.cands.includes(w));
                            if (!o || o.missing)
                              return (
                                <span key={w}>
                                  {supName(w)}: <b className="text-gray-300">—</b>
                                </span>
                              );
                            if (o.sold)
                              return (
                                <span key={w}>
                                  {supName(w)}: <s>{money(o.base)}</s> agotado
                                </span>
                              );
                            return (
                              <span key={w} className={win ? 'font-semibold text-emerald-700' : ''}>
                                {supName(w)}: {money(o.price as number)}
                                {o.tier ? (
                                  <span title={`Precio por llevar ${o.tier} o más`}>
                                    {' '}
                                    (x{o.tier}+)
                                  </span>
                                ) : o.next ? (
                                  <span
                                    className="font-normal text-gray-400"
                                    title={`Si llevás ${o.next.desde} o más, sale ${money(o.next.precio)}`}
                                  >
                                    {' '}
                                    · x{o.next.desde}: {money(o.next.precio)}
                                  </span>
                                ) : null}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <Verdict k={v.k} label={v.label} />
                          <div className="flex items-center rounded-md border border-gray-300">
                            <button
                              type="button"
                              onClick={() => setLine(i, { q: Math.max(0, l.q - 1) })}
                              className="px-2 py-1 text-gray-500 hover:text-[#254642]"
                              aria-label="Menos"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              inputMode="numeric"
                              value={l.q}
                              onChange={(e) =>
                                setLine(i, { q: Math.max(0, parseInt(e.target.value, 10) || 0) })
                              }
                              className="w-10 border-x border-gray-300 py-1 text-center text-sm"
                              aria-label="Cantidad"
                            />
                            <button
                              type="button"
                              onClick={() => setLine(i, { q: l.q + 1 })}
                              className="px-2 py-1 text-gray-500 hover:text-[#254642]"
                              aria-label="Más"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {lines.length > 0 && (
              <button
                type="button"
                onClick={() => setLines([])}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                Vaciar la lista
              </button>
            )}
          </section>

          {/* Pedidos */}
          <section className="space-y-3">
            <h3 className="font-semibold text-[#254642]">Pedidos por proveedor</h3>
            {SUPS.map((w) => {
              const items = orders.bag[w];
              const total = items.reduce(
                (sum, { l }) => sum + ((offer(l.id, w, l.q)?.price as number) || 0) * l.q,
                0
              );
              return (
                <div
                  key={w}
                  className={`rounded-lg border border-l-4 border-gray-200 ${SUP_COLOR[w]} bg-white`}
                >
                  <header className="flex items-baseline justify-between px-4 pt-3">
                    <b className="text-[#254642]">{supName(w)}</b>
                    <span className="text-xs text-gray-400">{SUP_PLACE[w]}</span>
                  </header>
                  <ul className="divide-y divide-gray-100 px-4 py-2 text-sm">
                    {items.length === 0 && (
                      <li className="py-1 text-gray-400">Nada para pedirle.</li>
                    )}
                    {items.map(({ l, p, why }) => {
                      const o = offer(l.id, w, l.q)!;
                      const sub = (o.price as number) * l.q;
                      const others = SUPS.filter((x) => x !== w && usable(offer(l.id, x, l.q)));
                      return (
                        <li
                          key={`${l.id}-${l.variant}`}
                          className="flex justify-between gap-3 py-2"
                        >
                          <span className="min-w-0">
                            {l.q} × {p.name}
                            {variantName(p, l)}
                            <small className="block text-xs text-gray-400">
                              {o.name} · {money(o.price as number)} c/u
                              {o.tier ? ` (precio x${o.tier}+)` : ''} · {why}
                              {others.map((x) => (
                                <React.Fragment key={x}>
                                  {' · '}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLines((ls) =>
                                        ls.map((y) => (y.id === l.id ? { ...y, to: x } : y))
                                      )
                                    }
                                    className="text-[#254642] underline-offset-2 hover:underline"
                                  >
                                    pasar a {supName(x)}
                                  </button>
                                </React.Fragment>
                              ))}
                            </small>
                          </span>
                          <span className="shrink-0 tabular-nums">{money(sub)}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <footer className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5">
                    <span className="font-semibold text-[#254642] tabular-nums">
                      {money(total)}
                    </span>
                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => copiar(w)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[#254642] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1b3532]"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copiar para WhatsApp
                      </button>
                    )}
                  </footer>
                </div>
              );
            })}
            {orders.none.length > 0 && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Sin proveedor disponible:{' '}
                {orders.none.map((x) => `${x.p.name} (${x.label.toLowerCase()})`).join(', ')}.
              </p>
            )}
          </section>
        </div>
      ) : (
        <section className="space-y-3">
          <p className="text-sm text-gray-500">
            Mirá las fotos y confirmá que sea el mismo producto en cada proveedor. Se guarda solo.
            {pendientes.length > 0 && ` Hay ${pendientes.length} sin revisar: aparecen primero.`}
          </p>
          <div className="space-y-3">
            {[...pendientes, ...products.filter((p) => uniones[p.id])].map((p) => (
              <div
                key={p.id}
                className={`grid grid-cols-2 gap-3 rounded-lg border p-3 sm:grid-cols-4 ${
                  uniones[p.id] ? 'border-gray-200' : 'border-amber-300 bg-amber-50/40'
                }`}
              >
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
                    Puros Mates
                  </span>
                  <Thumb src={pmImg(p)} size="lg" />
                  <p className="text-sm font-medium text-[#254642]">{p.name}</p>
                  {!uniones[p.id] && (
                    <span className="text-xs font-medium text-amber-700">Sin revisar</span>
                  )}
                </div>
                {SUPS.map((w) => {
                  const n = supNameOf(p.id, w);
                  const o = n ? lists[w].get(n) : undefined;
                  return (
                    <div key={w} className="space-y-1">
                      <span className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
                        {supName(w)}
                      </span>
                      {n ? (
                        <Thumb src={o?.imagen || null} size="lg" />
                      ) : (
                        <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-gray-50 text-xs text-gray-400">
                          No lo tiene
                        </div>
                      )}
                      <p className="text-xs text-gray-600">{n || '—'}</p>
                      {n && (
                        <p className="text-xs text-gray-400 tabular-nums">
                          {o
                            ? `${money(o.precio)}${o.agotado ? ' · agotado' : ''}`
                            : 'no aparece en la lista hoy'}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setPicking({ id: p.id, w })}
                        className="text-xs font-medium text-[#254642] underline-offset-2 hover:underline"
                      >
                        {n ? 'Cambiar' : 'Elegir'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}

      {picking && (
        <Picker
          product={byId(picking.id)}
          productImg={pmImg(byId(picking.id))}
          supName={supName(picking.w)}
          current={supNameOf(picking.id, picking.w)}
          options={precios.find((p) => p.id === picking.w)?.productos || []}
          initialQuery={guessWord(byId(picking.id)?.name || '', picking.w)}
          onClose={() => setPicking(null)}
          onChoose={(nombre) => {
            saveUnion(picking.id, picking.w, nombre);
            setPicking(null);
          }}
        />
      )}
    </div>
  );
}

// Palabra para arrancar filtrando la lista del proveedor (cada uno le dice distinto).
function guessWord(n: string, w: SupId) {
  const s = norm(n);
  for (const k of [
    'bombillon',
    'bombilla',
    'imperial',
    'torpedo',
    'camionero',
    'criollo',
    'yerbera',
    'canasta',
    'tapa',
  ]) {
    if (s.includes(k)) {
      if (k === 'criollo') return w === 'ph' ? 'rustico' : 'criollo';
      if (k === 'canasta') return w === 'ph' ? 'termera' : 'canasta';
      return k;
    }
  }
  return '';
}

function Thumb({ src, size }: { src: string | null | undefined; size: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'h-9 w-9' : size === 'md' ? 'h-14 w-14' : 'aspect-square w-full';
  return src ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={`${cls} shrink-0 rounded-lg bg-gray-50 object-cover`}
    />
  ) : (
    <div className={`${cls} shrink-0 rounded-lg bg-gray-100`} />
  );
}

function Verdict({ k, label }: { k: string; label: string }) {
  const tone =
    k === 'none'
      ? 'bg-red-50 text-red-700'
      : k === 'any'
        ? 'bg-gray-100 text-gray-600'
        : 'bg-emerald-50 text-emerald-800';
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{label}</span>;
}

function Picker({
  product,
  productImg,
  supName,
  current,
  options,
  initialQuery,
  onClose,
  onChoose,
}: {
  product: PmProduct | undefined;
  productImg: string | null | undefined;
  supName: string;
  current: string | null;
  options: Oferta[];
  initialQuery: string;
  onClose: () => void;
  onChoose: (nombre: string | null) => void;
}) {
  const [q, setQ] = useState(initialQuery);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const list = options.filter((o) => !q.trim() || norm(o.nombre).includes(norm(q.trim())));
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Elegir en ${supName}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-t-2xl bg-white sm:rounded-2xl"
      >
        <header className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
          <Thumb src={productImg} size="md" />
          <div className="min-w-0 flex-1">
            <b className="text-[#254642]">{product?.name}</b>
            <p className="text-xs text-gray-500">Tocá la foto del producto igual en {supName}</p>
          </div>
          <input
            type="search"
            value={q}
            autoFocus
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrar: imperial, rústico, bombilla…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-64"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="grid grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-4 lg:grid-cols-5">
          <button
            type="button"
            onClick={() => onChoose(null)}
            className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-[#254642]"
          >
            No lo tiene
          </button>
          {list.map((o) => (
            <button
              key={o.nombre}
              type="button"
              onClick={() => onChoose(o.nombre)}
              className={`space-y-1 rounded-lg border p-2 text-left transition hover:border-[#254642] ${
                o.nombre === current
                  ? 'border-[#254642] ring-2 ring-[#254642]/20'
                  : 'border-gray-200'
              }`}
            >
              <Thumb src={o.imagen} size="lg" />
              <span className="line-clamp-2 block text-xs text-gray-700">{o.nombre}</span>
              <b className="block text-xs text-gray-500 tabular-nums">
                {money(o.precio)}
                {o.agotado ? ' · agotado' : ''}
              </b>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
