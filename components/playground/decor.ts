/**
 * Decoración de la habitación del playground (no se puede elegir ni tocar):
 * el cuadro de los dueños, las tortitas negras y las medialunas.
 * Todo se dibuja por código salvo la foto del cuadro, que se carga de /public.
 */
import * as THREE from 'three';

import { canvasTexture, rng, std, woodTexture } from './models';

// ─── Cuadro con foto ────────────────────────────────────────────────────────

/**
 * Marco de madera con paspartú y la foto. Mira hacia +z (el frente);
 * el que lo usa lo rota para colgarlo en la pared.
 */
export function buildPortrait(url: string, photoW = 0.5, photoH = 0.58) {
  const g = new THREE.Group();
  const border = 0.07;
  const mat = 0.05;
  const w = photoW + (mat + border) * 2;
  const h = photoH + (mat + border) * 2;
  const wood = std('#ffffff', { map: woodTexture('#6b4226', '#2e1a0c', 1, 29), roughness: 0.5 });

  // Marco: cuatro listones con bisel
  const bar = (bw: number, bh: number, x: number, y: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.035), wood);
    m.position.set(x, y, 0.0175);
    g.add(m);
  };
  bar(w, border, 0, h / 2 - border / 2);
  bar(w, border, 0, -h / 2 + border / 2);
  bar(border, h - border * 2, -w / 2 + border / 2, 0);
  bar(border, h - border * 2, w / 2 - border / 2, 0);
  // Filete dorado interior
  const gold = std('#c9a04a', { metalness: 0.8, roughness: 0.35 });
  const fw = w - border * 2;
  const fh = h - border * 2;
  for (const [bw, bh, x, y] of [
    [fw, 0.008, 0, fh / 2],
    [fw, 0.008, 0, -fh / 2],
    [0.008, fh, -fw / 2, 0],
    [0.008, fh, fw / 2, 0],
  ]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.01), gold);
    m.position.set(x, y, 0.03);
    g.add(m);
  }
  // Paspartú
  const passe = new THREE.Mesh(
    new THREE.PlaneGeometry(fw, fh),
    std('#f4efe4', { roughness: 0.95 })
  );
  passe.position.z = 0.012;
  g.add(passe);
  // Fondo del cuadro
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.01), wood);
  back.position.z = 0.005;
  g.add(back);

  // Foto (se carga sola; mientras tanto se ve un gris cálido)
  const photoMat = new THREE.MeshStandardMaterial({ color: '#cfc6b8', roughness: 0.4 });
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(photoW, photoH), photoMat);
  photo.position.z = 0.014;
  g.add(photo);
  new THREE.TextureLoader().load(url, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    photoMat.map = tex;
    photoMat.color.set('#ffffff');
    photoMat.needsUpdate = true;
  });

  // Vidrio con un brillo sutil
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(fw, fh),
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.06,
      roughness: 0.05,
      metalness: 0.2,
    })
  );
  glass.position.z = 0.02;
  g.add(glass);
  return g;
}

// ─── Plato enlozado ─────────────────────────────────────────────────────────

