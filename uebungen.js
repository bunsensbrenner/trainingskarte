// Stick-figure engine. Angles in degrees: 0 = straight down, +90 = forward (right), 180 = up, -90 = backward (left).
const L={sp:46,ua:26,fa:24,th:36,sh:36,ft:11,hd:9,nk:5};
const V=(a,l)=>[Math.sin(a*Math.PI/180)*l,Math.cos(a*Math.PI/180)*l];
const add=(p,v)=>[p[0]+v[0],p[1]+v[1]];
function skel(P){
  const hip=[0,0],sh=add(hip,V(P.sp,L.sp)),nk=add(sh,V(P.sp,L.nk)),hd=add(sh,V(P.sp,L.nk+L.hd));
  const o={hip,sh,hd};
  for(const i of [1,2]){
    const el=add(sh,V(P["a"+i],L.ua)),h=add(el,V(P["f"+i],L.fa));
    const kn=add(hip,V(P["t"+i],L.th)),an=add(kn,V(P["s"+i],L.sh)),to=add(an,V(P["ft"+i]??(P["s"+i]+90),L.ft));
    Object.assign(o,{["el"+i]:el,["h"+i]:h,["k"+i]:kn,["an"+i]:an,["to"+i]:to});
  }
  return o;
}
function place(P,anchor){
  const o=skel(P);let dx,dy;
  const a=anchor||{pt:"an1",at:[100,121]};
  if(a.pt==="ground"){const ys=Object.values(o).map(p=>p[1]);dy=a.y-Math.max(...ys);dx=a.x-o.hip[0]}
  else{dx=a.at[0]-o[a.pt][0];dy=a.at[1]-o[a.pt][1]}
  for(const k in o)o[k]=[o[k][0]+dx,o[k][1]+dy];
  return o;
}
const lerp=(A,B,t)=>{const r={};for(const k in A)r[k]=typeof A[k]==="number"?A[k]+((B[k]??A[k])-A[k])*t:A[k];return r};
const pt=p=>p[0].toFixed(1)+","+p[1].toFixed(1);
function propSVG(pr,o){
  const P=k=>typeof k==="string"?o[k]:k;
  switch(pr.t){
    case "db":return (pr.at||["h1"]).map(k=>{const h=P(k);return `<rect class="eq" x="${(h[0]-7).toFixed(1)}" y="${(h[1]-3.5).toFixed(1)}" width="14" height="7" rx="2"/>`}).join("");
    case "kb":{const h=P(pr.at||"h1");return `<circle class="eq" cx="${h[0].toFixed(1)}" cy="${(h[1]+5).toFixed(1)}" r="6"/>`}
    case "bar":return `<line class="eqs" x1="${pr.x1}" y1="${pr.y}" x2="${pr.x2}" y2="${pr.y}"/>`+(pr.posts?`<line class="pst" x1="${pr.x1+4}" y1="${pr.y}" x2="${pr.x1+4}" y2="124"/><line class="pst" x1="${pr.x2-4}" y1="${pr.y}" x2="${pr.x2-4}" y2="124"/>`:"");
    case "plate":{const h=P(pr.at);return `<circle class="eq" cx="${h[0].toFixed(1)}" cy="${(h[1]+(pr.dy||0)).toFixed(1)}" r="${pr.r||10}"/>`}
    case "box":return `<rect class="box" x="${pr.x}" y="${pr.y}" width="${pr.w}" height="${124-pr.y}" rx="2"/>`;
    case "bench":return `<rect class="box" x="${pr.x}" y="${pr.y}" width="${pr.w}" height="6" rx="2"/><line class="pst" x1="${pr.x+6}" y1="${pr.y+6}" x2="${pr.x+6}" y2="124"/><line class="pst" x1="${pr.x+pr.w-6}" y1="${pr.y+6}" x2="${pr.x+pr.w-6}" y2="124"/>`;
    case "cable":{const a=P(pr.from),b=P(pr.to);return `<line class="cab" x1="${a[0]}" y1="${a[1]}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/><circle class="eq" cx="${a[0]}" cy="${a[1]}" r="3"/>`}
    case "handle":{const h=P(pr.at||"h1");return `<line class="eqs" x1="${(h[0]-pr.w/2).toFixed(1)}" y1="${h[1].toFixed(1)}" x2="${(h[0]+pr.w/2).toFixed(1)}" y2="${h[1].toFixed(1)}"/>`}
    case "band":{const a=P(pr.a),b=P(pr.b);return `<line class="bnd" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`}
    case "mat":return `<rect class="mat" x="${pr.x??30}" y="122" width="${pr.w??140}" height="3" rx="1.5"/>`;
  }
  return "";
}
function figSVG(ex,t){
  const P=lerp(ex.A,ex.B,t),o=place(P,ex.anchor);
  const seg=(a,b,c)=>`<line class="${c}" x1="${o[a][0].toFixed(1)}" y1="${o[a][1].toFixed(1)}" x2="${o[b][0].toFixed(1)}" y2="${o[b][1].toFixed(1)}"/>`;
  const limbs=i=>seg("sh","el"+i,"l"+i)+seg("el"+i,"h"+i,"l"+i)+seg("hip","k"+i,"l"+i)+seg("k"+i,"an"+i,"l"+i)+seg("an"+i,"to"+i,"l"+i+" ft");
  const back=(ex.props||[]).filter(p=>p.back!==false&&["box","bench","bar","mat"].includes(p.t)).map(p=>propSVG(p,o)).join("");
  const front=(ex.props||[]).filter(p=>!["box","bench","bar","mat"].includes(p.t)||p.back===false).map(p=>propSVG(p,o)).join("");
  return `<line class="gnd" x1="6" y1="124" x2="194" y2="124"/>${back}<g class="fig">${limbs(2)}${seg("hip","sh","tor")}<circle class="hd" cx="${o.hd[0].toFixed(1)}" cy="${o.hd[1].toFixed(1)}" r="${L.hd}"/>${limbs(1)}</g>${front}`;
}

