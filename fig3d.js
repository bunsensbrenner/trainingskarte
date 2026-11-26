// 3D-Ansicht der Übungsfiguren. Wird erst geladen, wenn jemand auf „3D“ tippt.
// Nutzt die Bewegungen aus uebungen.js (Seitenansicht) und macht daraus eine Gliederpuppe im Raum.
import * as THREE from "./lib/three.module.min.js";

// Breiten, die in der Seitenansicht fehlen (gleiche Einheit wie uebungen.js, ca. 1 = 1,2 cm)
const SW = 15, HW = 8.5, FW = 9.5;
// Zusätzliche 3D-Angaben je Übung. hz/ez = halbe Breite zwischen den Händen/Ellbogen.
// sym = beide Körperseiten gleich bewegen (in der Seitenansicht leicht versetzt gezeichnet).
const X3 = {
  goblet: { sym: true, hz: 4.5, ez: 11 },
};

const UP = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
const seg = (m, a, b, r) => {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length() || 0.001;
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.divideScalar(len));
  m.scale.set(r, len, r);
};

// Technik-Hinweise je Übung. Jeder Hinweis: kurzer Name (t), Erklärung (txt), beste Ansicht (view), Zeichnungen (draw).
// Zeichnungen: spine = Linie am Rücken · lean = Vorneigung gegen die Senkrechte (max) · track = Linie Hüfte–Fußspitze
// angle = Gelenkwinkel (at, a, b; ok = Mindestwinkel) · heel = Fersen am Boden
const H3 = {
  goblet: [
    { t: "Rücken", view: "side", txt: "Rücken gerade, Brust aufrecht. Der Oberkörper neigt sich höchstens etwa 45° nach vorn.",
      draw: [{ k: "spine" }, { k: "lean", max: 45 }] },
    { t: "Knie-Linie", view: "front", txt: "Die Knie zeigen über die Fußspitzen und knicken nicht nach innen.",
      draw: [{ k: "track", side: 1 }, { k: "track", side: 2 }] },
    { t: "Kniewinkel", view: "side", txt: "Nur so tief, wie es schmerzfrei geht. Grün heißt: Knie nicht enger als 90°. Gelb: nur, wenn das Knie gut mitmacht.",
      draw: [{ k: "angle", at: "k1", a: "hp1", b: "an1", ok: 90, name: "Knie" }] },
    { t: "Fersen", view: "side", txt: "Die Fersen bleiben die ganze Zeit fest am Boden.",
      draw: [{ k: "heel" }] },
  ],
};
export const hasHints = id => !!H3[id];

