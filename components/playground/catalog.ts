/**
 * Catálogo del playground "Cebá tu mate".
 *
 * Cada categoría puede tener hasta 5 opciones (la mesa las acomoda en dos filas).
 * Cada opción describe cómo se dibuja en 3D (forma + colores) y a qué parte
 * de la tienda lleva cuando el usuario termina de jugar. Las formas se generan
 * por código en `engine.ts` (no hay modelos 3D externos que descargar).
 */

export type Category = 'yerba' | 'bombilla' | 'mate' | 'termo';

export const CATEGORY_ORDER: Category[] = ['yerba', 'bombilla', 'mate', 'termo'];

export const CATEGORY_LABEL: Record<Category, string> = {
  yerba: 'Yerba',
  bombilla: 'Bombilla',
  mate: 'Mate',
  termo: 'Termo',
};

export const CATEGORY_PLURAL: Record<Category, string> = {
  yerba: 'Yerbas',
  bombilla: 'Bombillas',
  mate: 'Mates',
  termo: 'Termos',
};

export type YerbaBrand = 'donomar' | 'taragui' | 'lamerced' | 'playadito' | 'baldo';
export type YerbaShape = { kind: 'yerba'; brand: YerbaBrand };
export type BombillaShape = {
  kind: 'bombilla';
  style: 'pico' | 'recta' | 'resorte';
  metal: string;
};
export type MateStyle = 'mu' | 'criollo' | 'criolloPremium' | 'imperialAlgarrobo' | 'camionero';
export type MateShape = { kind: 'mate'; style: MateStyle };
export type TermoShape = { kind: 'termo'; body: string; cap: string; height: number };

export type Option = {
  id: string;
  category: Category;
  name: string;
  description: string;
  shopHref: string;
  shape: YerbaShape | BombillaShape | MateShape | TermoShape;
};

export const OPTIONS: Option[] = [
  // ── Yerbas ────────────────────────────────────────────────────────────────
  {
    id: 'yerba-donomar',
    category: 'yerba',
    name: 'Don Omar',
    description: 'Estacionamiento natural y bajo contenido de polvo.',
    shopHref: '/shop',
    shape: { kind: 'yerba', brand: 'donomar' },
  },
  {
    id: 'yerba-taragui',
    category: 'yerba',
    name: 'Taragüi sin palo',
    description: 'Despalada, de sabor intenso y rendidor.',
    shopHref: '/shop',
    shape: { kind: 'yerba', brand: 'taragui' },
  },
  {
    id: 'yerba-lamerced-barbacua',
    category: 'yerba',
    name: 'La Merced Barbacuá',
    description: 'Ahumada y robusta, de cosecha limitada.',
    shopHref: '/shop',
    shape: { kind: 'yerba', brand: 'lamerced' },
  },
  {
    id: 'yerba-playadito',
    category: 'yerba',
    name: 'Playadito',
    description: 'Con palo y suave: la preferida para empezar la ronda.',
    shopHref: '/shop',
    shape: { kind: 'yerba', brand: 'playadito' },
  },
  {
    id: 'yerba-baldo',
    category: 'yerba',
    name: 'Baldo',
    description: 'Molienda fina estilo brasilero, verde y fresca.',
    shopHref: '/shop',
    shape: { kind: 'yerba', brand: 'baldo' },
  },

  // ── Bombillas ─────────────────────────────────────────────────────────────
  {
    id: 'bombilla-pico',
    category: 'bombilla',
    name: 'Pico de loro de alpaca',
    description: 'Curva para tomar cómodo y filtro de paleta que no se tapa.',
    shopHref: '/shop?category=bombilla',
    shape: { kind: 'bombilla', style: 'pico', metal: '#d9d4c7' },
  },
  {
    id: 'bombilla-recta',
    category: 'bombilla',
    name: 'Recta de acero inoxidable',
    description: 'Simple, resistente y fácil de limpiar.',
    shopHref: '/shop?category=bombilla',
    shape: { kind: 'bombilla', style: 'recta', metal: '#c4c9cf' },
  },
  {
    id: 'bombilla-resorte',
    category: 'bombilla',
    name: 'Con filtro de resorte',
    description: 'El resorte retiene hasta la yerba con más polvo.',
    shopHref: '/shop?category=bombilla',
    shape: { kind: 'bombilla', style: 'resorte', metal: '#e0c27a' },
  },

  // ── Mates ─────────────────────────────────────────────────────────────────
  {
    id: 'mate-mu',
    category: 'mate',
    name: 'Mate Mu',
    description: 'Madera torneada y pintada a mano con manchas de vaca.',
    shopHref: '/shop?category=mate',
    shape: { kind: 'mate', style: 'mu' },
  },
  {
    id: 'mate-criollo',
    category: 'mate',
    name: 'Criollo',
    description: 'Calabaza con base de cuero grabada. Se puede personalizar.',
    shopHref: '/shop?category=mate',
    shape: { kind: 'mate', style: 'criollo' },
  },
  {
    id: 'mate-criollo-premium',
    category: 'mate',
    name: 'Criollo Premium',
    description: 'Calabaza, cuero cosido en X con tiento crudo y virola de alpaca.',
    shopHref: '/shop?category=mate',
    shape: { kind: 'mate', style: 'criolloPremium' },
  },
  {
    id: 'mate-imperial-algarrobo',
    category: 'mate',
    name: 'Imperial de algarrobo',
    description: 'Madera de algarrobo con virola de alpaca y guarda pampa.',
    shopHref: '/shop?category=mate',
    shape: { kind: 'mate', style: 'imperialAlgarrobo' },
  },
  {
    id: 'mate-camionero-virola-volcada',
    category: 'mate',
    name: 'Camionero virola volcada',
    description: 'Cuero negro y virola de alpaca cincelada, bien ancha.',
    shopHref: '/shop?category=mate',
    shape: { kind: 'mate', style: 'camionero' },
  },

  // ── Termos ────────────────────────────────────────────────────────────────
  {
    id: 'termo-verde',
    category: 'termo',
    name: 'Acero verde 1 L',
    description: 'El clásico de la ruta: 24 horas de agua caliente.',
    shopHref: '/shop?category=accesorios',
    shape: { kind: 'termo', body: '#2f6b4f', cap: '#1d3f30', height: 0.36 },
  },
  {
    id: 'termo-negro',
    category: 'termo',
    name: 'Negro mate con pico cebador',
    description: 'El pico cebador te deja tirar el chorrito justo.',
    shopHref: '/shop?category=accesorios',
    shape: { kind: 'termo', body: '#26272b', cap: '#111214', height: 0.34 },
  },
  {
    id: 'termo-crema',
    category: 'termo',
    name: 'Crema compacto 750 ml',
    description: 'Liviano y fácil de llevar en la mochila.',
    shopHref: '/shop?category=accesorios',
    shape: { kind: 'termo', body: '#e9dfc8', cap: '#7a5c3a', height: 0.3 },
  },
];