const N={sp:180,a1:0,f1:0,a2:0,f2:0,t1:0,s1:0,t2:0,s2:0};
const S=o=>Object.assign({},N,o);
const GR={pt:"ground",x:100,y:123};
const EX={
 bench:{name:"Kurzhantel-Bankdrücken",type:"kg",rest:90,
  how:["Rücken flach auf der Bank, Füße fest am Boden.","Hanteln kontrolliert bis neben die Brust senken.","Nach oben drücken, ohne die Ellbogen ganz durchzustrecken."],
  anchor:{pt:"sh",at:[60,74]},props:[{t:"bench",x:34,y:79,w:80},{t:"db",at:["h1","h2"]}],
  A:S({sp:-90,a1:18,f1:176,a2:24,f2:172,t1:70,s1:0,t2:62,s2:-6}),B:S({sp:-90,a1:178,f1:180,a2:176,f2:178,t1:70,s1:0,t2:62,s2:-6})},
 latpull:{name:"Latzug",type:"kg",rest:90,
  how:["Oberschenkel unter die Polster, Oberkörper leicht zurück.","Stange zur oberen Brust ziehen, Ellbogen nach unten.","Langsam nach oben zurückführen."],
  anchor:{pt:"hip",at:[85,86]},props:[{t:"box",x:66,y:90,w:34},{t:"cable",from:[82,-54],to:"h1"},{t:"handle",at:"h1",w:30}],
  A:S({sp:192,a1:176,f1:179,a2:172,f2:176,t1:90,s1:0,t2:86,s2:-4}),B:S({sp:196,a1:-28,f1:162,a2:-34,f2:158,t1:90,s1:0,t2:86,s2:-4})},
 row:{name:"Rudern am Kabel, sitzend",type:"kg",rest:90,
  how:["Aufrecht sitzen, Knie leicht gebeugt.","Griff zum Bauch ziehen, Schulterblätter zusammen.","Kontrolliert nach vorn strecken, Rücken bleibt gerade."],
  anchor:{pt:"hip",at:[66,104]},props:[{t:"box",x:46,y:108,w:34},{t:"box",x:146,y:92,w:6},{t:"cable",from:[150,82],to:"h1"}],
  A:S({sp:165,a1:88,f1:90,a2:86,f2:88,t1:100,s1:78,t2:98,s2:76}),B:S({sp:182,a1:-38,f1:86,a2:-42,f2:84,t1:100,s1:78,t2:98,s2:76})},
 shpress:{name:"Schulterdrücken, Kurzhanteln",type:"kg",rest:90,
  how:["Aufrecht auf der Bank, Bauch fest.","Hanteln von Schulterhöhe nach oben drücken.","Kein Hohlkreuz, langsam zurück."],
  anchor:{pt:"hip",at:[88,86]},props:[{t:"box",x:68,y:90,w:32},{t:"db",at:["h1","h2"]}],
  A:S({a1:22,f1:174,a2:16,f2:170,t1:90,t2:86,s2:-4}),B:S({a1:178,f1:180,a2:174,f2:177,t1:90,t2:86,s2:-4})},
 facepull:{name:"Face Pulls",type:"kg",rest:60,
  how:["Seil auf Kopfhöhe, Arme gestreckt.","Seil Richtung Gesicht ziehen, Ellbogen hoch und nach außen.","Kurz halten, langsam zurück. Gut für die Haltung."],
  props:[{t:"cable",from:[188,-2],to:"h1"}],
  A:S({a1:96,f1:96,a2:93,f2:93,t2:-6,s2:-6}),B:S({a1:-82,f1:128,a2:-78,f2:124,t2:-6,s2:-6})},
 curl:{name:"Bizeps-Curls",type:"kg",rest:60,
  how:["Aufrecht stehen, Ellbogen am Körper.","Hanteln zur Schulter beugen.","Langsam ablassen, nicht schwingen."],
  props:[{t:"db",at:["h1","h2"]}],
  A:S({a1:4,f1:6,a2:-4,f2:2}),B:S({a1:8,f1:158,a2:2,f2:150})},
 pushdown:{name:"Trizepsdrücken am Kabel",type:"kg",rest:60,
  how:["Leicht nach vorn geneigt, Ellbogen fest am Körper.","Griff nach unten drücken, bis die Arme gestreckt sind.","Nur die Unterarme bewegen."],
  props:[{t:"cable",from:[118,-54],to:"h1"}],
  A:S({sp:172,a1:14,f1:142,a2:10,f2:138}),B:S({sp:172,a1:12,f1:8,a2:8,f2:6})},
 hipthrust:{name:"Hip Thrust",knee:1,type:"kg",rest:90,
  how:["Schulterblätter auf der Bank, Stange auf der Hüfte.","Hüfte hochdrücken, bis Oberkörper und Oberschenkel eine Linie bilden.","Oben 1 Sekunde halten. Stärkt Gesäß, schont das Knie."],
  anchor:{pt:"sh",at:[52,85]},props:[{t:"bench",x:18,y:89,w:40},{t:"plate",at:"hip",dy:-8,r:11}],
  A:S({sp:-130,a1:60,f1:60,a2:60,f2:60,t1:125,s1:-35,t2:122,s2:-38}),B:S({sp:-90,a1:100,f1:120,a2:100,f2:120,t1:90,s1:0,t2:88,s2:-3})},
 goblet:{name:"Goblet Squat auf Box",knee:1,type:"kg",rest:90,
  how:["Kettlebell oder Hantel vor der Brust halten.","Hüfte nach hinten, bis du die Box berührst. Nur so tief, wie es schmerzfrei geht.","Knie zeigen über die Fußspitzen, nicht nach innen."],
  props:[{t:"box",x:44,y:88,w:30},{t:"kb",at:"h1"}],
  A:S({sp:178,a1:14,f1:165,a2:18,f2:165}),B:S({sp:150,a1:40,f1:170,a2:44,f2:170,t1:82,s1:-18,t2:80,s2:-16})},
 rdl:{name:"Rumänisches Kreuzheben",type:"kg",rest:90,
  how:["Hanteln vor den Oberschenkeln, Knie leicht gebeugt.","Hüfte nach hinten schieben, Rücken bleibt gerade.","Bei Dehnung hinten im Oberschenkel wieder aufrichten."],
  props:[{t:"db",at:["h1","h2"]}],
  A:S({}),B:S({sp:104,a1:2,f1:2,a2:-2,f2:-2,t1:14,s1:-6,t2:12,s2:-8})},
 stepup:{name:"Step-up auf Kasten",knee:1,type:"kg",rest:75,
  how:["Ganzen Fuß auf den Kasten setzen.","Über die Ferse nach oben drücken, Knie bleibt über dem Fuß.","Langsam absenken. Erst eine Seite, dann die andere."],
  anchor:{pt:"an1",at:[124,93]},props:[{t:"box",x:106,y:96,w:46}],
  A:S({sp:166,a1:-18,f1:-8,a2:22,f2:30,t1:80,t2:-8,s2:-8}),B:S({sp:178,a1:6,f1:6,a2:-6,f2:-6,t2:8,s2:-38})},
 legcurl:{name:"Beinbeuger an der Maschine",type:"kg",rest:60,
  how:["Polster knapp über der Ferse.","Unterschenkel nach unten und hinten beugen.","Langsam zurück in die Streckung."],
  anchor:{pt:"hip",at:[78,82]},props:[{t:"box",x:56,y:86,w:36},{t:"plate",at:"an1",r:5}],
  A:S({sp:194,a1:24,f1:60,a2:20,f2:56,t1:90,s1:90,t2:88,s2:88}),B:S({sp:194,a1:24,f1:60,a2:20,f2:56,t1:90,s1:-14,t2:88,s2:-16})},
 calf:{name:"Wadenheben",type:"kg",rest:45,
  how:["Fußballen auf eine Stufe, Fersen hängen frei.","Hoch auf die Zehenspitzen drücken.","Langsam tief absenken."],
  anchor:{pt:"to1",at:[112,104]},props:[{t:"box",x:98,y:107,w:34}],
  A:S({ft1:118,ft2:118}),B:S({ft1:48,ft2:48})},
 sideplank:{name:"Seitstütz",knee:1,type:"s",rest:45,
  how:["Ellbogen unter der Schulter, Beine gestreckt.","Hüfte anheben, bis der Körper eine Linie bildet.","Halten. Anfangs auf den Knien."],
  anchor:{pt:"el1",at:[150,121]},
  A:S({sp:110,a1:0,f1:90,a2:120,f2:120,t1:-82,s1:-82,t2:-80,s2:-80}),B:S({sp:104,a1:0,f1:90,a2:178,f2:180,t1:-76,s1:-76,t2:-74,s2:-74})},
 pallof:{name:"Pallof Press",type:"kg",rest:45,
  how:["Seitlich zum Kabel stehen, Griff vor der Brust.","Griff gerade nach vorn drücken.","Rumpf fest, nicht zur Seite drehen lassen."],
  props:[{t:"cable",from:[188,14],to:"h1"}],
  A:S({a1:16,f1:150,a2:20,f2:150,t1:6,t2:-6}),B:S({a1:90,f1:90,a2:88,f2:88,t1:6,t2:-6})},
 farmer:{name:"Farmer's Walk",type:"m",rest:60,
  how:["Schwere Hanteln seitlich greifen.","Aufrecht und zügig gehen, Schultern unten.","Rumpf fest, nicht schwanken."],
  anchor:{pt:"hip",at:[100,52]},props:[{t:"db",at:["h1","h2"]}],
  A:S({t1:22,s1:4,t2:-18,s2:-34}),B:S({t1:-18,s1:-34,t2:22,s2:4})},
 hollow:{name:"Hollow Hold",type:"s",rest:45,
  how:["Rückenlage, unterer Rücken an den Boden drücken.","Schultern und gestreckte Beine leicht anheben.","Halten. Zu schwer: Knie anwinkeln."],
  anchor:{pt:"hip",at:[100,117]},props:[{t:"mat"}],
  A:S({sp:-90,a1:-90,f1:-90,a2:-90,f2:-90,t1:90,s1:90,t2:90,s2:90}),B:S({sp:-104,a1:-112,f1:-112,a2:-110,f2:-110,t1:106,s1:106,t2:104,s2:104})},
 pullup:{name:"Klimmzug (negativ oder mit Band)",type:"bw",rest:120,
  how:["Mit Sprung oder Band in die obere Position.","Kinn über der Stange, Schultern unten.","5 Sekunden langsam ablassen."],
  anchor:{pt:"h1",at:[100,-44]},props:[{t:"bar",x1:62,x2:138,y:-44}],
  A:S({sp:175,a1:30,f1:175,a2:25,f2:172,t1:8,s1:-25,t2:4,s2:-30}),B:S({a1:180,f1:180,a2:178,f2:178,t1:8,s1:-25,t2:4,s2:-30})},
 dips:{name:"Dips (mit Band, wenn nötig)",type:"bw",rest:120,
  how:["Gestreckt am Barren stützen.","Oberkörper leicht nach vorn, Ellbogen nach hinten beugen.","Bis die Oberarme etwa waagerecht sind, dann hochdrücken."],
  anchor:{pt:"h1",at:[100,40]},props:[{t:"bar",x1:76,x2:132,y:40,posts:1}],
  A:S({sp:176,t1:12,s1:-70,t2:8,s2:-74}),B:S({sp:160,a1:-110,f1:18,a2:-112,f2:16,t1:14,s1:-70,t2:10,s2:-74})},
 pushup:{name:"Liegestütz",type:"bw",rest:75,
  how:["Hände unter den Schultern, Körper eine Linie.","Brust kontrolliert Richtung Boden senken.","Hochdrücken. Zu schwer: Hände erhöht."],
  anchor:{pt:"h1",at:[150,121]},
  A:S({sp:112,a1:0,f1:0,a2:0,f2:0,t1:-68,s1:-68,t2:-68,s2:-68,ft1:20,ft2:20}),B:S({sp:97,a1:-70,f1:77,a2:-70,f2:77,t1:-83,s1:-83,t2:-83,s2:-83,ft1:6,ft2:6})},
 invrow:{name:"Australian Rows (Ringe/TRX)",type:"bw",rest:90,
  how:["Unter die Ringe legen, Fersen am Boden, Körper gestreckt.","Brust zu den Händen ziehen.","Langsam zurück. Steiler = leichter."],
  anchor:{pt:"an1",at:[34,121]},props:[{t:"cable",from:[150,-50],to:"h1"},{t:"handle",at:"h1",w:8}],
  A:S({sp:100,a1:180,f1:180,a2:178,f2:178,t1:-80,s1:-80,t2:-80,s2:-80,ft1:180,ft2:180}),B:S({sp:117,a1:-100,f1:120,a2:-102,f2:118,t1:-63,s1:-63,t2:-63,s2:-63,ft1:180,ft2:180})},
 bwsquat:{name:"Box Squat",knee:1,type:"bw",rest:60,
  how:["Arme nach vorn, Hüfte nach hinten zur Box.","Box kurz antippen, nur so tief, wie es schmerzfrei geht.","Knie über den Fußspitzen."],
  props:[{t:"box",x:44,y:88,w:30}],
  A:S({sp:178,a1:84,f1:86,a2:86,f2:88}),B:S({sp:150,a1:100,f1:100,a2:102,f2:102,t1:82,s1:-18,t2:80,s2:-16})},
 stepdown:{name:"Step-down vom Kasten",knee:1,type:"bw",rest:60,
  how:["Auf einem Bein auf dem Kasten stehen.","Langsam beugen, bis die andere Ferse den Boden antippt.","Knie bleibt über dem Fuß und kippt nicht nach innen."],
  anchor:{pt:"an1",at:[88,93]},props:[{t:"box",x:66,y:96,w:40}],
  A:S({a1:80,f1:80,a2:76,f2:76,t2:24,s2:14}),B:S({sp:158,a1:88,f1:88,a2:84,f2:84,t1:55,s1:-28,t2:40,s2:28})},
 deadhang:{name:"Dead Hang",type:"s",rest:60,
  how:["An der Stange hängen, Arme gestreckt.","Schultern aktiv nach unten ziehen.","Locker atmen und halten."],
  anchor:{pt:"h1",at:[100,-44]},props:[{t:"bar",x1:62,x2:138,y:-44}],
  A:S({a1:178,f1:180,a2:176,f2:178,t1:3,s1:-6,t2:-3,s2:-10}),B:S({sp:178,a1:172,f1:178,a2:170,f2:176,t1:5,s1:-4,t2:-1,s2:-8})},
 tuck:{name:"Tuck Hold (L-Sit-Vorstufe)",type:"s",rest:60,
  how:["Auf Parallettes oder Liegestützgriffen stützen, Arme gestreckt.","Knie zur Brust ziehen, Füße vom Boden.","Halten, Schultern bleiben unten."],
  anchor:{pt:"h1",at:[100,108]},props:[{t:"bar",x1:88,x2:112,y:108,posts:1}],
  A:S({a1:8,f1:-4,a2:6,f2:-4,t1:78,s1:78,t2:76,s2:76,ft1:170,ft2:166}),B:S({a1:8,f1:-4,a2:6,f2:-4,t1:138,s1:22,t2:134,s2:18})},
 sideraise:{name:"Seitliches Beinheben im Liegen",knee:1,type:"bw",rest:30,
  how:["Auf der Seite liegen, Beine gestreckt.","Oberes Bein leicht nach hinten gedreht anheben.","Langsam ablassen. Becken bleibt ruhig."],
  anchor:{pt:"hip",at:[100,115]},props:[{t:"mat"}],
  A:S({sp:-90,a1:4,f1:30,a2:-90,f2:-90,t1:90,s1:90,t2:91,s2:91}),B:S({sp:-90,a1:4,f1:30,a2:-90,f2:-90,t1:124,s1:124,t2:91,s2:91})},
 hipabd:{name:"Hüftabduktion mit Band, stehend",knee:1,type:"bw",rest:30,
  how:["Band über den Knöcheln, an einer Wand abstützen.","Bein gestreckt zur Seite heben.","Langsam zurück. Oberkörper bleibt gerade."],
  anchor:{pt:"an2",at:[96,121]},props:[{t:"band",a:"an1",b:"an2"}],
  A:S({a2:-20,f2:-30,t1:4,s1:4,t2:-2,s2:-2}),B:S({sp:176,a2:-20,f2:-30,t1:32,s1:32,t2:-2,s2:-2})},
 slbridge:{name:"Einbeinige Glute Bridge",knee:1,type:"bw",rest:30,
  how:["Rückenlage, ein Fuß am Boden, das andere Bein gestreckt.","Hüfte hochdrücken, Becken bleibt gerade.","Oben kurz halten, langsam ablassen."],
  anchor:{pt:"sh",at:[50,117]},props:[{t:"mat"}],
  A:S({sp:-90,a1:90,f1:90,a2:90,f2:90,t1:125,s1:-49,t2:125,s2:125}),B:S({sp:-70,a1:92,f1:92,a2:92,f2:92,t1:100,s1:-50,t2:100,s2:100})},
 bandwalk:{name:"Seitschritte mit Band",knee:1,type:"bw",rest:30,
  how:["Band über den Knöcheln, leicht in die Knie.","Seitlich schrittweise gehen, Spannung halten.","Knie zeigen nach vorn."],
  anchor:GR,props:[{t:"band",a:"an1",b:"an2"}],
  A:S({a1:12,f1:40,a2:-12,f2:-40,t1:8,s1:2,t2:-8,s2:-2,ft1:90,ft2:-90}),B:S({a1:12,f1:40,a2:-12,f2:-40,t1:24,s1:8,t2:-24,s2:-8,ft1:90,ft2:-90})},
 deadbug:{name:"Dead Bug",type:"bw",rest:30,
  how:["Rückenlage, Arme zur Decke, Beine im 90-Grad-Winkel.","Gegengleich einen Arm und ein Bein flach strecken.","Unterer Rücken bleibt am Boden. Seite wechseln."],
  anchor:{pt:"hip",at:[100,117]},props:[{t:"mat"}],
  A:S({sp:-90,a1:180,f1:180,a2:176,f2:176,t1:180,s1:90,t2:176,s2:88}),B:S({sp:-90,a1:-100,f1:-100,a2:176,f2:176,t1:180,s1:90,t2:100,s2:100})},
 itbstretch:{name:"Dehnung Hüftaußenseite",knee:1,type:"s",rest:15,
  how:["Betroffenes Bein hinter dem anderen kreuzen.","Arme hoch, Oberkörper zur anderen Seite neigen.","Hüfte zur Seite schieben, bis es außen zieht. Halten."],
  anchor:GR,
  A:S({a1:4,f1:4,a2:-4,f2:-4,t1:-10,s1:-10,t2:12,s2:12,ft1:-90}),B:S({sp:200,a1:200,f1:205,a2:194,f2:200,t1:-10,s1:-10,t2:12,s2:12,ft1:-90})},
 legswing:{name:"Beinpendeln vor und zurück",type:"bw",rest:0,
  how:["Seitlich an einer Wand abstützen.","Bein locker nach vorn und hinten schwingen.","Oberkörper bleibt aufrecht. 10 pro Bein."],
  anchor:{pt:"an2",at:[96,121]},
  A:S({a1:-20,f1:-10,a2:70,f2:80,t1:-36,s1:-40}),B:S({a1:-20,f1:-10,a2:70,f2:80,t1:58,s1:50})},
 legswingside:{name:"Beinpendeln seitlich",type:"bw",rest:0,
  how:["Mit beiden Händen an einer Wand abstützen.","Bein vor dem Standbein seitlich hin und her schwingen.","Locker bleiben. 10 pro Bein."],
  anchor:{pt:"an2",at:[96,121]},
  A:S({a1:40,f1:60,a2:-40,f2:-60,t1:-26,s1:-26}),B:S({a1:40,f1:60,a2:-40,f2:-60,t1:38,s1:38})},
 revlunge:{name:"Ausfallschritt rückwärts",knee:1,type:"bw",rest:0,
  how:["Großen Schritt nach hinten machen.","Hinteres Knie Richtung Boden, vorderes Knie über dem Fuß.","Zurückdrücken. Nur so tief, wie es schmerzfrei geht."],
  anchor:{pt:"an1",at:[112,121]},
  A:S({a1:8,f1:-20,a2:-8,f2:-30}),B:S({sp:178,a1:8,f1:-20,a2:-8,f2:-30,t1:75,s1:-5,t2:-20,s2:-70,ft2:-10})},
 askip:{name:"Kniehebelauf",type:"m",rest:0,
  how:["Auf der Stelle oder locker vorwärts laufen.","Knie abwechselnd bis Hüfthöhe heben.","Arme gegengleich mitnehmen."],
  anchor:GR,
  A:S({a1:-40,f1:40,a2:50,f2:140,t1:95,s1:5}),B:S({a1:50,f1:140,a2:-40,f2:40,t2:95,s2:5})},
 buttkick:{name:"Anfersen",type:"m",rest:0,
  how:["Locker auf der Stelle oder vorwärts laufen.","Fersen abwechselnd Richtung Gesäß ziehen.","Arme locker mitschwingen."],
  anchor:GR,
  A:S({a1:-40,f1:40,a2:50,f2:140,t1:-6,s1:-160,ft1:-70}),B:S({a1:50,f1:140,a2:-40,f2:40,t2:-6,s2:-160,ft2:-70})},
};
for(const k in EX)EX[k].id=k;
const R=(id,sets,reps)=>({id,sets,reps});
const PLANS={
 gym:{label:"Gym",plans:[
  {id:"g-ok",title:"Oberkörper",min:60,ex:[R("bench",4,"8–10"),R("latpull",4,"8–10"),R("row",3,"10–12"),R("shpress",3,"8–10"),R("facepull",3,"12–15"),R("curl",3,"10–12"),R("pushdown",3,"10–12")]},
  {id:"g-uk",title:"Unterkörper",min:60,ex:[R("hipthrust",4,"8–10"),R("goblet",4,"8–10"),R("rdl",3,"8–10"),R("stepup",3,"8 / Seite"),R("legcurl",3,"10–12"),R("calf",3,"12–15"),R("sideplank",3,"30")]},
  {id:"g-gk",title:"Ganzkörper",min:60,ex:[R("goblet",3,"8–10"),R("bench",3,"8–10"),R("rdl",3,"8–10"),R("latpull",3,"8–10"),R("row",3,"10–12"),R("pallof",3,"10 / Seite"),R("farmer",3,"30")]}]},
 cali:{label:"Calisthenics",plans:[
  {id:"c-gk",title:"Ganzkörper",min:60,ex:[R("pullup",4,"4–6"),R("dips",4,"6–8"),R("pushup",3,"10–15"),R("invrow",3,"8–12"),R("bwsquat",3,"12–15"),R("stepdown",3,"8 / Seite"),R("hollow",3,"20–30"),R("tuck",3,"10–20"),R("deadhang",2,"30–45")]}]},
 home:{label:"Zuhause",plans:[
  {id:"h-knie",title:"Knie & Hüfte",min:15,ex:[R("sideraise",3,"12–15"),R("hipabd",3,"12 / Seite"),R("slbridge",3,"10 / Seite"),R("sideplank",3,"20–30"),R("bandwalk",3,"10 / Richtung"),R("deadbug",3,"8 / Seite"),R("itbstretch",2,"30")]},
  {id:"h-warm",title:"Lauf-Warm-up",min:8,ex:[R("legswing",1,"10 / Bein"),R("legswingside",1,"10 / Bein"),R("revlunge",1,"6 / Seite"),R("calf",1,"15"),R("askip",2,"20"),R("buttkick",2,"20")]}]}
};
Object.assign(EX,{
 plank:{name:"Unterarmstütz",type:"s",rest:45,
  how:["Unterarme unter den Schultern, Beine gestreckt.","Körper bildet eine Linie von Kopf bis Ferse.","Bauch und Gesäß fest, ruhig atmen und halten."],
  anchor:{pt:"el1",at:[146,121]},props:[{t:"mat"}],
  A:S({sp:103,a1:0,f1:90,a2:2,f2:92,t1:-77,s1:-77,t2:-77,s2:-77,ft1:20,ft2:20}),B:S({sp:101,a1:0,f1:90,a2:2,f2:92,t1:-79,s1:-79,t2:-79,s2:-79,ft1:20,ft2:20})},
 pikepush:{name:"Pike Push-up",type:"bw",rest:75,
  how:["Hüfte hoch, Körper bildet ein umgedrehtes V.","Kopf zwischen den Händen Richtung Boden senken.","Hochdrücken. Vorstufe für den Handstand-Liegestütz."],
  anchor:{pt:"h1",at:[140,121]},
  A:S({sp:60,a1:20,f1:20,a2:20,f2:20,t1:-14,s1:-14,t2:-14,s2:-14,ft1:30,ft2:30}),B:S({sp:40,a1:-40,f1:40,a2:-40,f2:40,t1:-24,s1:-24,t2:-24,s2:-24,ft1:30,ft2:30})},
 dbrow:{name:"Vorgebeugtes Kurzhantel-Rudern",type:"kg",rest:75,
  how:["Oberkörper nach vorn neigen, Rücken gerade, Knie leicht gebeugt.","Hanteln zur Hüfte ziehen, Ellbogen nah am Körper.","Langsam ablassen."],
  props:[{t:"db",at:["h1","h2"]}],
  A:S({sp:108,a1:0,f1:0,a2:-3,f2:-3,t1:14,s1:-6,t2:12,s2:-8}),B:S({sp:108,a1:-55,f1:8,a2:-58,f2:6,t1:14,s1:-6,t2:12,s2:-8})},
});
const META={
 bench:["front",1,"8–10"],shpress:["front",1,"8–10"],pushdown:["front",1,"10–12"],curl:["front",1,"10–12"],dips:["front",0,"6–8"],pushup:["front",0,"10–15"],pikepush:["front",0,"6–10"],
 latpull:["back",1,"8–10"],row:["back",1,"10–12"],facepull:["back",1,"12–15"],dbrow:["back",1,"8–10"],pullup:["back",0,"4–6"],invrow:["back",0,"8–12"],deadhang:["back",0,"30–45"],
 hollow:["core",0,"20–30"],sideplank:["core",0,"20–30"],deadbug:["core",0,"8 / Seite"],tuck:["core",0,"10–20"],plank:["core",0,"30–45"],pallof:["core",1,"10 / Seite"],farmer:["core",1,"30"],
 hipthrust:["legs",1,"8–10"],goblet:["legs",1,"8–10"],rdl:["legs",1,"8–10"],stepup:["legs",1,"8 / Seite"],legcurl:["legs",1,"10–12"],calf:["legs",0,"12–15"],bwsquat:["legs",0,"12–15"],stepdown:["legs",0,"8 / Seite"],slbridge:["legs",0,"10 / Seite"],sideraise:["legs",0,"12–15"],hipabd:["legs",0,"12 / Seite"],bandwalk:["legs",0,"10 / Richtung"],revlunge:["legs",0,"6 / Seite"],
 legswing:["warm",0,"10 / Bein"],legswingside:["warm",0,"10 / Bein"],askip:["warm",0,"20"],buttkick:["warm",0,"20"],itbstretch:["warm",0,"30"]};
