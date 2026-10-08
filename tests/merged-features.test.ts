import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LINE_STROKE_WIDTH,
  DESIGN_SIZE,
  ENGRAVE_COLOR,
  HEART_PATH,
  INNER_RADIUS,
  LEATHER_HEIGHT,
  LEATHER_WIDTH,
  LINE_STROKE_WIDTH,
  OUTER_RADIUS,
  SEAM_WIDTH,
  SHAPE_BASE_SIZE,
  TEXT_RADIUS,
  DEFAULT_FONT_FAMILY,
  AVAILABLE_FONTS,
  VIROLA_LINE_ARC_PATH,
  ringClipPathData,
  ringTextPathData,
  shapePoints,
} from '../components/customize/constants.ts';

// =========================================================================
// 1. GEOMETRÍA DEL CUSTOMIZER (constants.ts real, sin aliases)
// =========================================================================

// La geometría vive en constants.ts (sin imports), así que los tests importan
// el módulo REAL y no una copia.
describe('constants del customizer (virola + cuero)', () => {
  it('TEXT_RADIUS es el radio medio entre anillo exterior e interior', () => {
    assert.equal(TEXT_RADIUS, (OUTER_RADIUS + INNER_RADIUS) / 2);
    assert.equal(TEXT_RADIUS, 155);
    assert.ok(TEXT_RADIUS > INNER_RADIUS && TEXT_RADIUS < OUTER_RADIUS);
  });

  it('ringTextPathData arranca arriba en sentido horario (ídem en Konva y SVG)', () => {
    const d = ringTextPathData(TEXT_RADIUS);
    assert.ok(d.startsWith(`M 0 ${-TEXT_RADIUS}`), 'debe empezar en el tope (12 hs)');
    assert.ok(
      d.includes(`A ${TEXT_RADIUS} ${TEXT_RADIUS} 0 1 1`),
      'debe usar los flags de arco horario'
    );
    // Cierra el círculo: tras las dos arcadas vuelve al punto inicial
    assert.ok(d.endsWith(`0 ${-TEXT_RADIUS}`));
  });

  it('ringClipPathData combina círculo exterior horario e interior anti-horario (hueco del anillo)', () => {
    const d = ringClipPathData();
    const outer = ringTextPathData(OUTER_RADIUS);
    // El interior usa sweep=0 (anti-horario) para producir el hueco
    assert.ok(d.includes(`A ${INNER_RADIUS} ${INNER_RADIUS} 0 1 0`));
    assert.ok(d.startsWith(outer), 'el subpath exterior es la circunferencia del anillo');
    assert.match(d, new RegExp(`( =)?M 0 ${-INNER_RADIUS}`));
  });

  it('shapePoints genera triángulo, cuadrado y estrella centrados en (0, 0)', () => {
    const triangle = shapePoints('triangle');
    assert.equal(triangle.length, 6);
    assert.equal(triangle.toString(), [0, -20, 20, 20, -20, 20].toString());

    const square = shapePoints('square');
    assert.equal(square.length, 8);
    assert.equal(square.toString(), [-20, -20, 20, -20, 20, 20, -20, 20].toString());

    const star = shapePoints('star');
    assert.equal(star.length, 20, 'una estrella de 5 puntas tiene 10 vértices');
    // Punta superior en (0, -h)
    assert.ok(Math.abs(star[0]) < 1e-9 && Math.abs(star[1] + SHAPE_BASE_SIZE / 2) < 1e-9);
    // Punto mayor a escala: el radio crece con el size
    const bigStar = shapePoints('star', 80);
    assert.ok(Math.abs(bigStar[1]) > Math.abs(star[1]));
  });

  it('todas las geometrías caben dentro del espacio de diseño (≈400×400)', () => {
    for (const kind of ['triangle', 'square', 'star'] as const) {
      const pts = shapePoints(kind, SHAPE_BASE_SIZE * 4);
      for (let i = 0; i < pts.length; i += 2) {
        assert.ok(Math.abs(pts[i]) <= DESIGN_SIZE / 2, `${kind} x se desborda: ${pts[i]}`);
        assert.ok(Math.abs(pts[i + 1]) <= DESIGN_SIZE / 2, `${kind} y se desborda: ${pts[i + 1]}`);
      }
    }
  });

  it('la paleta de 10 fuentes es estable y DEFAULT_FONT_FAMILY es la primera', () => {
    assert.equal(AVAILABLE_FONTS.length, 10);
    assert.equal(DEFAULT_FONT_FAMILY, AVAILABLE_FONTS[0].family);
    const families = new Set(AVAILABLE_FONTS.map((f) => f.family));
    assert.equal(families.size, 10, 'no debe haber familias repetidas');
  });

  it('las constantes de cuero definen una banda apaisada con costura central', () => {
    assert.ok(LEATHER_WIDTH > LEATHER_HEIGHT, 'la base de cuero es apaisada');
    assert.ok(SEAM_WIDTH < LEATHER_WIDTH);
    // La costura central (dos líneas separadas por SEAM_WIDTH) queda dentro del alto
    assert.ok(SEAM_WIDTH / 2 < LEATHER_HEIGHT / 2);
  });

  it('VIROLA_LINE_ARC_PATH define un arco curvo concéntrico con la virola (R=155)', () => {
    assert.ok(VIROLA_LINE_ARC_PATH.startsWith('M'));
    assert.ok(VIROLA_LINE_ARC_PATH.includes(`A ${TEXT_RADIUS} ${TEXT_RADIUS} 0 0 0`));
    assert.equal(DEFAULT_LINE_STROKE_WIDTH, 2.5);
  });
});

