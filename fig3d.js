// 3D-Ansicht der Übungsfiguren. Wird erst geladen, wenn jemand auf „3D“ tippt.
// Nutzt die Bewegungen aus uebungen.js (Seitenansicht) und macht daraus eine Gliederpuppe im Raum.
// Angaben je Übung (Griffbreite, Hinweise …) stehen in fig3d-daten.js.
import * as THREE from "./lib/three.module.min.js";
import { X3, H3 } from "./fig3d-daten.js";

// Breiten, die in der Seitenansicht fehlen (gleiche Einheit wie uebungen.js, ca. 1 = 1,2 cm)
const SW = 17, HW = 8.5, FW = 9.5;

const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
const REF = { up: UP, down: DOWN };
const seg = (m, a, b, r) => {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length() || 0.001;
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.divideScalar(len));
  m.scale.set(r, len, r);
};
const v2 = (p, z = 0) => new THREE.Vector3(p[0] - 100, 124 - p[1], z);
const DEG = 180 / Math.PI;

// ---------- Skelett in 3D ----------
// Winkel wie in uebungen.js (0 = nach unten, 90 = nach vorn, 180 = nach oben), dazu für 3D:
//   ab/fab  Arm/Unterarm seitlich abspreizen (90 = waagerecht zur Seite)
//   hy/fhy  Arm/Unterarm waagerecht zur Körpermitte drehen (negativ = nach außen)
//   lb/sb   Ober-/Unterschenkel seitlich abspreizen · ly/sy  Ober-/Unterschenkel waagerecht drehen · fb Fuß zur Seite
//   tl      Oberkörper seitlich neigen (positiv = zu Seite 1) · pt  Becken seitlich kippen
//   roll    ganze Figur um die Blickrichtung kippen (−90 = auf Seite 2 liegen) · yaw  ganze Figur drehen
// Seite 1 = rechts (zur Kamera in der Seitenansicht), Seite 2 = links.
const SIDE_KEYS = ["a", "f", "ab", "fab", "hy", "fhy", "t", "s", "ft", "lb", "sb", "ly", "sy", "fb"];
const R = Math.PI / 180;
function dirv(a, ab, hy, s) {
  let x = Math.sin(a * R), y = -Math.cos(a * R), z = 0;
  const al = -s * ab * R; [y, z] = [y * Math.cos(al), y * Math.sin(al)];
  const be = s * hy * R; [x, z] = [x * Math.cos(be) + z * Math.sin(be), -x * Math.sin(be) + z * Math.cos(be)];
  return new THREE.Vector3(x, y, z);
}
function fill(P) {
  P = { sp: 180, tl: 0, pt: 0, roll: 0, yaw: 0, ...P };
  if (P.nka == null) P.nka = P.sp;
  for (const i of [1, 2]) {
    for (const k of ["a", "f", "t", "s", "ab", "hy", "lb", "ly"]) P[k + i] ??= 0;
    P["fab" + i] ??= P["ab" + i]; P["fhy" + i] ??= P["hy" + i];
    P["sb" + i] ??= P["lb" + i]; P["sy" + i] ??= P["ly" + i];
    P["ft" + i] ??= P["s" + i] + 90; P["fb" + i] ??= P["sb" + i];
  }
  return P;
}
const mix = (A, B, t) => { const r = {}; for (const k in A) r[k] = A[k] == null || B[k] == null ? (t < 0.5 ? A[k] : B[k]) ?? A[k] ?? B[k] : A[k] + (B[k] - A[k]) * t; for (const k in B) if (!(k in r)) r[k] = B[k]; return r; };
function poseAt(ex, t) {
  const cfg = X3[ex.id] || {};
  let P;
  if (cfg.K) { // eigene 3D-Posen (Anfang, evtl. Mitte, Ende)
    const K = cfg.K.map(fill);
    P = K.length === 3 ? (t < 0.5 ? mix(K[0], K[1], t * 2) : mix(K[1], K[2], t * 2 - 1)) : mix(K[0], K[1], t);
  } else P = mix(fill({ ...ex.A, ...(cfg.A || {}) }), fill({ ...ex.B, ...(cfg.B || {}) }), t);
  if (cfg.sym) for (const k of SIDE_KEYS) P[k + "1"] = P[k + "2"] = (P[k + "1"] + P[k + "2"]) / 2;
  return P;
}
function build(P, cfg) {
  const V = (o, d, l) => o.clone().addScaledVector(d, l);
  const tl = P.tl * R, pt = P.pt * R;
  const tilt = v => new THREE.Vector3(v.x, v.y * Math.cos(tl), v.y * Math.sin(tl));
  const spine = tilt(new THREE.Vector3(Math.sin(P.sp * R), -Math.cos(P.sp * R), 0));
  const neck = P.nka == null ? spine : tilt(new THREE.Vector3(Math.sin(P.nka * R), -Math.cos(P.nka * R), 0));
  const hip = new THREE.Vector3(), sh = V(hip, spine, L.sp);
  const j = { hip, sh, hd: V(V(sh, spine, L.nk), neck, L.hd) };
  for (const i of [1, 2]) {
    const s = i === 1 ? 1 : -1;
    j["sh" + i] = sh.clone().add(new THREE.Vector3(0, -s * SW * Math.sin(tl), s * SW * Math.cos(tl)));
    j["hp" + i] = hip.clone().add(new THREE.Vector3(0, -s * HW * Math.sin(pt), s * HW * Math.cos(pt)));
    j["el" + i] = V(j["sh" + i], dirv(P["a" + i], P["ab" + i], P["hy" + i], s), L.ua);
    j["h" + i] = V(j["el" + i], dirv(P["f" + i], P["fab" + i], P["fhy" + i], s), L.fa);
    j["k" + i] = V(j["hp" + i], dirv(P["t" + i], P["lb" + i], P["ly" + i], s), L.th);
    j["an" + i] = V(j["k" + i], dirv(P["s" + i], P["sb" + i], P["sy" + i], s), L.sh);
    j["to" + i] = V(j["an" + i], dirv(P["ft" + i], P["fb" + i], P["sy" + i], s), L.ft);
    j["an" + i].z += s; j["to" + i].z += s * 2.5; // Füße leicht nach außen
    if (cfg.ez != null) j["el" + i].z = s * cfg.ez;
    if (cfg.hz != null) j["h" + i].z = s * cfg.hz;
  }
  // ganze Figur kippen/drehen (um die Hüfte)
  if (P.roll || P.yaw) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(P.roll * R, P.yaw * R, 0, "YXZ"));
    for (const k in j) j[k].applyQuaternion(q);
  }
  return j;
}
function anchorShift(j, an) {
  const d = new THREE.Vector3();
  if (an === "ground" || an.pt === "ground") {
    const minY = Math.min(...Object.values(j).map(p => p.y));
    d.set((an.x ?? 100) - 100 - j.hip.x, (an.y != null ? 124 - an.y + 1.5 : 3.5) - minY, 0);
  } else if (an.at3) d.subVectors(new THREE.Vector3(...an.at3), j[an.pt]);
  else d.set(an.at[0] - 100 - j[an.pt].x, 124 - an.at[1] + 1.5 - j[an.pt].y, 0);
  return d;
}
export function joints(ex, t) {
  const cfg = X3[ex.id] || {}, P = poseAt(ex, t);
  const an = cfg.anchor3 || cfg.anchor || (cfg.K ? "ground" : ex.anchor || { pt: "an1", at: [100, 121] });
  let j = build(P, cfg), d = anchorShift(j, an);
  // reach: Beine so drehen, dass Zehen (oder Fersen) genau den Boden berühren (z. B. Liegestütz, Unterarmstütz)
  if (cfg.reach) {
    const Q = { ...P }, key = cfg.reach.pt || "to", goal = key === "to" ? 3.4 : 3.9;
    for (const i of [1, 2]) {
      let lo = -(cfg.reach.max || 45), hi = cfg.reach.max || 45;
      const yAt = dt => { const T = { ...Q, ["t" + i]: P["t" + i] + dt, ["s" + i]: P["s" + i] + dt, ["ft" + i]: P["ft" + i] + dt }; return build(T, cfg)[key + i].y + d.y; };
      const dir = Math.sign(yAt(5) - yAt(-5)) || 1;
      for (let n = 0; n < 24; n++) { const mid = (lo + hi) / 2; if ((yAt(mid) - goal) * dir > 0) hi = mid; else lo = mid; }
      const dt = (lo + hi) / 2;
      Q["t" + i] = P["t" + i] + dt; Q["s" + i] = P["s" + i] + dt; Q["ft" + i] = P["ft" + i] + dt;
    }
    j = build(Q, cfg); d = anchorShift(j, an);
  }
  for (const k in j) j[k].add(d);
  // pin: Fußgelenk bleibt an einer festen Stelle (z. B. hinterer Fuß auf der Bank); Knie wird passend berechnet
  for (const i in cfg.pin || {}) {
    const pn = cfg.pin[i], H = j["hp" + i], foot = new THREE.Vector3().subVectors(j["to" + i], j["an" + i]);
    const A = new THREE.Vector3(pn.at[0], pn.at[1], j["an" + i].z);
    const dx = A.x - H.x, dy = A.y - H.y, dist = Math.min(Math.hypot(dx, dy), L.th + L.sh - 0.01);
    const base = Math.atan2(dy, dx), off = Math.acos(Math.min(1, (L.th * L.th + dist * dist - L.sh * L.sh) / (2 * L.th * dist)));
    const cand = [base + off, base - off].map(b => new THREE.Vector3(H.x + Math.cos(b) * L.th, H.y + Math.sin(b) * L.th, (H.z + A.z) / 2));
    const K = pn.knee === "down" ? (cand[0].y < cand[1].y ? cand[0] : cand[1]) : pn.knee === "up" ? (cand[0].y > cand[1].y ? cand[0] : cand[1]) : (cand[0].x > cand[1].x ? cand[0] : cand[1]);
    j["k" + i].copy(K); j["an" + i].copy(A); j["to" + i].copy(A).add(foot);
  }
  // Füße am Boden flach aufsetzen statt in den Boden zu zeigen
  for (const i of [1, 2]) {
    const A = j["an" + i], T = j["to" + i];
    const fy = (cfg.feetY?.[i] ?? 0) + 3.4;
    if (T.y < fy && A.y < fy + 12 && !cfg.noFlat) {
      const h = new THREE.Vector3(T.x - A.x, 0, T.z - A.z);
      const drop = Math.min(L.ft, Math.max(0, A.y - fy));
      const fl = Math.sqrt(Math.max(1, L.ft * L.ft - drop * drop));
      T.copy(A).addScaledVector(h.normalize(), fl); T.y = A.y - drop;
    }
  }
  j.hm = j.h1.clone().add(j.h2).multiplyScalar(0.5);
  return j;
}