for(const k in EX){EX[k].id=k;const m=META[k];if(m){EX[k].cat=m[0];EX[k].eq=!!m[1];EX[k].reps=m[2]}}
const CATS=[["front","Vorderer Oberkörper"],["back","Rücken"],["core","Rumpf"],["legs","Beine & Hüfte"],["warm","Aufwärmen & Dehnen"]];
Object.assign(EX,{
 benchbb:{name:"Bankdrücken, Langhantel",type:"kg",rest:120,
  how:["Auf der Bank liegen, Augen unter der Stange, Füße fest am Boden.","Stange kontrolliert zur unteren Brust senken, Ellbogen leicht angelegt.","Nach oben drücken. Bei schweren Sätzen mit Partner oder Sicherungen."],
  anchor:{pt:"sh",at:[60,74]},props:[{t:"bench",x:34,y:79,w:80},{t:"plate",at:"h1",r:12}],
  A:S({sp:-90,a1:18,f1:176,a2:18,f2:176,t1:70,s1:0,t2:62,s2:-6}),B:S({sp:-90,a1:178,f1:180,a2:178,f2:180,t1:70,s1:0,t2:62,s2:-6})},
 deadlift:{name:"Kreuzheben, Langhantel",type:"kg",rest:150,
  how:["Füße hüftbreit, Stange über der Fußmitte, Rücken gerade.","Aus den Beinen drücken, Stange nah am Körper nach oben führen.","Oben Hüfte strecken, kontrolliert absetzen. Rücken bleibt neutral."],
  props:[{t:"plate",at:"h1",r:13}],
  A:S({sp:122,a1:-6,f1:-6,a2:-6,f2:-6,t1:64,s1:-22,t2:62,s2:-24}),B:S({})},
 bulgarian:{name:"Bulgarian Split Squat",knee:1,type:"kg",rest:90,
  how:["Hinteren Fuß auf eine Bank legen, vorderer Fuß weit genug vorn.","Senkrecht nach unten gehen, bis das hintere Knie fast den Boden berührt.","Über die vordere Ferse hochdrücken. Nur so tief, wie das Knie schmerzfrei ist."],
  anchor:{pt:"an1",at:[128,121]},props:[{t:"bench",x:22,y:84,w:40},{t:"db",at:["h1","h2"]}],
  A:S({sp:178,a1:2,f1:2,a2:-2,f2:-2,t1:16,s1:-6,t2:-26,s2:-104,ft2:-20}),B:S({sp:172,a1:4,f1:4,a2:0,f2:0,t1:78,s1:-12,t2:-6,s2:-96,ft2:-10})},
 ohp:{name:"Schulterdrücken, Langhantel stehend",type:"kg",rest:120,
  how:["Stange auf Schulterhöhe, Hände etwas breiter als schulterbreit.","Gerade nach oben drücken, Kopf kurz nach hinten nehmen.","Oben ganz strecken, Bauch und Gesäß fest, kein Hohlkreuz."],
  props:[{t:"plate",at:"h1",r:12}],
  A:S({a1:24,f1:172,a2:24,f2:172}),B:S({a1:178,f1:180,a2:178,f2:180})},
 latraise:{name:"Seitheben, Kurzhanteln",type:"kg",rest:60,
  how:["Aufrecht stehen, Hanteln seitlich am Körper.","Arme leicht gebeugt seitlich bis Schulterhöhe heben.","Langsam ablassen, nicht schwingen. Leichtes Gewicht reicht."],
  props:[{t:"db",at:["h1","h2"]}],
  A:S({a1:10,f1:14,a2:-10,f2:-14,t1:6,t2:-6}),B:S({a1:84,f1:92,a2:-84,f2:-92,t1:6,t2:-6})},
 frontraise:{name:"Frontheben, Kurzhanteln",type:"kg",rest:60,
  how:["Aufrecht stehen, Hanteln vor den Oberschenkeln.","Arme gestreckt nach vorn bis Schulterhöhe heben.","Langsam ablassen. Oberkörper bleibt ruhig."],
  props:[{t:"db",at:["h1","h2"]}],
  A:S({a1:6,f1:8,a2:2,f2:4}),B:S({a1:90,f1:92,a2:4,f2:6})},
});
for(const [k,v] of Object.entries({benchbb:["front",1,"6–8"],deadlift:["back",1,"5–6"],bulgarian:["legs",1,"8 / Seite"],ohp:["shoulders",1,"6–8"],latraise:["shoulders",1,"12–15"],frontraise:["shoulders",1,"10–12"],shpress:["shoulders",1,"8–10"],facepull:["shoulders",1,"12–15"],pikepush:["shoulders",0,"6–10"]})){EX[k].id=k;EX[k].cat=v[0];EX[k].eq=!!v[1];EX[k].reps=v[2]}
CATS.splice(1,0,["shoulders","Schultern"]);
PLANS.gym.plans[0].ex.splice(4,0,R("latraise",3,"12–15"));
Object.assign(EX,{
 cablefly:{name:"Butterfly am Kabel",type:"kg",rest:60,
  how:["Zwischen die Kabeltürme stellen, Griffe auf Schulterhöhe oder etwas höher.","Arme leicht gebeugt im Bogen vor der Brust zusammenführen.","Kurz die Brust anspannen, langsam weit öffnen."],
  anchor:GR,props:[{t:"cable",from:[18,-30],to:"h2"},{t:"cable",from:[182,-30],to:"h1"}],
  A:S({a1:100,f1:92,a2:-100,f2:-92,t1:6,t2:-6}),B:S({a1:28,f1:-12,a2:-28,f2:12,t1:6,t2:-6})},
 revfly:{name:"Reverse Butterfly am Kabel",type:"kg",rest:60,
  how:["Kabel über Kreuz greifen: linke Hand das rechte Kabel, rechte Hand das linke.","Arme fast gestreckt auf Schulterhöhe nach außen ziehen.","Schulterblätter zusammen, langsam zurück. Trainiert die hintere Schulter."],
  anchor:GR,props:[{t:"cable",from:[14,4],to:"h1"},{t:"cable",from:[186,4],to:"h2"}],
  A:S({a1:62,f1:-10,a2:-62,f2:10,t1:6,t2:-6}),B:S({a1:92,f1:90,a2:-92,f2:-90,t1:6,t2:-6})},
});
for(const [k,v] of Object.entries({cablefly:["front",1,"10–12"],revfly:["shoulders",1,"12–15"]})){EX[k].id=k;EX[k].cat=v[0];EX[k].eq=!!v[1];EX[k].reps=v[2]}
Object.assign(EX,{
 birddog:{name:"Bird Dog",type:"bw",rest:30,
  how:["Vierfüßlerstand: Hände unter den Schultern, Knie unter der Hüfte.","Gegengleich einen Arm nach vorn und ein Bein nach hinten strecken.","Rücken bleibt ruhig und gerade, kurz halten, Seite wechseln."],
  anchor:{pt:"k1",at:[86,119]},props:[{t:"mat"}],
  A:S({sp:110,a1:2,f1:2,a2:-2,f2:-2,t1:0,s1:-90,t2:2,s2:-88,ft1:-100,ft2:-100}),B:S({sp:106,a1:100,f1:100,a2:-2,f2:-2,t1:0,s1:-90,t2:-92,s2:-92,ft1:-100,ft2:-170})},
 balance:{name:"Einbeinstand",type:"s",rest:15,
  how:["Auf einem Bein stehen, Knie leicht gebeugt.","Gleichgewicht halten, Fuß bleibt ruhig am Boden.","Steigern: Augen zu oder auf einem Kissen stehen. Seite wechseln."],
  A:S({a1:40,f1:40,a2:-40,f2:-40,t2:40,s2:-50}),B:S({sp:176,a1:56,f1:56,a2:-26,f2:-26,t2:46,s2:-60})},
 glutebridge:{name:"Glute Bridge",type:"bw",rest:30,
  how:["Rückenlage, Füße hüftbreit aufgestellt.","Hüfte hochdrücken, bis Schultern, Hüfte und Knie eine Linie bilden.","Oben kurz halten, langsam ablassen."],
  anchor:{pt:"sh",at:[50,117]},props:[{t:"mat"}],
  A:S({sp:-90,a1:90,f1:90,a2:90,f2:90,t1:125,s1:-49,t2:122,s2:-52}),B:S({sp:-70,a1:92,f1:92,a2:92,f2:92,t1:100,s1:-50,t2:98,s2:-52})},
 onearmrow:{name:"Einarmiges Kurzhantel-Rudern",type:"kg",rest:60,
  how:["Knie und Hand einer Seite auf die Bank, Rücken gerade.","Hantel zur Hüfte ziehen, Ellbogen nah am Körper.","Langsam ablassen. Beide Seiten gleich viele Wiederholungen."],
  anchor:{pt:"an1",at:[80,121]},props:[{t:"bench",x:50,y:89,w:116},{t:"db",at:["h1"]}],
  A:S({sp:95,a1:0,f1:0,a2:0,f2:75,t1:-12,s1:-4,t2:0,s2:-90,ft2:-100}),B:S({sp:95,a1:-62,f1:10,a2:0,f2:75,t1:-12,s1:-4,t2:0,s2:-90,ft2:-100})},
 dorsiflex:{name:"Fußheben mit Band",knee:1,type:"bw",rest:20,
  how:["Sitzen, Bein gestreckt, Band vorn befestigt und um den Fußrücken gelegt.","Zehen gegen den Widerstand zu dir heranziehen.","Langsam zurück. Stärkt das Sprunggelenk."],
  anchor:{pt:"hip",at:[60,118]},props:[{t:"mat"},{t:"cable",from:[196,96],to:"to1"}],
  A:S({sp:186,a1:30,f1:60,a2:26,f2:56,t1:90,s1:90,t2:92,s2:92,ft1:150,ft2:150}),B:S({sp:186,a1:30,f1:60,a2:26,f2:56,t1:90,s1:90,t2:92,s2:92,ft1:205,ft2:150})},
 anklerot:{name:"Fuß nach außen und innen gegen Band",knee:1,type:"bw",rest:20,
  how:["Sitzen, Band seitlich befestigt und um den Vorfuß gelegt.","Fuß langsam nach außen drehen, dann Seite des Bands wechseln und nach innen.","Nur das Sprunggelenk bewegt sich, das Knie bleibt ruhig."],
  anchor:{pt:"hip",at:[60,118]},props:[{t:"mat"},{t:"band",a:"to1",b:[196,112]}],
  A:S({sp:186,a1:30,f1:60,a2:26,f2:56,t1:90,s1:90,t2:92,s2:92,ft1:166,ft2:180}),B:S({sp:186,a1:30,f1:60,a2:26,f2:56,t1:90,s1:90,t2:92,s2:92,ft1:196,ft2:180})},
});
for(const [k,v] of Object.entries({birddog:["core",0,"8 / Seite"],balance:["legs",0,"30"],glutebridge:["legs",0,"12–15"],onearmrow:["back",1,"10 / Seite"],dorsiflex:["legs",0,"15"],anklerot:["legs",0,"15 / Richtung"]})){EX[k].id=k;EX[k].cat=v[0];EX[k].eq=!!v[1];EX[k].reps=v[2]}
const TPL={
 kraft:{label:"Kraft & Calisthenics",pain:"Knie",modes:PLANS},
 ruecken:{label:"Rücken, Po & Sprunggelenk",pain:"Sprunggelenk",modes:{
  gym:{label:"Gym",plans:[
   {id:"a",title:"Beine & Po",min:55,ex:[R("hipthrust",4,"10–12"),R("goblet",3,"10"),R("rdl",3,"10"),R("stepup",3,"10 / Seite"),R("bandwalk",3,"12 / Richtung"),R("calf",3,"12–15"),R("balance",3,"30")]},
   {id:"b",title:"Rücken & Rumpf",min:55,ex:[R("onearmrow",3,"10 / Seite"),R("latpull",3,"10–12"),R("facepull",3,"12–15"),R("birddog",3,"8 / Seite"),R("deadbug",3,"8 / Seite"),R("sideplank",3,"20–30"),R("pallof",3,"10 / Seite")]},
   {id:"c",title:"Ganzkörper",min:55,ex:[R("hipthrust",3,"10–12"),R("latpull",3,"10–12"),R("row",3,"10–12"),R("stepup",3,"10 / Seite"),R("birddog",3,"8 / Seite"),R("sideplank",2,"20–30"),R("calf",3,"12–15")]}]},
  home:{label:"Zuhause",plans:[
   {id:"h",title:"Sprunggelenk & Rumpf",min:20,ex:[R("balance",3,"30"),R("dorsiflex",2,"15"),R("anklerot",2,"15 / Richtung"),R("calf",3,"12"),R("glutebridge",3,"12–15"),R("birddog",2,"8 / Seite"),R("sideplank",2,"20–30")]}]}}},
 leer:{label:"Leer starten",pain:"Schmerz",modes:{gym:{label:"Gym",plans:[{id:"a",title:"Mein Plan",min:60,ex:[]}]},home:{label:"Zuhause",plans:[{id:"h",title:"Zuhause",min:20,ex:[]}]}}}
};
Object.assign(EX,{
 wallsit:{name:"Wall Sit",knee:1,type:"s",rest:45,
  how:["Rücken an die Wand, Füße etwa hüftbreit vor dem Körper.","Runterrutschen, bis die Knie etwa im rechten Winkel sind, nur so tief wie schmerzfrei.","Knie über den Füßen, Gewicht auf den Fersen, halten."],
  anchor:{pt:"hip",at:[44,85]},props:[{t:"box",x:30,y:-40,w:6}],
  A:S({a1:40,f1:80,a2:36,f2:76,t1:90,s1:0,t2:88,s2:-2}),B:S({sp:179,a1:40,f1:80,a2:36,f2:76,t1:90,s1:0,t2:88,s2:-2})},
 walltoeraise:{name:"Wall Toe Raise",knee:1,type:"bw",rest:30,
  how:["Mit Rücken und Gesäß an die Wand stellen, Füße eine Fußlänge vor der Wand.","Zehen und Vorfuß so weit wie möglich anheben, Fersen bleiben am Boden.","Langsam absenken. Kräftigt das Schienbein."],
  anchor:{pt:"an1",at:[46,121]},props:[{t:"box",x:30,y:-40,w:6}],
  A:S({sp:184,t1:-6,s1:-6,t2:-8,s2:-8,ft1:90,ft2:90}),B:S({sp:184,t1:-6,s1:-6,t2:-8,s2:-8,ft1:128,ft2:128})},
 wallsitband:{name:"Wall Sit mit Band (Hüftabduktion)",knee:1,type:"s",rest:45,
  how:["Miniband knapp über die Knie, in die Wall-Sit-Position gehen.","Knie kontrolliert gegen das Band nach außen drücken und wieder nachgeben.","Knie bleiben über den Füßen, nicht nach innen fallen lassen."],
  anchor:{pt:"hip",at:[44,85]},props:[{t:"box",x:30,y:-40,w:6},{t:"band",a:"k1",b:"k2"}],
  A:S({a1:40,f1:80,a2:36,f2:76,t1:90,s1:0,t2:86,s2:-2}),B:S({a1:40,f1:80,a2:36,f2:76,t1:92,s1:2,t2:84,s2:-4})},
 slcalf:{name:"Einbeiniges Wadenheben",type:"bw",rest:30,
  how:["Auf einem Bein mit dem Fußballen auf eine Stufe, an der Wand festhalten.","Hoch auf die Zehenspitzen drücken.","Langsam tief absenken. Seite wechseln."],
  anchor:{pt:"to1",at:[112,104]},props:[{t:"box",x:98,y:107,w:34},{t:"box",x:160,y:-40,w:6}],
  A:S({a2:70,f2:80,t2:4,s2:-70,ft1:118}),B:S({a2:70,f2:80,t2:4,s2:-70,ft1:48})},
 hipdrop:{name:"Pelvic Hip Drop",knee:1,type:"bw",rest:30,
  how:["Seitlich auf einer Stufe stehen, ein Bein hängt frei daneben.","Standbein gestreckt lassen, Becken auf der freien Seite langsam absenken.","Becken aus der Hüfte des Standbeins wieder anheben. Kräftigt den seitlichen Gesäßmuskel."],
  anchor:{pt:"an1",at:[96,93]},props:[{t:"box",x:70,y:96,w:40}],
  A:S({sp:176,a1:30,f1:40,a2:-30,f2:-40,t2:-4,s2:-4,ft2:-90}),B:S({sp:182,a1:30,f1:40,a2:-30,f2:-40,t2:-16,s2:-34,ft2:-90})},
 tibraise:{name:"Tibialis Raise",type:"bw",rest:30,
  how:["Mit dem Rücken an die Wand lehnen, Füße weiter vorn als beim Wall Toe Raise.","Zehen kraftvoll Richtung Schienbein ziehen.","Langsam absenken. Je weiter die Füße vorn, desto schwerer."],
  anchor:{pt:"an1",at:[80,121]},props:[{t:"box",x:40,y:-40,w:6}],
  A:S({sp:195,t1:15,s1:15,t2:13,s2:13,ft1:90,ft2:90}),B:S({sp:195,t1:15,s1:15,t2:13,s2:13,ft1:132,ft2:132})},
 hiprot:{name:"Hüftrotation im Stand",knee:1,type:"bw",rest:20,
  how:["Seitlich an der Wand abstützen, auf einem Bein stehen.","Freies Knie nach vorn hochheben, dann in einem großen Kreis zur Seite und nach hinten führen.","Langsam und kontrolliert, Becken bleibt ruhig. Danach die Richtung wechseln."],
  anchor:{pt:"an2",at:[96,121]},props:[{t:"box",x:150,y:-40,w:6}],
  A:S({a2:80,f2:84,a1:-10,f1:-10,t1:92,s1:0}),B:S({a2:80,f2:84,a1:-10,f1:-10,t1:-30,s1:-100})},
});
for(const [k,v] of Object.entries({wallsit:["legs",0,"30–45"],walltoeraise:["legs",0,"15"],wallsitband:["legs",0,"30"],slcalf:["legs",0,"12 / Seite"],hipdrop:["legs",0,"12 / Seite"],tibraise:["legs",0,"15"],hiprot:["legs",0,"5 / Richtung"]})){EX[k].id=k;EX[k].cat=v[0];EX[k].eq=!!v[1];EX[k].reps=v[2]}
const KNIEVIDEO={id:"h-video",title:"Läuferknie-Routine",min:25,ex:[R("wallsit",3,"30–45"),R("walltoeraise",3,"15"),R("wallsitband",3,"30"),R("slcalf",3,"12 / Seite"),R("stepdown",3,"10 / Seite"),R("hipdrop",3,"12 / Seite"),R("tibraise",3,"15"),R("sideraise",3,"15 / Seite"),R("hiprot",2,"5 / Richtung")]};
PLANS.home.plans.splice(1,0,KNIEVIDEO);

