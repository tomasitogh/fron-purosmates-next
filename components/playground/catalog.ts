/**
 * Catálogo del playground "Cebá tu mate".
 *
 * Las yerbas van en una repisa de 2 estantes; con más de 5 mates se arma una gradería
 * (fila de atrás más alta) y las bombillas van en fila en el porta-bombillas.
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

export type YerbaBrand =
  | 'donomar'
  | 'taragui'
  | 'lamerced'
  | 'playadito'
  | 'baldo'
  | 'cosmico'
  | 'cbse'
  | 'pipore'
  | 'rosamonte'
  | 'kalena'
  | 'solylluvia';
export type YerbaShape = { kind: 'yerba'; brand: YerbaBrand };
export type BombillaStyle = 'bombillon' | 'inoxCurva' | 'dosBochas' | 'chata' | 'bohr';
export type BombillaShape = { kind: 'bombilla'; style: BombillaStyle };
export type MateStyle =
  | 'mu'
  | 'criollo'
  | 'criolloPremium'
  | 'imperialAlgarrobo'
  | 'camionero'
  | 'torpedoCriollo'
  | 'camioneroClasico';
export type MateShape = { kind: 'mate'; style: MateStyle };
export type TermoStyle = 'pico' | 'lumilagro' | 'stanley';
export type TermoShape = { kind: 'termo'; style: TermoStyle };

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

  {
    id: 'yerba-cosmico',
    category: 'yerba',
    name: 'Cósmico',
    description: 'Selección especial con palo, suave y con 12 meses de estacionamiento.',
    shopHref: '/shop',
    shape: { kind: 'yerba', brand: 'cosmico' },
  },
  {
    id: 'yerba-cbse-hierbas',
    category: 'yerba',
    name: 'CBSé Hierbas Serranas',
    description: 'Con peperina, menta y poleo. Libre de acidez.',
    shopHref: '/shop',
    shape: { kind: 'yerba', brand: 'cbse' },
  },
  {
    id: 'yerba-pipore-hierbas',
    category: 'yerba',
    name: 'Piporé Hierbas Serranas',
    description: 'Compuesta con poleo, peperina, menta y cedrón.',
    shopHref: '/shop',
    shape: { kind: 'yerba', brand: 'pipore' },
  },
  {
    id: 'yerba-rosamonte',
    category: 'yerba',
    name: 'Rosamonte',
    description: 'Con palo, de sabor fuerte y bien misionero.',
    shopHref: '/shop',
    shape: { kind: 'yerba', brand: 'rosamonte' },
  },
  {
    id: 'yerba-kalena',
    category: 'yerba',
    name: 'Kalena',
    description: 'Despalada, envasada en origen con estacionamiento natural.',
    shopHref: '/shop',
    shape: { kind: 'yerba', brand: 'kalena' },
  },

  {
    id: 'yerba-sol-y-lluvia',
    category: 'yerba',
    name: 'Sol y Lluvia Barbacuá',
    description: 'Con palo, ahumada y con estacionamiento natural.',
    shopHref: '/shop',
    shape: { kind: 'yerba', brand: 'solylluvia' },
  },

  // ── Bombillas ─────────────────────────────────────────────────────────────
  {
    id: 'bombilla-bombillon-alpaca',
    category: 'bombilla',
    name: 'Bombillón de alpaca',
    description: 'Caño torneado en espiral, boquilla dorada y filtro de paleta.',
    shopHref: '/shop?category=bombilla',
    shape: { kind: 'bombilla', style: 'bombillon' },
  },
  {
    id: 'bombilla-acero-inoxidable',
    category: 'bombilla',
    name: 'Acero inoxidable',
    description: 'Curva para tomar cómodo, agarre moleteado y fácil de lavar.',
    shopHref: '/shop?category=bombilla',
    shape: { kind: 'bombilla', style: 'inoxCurva' },
  },
  {
    id: 'bombilla-dos-bochas',
    category: 'bombilla',
    name: 'Dos bochas',
    description: 'Clásica de alpaca con dos bochas y filtro redondo grande.',
    shopHref: '/shop?category=bombilla',
    shape: { kind: 'bombilla', style: 'dosBochas' },
  },

  {
    id: 'bombilla-chata',
    category: 'bombilla',
    name: 'Chata',
    description: 'Caño aplanado de acero con anillo dorado. Ideal para camioneros.',
    shopHref: '/shop?category=bombilla',
    shape: { kind: 'bombilla', style: 'chata' },
  },
  {
    id: 'bombilla-bohr',
    category: 'bombilla',
    name: 'Bohr',
    description: 'Acero inoxidable, curva suave y filtro redondo que no se tapa.',
    shopHref: '/shop?category=bombilla',
    shape: { kind: 'bombilla', style: 'bohr' },
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

  {
    id: 'mate-torpedo-criollo',
    category: 'mate',
    name: 'Torpedo Criollo',
    description: 'Calabaza torpedo, cuero crudo trenzado y virola de alpaca repujada.',
    shopHref: '/shop?category=mate',
    shape: { kind: 'mate', style: 'torpedoCriollo' },
  },
  {
    id: 'mate-camionero',
    category: 'mate',
    name: 'Camionero',
    description: 'El clásico de cuero con patitas y virola lisa bien ancha.',
    shopHref: '/shop?category=mate',
    shape: { kind: 'mate', style: 'camioneroClasico' },
  },

  // ── Termos ────────────────────────────────────────────────────────────────
  {
    id: 'termo-acero-pico',
    category: 'termo',
    name: 'Acero con pico cebador',
    description: 'Tapón cebador con gatillo y manija: el chorrito justo.',
    shopHref: '/shop?category=accesorios',
    shape: { kind: 'termo', style: 'pico' },
  },
  {
    id: 'termo-lumilagro',
    category: 'termo',
    name: 'Lumilagro acero',
    description: 'El clásico argentino, con vaso y base negros.',
    shopHref: '/shop?category=accesorios',
    shape: { kind: 'termo', style: 'lumilagro' },
  },
  {
    id: 'termo-stanley',
    category: 'termo',
    name: 'Stanley Classic',
    description: 'Verde martillado, irrompible y con agua caliente todo el día.',
    shopHref: '/shop?category=accesorios',
    shape: { kind: 'termo', style: 'stanley' },
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