// ---------- Technik-Hinweise: Werte berechnen ----------
const active = (d, t) => d.when === "A" ? t < 0.15 : d.when === "B" ? t > 0.85 : true;
const inRange = (d, deg) => (d.min == null || deg >= d.min - 0.5) && (d.max == null || deg <= d.max + 0.5);
function calc(d, j, t) {
  const on = active(d, t);
  switch (d.k) {
    case "dir": { const deg = REF[d.ref].angleTo(tmp.subVectors(j[d.b], j[d.a])) * DEG; return { deg, st: on ? +inRange(d, deg) : -1, text: `${d.name} ${Math.round(deg)}°` }; }
    case "angle": { const deg = tmp.subVectors(j[d.a], j[d.at]).angleTo(tmp2.subVectors(j[d.b], j[d.at])) * DEG; return { deg, st: on ? +inRange(d, deg) : -1, text: `${d.name} ${Math.round(deg)}°` }; }
    case "straight": { const deg = tmp.subVectors(j[d.a], j[d.at]).angleTo(tmp2.subVectors(j[d.b], j[d.at])) * DEG; return { deg, st: on ? +(deg >= d.min - 0.5) : -1, text: d.label }; }
    case "plumb": { const off = Math.abs(j[d.p].x - j[d.ref].x - (d.dx || 0)); return { deg: off, st: on ? +(off <= d.tol) : -1, text: d.label }; }
    case "track": { const sd = d.side, sg = sd === 1 ? 1 : -1, a = j["hp" + sd], b = j["to" + sd], k = j["k" + sd]; const t0 = (k.y - b.y) / ((a.y - b.y) || 1), zl = b.z + (a.z - b.z) * t0, off = (k.z - zl) * sg; return { deg: off, st: on ? +(off > -3) : -1, text: "Knie über Fußspitze" }; } // nach innen = Problem
    case "level": { const v = tmp.subVectors(j[d.b], j[d.a]); const deg = Math.asin(Math.min(1, Math.abs(v.y) / (v.length() || 1))) * DEG; return { deg, st: on ? (d.max != null ? +(deg <= d.max + 0.5) : 2) : -1, text: `${d.name} ${Math.round(deg)}°` }; }
    case "heel": { const y = Math.max(...(d.sides || [1, 2]).map(i => j["an" + i].y)); return { deg: y, st: on ? +(y < 9) : -1, text: d.label || "Fersen am Boden" }; }
    case "spine": return { st: 1, text: d.label || "Rücken gerade" };
    case "mark": return { st: 2, text: d.label };
  }
  return { st: -1, text: "" };
}
// Für Tests: welche Hinweise werden im Bewegungsablauf gelb?
export function checkHints(ex) {
  const out = [];
  (H3[ex.id] || []).forEach(h => h.draw.forEach(d => {
    let lo = Infinity, hi = -Infinity, warn = 0;
    for (let t = 0; t <= 1.0001; t += 0.02) { const r = calc(d, joints(ex, t), t); if (r.deg != null && r.st !== -1) { lo = Math.min(lo, r.deg); hi = Math.max(hi, r.deg); } if (r.st === 0) warn++; }
    out.push({ hint: h.t, k: d.k, lo: Math.round(lo), hi: Math.round(hi), warn });
  }));
  return out;
}