function makeHints(scene, defs, C, wrap) {
  const tube = new THREE.CylinderGeometry(1, 1, 1, 12);
  const mats = [];
  const mat = (c, op = 0.95) => { const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthTest: false, depthWrite: false }); mats.push(m); return m; };
  const mk = (geo, m) => { const x = new THREE.Mesh(geo, m); x.renderOrder = 10; x.visible = false; scene.add(x); return x; };
  const items = [];
  const label = () => { const el = document.createElement("div"); el.className = "v3lab"; wrap.appendChild(el); const L = { el, k: "" }; Object.defineProperty(L, "hidden", { get: () => el.hidden, set: v => { el.hidden = v; } }); el.hidden = true; return L; };
  const setLab = (L, ok, text) => { const k = (ok ? "1" : "0") + text; if (L.k !== k) { L.k = k; L.el.innerHTML = `<i class="${ok ? "ok" : "warn"}">${ok ? "✓" : "!"}</i>`; L.el.append(text); } };

  // Winkelbogen zwischen zwei Richtungen u und v an Punkt p
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
    return ang * 180 / Math.PI;
  }
  const newArc = c => ({ fill: mk(new THREE.BufferGeometry(), mat(c, 0.28)), edge: mk(new THREE.BufferGeometry(), mat(c)) });

  defs.forEach((h, hi) => {
    for (const d of h.draw) {
      const it = { hi, objs: [], lab: null, pos: new THREE.Vector3() };
      if (d.k === "spine") {
        const t = mk(tube, mat(C.ok)); it.objs.push(t); it.lab = label();
        it.upd = j => {
          const dir = tmp.subVectors(j.sh, j.hip).normalize(), off = new THREE.Vector3(-dir.y, dir.x, 0).multiplyScalar(11);
          const a = j.hip.clone().add(off).addScaledVector(dir, -4), b = j.hd.clone().add(off);
          seg(t, a, b, 0.9); it.pos.lerpVectors(a, b, 0.7).addScaledVector(off, 1.3);
          setLab(it.lab, true, "Rücken gerade");
        };
      } else if (d.k === "lean") {
        const ref = mk(tube, mat(C.guide, 0.8)), A = newArc(C.ok); it.objs.push(ref, A.fill, A.edge); it.lab = label();
        it.upd = j => {
          const top = j.hip.clone().addScaledVector(UP, 30);
          seg(ref, j.hip, top, 0.5);
          const deg = arc(A, j.hip, UP.clone(), tmp.subVectors(j.sh, j.hip), 20);
          const ok = deg <= d.max + 0.5;
          for (const m of [A.fill, A.edge]) m.material.color.set(ok ? C.ok : C.warn);
          it.pos.copy(j.hip).add(new THREE.Vector3(22, 4, 10));
          setLab(it.lab, ok, `Neigung ${Math.round(deg)}°`);
        };
      } else if (d.k === "track") {
        const t = mk(tube, mat(C.guide, 0.85)), dot = mk(new THREE.TorusGeometry(4.2, 0.7, 8, 24), mat(C.ok));
        it.objs.push(t, dot);
        if (d.side === 1) it.lab = label();
        it.upd = j => {
          const s = d.side, a = j["hp" + s], b = j["to" + s];
          seg(t, a, b, 0.6);
          dot.position.copy(j["k" + s]); dot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0));
          // Abstand des Knies zur Linie (seitlich): grün, solange das Knie auf der Linie bleibt
          const t0 = (j["k" + s].y - b.y) / ((a.y - b.y) || 1), zl = b.z + (a.z - b.z) * t0, ok = Math.abs(j["k" + s].z - zl) < 3;
          dot.material.color.set(ok ? C.ok : C.warn);
          if (it.lab) { it.pos.copy(j["k" + s]).add(new THREE.Vector3(0, 6, 8)); setLab(it.lab, ok, "Knie über Fußspitze"); }
        };
      } else if (d.k === "angle") {
        const A = newArc(C.ok); it.objs.push(A.fill, A.edge); it.lab = label();
        it.upd = j => {
          const p = j[d.at], deg = arc(A, p, tmp.subVectors(j[d.a], p).clone(), tmp2.subVectors(j[d.b], p).clone(), 17);
          const ok = deg >= d.ok - 0.5;
          for (const m of [A.fill, A.edge]) m.material.color.set(ok ? C.ok : C.warn);
          it.pos.copy(p).add(new THREE.Vector3(14, 8, 6));
          setLab(it.lab, ok, `${d.name} ${Math.round(deg)}°`);
        };
      } else if (d.k === "heel") {
        const discs = [1, 2].map(() => { const m = mk(new THREE.CircleGeometry(6, 28), mat(C.ok, 0.55)); m.rotation.x = -Math.PI / 2; return m; });
        it.objs.push(...discs); it.lab = label();
        it.upd = j => {
          let ok = true;
          discs.forEach((m, i) => { const an = j["an" + (i + 1)]; m.position.set(an.x - 1, 0.4, an.z); ok = ok && an.y < 9; m.material.color.set(ok ? C.ok : C.warn); });
          it.pos.copy(j.an1).add(new THREE.Vector3(-6, 10, 6));
          setLab(it.lab, ok, "Fersen am Boden");
        };
      }
      items.push(it);
    }
  });

  let show = -2; // -2 = aus, -1 = alle, sonst Nummer des Hinweises
  const P = new THREE.Vector3();
  return {
    set(v) { show = v; for (const it of items) { const on = show === -1 || show === it.hi; for (const o of it.objs) o.visible = on; if (it.lab) it.lab.hidden = !on; } },
    update(j) { if (show === -2) return; for (const it of items) if (show === -1 || show === it.hi) it.upd(j); },
    place(camera, w, h) {
      if (show === -2) return;
      for (const it of items) {
        if (!it.lab || it.lab.hidden) continue;
        P.copy(it.pos).project(camera);
        it.lab.el.style.transform = `translate(${((P.x + 1) / 2 * w).toFixed(1)}px,${((1 - P.y) / 2 * h).toFixed(1)}px) translate(-50%,-50%)`;
      }
    },
    dispose() { tube.dispose(); for (const m of mats) m.dispose(); },
  };
}

