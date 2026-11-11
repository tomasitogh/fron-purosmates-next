/**
 * Motor 3D del playground "Cebá tu mate" (Three.js, sin React).
 *
 * Responsabilidades:
 *  - Construir la escena: cuarto de día, ventana con paisaje, mesa y los objetos.
 *  - Manejar la cámara en primera persona (arrastrar / giroscopio para mirar).
 *  - Detectar clicks sobre objetos (raycasting) para elegir el equipo.
 *  - Correr la máquina de estados de la preparación (yerba → inclinar → agua …).
 *
 * La UI (botones, textos, medidores) vive en React (`MateGame.tsx`) y se
 * entera de lo que pasa acá a través de `onChange(snapshot)`.
 */
import * as THREE from 'three';
import { buildMedialunasBoard, buildPortrait, buildTortitasPlate } from './decor';
import { buildDogBed, Dog } from './dog';
import {
  mateWaterTexture,
  softDotTexture,
  Steam,
  YERBA_TINT_DRY,
  YERBA_TINT_WET,
  yerbaMoundGeometry,
  yerbaTexture,
} from './fx';
import { playChew, playDing, playSlurp, setPour, type Snack } from './sound';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import {
  buildBombillaModel,
  buildMateModel,
  buildShelf,
  buildTermoModel,
  buildYerbaPack,
  SHELF,
  shelfTierY,
  canvasTexture,
  rng,
  std,
  woodTexture,
} from './models';
import {
  CATEGORY_ORDER,
  OPTIONS,
  POUR_TARGET,
  STEPS,
  type BombillaShape,
  type Category,
  type MateShape,
  type Option,
  type Step,
  type TermoShape,
} from './catalog';

// ─── Tipos públicos ──────────────────────────────────────────────────────────

export type Phase = 'choose' | 'prepare' | 'again' | 'done';

export type Snapshot = {
  phase: Phase;
  focus: Category | null;
  selection: Partial<Record<Category, string>>;
  hovered: string | null;
  step: Step;
  meter: number;
  holding: boolean;
  waitLeft: number;
  tiltDeg: number;
  toast: { id: number; text: string; tone: 'info' | 'good' | 'warn' } | null;
  scores: Partial<Record<Step, number>>;
  finalScore: number | null;
  /** Desglose del puntaje final (solo en la fase `done`). */
  breakdown: ScoreItem[] | null;
  /** Mates tomados en esta ronda (se puede seguir cebando sin rearmar). */
  rounds: number;
  /** Color elegido por artículo (id de opción → id de color). */
  colors: Record<string, string>;
};

/** Rubros del puntaje final y cuánto pesa cada uno (suman 100). */
export const SCORE_WEIGHTS = { yerba: 20, tilt: 20, wet: 20, wait: 10, cebar: 30 } as const;
export type ScoreItem = { id: keyof typeof SCORE_WEIGHTS; score: number };

export type EngineEvent =
  | { name: 'select'; category: Category; optionId: string }
  | { name: 'color'; optionId: string; colorId: string }
  | { name: 'eat'; kind: Snack }
  | { name: 'round'; rounds: number }
  | { name: 'prepare_start' }
  | { name: 'step'; step: Step }
  | { name: 'complete'; score: number };

export type EngineCallbacks = {
  onChange: (s: Snapshot) => void;
  onEvent?: (e: EngineEvent) => void;
};

// ─── Constantes de la escena (unidades: metros) ─────────────────────────────

const TABLE_Y = 0.75;
const EYE = new THREE.Vector3(0, 1.28, 0.78);
const MAT_Y = TABLE_Y + 0.006;

/** Ángulo (respecto a mirar de frente) y distancia de cada zona sobre la mesa. */
type Zone = {
  angle: number;
  spacing: number;
  anchorH: number;
  /** Distancia desde los ojos (por defecto ZONE_RADIUS). */
  radius?: number;
  /** Altura a la que mira la cámara al enfocar la zona. */
  focusH?: number;
  /** Campo visual (grados) al enfocar la zona. */
  focusFov?: number;
  /** Si está, los objetos van en una repisa de dos estantes con esta altura libre. */
  shelfGap?: number;
};
const ZONES: Record<Category, Zone> = {
  // Yerbas y mates van en repisas de dos estantes, un poco más al fondo
  yerba: {
    angle: THREE.MathUtils.degToRad(35),
    spacing: 0.127,
    anchorH: 0.64,
    radius: 1.55,
    focusH: 0.16,
    focusFov: 46,
    shelfGap: 0.26,
  },
  bombilla: { angle: THREE.MathUtils.degToRad(13), spacing: 0.062, anchorH: 0.31 },
  mate: {
    angle: THREE.MathUtils.degToRad(-10),
    spacing: 0.15,
    anchorH: 0.5,
    radius: 1.42,
    focusH: 0.1,
    focusFov: 42,
    shelfGap: 0.19,
  },
  termo: { angle: THREE.MathUtils.degToRad(-38), spacing: 0.15, anchorH: 0.44 },
};
const ZONE_RADIUS = 1.1;
const OVERVIEW_PITCH = -0.32;
/** Tangente del medio ángulo horizontal que ocupa toda la mesa (~50° a cada lado). */
const OVERVIEW_HALF_TAN = Math.tan(THREE.MathUtils.degToRad(50));

const PREP = {
  mate: new THREE.Vector3(0, MAT_Y, 0.3),
  yerba: new THREE.Vector3(-0.34, MAT_Y, 0.24),
  termo: new THREE.Vector3(0.4, MAT_Y, 0.2),
  bombilla: new THREE.Vector3(-0.13, MAT_Y + 0.006, 0.45),
};

const PREP_LOOK = new THREE.Vector3(0, TABLE_Y + 0.04, 0.26);

/** Inclinación de la yerba (rad) a partir de la cual la montañita está formada del todo. */
const FULL_MOUND_SLOPE = 0.3;

// ─── Helpers ────────────────────────────────────────────────────────────────

const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));
const clamp = THREE.MathUtils.clamp;
/** Pasa del sistema de ejes del sensor al de la cámara (mirar por la parte de atrás). */
const DEVICE_TO_CAMERA = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

function yawPitchTo(p: THREE.Vector3) {
  const d = p.clone().sub(EYE);
  return {
    yaw: Math.atan2(-d.x, -d.z),
    pitch: Math.atan2(d.y, Math.hypot(d.x, d.z)),
  };
}

function quatZ(rad: number, yaw = 0) {
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, rad, 'YXZ'));
}