// =========================================================================
// 2. GENERADOR SVG (lógica inline replicada de lib/customize/svg-generator.ts)
// =========================================================================
// svg-generator.ts importa vía alias '@/…', que node:test no resuelve. Se
// replican acá las funciones puras (escapeXml, elementoToSvg) que producen el
// SVG exportado, incluyendo el fix de centrado de texto y el branch de cuero.

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface ShapeEl {
  type: 'shape';
  shape: 'circle' | 'line' | 'triangle' | 'square' | 'star' | 'heart';
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

interface TextEl {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  angle?: number;
  rotation: number;
  x?: number;
  y?: number;
}

interface PathEl {
  type: 'path';
  d: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  sourceWidth: number;
  sourceHeight: number;
}

type Element = ShapeEl | TextEl | PathEl;

function shapeToSvg(el: ShapeEl): string {
  const transform = `translate(${el.x} ${el.y}) rotate(${el.rotation}) scale(${el.scale})`;
  if (el.shape === 'circle') {
    return `<circle cx="0" cy="0" r="20" transform="${transform}" fill="${ENGRAVE_COLOR}"/>`;
  }
  if (el.shape === 'line') {
    const strokeWidth = (el as any).strokeWidth ?? DEFAULT_LINE_STROKE_WIDTH;
    return (
      `<path d="${VIROLA_LINE_ARC_PATH}" transform="${transform}" ` +
      `fill="none" stroke="${ENGRAVE_COLOR}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`
    );
  }
  if (el.shape === 'heart') {
    return `<path d="${HEART_PATH}" transform="${transform}" fill="${ENGRAVE_COLOR}"/>`;
  }
  const points = shapePoints(el.shape as any);
  const pairs: string[] = [];
  for (let i = 0; i < points.length; i += 2) {
    pairs.push(`${points[i]},${points[i + 1]}`);
  }
  return `<polygon points="${pairs.join(' ')}" transform="${transform}" fill="${ENGRAVE_COLOR}"/>`;
}

function elementToSvg(el: Element, isLeather = false): string {
  switch (el.type) {
    case 'text':
      if (isLeather) {
        const x = el.x ?? 0;
        const y = el.y ?? 0;
        const rot = el.rotation ?? 0;
        const transform = rot !== 0 ? ` transform="rotate(${rot} ${x} ${y})"` : '';
        return (
          `<text x="${x}" y="${y}" font-family="'${escapeXml(el.fontFamily)}', sans-serif" ` +
          `font-size="${el.fontSize}" fill="${ENGRAVE_COLOR}" text-anchor="middle" dominant-baseline="central"${transform}>` +
          `${escapeXml(el.text)}</text>`
        );
      }
      return (
        `<g transform="rotate(${(el.angle ?? 0) + el.rotation})">` +
        `<text font-family="'${escapeXml(el.fontFamily)}', sans-serif" font-size="${el.fontSize}" fill="${ENGRAVE_COLOR}" dominant-baseline="central" text-anchor="middle">` +
        `<textPath href="#virola-text-circle" xlink:href="#virola-text-circle" startOffset="50%">${escapeXml(el.text)}</textPath>` +
        `</text></g>`
      );
    case 'shape':
      return shapeToSvg(el);
    case 'path':
      return (
        `<g transform="translate(${el.x} ${el.y}) rotate(${el.rotation}) scale(${el.scale})">` +
        `<path d="${el.d}" transform="translate(${-el.sourceWidth / 2} ${-el.sourceHeight / 2})" fill="${ENGRAVE_COLOR}" fill-rule="evenodd"/>` +
        `</g>`
      );
  }
}

describe('generador SVG del customizer', () => {
  it('escapa caracteres XML dentro del texto grabado', () => {
    assert.equal(escapeXml('A&B <Mate>'), 'A&amp;B &lt;Mate&gt;');
    assert.equal(escapeXml('dijo "hola"'), 'dijo &quot;hola&quot;');
  });

  it('texto virola: rota por angle+rotation y centra en startOffset=50% (fix del merge)', () => {
    const svg = elementToSvg({
      type: 'text',
      text: 'MATE & VIROLA',
      fontFamily: 'Montserrat',
      fontSize: 24,
      angle: 30,
      rotation: 10,
    });
    assert.ok(svg.includes(`rotate(${30 + 10})`), 'agrupa angle + rotation en un solo rotate');
    assert.ok(svg.includes('startOffset="50%"'), 'textPath centrado en el 50% (12 hs)');
    assert.ok(svg.includes('text-anchor="middle"'), 'texto centrado horizontalmente');
    assert.ok(
      svg.includes('dominant-baseline="central"'),
      'centrado vertical sobre el radio medio'
    );
    assert.ok(svg.includes('MATE &amp; VIROLA'), 'El texto va escapado');
    assert.ok(svg.includes(`'Montserrat', sans-serif`));
  });

  it('texto virola sin angle explícito (angle undefined) no produce NaN', () => {
    const svg = elementToSvg({
      type: 'text',
      text: 'Legacy',
      fontFamily: 'Bebas Neue',
      fontSize: 18,
      rotation: 0,
    });
    assert.ok(svg.includes('rotate(0)'), `rotate(0) en vez de NaN: ${svg}`);
  });

  it('texto cuero: posicionado plano (sin textPath) con el escape y la rotación por centro', () => {
    const svg = elementToSvg(
      {
        type: 'text',
        text: 'Jose <3',
        fontFamily: 'Caveat',
        fontSize: 30,
        x: 10,
        y: 20,
        rotation: 45,
      },
      true
    );
    assert.ok(svg.includes('x="10" y="20"'));
    assert.ok(svg.includes('rotate(45 10 20)'));
    assert.ok(svg.includes(`'Caveat', sans-serif`));
    assert.ok(svg.includes('Jose &lt;3'));
  });

  it('texto cuero sin rotación omite el atributo transform', () => {
    const svg = elementToSvg(
      { type: 'text', text: 'X', fontFamily: 'Oswald', fontSize: 12, rotation: 0 },
      true
    );
    assert.ok(!svg.includes('transform='));
  });

  it('formas: círculo, línea y polígono se serializan con el fill de grabado', () => {
    const circle = elementToSvg({
      type: 'shape',
      shape: 'circle',
      x: 5,
      y: -5,
      rotation: 0,
      scale: 1,
    });
    assert.ok(circle.startsWith('<circle cx="0" cy="0" r="20"'));
    assert.ok(circle.includes(`fill="${ENGRAVE_COLOR}"`));
    assert.ok(circle.includes('translate(5 -5)'));

    const line = elementToSvg({
      type: 'shape',
      shape: 'line',
      x: 0,
      y: 0,
      rotation: 90,
      scale: 2,
    });
    assert.ok(line.includes(VIROLA_LINE_ARC_PATH));
    assert.ok(line.includes(`stroke-width="${DEFAULT_LINE_STROKE_WIDTH}"`));
    assert.ok(line.includes(`rotate(90)`));

    const triangle = elementToSvg({
      type: 'shape',
      shape: 'triangle',
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1.5,
    });
    assert.ok(triangle.startsWith('<polygon points="'));
    assert.ok(triangle.includes('0,-20'));
    assert.ok(triangle.includes(`scale(1.5)`));

    const heart = elementToSvg({
      type: 'shape',
      shape: 'heart',
      x: 10,
      y: -10,
      rotation: 0,
      scale: 1,
    });
    assert.ok(heart.startsWith('<path d="'));
    assert.ok(heart.includes(HEART_PATH));
    assert.ok(heart.includes(`fill="${ENGRAVE_COLOR}"`));
    assert.ok(heart.includes('translate(10 -10)'));
  });

  it('paths vectorizados usan fill-rule="evenodd" (crítico: huecos internos del trazado)', () => {
    const svg = elementToSvg({
      type: 'path',
      d: 'M0 0 L10 0 L10 10 Z',
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      sourceWidth: 100,
      sourceHeight: 80,
    });
    assert.ok(svg.includes('fill-rule="evenodd"'), 'sin evenodd los huecos de letras se rellenan');
    assert.ok(
      svg.includes(`translate(${-100 / 2} ${-80 / 2})`),
      'ancla el path centrado en su origen'
    );
  });
});

// =========================================================================
// 3. FAVORITOS (lógica del reducer de redux/favoritesSlice.ts)
// =========================================================================

function applyFavoritesReducer(
  state: { ids: number[] },
  action: { type: 'clear' } | { type: 'toggle'; productId: number; isFavorite: boolean }
): { ids: number[] } {
  if (action.type === 'clear') return { ids: [] };
  const ids = [...state.ids];
  return {
    ids: action.isFavorite
      ? [...ids, action.productId]
      : ids.filter((id) => id !== action.productId),
  };
}

describe('favoritos (reducer favoritesSlice)', () => {
  it('toggle con isFavorite=true agrega el id', () => {
    let state = { ids: [1, 2] };
    state = applyFavoritesReducer(state, { type: 'toggle', productId: 3, isFavorite: true });
    assert.deepEqual(state.ids, [1, 2, 3]);
  });

  it('toggle con isFavorite=false quita el id existente', () => {
    const state = applyFavoritesReducer(
      { ids: [7, 9, 12] },
      { type: 'toggle', productId: 9, isFavorite: false }
    );
    assert.deepEqual(state.ids, [7, 12]);
  });

  it('toggle sobre un id no existente es un no-op', () => {
    const state = applyFavoritesReducer(
      { ids: [7] },
      { type: 'toggle', productId: 99, isFavorite: false }
    );
    assert.deepEqual(state.ids, [7]);
  });

  it('clearFavorites vacía la lista', () => {
    const state = applyFavoritesReducer({ ids: [1, 5, 8] }, { type: 'clear' });
    assert.deepEqual(state.ids, []);
  });
});

// =========================================================================
// 4. TAREAS / CALENDARIO (sortTasks + error legible de redux/taskSlice.ts)
// =========================================================================

interface AdminTask {
  id: number;
  title: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string | null;
}

function sortTasks(tasks: AdminTask[]): AdminTask[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.completed) return a.dueDate.localeCompare(b.dueDate);
    return (b.completedAt ?? '').localeCompare(a.completedAt ?? '');
  });
}

