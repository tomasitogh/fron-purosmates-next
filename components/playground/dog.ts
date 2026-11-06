/**
 * La perrita de la casa: galguita negra con el pecho blanco, la pata delantera
 * y la trasera izquierdas blancas, la punta de la cola blanca y collar rosa con
 * chapita. Da vueltas por la habitación y a veces se echa en su almohadón.
 * Todo por código (geometrías simples + animación de patas y cola).
 */
import * as THREE from 'three';

import { canvasTexture, rng, std } from './models';

const BLACK = '#141414';
const WHITE = '#f1efe9';

// ─── Almohadón ──────────────────────────────────────────────────────────────

function cushionTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3d5d93';
    ctx.fillRect(0, 0, w, h);
    const r = rng(77);
    // Rayas horizontales pintadas a mano
    ctx.strokeStyle = 'rgba(210,225,245,0.75)';
    ctx.lineCap = 'round';
    for (let y = 30; y < h * 0.62; y += 26) {
      ctx.lineWidth = 3 + r() * 3;
      ctx.beginPath();
      ctx.moveTo(10 + r() * 30, y + r() * 4);
      ctx.lineTo(w * 0.55 + r() * 40, y + r() * 4);
      ctx.stroke();
    }
    // Franja vertical doble
    ctx.lineWidth = 4;
    for (const x of [w * 0.62, w * 0.66]) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    // Rayitas cortas en el resto
    for (let y = 18; y < h; y += 22) {
      for (let x = w * 0.7; x < w; x += 30) {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + r() * 6, y);
        ctx.lineTo(x + 12 + r() * 6, y);
        ctx.stroke();
      }
    }
    for (let y = h * 0.66; y < h; y += 24) {
      for (let x = 14; x < w * 0.58; x += 34) {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + r() * 6, y);
        ctx.lineTo(x + 14 + r() * 6, y);
        ctx.stroke();
      }
    }
  });
}

/** Almohadón azul con rayas blancas y una mantita amarilla en un costado. */
export function buildDogBed() {
  const g = new THREE.Group();
  const W = 0.95;
  const D = 0.7;
  const H = 0.13;
  // Almohadón mullido: caja con las esquinas y la parte de arriba redondeadas
  const geo = new THREE.BoxGeometry(W, H, D, 24, 6, 18);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const ex = Math.abs(x) / (W / 2);
    const ez = Math.abs(z) / (D / 2);
    const edge = Math.max(ex, ez);
    // Se infla al centro y se baja en los bordes
    const puff = y > 0 ? (1 - Math.pow(edge, 4)) * 0.035 : 0;
    const pinch = y > 0 ? Math.pow(edge, 6) * 0.03 : 0;
    p.setXYZ(i, x * (1 - pinch * 0.4), y + puff - pinch, z * (1 - pinch * 0.4));
  }
  geo.translate(0, H / 2, 0);
  geo.computeVertexNormals();
  const bed = new THREE.Mesh(geo, std('#ffffff', { map: cushionTexture(), roughness: 0.95 }));
  g.add(bed);
  // Mantita arrugada en la esquina de atrás
  const blanket = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 20, 12),
    std('#d9cf8a', { roughness: 1 })
  );
  blanket.scale.set(1.3, 0.35, 0.8);
  blanket.position.set(W * 0.3, H + 0.03, -D * 0.28);
  g.add(blanket);
  return { group: g, top: H + 0.03 };
}

// ─── Perrita ────────────────────────────────────────────────────────────────

type Leg = { hip: THREE.Group; knee: THREE.Group; phase: number; front: boolean };

export class Dog {
  readonly group = new THREE.Group();
  private body = new THREE.Group();
  private head = new THREE.Group();
  private tail = new THREE.Group();
  private tailTip = new THREE.Group();
  private legs: Leg[] = [];
  private t = 0;
  private walk = 0;
  private lie = 0;
  private lieT = 0;
  private target = new THREE.Vector3();
  private state: 'walk' | 'stand' | 'toBed' | 'lie' = 'stand';
  private timer = 1.5;
  private r = rng(5);