/** Plato de chapa enlozada crema con borde verde (como el de las tortitas). */
function enamelPlate(r: number) {
  const g = new THREE.Group();
  const prof = [
    new THREE.Vector2(0, 0.002),
    new THREE.Vector2(r * 0.62, 0.002),
    new THREE.Vector2(r * 0.72, 0.006),
    new THREE.Vector2(r * 0.96, 0.017),
    new THREE.Vector2(r, 0.019),
  ];
  const enamel = std('#efe6c8', { roughness: 0.25, metalness: 0.05, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 64), enamel));
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(r, 0.0035, 8, 64),
    std('#2f5a3c', { roughness: 0.3 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.019;
  g.add(rim);
  // Banda verde fina por debajo del borde
  const band = new THREE.Mesh(
    new THREE.LatheGeometry([new THREE.Vector2(r * 0.93, 0.0152), new THREE.Vector2(r, 0.019)], 64),
    std('#2f5a3c', { roughness: 0.3, side: THREE.DoubleSide })
  );
  band.position.y = 0.0004;
  g.add(band);
  return g;
}

// ─── Tortitas negras ────────────────────────────────────────────────────────

function sugarCrustTexture(seed: number) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#3a2316';
    ctx.fillRect(0, 0, w, h);
    const r = rng(seed);
    // Grumos de azúcar negra quemada
    for (let i = 0; i < 1600; i++) {
      const v = r();
      ctx.fillStyle =
        v > 0.85 ? 'rgba(120,80,50,0.7)' : v > 0.45 ? 'rgba(25,14,8,0.8)' : 'rgba(80,50,30,0.6)';
      ctx.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 4);
    }
    // Cristalitos de azúcar que brillan
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(255,240,220,${0.4 + r() * 0.5})`;
      ctx.fillRect(r() * w, r() * h, 1.5, 1.5);
    }
  });
}

function doughTexture(seed: number) {
  return canvasTexture(256, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    // v=0 abajo (base dorada), v=1 arriba (donde empieza la costra)
    g.addColorStop(0, '#7a4a28');
    g.addColorStop(0.35, '#e9d9b6');
    g.addColorStop(0.75, '#f3e7cc');
    g.addColorStop(1, '#5a3520');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = rng(seed);
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = `rgba(160,120,80,${0.05 + r() * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 2 + r() * 6, 1 + r() * 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Una tortita negra: bollo de masa con la costra de azúcar negra arriba. */
function tortita(seed: number) {
  const g = new THREE.Group();
  const r = rng(seed);
  const R = 0.04 + r() * 0.006;
  const H = 0.03 + r() * 0.006;
  // Masa: un bollo con los costados redondeados
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    prof.push(new THREE.Vector2(R * (0.86 + 0.14 * Math.sin(t * Math.PI)), t * H));
  }
  prof.unshift(new THREE.Vector2(0, 0));
  const dough = new THREE.Mesh(
    new THREE.LatheGeometry(prof, 40),
    std('#ffffff', { map: doughTexture(seed), roughness: 0.85 })
  );
  g.add(dough);
  // Costra: casquete abombado e irregular que desborda un poco
  const cap = new THREE.SphereGeometry(R * 1.04, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = cap.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const bump = 1 + Math.sin(x * 160 + seed) * 0.03 + Math.cos(z * 140 + seed * 2) * 0.03;
    p.setXYZ(i, x * bump, y * 0.42, z * bump);
  }
  cap.computeVertexNormals();
  const crust = new THREE.Mesh(
    cap,
    std('#ffffff', { map: sugarCrustTexture(seed + 7), roughness: 0.75 })
  );
  crust.position.y = H * 0.82;
  g.add(crust);
  return { group: g, h: H + R * 0.42 * 0.9, R };
}

/** Plato enlozado con tortitas negras apiladas en montañita. */
export function buildTortitasPlate() {
  const g = new THREE.Group();
  const plateR = 0.15;
  g.add(enamelPlate(plateR));
  const layout: [number, number, number][] = [
    // [ángulo, distancia, piso]
    [0, 0.085, 0],
    [1.05, 0.085, 0],
    [2.1, 0.085, 0],
    [3.15, 0.085, 0],
    [4.2, 0.085, 0],
    [5.25, 0.085, 0],
    [0.5, 0.045, 1],
    [2.6, 0.045, 1],
    [4.6, 0.045, 1],
    [1.5, 0.0, 2],
  ];
  let seed = 300;
  for (const [a, d, floor] of layout) {
    const t = tortita(seed++);
    const r = rng(seed * 3);
    t.group.position.set(Math.cos(a) * d, 0.006 + floor * 0.034, Math.sin(a) * d);
    // Las de arriba se apoyan inclinadas sobre las de abajo
    const tilt = floor === 0 ? 0.08 : 0.28;
    t.group.rotation.set(
      Math.sin(a) * tilt + (r() - 0.5) * 0.1,
      r() * Math.PI,
      -Math.cos(a) * tilt
    );
    t.group.userData.edible = 'tortita';
    g.add(t.group);
  }
  return g;
}

// ─── Medialunas ─────────────────────────────────────────────────────────────

/** Una medialuna: segmentos enrollados a lo largo de un arco, más gruesa al medio. */
function medialuna(seed: number) {
  const g = new THREE.Group();
  const r = rng(seed);
  const golden = std('#c98a3c', { roughness: 0.32, metalness: 0.02 });
  const dark = std('#a8612a', { roughness: 0.3, metalness: 0.02 });
  const light = std('#e8c27e', { roughness: 0.45 });
  const span = 1.9 + r() * 0.3; // apertura del arco (radianes)
  const R = 0.05;
  const n = 7;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = -span / 2 + t * span;
    const thick = 0.012 + 0.017 * Math.sin(t * Math.PI);
    const seg = new THREE.Mesh(
      new THREE.SphereGeometry(1, 20, 14),
      i === 0 || i === n - 1 ? light : i % 2 ? golden : dark
    );
    seg.scale.set(thick * 1.05, thick * 0.85, thick * 1.5);
    seg.position.set(Math.sin(a) * R, thick * 0.78, -Math.cos(a) * R + R);
    seg.rotation.y = -a;
    g.add(seg);
  }
  // Puntas finitas
  for (const s of [-1, 1]) {
    const a = (s * span) / 2;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), light);
    tip.scale.set(0.006, 0.006, 0.014);
    tip.position.set(Math.sin(a) * R * 1.05, 0.006, -Math.cos(a) * R * 1.05 + R + s * 0.002);
    tip.rotation.y = -a;
    g.add(tip);
  }
  return g;
}

/** Tabla de madera redonda con medialunas. */
export function buildMedialunasBoard() {
  const g = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.018, 48).translate(0, 0.009, 0),
    std('#ffffff', { map: woodTexture('#c08a52', '#6a4322', 1, 37), roughness: 0.6 })
  );
  g.add(board);
  const spots: [number, number, number, number][] = [
    // [x, z, rotación, altura extra]
    [-0.06, -0.05, 0.3, 0],
    [0.06, -0.06, -0.4, 0],
    [-0.065, 0.05, 2.8, 0],
    [0.055, 0.055, 3.5, 0],
    [0.0, 0.0, 1.4, 0.022],
  ];
  let seed = 600;
  for (const [x, z, ry, y] of spots) {
    const m = medialuna(seed++);
    m.position.set(x, 0.018 + y, z);
    m.rotation.y = ry;
    if (y) m.rotation.z = 0.12;
    m.userData.edible = 'medialuna';
    g.add(m);
  }
  return g;
}
