// 3D-Angaben und Technik-Hinweise je Übung (für fig3d.js).
//
// X3[id]: was in der Seitenansicht fehlt
//   sym   beide Körperseiten gleich bewegen (in 2D leicht versetzt gezeichnet)
//   hz/ez halbe Breite zwischen den Händen / Ellbogen (Standard: hängende Arme neben dem Körper)
//   grip  "mid" = Kabel/Griff zur Mitte zwischen den Händen, "each" = je Hand ein Gurt (Ringe)
//   cfrom Kabel-Startpunkte in 3D [x, y, z] statt aus der Seitenansicht
//   benchZ/boxZ Bank/Kasten zur Seite schieben · A/B Posen-Korrekturen nur für 3D (Schlüssel siehe fig3d.js, z. B. ab = seitlich abspreizen)
//   pfix  Geräte aus uebungen.js anpassen {Nummer: {x, y, w}} · anchor andere Verankerung · dbAxis "x" = Hantel längs
//   reach Beine so drehen, dass die Zehen den Boden berühren · K eigene 3D-Posen [Anfang, (Mitte), Ende] · props3 eigene 3D-Geräte
//
// H3[id]: Hinweise. t = Name auf dem Knopf, view = beste Ansicht (front, side, back, diag, top), txt = Erklärung
//   Zeichnungen (draw):
//   spine    Linie am Rücken (label)
//   dir      Richtung a→b gegen Senkrechte (ref: up/down) mit min/max in Grad (name)
//   angle    Gelenkwinkel an at zwischen a und b, min/max (name)
//   straight Linie a–at–b soll gerade sein (min Grad), label
//   plumb    Punkt p soll senkrecht über/unter ref liegen (tol), label
//   track    Linie Hüfte–Fußspitze für Bein side (1/2)
//   heel     Fersen/Füße am Boden (sides, label)
//   mark     nur Markierung an Punkt p mit label
//   when     "A" oder "B": nur in der Anfangs- bzw. Endstellung bewerten

export const X3 = {
  bench: { sym: true, hz: 25, ez: 27, A: { t1: 72, t2: 72, a1: 40, a2: 40, f1: 176, f2: 176 }, B: { f1: 168, f2: 168, t1: 72, t2: 72 }, pfix: { 0: { w: 72 } } },
  benchbb: { sym: true, hz: 23, ez: 25, A: { t1: 72, t2: 72, a1: 55, a2: 55, f1: 178, f2: 178 }, B: { f1: 168, f2: 168, t1: 72, t2: 72 }, pfix: { 0: { w: 72 } } },
  latpull: { sym: true, hz: 27, ez: 29, grip: "mid" },
  row: { sym: true, hz: 5, ez: 14, grip: "mid" },
  shpress: { sym: true, A: { a1: 0, a2: 0, ab1: 62, ab2: 62, f1: 180, f2: 180, fab1: 0, fab2: 0 }, B: { a1: 0, a2: 0, ab1: 166, ab2: 166, f1: 180, f2: 180, fab1: 0, fab2: 0 } },
  facepull: { sym: true, hz: 8, ez: 25, grip: "mid" },
  curl: { sym: true, hz: 25, ez: 19 },
  pushdown: { sym: true, hz: 7, ez: 15, grip: "mid" },
  hipthrust: { sym: true, hz: 22, ez: 22, pfix: { 0: { y: 92 } }, reach: { pt: "an" } },
  goblet: { sym: true, hz: 4.5, ez: 11 },
  rdl: { sym: true, hz: 12, ez: 15, A: { a1: 14, f1: 14, a2: 14, f2: 14 } },
  stepup: { feetY: { 1: 28 } },
  legcurl: { sym: true, hz: 20, ez: 19 },
  calf: { sym: true, pfix: { 0: { x: 108, w: 30 } } },
  pallof: { sym: true, hz: 3.5, ez: 11, grip: "mid", cfrom: [[8, 98, 90]] },
  farmer: { hz: 22, dbAxis: "x" },
  hollow: { sym: true, hz: 13, ez: 15 },
  pullup: { sym: true, hz: 25, ez: 28, anchor: { pt: "h1", at: [100, -58] }, pfix: { 0: { y: -58 } } },
  dips: { sym: true, hz: 23, ez: 21, B: { a1: -96, a2: -96 } },
  pushup: { sym: true, hz: 22, ez: 26, reach: { pt: "to" } },
  invrow: { sym: true, hz: 20, ez: 23, grip: "each" },
  bwsquat: { sym: true, hz: 13, ez: 15 },
  stepdown: { feetY: { 1: 28 } },
  deadhang: { sym: true, hz: 25, ez: 25, anchor: { pt: "h1", at: [100, -58] }, pfix: { 0: { y: -58 } } },
  tuck: { sym: true, hz: 21, ez: 21, anchor: { pt: "h1", at: [100, 96] }, pfix: { 0: { y: 96 } } },
  slbridge: { hz: 20, B: { nka: -105 } },
  deadbug: { hz: 17, B: { a1: 260, f1: 260 } },
  legswing: {},
  revlunge: { B: { t2: -20, s2: -80, ft2: 60 } },
  askip: {},
  buttkick: {},
  plank: { sym: true, hz: 9, ez: 15, reach: { pt: "to" } },
  pikepush: { sym: true, hz: 21, ez: 23, reach: { pt: "to", max: 20 }, A: { ft1: 80, ft2: 80 }, B: { ft1: 80, ft2: 80 } },
  dbrow: { sym: true, hz: 17, ez: 16 },
  deadlift: { sym: true, hz: 21, ez: 20 },
  bulgarian: { hz: 21, dbAxis: "x", A: { ft2: -80 }, B: { ft2: -80 }, pfix: { 0: { x: 20, y: 92, w: 39 } }, pin: { 2: { at: [-40, 37.5], knee: "down" } } },
  ohp: { sym: true, hz: 22, ez: 22 },
  frontraise: { hz: 13, A: { a1: 14, f1: 14, a2: 14, f2: 14 }, B: { a2: 14, f2: 14 } },
  birddog: {},
  balance: { A: { t1: 6, s1: -6 }, B: { t1: 6, s1: -6 } },
  glutebridge: { sym: true, hz: 20, B: { nka: -105 } },
  onearmrow: { benchZ: -13 },
  dorsiflex: {},
  wallsit: { sym: true },
  walltoeraise: { sym: true },
  slcalf: { pfix: { 0: { x: 108, w: 30 } } },
  tibraise: { sym: true },
};