// Espejo de throwReadableError: backend devuelve { error, message }.
function extractReadableError(e: {
  response?: { data?: { message?: string; error?: string } };
}): string {
  const body = e.response?.data;
  const msg = body?.message || body?.error;
  return typeof msg === 'string' && msg.trim() ? msg : 'Error';
}

describe('tareas (redux/taskSlice.ts)', () => {
  it('todas las pendientes van primero, ordenadas por vencimiento ascendente', () => {
    const tasks: AdminTask[] = [
      { id: 1, title: 'Tarea vencida', dueDate: '2025-01-01', completed: false },
      { id: 2, title: 'Tarea lejana', dueDate: '2025-12-31', completed: false },
      {
        id: 3,
        title: 'Completada antigua',
        dueDate: '2025-01-01',
        completed: true,
        completedAt: '2025-06-01T10:00:00',
      },
    ];
    const sorted = sortTasks(tasks);
    assert.deepEqual(
      sorted.map((t) => t.id),
      [1, 2, 3]
    );
    assert.equal(sorted[0].title, 'Tarea vencida');
    assert.equal(sorted[1].title, 'Tarea lejana');
  });

  it('las completadas quedan al final, más recientemente completadas primero', () => {
    const tasks: AdminTask[] = [
      {
        id: 1,
        title: 'Verde vieja',
        dueDate: '2025-01-01',
        completed: true,
        completedAt: '2025-06-01',
      },
      {
        id: 2,
        title: 'Verde nueva',
        dueDate: '2025-01-01',
        completed: true,
        completedAt: '2025-08-15',
      },
      { id: 3, title: 'Pendiente', dueDate: '2025-03-03', completed: false },
    ];
    const sorted = sortTasks(tasks);
    assert.deepEqual(
      sorted.map((t) => t.id),
      [3, 2, 1]
    );
  });

  it('sortTasks no muta el array original', () => {
    const tasks: AdminTask[] = [
      { id: 2, title: 'B', dueDate: '2025-02-01', completed: false },
      { id: 1, title: 'A', dueDate: '2025-01-01', completed: false },
    ];
    const snapshot = tasks.map((t) => t.id);
    sortTasks(tasks);
    assert.deepEqual(
      tasks.map((t) => t.id),
      snapshot
    );
  });

  it('el error del backend se vuelve legible (message > error > genérico)', () => {
    assert.equal(
      extractReadableError({ response: { data: { message: 'La fecha es obligatoria' } } }),
      'La fecha es obligatoria'
    );
    assert.equal(
      extractReadableError({ response: { data: { error: 'Internal Server Error' } } }),
      'Internal Server Error'
    );
    assert.equal(extractReadableError({ response: { data: {} } }), 'Error');
  });
});