// Pose aus uebungen.js zu 3D-Gelenkpunkten
function joints(ex, t) {
  const cfg = X3[ex.id] || {};
  let P = lerp(ex.A, ex.B, t);
  if (cfg.sym) {
    P = { ...P };
    for (const k of ["a", "f", "t", "s", "ft"]) {
      const a = P[k + "1"], b = P[k + "2"];
      if (typeof a === "number" && typeof b === "number") P[k + "1"] = P[k + "2"] = (a + b) / 2;
    }
  }
  const o = place(P, ex.anchor);
  const v = (p, z) => new THREE.Vector3(p[0] - 100, 124 - p[1] + 1.5, z);
  const j = { hip: v(o.hip, 0), sh: v(o.sh, 0), hd: v(o.hd, 0) };
  for (const i of [1, 2]) {
    const s = i === 1 ? 1 : -1;
    j["sh" + i] = v(o.sh, s * SW);
    j["hp" + i] = v(o.hip, s * HW);
    j["el" + i] = v(o["el" + i], s * (cfg.ez ?? SW));
    j["h" + i] = v(o["h" + i], s * (cfg.hz ?? SW));
    j["k" + i] = v(o["k" + i], s * HW);
    j["an" + i] = v(o["an" + i], s * FW);
    j["to" + i] = v(o["to" + i], s * (FW + 1.5));
  }
  return j;
}

function colors() {
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;background:var(--card);color:var(--ink);border-color:var(--line)";
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe), out = { bg: cs.backgroundColor, ink: cs.color, line: cs.borderTopColor };
  probe.remove();
  const dark = new THREE.Color(out.bg).getHSL({}).l < 0.3;
  return { ...out, dark, body: dark ? "#cfcfd6" : "#3b3b42", joint: dark ? "#e9e9ee" : "#26262b", acc: "#ff5a1f", ok: dark ? "#3ccf7c" : "#1f9d55", warn: dark ? "#ffc53d" : "#e0a100", guide: dark ? "#6cb4ff" : "#2f7cf6", prop: dark ? "#3a3a41" : "#d3d3da", floor: dark ? "#232327" : "#e8e8ec" };
}