const kneeLine = (sides = [1, 2], txt = "Die Knie zeigen über die Fußspitzen und knicken nicht nach innen.") =>
  ({ t: "Knie-Linie", view: "front", txt, draw: sides.map(side => ({ k: "track", side })) });
const kneeAngle = (min, txt, name = "Knie", side = 1) =>
  ({ t: "Kniewinkel", view: "side", txt, draw: [{ k: "angle", at: "k" + side, a: "hp" + side, b: "an" + side, min, name }] });
const upright = (max, txt, t = "Oberkörper") =>
  ({ t, view: "side", txt, draw: [{ k: "dir", a: "hip", b: "sh", ref: "up", max, name: "Neigung" }] });
const heels = (txt = "Die Fersen bleiben die ganze Zeit fest am Boden.", label = "Fersen am Boden", t = "Fersen") =>
  ({ t, view: "side", txt, draw: [{ k: "heel", label }] });
const elbowSoft = txt => ({ t: "Ellbogen", view: "side", txt, draw: [{ k: "angle", at: "el1", a: "sh1", b: "h1", max: 172, name: "Ellbogen", when: "B" }] });
const bodyLine = (min, txt, b = "an1", when) => ({ t: "Körperlinie", view: "side", txt, draw: [{ k: "straight", a: "sh", at: "hip", b, min, label: "Körper gerade", when }] });
const mark = (t, view, txt, p, label) => ({ t, view, txt, draw: [{ k: "mark", p, label }] });