export function getOption(id: string | undefined): Option | undefined {
  return OPTIONS.find((o) => o.id === id);
}

export function optionsFor(category: Category): Option[] {
  return OPTIONS.filter((o) => o.category === category);
}

/** Pasos de la preparación, en el orden en que se juegan. */
export type Step =
  'grab' | 'yerba' | 'tilt' | 'water1' | 'wait' | 'water2' | 'bombilla' | 'cebar' | 'drink';

export const STEPS: { id: Step; title: string; hint: string }[] = [
  { id: 'grab', title: 'Agarrá el mate', hint: 'Tocá el mate para traerlo frente a vos.' },
  {
    id: 'yerba',
    title: 'Poné la yerba',
    hint: 'Mantené apretado para volcar. Llenalo entre 2/3 y 3/4.',
  },
  {
    id: 'tilt',
    title: 'Inclinalo',
    hint: 'Mantené apretado y soltá cuando la yerba forme una pendiente (30°–50°).',
  },
  {
    id: 'water1',
    title: 'Tirá un chorrito de agua tibia',
    hint: 'Apenas un poco, en el hueco, para humedecer la yerba.',
  },
  { id: 'wait', title: 'Esperá 5 segundos', hint: 'Dejá que la yerba absorba el agua.' },
  {
    id: 'water2',
    title: 'Tirá agua de nuevo',
    hint: 'Otro chorrito en el mismo hueco, sin mojar la montañita.',
  },
  {
    id: 'bombilla',
    title: 'Poné la bombilla',
    hint: 'Tapá la punta con el pulgar y clavala en el hueco. ¡Después no se mueve!',
  },
  {
    id: 'cebar',
    title: 'Cebá con agua caliente',
    hint: 'Agua a 70–80 °C sobre la pared, hasta cerca de la boca, sin rebalsar.',
  },
  { id: 'drink', title: '¡Listo! Tomalo', hint: 'Tocá el mate para tomarlo hasta el ruidito.' },
];

/** Zona objetivo de cada paso "de volcar" (valor del medidor 0–1). */
export const POUR_TARGET: Partial<Record<Step, [number, number]>> = {
  yerba: [0.62, 0.78],
  water1: [0.18, 0.4],
  water2: [0.18, 0.4],
  cebar: [0.75, 0.95],
};