function buildScene(ex, C) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.bg);
  const hemi = new THREE.HemisphereLight(0xffffff, C.dark ? 0x202024 : 0xb8b8c0, C.dark ? 1.1 : 1.5);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, C.dark ? 2.2 : 2.4);
  sun.position.set(60, 160, 90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, near: 10, far: 400 });
  sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6);
  fill.position.set(-80, 60, -60);
  scene.add(fill);

  // Boden: runde Fläche plus weicher Schatten
  const floor = new THREE.Mesh(new THREE.CircleGeometry(110, 64), new THREE.MeshStandardMaterial({ color: C.floor, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const mBody = new THREE.MeshStandardMaterial({ color: C.body, roughness: 0.5, metalness: 0.05 });
  const mJoint = new THREE.MeshStandardMaterial({ color: C.joint, roughness: 0.45, metalness: 0.05 });
  const mAcc = new THREE.MeshStandardMaterial({ color: C.acc, roughness: 0.4, metalness: 0.1 });
  const mProp = new THREE.MeshStandardMaterial({ color: C.prop, roughness: 0.8 });

  const cyl = new THREE.CylinderGeometry(1, 1, 1, 20, 1, true);
  const sph = new THREE.SphereGeometry(1, 24, 16);
  const add = (geo, mat, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; scene.add(m); return m; };

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

  // Geräte
  const props = [];
  for (const pr of ex.props || []) {
    if (pr.t === "box") {
      const h = 124 - pr.y;
      const m = add(new THREE.BoxGeometry(pr.w, h, 40), mProp);
      m.position.set(pr.x + pr.w / 2 - 100, h / 2, 0);
    } else if (pr.t === "bench") {
      const m = add(new THREE.BoxGeometry(pr.w, 6, 26), mProp);
      m.position.set(pr.x + pr.w / 2 - 100, 124 - pr.y - 3, 0);
      for (const dx of [6, pr.w - 6]) {
        const leg = add(new THREE.BoxGeometry(4, 124 - pr.y - 6, 18), mProp);
        leg.position.set(pr.x + dx - 100, (124 - pr.y - 6) / 2, 0);
      }
    } else if (pr.t === "mat") {
      const m = add(new THREE.BoxGeometry(pr.w ?? 140, 1.6, 50), mProp, false);
      m.position.set((pr.x ?? 30) + (pr.w ?? 140) / 2 - 100, 0.8, 0);
    } else if (pr.t === "kb") {
      const g = new THREE.Group();
      const bell = new THREE.Mesh(new THREE.SphereGeometry(6.5, 24, 16), mAcc);
      bell.position.y = -8; bell.castShadow = true;
      const handle = new THREE.Mesh(new THREE.TorusGeometry(4.2, 1.1, 10, 24, Math.PI), mAcc);
      handle.castShadow = true;
      handle.position.y = -3.5;
      g.add(bell, handle);
      scene.add(g);
      props.push({ g, upd: j => g.position.copy(tmp.copy(j.h1).add(j.h2).multiplyScalar(0.5)) });
    } else if (pr.t === "db") {
      for (const k of pr.at || ["h1"]) {
        const g = new THREE.Group();
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 14, 12), mJoint);
        for (const dz of [-6, 6]) {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 3.2, 20), mAcc);
          w.position.y = dz; w.castShadow = true; g.add(w);
        }
        g.add(bar);
        g.rotation.x = Math.PI / 2;
        scene.add(g);
        props.push({ g, upd: j => g.position.copy(j[k]) });
      }
    }
  }

  function pose(j) {
    for (const l of limbs) seg(l.m, j[l.a], j[l.b], l.r);
    for (const b of balls) b.m.position.copy(j[b.k]);
    // Rumpf: unten schmaler (Becken), oben breiter (Brustkorb); zeigt die Breite immer zur Seite
    const top = tmp2.copy(j.sh), bot = j.hip;
    seg(torso, bot, top, 1);
    const len = torso.scale.y;
    torso.scale.set(8.2, len, 14);
    chest.position.copy(top); chest.quaternion.copy(torso.quaternion); chest.scale.set(8.2, 6, 15.5);
    pelvis.position.copy(bot); pelvis.quaternion.copy(torso.quaternion); pelvis.scale.set(8.2, 6.5, 11.5);
    tmp.subVectors(j.hd, j.sh).normalize();
    seg(neck, j.sh, tmp2.copy(j.sh).addScaledVector(tmp, 9), 3.4);
    head.position.copy(j.hd); head.quaternion.copy(torso.quaternion); head.scale.set(8.4, 9.6, 8);
    for (const p of props) p.upd(j);
  }
  return { scene, pose, sun };
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
    <div class="seg v3views"><button data-view="front">Vorne</button><button data-view="diag" aria-pressed="true">Schräg</button><button data-view="side">Seite</button><button data-view="top">Oben</button></div>
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

  const { scene, pose } = buildScene(ex, C);
  const hints = defs ? makeHints(scene, defs, C, wrap) : null;
  const camera = new THREE.PerspectiveCamera(34, 1, 1, 2000);

  // Bildausschnitt: Mitte und Größe aus Anfangs- und Endpose
  const bb = new THREE.Box3();
  for (const t of [0, 0.5, 1]) for (const p of Object.values(joints(ex, t))) bb.expandByPoint(p);
  for (const pr of ex.props || []) if (pr.t === "box" || pr.t === "bench") { bb.expandByPoint(new THREE.Vector3(pr.x - 100, 0, 0)); bb.expandByPoint(new THREE.Vector3(pr.x + pr.w - 100, 0, 0)); }
  bb.expandByPoint(new THREE.Vector3(bb.min.x, 0, 0));
  const target = bb.getCenter(new THREE.Vector3());
  const size = bb.getSize(new THREE.Vector3());
  const base = Math.max(size.x, size.y, 60) * 0.5 / Math.tan((34 / 2) * Math.PI / 180) * 1.45;

  const VIEWS = { front: [90, 6], diag: [42, 14], side: [0, 4], top: [30, 72] };
  const rad = Math.PI / 180;
  let az = 42 * rad, el = 14 * rad, dist = base;
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
    camera.userData.fit = w < h ? Math.max(1, (h / w) * 0.72) : 1;
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
      if (hints) hints.update(jj);
      const r = dist * (camera.userData.fit || 1);
      camera.position.set(target.x + r * Math.cos(el) * Math.sin(az), target.y + r * Math.sin(el), target.z + r * Math.cos(el) * Math.cos(az));
      camera.lookAt(target);
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
  cv.addEventListener("dblclick", () => { const [a, b] = VIEWS.diag; azT = a * rad; elT = b * rad; distT = base; markViews("diag"); });

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