/* ---------- Geräte & Übungsart (für den Plan-Generator) ---------- */
const GEARS=[["db","Kurzhanteln"],["bb","Langhantel"],["cable","Kabelzug"],["mach","Maschinen"],["bench","Bank"],["bar","Klimmzugstange / Barren"],["kb","Kettlebell"],["band","Band / Miniband"],["box","Stufe / Box"]];
/* je Eintrag: alle Elemente nötig, "a|b" = eins davon reicht */
const NEED={bench:["db","bench"],latpull:["cable"],row:["cable"],shpress:["db"],facepull:["cable"],curl:["db"],pushdown:["cable"],
 hipthrust:["bench","bb|db"],goblet:["kb|db"],rdl:["db|bb"],stepup:["box"],legcurl:["mach"],pallof:["cable|band"],farmer:["db|kb"],
 pullup:["bar"],dips:["bar"],invrow:["bar"],stepdown:["box"],deadhang:["bar"],tuck:["bar"],hipabd:["band"],bandwalk:["band"],
 dbrow:["db"],benchbb:["bb","bench"],deadlift:["bb"],bulgarian:["bench|box"],ohp:["bb"],latraise:["db|cable"],frontraise:["db|cable"],
 cablefly:["cable"],revfly:["cable"],onearmrow:["db","bench"],dorsiflex:["band"],anklerot:["band"],wallsitband:["band"],hipdrop:["box"]};
/* c = Grundübung, a = Ergänzung, r = Stabilität/Reha, w = Aufwärmen */
const KIND={};
for(const id of ["bench","latpull","row","shpress","hipthrust","goblet","rdl","stepup","pullup","dips","pushup","invrow","bwsquat","benchbb","deadlift","bulgarian","ohp","dbrow","onearmrow","pikepush","revlunge"])KIND[id]="c";
for(const id of ["sideraise","hipabd","slbridge","bandwalk","dorsiflex","anklerot","wallsit","walltoeraise","wallsitband","hipdrop","hiprot","balance","stepdown","tibraise"])KIND[id]="r";
for(const id of Object.keys(EX)){if(!KIND[id])KIND[id]=EX[id].cat==="warm"?"w":"a";EX[id].need=NEED[id]||[];EX[id].kind=KIND[id]}
/* „gelenkschonend“: Übungen mit hoher Wirbelsäulen-, Knie- oder Sprunggelenkslast */
const HARSH=["deadlift","ohp","bulgarian","revlunge","askip","buttkick","dips","benchbb"];
for(const id of HARSH)EX[id].harsh=1;