  constructor(
    private bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    private bed: { pos: THREE.Vector3; top: number; yaw: number },
    private avoid: (p: THREE.Vector3) => boolean
  ) {
    const black = std(BLACK, { roughness: 0.55, metalness: 0.05 });
    const white = std(WHITE, { roughness: 0.7 });
    const pink = std('#e23d7c', { roughness: 0.5 });
    const tag = std('#9b84c9', { metalness: 0.7, roughness: 0.3 });
    const eye = std('#c58a2a', { roughness: 0.2 });
    const nose = std('#0a0a0a', { roughness: 0.3 });

    const ell = (rx: number, ry: number, rz: number, mat: THREE.Material) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat);
      m.scale.set(rx, ry, rz);
      m.castShadow = true;
      return m;
    };
    const SH = 0.46; // altura de la cruz (lomo)

    // Cuerpo de galga: pecho profundo y cintura finita (eje z = adelante)
    this.body.position.y = SH - 0.07;
    const chest = ell(0.07, 0.115, 0.16, black);
    chest.position.set(0, -0.025, 0.15);
    const belly = ell(0.045, 0.055, 0.2, black);
    belly.position.set(0, 0.035, -0.05);
    const rump = ell(0.065, 0.085, 0.11, black);
    rump.position.set(0, 0.04, -0.22);
    // Pechera blanca
    const bib = ell(0.045, 0.09, 0.05, white);
    bib.position.set(0, -0.06, 0.27);
    this.body.add(chest, belly, rump, bib);

    // Cuello y cabeza fina con hocico largo
    const neck = ell(0.042, 0.11, 0.05, black);
    neck.position.set(0, 0.11, 0.3);
    neck.rotation.x = -0.75;
    this.body.add(neck);
    this.head.position.set(0, 0.215, 0.37);
    const skull = ell(0.05, 0.048, 0.07, black);
    const snout = ell(0.026, 0.028, 0.095, black);
    snout.position.set(0, -0.02, 0.11);
    const n = ell(0.017, 0.014, 0.012, nose);
    n.position.set(0, -0.012, 0.205);
    this.head.add(skull, snout, n);
    for (const s of [-1, 1]) {
      const e = ell(0.011, 0.011, 0.006, eye);
      e.position.set(s * 0.027, 0.012, 0.052);
      const pupil = ell(0.005, 0.005, 0.003, nose);
      pupil.position.set(s * 0.028, 0.012, 0.057);
      // Orejas plegadas hacia atrás (de galgo)
      const ear = ell(0.024, 0.036, 0.01, black);
      ear.position.set(s * 0.036, 0.04, -0.03);
      ear.rotation.set(-0.9, s * 0.4, s * 0.6);
      this.head.add(e, pupil, ear);
    }
    this.body.add(this.head);

    // Collar rosa con chapita
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 24), pink);
    collar.position.set(0, 0.13, 0.31);
    collar.rotation.x = Math.PI / 2 - 0.6;
    const chapa = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.003, 6), tag);
    chapa.rotation.x = Math.PI / 2;
    chapa.position.set(0, 0.07, 0.36);
    this.body.add(collar, chapa);

    // Cola larga y fina con la punta blanca
    this.tail.position.set(0, 0.06, -0.31);
    this.tail.rotation.x = 2.2;
    const tailA = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.016, 0.2, 8).translate(0, 0.1, 0),
      black
    );
    this.tailTip.position.y = 0.2;
    this.tailTip.rotation.x = -0.5;
    const tailB = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.011, 0.14, 8).translate(0, 0.07, 0),
      black
    );
    const tipW = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.0065, 0.06, 8).translate(0, 0.17, 0),
      white
    );
    this.tailTip.add(tailB, tipW);
    this.tail.add(tailA, this.tailTip);
    this.body.add(this.tail);

    // Patas: muslo + caña + pie. Blancas la delantera y la trasera izquierdas.
    const leg = (x: number, z: number, front: boolean, whiteFoot: boolean, phase: number) => {
      const hip = new THREE.Group();
      hip.position.set(x, front ? -0.08 : -0.02, z);
      const upper = ell(front ? 0.022 : 0.032, front ? 0.11 : 0.12, front ? 0.026 : 0.05, black);
      upper.position.y = -0.1;
      const knee = new THREE.Group();
      knee.position.y = -0.19;
      const lowerLen = front ? 0.2 : 0.21;
      const lower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.018, lowerLen, 8).translate(0, -lowerLen / 2, 0),
        whiteFoot ? white : black
      );
      lower.castShadow = true;
      const foot = ell(0.02, 0.012, 0.032, whiteFoot ? white : black);
      foot.position.set(0, -lowerLen, 0.012);
      knee.add(lower, foot);
      if (whiteFoot) {
        // La parte blanca sube un poco por la pata
        const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.05, 8), white);
        sock.position.y = -0.005;
        knee.add(sock);
      }
      hip.add(upper, knee);
      this.body.add(hip);
      this.legs.push({ hip, knee, phase, front });
    };
    // Izquierda de la perrita = +x (mira hacia +z)
    leg(0.04, 0.2, true, true, 0);
    leg(-0.04, 0.2, true, false, Math.PI);
    leg(0.04, -0.22, false, true, Math.PI);
    leg(-0.04, -0.22, false, false, 0);

    this.group.add(this.body);
    this.group.position.copy(bed.pos);
    this.pickTarget();
  }

  private pickTarget() {
    const { minX, maxX, minZ, maxZ } = this.bounds;
    for (let k = 0; k < 20; k++) {
      this.target.set(minX + this.r() * (maxX - minX), 0, minZ + this.r() * (maxZ - minZ));
      if (!this.avoid(this.target)) return;
    }
  }

  update(dt: number) {
    this.t += dt;
    const pos = this.group.position;
    this.timer -= dt;

    if (this.state === 'lie') {
      this.lie = Math.min(1, this.lie + dt * 1.2);
      this.lieT -= dt;
      if (this.lieT <= 0) {
        this.state = 'stand';
        this.timer = 1;
      }
    } else {
      this.lie = Math.max(0, this.lie - dt * 1.5);
    }

    let moving = false;
    if (this.state === 'walk' || this.state === 'toBed') {
      const goal = this.state === 'toBed' ? this.bed.pos : this.target;
      const to = new THREE.Vector3(goal.x - pos.x, 0, goal.z - pos.z);
      const dist = to.length();
      if (dist < 0.06) {
        if (this.state === 'toBed') {
          this.state = 'lie';
          this.lieT = 9 + this.r() * 8;
        } else {
          this.state = 'stand';
          this.timer = 1.5 + this.r() * 3;
        }
      } else {
        const want = Math.atan2(to.x, to.z);
        let d = want - this.group.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        this.group.rotation.y += THREE.MathUtils.clamp(d, -2.4 * dt, 2.4 * dt);
        const speed = Math.abs(d) > 1 ? 0.12 : 0.42;
        const step = Math.min(dist, speed * dt);
        const next = pos
          .clone()
          .add(
            new THREE.Vector3(
              Math.sin(this.group.rotation.y),
              0,
              Math.cos(this.group.rotation.y)
            ).multiplyScalar(step)
          );
        if (this.avoid(next) && this.state === 'walk') {
          this.pickTarget();
        } else {
          pos.copy(next);
          moving = true;
        }
      }
    } else if (this.state === 'stand' && this.timer <= 0) {
      if (this.r() < 0.3) {
        this.state = 'toBed';
      } else {
        this.state = 'walk';
        this.pickTarget();
      }
    }

    // Altura: sobre el almohadón cuando está cerca de él
    const onBed = Math.hypot(pos.x - this.bed.pos.x, pos.z - this.bed.pos.z) < 0.45;
    const baseY = onBed ? this.bed.top * Math.min(1, this.lie + 0.6) : 0;
    pos.y += (baseY - pos.y) * Math.min(1, dt * 6);

    // Ciclo de caminata
    this.walk += (moving ? 1 : 0) * dt * 9;
    const w = moving ? 1 : 0;
    for (const l of this.legs) {
      const s = Math.sin(this.walk + l.phase);
      const swing = s * 0.55 * w;
      const bend = Math.max(0, -Math.cos(this.walk + l.phase)) * 0.7 * w;
      // Echada: las de adelante estiradas hacia adelante, las de atrás plegadas
      const lieHip = l.front ? -1.45 : -1.25;
      const lieKnee = l.front ? -0.05 : 2.35;
      l.hip.rotation.x = THREE.MathUtils.lerp(swing, lieHip, this.lie);
      l.knee.rotation.x = THREE.MathUtils.lerp(l.front ? -bend * 0.4 : bend, lieKnee, this.lie);
    }
    // Cuerpo baja al echarse; cabecea un poco al caminar
    this.body.position.y = THREE.MathUtils.lerp(
      0.39 + Math.abs(Math.sin(this.walk)) * 0.01 * w,
      0.1,
      this.lie
    );
    this.body.rotation.x = 0;
    this.head.rotation.x = THREE.MathUtils.lerp(
      Math.sin(this.walk * 0.5) * 0.05 * w,
      -0.15,
      this.lie
    );
    this.head.rotation.y = Math.sin(this.t * 0.4) * 0.25 * (1 - w);
    // Cola: mueve más rápido cuando camina; echada, la cola descansa
    const wag = Math.sin(this.t * (moving ? 10 : 4)) * (moving ? 0.5 : 0.2);
    this.tail.rotation.z = THREE.MathUtils.lerp(wag, 0.9, this.lie);
    this.tail.rotation.x = THREE.MathUtils.lerp(2.2, 1.7, this.lie);
  }
}