// =========================================================================
// 5. PEDIDO MANUAL EN ADMIN (total + validaciones de AdminOrders.tsx)
// =========================================================================

interface ManualItemRow {
  unitPrice: number;
  quantity: number;
  hasCustomization: boolean;
  customizationCost: number;
}

function computeManualTotal(items: ManualItemRow[]): number {
  return items.reduce(
    (acc, item) =>
      acc + (item.unitPrice + (item.hasCustomization ? item.customizationCost : 0)) * item.quantity,
    0
  );
}

interface ManualOrderForm {
  firstname: string;
  lastname: string;
  phone: string;
  shippingPreference: 'vendedor' | 'correo';
  locality: string;
  address: string;
}

function validateManualOrder(
  form: ManualOrderForm,
  itemCount: number
): { ok: boolean; error?: string } {
  if (!form.firstname.trim() || !form.lastname.trim()) {
    return { ok: false, error: 'Nombre y apellido del cliente son obligatorios' };
  }
  if (!form.phone.trim()) {
    return { ok: false, error: 'El teléfono del cliente es obligatorio' };
  }
  if (itemCount === 0) {
    return { ok: false, error: 'Debés agregar al menos un producto al pedido' };
  }
  if (form.shippingPreference === 'correo' && (!form.locality.trim() || !form.address.trim())) {
    return {
      ok: false,
      error: 'Para envío por Correo Argentino, la localidad y dirección son obligatorias',
    };
  }
  return { ok: true };
}