function makeHints(scene, defs, C, wrap) {
  const tube = new THREE.CylinderGeometry(1, 1, 1, 12), ball = new THREE.SphereGeometry(1, 16, 12);
  const mats = [];
  const mat = (c, op = 0.95) => { const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthTest: false, depthWrite: false }); mats.push(m); return m; };
  const mk = (geo, m) => { const x = new THREE.Mesh(geo, m); x.renderOrder = 10; x.visible = false; scene.add(x); return x; };
  const items = [];
  const label = () => { const el = document.createElement("div"); el.className = "v3lab"; el.hidden = true; wrap.appendChild(el); return { el, k: "" }; };
  const ICO = { 1: ["ok", "✓"], 0: ["warn", "!"], [-1]: ["neu", "·"], 2: ["neu", "i"] };
  const setLab = (L, st, text) => { const k = st + text; if (L.k !== k) { L.k = k; L.el.innerHTML = `<i class="${ICO[st][0]}">${ICO[st][1]}</i>`; L.el.append(text); } };
  const col = st => st === 1 ? C.ok : st === 0 ? C.warn : C.guide;
  const paint = (objs, st) => { for (const o of objs) o.material.color.set(col(st)); };

  function arc(o, p, u, v, r) {
    const ang = u.angleTo(v);
    if (Math.abs(ang - (o.ang ?? -1)) > 0.004) {
      o.fill.geometry.dispose(); o.edge.geometry.dispose();
      o.fill.geometry = new THREE.CircleGeometry(r, 32, 0, ang);
      o.edge.geometry = new THREE.RingGeometry(r - 0.9, r + 0.6, 32, 1, 0, ang);
      o.ang = ang;
    }
    const x = u.clone().normalize(), y = v.clone().addScaledVector(x, -v.dot(x));
    if (y.lengthSq() < 1e-6) y.set(0, 0, 1).cross(x);
    y.normalize();
    const z = new THREE.Vector3().crossVectors(x, y);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    for (const m of [o.fill, o.edge]) { m.position.copy(p); m.quaternion.copy(q); }
  }
  const newArc = () => ({ fill: mk(new THREE.BufferGeometry(), mat(C.ok, 0.28)), edge: mk(new THREE.BufferGeometry(), mat(C.ok)) });

  defs.forEach((h, hi) => {
    for (const d of h.draw) {
      const it = { hi, objs: [], lab: label(), pos: new THREE.Vector3() };
      let draw;
      if (d.k === "spine") {
        const t = mk(tube, mat(C.ok)); it.objs.push(t);
        draw = j => {
          const dir = tmp.subVectors(j.sh, j.hip).normalize(), off = new THREE.Vector3(-dir.y, dir.x, 0).multiplyScalar(11);
          const a = j.hip.clone().add(off).addScaledVector(dir, -4), b = j.hd.clone().add(off);
          seg(t, a, b, 0.9); it.pos.lerpVectors(a, b, 0.7).addScaledVector(off, 1.3);
        };
      } else if (d.k === "dir") {
        const ref = mk(tube, mat(C.guide, 0.8)), A = newArc(); it.objs.push(ref, A.fill, A.edge); it.paint = [A.fill, A.edge];
        draw = j => {
          const p = j[d.a], r = REF[d.ref];
          seg(ref, p, p.clone().addScaledVector(r, 30), 0.5);
          arc(A, p, r.clone(), new THREE.Vector3().subVectors(j[d.b], p), 19);
          it.pos.copy(p).addScaledVector(r, 18).add(new THREE.Vector3(20, 0, 10));
        };
      } else if (d.k === "angle") {
        const A = newArc(); it.objs.push(A.fill, A.edge); it.paint = [A.fill, A.edge];
        draw = j => {
          const p = j[d.at];
          arc(A, p, new THREE.Vector3().subVectors(j[d.a], p), new THREE.Vector3().subVectors(j[d.b], p), 16);
          it.pos.copy(p).add(new THREE.Vector3(15, 9, 6));
        };
      } else if (d.k === "straight") {
        const t = mk(tube, mat(C.guide, 0.8)), dot = mk(ball, mat(C.ok)); dot.scale.setScalar(3); it.objs.push(t, dot); it.paint = [dot];
        draw = j => {
          const o = d.off ? new THREE.Vector3(...d.off) : null;
          const put = p => o ? p.clone().add(o) : p.clone().setZ(22);
          seg(t, put(j[d.a]), put(j[d.b]), 0.6); dot.position.copy(put(j[d.at]));
          it.pos.copy(put(j[d.at])).add(new THREE.Vector3(0, 14, 0));
        };
      } else if (d.k === "plumb") {
        const t = mk(tube, mat(C.guide, 0.8)), dot = mk(ball, mat(C.ok)); dot.scale.setScalar(3); it.objs.push(t, dot); it.paint = [dot];
        draw = j => {
          const p = j[d.p], r = j[d.ref], z = p.z + 3, top = Math.max(p.y, r.y) + 22, rx = r.x + (d.dx || 0);
          seg(t, new THREE.Vector3(rx, 0, z), new THREE.Vector3(rx, top, z), 0.55);
          dot.position.copy(p).setZ(z);
          it.pos.copy(p).add(new THREE.Vector3(12, 8, 6));
        };
      } else if (d.k === "track") {
        const t = mk(tube, mat(C.guide, 0.85)), dot = mk(new THREE.TorusGeometry(4.2, 0.7, 8, 24), mat(C.ok));
        it.objs.push(t, dot); it.paint = [dot];
        if (d.side !== 1 && h.draw.some(x => x.k === "track" && x.side === 1)) { it.lab.el.remove(); it.lab = null; }
        draw = j => {
          const s = d.side;
          seg(t, j["hp" + s], j["to" + s], 0.6);
          dot.position.copy(j["k" + s]); dot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0));
          it.pos.copy(j["k" + s]).add(new THREE.Vector3(0, 6, 8));
        };
      } else if (d.k === "heel") {
        const sides = d.sides || [1, 2];
        const discs = sides.map(() => { const m = mk(new THREE.CircleGeometry(6, 28), mat(C.ok, 0.55)); m.rotation.x = -Math.PI / 2; return m; });
        it.objs.push(...discs); it.paint = discs;
        draw = j => {
          discs.forEach((m, i) => { const an = j["an" + sides[i]]; m.position.set(an.x - 1, 0.4, an.z); });
          it.pos.copy(j["an" + sides[0]]).add(new THREE.Vector3(-6, 10, 6));
        };
      } else if (d.k === "level") {
        const t = mk(tube, mat(C.guide, 0.9)), ref = mk(tube, mat(C.guide, 0.35)); it.objs.push(t, ref); it.paint = [t];
        draw = j => {
          const a = j[d.a], b = j[d.b], v = new THREE.Vector3().subVectors(b, a).multiplyScalar(0.6);
          seg(t, a.clone().sub(v), b.clone().add(v), 0.8);
          const flat = v.clone(); flat.y = 0;
          seg(ref, a.clone().sub(flat), a.clone().add(flat).add(flat).add(new THREE.Vector3().subVectors(b, a).setY(0)), 0.4);
          it.pos.copy(b).add(v).add(new THREE.Vector3(8, 10, 0));
        };
      } else if (d.k === "mark") {
        const dot = mk(new THREE.SphereGeometry(1, 16, 12), mat(C.guide, 0.5)); dot.scale.setScalar(4.5); it.objs.push(dot);
        draw = j => { dot.position.copy(j[d.p]); it.pos.copy(j[d.p]).add(new THREE.Vector3(10, 10, 8)); };
      } else continue;
      it.upd = (j, t) => {
        draw(j);
        const r = calc(d, j, t);
        if (it.paint) paint(it.paint, r.st);
        if (it.lab) setLab(it.lab, r.st, r.text);
      };
      items.push(it);
    }
  });

  let show = -2; // -2 = aus, sonst Nummer des Hinweises
  const P = new THREE.Vector3();
  return {
    set(v) { show = v; for (const it of items) { const on = show === it.hi; for (const o of it.objs) o.visible = on; if (it.lab) it.lab.el.hidden = !on; } },
    update(j, t) { if (show === -2) return; for (const it of items) if (show === it.hi) it.upd(j, t); },
    place(camera, w, h) {
      if (show === -2) return;
      for (const it of items) {
        if (!it.lab || it.lab.el.hidden) continue;
        P.copy(it.pos).project(camera);
        it.lab.el.style.transform = `translate(${((P.x + 1) / 2 * w).toFixed(1)}px,${((1 - P.y) / 2 * h).toFixed(1)}px) translate(-50%,-50%)`;
      }
    },
    dispose() { tube.dispose(); ball.dispose(); for (const m of mats) m.dispose(); },
  };
}