export const H3 = {
  goblet: [
    { t: "Rücken", view: "side", txt: "Rücken gerade, Brust aufrecht. Der Oberkörper neigt sich höchstens etwa 45° nach vorn.",
      draw: [{ k: "spine", label: "Rücken gerade" }, { k: "dir", a: "hip", b: "sh", ref: "up", max: 45, name: "Neigung" }] },
    kneeLine(),
    kneeAngle(90, "Nur so tief, wie es schmerzfrei geht. Grün heißt: Knie nicht enger als 90°. Gelb: nur, wenn das Knie gut mitmacht."),
    heels(),
  ],
  bwsquat: [
    { t: "Rücken", view: "side", txt: "Hüfte nach hinten zur Box, Rücken gerade. Der Oberkörper neigt sich höchstens etwa 45° nach vorn.",
      draw: [{ k: "spine", label: "Rücken gerade" }, { k: "dir", a: "hip", b: "sh", ref: "up", max: 45, name: "Neigung" }] },
    kneeLine(),
    kneeAngle(90, "Box nur kurz antippen, so tief wie schmerzfrei. Grün: Knie nicht enger als 90°. Gelb: nur, wenn das Knie gut mitmacht."),
    heels(),
  ],
  bench: [
    elbowSoft("Oben nicht ganz durchstrecken, die Ellbogen bleiben leicht gebeugt."),
    { t: "Hantelweg", view: "side", txt: "Hanteln kontrolliert bis neben die Brust senken und senkrecht über die Schultern hochdrücken.",
      draw: [{ k: "plumb", p: "h1", ref: "sh1", tol: 18, label: "Über der Schulter", when: "B" }] },
    heels("Rücken flach auf der Bank, Füße fest am Boden.", "Füße am Boden", "Füße"),
  ],
  benchbb: [
    elbowSoft("Oben strecken, aber nicht hart durchdrücken. Bei schweren Sätzen mit Partner oder Sicherungen."),
    { t: "Stangenweg", view: "side", txt: "Stange zur unteren Brust senken und senkrecht über die Schultern hochdrücken.",
      draw: [{ k: "plumb", p: "h1", ref: "sh1", tol: 18, label: "Über der Schulter", when: "B" }] },
    heels("Augen unter der Stange, Rücken auf der Bank, Füße fest am Boden.", "Füße am Boden", "Füße"),
  ],
  latpull: [
    upright(25, "Oberkörper nur leicht zurückgelehnt. Nicht nach hinten schaukeln."),
    mark("Ellbogen", "front", "Stange zur oberen Brust ziehen, die Ellbogen zeigen nach unten.", "el1", "Ellbogen nach unten"),
  ],
  row: [
    { t: "Rücken", view: "side", txt: "Aufrecht sitzen, der Rücken bleibt gerade und wird beim Vorstrecken nicht rund.",
      draw: [{ k: "spine", label: "Rücken gerade" }, { k: "dir", a: "hip", b: "sh", ref: "up", max: 20, name: "Neigung" }] },
    mark("Schulterblätter", "top", "Griff zum Bauch ziehen, Ellbogen nah am Körper, Schulterblätter zusammen.", "el1", "Ellbogen nah am Körper"),
  ],
  shpress: [
    upright(10, "Aufrecht sitzen, Bauch fest, kein Hohlkreuz. Der Oberkörper bleibt senkrecht."),
    { t: "Unterarme", view: "front", txt: "Die Unterarme stehen senkrecht unter den Hanteln.",
      draw: [{ k: "dir", a: "el1", b: "h1", ref: "up", max: 22, name: "Unterarm" }] },
  ],
  facepull: [
    mark("Ellbogen", "front", "Seil zum Gesicht ziehen, Ellbogen hoch und nach außen.", "el1", "Ellbogen hoch und außen"),
    upright(10, "Aufrecht stehen, nicht nach hinten lehnen.", "Haltung"),
  ],
  curl: [
    { t: "Ellbogen", view: "side", txt: "Die Ellbogen bleiben am Körper, nur die Unterarme bewegen sich.",
      draw: [{ k: "dir", a: "sh1", b: "el1", ref: "down", max: 15, name: "Oberarm" }] },
    upright(8, "Nicht schwingen: Der Oberkörper bleibt ruhig und aufrecht.", "Ruhig"),
  ],
  pushdown: [
    { t: "Ellbogen", view: "side", txt: "Ellbogen fest am Körper, nur die Unterarme bewegen sich.",
      draw: [{ k: "dir", a: "sh1", b: "el1", ref: "down", max: 18, name: "Oberarm" }] },
    upright(15, "Leicht nach vorn geneigt, Rücken gerade."),
  ],
  hipthrust: [
    bodyLine(160, "Oben bilden Oberkörper und Oberschenkel eine Linie. 1 Sekunde halten.", "k1", "B"),
    { t: "Kniewinkel", view: "side", txt: "Oben stehen die Unterschenkel etwa senkrecht, das Knie ist ungefähr im rechten Winkel. So bleibt es geschont.",
      draw: [{ k: "angle", at: "k1", a: "hp1", b: "an1", min: 78, max: 105, name: "Knie", when: "B" }] },
    heels("Füße fest am Boden, über die Fersen drücken.", "Füße am Boden", "Füße"),
  ],
  rdl: [
    { t: "Rücken", view: "side", txt: "Der Rücken bleibt gerade, die Hüfte schiebt nach hinten.", draw: [{ k: "spine", label: "Rücken gerade" }] },
    kneeAngle(140, "Knie leicht gebeugt, aber nicht weiter einknicken. Die Bewegung kommt aus der Hüfte."),
    mark("Hanteln", "side", "Hanteln nah an den Beinen entlang führen.", "h1", "Nah an den Beinen"),
  ],
  deadlift: [
    { t: "Rücken", view: "side", txt: "Rücken neutral, nicht rund. Aus den Beinen drücken.", draw: [{ k: "spine", label: "Rücken neutral" }] },
    { t: "Stangenweg", view: "side", txt: "Die Stange bleibt nah am Körper und läuft senkrecht über der Fußmitte.",
      draw: [{ k: "plumb", p: "h1", ref: "an1", dx: 5, tol: 14, label: "Über der Fußmitte" }] },
    kneeLine(),
  ],
  stepup: [
    kneeLine([1], "Ganzer Fuß auf dem Kasten, das Knie bleibt über dem Fuß."),
    upright(20, "Oberkörper aufrecht, nur leicht nach vorn."),
    mark("Ferse", "side", "Über die Ferse nach oben drücken, langsam absenken.", "an1", "Über die Ferse drücken"),
  ],
  stepdown: [
    kneeLine([1], "Das Knie bleibt über dem Fuß und kippt nicht nach innen."),
    kneeAngle(90, "Nur so weit beugen, bis die andere Ferse den Boden antippt. Langsam und kontrolliert."),
    upright(25, "Oberkörper leicht nach vorn, Rücken gerade."),
  ],
  legcurl: [
    upright(20, "Aufrecht sitzen, das Becken bleibt ruhig."),
    kneeAngle(70, "Unterschenkel weit beugen und langsam zurück in die Streckung."),
  ],
  calf: [
    mark("Zehenspitzen", "side", "Hoch auf die Zehenspitzen drücken, dann langsam tief absenken.", "an1", "Hoch und tief"),
    kneeAngle(165, "Knie gestreckt, aber nicht durchgedrückt."),
    upright(8, "Aufrecht stehen.", "Haltung"),
  ],
  slcalf: [
    mark("Zehenspitze", "side", "Hoch auf die Zehenspitze drücken, langsam tief absenken. An der Wand festhalten.", "an1", "Hoch und tief"),
    kneeAngle(165, "Das Standknie bleibt gestreckt, aber nicht durchgedrückt."),
  ],
  pallof: [
    mark("Rumpf", "top", "Rumpf fest: Das Kabel zieht zur Seite, du lässt dich nicht drehen.", "hip", "Hüfte zeigt nach vorn"),
    mark("Arme", "top", "Griff gerade nach vorn drücken und zurück zur Brust.", "h1", "Gerade nach vorn"),
  ],
  farmer: [
    upright(8, "Aufrecht und zügig gehen, nicht schwanken.", "Haltung"),
    mark("Schultern", "front", "Schultern unten lassen, nicht hochziehen.", "sh1", "Schultern unten"),
  ],
  hollow: [
    mark("Unterer Rücken", "side", "Den unteren Rücken in den Boden drücken. Zu schwer: Knie anwinkeln.", "hip", "Rücken am Boden"),
    mark("Schultern", "side", "Schultern und gestreckte Beine nur leicht anheben.", "sh1", "Schultern leicht hoch"),
  ],
  pullup: [
    mark("Schultern", "front", "Schultern aktiv nach unten ziehen, nicht zu den Ohren.", "sh1", "Schultern unten"),
    mark("Ablassen", "side", "Oben ist das Kinn über der Stange. Dann 5 Sekunden langsam ablassen.", "hd", "Kinn über die Stange"),
  ],
  dips: [
    { t: "Tiefe", view: "side", txt: "Nur so tief, bis die Oberarme etwa waagerecht sind.",
      draw: [{ k: "dir", a: "sh1", b: "el1", ref: "down", max: 100, name: "Oberarm" }] },
    upright(28, "Oberkörper leicht nach vorn, Ellbogen nach hinten beugen."),
  ],
  pushup: [
    bodyLine(165, "Der Körper bildet eine Linie: Hüfte nicht durchhängen lassen und nicht hochstrecken."),
    { t: "Hände", view: "side", txt: "Hände etwa unter den Schultern, etwas breiter als schulterbreit.",
      draw: [{ k: "plumb", p: "h1", ref: "sh1", tol: 14, label: "Unter der Schulter", when: "A" }] },
    mark("Ellbogen", "top", "Ellbogen schräg nach hinten, nicht ganz zur Seite.", "el1", "Ellbogen schräg nach hinten"),
  ],
  invrow: [
    bodyLine(165, "Körper gestreckt, Fersen am Boden. Steiler = leichter."),
    mark("Zug", "side", "Brust zu den Händen ziehen, langsam zurück.", "h1", "Brust zu den Händen"),
  ],
  plank: [
    bodyLine(166, "Eine Linie von Kopf bis Ferse: Bauch und Gesäß fest, Hüfte nicht durchhängen lassen."),
    { t: "Ellbogen", view: "side", txt: "Die Ellbogen liegen unter den Schultern.", draw: [{ k: "plumb", p: "el1", ref: "sh1", tol: 10, label: "Unter der Schulter" }] },
  ],
  pikepush: [
    mark("Hüfte", "side", "Hüfte hoch, der Körper bildet ein umgedrehtes V.", "hip", "Hüfte hoch"),
    mark("Kopf", "front", "Kopf zwischen den Händen Richtung Boden senken.", "hd", "Kopf zwischen die Hände"),
    kneeAngle(165, "Beine möglichst gestreckt.", "Bein"),
  ],
  deadhang: [
    mark("Schultern", "front", "Schultern aktiv nach unten ziehen. Locker atmen.", "sh1", "Schultern unten"),
    { t: "Arme", view: "side", txt: "Die Arme sind gestreckt.", draw: [{ k: "angle", at: "el1", a: "sh1", b: "h1", min: 158, name: "Arm" }] },
  ],
  tuck: [
    { t: "Arme", view: "side", txt: "Arme gestreckt, fest in die Griffe drücken.", draw: [{ k: "angle", at: "el1", a: "sh1", b: "h1", min: 160, name: "Arm" }] },
    mark("Schultern", "front", "Schultern bleiben unten, nicht zu den Ohren ziehen.", "sh1", "Schultern unten"),
    mark("Knie", "side", "Knie zur Brust ziehen, Füße vom Boden.", "k1", "Knie zur Brust"),
  ],
  slbridge: [
    bodyLine(160, "Hüfte hochdrücken, bis Schulter, Hüfte und Knie eine Linie bilden.", "k1", "B"),
    mark("Becken", "front", "Das Becken bleibt gerade und kippt nicht zur Seite.", "hip", "Becken gerade"),
  ],
  glutebridge: [
    bodyLine(160, "Hüfte hochdrücken, bis Schultern, Hüfte und Knie eine Linie bilden. Oben kurz halten.", "k1", "B"),
    heels("Füße hüftbreit fest am Boden.", "Füße am Boden", "Füße"),
  ],
  deadbug: [
    mark("Rücken", "side", "Der untere Rücken bleibt am Boden.", "hip", "Rücken am Boden"),
    mark("Gegengleich", "top", "Gegengleich einen Arm und ein Bein flach strecken, dann Seite wechseln.", "h1", "Arm und Bein gegengleich"),
  ],
  legswing: [
    upright(8, "Oberkörper bleibt aufrecht, nur das Bein schwingt.", "Haltung"),
    mark("Standbein", "side", "Das Standbein bleibt ruhig. Mit einer Hand an der Wand abstützen.", "an2", "Standbein ruhig"),
  ],
  revlunge: [
    kneeLine([1], "Das vordere Knie bleibt über dem Fuß."),
    kneeAngle(90, "Hinteres Knie Richtung Boden, nur so tief, wie es schmerzfrei geht.", "Vorderes Knie"),
    upright(10, "Oberkörper aufrecht."),
  ],
  bulgarian: [
    kneeLine([1], "Das vordere Knie bleibt über dem Fuß und kippt nicht nach innen."),
    kneeAngle(85, "Senkrecht nach unten gehen. Nur so tief, wie das Knie schmerzfrei ist.", "Vorderes Knie"),
    upright(15, "Oberkörper aufrecht, über die vordere Ferse hochdrücken."),
  ],
  askip: [
    mark("Knie", "side", "Knie abwechselnd bis etwa Hüfthöhe heben, Arme gegengleich.", "k1", "Knie bis Hüfthöhe"),
    upright(10, "Aufrecht bleiben, nicht nach hinten lehnen.", "Haltung"),
  ],
  buttkick: [
    mark("Ferse", "side", "Fersen abwechselnd Richtung Gesäß ziehen.", "an1", "Ferse zum Gesäß"),
    upright(10, "Aufrecht bleiben, Arme locker mitschwingen.", "Haltung"),
  ],
  dbrow: [
    { t: "Rücken", view: "side", txt: "Oberkörper nach vorn geneigt, Rücken gerade.", draw: [{ k: "spine", label: "Rücken gerade" }] },
    kneeAngle(150, "Knie leicht gebeugt."),
    mark("Ellbogen", "back", "Hanteln zur Hüfte ziehen, Ellbogen nah am Körper.", "el1", "Ellbogen zur Hüfte"),
  ],
  onearmrow: [
    { t: "Rücken", view: "side", txt: "Knie und Hand auf der Bank, Rücken gerade wie ein Tisch.", draw: [{ k: "spine", label: "Rücken gerade" }] },
    mark("Ellbogen", "side", "Hantel zur Hüfte ziehen, Ellbogen nah am Körper.", "el1", "Ellbogen zur Hüfte"),
  ],
  ohp: [
    { t: "Stangenweg", view: "side", txt: "Stange gerade nach oben drücken, sie bleibt über der Fußmitte.",
      draw: [{ k: "plumb", p: "h1", ref: "an1", dx: 5, tol: 16, label: "Über der Fußmitte", when: "B" }] },
    upright(8, "Bauch und Gesäß fest, kein Hohlkreuz.", "Rumpf"),
  ],
  frontraise: [
    { t: "Höhe", view: "side", txt: "Arm gestreckt nur bis Schulterhöhe heben.", draw: [{ k: "dir", a: "sh1", b: "h1", ref: "down", max: 95, name: "Arm" }] },
    upright(6, "Der Oberkörper bleibt ruhig, nicht mitschwingen.", "Ruhig"),
  ],
  birddog: [
    { t: "Rücken", view: "side", txt: "Der Rücken bleibt ruhig und gerade, das Becken kippt nicht.", draw: [{ k: "spine", label: "Rücken gerade" }] },
    { t: "Arm & Bein", view: "side", txt: "Gegengleich einen Arm nach vorn und ein Bein nach hinten strecken, kurz halten.",
      draw: [{ k: "mark", p: "h1", label: "Arm nach vorn" }, { k: "mark", p: "an2", label: "Bein nach hinten" }] },
  ],
  balance: [
    kneeAngle(158, "Das Standknie ist leicht gebeugt, nicht durchgedrückt.", "Standknie"),
    mark("Becken", "front", "Becken waagerecht, der Fuß bleibt ruhig am Boden.", "hip", "Becken waagerecht"),
  ],
  dorsiflex: [
    mark("Fuß", "side", "Zehen gegen das Band zu dir heranziehen, langsam zurück.", "to1", "Zehen zu dir"),
    kneeAngle(165, "Das Bein bleibt gestreckt.", "Bein"),
  ],
  wallsit: [
    kneeAngle(85, "Knie etwa im rechten Winkel, nur so tief, wie es schmerzfrei geht."),
    kneeLine(),
    mark("Rücken", "side", "Rücken an der Wand, Gewicht auf den Fersen.", "sh", "Rücken an der Wand"),
  ],
  walltoeraise: [
    heels(),
    mark("Rücken", "side", "Rücken und Gesäß an der Wand, Zehen und Vorfuß weit anheben.", "to1", "Zehen hoch"),
  ],
  tibraise: [
    heels(),
    mark("Zehen", "side", "Zehen kraftvoll Richtung Schienbein ziehen. Je weiter die Füße vorn, desto schwerer.", "to1", "Zehen hoch"),
  ],
};