describe('pedido manual de admin (AdminOrders.tsx)', () => {
  it('el total suma precio unitario y costo de personalización por cada unidad', () => {
    const items: ManualItemRow[] = [
      { unitPrice: 1000, quantity: 2, hasCustomization: false, customizationCost: 0 },
      { unitPrice: 800, quantity: 1, hasCustomization: true, customizationCost: 150 },
    ];
    assert.equal(computeManualTotal(items), 1000 * 2 + (800 + 150) * 1);
  });

  it('un ítem personalizado con cost=0 no altera el precio', () => {
    assert.equal(
      computeManualTotal([
        { unitPrice: 500, quantity: 3, hasCustomization: true, customizationCost: 0 },
      ]),
      1500
    );
  });

  it('un pedido sin ítems arroja total 0', () => {
    assert.equal(computeManualTotal([]), 0);
  });

  it('validaciones: nombre/apellido, teléfono, ítems y dirección si es correo', () => {
    const base: ManualOrderForm = {
      firstname: 'Juan',
      lastname: 'Pérez',
      phone: '1122334455',
      shippingPreference: 'vendedor',
      locality: '',
      address: '',
    };
    assert.deepEqual(validateManualOrder(base, 1), { ok: true });

    assert.deepEqual(validateManualOrder({ ...base, firstname: '  ' }, 1), {
      ok: false,
      error: 'Nombre y apellido del cliente son obligatorios',
    });
    assert.deepEqual(validateManualOrder({ ...base, phone: '' }, 1), {
      ok: false,
      error: 'El teléfono del cliente es obligatorio',
    });
    assert.deepEqual(validateManualOrder(base, 0), {
      ok: false,
      error: 'Debés agregar al menos un producto al pedido',
    });
    const correo = { ...base, shippingPreference: 'correo' as const };
    assert.deepEqual(validateManualOrder(correo, 2), {
      ok: false,
      error: 'Para envío por Correo Argentino, la localidad y dirección son obligatorias',
    });
    assert.deepEqual(validateManualOrder({ ...correo, locality: 'CABA', address: 'Av. 1' }, 2), {
      ok: true,
    });
  });
});