function colors() {
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;background:var(--card);color:var(--ink);border-color:var(--line)";
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe), out = { bg: cs.backgroundColor, ink: cs.color, line: cs.borderTopColor };
  probe.remove();
  const dark = new THREE.Color(out.bg).getHSL({}).l < 0.3;
  return { ...out, dark, body: dark ? "#cfcfd6" : "#3b3b42", joint: dark ? "#e9e9ee" : "#26262b", acc: "#ff5a1f",
    ok: dark ? "#3ccf7c" : "#1f9d55", warn: dark ? "#ffc53d" : "#e0a100", guide: dark ? "#6cb4ff" : "#2f7cf6",
    prop: dark ? "#3a3a41" : "#d3d3da", wall: dark ? "#2c2c31" : "#e2e2e7", metal: dark ? "#9a9aa3" : "#7d7d86", pad: dark ? "#55555d" : "#2f2f35",
    floor: dark ? "#232327" : "#e8e8ec" };
}

function buildScene(ex, C) {
  const cfg = X3[ex.id] || {};
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.bg);
  scene.add(new THREE.HemisphereLight(0xffffff, C.dark ? 0x202024 : 0xb8b8c0, C.dark ? 1.1 : 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, C.dark ? 2.2 : 2.4);
  sun.position.set(60, 160, 90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -130, right: 130, top: 190, bottom: -130, near: 10, far: 450 });
  sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6);
  fill.position.set(-80, 60, -60);
  scene.add(fill);

  // Boden: runde Fläche plus weicher Schatten
  const floor = new THREE.Mesh(new THREE.CircleGeometry(115, 64), new THREE.MeshStandardMaterial({ color: C.floor, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const std = (c, r = 0.5, m = 0.05) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const mBody = std(C.body), mJoint = std(C.joint, 0.45), mAcc = std(C.acc, 0.4, 0.1), mProp = std(C.prop, 0.8),
    mWall = Object.assign(std(C.wall, 0.95), { transparent: true, opacity: 0.9 }), mMetal = std(C.metal, 0.35, 0.6), mPad = std(C.pad, 0.7);

  const cyl = new THREE.CylinderGeometry(1, 1, 1, 20, 1, true), rod = new THREE.CylinderGeometry(1, 1, 1, 14);
  const sph = new THREE.SphereGeometry(1, 24, 16);
  const add = (geo, mat, cast = true, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
  const boxAt = (w, h, d, x, y, z, mat, cast = true) => { const m = add(new THREE.BoxGeometry(w, h, d), mat, cast); m.position.set(x, y, z); return m; };
  const rodFix = (a, b, r, mat) => { const m = add(rod, mat); seg(m, a, b, r); return m; };

  // Körperteile: [von, nach, Dicke]
  const LIMBS = [];
  for (const i of [1, 2]) LIMBS.push(
    ["sh" + i, "el" + i, 4.3], ["el" + i, "h" + i, 3.6],
    ["hp" + i, "k" + i, 6.2], ["k" + i, "an" + i, 4.8], ["an" + i, "to" + i, 3.4]);
  const JOINTS = [];
  for (const i of [1, 2]) JOINTS.push(["sh" + i, 5.2], ["el" + i, 3.9], ["h" + i, 3.9], ["hp" + i, 6.4], ["k" + i, 5.1], ["an" + i, 3.9], ["to" + i, 3.4]);
  const limbs = LIMBS.map(([a, b, r]) => ({ a, b, r, m: add(cyl, mBody) }));
  const balls = JOINTS.map(([k, r]) => { const m = add(sph, mJoint); m.scale.setScalar(r); return { k, m }; });
  const torso = add(new THREE.CylinderGeometry(1, 0.8, 1, 28), mBody);
  const chest = add(sph, mBody), pelvis = add(sph, mBody), neck = add(cyl, mBody), head = add(sph, mBody);

  // Geräte. Feste Teile werden einmal gebaut, bewegte (Hanteln, Kabel …) folgen den Händen.
  // Zu jedem Gerät merkt sich solids() die Form, damit audit() prüfen kann, ob etwas im Körper steckt.
  const props = [], walls = [], solids = [];
  const hz = cfg.hz ?? SW + 1.5;
  const handPt = (k, j) => (k === "h1" || k === "h2") && cfg.sym ? j.hm : j[k];
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const P3 = p => Array.isArray(p) ? V3(...p) : p;
  const staticBox = (w, h, d, x, y, z, mat, cast = true) => {
    const m = boxAt(w, h, d, x, y, z, mat, cast);
    const bx = new THREE.Box3(V3(x - w / 2, y - h / 2, z - d / 2), V3(x + w / 2, y + h / 2, z + d / 2));
    solids.push(() => [{ box: bx }]);
    return m;
  };
  const addWall = (w, h, d, x, z, axis) => {
    const m = boxAt(w, h, d, x, h / 2, z, mWall.clone(), false);
    m.renderOrder = 5; m.userData.axis = axis; walls.push(m); // wird durchsichtig, wenn sie zwischen Kamera und Figur steht
  };
  const dumbbell = (k, axis) => {
    const g = new THREE.Group();
    add(new THREE.CylinderGeometry(1.1, 1.1, 14, 12), mMetal, true, g);
    for (const dz of [-6, 6]) { const w = add(new THREE.CylinderGeometry(4.2, 4.2, 3.2, 20), mAcc, true, g); w.position.y = dz; }
    if (axis === "x") g.rotation.z = Math.PI / 2; else g.rotation.x = Math.PI / 2;
    scene.add(g);
    const ax = axis === "x" ? V3(1, 0, 0) : V3(0, 0, 1);
    props.push(j => g.position.copy(j[k]));
    solids.push(j => [{ seg: [j[k].clone().addScaledVector(ax, -7.6), j[k].clone().addScaledVector(ax, 7.6)], r: 4.2, held: true }]);
  };
  const cable = (f, to) => {
    const pul = add(sph, mPad); pul.scale.setScalar(2.4); pul.position.copy(f);
    const line = add(rod, mMetal);
    props.push(j => seg(line, f, typeof to === "string" ? j[to] : P3(to), 0.45));
  };
  const band = (a, b) => { const m = add(rod, mAcc); const pt = (k, j) => typeof k === "string" ? j[k] : P3(k); props.push(j => seg(m, pt(a, j), pt(b, j), 1.1)); };

  let cableN = 0;
  // Eigene 3D-Geräte (für Übungen mit eigenen 3D-Posen)
  for (const pr of cfg.props3 || []) {
    if (pr.t === "box") staticBox(...pr.s, ...pr.c, pr.m === "pad" ? mPad : mProp);
    else if (pr.t === "mat") boxAt(...pr.s, ...pr.c, mProp, false);
    else if (pr.t === "wall") addWall(...pr.s, pr.c[0], pr.c[2], pr.axis || "x");
    else if (pr.t === "rod") rodFix(P3(pr.a), P3(pr.b), pr.r || 1.6, mMetal);
    else if (pr.t === "db") for (const k of pr.at) dumbbell(k, pr.axis || "z");
    else if (pr.t === "cable") cable(P3(pr.from), pr.to);
    else if (pr.t === "band") band(pr.a, pr.b);
  }
  for (const pr0 of cfg.props3 ? [] : ex.props || []) {
    const pr = { ...pr0, ...(cfg.pfix?.[(ex.props || []).indexOf(pr0)] || {}) };
    if (pr.t === "box") {
      const h = 124 - pr.y;
      if (pr.w <= 8 && h > 100) addWall(pr.w, h, 120, pr.x + pr.w / 2 - 100, 0, "x");
      else staticBox(pr.w, h, 40, pr.x + pr.w / 2 - 100, h / 2, cfg.boxZ || 0, mProp);
    } else if (pr.t === "bench") {
      const top = 124 - pr.y, z = cfg.benchZ || 0;
      staticBox(pr.w, 6, 26, pr.x + pr.w / 2 - 100, top - 3, z, mPad);
      for (const dx of [6, pr.w - 6]) boxAt(4, top - 6, 18, pr.x + dx - 100, (top - 6) / 2, z, mMetal);
    } else if (pr.t === "mat") {
      boxAt(pr.w ?? 140, 1.6, 54, (pr.x ?? 30) + (pr.w ?? 140) / 2 - 100, 0.8, 0, mProp, false);
    } else if (pr.t === "bar") {
      const y = 124 - pr.y, x1 = pr.x1 - 100, x2 = pr.x2 - 100;
      if (pr.posts) { // Barren / Parallettes: zwei Holme nach vorn
        for (const s of [1, -1]) {
          const z = s * hz;
          rodFix(V3(x1, y, z), V3(x2, y, z), 1.8, mMetal);
          for (const x of [x1 + 4, x2 - 4]) rodFix(V3(x, 0, z), V3(x, y, z), 1.4, mMetal);
        }
      } else { // Klimmzugstange quer, mit Pfosten
        const x = (x1 + x2) / 2, L = Math.max(hz + 16, 42);
        rodFix(V3(x, y, -L), V3(x, y, L), 1.6, mMetal);
        for (const z of [-L, L]) rodFix(V3(x, 0, z), V3(x, y + 4, z), 2, mMetal);
      }
    } else if (pr.t === "kb") {
      const g = new THREE.Group();
      const bell = add(new THREE.SphereGeometry(6.5, 24, 16), mAcc, true, g); bell.position.y = -8;
      const handle = add(new THREE.TorusGeometry(4.2, 1.1, 10, 24, Math.PI), mAcc, true, g); handle.position.y = -3.5;
      scene.add(g);
      props.push(j => g.position.copy(j.hm));
      solids.push(j => [{ sph: j.hm.clone().add(V3(0, -8, 0)), r: 6.5, held: true }]);
    } else if (pr.t === "db") {
      for (const k of pr.at || ["h1"]) dumbbell(k, cfg.dbAxis || "z");
    } else if (pr.t === "plate") {
      const g = new THREE.Group(), pad = (pr.r || 10) <= 6;
      const L = 62, pz = Math.max(hz + 18, 40);
      if (pad) { // Polster einer Maschine
        const m = add(new THREE.CylinderGeometry(4.5, 4.5, 2 * FW + 14, 20), mPad, true, g); m.rotation.x = Math.PI / 2;
      } else { // Langhantel quer mit Scheiben
        const bar = add(new THREE.CylinderGeometry(1.3, 1.3, 2 * L, 14), mMetal, true, g); bar.rotation.x = Math.PI / 2;
        for (const s of [1, -1]) {
          const p = add(new THREE.CylinderGeometry(pr.r, pr.r, 5, 32), mAcc, true, g); p.rotation.x = Math.PI / 2; p.position.z = s * pz;
          const c = add(new THREE.CylinderGeometry(2.6, 2.6, 3, 16), mMetal, true, g); c.rotation.x = Math.PI / 2; c.position.z = s * (pz - 4.5);
        }
      }
      scene.add(g);
      const at = j => { const p = handPt(pr.at, j); return V3(p.x, p.y - (pr.dy || 0), 0); };
      props.push(j => g.position.copy(at(j)));
      if (!pad) solids.push(j => { const c = at(j); return [
        { seg: [c.clone().setZ(-L), c.clone().setZ(L)], r: 1.3, held: pr.at[0] === "h" },
        { seg: [c.clone().setZ(pz - 2.5), c.clone().setZ(pz + 2.5)], r: pr.r }, { seg: [c.clone().setZ(-pz - 2.5), c.clone().setZ(-pz + 2.5)], r: pr.r }]; });
    } else if (pr.t === "cable") {
      const from = cfg.cfrom?.[cableN] ? V3(...cfg.cfrom[cableN]) : v2(pr.from);
      cableN++;
      const each = cfg.grip === "each" && typeof pr.to === "string" && pr.to[0] === "h";
      if (each) for (const [s, k] of [[1, "h1"], [-1, "h2"]]) cable(from.clone().setZ(s * hz), k);
      else cable(from, typeof pr.to === "string" ? (cfg.grip === "mid" && pr.to[0] === "h" ? "hm" : pr.to) : v2(pr.to));
    } else if (pr.t === "handle") {
      if (cfg.grip === "each") {
        for (const k of ["h1", "h2"]) { const r = add(new THREE.TorusGeometry(3.6, 0.9, 10, 24), mPad); props.push(j => r.position.copy(j[k])); }
      } else {
        const L = Math.max(2 * hz + 14, 16), m = add(new THREE.CylinderGeometry(1.2, 1.2, L, 12), mMetal); m.rotation.x = Math.PI / 2;
        props.push(j => m.position.copy(j.hm));
      }
    } else if (pr.t === "band") band(pr.a, typeof pr.b === "string" ? pr.b : v2(pr.b));
  }

  function pose(j) {
    for (const l of limbs) seg(l.m, j[l.a], j[l.b], l.r);
    for (const b of balls) b.m.position.copy(j[b.k]);
    // Rumpf: unten schmaler (Becken), oben breiter (Brustkorb). Ausrichtung aus Wirbelsäule und Schulterlinie.
    const top = j.sh, bot = j.hip;
    const y = new THREE.Vector3().subVectors(top, bot), len = y.length() || 0.001; y.divideScalar(len);
    const z = new THREE.Vector3().subVectors(j.sh1, j.sh2); z.addScaledVector(y, -z.dot(y)).normalize();
    const x = new THREE.Vector3().crossVectors(y, z);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    torso.position.lerpVectors(bot, top, 0.5); torso.quaternion.copy(q); torso.scale.set(8.2, len, 14.5);
    chest.position.copy(top); chest.quaternion.copy(q); chest.scale.set(8.2, 6, 16);
    const zp = new THREE.Vector3().subVectors(j.hp1, j.hp2); zp.addScaledVector(y, -zp.dot(y)).normalize();
    const qp = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(y, zp), y, zp));
    pelvis.position.copy(bot); pelvis.quaternion.copy(qp); pelvis.scale.set(8.2, 6.5, 11.5);
    tmp.subVectors(j.hd, j.sh).normalize();
    seg(neck, j.sh, tmp2.copy(j.sh).addScaledVector(tmp, 9), 3.4);
    head.position.copy(j.hd); head.quaternion.copy(q); head.scale.set(8.4, 9.6, 8);
    for (const p of props) p(j);
  }
  // Wände zwischen Kamera und Figur fast unsichtbar machen
  const seeThrough = (cam, f) => { for (const w of walls) { const a = w.userData.axis; const between = (cam[a] - w.position[a]) * (f[a] - w.position[a]) < 0; w.material.opacity = between ? 0.12 : 0.9; w.material.depthWrite = !between; } };
  return { scene, pose, seeThrough, solids };
}

// Bildausschnitt: Mitte und Größe aus Anfangs- und Endpose
function framing(ex) {
  const bb = new THREE.Box3();
  for (const t of [0, 0.5, 1]) for (const p of Object.values(joints(ex, t))) bb.expandByPoint(p);
  for (const pr of ex.props || []) if ((pr.t === "box" && !(pr.w <= 8 && 124 - pr.y > 100)) || pr.t === "bench") { bb.expandByPoint(new THREE.Vector3(pr.x - 100, 0, 0)); bb.expandByPoint(new THREE.Vector3(pr.x + pr.w - 100, 0, 0)); }
  for (const pr of (X3[ex.id] || {}).props3 || []) if (pr.t === "box" || pr.t === "mat") { bb.expandByPoint(new THREE.Vector3(pr.c[0] - pr.s[0] / 2, 0, pr.c[2] - pr.s[2] / 2)); bb.expandByPoint(new THREE.Vector3(pr.c[0] + pr.s[0] / 2, pr.c[1] + pr.s[1] / 2, pr.c[2] + pr.s[2] / 2)); }
  bb.expandByPoint(new THREE.Vector3(bb.min.x, 0, 0));
  const target = bb.getCenter(new THREE.Vector3());
  const size = bb.getSize(new THREE.Vector3());
  return { target, span: Math.max(size.x, size.z, 60), base: Math.max(size.x, size.y, 135) * 0.5 / Math.tan((34 / 2) * Math.PI / 180) * 1.45 };
}

// Prüft über den ganzen Bewegungsablauf: Stecken Geräte im Körper? Ist etwas unter dem Boden?
export function audit(ex) {
  const C = { bg: "#fff", ok: "#0f0", warn: "#ff0", guide: "#00f" };
  const { scene, solids } = buildScene(ex, { ...C, body: "#888", joint: "#888", acc: "#f60", prop: "#ccc", wall: "#ddd", metal: "#999", pad: "#333", floor: "#eee" });
  scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  const BODY = [];
  for (const i of [1, 2]) BODY.push(["sh" + i, "el" + i, 4.3, "arm"], ["el" + i, "h" + i, 3.6, "hand"], ["hp" + i, "k" + i, 6.2, "leg"], ["k" + i, "an" + i, 4.8, "leg"], ["an" + i, "to" + i, 3.4, "leg"], ["hp" + i, "ts" + i, 6.5, "torso"]);
  const RJ = { hd: 9, sh1: 5.2, sh2: 5.2, el1: 3.9, el2: 3.9, h1: 3.9, h2: 3.9, hp1: 6.4, hp2: 6.4, k1: 5.1, k2: 5.1, an1: 3.9, an2: 3.9, to1: 3.4, to2: 3.4 };
  const worst = {};
  const note = (k, d, t) => { if (d > 2 && (!worst[k] || worst[k].d < d)) worst[k] = { d: Math.round(d * 10) / 10, t: Math.round(t * 100) / 100 }; };
  const ln = new THREE.Line3(), cp = new THREE.Vector3();
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const j = joints(ex, t);
    for (const i of [1, 2]) j["ts" + i] = j.sh.clone().lerp(j["sh" + i], 0.62); // Brustkorb-Rand
    for (const k in RJ) note("Boden: " + k, RJ[k] - j[k].y, t);
    const shapes = solids.flatMap(f => f(j));
    for (const [a, b, r, tag] of BODY) {
      for (let u = 0; u <= 1.0001; u += 0.1) {
        const p = j[a].clone().lerp(j[b], u);
        shapes.forEach((sh, si) => {
          if (sh.held && tag === "hand") return;
          let d;
          if (sh.box) d = r - sh.box.distanceToPoint(p);
          else if (sh.sph) d = r + sh.r - sh.sph.distanceTo(p);
          else { ln.set(sh.seg[0], sh.seg[1]); ln.closestPointToPoint(p, true, cp); d = r + sh.r - cp.distanceTo(p); }
          note(`Gerät ${si} in ${a}-${b}`, d, t);
        });
      }
    }
  }
  return worst;
}