function skyTexture() {
  const W = 2048;
  const H = 1024;
  const r = rng(42);
  return canvasTexture(W, H, (ctx) => {
    const horizon = H * 0.56;
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#5aa9e6');
    sky.addColorStop(0.6, '#a5d4f3');
    sky.addColorStop(1, '#e4f3fb');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizon);

    // Sol con halo (coincide con la luz direccional que entra por la derecha)
    const sx = W * 0.66;
    const sy = H * 0.2;
    const glow = ctx.createRadialGradient(sx, sy, 10, sx, sy, 380);
    glow.addColorStop(0, 'rgba(255,250,225,1)');
    glow.addColorStop(0.12, 'rgba(255,244,200,0.9)');
    glow.addColorStop(1, 'rgba(255,244,200,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, horizon);

    // Nubes
    for (let n = 0; n < 14; n++) {
      const cx = r() * W;
      const cy = H * (0.14 + r() * 0.26);
      const s = 30 + r() * 50;
      ctx.fillStyle = `rgba(255,255,255,${0.55 + r() * 0.35})`;
      for (let k = 0; k < 7; k++) {
        ctx.beginPath();
        ctx.ellipse(
          cx + (k - 3) * s * 0.7,
          cy + Math.sin(k * 1.7) * s * 0.25,
          s * (0.7 + r() * 0.5),
          s * (0.45 + r() * 0.3),
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // Lomas lejanas
    ctx.fillStyle = '#9cc3a6';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    for (let x = 0; x <= W; x += 32)
      ctx.lineTo(x, horizon - 40 - Math.sin(x * 0.004) * 28 - Math.sin(x * 0.011) * 12);
    ctx.lineTo(W, horizon);
    ctx.fill();

    // Pasto
    const grass = ctx.createLinearGradient(0, horizon, 0, H);
    grass.addColorStop(0, '#86b95b');
    grass.addColorStop(1, '#4f8a39');
    ctx.fillStyle = grass;
    ctx.fillRect(0, horizon, W, H - horizon);

    // Casitas
    const houseColors = ['#f2e1c6', '#e8c7a8', '#f6f0e4', '#d9e4ec', '#f0d7d1'];
    for (let i = 0; i < 16; i++) {
      const w = 60 + r() * 70;
      const h = 40 + r() * 35;
      const x = r() * W;
      const y = horizon - h + 8 + r() * 18;
      ctx.fillStyle = houseColors[i % houseColors.length];
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = r() > 0.5 ? '#b4553c' : '#7d4a35';
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x + w / 2, y - h * 0.55);
      ctx.lineTo(x + w + 6, y);
      ctx.fill();
      ctx.fillStyle = '#6f8ea3';
      ctx.fillRect(x + w * 0.18, y + h * 0.3, w * 0.2, h * 0.28);
      ctx.fillRect(x + w * 0.6, y + h * 0.3, w * 0.2, h * 0.28);
    }

    // Árboles
    for (let i = 0; i < 70; i++) {
      const x = r() * W;
      const y = horizon + r() * 60;
      const s = 18 + r() * 34;
      ctx.fillStyle = '#5b4030';
      ctx.fillRect(x - 3, y - 4, 6, 24);
      ctx.fillStyle = ['#3f7d3a', '#4f8f43', '#2f6a33', '#679f4d'][i % 4];
      ctx.beginPath();
      ctx.arc(x, y - s * 0.6, s, 0, Math.PI * 2);
      ctx.arc(x - s * 0.6, y - s * 0.2, s * 0.7, 0, Math.PI * 2);
      ctx.arc(x + s * 0.6, y - s * 0.25, s * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// ─── Partículas (yerba que cae, gotas) ──────────────────────────────────────

class Particles {
  readonly points: THREE.Points;
  private pos: Float32Array;
  private vel: Float32Array;
  private life: Float32Array;
  private killY: Float32Array;
  private cursor = 0;

  constructor(
    private max: number,
    color: string,
    size: number,
    /** `true`: gotas/polvo translúcidos de borde suave. `false`: granitos opacos. */
    soft = false
  ) {
    this.pos = new Float32Array(max * 3).fill(-100);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.killY = new Float32Array(max);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size,
      sizeAttenuation: true,
      map: softDotTexture(),
      ...(soft ? { transparent: true, opacity: 0.85, depthWrite: false } : { alphaTest: 0.5 }),
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
  }

  spawn(p: THREE.Vector3, v: THREE.Vector3, killY: number) {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % this.max;
    this.pos.set([p.x, p.y, p.z], i * 3);
    this.vel.set([v.x, v.y, v.z], i * 3);
    this.life[i] = 3;
    this.killY[i] = killY;
  }

  update(dt: number) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      this.vel[i * 3 + 1] -= 9.8 * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      if (this.pos[i * 3 + 1] < this.killY[i] || this.life[i] <= 0) {
        this.life[i] = 0;
        this.pos[i * 3 + 1] = -100;
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  clear() {
    this.life.fill(0);
    for (let i = 0; i < this.max; i++) this.pos[i * 3 + 1] = -100;
  }
}

// ─── Objetos de la mesa ─────────────────────────────────────────────────────

type MateParts = {
  profile: THREE.Vector2[];
  top: number;
  yerbaPivot: THREE.Group;
  yerbaMat: THREE.MeshStandardMaterial;
  yerbaMesh: THREE.Mesh;
  water: THREE.Mesh;
};

/** Medialuna o tortita que se puede comer. */
type Edible = { obj: THREE.Object3D; kind: Snack; bites: number; target: number };

type Item = {
  opt: Option;
  group: THREE.Group;
  homePos: THREE.Vector3;
  homeQuat: THREE.Quaternion;
  tPos: THREE.Vector3;
  tQuat: THREE.Quaternion;
  tScale: number;
  managed: boolean;
  ring: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
  mate?: MateParts;
  /** Cambia el color del modelo (solo artículos con `colors` en el catálogo). */
  setColor?: (id: string) => void;
  /** Punto local por donde sale la yerba (paquete) o el agua (termo). */
  mouth?: THREE.Vector3;
};

function shadowed<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return o;
}

/** ¿El objeto se está dibujando? (él y todos sus padres visibles). */
function shown(o: THREE.Object3D | null) {
  for (; o; o = o.parent) if (!o.visible) return false;
  return true;
}

/** Collider invisible y grande para que los objetos finos sean fáciles de tocar. */
function hitbox(radius: number, height: number) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 10).translate(0, height / 2, 0),
    // `visible: false` evita dibujarlo (un draw call menos por objeto); el
    // Raycaster no mira la visibilidad del material, así que sigue siendo tocable.
    new THREE.MeshBasicMaterial({ visible: false })
  );
  m.userData.hitbox = true;
  return m;
}

function buildBombilla(shape: BombillaShape) {
  const { group } = buildBombillaModel(shape.style);
  group.add(hitbox(0.028, 0.26));
  return { group };
}

function radiusAt(profile: THREE.Vector2[], y: number) {
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1];
    const b = profile[i];
    if (y <= b.y) {
      const t = clamp((y - a.y) / Math.max(b.y - a.y, 1e-5), 0, 1);
      return THREE.MathUtils.lerp(a.x, b.x, t);
    }
  }
  return profile[profile.length - 1].x;
}

function buildMate(shape: MateShape) {
  const { group: g, profile, top, setColor } = buildMateModel(shape.style);

  // Superficie de la yerba: sube con el llenado, se inclina y forma la montañita
  const yerbaTex = yerbaTexture('playadito');
  const yerbaMat = std('#ffffff', {
    map: yerbaTex,
    bumpMap: yerbaTex,
    bumpScale: 1.6,
    roughness: 1,
  });
  const yerbaPivot = new THREE.Group();
  const yerbaMesh = new THREE.Mesh(yerbaMoundGeometry(), yerbaMat);
  yerbaMesh.receiveShadow = true;
  yerbaPivot.add(yerbaMesh);
  yerbaPivot.visible = false;
  g.add(yerbaPivot);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2),
    // Poco reflejo del ambiente: si no, el sol lo lava y parece un disco claro
    std('#ffffff', {
      map: mateWaterTexture(),
      roughness: 0.3,
      envMapIntensity: 0.35,
      transparent: true,
      depthWrite: false,
    })
  );
  water.visible = false;
  g.add(water);

  g.add(hitbox(0.075, 0.2));
  return {
    group: g,
    setColor,
    mate: { profile, top, yerbaPivot, yerbaMat, yerbaMesh, water } satisfies MateParts,
  };
}

function buildTermo(shape: TermoShape) {
  const { group, height, mouth } = buildTermoModel(shape.style);
  group.add(hitbox(0.07, height + 0.02));
  return { group, mouth };
}

// ─── Motor ──────────────────────────────────────────────────────────────────