// Standbild einer Übung (für Tests und später für die kleinen Vorschaubilder)
export function snap(ex, t = 1, azDeg = 42, elDeg = 14, w = 240, h = 220) {
  const C = colors();
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(w, h, false);
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const { scene, pose, seeThrough } = buildScene(ex, C);
  pose(joints(ex, t));
  const { target, base } = framing(ex);
  const cam = new THREE.PerspectiveCamera(34, w / h, 1, 2000), az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  cam.position.set(target.x + base * Math.cos(el) * Math.sin(az), target.y + base * Math.sin(el), target.z + base * Math.cos(el) * Math.cos(az));
  cam.lookAt(target);
  seeThrough(cam.position, target);
  r.render(scene, cam);
  const url = r.domElement.toDataURL("image/png");
  scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  r.dispose(); r.forceContextLoss();
  return url;
}

let cur = null;

export function open3d(ex, opts = {}) {
  if (cur) cur.close();
  const C = colors();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = document.createElement("div");
  box.className = "v3d";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "3D-Ansicht: " + ex.name);
  box.innerHTML = `<div class="v3bar"><b></b><button class="icon" data-v3="close" aria-label="3D-Ansicht schließen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
  <div class="v3can"><div class="v3hint">Mit einem Finger drehen · mit zwei Fingern zoomen</div></div>
  <div class="v3ctl">
    <div class="seg v3views"><button data-view="front">Vorne</button><button data-view="diag">Schräg</button><button data-view="side">Seite</button><button data-view="top">Oben</button></div>
    <div class="v3hints" hidden><div class="chips v3chips"></div><p class="v3txt"></p></div>
    <div class="v3row"><button class="cta sec" data-v3="play"></button><button class="cta sec" data-v3="slow" aria-pressed="false">Zeitlupe</button></div>
  </div>`;
  box.querySelector(".v3bar b").textContent = ex.name;
  const defs = H3[ex.id];
  if (defs) {
    const row = box.querySelector(".v3row");
    row.classList.add("three");
    row.insertAdjacentHTML("beforeend", '<button class="cta sec" data-v3="hints" aria-pressed="false">Hinweise</button>');
    const ch = box.querySelector(".v3chips");
    ch.innerHTML = defs.map((h, i) => `<button class="chip" data-hint="${i}" aria-pressed="false"></button>`).join("");
    defs.forEach((h, i) => { ch.querySelector(`[data-hint="${i}"]`).textContent = h.t; });
  }
  document.body.appendChild(box);
  const wrap = box.querySelector(".v3can");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
  } catch (e) {
    box.remove();
    throw e;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  wrap.prepend(renderer.domElement);

  const { scene, pose, seeThrough } = buildScene(ex, C);
  const hints = defs ? makeHints(scene, defs, C, wrap) : null;
  const camera = new THREE.PerspectiveCamera(34, 1, 1, 2000);

  const { target, base, span } = framing(ex);
  for (const b of box.querySelectorAll("[data-view]")) b.setAttribute("aria-pressed", String(b.dataset.view === ((X3[ex.id] || {}).view0 || "diag")));

  const VIEWS = { front: [90, 6], diag: [42, 14], side: [0, 4], top: [30, 72], back: [-90, 10], fdiag: [65, 12] };
  const rad = Math.PI / 180, v0 = VIEWS[(X3[ex.id] || {}).view0 || "diag"];
  let az = v0[0] * rad, el = v0[1] * rad, dist = base;
  let azT = az, elT = el, distT = dist;

  let playing = !reduce, slow = false, ph = reduce ? 0.5 : 0, last = performance.now(), raf = 0, dirty = true;
  const playBtn = box.querySelector('[data-v3="play"]'), slowBtn = box.querySelector('[data-v3="slow"]');
  const setPlay = () => { playBtn.textContent = playing ? "Anhalten" : "Abspielen"; playBtn.setAttribute("aria-pressed", String(!playing)); };
  setPlay();

  function resize() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Hochformat: weiter weg, damit die ganze Figur reinpasst
    camera.userData.fit = Math.max(1, span * 0.5 * 1.2 / (Math.tan(17 * Math.PI / 180) * (w / h)) / base);
    camera.updateProjectionMatrix();
    dirty = true;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(wrap);
  resize();

  const ease = p => { let x = p < 0.5 ? p * 2 : 2 - p * 2; x = Math.min(1, Math.max(0, (x - 0.12) / 0.76)); return x * x * (3 - 2 * x); };

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (playing) { ph = (ph + dt / (slow ? 8 : 3.2)) % 1; dirty = true; }
    let d = azT - az; d = Math.atan2(Math.sin(d), Math.cos(d));
    if (Math.abs(d) > 1e-4 || Math.abs(elT - el) > 1e-4 || Math.abs(distT - dist) > 0.05) {
      const k = 1 - Math.pow(0.001, dt);
      az += d * k; el += (elT - el) * k; dist += (distT - dist) * k; dirty = true;
    }
    if (dirty) {
      const jj = joints(ex, ease(ph));
      pose(jj);
      if (hints) hints.update(jj, ease(ph));
      const r = dist * (camera.userData.fit || 1);
      camera.position.set(target.x + r * Math.cos(el) * Math.sin(az), target.y + r * Math.sin(el), target.z + r * Math.cos(el) * Math.cos(az));
      camera.lookAt(target);
      seeThrough(camera.position, target);
      renderer.render(scene, camera);
      if (hints) hints.place(camera, wrap.clientWidth, wrap.clientHeight);
      dirty = false;
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  // Drehen und Zoomen mit Finger oder Maus
  const ptr = new Map();
  let pinch0 = 0, dist0 = 0, moved = false;
  const cv = renderer.domElement;
  const hint = box.querySelector(".v3hint");
  const hideHint = () => hint.classList.add("off");
  setTimeout(hideHint, 4000);
  const markViews = v => { for (const b of box.querySelectorAll("[data-view]")) b.setAttribute("aria-pressed", String(b.dataset.view === v)); };
  cv.addEventListener("pointerdown", e => {
    cv.setPointerCapture(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]); moved = false;
    if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); dist0 = distT; }
  });
  cv.addEventListener("pointermove", e => {
    if (!ptr.has(e.pointerId)) return;
    const p = ptr.get(e.pointerId), dx = e.clientX - p[0], dy = e.clientY - p[1];
    ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptr.size === 1) {
      azT -= dx * 0.009; elT = Math.min(85 * rad, Math.max(-5 * rad, elT + dy * 0.007));
      az = azT; el = elT;
    } else if (ptr.size === 2 && pinch0) {
      const [a, b] = [...ptr.values()];
      distT = dist = Math.min(base * 2.2, Math.max(base * 0.45, dist0 * pinch0 / Math.max(20, Math.hypot(a[0] - b[0], a[1] - b[1]))));
    }
    if (Math.abs(dx) + Math.abs(dy) > 1) { moved = true; markViews(""); hideHint(); }
    dirty = true;
  });
  const up = e => { ptr.delete(e.pointerId); if (ptr.size < 2) pinch0 = 0; };
  cv.addEventListener("pointerup", up);
  cv.addEventListener("pointercancel", up);
  cv.addEventListener("wheel", e => { e.preventDefault(); distT = Math.min(base * 2.2, Math.max(base * 0.45, distT * (1 + e.deltaY * 0.0015))); }, { passive: false });
  cv.addEventListener("dblclick", () => { azT = v0[0] * rad; elT = v0[1] * rad; distT = base; markViews((X3[ex.id] || {}).view0 || "diag"); });

  const onKey = e => { if (e.key === "Escape") { e.preventDefault(); close(); } };
  document.addEventListener("keydown", onKey);
  const scheme = matchMedia("(prefers-color-scheme: dark)");

  box.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    e.stopPropagation();
    if (b.dataset.v3 === "close") return close();
    if (b.dataset.v3 === "play") { playing = !playing; setPlay(); dirty = true; return; }
    if (b.dataset.v3 === "slow") { slow = !slow; b.setAttribute("aria-pressed", String(slow)); if (!playing) { playing = true; setPlay(); } return; }
    if (b.dataset.v3 === "hints") {
      const on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", String(on));
      box.querySelector(".v3hints").hidden = !on;
      if (on) pickHint(cur3 < 0 ? 0 : cur3); else hints.set(-2);
      hideHint(); dirty = true; return;
    }
    if (b.dataset.hint) { pickHint(+b.dataset.hint); return; }
    if (b.dataset.view) {
      const [a, v] = VIEWS[b.dataset.view];
      let t = a * rad, d = t - azT; azT += Math.atan2(Math.sin(d), Math.cos(d));
      elT = v * rad; distT = base; markViews(b.dataset.view); hideHint();
    }
  });

  function goView(name) {
    const [a, v] = VIEWS[name];
    const t = a * rad, d = t - azT; azT += Math.atan2(Math.sin(d), Math.cos(d));
    elT = v * rad; distT = base; markViews(name);
  }
  let cur3 = -1;
  function pickHint(i) {
    for (const c of box.querySelectorAll("[data-hint]")) c.setAttribute("aria-pressed", String(+c.dataset.hint === i));
    box.querySelector(".v3txt").textContent = defs[i].txt;
    cur3 = i; hints.set(i); goView(defs[i].view);
    dirty = true;
  }

  const opener = document.activeElement;
  box.querySelector('[data-v3="close"]').focus();
  document.documentElement.classList.add("v3open");

  function close() {
    if (cur !== api) return;
    cur = null;
    cancelAnimationFrame(raf);
    ro.disconnect();
    document.removeEventListener("keydown", onKey);
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    if (hints) hints.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    box.remove();
    document.documentElement.classList.remove("v3open");
    if (opener && opener.isConnected) opener.focus();
    if (opts.onClose) opts.onClose();
  }
  const api = { close };
  cur = api;
  return api;
}