export class MateEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;
  private raycaster = new THREE.Raycaster();
  private items: Item[] = [];
  private hotspots: Partial<Record<Category, HTMLElement>> = {};
  private yerbaFx = new Particles(500, '#8c9a3a', 0.0075);
  private dropFx = new Particles(300, '#dff1ff', 0.0065, true);
  private crumbFx = new Particles(240, '#d8b07a', 0.0055);
  private steam = new Steam();
  private dog: Dog | null = null;
  /** Medialunas y tortitas que se pueden comer. */
  private edibles: Edible[] = [];
  private restockTimers: number[] = [];
  private eating: {
    ed: Edible;
    phase: 'lift' | 'chew' | 'back';
    t: number;
    parent: THREE.Object3D;
    homePos: THREE.Vector3;
    homeQuat: THREE.Quaternion;
  } | null = null;
  private stream: THREE.Mesh;
  private dust: THREE.Points;
  private resizeObs: ResizeObserver;
  private envTarget: THREE.WebGLRenderTarget | null = null;

  // Cámara
  private yaw = 0;
  private pitch = OVERVIEW_PITCH;
  private yawT = 0;
  private pitchT = OVERVIEW_PITCH;
  private fovT = 55;
  /** Hacia dónde apuntaba el celular al activar el giroscopio (el "centro"). */
  private gyroRef: { yaw: number; pitch: number } | null = null;
  /** Desvío pedido por el giroscopio y su versión suavizada (la que se dibuja). */
  private gyroT = { yaw: 0, pitch: 0 };
  private gyroOffset = { yaw: 0, pitch: 0 };

  // Puntero
  private pointer: { id: number; x: number; y: number; t: number; dragged: boolean } | null = null;

  // Estado de juego
  private s: Snapshot = {
    phase: 'choose',
    focus: null,
    selection: {},
    hovered: null,
    step: 'grab',
    meter: 0,
    holding: false,
    waitLeft: 5,
    tiltDeg: 0,
    toast: null,
    scores: {},
    finalScore: null,
    breakdown: null,
    rounds: 0,
    colors: {},
  };
  private toastSeq = 0;
  /** Puntaje de cada cebada (si toma varios mates se promedian). */
  private cebarScores: number[] = [];
  /** Veces que quiso tirar agua durante la espera. */
  private impatient = 0;
  private slurped = false;
  /** Medición de fluidez para bajar la resolución en equipos lentos. */
  private perf = { t: 0, n: 0, ratio: 1 };
  private advanceTimer = 0;
  private yerbaFill = 0;
  private slope = 0;
  private wet = 0;
  private wetT = 0;
  private waterShown = 0;
  private bombillaAnim: 'none' | 'lift' | 'insert' | 'done' = 'none';
  private drinkT = 0;
  private stepTimer = 0;
  private lastEmit = 0;
  private dirty = true;

  constructor(
    private host: HTMLElement,
    private cb: EngineCallbacks
  ) {
    const mobile = window.matchMedia('(pointer: coarse)').matches;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.perf.ratio = Math.min(window.devicePixelRatio, mobile ? 1.75 : 2);
    this.renderer.setPixelRatio(this.perf.ratio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.style.display = 'block';
    host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.02, 80);
    this.camera.position.copy(EYE);

    this.buildRoom(mobile);
    this.buildItems();

    this.stream = new THREE.Mesh(
      // El chorro se afina al caer, como el agua de verdad
      new THREE.CylinderGeometry(0.003, 0.0021, 1, 12).translate(0, -0.5, 0),
      std('#e8f4ff', { transparent: true, opacity: 0.5, roughness: 0.03 })
    );
    this.stream.visible = false;
    this.scene.add(
      this.stream,
      this.yerbaFx.points,
      this.dropFx.points,
      this.crumbFx.points,
      this.steam.group
    );

    this.dust = this.buildDust();
    this.scene.add(this.dust);

    // Filtrado anisótropo al máximo razonable: la mesa, el piso y las etiquetas
    // se ven nítidos aunque se miren de costado.
    const aniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material;
      for (const mat of Array.isArray(m) ? m : m ? [m] : []) {
        const map = (mat as THREE.MeshStandardMaterial).map;
        if (map) map.anisotropy = aniso;
      }
    });

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(host);
    this.resize();

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('pointercancel', this.onPointerUp);
    el.addEventListener('wheel', this.onWheel, { passive: true });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);

    this.loop();
    this.emit(true);
  }

  // ── Construcción de la escena ────────────────────────────────────────────

  private buildRoom(mobile: boolean) {
    const sc = this.scene;
    sc.background = new THREE.Color('#cfe6f5');

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.envTarget = pmrem.fromScene(room, 0.04);
    sc.environment = this.envTarget.texture;
    sc.environmentIntensity = 0.45;
    room.dispose();
    pmrem.dispose();

    sc.add(new THREE.HemisphereLight('#e3f1ff', '#c9a37c', 1.25));
    const sun = new THREE.DirectionalLight('#fff0d4', 3.2);
    sun.position.set(2.6, 5.2, -7.5);
    sun.target.position.set(0, TABLE_Y, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    sun.shadow.camera.left = -2.2;
    sun.shadow.camera.right = 2.2;
    sun.shadow.camera.top = 2.2;
    sun.shadow.camera.bottom = -2.2;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 16;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sc.add(sun, sun.target);
    const windowFill = new THREE.DirectionalLight('#d6ebff', 0.7);
    windowFill.position.set(-1, 2, -3);
    sc.add(windowFill);

    // Paisaje de afuera (sin luz: siempre brillante, como el día)
    const outside = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 30),
      new THREE.MeshBasicMaterial({ map: skyTexture(), toneMapped: false })
    );
    outside.position.set(0, 3, -14);
    sc.add(outside);

    // Paredes con hueco de ventana
    const wallMat = std('#f3ead9', { roughness: 0.95 });
    const WZ = -1.0;
    const winL = -1.6;
    const winR = 1.6;
    const winB = 0.95;
    const winT = 2.6;
    const wallH = 3.1;
    const thick = 0.14;
    const addWall = (x0: number, x1: number, y0: number, y1: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, thick), wallMat);
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, WZ);
      m.castShadow = true;
      m.receiveShadow = true;
      sc.add(m);
    };
    addWall(-3, winL, 0, wallH);
    addWall(winR, 3, 0, wallH);
    addWall(winL, winR, 0, winB);
    addWall(winL, winR, winT, wallH);

    // Marco y parteluces de la ventana
    const frameMat = std('#fbfaf6', { roughness: 0.5 });
    const bar = (w: number, h: number, x: number, y: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), frameMat);
      m.position.set(x, y, WZ + 0.03);
      m.castShadow = true;
      sc.add(m);
    };
    bar(winR - winL + 0.08, 0.06, 0, winT);
    bar(winR - winL + 0.08, 0.06, 0, winB);
    bar(0.06, winT - winB, winL, (winB + winT) / 2);
    bar(0.06, winT - winB, winR, (winB + winT) / 2);
    bar(0.04, winT - winB, -0.53, (winB + winT) / 2);
    bar(0.04, winT - winB, 0.53, (winB + winT) / 2);
    bar(winR - winL, 0.035, 0, 2.05);
    // Alféizar
    const sill = new THREE.Mesh(new THREE.BoxGeometry(winR - winL + 0.2, 0.04, 0.26), frameMat);
    sill.position.set(0, winB - 0.01, WZ + 0.08);
    sill.receiveShadow = true;
    sill.castShadow = true;
    sc.add(sill);

    // Cortinas livianas
    const curtainMat = std('#fff8ec', {
      roughness: 1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    for (const sx of [-1, 1]) {
      const geo = new THREE.PlaneGeometry(0.55, 2.3, 24, 1);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 40) * 0.025);
      geo.computeVertexNormals();
      const c = new THREE.Mesh(geo, curtainMat);
      c.position.set(sx * 1.85, 1.75, WZ + 0.12);
      c.castShadow = true;
      sc.add(c);
    }

    // Plantas en el alféizar
    const potMat = std('#c0643c', { roughness: 0.9 });
    const leafMat = std('#3f8a3c', { roughness: 0.7 });
    for (const px of [-1.15, 1.2]) {
      const plant = new THREE.Group();
      plant.add(
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.06, 0.14, 20).translate(0, 0.07, 0),
          potMat
        )
      );
      const r = rng(px > 0 ? 3 : 9);
      for (let i = 0; i < 9; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.05 + r() * 0.03, 12, 8), leafMat);
        leaf.position.set((r() - 0.5) * 0.14, 0.18 + r() * 0.14, (r() - 0.5) * 0.1);
        leaf.scale.set(1, 0.7, 1);
        plant.add(leaf);
      }
      plant.position.set(px, winB + 0.01, WZ + 0.08);
      sc.add(shadowed(plant));
    }

    // Laterales, piso y techo
    const side = (x: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, wallH), wallMat);
      m.position.set(x, wallH / 2, 1.1);
      m.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
      m.receiveShadow = true;
      sc.add(m);
    };
    side(-3);
    side(3);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(6, wallH), wallMat);
    back.position.set(0, wallH / 2, 3.2);
    back.rotation.y = Math.PI;
    sc.add(back);
    const floorTex = woodTexture('#b98b5e', '#6d4b2e', 6, 3);
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(3, 3);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 4.2),
      std('#ffffff', { map: floorTex, bumpMap: floorTex, bumpScale: 0.6, roughness: 0.62 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 1.1);
    floor.receiveShadow = true;
    sc.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.2), std('#fbf8f2'));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, wallH, 1.1);
    sc.add(ceil);

    // Cuadro en la pared izquierda
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.6, 0.8),
      std('#ffffff', {
        map: canvasTexture(512, 384, (ctx) => {
          ctx.fillStyle = '#254642';
          ctx.fillRect(0, 0, 512, 384);
          ctx.fillStyle = '#D4AF37';
          ctx.font = 'bold 64px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText('Puros', 256, 170);
          ctx.fillText('Mates', 256, 245);
          ctx.fillStyle = '#F5F5DC';
          ctx.font = '24px system-ui, sans-serif';
          ctx.fillText('mates artesanales argentinos', 256, 300);
        }),
      })
    );
    frame.position.set(-2.97, 1.75, 0.3);
    sc.add(frame);

    // Cuadro de los dueños en la pared derecha (la foto se descarga solo en esta página)
    const portrait = shadowed(buildPortrait('/playground/duenos.webp'));
    portrait.position.set(2.93, 1.62, 0.25);
    portrait.rotation.y = -Math.PI / 2;
    sc.add(portrait);

    // Mesa
    const tableTex = woodTexture('#b07a4c', '#5a3820', 1, 5);
    tableTex.wrapS = THREE.RepeatWrapping;
    tableTex.repeat.set(2, 1);
    const tableMat = std('#ffffff', {
      map: tableTex,
      bumpMap: tableTex,
      bumpScale: 0.5,
      roughness: 0.5,
    });
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 1.3), tableMat);
    top.position.set(0, TABLE_Y - 0.025, -0.05);
    sc.add(top);
    for (const [x, z] of [
      [-1.2, -0.6],
      [1.2, -0.6],
      [-1.2, 0.5],
      [1.2, 0.5],
    ]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, TABLE_Y - 0.05, 0.07), tableMat);
      leg.position.set(x, (TABLE_Y - 0.05) / 2, z);
      sc.add(leg);
    }
    shadowed(top);

    // La perrita y su almohadón (a la derecha, cerca del cuadro)
    const bed = buildDogBed();
    const bedPos = new THREE.Vector3(2.35, 0, 1.25);
    bed.group.position.copy(bedPos);
    bed.group.rotation.y = -0.5;
    sc.add(shadowed(bed.group));
    this.dog = new Dog(
      { minX: -2.6, maxX: 2.6, minZ: -0.75, maxZ: 2.8 },
      { pos: bedPos, top: bed.top, yaw: -0.5 },
      // No pasar por abajo de la mesa ni por donde está sentada la persona
      (q) => (Math.abs(q.x) < 1.42 && q.z < 0.72) || (Math.abs(q.x) < 0.5 && q.z < 1.35)
    );
    this.dog.group.traverse((o) => (o.castShadow = true));
    sc.add(this.dog.group);

    // Para acompañar los mates: tortitas negras y medialunas
    const tortitas = shadowed(buildTortitasPlate());
    tortitas.position.set(-0.82, TABLE_Y, 0.28);
    sc.add(tortitas);
    const medialunas = shadowed(buildMedialunasBoard());
    medialunas.position.set(0.86, TABLE_Y, 0.3);
    medialunas.rotation.y = 0.4;
    sc.add(medialunas);
    for (const root of [tortitas, medialunas]) {
      root.traverse((o) => {
        if (o.userData.edible) {
          this.edibles.push({ obj: o, kind: o.userData.edible as Snack, bites: 0, target: 1 });
        }
      });
    }

    // Individual / tapete donde se arma el mate
    const mat = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.006, 0.3),
      std('#254642', { roughness: 0.95 })
    );
    mat.position.set(0, TABLE_Y + 0.003, 0.34);
    mat.receiveShadow = true;
    sc.add(mat);

    // Porta-bombillas
    const zb = this.zoneCenter('bombilla');
    const holder = new THREE.Mesh(
      new THREE.BoxGeometry(
        OPTIONS.filter((o) => o.category === 'bombilla').length * ZONES.bombilla.spacing + 0.06,
        0.035,
        0.06
      ),
      std('#7a4f2c', { roughness: 0.6 })
    );
    holder.position.set(zb.x, TABLE_Y + 0.0175, zb.z);
    holder.rotation.y = ZONES.bombilla.angle;
    sc.add(shadowed(holder));
  }

  private buildDust() {
    const n = 160;
    const pos = new Float32Array(n * 3);
    const r = rng(99);
    for (let i = 0; i < n; i++) {
      pos.set([(r() - 0.5) * 2.6, 0.8 + r() * 1.6, -0.9 + r() * 1.4], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: '#fff6dc',
        size: 0.011,
        map: softDotTexture(),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      })
    );
  }

  private zoneCenter(cat: Category) {
    const a = ZONES[cat].angle;
    const R = ZONES[cat].radius ?? ZONE_RADIUS;
    return new THREE.Vector3(EYE.x - Math.sin(a) * R, TABLE_Y, EYE.z - Math.cos(a) * R);
  }

  private buildItems() {
    // Repisas de madera (yerbas y mates)
    for (const cat of CATEGORY_ORDER) {
      const zone = ZONES[cat];
      if (!zone.shelfGap) continue;
      const count = OPTIONS.filter((o) => o.category === cat).length;
      const shelf = shadowed(
        buildShelf(Math.ceil(count / SHELF.tiers) * zone.spacing + 0.04, zone.shelfGap)
      );
      shelf.position.copy(this.zoneCenter(cat));
      shelf.rotation.y = zone.angle;
      this.scene.add(shelf);
    }

    for (const cat of CATEGORY_ORDER) {
      const zone = ZONES[cat];
      const center = this.zoneCenter(cat);
      const right = new THREE.Vector3(Math.cos(zone.angle), 0, -Math.sin(zone.angle));
      const fwd = new THREE.Vector3(-Math.sin(zone.angle), 0, -Math.cos(zone.angle));
      const opts = OPTIONS.filter((o) => o.category === cat);
      opts.forEach((opt, i) => {
        let built: {
          group: THREE.Group;
          mouth?: THREE.Vector3;
          mate?: MateParts;
          setColor?: (id: string) => void;
        };
        const sh = opt.shape;
        if (sh.kind === 'yerba') {
          const pack = buildYerbaPack(sh.brand);
          pack.group.add(hitbox(0.055, 0.22));
          built = pack;
        } else if (sh.kind === 'bombilla') built = buildBombilla(sh);
        else if (sh.kind === 'mate') built = buildMate(sh);
        else built = buildTermo(sh);

        const pos = center.clone();
        if (zone.shelfGap) {
          // Repisa: mitad arriba y mitad abajo, todos mirando al frente
          const perTier = Math.ceil(opts.length / SHELF.tiers);
          const tier = Math.floor(i / perTier);
          const inTier = Math.min(perTier, opts.length - tier * perTier);
          const col = (i % perTier) - (inTier - 1) / 2;
          pos.addScaledVector(right, col * zone.spacing);
          pos.y = TABLE_Y + shelfTierY(tier, zone.shelfGap);
        } else if (cat === 'bombilla') {
          pos.addScaledVector(right, (i - (opts.length - 1) / 2) * zone.spacing);
        } else if (opts.length <= 3) {
          pos
            .addScaledVector(right, (i - 1) * zone.spacing)
            .addScaledVector(fwd, i === 1 ? 0.05 : 0);
        } else {
          // 5 opciones: 3 atrás y 2 adelante, intercaladas para que se vean todas
          const back = i < 3;
          const col = back ? i - 1 : i - 3.5;
          pos.addScaledVector(right, col * zone.spacing).addScaledVector(fwd, back ? 0.1 : -0.08);
        }
        const faceYaw = zone.shelfGap ? zone.angle : Math.atan2(EYE.x - pos.x, EYE.z - pos.z);
        let quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, faceYaw, 0));
        if (cat === 'bombilla') {
          pos.y = TABLE_Y + 0.006;
          quat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, faceYaw, (i - (opts.length - 1) / 2) * -0.08, 'YXZ')
          );
        }
        const group = shadowed(built.group);
        group.traverse((c) => {
          if ((c as THREE.Mesh).userData?.hitbox) {
            c.castShadow = false;
            c.receiveShadow = false;
          }
        });
        group.position.copy(pos);
        group.quaternion.copy(quat);
        group.userData.optionId = opt.id;
        this.scene.add(group);

        const ringMat = new THREE.MeshBasicMaterial({
          color: '#D4AF37',
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        const ringR = cat === 'bombilla' ? 0.035 : cat === 'termo' ? 0.068 : 0.07;
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(ringR, ringR + 0.012, 48).rotateX(-Math.PI / 2),
          ringMat
        );
        ring.position.set(pos.x, pos.y + 0.002, pos.z);
        this.scene.add(ring);

        this.items.push({
          opt,
          group,
          homePos: pos.clone(),
          homeQuat: quat.clone(),
          tPos: pos.clone(),
          tQuat: quat.clone(),
          tScale: 1,
          managed: true,
          ring,
          ringMat,
          mate: built.mate,
          mouth: built.mouth,
          setColor: built.setColor,
        });
      });
    }
  }

  // ── API pública (la llama React) ─────────────────────────────────────────

  setHotspot(cat: Category, el: HTMLElement | null) {
    if (el) this.hotspots[cat] = el;
    else delete this.hotspots[cat];
  }

  focus(cat: Category | null) {
    if (this.s.phase !== 'choose') return;
    this.s.focus = cat;
    if (cat) {
      // Apuntar un poco por debajo para que los objetos queden arriba del panel de opciones
      const target = this.zoneCenter(cat).add(
        new THREE.Vector3(0, (ZONES[cat].focusH ?? 0) + (this.camera.aspect < 1 ? -0.1 : 0), 0)
      );
      const { yaw, pitch } = yawPitchTo(target);
      this.yawT = yaw;
      this.pitchT = pitch;
    } else {
      this.yawT = 0;
      this.pitchT = OVERVIEW_PITCH;
    }
    this.dirty = true;
  }

  setColor(optionId: string, colorId: string) {
    const item = this.items.find((i) => i.opt.id === optionId);
    if (!item?.setColor || !item.opt.colors?.some((c) => c.id === colorId)) return;
    item.setColor(colorId);
    this.s.colors = { ...this.s.colors, [optionId]: colorId };
    if (this.s.selection[item.opt.category] === optionId) {
      this.scheduleAdvance(item.opt.category, 2600);
    }
    this.cb.onEvent?.({ name: 'color', optionId, colorId });
    this.dirty = true;
  }

  select(optionId: string) {
    const item = this.items.find((i) => i.opt.id === optionId);
    if (!item || this.s.phase !== 'choose') return;
    const cat = item.opt.category;
    this.s.selection = { ...this.s.selection, [cat]: optionId };
    this.toast(`Elegiste: ${item.opt.name}`, 'good');
    this.cb.onEvent?.({ name: 'select', category: cat, optionId });
    this.scheduleAdvance(cat, item.opt.colors ? 2600 : 900);
    this.dirty = true;
  }

  /**
   * Después de elegir, pasa a la próxima categoría. Si el artículo tiene colores
   * espera más (y cada cambio de color reinicia la espera) para poder probarlos.
   */
  private scheduleAdvance(cat: Category, delay: number) {
    window.clearTimeout(this.advanceTimer);
    this.advanceTimer = window.setTimeout(() => {
      if (this.disposed || this.s.phase !== 'choose' || this.s.focus !== cat) return;
      const next = CATEGORY_ORDER.find((c) => !this.s.selection[c]);
      this.focus(next ?? null);
    }, delay);
  }

  get isComplete() {
    return CATEGORY_ORDER.every((c) => this.s.selection[c]);
  }

  startPrepare() {
    if (!this.isComplete) return;
    this.s.phase = 'prepare';
    this.s.focus = null;
    this.resetPrep();
    const sel = this.selected();
    const faceQuat = (p: THREE.Vector3) =>
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, Math.atan2(EYE.x - p.x, EYE.z - p.z), 0)
      );
    // La yerba dentro del mate se ve como la marca elegida (con/sin palo, barbacuá…)
    if (sel.yerba.opt.shape.kind === 'yerba') {
      const tex = yerbaTexture(sel.yerba.opt.shape.brand);
      sel.mate.mate!.yerbaMat.map = tex;
      sel.mate.mate!.yerbaMat.bumpMap = tex;
    }
    sel.yerba.tPos.copy(PREP.yerba);
    sel.yerba.tQuat.copy(faceQuat(PREP.yerba));
    sel.termo.tPos.copy(PREP.termo);
    sel.termo.tQuat.copy(faceQuat(PREP.termo));
    sel.bombilla.tPos.copy(PREP.bombilla);
    sel.bombilla.tQuat.copy(quatZ(-Math.PI / 2));
    for (const it of this.items) it.ringMat.opacity = 0;
    // Mirar un poco por debajo del mate para que quede arriba del panel de pasos
    const { yaw, pitch } = yawPitchTo(PREP_LOOK);
    this.yawT = yaw;
    this.pitchT = pitch;
    this.cb.onEvent?.({ name: 'prepare_start' });
    this.setStep('grab');
  }

  /** Acción de "tocar" para los pasos que no son de mantener apretado. */
  action() {
    if (this.s.phase !== 'prepare') return;
    const sel = this.selected();
    if (this.s.step === 'grab') {
      sel.mate.tPos.copy(PREP.mate);
      sel.mate.tQuat.copy(quatZ(0, 0.25));
      this.setStep('yerba');
    } else if (this.s.step === 'bombilla' && this.bombillaAnim === 'none') {
      this.bombillaAnim = 'lift';
      const p = this.holePoint(0.18);
      sel.bombilla.tPos.copy(p);
      sel.bombilla.tQuat.copy(quatZ(-0.18, 0.25));
    } else if (this.s.step === 'drink' && this.drinkT === 0) {
      this.drinkT = 0.0001;
      this.slurped = false;
      sel.mate.tPos.set(0.0, 1.12, 0.5);
      sel.mate.tQuat.setFromEuler(new THREE.Euler(0.35, -0.5, 0.1, 'YXZ'));
      const { yaw, pitch } = yawPitchTo(new THREE.Vector3(0, 1.12, 0.5));
      this.yawT = yaw;
      this.pitchT = pitch;
      this.toast('Slurp… ¡hasta el ruidito!', 'good');
    }
  }

  setHolding(on: boolean) {
    if (this.s.holding === on) return;
    if (this.s.phase !== 'prepare') return;
    const st = this.s.step;
    if (on && st === 'wait') {
      this.impatient++;
      this.toast('¡Paciencia! Dejá que la yerba absorba el agua.', 'warn');
      return;
    }
    if (on && !['yerba', 'tilt', 'water1', 'water2', 'cebar'].includes(st)) return;
    this.s.holding = on;
    if (!on) this.release();
    this.dirty = true;
  }

  /** Volver a cebar con el mismo equipo. */
  replay() {
    this.s.phase = 'choose';
    this.s.selection = { ...this.s.selection };
    this.startPrepare();
  }

  /** Volver a elegir todo desde cero. */
  reset() {
    this.resetPrep();
    for (const it of this.items) {
      it.tPos.copy(it.homePos);
      it.tQuat.copy(it.homeQuat);
    }
    this.s.phase = 'choose';
    this.s.selection = {};
    this.s.focus = null;
    this.yawT = 0;
    this.pitchT = OVERVIEW_PITCH;
    this.dirty = true;
  }

  async setGyro(enabled: boolean): Promise<boolean> {
    if (!enabled) {
      window.removeEventListener('deviceorientation', this.onOrientation);
      this.gyroRef = null;
      this.gyroT = { yaw: 0, pitch: 0 };
      return false;
    }
    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DOE?.requestPermission === 'function') {
      try {
        if ((await DOE.requestPermission()) !== 'granted') return false;
      } catch {
        return false;
      }
    }
    // La posición actual del celular pasa a ser "mirar al frente"
    this.gyroRef = null;
    window.addEventListener('deviceorientation', this.onOrientation);
    return true;
  }

  dispose() {
    this.disposed = true;
    setPour('water', false);
    setPour('yerba', false);
    window.clearTimeout(this.advanceTimer);
    for (const t of this.restockTimers) window.clearTimeout(t);
    cancelAnimationFrame(this.raf);
    this.resizeObs.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.onPointerDown);
    el.removeEventListener('pointermove', this.onPointerMove);
    el.removeEventListener('pointerup', this.onPointerUp);
    el.removeEventListener('pointercancel', this.onPointerUp);
    el.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('deviceorientation', this.onOrientation);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      for (const mat of mats) {
        for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
        mat.dispose();
      }
      // Las luces con sombra tienen su propio render target (el shadow map)
      (o as THREE.DirectionalLight).shadow?.dispose();
    });
    this.envTarget?.dispose();
    this.renderer.dispose();
    // `dispose()` no suelta el contexto WebGL: sin esto, entrar y salir varias
    // veces de la página acumula contextos hasta que el navegador los descarta.
    this.renderer.forceContextLoss();
    el.remove();
  }

  // ── Lógica de pasos ──────────────────────────────────────────────────────

  private selected() {
    const get = (c: Category) => this.items.find((i) => i.opt.id === this.s.selection[c])!;
    return {
      yerba: get('yerba'),
      bombilla: get('bombilla'),
      mate: get('mate'),
      termo: get('termo'),
    };
  }

  private resetPrep() {
    const sel = this.isComplete ? this.selected() : null;
    if (sel) {
      // Devolver la bombilla a la escena si estaba "adentro" del mate
      if (sel.bombilla.group.parent !== this.scene) this.scene.attach(sel.bombilla.group);
      sel.bombilla.managed = true;
      sel.mate.tPos.copy(sel.mate.homePos);
      sel.mate.tQuat.copy(sel.mate.homeQuat);
    }
    for (const it of this.items) {
      if (it.mate) {
        it.mate.yerbaPivot.visible = false;
        it.mate.water.visible = false;
        it.mate.yerbaMat.color.copy(YERBA_TINT_DRY);
        it.mate.yerbaMat.roughness = 1;
        it.mate.yerbaMesh.morphTargetInfluences![0] = 0;
      }
    }
    this.yerbaFill = 0;
    this.slope = 0;
    this.wet = 0;
    this.wetT = 0;
    this.waterShown = 0;
    this.bombillaAnim = 'none';
    this.drinkT = 0;
    this.s.scores = {};
    this.s.finalScore = null;
    this.s.breakdown = null;
    this.s.rounds = 0;
    this.cebarScores = [];
    this.impatient = 0;
    setPour('water', false);
    setPour('yerba', false);
    this.s.meter = 0;
    this.s.tiltDeg = 0;
    this.s.holding = false;
    this.yerbaFx.clear();
    this.dropFx.clear();
    this.stream.visible = false;
    this.steam.clear();
  }

  private setStep(step: Step) {
    this.s.step = step;
    this.s.meter = 0;
    this.s.holding = false;
    this.stepTimer = 0;
    if (step === 'wait') this.s.waitLeft = 5;
    if (step === 'tilt') this.s.tiltDeg = 0;
    if (step === 'drink') this.s.meter = 1;
    this.cb.onEvent?.({ name: 'step', step });
    this.dirty = true;
  }

  private advanceSoon(next: Step | 'done', delay = 700) {
    const cur = this.s.step;
    window.setTimeout(() => {
      if (this.disposed || this.s.phase !== 'prepare' || this.s.step !== cur) return;
      if (next === 'done') this.finish();
      else this.setStep(next);
    }, delay);
  }

  private nextOf(step: Step): Step | 'done' {
    const i = STEPS.findIndex((s) => s.id === step);
    return STEPS[i + 1]?.id ?? 'done';
  }

  private bandScore(v: number, [lo, hi]: [number, number]) {
    // Dentro de la zona ideal: 80 en los bordes y 100 solo cerca del centro
    // (el 20 % central). Afuera cae rápido. Así un 100 hay que ganárselo.
    if (v >= lo && v <= hi) {
      const off = Math.abs(v - (lo + hi) / 2) / ((hi - lo) / 2);
      return Math.round(80 + 20 * clamp(1.25 * (1 - off), 0, 1));
    }
    const d = v < lo ? lo - v : v - hi;
    return Math.max(15, Math.round(80 - d * 300));
  }

  private release() {
    const st = this.s.step;
    const m = this.s.meter;
    const target = POUR_TARGET[st];
    if (st === 'tilt') {
      const deg = this.s.tiltDeg;
      if (deg < 18) {
        this.toast('Inclinalo un poco más para formar la montañita.', 'warn');
        this.s.tiltDeg = 0;
        return;
      }
      this.slope = -THREE.MathUtils.degToRad(Math.min(deg, 55)) * 0.45;
      const tiltPts = this.bandScore(deg / 100, [0.3, 0.5]);
      this.s.scores.tilt = tiltPts;
      playDing(deg <= 65);
      this.toast(
        (deg > 65
          ? '¡Uy, se volcó un poco de yerba! Igual seguimos.'
          : tiltPts >= 95
            ? '¡Pendiente perfecta!'
            : 'Bien, quedó la pendiente.') + ` · ${tiltPts} pts`,
        deg > 65 ? 'warn' : 'good'
      );
      this.advanceSoon('water1');
      return;
    }
    if (!target) return;
    const [lo, hi] = target;
    const minOk = st === 'cebar' ? 0.6 : lo * 0.8;
    if (m < minOk) {
      this.toast(
        st === 'yerba' ? 'Te falta yerba: llenalo un poco más.' : 'Un poquito más de agua.',
        'info'
      );
      return;
    }
    let pts = this.bandScore(m, target);
    if (st === 'cebar') {
      // Si toma varios mates, vale el promedio de todas las cebadas
      this.cebarScores.push(pts);
      pts = Math.round(this.cebarScores.reduce((a, b) => a + b, 0) / this.cebarScores.length);
    }
    this.s.scores[st] = pts;
    const over = m > hi;
    playDing(!over);
    const msgs: Partial<Record<Step, [string, string]>> = {
      yerba: ['¡Justo! Bien cargado.', 'Medio cargado de más, pero sirve.'],
      water1: ['Bien, la yerba se está humedeciendo.', 'Mucha agua: ojo que se lava.'],
      water2: ['Listo, yerba bien humedecida.', 'Un poco de más, pero vamos.'],
      cebar: ['¡Mate cebado como la gente!', 'Se rebalsó un poco… ¡a secar la mesa!'],
    };
    const [good, bad] = msgs[st]!;
    this.toast(
      (over ? bad : m < lo ? 'Quedó cortito, pero sigamos.' : good) +
        ` · ${st === 'cebar' ? this.cebarScores[this.cebarScores.length - 1] : pts} pts`,
      over ? 'warn' : 'good'
    );
    if (st === 'water1') this.wetT = 0.45;
    if (st === 'water2') this.wetT = 0.8;
    this.advanceSoon(this.nextOf(st));
  }

  /** Terminó un mate: el mate vuelve a la mesa y se pregunta si quiere otro. */
  private askAnother() {
    this.s.rounds++;
    this.s.phase = 'again';
    const sel = this.selected();
    sel.mate.tPos.copy(PREP.mate);
    sel.mate.tQuat.copy(quatZ(0, 0.25));
    const { yaw, pitch } = yawPitchTo(PREP_LOOK);
    this.yawT = yaw;
    this.pitchT = pitch;
    this.cb.onEvent?.({ name: 'round', rounds: this.s.rounds });
    // Después de muchos mates la yerba se lava
    if (this.s.rounds === 8)
      this.toast('La yerba se está lavando… ¡quizás es hora de cambiarla!', 'warn');
    this.dirty = true;
  }

  /** Cebar otro con la misma yerba y la bombilla puesta (no se rearma nada). */
  anotherMate() {
    if (this.s.phase !== 'again') return;
    this.s.phase = 'prepare';
    this.setStep('cebar');
  }

  /** "Ya está, no quiero más": recién ahí se termina y se ve el resumen. */
  stopDrinking() {
    if (this.s.phase !== 'again') return;
    this.finish();
  }

  private finish() {
    const sc = this.s.scores;
    const pts = (v: number | undefined, missing = 0) => (v === undefined ? missing : v);
    const wet = [sc.water1, sc.water2].filter((v): v is number => v !== undefined);
    const breakdown: ScoreItem[] = [
      { id: 'yerba', score: pts(sc.yerba) },
      { id: 'tilt', score: pts(sc.tilt) },
      {
        id: 'wet',
        score: wet.length ? Math.round(wet.reduce((a, b) => a + b, 0) / wet.length) : 0,
      },
      // Sin apuros durante la espera vale 100
      { id: 'wait', score: pts(sc.wait, 100) },
      { id: 'cebar', score: pts(sc.cebar) },
    ];
    const final = Math.round(
      breakdown.reduce((sum, b) => sum + b.score * SCORE_WEIGHTS[b.id], 0) / 100
    );
    this.s.breakdown = breakdown;
    this.s.finalScore = final;
    this.s.phase = 'done';
    const sel = this.selected();
    sel.mate.tPos.copy(PREP.mate);
    sel.mate.tQuat.copy(quatZ(0, 0.25));
    const { yaw, pitch } = yawPitchTo(PREP_LOOK);
    this.yawT = yaw;
    this.pitchT = pitch;
    this.cb.onEvent?.({ name: 'complete', score: final });
    this.dirty = true;
  }

  /** Punto (mundo) del "hueco" de la yerba, del lado derecho del mate. */
  private holePoint(extraY = 0) {
    const mate = this.selected().mate;
    const mp = mate.mate!;
    const y = this.yerbaY(mp);
    const r = radiusAt(mp.profile, y) * 0.9;
    return mate.group.localToWorld(new THREE.Vector3(r * 0.38, mp.top + extraY, 0));
  }

  /**
   * Dónde cae el chorro. Sin bombilla es el hueco; con la bombilla ya puesta se
   * ceba al lado (hacia la persona), para que ni el pico ni el chorro la atraviesen.
   */
  private pourPoint(extraY = 0) {
    if (this.bombillaAnim !== 'done') return this.holePoint(extraY);
    const mate = this.selected().mate;
    const mp = mate.mate!;
    const r = radiusAt(mp.profile, this.yerbaY(mp)) * 0.9;
    return mate.group.localToWorld(new THREE.Vector3(r * 0.3, mp.top + extraY, r * 0.4));
  }

  private yerbaY(mp: MateParts) {
    return mp.profile[0].y + this.yerbaFill * (mp.top - mp.profile[0].y) * 0.92;
  }

  private toast(text: string, tone: 'info' | 'good' | 'warn' = 'info') {
    this.s.toast = { id: ++this.toastSeq, text, tone };
    this.dirty = true;
  }

  // ── Frame loop ───────────────────────────────────────────────────────────

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const raw = this.clock.getDelta();
    const dt = Math.min(raw, 0.05);
    this.adaptQuality(raw);
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.updateHotspots();
    const now = performance.now();
    if (this.dirty && now - this.lastEmit > 50) this.emit();
  };

  /**
   * Si el equipo no llega a ~40 cuadros por segundo, baja la resolución de a
   * pasos (nunca por debajo de 1x). Prioriza que el juego responda fluido.
   */
  private adaptQuality(raw: number) {
    if (this.clock.elapsedTime < 3 || this.perf.ratio <= 1) return;
    this.perf.t += Math.min(raw, 0.1);
    if (++this.perf.n < 90) return;
    const avg = this.perf.t / this.perf.n;
    this.perf.t = 0;
    this.perf.n = 0;
    if (avg > 1 / 40) {
      this.perf.ratio = Math.max(1, this.perf.ratio - 0.25);
      this.renderer.setPixelRatio(this.perf.ratio);
      this.resize();
    }
  }

  /**
   * Dibuja un cuadro y devuelve el lienzo, para armar la imagen de compartir.
   * Hay que copiarlo en el mismo tick (el navegador lo borra al componer).
   */
  capture() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement;
  }

  private emit(force = false) {
    if (!force && !this.dirty) return;
    this.dirty = false;
    this.lastEmit = performance.now();
    this.cb.onChange({
      ...this.s,
      selection: { ...this.s.selection },
      scores: { ...this.s.scores },
      colors: { ...this.s.colors },
      breakdown: this.s.breakdown && this.s.breakdown.map((b) => ({ ...b })),
    });
  }

  private update(dt: number) {
    // Cámara
    const portrait = this.camera.aspect < 1;
    const focusFov = this.s.focus ? (ZONES[this.s.focus].focusFov ?? 38) : 0;
    // Vista general: el FOV vertical se abre lo necesario para que entren las
    // yerbas (izquierda) y los termos (derecha) aunque la ventana sea angosta.
    const overview = clamp(
      THREE.MathUtils.radToDeg(2 * Math.atan(OVERVIEW_HALF_TAN / this.camera.aspect)),
      70,
      82
    );
    // Al preparar, en pantallas anchas se acerca un poco más para lucir el mate
    const prep = portrait ? 58 : 53;
    const base = this.s.phase === 'choose' ? (this.s.focus ? focusFov : overview) : prep;
    // En vertical: al elegir se abre el ángulo; al preparar se acerca al mate
    this.fovT = portrait ? (this.s.phase === 'choose' ? Math.min(base * 1.3, 80) : 62) : base;
    this.yaw = damp(this.yaw, this.yawT, 5, dt);
    this.pitch = damp(this.pitch, this.pitchT, 5, dt);
    this.camera.fov = damp(this.camera.fov, this.fovT, 4, dt);
    this.camera.updateProjectionMatrix();
    // Giroscopio suavizado (el sensor tiembla) y sumado a donde ya miraba
    this.gyroOffset.yaw = damp(this.gyroOffset.yaw, this.gyroT.yaw, 14, dt);
    this.gyroOffset.pitch = damp(this.gyroOffset.pitch, this.gyroT.pitch, 14, dt);
    const yaw = clamp(this.yaw + this.gyroOffset.yaw, -1.4, 1.4);
    const pitch = clamp(this.pitch + this.gyroOffset.pitch, -1.2, 0.5);
    const dir = new THREE.Vector3(
      -Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch)
    );
    // Leve desplazamiento de la cabeza al girar el celular: los objetos cercanos
    // se corren más que el fondo y da sensación de profundidad.
    this.camera.position.set(
      EYE.x - Math.cos(yaw) * this.gyroOffset.yaw * 0.09,
      EYE.y + this.gyroOffset.pitch * 0.06,
      EYE.z + Math.sin(yaw) * this.gyroOffset.yaw * 0.09
    );
    this.camera.lookAt(this.camera.position.clone().add(dir));

    // Objetos: se acercan suavemente a su posición objetivo
    for (const it of this.items) {
      const hovered = this.s.phase === 'choose' && this.s.hovered === it.opt.id;
      const chosen = this.s.selection[it.opt.category] === it.opt.id;
      it.tScale = hovered ? 1.08 : 1;
      if (it.managed) {
        it.group.position.lerp(it.tPos, 1 - Math.exp(-7 * dt));
        it.group.quaternion.slerp(it.tQuat, 1 - Math.exp(-7 * dt));
      }
      const s = damp(it.group.scale.x, it.tScale, 10, dt);
      it.group.scale.setScalar(s);
      if (this.s.phase === 'choose') {
        const target = chosen ? 0.95 : hovered ? 0.45 : 0;
        it.ringMat.opacity = damp(it.ringMat.opacity, target, 10, dt);
      }
    }

    if (this.s.phase !== 'choose' && this.isComplete) this.updatePrep(dt);

    this.yerbaFx.update(dt);
    this.dropFx.update(dt);
    this.crumbFx.update(dt);
    this.steam.update(dt);
    this.updateEating(dt);
    this.dog?.update(dt);
    for (const ed of this.edibles) {
      const sc = damp(ed.obj.scale.x, ed.target, 12, dt);
      ed.obj.scale.setScalar(sc);
    }

    // Polvito flotando en la luz
    const p = this.dust.geometry.attributes.position as THREE.BufferAttribute;
    const t = this.clock.elapsedTime;
    for (let i = 0; i < p.count; i++) {
      p.setY(i, p.getY(i) + Math.sin(t * 0.3 + i) * 0.00012);
      p.setX(i, p.getX(i) + Math.cos(t * 0.2 + i * 1.3) * 0.0001);
    }
    p.needsUpdate = true;
  }

  private updatePrep(dt: number) {
    const sel = this.selected();
    const mate = sel.mate;
    const mp = mate.mate!;
    const st = this.s.step;
    const holding = this.s.holding && this.s.phase === 'prepare';
    this.stepTimer += dt;

    // ── Yerba
    let emittingYerba = false;
    if (st === 'yerba' && holding) {
      const mouthTarget = mate.group.localToWorld(new THREE.Vector3(0, mp.top + 0.09, 0));
      const q = quatZ(-2.05);
      sel.yerba.tQuat.copy(q);
      sel.yerba.tPos.copy(mouthTarget.clone().sub(sel.yerba.mouth!.clone().applyQuaternion(q)));
      if (sel.yerba.group.position.distanceTo(sel.yerba.tPos) < 0.03) {
        emittingYerba = true;
        if (this.s.meter < 0.92) {
          this.s.meter = Math.min(0.92, this.s.meter + 0.24 * dt);
          this.yerbaFill = this.s.meter;
          this.dirty = true;
        } else if (this.stepTimer > 0.2) {
          this.toast('¡Está lleno! Soltá.', 'warn');
          this.stepTimer = -1.5;
        }
      }
    } else {
      sel.yerba.tPos.copy(PREP.yerba);
      sel.yerba.tQuat.setFromEuler(
        new THREE.Euler(0, Math.atan2(EYE.x - PREP.yerba.x, EYE.z - PREP.yerba.z), 0)
      );
    }
    setPour('yerba', emittingYerba && this.s.meter < 0.92);
    if (emittingYerba && this.s.meter < 0.92) {
      const mouth = sel.yerba.group.localToWorld(sel.yerba.mouth!.clone());
      const killY = mate.group.localToWorld(new THREE.Vector3(0, this.yerbaY(mp), 0)).y;
      for (let k = 0; k < 6; k++) {
        this.yerbaFx.spawn(
          mouth
            .clone()
            .add(new THREE.Vector3((Math.random() - 0.5) * 0.02, 0, (Math.random() - 0.5) * 0.02)),
          new THREE.Vector3((Math.random() - 0.5) * 0.1, -0.2, (Math.random() - 0.5) * 0.1),
          killY
        );
      }
    }

    // ── Inclinar
    if (st === 'tilt') {
      if (holding) {
        this.s.tiltDeg = Math.min(85, this.s.tiltDeg + 42 * dt);
        this.dirty = true;
        if (this.s.tiltDeg > 65 && Math.random() < 0.5) {
          const lip = mate.group.localToWorld(new THREE.Vector3(-0.04, mp.top, 0));
          this.yerbaFx.spawn(lip, new THREE.Vector3(-0.2, 0, 0), TABLE_Y);
        }
      }
      const tiltRad = THREE.MathUtils.degToRad(holding ? this.s.tiltDeg : 0);
      mate.tQuat.copy(quatZ(tiltRad, 0.25));
      mp.yerbaPivot.rotation.z = -tiltRad * 0.5;
    } else {
      mp.yerbaPivot.rotation.z = damp(mp.yerbaPivot.rotation.z, this.slope, 6, dt);
    }

    // ── Termo (agua)
    const pouring = (st === 'water1' || st === 'water2' || st === 'cebar') && holding;
    let streamOn = false;
    if (pouring) {
      const target = this.pourPoint(this.bombillaAnim === 'done' ? 0.2 : 0.1);
      const q = quatZ(1.85);
      sel.termo.tQuat.copy(q);
      sel.termo.tPos.copy(target.clone().sub(sel.termo.mouth!.clone().applyQuaternion(q)));
      if (sel.termo.group.position.distanceTo(sel.termo.tPos) < 0.03) {
        streamOn = true;
        const rate = st === 'cebar' ? 0.26 : 0.17;
        const cap = st === 'cebar' ? 1.05 : 0.7;
        this.s.meter = Math.min(cap, this.s.meter + rate * dt);
        this.dirty = true;
        if (st !== 'cebar') this.wet = Math.max(this.wet, Math.min(1, this.s.meter * 1.4));
        if (st === 'cebar' && this.s.meter > 1) {
          const lip = mate.group.localToWorld(new THREE.Vector3(0.045, mp.top, 0));
          this.dropFx.spawn(lip, new THREE.Vector3(0.15, 0, (Math.random() - 0.5) * 0.1), TABLE_Y);
          if (this.stepTimer > 0) {
            this.toast('¡Se rebalsa! Soltá.', 'warn');
            this.stepTimer = -1.5;
          }
        }
      }
    } else {
      sel.termo.tPos.copy(PREP.termo);
      sel.termo.tQuat.setFromEuler(
        new THREE.Euler(0, Math.atan2(EYE.x - PREP.termo.x, EYE.z - PREP.termo.z), 0)
      );
    }
    setPour('water', streamOn);
    if (streamOn) {
      const spout = sel.termo.group.localToWorld(sel.termo.mouth!.clone());
      const end = this.holePoint(0);
      end.y = mate.group.localToWorld(new THREE.Vector3(0, this.waterY(mp), 0)).y;
      this.stream.position.copy(spout);
      const wob = 1 + Math.sin(this.clock.elapsedTime * 38) * 0.14;
      this.stream.scale.set(wob, Math.max(0.01, spout.y - end.y), wob);
      this.stream.quaternion.identity();
      this.stream.visible = true;
      // Salpicaduras chiquitas donde el chorro pega en el agua
      if (Math.random() < 0.6) {
        this.dropFx.spawn(
          new THREE.Vector3(spout.x, end.y + 0.002, spout.z),
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.09,
            0.12 + Math.random() * 0.14,
            (Math.random() - 0.5) * 0.09
          ),
          end.y - 0.002
        );
      }
    } else {
      this.stream.visible = false;
    }

    // ── Espera de 5 segundos
    if (st === 'wait' && this.s.phase === 'prepare') {
      this.s.waitLeft = Math.max(0, this.s.waitLeft - dt);
      this.wetT = 0.6;
      this.dirty = true;
      if (this.s.waitLeft === 0 && this.stepTimer < 1000) {
        this.stepTimer = 1000;
        this.s.scores.wait = Math.max(25, 100 - 25 * this.impatient);
        this.toast('¡Absorbió! Ahora otro chorrito.', 'good');
        this.setStep('water2');
      }
    }

    // ── Bombilla
    if (st === 'bombilla' && this.bombillaAnim === 'lift') {
      if (sel.bombilla.group.position.distanceTo(sel.bombilla.tPos) < 0.01) {
        this.bombillaAnim = 'insert';
        const p = this.holePoint(0);
        p.y = mate.group.localToWorld(new THREE.Vector3(0, this.yerbaY(mp) - 0.07, 0)).y;
        sel.bombilla.tPos.copy(p);
      }
    } else if (st === 'bombilla' && this.bombillaAnim === 'insert') {
      if (sel.bombilla.group.position.distanceTo(sel.bombilla.tPos) < 0.004) {
        this.bombillaAnim = 'done';
        sel.bombilla.managed = false;
        mate.group.attach(sel.bombilla.group);
        this.toast('Bombilla adentro. ¡No la muevas!', 'good');
        this.advanceSoon('cebar', 500);
      }
    }

    // ── Tomar
    if (st === 'drink' && this.drinkT > 0 && this.s.phase === 'prepare') {
      this.drinkT += dt;
      this.s.meter = Math.max(0, 1 - this.drinkT / 2.6);
      this.dirty = true;
      if (this.drinkT > 1.75 && !this.slurped) {
        this.slurped = true;
        playSlurp();
      }
      if (this.drinkT > 3.1) {
        this.drinkT = 0;
        this.askAnother();
      }
    }

    // ── Visual de yerba y agua dentro del mate
    const yY = this.yerbaY(mp);
    const yR = radiusAt(mp.profile, yY) * 0.9;
    mp.yerbaPivot.visible = this.yerbaFill > 0.02;
    mp.yerbaPivot.position.y = yY;
    mp.yerbaMesh.scale.setScalar(yR * 0.9);
    // La montañita aparece a medida que se inclina la yerba
    mp.yerbaMesh.morphTargetInfluences![0] = clamp(
      Math.abs(mp.yerbaPivot.rotation.z) / FULL_MOUND_SLOPE,
      0,
      1
    );
    this.wet = damp(this.wet, Math.max(this.wet, this.wetT), 1.2, dt);
    mp.yerbaMat.color.copy(YERBA_TINT_DRY).lerp(YERBA_TINT_WET, this.wet);
    mp.yerbaMat.roughness = 1 - 0.35 * this.wet;

    let water = 0;
    if (st === 'water1' || st === 'water2') water = this.s.meter * 0.45;
    else if (st === 'wait') water = (this.s.waitLeft / 5) * 0.12;
    else if (st === 'cebar' || st === 'drink') water = Math.min(this.s.meter, 1);
    if (this.s.phase === 'done') water = 0;
    this.waterShown = damp(this.waterShown, water, 6, dt);
    mp.water.visible = this.waterShown > 0.01;
    if (mp.water.visible) {
      const wy = this.waterY(mp);
      const wr = radiusAt(mp.profile, wy);
      mp.water.position.set(wr * 0.35, wy, 0);
      mp.water.scale.setScalar(wr * 0.55);
      // El agua de cebar está caliente: larga vapor (no mientras se toma, que
      // el mate está pegado a la cara)
      const hot = this.s.phase === 'prepare' && (st === 'cebar' || st === 'drink');
      if (hot && this.drinkT === 0 && this.waterShown > 0.15) {
        this.steam.emit(
          mp.water.getWorldPosition(new THREE.Vector3()),
          wr * 0.4,
          streamOn ? 9 : 5,
          dt
        );
      }
    }
  }

  private waterY(mp: MateParts) {
    const yY = this.yerbaY(mp);
    const r = radiusAt(mp.profile, yY) * 0.9;
    const holeY = yY - 0.38 * r * Math.tan(Math.abs(this.slope));
    return holeY + this.waterShown * (mp.top * 0.96 - holeY);
  }

  private updateHotspots() {
    const show = this.s.phase === 'choose' && this.s.focus === null;
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    const placed: { x: number; y: number; hw: number }[] = [];
    for (const cat of CATEGORY_ORDER) {
      const el = this.hotspots[cat];
      if (!el) continue;
      const world = this.zoneCenter(cat).add(new THREE.Vector3(0, ZONES[cat].anchorH, 0));
      const view = world.clone().applyMatrix4(this.camera.matrixWorldInverse);
      const p = world.project(this.camera);
      // Si la zona queda fuera de cuadro (típico en celular vertical, donde solo
      // entran dos grupos), la etiqueta se pega al borde de ese lado en vez de
      // ocultarse: así siempre se puede tocar para ir a ese grupo.
      const hw = el.offsetWidth / 2 + 8;
      const behind = view.z >= 0;
      let x = behind ? (view.x >= 0 ? w : 0) : ((p.x + 1) / 2) * w;
      let y = behind ? h * 0.4 : ((1 - p.y) / 2) * h;
      x = clamp(x, hw, Math.max(hw, w - hw));
      y = clamp(y, 76, Math.max(76, h - 150));
      for (const o of placed) {
        if (Math.abs(o.x - x) < o.hw + hw && Math.abs(o.y - y) < 44) y = o.y + 44;
      }
      placed.push({ x, y, hw });
      el.style.opacity = show ? '1' : '0';
      el.style.pointerEvents = show ? 'auto' : 'none';
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    }
  }

  // ── Input ────────────────────────────────────────────────────────────────

  private pickEdible(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const live = this.edibles.filter((e) => e.obj.visible);
    const hits = this.raycaster.intersectObjects(
      live.map((e) => e.obj),
      true
    );
    for (const h of hits) {
      if (!h.object.visible) continue;
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.edible) o = o.parent;
      if (o) {
        const found = o;
        return live.find((e) => e.obj === found) ?? null;
      }
    }
    return null;
  }

  /** Una mordida: sonido, miguitas y el pedazo que desaparece. */
  /** Llevar el bocado a la boca: lo saca del plato y lo acerca a la cámara. */
  private eat(ed: Edible) {
    if (this.eating) return;
    const parent = ed.obj.parent!;
    this.eating = {
      ed,
      phase: 'lift',
      t: 0,
      parent,
      homePos: ed.obj.position.clone(),
      homeQuat: ed.obj.quaternion.clone(),
    };
    this.scene.attach(ed.obj);
  }

  /** Avanza la animación de comer (subir → morder → masticar → volver al plato). */
  private updateEating(dt: number) {
    const e = this.eating;
    if (!e) return;
    const obj = e.ed.obj;
    e.t += dt;
    const k = 1 - Math.exp(-9 * dt);
    if (e.phase === 'lift' || e.phase === 'chew') {
      // Frente a la boca: un poco abajo del centro de la vista
      const dir = this.camera.getWorldDirection(new THREE.Vector3());
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
      const mouth = this.camera.position
        .clone()
        .addScaledVector(dir, e.phase === 'chew' ? 0.17 : 0.14)
        .addScaledVector(up, -0.055);
      obj.position.lerp(mouth, k);
      // Mostrar el lado que se muerde mirando a la cámara, levemente inclinado
      const face = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(this.camera.position, obj.position, up)
      );
      // +X inclina la cara de arriba hacia la cámara (con signo negativo se veía
      // la base clara de la tortita en vez del azúcar negra).
      face.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(1.1, 0, 0.25)));
      obj.quaternion.slerp(face, k);
      if (e.phase === 'lift' && (obj.position.distanceTo(mouth) < 0.012 || e.t > 0.9)) {
        e.phase = 'chew';
        e.t = 0;
        this.bite(e.ed);
      } else if (e.phase === 'chew' && e.t > 0.55) {
        e.phase = 'back';
        e.t = 0;
      }
    } else {
      const homeWorld = e.parent.localToWorld(e.homePos.clone());
      const parentQ = e.parent.getWorldQuaternion(new THREE.Quaternion());
      const homeQ = parentQ.multiply(e.homeQuat);
      obj.position.lerp(homeWorld, k);
      obj.quaternion.slerp(homeQ, k);
      if (obj.position.distanceTo(homeWorld) < 0.003 || e.t > 1.2) {
        e.parent.attach(obj);
        obj.position.copy(e.homePos);
        obj.quaternion.copy(e.homeQuat);
        this.eating = null;
      }
    }
  }

  /** El mordisco en sí: sonido, miguitas y el pedazo que desaparece. */
  private bite(ed: Edible) {
    ed.bites++;
    playChew(ed.kind);
    this.cb.onEvent?.({ name: 'eat', kind: ed.kind });
    const at = ed.obj.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -0.01, 0));
    for (let k = 0; k < 26; k++) {
      this.crumbFx.spawn(
        at
          .clone()
          .add(new THREE.Vector3((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.04)),
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.25,
          -0.05 + Math.random() * 0.25,
          (Math.random() - 0.5) * 0.25
        ),
        TABLE_Y + 0.004
      );
    }
    if (ed.kind === 'medialuna') {
      // Se come desde una punta: [seg0..seg6, puntaIzq, puntaDer]
      const parts = ed.obj.children;
      const hide =
        ed.bites === 1
          ? [parts.length - 1, parts.length - 3, parts.length - 4]
          : [2, 3, 4, parts.length - 2];
      for (const i of hide) if (parts[i]) parts[i].visible = false;
      ed.target = 1;
    } else {
      ed.target = ed.bites === 1 ? 0.72 : 0.45;
    }
    const msgs =
      ed.kind === 'medialuna'
        ? ['¡Ñam! Medialuna de manteca', 'Mmm… con el mate, lo más', '¡Crujiente!']
        : ['¡Ñam! Tortita negra', 'Mmm… azúcar negra', '¡Qué rica la tortita!'];
    if (ed.bites >= 3) {
      ed.obj.visible = false;
      this.toast(
        ed.kind === 'medialuna' ? '¡Te comiste una medialuna!' : '¡Te comiste una tortita negra!',
        'good'
      );
      if (this.edibles.filter((e) => e.kind === ed.kind).every((e) => !e.obj.visible))
        this.restock(ed.kind);
    } else {
      this.toast(msgs[(ed.bites - 1) % msgs.length], 'info');
    }
    this.dirty = true;
  }

  /** Cuando se termina un plato, al ratito llega otra tanda. */
  private restock(kind: Snack) {
    this.restockTimers.push(
      window.setTimeout(() => {
        if (this.disposed) return;
        for (const e of this.edibles) {
          if (e.kind !== kind) continue;
          e.bites = 0;
          e.target = 1;
          e.obj.scale.setScalar(0.01);
          e.obj.visible = true;
          for (const c of e.obj.children) c.visible = true;
        }
        this.toast(
          kind === 'medialuna'
            ? '¡Llegó otra tanda de medialunas!'
            : '¡Llegaron más tortitas negras!',
          'good'
        );
      }, 6000)
    );
  }

  private pick(clientX: number, clientY: number): Item | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.items.map((i) => i.group),
      true
    );
    for (const h of hits) {
      // El Raycaster ignora `visible`: sin este filtro, los discos ocultos de
      // yerba y agua de cada mate (1 m de radio hasta que se prepara) atrapaban
      // los toques dirigidos a los termos y a casi toda la mesa.
      if (!shown(h.object)) continue;
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.optionId) o = o.parent;
      if (o) {
        const id = o.userData.optionId as string;
        return this.items.find((i) => i.opt.id === id) ?? null;
      }
    }
    return null;
  }

  private onPointerDown = (e: PointerEvent) => {
    this.pointer = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      dragged: false,
    };
    this.renderer.domElement.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    const p = this.pointer;
    if (p && p.id === e.pointerId) {
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      if (!p.dragged && Math.hypot(dx, dy) > 6) p.dragged = true;
      if (p.dragged) {
        const k = 0.0032 * (this.camera.fov / 55);
        this.yawT = clamp(this.yawT + dx * k, -1.35, 1.35);
        this.pitchT = clamp(this.pitchT + dy * k, -1.15, 0.45);
        p.x = e.clientX;
        p.y = e.clientY;
      }
      return;
    }
    if (e.pointerType === 'mouse' && this.s.phase === 'choose') {
      const it = this.pick(e.clientX, e.clientY);
      const id = it?.opt.id ?? null;
      if (id !== this.s.hovered) {
        this.s.hovered = id;
        this.dirty = true;
      }
      this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
      if (id) return;
    }
    if (e.pointerType === 'mouse') {
      const ed = this.pickEdible(e.clientX, e.clientY);
      this.renderer.domElement.style.cursor = ed ? 'pointer' : 'grab';
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    const p = this.pointer;
    this.pointer = null;
    if (!p || p.id !== e.pointerId || p.dragged || e.type === 'pointercancel') return;
    const it = this.pick(e.clientX, e.clientY);
    if (!it && !this.s.holding) {
      const ed = this.pickEdible(e.clientX, e.clientY);
      if (ed) {
        this.eat(ed);
        return;
      }
    }
    if (this.s.phase === 'choose') {
      if (!it) {
        if (this.s.focus) this.focus(null);
        return;
      }
      if (this.s.focus !== it.opt.category) this.focus(it.opt.category);
      else this.select(it.opt.id);
      return;
    }
    if (this.s.phase === 'prepare' && it) {
      const sel = this.selected();
      if (
        (this.s.step === 'grab' && it === sel.mate) ||
        (this.s.step === 'bombilla' && it === sel.bombilla) ||
        (this.s.step === 'drink' && it === sel.mate)
      ) {
        this.action();
      }
    }
  };

  private onWheel = (e: WheelEvent) => {
    this.pitchT = clamp(this.pitchT - e.deltaY * 0.0008, -1.15, 0.45);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const tag = e.target instanceof HTMLElement ? e.target.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    // La barra espaciadora sobre un botón la maneja el propio botón
    if (e.code === 'Space' && (tag === 'BUTTON' || tag === 'A')) return;
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      if (['grab', 'bombilla', 'drink'].includes(this.s.step) && this.s.phase === 'prepare')
        this.action();
      else this.setHolding(true);
    } else if (e.code === 'Escape') {
      this.focus(null);
    } else if (e.code === 'ArrowLeft') {
      this.yawT = clamp(this.yawT + 0.15, -1.35, 1.35);
    } else if (e.code === 'ArrowRight') {
      this.yawT = clamp(this.yawT - 0.15, -1.35, 1.35);
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') this.setHolding(false);
  };

  /** Si la ventana pierde el foco con la barra apretada, el `keyup` nunca llega. */
  private onBlur = () => {
    this.pointer = null;
    this.setHolding(false);
  };

  /**
   * Giroscopio: el celular funciona como una ventana a la mesa. Se arma la
   * orientación real del teléfono (alpha/beta/gamma + rotación de pantalla) como
   * cuaternión y de ahí sale hacia dónde apunta su parte de atrás. Usar los
   * ángulos sueltos falla justo con el celular parado, que es como se lo sostiene.
   */
  private onOrientation = (e: DeviceOrientationEvent) => {
    if (e.alpha == null || e.beta == null || e.gamma == null) return;
    const rad = THREE.MathUtils.degToRad;
    const screenAngle = rad(window.screen?.orientation?.angle ?? 0);
    const q = new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(rad(e.beta), rad(e.alpha), -rad(e.gamma), 'YXZ'))
      .multiply(DEVICE_TO_CAMERA)
      .multiply(new THREE.Quaternion().setFromAxisAngle(Z_AXIS, -screenAngle));
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
    const yaw = Math.atan2(-f.x, -f.z);
    const pitch = Math.asin(clamp(f.y, -1, 1));
    if (!this.gyroRef) {
      this.gyroRef = { yaw, pitch };
      return;
    }
    let dy = yaw - this.gyroRef.yaw;
    if (dy > Math.PI) dy -= Math.PI * 2;
    if (dy < -Math.PI) dy += Math.PI * 2;
    this.gyroT.yaw = clamp(dy, -1.3, 1.3);
    this.gyroT.pitch = clamp(pitch - this.gyroRef.pitch, -0.9, 0.9);
  };

  private resize() {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
