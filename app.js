{
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const svg=(ex,t)=>`<svg viewBox="0 -56 200 184" aria-hidden="true">${ex.A?figSVG(ex,t):'<g class="nofig"><path d="M52 36h96"/><path d="M62 10v52M138 10v52M78 -2v76M122 -2v76"/></g>'}</svg>`;
const dec=x=>String(x??"").replace(".",",");
const num=x=>{const v=parseFloat(String(x??"").replace(",","."));return isFinite(v)?v:0};
const exList=()=>Object.values(EX).filter(e=>!e.off);
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const dayKey=t=>{const d=new Date(t);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const fmtDay=t=>{const d=new Date(t);return d.toLocaleDateString("de-DE",Object.assign({weekday:"short",day:"2-digit",month:"2-digit"},d.getFullYear()!==new Date().getFullYear()?{year:"numeric"}:{}))};
const trow=e=>e.type==="s"?" Sek.":e.type==="m"?" m":"";
const unit={kg:"kg",bw:"+kg",s:"Sek.",m:"Meter"};
const clone=o=>JSON.parse(JSON.stringify(o));
const ICON={play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 grip:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>',
 dice:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/></svg>'};

/* ---------- state ---------- */
let profiles=[],activeId=null,mode=null,planId=null,draft={},pain=null,allLogs=[],runs=[],custom=[];
let libF="all",sheetMode="train",libId=null,picker=false,pickCat=null,editing=false,delArm=false,newTpl="kraft",rstArm=false;
let order={},work=null,saveSrc=null,sMode=null,gen=null,swaps={},training=false,back=null,swapPerm=false;
let set={sound:true,loud:false,awake:true,bar:20,plates:[25,20,15,10,5,2.5,1.25],backup:0,undo:false};
const filled=x=>!!(x.r||x.w||x.ok);
function load(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}}
function store(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){msg("Speichern hat nicht geklappt: Der Speicher ist voll oder gesperrt. Mach in den Einstellungen eine Sicherung.");return false}}
const persist=()=>store("tk3",{activeId,mode,planId,draft,order,swaps,day:dayKey(Date.now())});
const prof=()=>profiles.find(p=>p.id===activeId)||profiles[0]||null;
const firstPid=()=>profiles[0]?profiles[0].id:null;
const mine=l=>(l.pid||firstPid())===(prof()&&prof().id);
const logs=()=>allLogs.filter(mine);
const myRuns=()=>runs.filter(mine);
function newProfile(name,tpl){const t=TPL[tpl]||TPL.leer,id="p"+Date.now().toString(36);const modes=clone(t.modes);
  for(const m of Object.values(modes))for(const p of m.plans)p.id=id+"-"+p.id;
  return {id,name:name||"Profil",pain:t.pain,tpl,goal:3,modes}}
function ensureSel(){const p=prof();if(!p)return;activeId=p.id;if(!mode||!p.modes[mode])mode=Object.keys(p.modes)[0];
  const ps=p.modes[mode].plans;if(!ps.find(x=>x.id===planId))planId=ps[0]?ps[0].id:null}
const plan=()=>{const p=prof();if(!p)return null;ensureSel();return p.modes[mode].plans.find(x=>x.id===planId)||null};
const dk=i=>`${activeId}:${planId}:${i}`;
const ok_=()=>`${activeId}:${planId}`;
/* heutige Reihenfolge (nur für heute, Plan bleibt gleich) */
function ord(p){const n=p.ex.length,o=order[ok_()];
  if(Array.isArray(o)&&o.length===n&&[...o].sort((a,b)=>a-b).every((x,i)=>x===i))return o;return p.ex.map((_,i)=>i)}
const ordChanged=p=>ord(p).some((x,i)=>x!==i);
function toast(t){const el=$("#toast");el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2600)}
function startEdit(){const p=plan();work=p?clone(p):null;if(work)work.ex.forEach((r,i)=>r._i=i)}
const cleanEx=ex=>ex.map(r=>{const o={id:r.id,sets:r.sets,reps:r.reps};if(r.orig&&!r.today)o.orig=r.orig;return o});
const isTime=e=>e.type==="s"||e.type==="m";
/* heutiger Tausch: gilt nur für diese Einheit, der Plan bleibt gleich */
const rowAt=(p,i)=>{const r=p.ex[i],s=swaps[dk(i)];return s&&EX[s]?{id:s,sets:r.sets,reps:EX[s].reps,orig:r.id,today:true}:r};
function sets(p,i){const r=rowAt(p,i),k=dk(i);if(!draft[k])draft[k]=Array.from({length:r.sets},()=>({w:"",r:"",ok:false}));return draft[k]}
function lastFor(id){for(const l of logs()){const e=l.entries&&l.entries[id];if(e&&e.some(x=>x.r||x.w))return e.filter(x=>x.r||x.w)}return null}
/* Vorschlag für einen Satz: Werte vom letzten Mal; heute geändertes Gewicht wird weitergeführt */
function hint(id,s,i){const last=lastFor(id),at=k=>last?last[Math.min(k,last.length-1)]:null,l=at(i);let w=l?l.w:"",r=l?l.r:"";
  for(let k=i-1;k>=0;k--){const x=s[k];if(!x.r&&!x.w)continue;const o=at(k);if(x.w&&(!o||num(o.w)!==num(x.w)))w=x.w;if(!l&&x.r)r=x.r;break}
  return {w:w||"",r:r||""}}
const fmt=(arr,t)=>arr.filter(x=>x.r||x.w).map(x=>(t==="kg"||(t==="bw"&&x.w)?dec(x.w||0)+" kg × ":"")+(x.r||"–")+(t==="s"?" s":t==="m"?" m":"")).join(" · ");
const topReps=r=>{const m=String(r).match(/(\d+)\D*$/);return m?+m[1]:null};

/* ---------- storage ---------- */
function saveProfiles(){persist();return store("tk3-prof",{profiles,v:3,updated:Date.now()})}
const saveLogs=()=>{allLogs.sort((a,b)=>b.ts-a.ts);return store("tk3-logs",allLogs)};
const saveRuns=()=>{runs.sort((a,b)=>b.ts-a.ts);return store("tk3-runs",runs)};
const saveSet=()=>store("tk3-set",set);
const saveCust=()=>store("tk3-cust",custom);
function msg(t){const m=$("#store");m.textContent=t;m.hidden=!t}

/* ---------- training view ---------- */
function renderTop(){
  const p=prof();$("#who").innerHTML=p?`${esc(p.name)} <span aria-hidden="true">▾</span>`:"Profil";
  $("#date").textContent=new Date().toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"});
  if(!p){$("#seg").innerHTML="";$("#plans").innerHTML="";return}
  ensureSel();const ms=Object.entries(p.modes);
  $("#seg").style.gridTemplateColumns=`repeat(${ms.length},minmax(0,1fr))`;
  $("#seg").innerHTML=ms.map(([k,m])=>`<button data-mode="${k}" aria-pressed="${k===mode}">${esc(m.label)}</button>`).join("");
  $("#plans").innerHTML=p.modes[mode].plans.map(x=>`<button class="plan" data-plan="${x.id}" aria-pressed="${x.id===planId}"><h3>${esc(x.title)}</h3><div class="m">ca. ${x.min} Min · ${x.ex.length} Übungen</div></button>`).join("")
    +(editing?`<button class="plan" id="newplan"><h3>+ Leerer Plan</h3><div class="m">in „${esc(p.modes[mode].label)}“</div></button>`
      :`<button class="plan gen" id="genplan"><h3>+ Plan erstellen</h3><div class="m">nach Region, Dauer, Geräten</div></button>`);
  $("#edit").textContent=editing?"Abbrechen":"Plan bearbeiten";
  const pl=plan();$("#planinfo").textContent=pl&&!editing?(pl.ex.length?"":"Noch keine Übungen. Tippe auf „Plan bearbeiten“."):"";
}
function renderList(full=true){
  const p=plan();if(!p){$("#list").innerHTML="";$("#finish").innerHTML="";return}
  if(editing){renderEdit();$("#finish").innerHTML="";return}
  const o=ord(p);
  $("#list").innerHTML=(ordChanged(p)?`<div class="ordnote"><span>Reihenfolge nur für heute geändert</span><button class="link" id="ordreset">Zurücksetzen</button><button class="link" id="ordsave">Als neuen Plan speichern</button></div>`:"")
   +o.map(i=>{const r=rowAt(p,i),e=EX[r.id];if(!e)return "";const s=sets(p,i),d=s.filter(x=>x.ok).length;
    return `<div class="item"><button class="row" data-open="${i}"><div class="thumb">${svg(e,1)}</div><div><div class="t">${esc(e.name)}${e.knee?'<span class="knee" title="Stabilität & Reha"></span>':""}</div><div class="d">${r.sets} × ${esc(r.reps)}${trow(e)}${r.orig?` · <span class="swapped">${r.today?"nur heute":"getauscht"}</span>`:""}</div></div><span class="prog ${d>=s.length&&d?"done":""}">${d}/${s.length}</span></button><button class="grip" data-grip aria-label="${esc(e.name)} verschieben (gedrückt halten und ziehen)">${ICON.grip}</button></div>`}).join("");
  if(!full)return;
  const lbl=prof().pain||"Schmerz";
  $("#finish").innerHTML=p.ex.length?`<h3>Beschwerden ${esc(lbl)}?</h3><div class="sub">0 = keine, 10 = sehr stark</div>
   <div class="pain" id="pain">${Array.from({length:11},(_,i)=>`<button data-p="${i}" aria-pressed="${pain===i}">${i}</button>`).join("")}</div>
   <textarea id="note" rows="2" placeholder="Notiz (optional)"></textarea>
   <button class="cta" id="save">Einheit speichern</button><div class="sub" id="savemsg" style="margin-top:8px"></div>`:"";
}
function renderEdit(){
  if(!work)startEdit();const p=work;
  $("#list").innerHTML=`<div class="grid2e"><label>Name des Plans<input id="ptitle" value="${esc(p.title)}"></label><label>Dauer (Min.)<input id="pmin" inputmode="numeric" value="${p.min}"></label></div>`
   +`<div class="sub" style="margin-bottom:4px">Zum Umsortieren den Griff rechts gedrückt halten und ziehen.</div>`
   +p.ex.map((r,i)=>{const e=EX[r.id];if(!e)return "";return `<div class="item"><div class="erow"><div class="thumb s">${svg(e,1)}</div><div><div class="t">${esc(e.name)}</div>
    <div class="ctl"><label class="mini">Sätze<input data-es="${i}" inputmode="numeric" value="${r.sets}"></label><label class="mini">Wdh./Zeit<input class="reps" data-er="${i}" value="${esc(r.reps)}"></label>
    <button class="sm" data-rm="${i}" aria-label="${esc(e.name)} entfernen">✕</button></div></div></div><button class="grip" data-grip aria-label="${esc(e.name)} verschieben">${ICON.grip}</button></div>`}).join("")
   +`<button class="cta sec" id="addex">+ Übung hinzufügen</button>
    <div class="btns"><button class="cta" id="esave">Änderungen speichern</button><button class="cta sec" id="esaveas">Als neuen Plan speichern</button></div>
    <div class="row2">${prof().modes[mode].plans.length>1?`<button class="link danger" id="delplan">${delArm?"Wirklich löschen? Nochmal tippen":"Plan löschen"}</button>`:""}<button class="link ${rstArm?"danger":""}" id="resettpl">${rstArm?"Ersetzt ALLE Pläne dieses Profils. Nochmal tippen":"Startpläne neu laden"}</button></div>`;
}
/* ---------- library ---------- */
function libRow(e,attr){return `<button class="row" ${attr}><div class="thumb">${svg(e,1)}</div><div><div class="t">${esc(e.name)}${e.knee?'<span class="knee"></span>':""}</div><div class="d">${CATS.find(c=>c[0]===e.cat)[1]}</div></div><span class="eqtag">${e.eq?"Gerät":"ohne Gerät"}</span></button>`}
function renderLib(){
  $("#libf").innerHTML=[["all","Alle"],["eq","Mit Gerät"],["bw","Ohne Gerät"]].map(([k,t])=>`<button class="chip" data-libf="${k}" aria-pressed="${k===libF}">${t}</button>`).join("");
  $("#lib").innerHTML=CATS.map(([c,t])=>{const xs=exList().filter(e=>e.cat===c&&(libF==="all"||(libF==="eq")===e.eq));
    return xs.length?`<div class="grp"><h2>${t}</h2>${xs.map(e=>libRow(e,`data-lib="${e.id}"`)).join("")}</div>`:""}).join("");
}
/* ---------- sheets ---------- */
let open=-1,raf=0;
function showSheet(){document.body.classList.add("so");$("#sheet").hidden=false;document.body.style.overflow="hidden";$("#sheet").scrollTop=0}
function renderPicker(adding){
  const p=adding?(work||plan()):plan(),r=adding?null:rowAt(p,open),cur=r?EX[r.id]:null;pickCat=pickCat||(cur?cur.cat:"legs");
  $("#sheet").innerHTML=`<div class="bar"><span class="sub">${cur?"Ersetzt: "+esc(cur.name):"Zu „"+esc(p.title)+"“ hinzufügen"}</span><button class="icon" id="pickclose" aria-label="Zurück">${ICON.close}</button></div>
  <div class="wrap" style="padding-top:4px"><h2 id="sh-title">${cur?"Übung tauschen":"Übung hinzufügen"}</h2>
  ${cur?`<div class="seg two"><button data-perm="0" aria-pressed="${!swapPerm}">Nur heute</button><button data-perm="1" aria-pressed="${swapPerm}">Dauerhaft</button></div><div class="sub">${swapPerm?"Ändert deinen Plan auch für die nächsten Male.":"Dein Plan bleibt unverändert."}</div>`:""}
  <div class="chips">${CATS.map(([c,t])=>`<button class="chip" data-pcat="${c}" aria-pressed="${c===pickCat}">${t}</button>`).join("")}</div>
  ${r&&r.orig?`<div class="swap"><button id="unswap">Original: ${esc(EX[r.orig].name)}</button></div>`:""}
  ${exList().filter(e=>e.cat===pickCat&&(!r||e.id!==r.id)).map(e=>libRow(e,`data-pick="${e.id}"`)).join("")}</div>`;
  $("#sheet").scrollTop=0;
}
function renderLibSheet(){
  const e=EX[libId],last=lastFor(e.id);
  $("#sheet").innerHTML=`<div class="bar"><span class="sub">${CATS.find(c=>c[0]===e.cat)[1]} · ${e.eq?"mit Gerät":"ohne Gerät"}${e.off?" · ausgeblendet":""}</span><button class="icon" id="close" aria-label="Schließen">${ICON.close}</button></div>
  <div class="stage" id="stage">${svg(e,0)}${b3d(e)}</div>
  <div class="wrap" style="padding-top:16px"><h2 id="sh-title">${esc(e.name)}</h2>
  <div class="target"><div><b>${esc(e.reps)}</b><span>${e.type==="s"?"Sekunden":e.type==="m"?"Meter":"Wiederholungen"} pro Satz</span></div>${e.rest?`<div><b>${e.rest} s</b><span>Pause</span></div>`:""}</div>
  <ol class="steps">${e.how.map(h=>`<li>${esc(h)}</li>`).join("")}</ol>
  <div class="lastline">${last?"Letztes Mal: "+esc(fmt(last,e.type)):""}</div>
  ${e.custom?`<div class="swap"><button data-cedit="${e.id}">Bearbeiten</button></div>`:""}
  <div id="prog">${progHTML(e.id)}</div></div>`;
  animate(e);
}
function tplCards(){return Object.entries(TPL).map(([k,t])=>`<button class="tplcard" data-tpl="${k}" aria-pressed="${k===newTpl}"><b>${esc(t.label)}</b><div class="sub">${k==="kraft"?"Gym Ober-/Unter-/Ganzkörper, Calisthenics, Knie & Lauf-Warm-up":k==="ruecken"?"Gym Beine & Po, Rücken & Rumpf, Ganzkörper; zuhause Sprunggelenk & Rumpf":"Eigene Pläne selbst zusammenstellen"}</div></button>`).join("")}
function renderWho(){
  const p=prof();
  $("#sheet").innerHTML=`<div class="bar"><span class="sub">Profile</span>${profiles.length?`<button class="icon" id="close" aria-label="Schließen">${ICON.close}</button>`:""}</div>
  <div class="wrap" style="padding-top:4px">
  ${profiles.length?`<h2 id="sh-title">Wer trainiert?</h2>${profiles.map(x=>`<button class="tplcard" data-switch="${x.id}" aria-pressed="${x.id===activeId}"><b>${esc(x.name)}</b><div class="sub">${Object.values(x.modes).reduce((a,m)=>a+m.plans.length,0)} Pläne · Beschwerden-Abfrage: ${esc(x.pain)}</div></button>`).join("")}
   <h3 style="margin-top:22px">Aktuelles Profil anpassen</h3>
   <div class="grid2e"><label>Name<input id="pname" value="${esc(p.name)}"></label><label>Beschwerden abfragen für<input id="ppain" value="${esc(p.pain)}" placeholder="z. B. Knie, Rücken"></label></div>
   <button class="cta sec" id="psave">Speichern</button>
   <h3 style="margin-top:26px">Neues Profil</h3>`:`<h2 id="sh-title">Willkommen!</h2><p class="sub">Leg ein Profil an oder lade deine Sicherung. Alles bleibt auf diesem Gerät.</p><button class="cta sec" id="wset">Sicherung laden</button><h3 style="margin-top:26px">Neues Profil</h3>`}
  <label class="lbl">Name<input id="nname" placeholder="Vorname"></label>
  <div class="sub" style="margin-top:10px">Startprogramm</div>${tplCards()}
  <button class="cta" id="pcreate">Profil anlegen</button>
  </div>`;
}
function renderSheet(){
  if(sheetMode==="who")return renderWho();
  if(sheetMode==="lib")return renderLibSheet();
  if(sheetMode==="add")return renderPicker(true);
  if(sheetMode==="saveas")return renderSaveAs();
  if(sheetMode==="gen")return renderGen();
  if(sheetMode==="set")return renderSet();
  if(sheetMode==="log")return renderLogSheet();
  if(sheetMode==="cust")return renderCust();
  if(sheetMode==="run")return renderRunSheet();
  if(sheetMode==="prog")return renderProg();
  if(sheetMode==="plates")return renderPlates();
  if(sheetMode==="rimp")return renderRimp();
  if(picker)return renderPicker(false);
  const p=plan(),r=rowAt(p,open),e=EX[r.id],s=sets(p,open),last=lastFor(e.id),tr=topReps(r.reps);
  const hit=last&&tr&&last.length>=r.sets&&last.every(x=>+x.r>=tr);
  const tip=hit?(e.type==="kg"?"Letztes Mal alles geschafft: heute etwas mehr Gewicht.":"Letztes Mal alles geschafft: schwierigere Variante oder länger."):"";
  $("#sheet").innerHTML=`<div class="bar"><span class="sub">${ord(p).indexOf(open)+1} von ${p.ex.length} · ${esc(p.title)}</span><button class="icon" id="close" aria-label="Schließen">${ICON.close}</button></div>
  <div class="stage" id="stage">${svg(e,0)}${b3d(e)}</div>
  <div class="wrap" style="padding-top:16px">
   <h2 id="sh-title">${esc(e.name)}</h2>
   <div class="target"><div><b>${r.sets} × ${esc(r.reps)}</b><span>${e.type==="s"?"Sekunden":e.type==="m"?"Meter":"Wiederholungen"}</span></div>${e.rest?`<div><b>${e.rest} s</b><span>Pause</span></div>`:""}</div>
   <ol class="steps">${e.how.map(h=>`<li>${esc(h)}</li>`).join("")}</ol>
   <div class="swap"><button id="swapbtn">Übung tauschen</button><button id="progbtn">Fortschritt</button>${isBar(e)?'<button id="platebtn">Scheiben</button>':""}</div>
   ${r.orig&&EX[r.orig]?`<div class="swapped" style="margin-top:8px">${r.today?"Nur heute":"Getauscht"}, statt ${esc(EX[r.orig].name)}</div>`:""}
   <div class="lastline">${last?"Letztes Mal: "+esc(fmt(last,e.type)):"Noch keine Werte"}${tip?` · <span class="hint">${tip}</span>`:""}</div>
   <div class="sub" style="font-size:13px;margin-top:8px">${last?"Grau = letztes Mal. Haken übernimmt die Werte.":""}</div>
   <div class="sets">${setRows(e,s)}</div>
   <button class="addset" id="addset">+ Satz</button>
   <div class="nav"><button class="cta sec" id="prev" ${ord(p)[0]===open?"disabled":""}>Zurück</button><button class="cta" id="next">${ord(p)[p.ex.length-1]===open?"Fertig":"Nächste Übung"}</button></div>
  </div>`;
  animate(e);
}
const setRows=(e,s)=>s.map((x,i)=>{const h=hint(e.id,s,i);return `<div class="set ${e.type==="s"?"hold":isTime(e)?"one":""}"><span>${i+1}</span>${isTime(e)
     ?`<input inputmode="decimal" placeholder="${esc(h.r?dec(h.r):unit[e.type])}" aria-label="Satz ${i+1} ${unit[e.type]}" data-i="${i}" data-f="r" value="${esc(dec(x.r))}">${e.type==="s"?`<button class="tick play" data-hold="${i}" aria-label="Satz ${i+1} Zeit starten">${ICON.play}</button>`:""}`
     :`<input inputmode="decimal" placeholder="${esc(h.w?dec(h.w):unit[e.type])}" aria-label="Satz ${i+1} Gewicht" data-i="${i}" data-f="w" value="${esc(dec(x.w))}"><input inputmode="numeric" placeholder="${esc(h.r?dec(h.r):"Wdh.")}" aria-label="Satz ${i+1} Wiederholungen" data-i="${i}" data-f="r" value="${esc(dec(x.r))}">`}
     <button class="tick" data-tick="${i}" aria-pressed="${!!x.ok}" aria-label="Satz ${i+1} erledigt">${ICON.check}</button></div>`}).join("");
const redrawSets=()=>{if($("#sheet").hidden||sheetMode!=="train"||picker||open<0)return;const p=plan(),el=$("#sheet .sets");if(el)el.innerHTML=setRows(EX[rowAt(p,open).id],sets(p,open))};
/* 3D-Ansicht: fig3d.js wird erst beim Antippen geladen */
const D3=new Set(["goblet"]);
const gl3=(()=>{let ok;return()=>{if(ok===undefined){try{const c=document.createElement("canvas");ok=!!(c.getContext("webgl2")||c.getContext("webgl"))}catch(e){ok=false}}return ok}})();
const b3d=e=>e&&e.A&&!e.custom&&D3.has(e.id)&&gl3()?`<button class="b3d" data-3d="${e.id}" aria-label="${esc(e.name)} in 3D ansehen"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg>3D</span></button>`:"";
function open3D(id){const e=EX[id];if(!e)return;cancelAnimationFrame(raf);
  import("./fig3d.js").then(m=>m.open3d(e,{onClose:()=>{if(!$("#sheet").hidden&&$("#stage"))animate(e)}})).catch(()=>{toast("3D-Ansicht geht auf diesem Gerät nicht");animate(e)})}
function animate(e){
  cancelAnimationFrame(raf);const st=$("#stage");if(!st||!e.A)return;
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){st.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;width:100%;height:100%">${svg(e,0)}${svg(e,1)}</div>`+b3d(e);return}
  const T=3200,t0=performance.now();
  const loop=now=>{const p=((now-t0)%T)/T;let x=p<.5?p*2:2-p*2;x=Math.min(1,Math.max(0,(x-.12)/.76));x=x*x*(3-2*x);
    st.firstElementChild.innerHTML=figSVG(e,x);raf=requestAnimationFrame(loop)};
  raf=requestAnimationFrame(loop);
}
function openSheet(i){open=i;sheetMode="train";picker=false;training=true;awake();showSheet();renderSheet()}
function closeSheet(){
  if(!profiles.length){sheetMode="who";renderWho();return}
  if(back){const b=back;back=null;cancelAnimationFrame(raf);b();return}
  training=Object.values(draft).some(s=>s.some(filled));awake();open=-1;libId=null;picker=false;sheetMode="train";gen=null;saveSrc=null;document.body.classList.remove("so");cancelAnimationFrame(raf);$("#sheet").hidden=true;document.body.style.overflow="";renderTop();renderList();renderRemind();
  if(!$("#v-log").hidden)renderLogs();if(!$("#v-lib").hidden)renderLib();if(!$("#v-run").hidden)renderRuns()}
/* ---------- rest timer ---------- */
let tEnd=0,tInt=0,tHide=0,hold=null,ac=null,wl=null;
/* Ton: muss beim Tippen freigeschaltet werden, sonst bleibt das iPhone stumm */
function unlock(){if(!set.sound)return;try{if(navigator.audioSession)navigator.audioSession.type=set.loud?"playback":"transient";ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state!=="running")ac.resume()}catch(e){}}
function beep(n=1,f=880){if(navigator.vibrate)try{navigator.vibrate(n>1?[120,80,120]:60)}catch(e){}
  if(!set.sound||!ac)return;try{for(let i=0;i<n;i++){const t=ac.currentTime+i*.22,o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;o.connect(g);g.connect(ac.destination);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.35,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.start(t);o.stop(t+.2)}}catch(e){}}
/* Bildschirm im Training anlassen */
async function awake(){const want=set.awake&&training&&document.visibilityState==="visible";
  if(want&&!wl&&navigator.wakeLock){try{const w=await navigator.wakeLock.request("screen");wl=w;w.addEventListener("release",()=>{if(wl===w)wl=null})}catch(e){}}
  else if(!want&&wl){const w=wl;wl=null;try{await w.release()}catch(e){}}}
document.addEventListener("visibilitychange",()=>{awake();if(document.visibilityState==="visible"&&(tEnd||hold))tick();else if(document.visibilityState==="hidden")persist()});
const mmss=l=>`${Math.floor(l/60)}:${String(l%60).padStart(2,"0")}`;
function showTimer(){clearTimeout(tHide);const t=$("#timer");t.hidden=false;t.classList.remove("go");t.classList.toggle("holding",!!hold);$("#tskip").textContent=hold?"Stopp":"Weiter";clearInterval(tInt);tInt=setInterval(tick,200);tick()}
function hideTimer(){clearInterval(tInt);clearTimeout(tHide);$("#timer").hidden=true;tEnd=0;try{localStorage.removeItem("tk3-rest")}catch(e){}}
function startRest(sec){if(!sec)return;tEnd=Date.now()+sec*1000;store("tk3-rest",tEnd);showTimer()}
function adjRest(s){if(hold||!tEnd)return;tEnd=Math.max(Date.now(),tEnd)+s*1000;if(tEnd<=Date.now()){hideTimer();return}store("tk3-rest",tEnd);showTimer()}
function goTimer(text,n){clearInterval(tInt);$("#tt").textContent=text;$("#timer").classList.add("go");beep(n);clearTimeout(tHide);tHide=setTimeout(hideTimer,5000)}
function tick(){
  if(hold)return holdTick();
  if(!tEnd)return;const ms=tEnd-Date.now();
  if(ms>0){$("#tt").textContent="Pause "+mmss(Math.ceil(ms/1000));return}
  const late=ms<-4000;tEnd=0;try{localStorage.removeItem("tk3-rest")}catch(e){}
  if(late)hideTimer();else goTimer("Los geht's!",2);
}
/* Countdown für Halteübungen: 3 Sekunden Vorlauf, dann Haltezeit */
function startHold(i){const p=plan(),r=rowAt(p,open),e=EX[r.id],s=sets(p,open),x=s[i],sec=Math.round(num(x.r)||num(hint(e.id,s,i).r)||num(r.reps)||30);
  tEnd=0;hold={x,id:e.id,rest:e.rest,sec:Math.min(sec,3600),t0:Date.now()+3000,last:4};showTimer()}
function holdTick(){const h=hold,now=Date.now();
  if(now<h.t0){const l=Math.ceil((h.t0-now)/1000);if(l!==h.last){h.last=l;beep(1,660)}$("#tt").textContent="Bereit … "+l;return}
  if(!h.run){h.run=true;beep(1,990)}
  const l=Math.ceil(h.sec-(now-h.t0)/1000);
  if(l<=0){holdDone(h.sec);return}
  if(l<=3&&l!==h.last){h.last=l;beep(1,660)}
  $("#tt").textContent="Halten "+mmss(l)}
function holdDone(sec){const h=hold;hold=null;$("#timer").classList.remove("holding");clearInterval(tInt);
  h.x.r=String(sec);h.x.ok=true;persist();redrawSets();
  beep(2);if(h.rest)startRest(h.rest);else goTimer("Geschafft!",0)}
function holdCancel(){hold=null;$("#timer").classList.remove("holding");hideTimer()}
function holdStop(){const h=hold,sec=Math.floor((Date.now()-h.t0)/1000);if(sec<1)holdCancel();else holdDone(Math.min(sec,h.sec))}
function renderAll(){renderTop();renderList();renderLogs()}
/* ---------- drag & drop ---------- */
let drag=null;
function moveItem(from,to){
  if(from===to)return;
  if(editing&&work){const [x]=work.ex.splice(from,1);work.ex.splice(to,0,x);renderList();return}
  const p=plan(),o=ord(p).slice(),[x]=o.splice(from,1);o.splice(to,0,x);
  if(o.every((v,i)=>v===i))delete order[ok_()];else order[ok_()]=o;persist();renderList(false);
}
function dragUpdate(){
  const d=drag;if(!d)return;const dy=d.y-d.y0+(scrollY-d.s0);d.item.style.transform=`translateY(${dy}px)`;
  const c=d.mids[d.from]+dy;let to=d.from;
  for(let i=d.from+1;i<d.mids.length;i++)if(c>d.mids[i])to=i;
  for(let i=d.from-1;i>=0;i--)if(c<d.mids[i])to=i;
  d.to=to;const h=d.h;
  d.items.forEach((el,i)=>{if(i===d.from)return;el.style.transform=(i>d.from&&i<=to)?`translateY(${-h}px)`:(i<d.from&&i>=to)?`translateY(${h}px)`:""});
}
function dragLoop(){if(!drag)return;const y=drag.y,H=innerHeight;let v=0;if(y<90)v=-Math.ceil((90-y)/6);else if(y>H-150)v=Math.ceil((y-(H-150))/6);
  if(v){scrollBy(0,v);dragUpdate()}drag.raf=requestAnimationFrame(dragLoop)}
document.addEventListener("pointerdown",ev=>{
  const g=ev.target.closest("[data-grip]");if(!g||drag)return;ev.preventDefault();
  const item=g.closest(".item"),list=item.parentElement,items=[...list.querySelectorAll(":scope>.item")],from=items.indexOf(item);
  const rs=items.map(x=>x.getBoundingClientRect());
  drag={g,item,list,items,from,to:from,y0:ev.clientY,y:ev.clientY,s0:scrollY,id:ev.pointerId,h:from<items.length-1?rs[from+1].top-rs[from].top:rs[from].height,mids:rs.map(r=>r.top+r.height/2)};
  try{g.setPointerCapture(ev.pointerId)}catch(e){}
  item.classList.add("drag");list.classList.add("sorting");if(navigator.vibrate)try{navigator.vibrate(10)}catch(e){}
  drag.raf=requestAnimationFrame(dragLoop);
});
document.addEventListener("pointermove",ev=>{if(!drag||ev.pointerId!==drag.id)return;ev.preventDefault();drag.y=ev.clientY;dragUpdate()},{passive:false});
function dragEnd(ev){if(!drag||ev.pointerId!==drag.id)return;const d=drag;drag=null;cancelAnimationFrame(d.raf);
  d.items.forEach(el=>el.style.transform="");d.item.classList.remove("drag");d.list.classList.remove("sorting");moveItem(d.from,d.to)}
document.addEventListener("pointerup",dragEnd);document.addEventListener("pointercancel",dragEnd);
document.addEventListener("touchmove",ev=>{if(drag)ev.preventDefault()},{passive:false});
document.addEventListener("keydown",ev=>{const g=ev.target.closest&&ev.target.closest("[data-grip]");if(!g||(ev.key!=="ArrowUp"&&ev.key!=="ArrowDown"))return;
  ev.preventDefault();const item=g.closest(".item"),items=[...item.parentElement.querySelectorAll(":scope>.item")],i=items.indexOf(item),j=ev.key==="ArrowUp"?i-1:i+1;
  if(j<0||j>=items.length)return;moveItem(i,j);const n=$("#list").querySelectorAll(":scope>.item")[j];if(n)n.querySelector("[data-grip]").focus()});

/* ---------- als neuen Plan speichern ---------- */
function renderSaveAs(){
  const pr=prof(),s=saveSrc;if(!sMode||!pr.modes[sMode])sMode=mode;
  $("#sheet").innerHTML=`<div class="bar"><span class="sub">${s.ex.length} Übungen</span><button class="icon" id="close" aria-label="Schließen">${ICON.close}</button></div>
  <div class="wrap" style="padding-top:4px"><h2 id="sh-title">Als neuen Plan speichern</h2>
  ${s.from==="gen"?"":`<p class="sub">Der ursprüngliche Plan bleibt unverändert.</p>`}
  <div class="grid2e"><label>Name<input id="sname" value="${esc(s.title)}"></label><label>Dauer (Min.)<input id="smin" inputmode="numeric" value="${s.min}"></label></div>
  <div class="gsec"><div class="sub">Bereich</div><div class="chips wrapc">${Object.entries(pr.modes).map(([k,m])=>`<button class="chip" data-smode="${k}" aria-pressed="${k===sMode}">${esc(m.label)}</button>`).join("")}</div></div>
  <div style="margin-top:14px">${s.ex.map(r=>EX[r.id]?`<div class="d" style="padding:3px 0">${esc(EX[r.id].name)} <span class="sub">· ${r.sets} × ${esc(r.reps)}</span></div>`:"").join("")}</div>
  <button class="cta" id="sdo">Plan speichern</button>${s.from==="gen"?`<button class="cta sec" id="gback">Zurück zum Vorschlag</button>`:""}</div>`;
}

/* ---------- Plan-Generator ---------- */
const REG=[["legs","Beine & Po"],["back","Rücken"],["front","Brust & Arme"],["shoulders","Schultern"],["core","Rumpf"]];
const PAT={goblet:"sq",bwsquat:"sq",wallsit:"sq",rdl:"hi",deadlift:"hi",hipthrust:"br",glutebridge:"br",slbridge:"br",stepup:"lu",bulgarian:"lu",revlunge:"lu",stepdown:"lu",
  bench:"ph",benchbb:"ph",pushup:"ph",dips:"pd",shpress:"pv",ohp:"pv",pikepush:"pv",latpull:"lv",pullup:"lv",row:"lh",dbrow:"lh",onearmrow:"lh",invrow:"lh",
  latraise:"lr",frontraise:"fr",cablefly:"fl",revfly:"rf",facepull:"rf",curl:"bi",pushdown:"tr",sideplank:"cs",pallof:"cs",plank:"cf",hollow:"cf",deadbug:"cf",birddog:"cf",tuck:"cf",farmer:"ca"};
let GP={where:"gym",regions:["legs","back","front","shoulders","core"],min:60,gear:{gym:GEARS.map(g=>g[0]),home:["box","band"]},gentle:false};
try{const d=JSON.parse(localStorage.getItem("tk3-gen")||"null");if(d)GP=Object.assign(GP,d)}catch(e){}
const gpSave=()=>{try{localStorage.setItem("tk3-gen",JSON.stringify(GP))}catch(e){}};
const hasGear=(e,gs)=>e.need.every(n=>n.split("|").some(g=>gs.includes(g)));
const gPool=()=>exList().filter(e=>hasGear(e,GP.gear[GP.where])&&!(GP.gentle&&e.harsh));
const exMin=(e,n)=>n*((e.type==="s"||e.type==="m"?40:45)+(e.rest||30))/60+.75;
const planMin=ex=>Math.round(ex.reduce((a,r)=>a+(EX[r.id]?exMin(EX[r.id],r.sets):0),0)/5)*5||5;
function rnd(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
function genTitle(){const r=GP.regions;if(r.length>=5)return "Ganzkörper";if(r.length===1)return REG.find(x=>x[0]===r[0])[1];
  if(r.every(x=>x==="legs"||x==="core"))return "Beine & Rumpf";if(!r.includes("legs")&&r.length>=3)return "Oberkörper";return r.map(x=>REG.find(y=>y[0]===x)[1].split(" ")[0]).join(" & ")}
function generate(seed){
  const R=rnd(seed),P=gPool(),out=[],used=new Set(),pats=new Set();let t=0;
  const sh=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const best=(c,strict)=>{const free=c.filter(e=>!used.has(e.id));if(!free.length)return null;let np=free.filter(e=>!PAT[e.id]||!pats.has(PAT[e.id]));if(!np.length){if(strict)return null;np=free}
    if(GP.where==="gym"){const q=np.filter(e=>e.eq);if(q.length&&R()<.85)np=q}return sh(np)[0]};
  const setsFor=e=>e.kind==="c"?(GP.min>=60&&GP.regions.length<=3?4:3):e.kind==="r"?(GP.gentle?3:2):e.kind==="w"?1:3;
  const add=e=>{if(!e)return false;const n=setsFor(e);out.push({id:e.id,sets:n,reps:e.reps,_k:e.kind==="w"?0:GP.gentle&&e.kind==="r"?1:e.cat==="core"?5:e.kind==="c"?2:e.kind==="a"?3:4});used.add(e.id);if(PAT[e.id])pats.add(PAT[e.id]);t+=exMin(e,n);return true};
  const main=GP.regions.filter(r=>r!=="core"),core=GP.regions.includes("core");
  const coreN=core?(main.length?Math.max(1,Math.min(3,Math.round(GP.min/25))):99):0;
  if(main.includes("legs")){const w=sh(P.filter(e=>e.kind==="w"&&e.type!=="s"));w.slice(0,GP.min>=30?2:1).forEach(add)}
  if(GP.gentle){const legsR=P.filter(e=>e.kind==="r"&&e.cat==="legs"&&e.knee);if(main.includes("legs")||!main.length)add(best(legsR))}
  const budget=GP.min-(core&&main.length?coreN*5:0);let guard=0;
  const phases=GP.gentle?["c","a","r"]:["c","a"];
  outer:while(t<budget&&guard++<12){let added=false;
    for(const ph of phases){for(const reg of sh(main)){if(t>=budget)break outer;
      const c=P.filter(e=>e.cat===reg&&e.kind===ph);const e=best(c,ph==="c");if(e&&t+exMin(e,setsFor(e))<=budget+3){add(e);added=true}}
}
    if(!added)break}
  if(!GP.gentle)for(const reg of sh(main)){const e=best(P.filter(x=>x.cat===reg&&x.kind==="r"));if(e&&t+exMin(e,setsFor(e))<=budget+2)add(e)}
  if(core){const c=P.filter(e=>e.cat==="core");for(let i=0;i<coreN;i++){const e=best(c);if(!e||t+exMin(e,3)>GP.min+(main.length?4:2))break;add(e)}}
  /* zu wenig Übungen für die Dauer: Sätze erhöhen */
  let g2=0;while(t<GP.min-4&&g2++<40){const m=out.filter(r=>r._k>=1&&r.sets<5);if(!m.length)break;const r=m.sort((a,b)=>a.sets-b.sets||a._k-b._k)[0];r.sets++;t+=exMin(EX[r.id],1)}
  out.sort((a,b)=>a._k-b._k);out.forEach(r=>delete r._k);
  out.missing=GP.regions.filter(r=>!P.some(e=>e.cat===r&&e.kind!=="w"));return out;
}
function openGen(){gen={step:"form",ex:null,seed:Date.now()>>>0,title:"",wish:"",busy:false,note:""};sheetMode="gen";showSheet();renderGen()}
function runGen(){gen.seed=(gen.seed*7+13)>>>0;gen.ex=generate(gen.seed);gen.title=`${genTitle()} · ${GP.min} Min`;const ms=gen.ex.missing||[];gen.note=!gen.ex.length?"Mit dieser Auswahl gibt es keine passenden Übungen. Wähle mehr Geräte oder Regionen."
    :ms.length?`Für ${ms.map(r=>REG.find(x=>x[0]===r)[1]).join(" und ")} gibt es mit diesen Geräten keine Übung (z. B. fehlt eine Klimmzugstange oder Kurzhanteln).`
    :planMin(gen.ex)<GP.min-8?"Mit diesen Geräten gibt es nur wenige passende Übungen, daher ist der Plan kürzer. Mehr Geräte wählen ergibt mehr Auswahl.":"";gen.step="pre"}
function renderGen(){
  const g=gen,gs=GP.gear[GP.where];
  const chip=(attr,on,t)=>`<button class="chip" ${attr} aria-pressed="${!!on}">${t}</button>`;
  let h=`<div class="bar"><span class="sub">Plan erstellen</span><button class="icon" id="close" aria-label="Schließen">${ICON.close}</button></div>
  <div class="wrap" style="padding-top:4px"><h2 id="sh-title">Neuen Plan erstellen</h2>
  <div class="gsec"><div class="sub">Wo trainierst du?</div><div class="chips wrapc">${chip('data-gwhere="gym"',GP.where==="gym","Gym")}${chip('data-gwhere="home"',GP.where==="home","Zuhause")}</div></div>
  <div class="gsec"><div class="sub">Körperregionen</div><div class="chips wrapc">${chip('data-gall',GP.regions.length===REG.length,"Ganzkörper")}${REG.map(([k,t])=>chip(`data-greg="${k}"`,GP.regions.includes(k),t)).join("")}</div></div>
  <div class="gsec"><div class="sub">Dauer</div><div class="chips wrapc">${[20,30,45,60,75].map(m=>chip(`data-gmin="${m}"`,GP.min===m,m+" Min")).join("")}</div></div>
  <div class="gsec"><div class="sub">Verfügbare Geräte</div><div class="chips wrapc">${chip('data-gnone',!gs.length,"Nichts")}${GEARS.map(([k,t])=>chip(`data-ggear="${k}"`,gs.includes(k),t)).join("")}</div>
   <p class="sub" style="font-size:13px;margin:6px 0 0">Boden, Wand und Matte gehen immer. Die Auswahl merkt sich die App getrennt für Gym und Zuhause.</p></div>
  <button class="tog" data-ggentle aria-pressed="${GP.gentle}"><span><b>Gelenkschonend</b><span class="sub" style="display:block;font-size:13px">Lässt z. B. Kreuzheben, Langhantel-Drücken, Ausfallschritte und Lauf-Drills weg und nimmt Stabilitätsübungen dazu${prof()&&prof().pain?` (Profil: ${esc(prof().pain)})`:""}.</span></span><span class="sw" aria-hidden="true"></span></button>
  <button class="cta" id="gdo" ${GP.regions.length?"":"disabled"}>${g.ex?"Neu erstellen":"Vorschlag erstellen"}</button>`;
  if(g.step==="pre"){
    h+=`<div id="gpre" style="margin-top:26px;padding-top:18px;border-top:1px solid var(--line)"><h3>Vorschlag</h3>
    ${g.note?`<div class="msg">${esc(g.note)}</div>`:""}
    ${g.ex.length?`<div class="sub">${g.ex.length} ${g.ex.length===1?"Übung":"Übungen"} · ca. ${planMin(g.ex)} Min. Mit dem Würfel tauschst du einzelne Übungen.</div>
    ${g.ex.map((r,i)=>{const e=EX[r.id];return `<div class="grow"><div class="thumb s">${svg(e,1)}</div><div><div class="t">${esc(e.name)}</div><div class="d">${r.sets} × ${esc(r.reps)}${e.type==="s"?" Sek.":e.type==="m"?" m":""}</div></div>
      <div class="ctl"><button class="sm" data-groll="${i}" aria-label="${esc(e.name)} austauschen">${ICON.dice}</button><button class="sm" data-grm="${i}" aria-label="${esc(e.name)} entfernen">✕</button></div></div>`}).join("")}
    <div class="btns"><button class="cta" id="gsave">Plan speichern</button><button class="cta sec" id="gdo2">Alles neu würfeln</button></div>
    ${kiHTML()}`:""}
    </div>`}
  $("#sheet").innerHTML=h+`</div>`;
}
function genClick(b){
  if(sheetMode!=="gen"&&b.id!=="gback")return false;const gs=GP.gear[GP.where];
  if(b.dataset.gwhere){GP.where=b.dataset.gwhere;gpSave();renderGen();return true}
  if(b.dataset.gall!=null){GP.regions=GP.regions.length===REG.length?[]:REG.map(r=>r[0]);gpSave();renderGen();return true}
  if(b.dataset.greg){const k=b.dataset.greg,i=GP.regions.indexOf(k);if(i>=0)GP.regions.splice(i,1);else GP.regions.push(k);gpSave();renderGen();return true}
  if(b.dataset.gmin){GP.min=+b.dataset.gmin;gpSave();renderGen();return true}
  if(b.dataset.gnone!=null){GP.gear[GP.where]=[];gpSave();renderGen();return true}
  if(b.dataset.ggear){const k=b.dataset.ggear,i=gs.indexOf(k);if(i>=0)gs.splice(i,1);else gs.push(k);gpSave();renderGen();return true}
  if(b.dataset.ggentle!=null){GP.gentle=!GP.gentle;gpSave();renderGen();return true}
  if(b.id==="gdo"||b.id==="gdo2"){runGen();renderGen();const el=$("#gpre");if(el)el.scrollIntoView({behavior:"smooth",block:"start"});return true}
  if(b.dataset.grm!=null){gen.ex.splice(+b.dataset.grm,1);renderGen();return true}
  if(b.dataset.groll!=null){const i=+b.dataset.groll,cur=EX[gen.ex[i].id],P=gPool(),usedIds=new Set(gen.ex.map(r=>r.id));
    let c=P.filter(e=>e.cat===cur.cat&&e.kind===cur.kind&&!usedIds.has(e.id));if(!c.length)c=P.filter(e=>e.cat===cur.cat&&!usedIds.has(e.id)&&e.kind!=="w");
    if(!c.length){toast("Keine andere passende Übung");return true}const e=c[Math.floor(Math.random()*c.length)];
    gen.ex[i]={id:e.id,sets:gen.ex[i].sets,reps:e.reps};renderGen();return true}
  if(b.id==="gsave"){saveSrc={title:gen.title,min:planMin(gen.ex),ex:clone(gen.ex),from:"gen"};sMode=GP.where==="home"&&prof().modes.home?"home":(prof().modes.gym?"gym":mode);sheetMode="saveas";renderSheet();$("#sheet").scrollTop=0;return true}
  if(b.id==="gback"){sheetMode="gen";renderGen();return true}
  return false;
}
function genInput(i){if(i.id==="gwish"){gen.wish=i.value;return true}return false}
/* ---------- events ---------- */
let swapArm=null;
document.addEventListener("click",ev=>{
  const b=ev.target.closest("button");if(!b)return;
  if(xClick(b))return;
  if(b.dataset.v){for(const x of document.querySelectorAll(".tabs button"))x.removeAttribute("aria-current");b.setAttribute("aria-current","page");for(const v of ["train","lib","run","log"])$("#v-"+v).hidden=b.dataset.v!==v;if(b.dataset.v==="lib")renderLib();if(b.dataset.v==="run")renderRuns();if(b.dataset.v==="log")renderLogs();scrollTo(0,0);return}
  if(b.id==="who"){sheetMode="who";showSheet();renderWho();return}
  if(b.dataset.switch){activeId=b.dataset.switch;mode=planId=null;pain=null;editing=false;persist();closeSheet();renderLogs();return}
  if(b.dataset.tpl){newTpl=b.dataset.tpl;for(const x of document.querySelectorAll("[data-tpl]"))x.setAttribute("aria-pressed",x===b);return}
  if(b.id==="psave"){const p=prof();p.name=$("#pname").value.trim()||p.name;p.pain=$("#ppain").value.trim()||p.pain;saveProfiles();closeSheet();renderLogs();return}
  if(b.id==="pcreate"){const n=$("#nname").value.trim();if(!n){$("#nname").focus();return}const np=newProfile(n,newTpl);profiles.push(np);activeId=np.id;mode=planId=null;saveProfiles();closeSheet();renderLogs();return}
  if(b.dataset.libf){libF=b.dataset.libf;renderLib();return}
  if(b.dataset.lib){libId=b.dataset.lib;sheetMode="lib";open=0;showSheet();renderSheet();return}
  if(b.dataset.perm){swapPerm=b.dataset.perm==="1";renderPicker(false);return}
  if(b.id==="swapbtn"){cancelAnimationFrame(raf);picker=true;pickCat=null;swapPerm=false;renderSheet();return}
  if(b.id==="pickclose"){if(sheetMode==="add"){closeSheet();return}picker=false;renderSheet();return}
  if(b.dataset.pcat){pickCat=b.dataset.pcat;renderPicker(sheetMode==="add");return}
  if(b.dataset.pick&&sheetMode==="add"){const e=EX[b.dataset.pick];if(!work)startEdit();work.ex.push({id:e.id,sets:3,reps:e.reps});closeSheet();return}
  if(b.dataset.pick||b.id==="unswap"){const p=plan(),r=rowAt(p,open),base=p.ex[open],un=b.id==="unswap";
    if((draft[dk(open)]||[]).some(filled)&&!swapArm){swapArm=b;toast("Eingetragene Sätze gehen verloren. Nochmal tippen zum Tauschen");setTimeout(()=>swapArm=null,4000);return}swapArm=null;
    if(un){if(r.today)delete swaps[dk(open)];else p.ex[open]={id:r.orig,sets:r.sets,reps:EX[r.orig].reps}}
    else if(swapPerm){const o=base.orig||base.id;p.ex[open]={id:b.dataset.pick,sets:base.sets,reps:EX[b.dataset.pick].reps};if(o!==b.dataset.pick)p.ex[open].orig=o;delete swaps[dk(open)]}
    else if(b.dataset.pick===base.id)delete swaps[dk(open)];else swaps[dk(open)]=b.dataset.pick;
    hold&&holdCancel();delete draft[dk(open)];saveProfiles();picker=false;renderSheet();$("#sheet").scrollTop=0;return}
  if(b.dataset.mode){mode=b.dataset.mode;planId=null;pain=null;delArm=false;persist();if(editing)startEdit();renderTop();renderList();return}
  if(b.dataset.plan){planId=b.dataset.plan;pain=null;delArm=false;persist();if(editing)startEdit();renderTop();renderList();return}
  if(b.id==="edit"){editing=!editing;delArm=rstArm=false;if(editing)startEdit();else work=null;renderTop();renderList();return}
  if(b.id==="newplan"){const p=prof(),np={id:activeId+"-n"+Date.now().toString(36),title:"Neuer Plan",min:45,ex:[]};p.modes[mode].plans.push(np);planId=np.id;saveProfiles();startEdit();renderTop();renderList();return}
  if(b.dataset.grip!=null)return;
  if(b.id==="ordreset"){delete order[ok_()];persist();renderList(false);return}
  if(b.id==="ordsave"){const p=plan();saveSrc={title:p.title+" (neu)",min:p.min,ex:cleanEx(ord(p).map(i=>rowAt(p,i))),from:"train"};sMode=mode;sheetMode="saveas";showSheet();renderSheet();return}
  if(b.id==="esave"){const p=plan(),nd={},ns={};work.ex.forEach((r,i)=>{if(r._i==null)return;const k=dk(r._i);if(draft[k]&&draft[k].some(filled))nd[dk(i)]=draft[k];if(swaps[k])ns[dk(i)]=swaps[k]});
    for(const k of Object.keys(draft))if(k.startsWith(ok_()+":"))delete draft[k];for(const k of Object.keys(swaps))if(k.startsWith(ok_()+":"))delete swaps[k];Object.assign(draft,nd);Object.assign(swaps,ns);delete order[ok_()];
    p.title=work.title;p.min=work.min;p.ex=cleanEx(work.ex);editing=false;work=null;saveProfiles();renderTop();renderList();toast("Plan gespeichert");return}
  if(b.id==="esaveas"){saveSrc={title:work.title===plan().title?work.title+" (neu)":work.title,min:work.min,ex:cleanEx(work.ex),from:"edit"};sMode=mode;sheetMode="saveas";showSheet();renderSheet();return}
  if(b.dataset.smode){sMode=b.dataset.smode;for(const x of document.querySelectorAll("[data-smode]"))x.setAttribute("aria-pressed",x===b);return}
  if(b.id==="sdo"){const pr=prof(),np={id:activeId+"-n"+Date.now().toString(36),title:$("#sname").value.trim()||saveSrc.title,min:parseInt($("#smin").value,10)||saveSrc.min,ex:clone(saveSrc.ex)};
    pr.modes[sMode].plans.push(np);const from=saveSrc.from;saveSrc=null;
    if(from!=="train"){mode=sMode;planId=np.id;editing=false;work=null;gen=null}
    saveProfiles();closeSheet();toast(`„${np.title}“ gespeichert in ${pr.modes[sMode].label}`);return}
  if(gen&&genClick(b))return;
  if(b.id==="genplan"){openGen();return}
  if(b.id==="addex"){sheetMode="add";pickCat=null;open=0;showSheet();renderPicker(true);return}
  if(b.dataset.rm!=null){work.ex.splice(+b.dataset.rm,1);renderList();return}
  if(b.id==="delplan"){if(!delArm){delArm=true;renderList();return}const ps=prof().modes[mode].plans;ps.splice(ps.findIndex(x=>x.id===planId),1);planId=null;delArm=false;saveProfiles();startEdit();renderTop();renderList();return}
  if(b.id==="resettpl"){if(!rstArm){rstArm=true;const st=scrollY;renderList();scrollTo(0,st);return}rstArm=false;snapshot();
    const p=prof(),fresh=newProfile(p.name,p.tpl||"leer");for(const o of [draft,order,swaps])for(const k of Object.keys(o))if(k.startsWith(p.id+":"))delete o[k];p.modes=fresh.modes;for(const m of Object.values(p.modes))for(const x of m.plans)x.id=x.id.replace(fresh.id,p.id);mode=planId=null;editing=false;work=null;saveProfiles();renderTop();renderList();toast("Startpläne geladen. Rückgängig in den Einstellungen");return}
  if(b.dataset.open!=null)return openSheet(+b.dataset.open);
  if(b.id==="close")return closeSheet();
  if(b.dataset.tick!=null){unlock();const p=plan(),e=EX[rowAt(p,open).id],s=sets(p,open),i=+b.dataset.tick,x=s[i];x.ok=!x.ok;
    if(x.ok){const h=hint(e.id,s,i);if(!x.w&&!isTime(e)&&(e.type==="kg"||!x.r))x.w=h.w;if(!x.r)x.r=h.r}
    persist();redrawSets();const nb=$(`[data-tick="${i}"]`);if(nb)nb.focus({preventScroll:true});
    if(x.ok&&!hold)startRest(e.rest);return}
  if(b.id==="addset"){sets(plan(),open).push({w:"",r:"",ok:false});persist();renderSheet();return}
  if(b.id==="prev"){const o=ord(plan()),k=o.indexOf(open);if(k>0)open=o[k-1];renderSheet();$("#sheet").scrollTop=0;return}
  if(b.id==="next"){const o=ord(plan()),k=o.indexOf(open);if(k>=o.length-1){closeSheet();$("#finish").scrollIntoView({behavior:"smooth"});return}open=o[k+1];renderSheet();$("#sheet").scrollTop=0;return}
  if(b.id==="tskip"){if(hold)holdStop();else hideTimer();return}
  if(b.id==="tminus"){adjRest(-15);return}
  if(b.id==="tplus"){adjRest(15);return}
  if(b.dataset.hold!=null){unlock();startHold(+b.dataset.hold);return}
  if(b.dataset.p!=null){pain=+b.dataset.p;for(const x of document.querySelectorAll("#pain button"))x.setAttribute("aria-pressed",x===b);return}
  if(b.id==="save")return save(b);
});
document.addEventListener("input",ev=>{const i=ev.target;
  if(i.dataset.i!=null&&open>=0&&$("#sheet").hidden===false&&sheetMode==="train"){sets(plan(),open)[+i.dataset.i][i.dataset.f]=i.value.replace(",",".");persist();return}
  if(xInput(i))return;
  if(gen&&genInput(i))return;
  const p=work;if(!p||!editing)return;
  if(i.id==="ptitle"){p.title=i.value.trim()||"Plan";return}
  if(i.id==="pmin"){const v=parseInt(i.value,10);if(v>0)p.min=v;return}
  if(i.dataset.es!=null){const v=parseInt(i.value,10);if(v>0&&v<=10)p.ex[+i.dataset.es].sets=v;return}
  if(i.dataset.er!=null){p.ex[+i.dataset.er].reps=i.value.trim()||"10";return}
});
document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&!$("#sheet").hidden)closeSheet()});
function save(btn){
  const p=plan(),entries={};
  p.ex.forEach((r,i)=>{const f=(draft[dk(i)]||[]).filter(filled);if(f.length){const id=rowAt(p,i).id;entries[id]=(entries[id]||[]).concat(f)}});
  if(!Object.keys(entries).length&&pain==null){$("#savemsg").textContent="Noch nichts eingetragen.";return}
  btn.disabled=true;const pr=prof(),news=newBests(entries);
  const l={id:uid("l"),ts:Date.now(),pid:pr.id,plan:p.id,title:`${pr.modes[mode].label} · ${p.title}`,entries:clone(entries),pain,painLabel:pr.pain,note:$("#note").value.trim()};
  allLogs.unshift(l);
  if(!saveLogs()){allLogs=allLogs.filter(x=>x!==l);btn.disabled=false;$("#savemsg").textContent="Speichern hat nicht geklappt. Deine Eingaben sind noch da.";return}
  if(hold)holdCancel();training=false;awake();
  p.ex.forEach((r,i)=>{delete draft[dk(i)];delete swaps[dk(i)]});delete order[ok_()];pain=null;persist();renderList();renderLogs();renderRemind();
  $("#savemsg").textContent="Gespeichert. Stark!"+(news.length?` Neue Bestwerte: ${news.join(", ")}.`:"");
}
/* ---------- Fortschritt ---------- */
const CH={};let chN=0;
/* Liniendiagramm mit einer Reihe. pts: [{t,v,txt}] */
function lineChart(pts,u){
  if(pts.length<2)return "";const id="c"+(++chN),W=340,H=150,l=34,r=14,t=14,b=24;CH[id]=pts;
  let lo=Math.min(...pts.map(p=>p.v)),hi=Math.max(...pts.map(p=>p.v));if(lo===hi){lo=Math.max(0,lo-1);hi+=1}
  const raw=(hi-lo)/2,mag=Math.pow(10,Math.floor(Math.log10(raw))),step=[1,2,2.5,5,10].map(k=>k*mag).find(k=>k>=raw);
  lo=Math.floor(lo/step)*step;hi=Math.ceil(hi/step)*step;
  const t0=pts[0].t,t1=pts[pts.length-1].t,X=p=>l+(t1>t0?(p.t-t0)/(t1-t0):.5)*(W-l-r),Y=v=>t+(1-(v-lo)/(hi-lo))*(H-t-b);
  let g="";for(let v=lo;v<=hi+step/1e6;v+=step)g+=`<line class="cg" x1="${l}" x2="${W-r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="ct" x="${l-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end">${dec(Math.round(v*100)/100)}</text>`;
  const d2=x=>new Date(x).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"});
  const q=pts[pts.length-1];
  return `<div class="chart" data-chart="${id}"><div class="ccap" id="${id}">Zuletzt: <b>${esc(q.txt)}</b></div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Verlauf in ${esc(u)}, ${pts.length} Werte. Die Werte stehen auch als Liste darunter.">${g}
   <text class="ct" x="${l}" y="${H-5}">${d2(t0)}</text>${d2(t0)===d2(t1)?"":`<text class="ct" x="${W-r}" y="${H-5}" text-anchor="end">${d2(t1)}</text>`}
   <polyline class="cl" points="${pts.map(p=>X(p).toFixed(1)+","+Y(p.v).toFixed(1)).join(" ")}"/>
   ${pts.map((p,i)=>`<circle class="cd" cx="${X(p).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="${i===pts.length-1?5:4}" data-x="${(X(p)/W).toFixed(4)}"/>`).join("")}</svg></div>`;
}
function chartPick(ev){const c=ev.target.closest&&ev.target.closest(".chart");if(!c)return;const pts=CH[c.dataset.chart],sv=c.querySelector("svg"),rc=sv.getBoundingClientRect();if(ev.clientY<rc.top)return;
  const x=(ev.clientX-rc.left)/rc.width;let bi=0,bd=9;const ds=[...sv.querySelectorAll(".cd")];ds.forEach((d,i)=>{const k=Math.abs(+d.dataset.x-x);if(k<bd){bd=k;bi=i}});
  ds.forEach((d,i)=>d.classList.toggle("on",i===bi));c.querySelector(".ccap").innerHTML=`${esc(fmtDay(pts[bi].t))}: <b>${esc(pts[bi].txt)}</b>`}
document.addEventListener("pointerdown",chartPick);
document.addEventListener("pointermove",ev=>{if(ev.pointerType==="mouse"||ev.buttons)chartPick(ev)});

const e1rm=(w,r)=>r>0&&r<=12?(r===1?w:Math.round(w*(1+r/30)*2)/2):0;
function exLogs(id){return logs().filter(l=>l.entries&&l.entries[id]&&l.entries[id].some(x=>x.r||x.w)).map(l=>({t:l.ts,id:l.id,s:l.entries[id].filter(x=>x.r||x.w)})).reverse()}
/* Welcher Wert zählt: Gewicht, Wiederholungen, Sekunden oder Meter */
function measure(id,L){const e=EX[id];if(e.type==="kg"&&L.some(l=>l.s.some(x=>num(x.w)>0)))return {k:"w",u:"kg"};return {k:"r",u:e.type==="s"?"Sek.":e.type==="m"?"m":"Wdh."}}
function progData(id){const L=exLogs(id),m=measure(id,L);
  const pts=L.map(l=>{const b=l.s.reduce((a,x)=>num(x[m.k])>num(a[m.k])||(num(x[m.k])===num(a[m.k])&&num(x.r)>num(a.r))?x:a);return {t:l.t,v:num(b[m.k]),txt:m.k==="w"?`${dec(b.w)} kg × ${b.r||"–"}`:`${dec(b.r)} ${m.u}`}}).filter(p=>p.v>0);
  return {L,m,pts}}
function bests(id){const e=EX[id],L=exLogs(id),o=[];let w=null,r=null,m=null;
  for(const l of L)for(const x of l.s){const W=num(x.w),Rr=num(x.r);if(W>0&&(!w||W>w.v||(W===w.v&&Rr>w.r)))w={v:W,r:Rr,t:l.t};if(Rr>0&&(!r||Rr>r.v))r={v:Rr,t:l.t};const k=e1rm(W,Rr);if(W>0&&k&&(!m||k>m.v))m={v:k,t:l.t}}
  if(e.type==="kg"){if(w)o.push([dec(w.v)+" kg",`schwerster Satz (× ${w.r||"–"})`]);if(m)o.push([dec(m.v)+" kg","geschätztes Maximum für 1 Wdh."]);if(!w&&r)o.push([r.v+" Wdh.","meiste Wiederholungen"])}
  else if(e.type==="bw"){if(r)o.push([r.v+" Wdh.","meiste Wiederholungen"]);if(w)o.push(["+"+dec(w.v)+" kg","meistes Zusatzgewicht"])}
  else if(r)o.push([dec(r.v)+(e.type==="s"?" s":" m"),e.type==="s"?"längste Zeit":"weiteste Strecke"]);
  return o}
function progHTML(id){const {L,m,pts}=progData(id);if(!L.length)return "";
  const bs=bests(id);
  return `<h3 style="margin-top:24px">Fortschritt</h3>${bs.length?`<div class="target">${bs.map(b=>`<div><b>${esc(b[0])}</b><span>${esc(b[1])}</span></div>`).join("")}</div>`:""}
  ${pts.length>1?`<div class="sub" style="margin-top:8px">${m.k==="w"?"Schwerster Satz":"Bester Satz"} pro Einheit, in ${m.u}. Tippe auf einen Punkt.</div>${lineChart(pts,m.u)}`:`<div class="sub">Ab zwei Einheiten siehst du hier eine Kurve.</div>`}
  ${L.slice(-12).reverse().map(l=>`<div class="log"><div><b>${esc(fmtDay(l.t))}</b><div class="sub">${esc(fmt(l.s,EX[id].type))}</div></div></div>`).join("")}`}
let progId=null;
function renderProg(){const e=EX[progId];$("#sheet").innerHTML=`<div class="bar"><span class="sub">Fortschritt</span><button class="icon" id="close" aria-label="Schließen">${ICON.close}</button></div><div class="wrap" style="padding-top:4px"><h2 id="sh-title">${esc(e.name)}</h2>${progHTML(progId)||'<p class="sub">Noch keine Werte gespeichert.</p>'}</div>`;$("#sheet").scrollTop=0}
function newBests(entries){const out=[];for(const [id,s] of Object.entries(entries)){const L=exLogs(id);if(!L.length||!EX[id])continue;const all=L.flatMap(l=>l.s),k=EX[id].type==="kg"&&all.some(x=>num(x.w)>0)?"w":"r";
  if(Math.max(...s.map(x=>num(x[k])))>Math.max(...all.map(x=>num(x[k]))))out.push(EX[id].name)}return out}

/* ---------- Verlauf ---------- */
let calM=null,calDay=null;
const monday=t=>{const d=new Date(t);d.setHours(0,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);return d};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const inWeek=(t,m)=>t>=+m&&t<+addDays(m,7);
function renderWeek(){const p=prof();if(!p){$("#week").innerHTML="";return}
  const A=[...logs(),...myRuns()],g=p.goal||3,m=monday(Date.now()),n=A.filter(x=>inWeek(x.ts,m)).length;
  let k=n>=g?1:0,w=addDays(m,-7);while(A.filter(x=>inWeek(x.ts,w)).length>=g){k++;w=addDays(w,-7)}
  $("#week").innerHTML=`<div class="weekbox"><div class="wk"><div><b>${n} von ${g}</b><span>Einheiten diese Woche</span></div><div class="step"><button class="sm" data-goal="-1" aria-label="Wochenziel senken" ${g<2?"disabled":""}>−</button><span>Ziel</span><button class="sm" data-goal="1" aria-label="Wochenziel erhöhen" ${g>13?"disabled":""}>+</button></div></div>
   <div class="meter" role="img" aria-label="${n} von ${g} geschafft"><i style="width:${Math.min(100,n/g*100)}%"></i></div>
   <div class="sub">${n>=g?"Wochenziel geschafft. ":`Noch ${g-n} ${g-n===1?"Einheit":"Einheiten"}. `}${k>1?`${k} Wochen in Folge erreicht.`:""}</div></div>`}
function renderCal(){if(!calM){calM=new Date();calM.setDate(1);calM.setHours(0,0,0,0)}
  const y=calM.getFullYear(),mo=calM.getMonth(),n=new Date(y,mo+1,0).getDate(),off=(new Date(y,mo,1).getDay()+6)%7,T={},Ru={};
  for(const l of logs())(T[dayKey(l.ts)]=T[dayKey(l.ts)]||[]).push(l);for(const l of myRuns())(Ru[dayKey(l.ts)]=Ru[dayKey(l.ts)]||[]).push(l);
  const today=dayKey(Date.now());let c="";for(let i=0;i<off;i++)c+="<span></span>";
  for(let d=1;d<=n;d++){const k=dayKey(new Date(y,mo,d)),t=T[k],r=Ru[k];c+=`<button data-day="${k}" class="${k===today?"today":""}" aria-pressed="${k===calDay}" ${t||r?"":"disabled"} aria-label="${d}.${t?", Training":""}${r?", Lauf":""}">${d}<em>${t?'<i class="dt"></i>':""}${r?'<i class="dr"></i>':""}</em></button>`}
  const sel=calDay?[...(T[calDay]||[]).map(logRow),...(Ru[calDay]||[]).map(runRow)]:[];
  $("#cal").innerHTML=`<div class="calh"><button class="icon" data-cal="-1" aria-label="Voriger Monat">${ICON.left}</button><b>${calM.toLocaleDateString("de-DE",{month:"long",year:"numeric"})}</b><button class="icon" data-cal="1" aria-label="Nächster Monat">${ICON.right}</button></div>
   <div class="cal">${["Mo","Di","Mi","Do","Fr","Sa","So"].map(x=>`<small>${x}</small>`).join("")}${c}</div>
   <div class="leg"><span><i class="dt"></i>Training</span><span><i class="dr"></i>Lauf</span></div>${sel.join("")}`}
const nSets=l=>Object.values(l.entries||{}).reduce((a,e)=>a+e.filter(filled).length,0);
function logRow(l){const n=nSets(l);return `<button class="log" data-log="${l.id}"><div><b>${esc(l.title)}</b><div class="sub">${esc(fmtDay(l.ts))} · ${n} ${n===1?"Satz":"Sätze"}${l.note?" · "+esc(l.note):""}</div></div>${l.pain==null?"":`<span class="pill ${l.pain>=4?"hi":""}">${esc(l.painLabel||"")} ${l.pain}</span>`}</button>`}
function renderLogs(){
  const p=prof(),lbl=p?p.pain:"Schmerz",Lg=logs();
  renderWeek();renderCal();
  $("#painhead").textContent=`${lbl}, nach dem Training`;
  const k=Lg.filter(l=>typeof l.pain==="number").slice(0,14).reverse();
  $("#bars").innerHTML=k.length?k.map(l=>`<span role="img" aria-label="${esc(fmtDay(l.ts))}: ${l.pain}" title="${esc(fmtDay(l.ts))}: ${l.pain}" style="height:${Math.max(3,l.pain*8)}%"><b>${l.pain}</b></span>`).join(""):'<span style="background:none;flex:1;align-self:center" class="sub">Noch keine Werte.</span>';
  let adv="";const r=k.slice(-3);
  if(r.length&&r[r.length-1].pain>=4)adv="Die Beschwerden lagen zuletzt bei 4 oder mehr. Belastende Übungen leichter machen und die Stabilitäts-Übungen beibehalten.";
  else if(r.length===3&&r[2].pain>r[0].pain)adv="Die Beschwerden steigen leicht an. Steigere die Belastung gerade nicht.";
  $("#advice").innerHTML=adv?`<div class="msg">${adv}</div>`:"";
  const cnt={};for(const l of Lg)for(const id of Object.keys(l.entries||{}))if(EX[id]&&l.entries[id].some(x=>x.r||x.w))cnt[id]=(cnt[id]||0)+1;
  const ids=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]||EX[a].name.localeCompare(EX[b].name));
  $("#progs").innerHTML=ids.length?ids.map(id=>{const b=bests(id)[0];return `<button class="row" data-prog="${id}"><div class="thumb">${svg(EX[id],1)}</div><div><div class="t">${esc(EX[id].name)}</div><div class="d">${cnt[id]} ${cnt[id]===1?"Einheit":"Einheiten"}</div></div><span class="prog">${b?esc(b[0]):""}</span></button>`}).join(""):'<p class="sub">Nach der ersten Einheit siehst du hier deine Bestwerte.</p>';
  $("#logs").innerHTML=Lg.length?Lg.map(logRow).join(""):'<p class="sub">Noch keine Einheiten gespeichert.</p>';
}
/* eine gespeicherte Einheit ansehen und korrigieren */
let elog=null,elogDel=false;
function painRow(v,attr){return `<div class="pain">${Array.from({length:11},(_,i)=>`<button ${attr}="${i}" aria-pressed="${v===i}">${i}</button>`).join("")}</div>`}
function renderLogSheet(){const l=elog;
  $("#sheet").innerHTML=`<div class="bar"><span class="sub">Einheit</span><button class="icon" id="close" aria-label="Schließen">${ICON.close}</button></div>
  <div class="wrap" style="padding-top:4px"><h2 id="sh-title">${esc(l.title)}</h2>
  <label class="lbl">Datum<input type="date" id="ldate" value="${dayKey(l.ts)}" max="${dayKey(Date.now())}"></label>
  ${Object.entries(l.entries||{}).map(([id,s])=>{const e=EX[id];if(!e||!s.length)return "";return `<h3 style="margin-top:20px">${esc(e.name)}</h3><div class="sets">${s.map((x,i)=>`<div class="set ${isTime(e)?"one":""}"><span>${i+1}</span>${isTime(e)?"":`<input inputmode="decimal" aria-label="Gewicht" placeholder="${unit[e.type]}" data-le="${id}" data-li="${i}" data-lf="w" value="${esc(dec(x.w))}">`}<input inputmode="decimal" aria-label="${isTime(e)?unit[e.type]:"Wiederholungen"}" placeholder="${isTime(e)?unit[e.type]:"Wdh."}" data-le="${id}" data-li="${i}" data-lf="r" value="${esc(dec(x.r))}"><button class="tick" data-lx="${id}" data-li="${i}" aria-label="Satz ${i+1} entfernen">${ICON.close}</button></div>`).join("")}</div><button class="addset" data-ladd="${id}">+ Satz</button>`}).join("")}
  <h3 style="margin-top:22px">Beschwerden ${esc(l.painLabel||"")}</h3>${painRow(l.pain,"data-lp")}
  <textarea id="lnote" rows="2" placeholder="Notiz (optional)">${esc(l.note)}</textarea>
  <div class="btns"><button class="cta" id="lsave">Änderungen speichern</button></div>
  <div class="row2"><button class="link danger" id="ldel">${elogDel?"Wirklich löschen? Nochmal tippen":"Einheit löschen"}</button></div></div>`}
const keepTop=f=>{const t=$("#sheet").scrollTop;f();$("#sheet").scrollTop=t};
const atDay=(v,old)=>{const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(v);if(!m)return old;const o=new Date(old),d=new Date(+m[1],+m[2]-1,+m[3],o.getHours(),o.getMinutes(),o.getSeconds());return Math.min(+d,Date.now())};

/* ---------- Laufen ---------- */
let erun=null,erunDel=false;
const pace=r=>r.km>0&&r.sec>0?mmss(Math.round(r.sec/r.km))+" /km":"";
const dur=s=>s>=3600?`${Math.floor(s/3600)}:${mmss(s%3600).padStart(5,"0")} h`:mmss(s)+" min";
function parseDur(v){v=String(v||"").trim().replace(",",".");if(!v)return 0;const a=v.split(":").map(Number);if(a.some(x=>!isFinite(x)||x<0))return 0;return Math.round(a.length===3?a[0]*3600+a[1]*60+a[2]:a.length===2?a[0]*60+a[1]:a[0]*60)}
function runRow(r){return `<button class="log" data-run="${r.id}"><div><b>${r.km?dec(r.km)+" km":dur(r.sec)}</b><div class="sub">${esc(fmtDay(r.ts))}${r.km&&r.sec?` · ${dur(r.sec)} · ${pace(r)}`:""}${r.note?" · "+esc(r.note):""}</div></div>${r.pain==null?"":`<span class="pill ${r.pain>=4?"hi":""}">${esc(r.painLabel||"")} ${r.pain}</span>`}</button>`}
function barChart(v,o){const W=340,H=112,b=20,t=18,mx=Math.max(o.max||0,...v.map(x=>x.v||0))||1,n=Math.max(v.length,6),w=W/n;
  const top=v.reduce((a,x,i)=>x.v!=null&&(a<0||x.v>v[a].v)?i:a,-1),lastI=v.length-1,showAll=v.length<=8;
  return `<svg class="bch" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label)}: ${v.map(x=>x.d+" "+(x.v==null?"ohne Angabe":dec(x.v))).join(", ")}"><line class="cg" x1="0" x2="${W}" y1="${H-b}" y2="${H-b}"/>${v.map((x,i)=>{const bw=Math.min(24,w-6),h=x.v==null?0:Math.max(2,x.v/mx*(H-b-t)),cx=i*w+w/2;return `${x.v==null?`<text class="ct" x="${cx}" y="${H-b-5}" text-anchor="middle">–</text>`:`<path class="${o.cls}" d="M${cx-bw/2},${H-b}v${-Math.max(0,h-4)}q0,-4 4,-4h${bw-8}q4,0 4,4v${Math.max(0,h-4)}z"/>${showAll||i===top||i===lastI?`<text class="ct v" x="${cx}" y="${(H-b-Math.max(4,h)-5).toFixed(1)}" text-anchor="middle">${dec(x.v)}</text>`:""}`}${o.days&&(showAll||i%2===lastI%2)?`<text class="ct" x="${cx}" y="${H-5}" text-anchor="middle">${x.d}</text>`:""}`}).join("")}</svg>`}
function renderRuns(){const p=prof(),R0=myRuns(),lbl=p?p.pain:"";
  const m=monday(Date.now()),pm=addDays(m,-7),km=w=>Math.round(R0.filter(r=>inWeek(r.ts,w)).reduce((a,r)=>a+(r.km||0),0)*10)/10,a=km(m),b=km(pm);
  let h=`<div class="btns"><button class="cta" id="runnew">+ Lauf eintragen</button><label class="cta sec filebtn">Aus Datei laden (Garmin, GPX …)<input type="file" id="runfile" multiple></label></div>
   <details class="help"><summary>So bekommst du die Datei</summary>
   <p><b>Garmin-Uhr:</b> In Safari connect.garmin.com öffnen und anmelden. Aktivität öffnen, oben auf das Zahnrad tippen, dann „Original exportieren“ oder „In GPX exportieren“. Die Datei landet in der Dateien-App unter „Downloads“. Hier auf „Aus Datei laden“ tippen und sie auswählen. Kommt eine leere Datei heraus, den Export nochmal versuchen.</p>
   <p><b>Viele alte Läufe auf einmal:</b> Auf connect.garmin.com unter „Aktivitäten“ nach unten scrollen, bis alle geladen sind, dann „CSV exportieren“. Darin stehen nur Datum, Strecke, Zeit und Puls.</p>
   <p><b>Nur mit dem iPhone:</b> Den Lauf mit einer Lauf-App aufzeichnen, die bei gesperrtem Bildschirm weiterläuft und eine GPX-Datei speichern oder teilen kann. Die Datei in „Dateien“ sichern und hier laden.</p>
   <p>Die App merkt sich nur Datum, Strecke, Zeit, Kilometerzeiten und Puls, nicht deine Strecke auf der Karte. Läufe, die schon eingetragen sind, erkennt sie und lässt sie weg.</p></details>`;
  if(R0.length){
    h+=`<div class="target" style="margin-top:20px"><div><b>${dec(a)} km</b><span>diese Woche</span></div><div><b>${dec(b)} km</b><span>letzte Woche</span></div></div>`;
    if(b>0&&a>b*1.3)h+=`<div class="msg">Diese Woche schon ${Math.round((a/b-1)*100)} % mehr Kilometer als letzte Woche.</div>`;
    const v=R0.slice(0,12).reverse(),d=r=>new Date(r.ts).toLocaleDateString("de-DE",{day:"numeric",month:"numeric"});
    h+=`<h2 class="sech">Strecke und Beschwerden</h2><div class="sub">Die letzten ${v.length===1?"Lauf":v.length+" Läufe"}, links ältere. Oben und unten steht derselbe Lauf übereinander.</div>
     <div class="clab">Kilometer</div>${barChart(v.map(r=>({v:r.km||null,d:d(r)})),{cls:"bk",label:"Kilometer"})}
     <div class="clab">Beschwerden ${esc(lbl)} (0 bis 10)</div>${barChart(v.map(r=>({v:r.pain,d:d(r)})),{cls:"bp",max:10,days:1,label:"Beschwerden"})}`;
    const q=R0.filter(r=>r.km>0&&r.pain!=null);
    if(q.length>=6){const s=q.map(r=>r.km).sort((x,y)=>x-y),md=s[Math.floor(s.length/2)],lg=q.filter(r=>r.km>=md),sh=q.filter(r=>r.km<md),av=x=>dec((x.reduce((c,r)=>c+r.pain,0)/x.length).toFixed(1));
      if(sh.length>=3&&lg.length>=3)h+=`<div class="msg">Läufe ab ${dec(md)} km: im Schnitt Beschwerden ${av(lg)}. Kürzere Läufe: ${av(sh)}. Das ist nur eine Beobachtung aus ${q.length} Läufen, keine Diagnose.</div>`}
    else h+=`<div class="sub" style="margin-top:8px">Ab sechs Läufen mit Beschwerden-Angabe vergleicht die App kurze und lange Läufe.</div>`;
    h+=`<h2 class="sech">Alle Läufe</h2>${R0.map(runRow).join("")}`;
  } else h+=`<p class="sub" style="margin-top:14px">Trag Strecke, Zeit und Beschwerden ein. Dann siehst du, ob längere Läufe mit mehr Beschwerden zusammenhängen. Läufe zählen auch fürs Wochenziel.</p>`;
  $("#runs").innerHTML=h}
function renderRunSheet(){const r=erun;
  $("#sheet").innerHTML=`<div class="bar"><span class="sub">Laufen</span><button class="icon" id="close" aria-label="Schließen">${ICON.close}</button></div>
  <div class="wrap" style="padding-top:4px"><h2 id="sh-title">${r.id?"Lauf ändern":"Lauf eintragen"}</h2>
  <label class="lbl">Datum<input type="date" id="rdate" value="${dayKey(r.ts)}" max="${dayKey(Date.now())}"></label>
  <label class="lbl">Strecke in km<input id="rkm" inputmode="decimal" placeholder="z. B. 5,2" value="${r.km?dec(r.km):""}"></label>
  <label class="lbl">Dauer (Minuten, z. B. 32 oder 32:30)<input id="rdur" placeholder="32:30" value="${r.sec?(r.sec>=3600?Math.floor(r.sec/3600)+":"+mmss(r.sec%3600).padStart(5,"0"):mmss(r.sec)):""}"></label>
  <h3 style="margin-top:20px">Beschwerden ${esc(r.painLabel||"")} beim oder nach dem Lauf</h3><div class="sub">0 = keine, 10 = sehr stark</div>${painRow(r.pain,"data-rp")}
  <textarea id="rnote" rows="2" placeholder="Notiz (optional)">${esc(r.note)}</textarea>
  ${r.hr||r.src?`<div class="sub" style="margin-top:8px">${[r.hr?"Ø Puls "+r.hr:"",r.src?"aus Datei ("+esc(r.src)+")":""].filter(Boolean).join(" · ")}</div>`:""}${splitsHTML(r)}
  <button class="cta" id="rsave">Speichern</button><div class="sub" id="rmsg" style="margin-top:8px"></div>
  ${r.id?`<div class="row2"><button class="link danger" id="rdel">${erunDel?"Wirklich löschen? Nochmal tippen":"Lauf löschen"}</button></div>`:""}</div>`}

/* ---------- Läufe aus Dateien (Garmin, Lauf-Apps) ---------- */
/* Gelesen werden GPX, TCX, FIT, ZIP mit FIT darin und die Aktivitäten-Liste (CSV) von Garmin Connect.
   Gespeichert werden nur Datum, Strecke, Zeit, Kilometerzeiten und Puls, keine Wegpunkte. */
let rimp=null;
const RUNWORDS=/run|lauf|jog|trail|treadmill/i;
const SPORTDE={running:"Laufen",cycling:"Radfahren",biking:"Radfahren",walking:"Gehen",hiking:"Wandern",swimming:"Schwimmen",other:"Sonstiges"};
const sportDe=s=>s?SPORTDE[String(s).toLowerCase()]||String(s).slice(0,30):"";
function hav(a,b){const R=6371008.8,r=Math.PI/180,dl=(b.lat-a.lat)*r,dn=(b.lon-a.lon)*r,x=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(x)))}
/* Strecke und Bewegungszeit aus Messpunkten. p: {t (ms), lat, lon, d (Meter ab Start, falls die Uhr es liefert), hr, seg (neuer Abschnitt)} */
function track(P){
  P=P.filter(p=>isFinite(p.t)&&(isFinite(p.d)||(isFinite(p.lat)&&isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180&&!(p.lat===0&&p.lon===0)))).sort((a,b)=>a.t-b.t);
  if(P.length<2)return null;const dev=P.filter(p=>isFinite(p.d)).length>P.length*.8;if(dev)P=P.filter(p=>isFinite(p.d));
  /* GPS-Sprünge: Punkte, die schneller als 12 m/s vom letzten guten Punkt entfernt sind, fallen weg */
  if(!dev){const k=[P[0]];for(const p of P.slice(1)){const q=k[k.length-1],dt=(p.t-q.t)/1000;if(p.seg||dt<=0||hav(q,p)/dt<=12||k.length===1&&dt>60)k.push(p)}P=k}
  let dist=0,mov=0,anc=P[0],prev=P[0];const cum=[{d:0,m:0}],hrs=[];if(isFinite(P[0].hr))hrs.push(P[0].hr);
  for(const p of P.slice(1)){const dt=(p.t-prev.t)/1000;if(dt<=0)continue;let dd=0;
    if(p.seg){anc=p;prev=p;cum.push({d:dist,m:mov});continue}
    if(dev)dd=Math.max(0,p.d-prev.d);else{const s=hav(anc,p);if(s>=4){dd=s;anc=p}}
    if(!(dt>30&&dd/dt<.5))mov+=dt;dist+=dd;cum.push({d:dist,m:mov});prev=p;if(isFinite(p.hr)&&p.hr>30&&p.hr<250)hrs.push(p.hr)}
  const splits=[];let k=1,last=0;for(let i=1;i<cum.length&&k<=300;i++)while(cum[i].d>=k*1000-5&&k<=300){const a=cum[i-1],b=cum[i],f=b.d>a.d?Math.min(1,(k*1000-a.d)/(b.d-a.d)):1,m=a.m+f*(b.m-a.m);splits.push(Math.round(m-last));last=m;k++}
  return {ts:P[0].t,dist,sec:Math.round(mov),splits,hr:hrs.length?Math.round(hrs.reduce((a,b)=>a+b,0)/hrs.length):null}}
const mkRun=(o,src)=>({ts:o.ts,km:Math.round(o.dist/10)/100,sec:Math.round(o.sec||0),splits:o.splits||[],hr:o.hr||null,sport:o.sport||"",src});
const tag=(el,n)=>el.getElementsByTagNameNS("*",n);
const first=(el,n)=>{const x=tag(el,n)[0];return x?x.textContent.trim():""};
function parseGPX(doc){const out=[];
  for(const trk of tag(doc,"trk")){const P=[];let i=0;for(const seg of tag(trk,"trkseg")){let s=true;for(const pt of tag(seg,"trkpt")){const h=first(pt,"hr");P.push({lat:+pt.getAttribute("lat"),lon:+pt.getAttribute("lon"),t:Date.parse(first(pt,"time")),hr:h?+h:NaN,seg:s&&i>0});s=false}i++}
    const r=track(P);if(r)out.push(mkRun(Object.assign(r,{sport:first(trk,"type")}),"GPX"))}
  if(!out.length&&tag(doc,"trkpt").length)throw new Error("Die GPX-Datei enthält keine Zeiten. Ohne Zeiten lässt sich kein Lauf berechnen.");return out}
function parseTCX(doc){const out=[];
  for(const act of tag(doc,"Activity")){const laps=[...tag(act,"Lap")],P=[];let i=0;
    for(const tr of tag(act,"Track")){let s=true;for(const tp of tag(tr,"Trackpoint")){const d=first(tp,"DistanceMeters"),pos=tag(tp,"Position")[0],hr=tag(tp,"HeartRateBpm")[0];
      P.push({t:Date.parse(first(tp,"Time")),d:d===""?NaN:+d,lat:pos?+first(pos,"LatitudeDegrees"):NaN,lon:pos?+first(pos,"LongitudeDegrees"):NaN,hr:hr?+first(hr,"Value"):NaN,seg:s&&i>0});s=false}i++}
    const r=track(P)||{splits:[],hr:null};
    const lt=laps.reduce((a,l)=>a+(+first(l,"TotalTimeSeconds")||0),0),ld=laps.reduce((a,l)=>a+(+[...l.children].find(c=>c.localName==="DistanceMeters")?.textContent||0),0);
    const ts=Date.parse(laps[0]?laps[0].getAttribute("StartTime"):"")||r.ts||Date.parse(first(act,"Id"));if(!isFinite(ts))continue;
    out.push(mkRun({ts,dist:ld>0?ld:r.dist||0,sec:lt>0?lt:r.sec,splits:r.splits,hr:r.hr,sport:act.getAttribute("Sport")},"TCX"))}
  return out}
/* FIT ist Garmins eigenes Format: Datensätze mit vorher festgelegtem Aufbau */
function parseFIT(buf){const v=new DataView(buf),n=buf.byteLength,u8=new Uint8Array(buf);
  if(n<14||String.fromCharCode(u8[8],u8[9],u8[10],u8[11])!==".FIT")throw new Error("Keine FIT-Datei.");
  const hs=u8[0],end=Math.min(n,hs+v.getUint32(4,true)),defs={},ses=[],rec=[],EPO=631065600;let p=hs,lastTs=0;
  const INV={1:0x7F,2:0xFF,3:0x7FFF,4:0xFFFF,5:0x7FFFFFFF,6:0xFFFFFFFF,0:0xFF,10:0,11:0,12:0};
  const rd=(b,s,o,le)=>{switch(b){case 0:case 2:case 10:case 13:return s===1?u8[o]:null;case 1:return s===1?v.getInt8(o):null;case 3:return s===2?v.getInt16(o,le):null;case 4:case 11:return s===2?v.getUint16(o,le):null;
    case 5:return s===4?v.getInt32(o,le):null;case 6:case 12:return s===4?v.getUint32(o,le):null;case 8:return s===4?v.getFloat32(o,le):null;default:return null}};
  while(p<end){const h=u8[p++];let lt,ct=null;
    if(h&0x80){lt=(h>>5)&3;const off=h&31;ct=(lastTs&~31)+off;if(off<(lastTs&31))ct+=32;lastTs=ct}
    else if(h&0x40){lt=h&15;const dev=h&0x20,le=u8[p+1]===0,gm=le?v.getUint16(p+2,true):v.getUint16(p+2,false),nf=u8[p+4];p+=5;const f=[];
      for(let i=0;i<nf;i++){f.push({num:u8[p],size:u8[p+1],base:u8[p+2]&0x1F});p+=3}let dz=0;if(dev){const nd=u8[p++];for(let i=0;i<nd;i++){dz+=u8[p+1];p+=3}}
      defs[lt]={gm,le,f,dz};continue}
    else lt=h&15;
    const d=defs[lt];if(!d)throw new Error("Die FIT-Datei ist beschädigt.");const m={};
    for(const f of d.f){const x=rd(f.base,f.size,p,d.le);if(x!==null&&x!==INV[f.base])m[f.num]=x;p+=f.size}p+=d.dz;
    if(m[253]!=null&&ct===null)lastTs=m[253];const ts=m[253]??ct;
    if(d.gm===18)ses.push({start:m[2],sport:m[5],timer:m[8],elapsed:m[7],dist:m[9],hr:m[16],ts});
    else if(d.gm===20&&ts!=null)rec.push({t:(ts+EPO)*1000,d:m[5]!=null?m[5]/100:NaN,lat:m[0]!=null?m[0]*180/2**31:NaN,lon:m[1]!=null?m[1]*180/2**31:NaN,hr:m[3]??NaN})}
  const SP={1:"running",2:"cycling",5:"swimming",11:"walking",17:"hiking"};
  const r=track(rec)||{splits:[],hr:null,dist:0,sec:0};
  if(!ses.length){if(!r.ts)throw new Error("In der FIT-Datei ist keine Aktivität.");return [mkRun(r,"FIT")]}
  return ses.map(s=>mkRun({ts:s.start!=null?(s.start+EPO)*1000:r.ts,dist:s.dist!=null?s.dist/100:r.dist,sec:s.timer!=null?s.timer/1000:s.elapsed!=null?s.elapsed/1000:r.sec,
    splits:ses.length===1?r.splits:[],hr:s.hr??r.hr,sport:SP[s.sport]||(s.sport!=null?"other":"")},"FIT"))}
async function unzip(buf){const v=new DataView(buf),u8=new Uint8Array(buf),out=[];let e=-1;
  for(let i=buf.byteLength-22;i>=Math.max(0,buf.byteLength-65600);i--)if(v.getUint32(i,true)===0x06054b50){e=i;break}
  if(e<0)throw new Error("Die ZIP-Datei ist beschädigt.");let p=v.getUint32(e+16,true);const cnt=v.getUint16(e+10,true);
  for(let k=0;k<cnt&&k<50;k++){if(v.getUint32(p,true)!==0x02014b50)break;const meth=v.getUint16(p+10,true),cs=v.getUint32(p+20,true),nl=v.getUint16(p+28,true),xl=v.getUint16(p+30,true),cl=v.getUint16(p+32,true),lo=v.getUint32(p+42,true);
    const name=new TextDecoder().decode(u8.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;if(!/\.(fit|gpx|tcx)$/i.test(name))continue;
    const st=lo+30+v.getUint16(lo+26,true)+v.getUint16(lo+28,true),raw=u8.slice(st,st+cs);let data;
    if(meth===0)data=raw.buffer;else if(meth===8){if(!window.DecompressionStream)throw new Error("Dieses Gerät kann ZIP nicht entpacken. Bitte die Datei vorher entpacken.");data=await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer()}else continue;
    out.push({name:name.split("/").pop(),buf:data})}
  if(!out.length)throw new Error("In der ZIP-Datei ist keine Lauf-Datei (FIT, GPX oder TCX).");return out}
/* CSV: Garmin ändert die Spalten immer wieder, daher nach Spaltennamen suchen */
function csvRows(t){const d=[";","\t",","].map(c=>[c,(t.split("\n")[0].match(new RegExp(c==="\t"?"\t":"\\"+c,"g"))||[]).length]).sort((a,b)=>b[1]-a[1])[0][0];
  const rows=[];let row=[],f="",q=false;for(let i=0;i<t.length&&rows.length<3000;i++){const c=t[i];
    if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;else if(c===d){row.push(f);f=""}else if(c==="\n"||c==="\r"){if(c==="\r"&&t[i+1]==="\n")i++;row.push(f);rows.push(row);row=[];f=""}else f+=c}
  if(f||row.length){row.push(f);rows.push(row)}return rows.filter(r=>r.some(x=>x.trim()))}
const numx=s=>{s=String(s||"").trim().replace(/[^\d.,-]/g,"");if(!s)return NaN;if(s.includes(",")&&s.includes("."))s=s.lastIndexOf(",")>s.lastIndexOf(".")?s.replace(/\./g,"").replace(",","."):s.replace(/,/g,"");else s=s.replace(",",".");return parseFloat(s)};
function parseDate(s){s=String(s||"").trim();let m=/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(s);if(m)return +new Date(+m[3],m[2]-1,+m[1],+(m[4]||12),+(m[5]||0),+(m[6]||0));
  m=/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(s);if(m)return +new Date(+m[1],m[2]-1,+m[3],+(m[4]||12),+(m[5]||0),+(m[6]||0));const t=Date.parse(s);return isFinite(t)?t:NaN}
function parseCSV(t){const R=csvRows(t);if(R.length<2)throw new Error("Die CSV-Datei ist leer.");const H=R[0].map(h=>h.trim().replace(/^﻿/,"").toLowerCase());
  const col=(...res)=>{for(const re of res){const i=H.findIndex(h=>re.test(h));if(i>=0)return i}return -1};
  const cT=col(/^(aktivitätstyp|activity type|sportart|sport|type|typ)$/),cD=col(/^(datum|date|startzeit|start time|start)$/),cK=col(/^(distanz|distance|strecke)$/,/^(distanz|distance)/),
    cZ=col(/^(zeit|time)$/,/^(bewegungszeit|moving time)$/,/^(verstrichene zeit|elapsed time|dauer|duration)$/),cH=col(/^(ø herzfrequenz|durchschn\. herzfrequenz|avg hr|average heart rate|avg heart rate)$/);
  if(cD<0||(cK<0&&cZ<0))throw new Error("In der CSV-Datei fehlen die Spalten für Datum, Distanz oder Zeit.");
  return R.slice(1).filter(r=>r[cD]&&r[cD].trim().toLowerCase()!==H[cD]).map(r=>{let km=cK>=0?numx(r[cK]):0;if(km>300)km/=1000;const ts=parseDate(r[cD]);
    return {ts,km:isFinite(km)?Math.round(km*100)/100:0,sec:cZ>=0?parseDur((r[cZ]||"").split(/[.,]/)[0].includes(":")?r[cZ].replace(/[.,]\d+$/,""):r[cZ]):0,splits:[],hr:cH>=0&&numx(r[cH])>30?Math.round(numx(r[cH])):null,sport:cT>=0?(r[cT]||"").trim():"",src:"CSV"}}).filter(x=>isFinite(x.ts))}
async function parseFile(name,buf){const u8=new Uint8Array(buf);
  if(u8[0]===0x50&&u8[1]===0x4B){const fs=await unzip(buf),out=[];for(const f of fs)out.push(...await parseFile(f.name,f.buf));return out}
  if(buf.byteLength>=12&&String.fromCharCode(u8[8],u8[9],u8[10],u8[11])===".FIT")return parseFIT(buf);
  const t=new TextDecoder().decode(u8).replace(/^﻿/,""),s=t.trimStart();
  if(s.startsWith("<")){const doc=new DOMParser().parseFromString(t,"application/xml");if(tag(doc,"parsererror").length)throw new Error("Die Datei ist beschädigt.");
    const root=doc.documentElement.localName;if(root==="gpx")return parseGPX(doc);if(root==="TrainingCenterDatabase")return parseTCX(doc);throw new Error("Unbekanntes Format.")}
  if(/\.csv$/i.test(name)||/[,;\t]/.test(s.split("\n")[0]))return parseCSV(t);
  throw new Error("Unbekanntes Format. Möglich sind GPX, TCX, FIT, ZIP oder CSV.")}
async function importRuns(files){rimp={busy:true,items:[],err:[]};sheetMode="rimp";showSheet();renderRimp();
  for(const f of [...files].slice(0,50)){try{if(f.size>3e7)throw new Error("Die Datei ist zu groß.");const rs=await parseFile(f.name,await f.arrayBuffer());if(!rs.length)throw new Error("Darin ist kein Lauf.");
      rs.forEach(r=>rimp.items.push(Object.assign(r,{file:f.name})))}catch(e){rimp.err.push(`${f.name}: ${e.message||"lässt sich nicht lesen"}`)}}
  const mine=myRuns(),seen=[];rimp.items.sort((a,b)=>b.ts-a.ts);
  for(const r of rimp.items){const same=x=>Math.abs(x.ts-r.ts)<10*60e3||(dayKey(x.ts)===dayKey(r.ts)&&x.km>0&&r.km>0&&Math.abs(x.km-r.km)<=Math.max(.3,r.km*.05));
    const isRun=!r.sport||RUNWORDS.test(r.sport);
    r.why=!isRun?`kein Lauf (${sportDe(r.sport)})`:mine.some(same)?"schon eingetragen":seen.some(same)?"doppelt in der Auswahl":!r.km&&!r.sec?"ohne Strecke und Zeit":"";r.sel=!r.why;if(isRun&&!r.why)seen.push(r)}
  rimp.busy=false;if(sheetMode==="rimp")renderRimp()}
function renderRimp(){const R=rimp,n=R.items.filter(x=>x.sel).length;
  $("#sheet").innerHTML=`<div class="bar"><span class="sub">Läufe aus Datei</span><button class="icon" id="close" aria-label="Schließen">${ICON.close}</button></div>
  <div class="wrap" style="padding-top:4px"><h2 id="sh-title">${R.busy?"Lese Dateien …":R.items.length?"Gefundene Läufe":"Nichts gefunden"}</h2>
  ${R.err.map(e=>`<div class="msg">${esc(e)}</div>`).join("")}
  ${R.items.length?`<div class="sub">Tippe an, was übernommen werden soll.</div>${R.items.map((r,i)=>`<button class="tog" data-rsel="${i}" aria-pressed="${r.sel}"><span><b>${esc(fmtDay(r.ts))} · ${r.km?dec(r.km)+" km":""}${r.km&&r.sec?" · ":""}${r.sec?dur(r.sec):""}</b><span class="sub" style="display:block;font-size:13px">${[pace(r),r.hr?"Ø Puls "+r.hr:"",r.splits.length?r.splits.length+" Kilometerzeiten":"",r.sport&&!RUNWORDS.test(r.sport)?"":"",r.why].filter(Boolean).map(esc).join(" · ")}</span></span><span class="sw" aria-hidden="true"></span></button>`).join("")}
   <button class="cta" id="rimpgo" ${n?"":"disabled"}>${n===1?"Lauf übernehmen":`${n} Läufe übernehmen`}</button>${n>1?'<p class="sub" style="font-size:13px">Beschwerden trägst du danach pro Lauf nach, indem du ihn antippst.</p>':""}`:""}</div>`}
function rimpGo(){const pr=prof(),sel=rimp.items.filter(x=>x.sel).map(r=>({id:uid("r"),ts:Math.min(r.ts,Date.now()),pid:pr.id,km:Math.min(500,r.km),sec:Math.min(360000,r.sec),pain:null,painLabel:pr.pain,note:"",splits:r.splits.slice(0,300),hr:r.hr,src:r.src}));
  if(sel.length===1){const r=sel[0];r.id=null;erun=r;erunDel=false;rimp=null;sheetMode="run";renderRunSheet();$("#sheet").scrollTop=0;return}
  const old=runs;runs=[...sel,...runs];if(!saveRuns()){runs=old;toast("Speichern hat nicht geklappt");return}rimp=null;closeSheet();toast(`${sel.length} Läufe übernommen`)}
function splitsHTML(r){if(!r.splits||!r.splits.length)return "";const mx=Math.max(...r.splits),mn=Math.min(...r.splits);
  return `<h3 style="margin-top:20px">Kilometerzeiten</h3><div class="splits">${r.splits.map((s,i)=>`<div><span>${i+1}</span><i style="width:${Math.round(30+70*(s-mn)/((mx-mn)||1))}%"></i><b>${mmss(s)}</b></div>`).join("")}</div><div class="sub" style="font-size:13px">Kürzerer Balken = schnellerer Kilometer.</div>`}

/* ---------- Eigene Übungen ---------- */
let ecust=null;
function regCust(c){EX[c.id]={id:c.id,name:c.name,type:c.type,rest:c.rest,how:c.how,cat:c.cat,reps:c.reps,need:c.need,eq:c.need.length>0,kind:"a",custom:1,off:c.off}}
function renderCust(){const c=ecust,chip=(a,on,t)=>`<button class="chip" ${a} aria-pressed="${!!on}">${t}</button>`;
  $("#sheet").innerHTML=`<div class="bar"><span class="sub">Eigene Übung</span><button class="icon" id="close" aria-label="Schließen">${ICON.close}</button></div>
  <div class="wrap" style="padding-top:4px"><h2 id="sh-title">${c.id?"Übung bearbeiten":"Eigene Übung anlegen"}</h2>
  <label class="lbl">Name<input data-cf="name" maxlength="60" value="${esc(c.name)}" placeholder="z. B. Beinpresse"></label>
  <div class="gsec"><div class="sub">Körperbereich</div><div class="chips wrapc">${CATS.map(([k,t])=>chip(`data-ccat="${k}"`,c.cat===k,t)).join("")}</div></div>
  <div class="gsec"><div class="sub">Was trägst du ein?</div><div class="chips wrapc">${[["kg","Gewicht & Wdh."],["bw","Wdh. (Körpergewicht)"],["s","Sekunden"],["m","Meter"]].map(([k,t])=>chip(`data-ctype="${k}"`,c.type===k,t)).join("")}</div></div>
  <div class="grid2e" style="margin-top:14px"><label>${c.type==="s"?"Sekunden":c.type==="m"?"Meter":"Wiederholungen"} pro Satz<input data-cf="reps" maxlength="20" value="${esc(c.reps)}" placeholder="8–10"></label><label>Pause (Sek.)<input data-cf="rest" inputmode="numeric" value="${c.rest}"></label></div>
  <div class="gsec"><div class="sub">Benötigte Geräte</div><div class="chips wrapc">${GEARS.map(([k,t])=>chip(`data-cgear="${k}"`,c.need.includes(k),t)).join("")}</div></div>
  <label class="lbl">Anleitung (eine Zeile pro Schritt)<textarea data-cf="how" rows="4" maxlength="600">${esc(c.how.join("\n"))}</textarea></label>
  <p class="sub" style="font-size:13px">Eigene Übungen haben keine animierte Figur. Der Plan-Generator verwendet sie mit.</p>
  <button class="cta" id="csave">Speichern</button>
  ${c.id?`<button class="cta sec" id="coff">${c.off?"Wieder einblenden":"Ausblenden"}</button><p class="sub" style="font-size:13px">Ausblenden entfernt sie aus Auswahl und Generator. In bestehenden Plänen und im Verlauf bleibt sie.</p>`:""}</div>`}

/* ---------- Hantelscheiben ---------- */
const PLATES=[25,20,15,10,5,2.5,1.25,.5],BARS=[20,15,10,7.5];
const isBar=e=>(e.need||[]).some(n=>n.split("|").includes("bb"));
let platesW="";
/* beste Beladung pro Seite: möglichst nah ans Ziel (nie darüber), dann möglichst wenige Scheiben */
function loadPlates(target,bar,av){const U=20,side=Math.floor(Math.round((target-bar)*U)/2);if(side<0)return null;
  const best=Array(side+1).fill(null);best[0]=[0,0];for(const p of av){const u=Math.round(p*U);for(let i=u;i<=side;i++)if(best[i-u]&&(!best[i]||best[i-u][0]+1<best[i][0]))best[i]=[best[i-u][0]+1,u]}
  let k=side;while(!best[k])k--;const out=[];for(let i=k;i>0;i-=best[i][1])out.push(best[i][1]/U);return {list:out.sort((a,b)=>b-a),total:bar+2*k/U}}
function platesRes(){const t=num(platesW);if(!t)return '<p class="sub">Gib das Gesamtgewicht ein (mit Stange).</p>';if(t>500)return '<p class="sub">Bitte höchstens 500 kg.</p>';
  const l=loadPlates(t,set.bar,set.plates);if(!l)return `<p class="sub">Die Stange allein wiegt schon ${dec(set.bar)} kg.</p>`;
  const g={};l.list.forEach(p=>g[p]=(g[p]||0)+1);
  return `<div class="plv" aria-hidden="true"><i class="rod"></i>${l.list.map(p=>`<i style="height:${Math.round(26+Math.min(p,25)/25*64)}px"></i>`).join("")}<i class="rod s"></i></div>
   <div class="target"><div><b>${l.list.length?Object.entries(g).sort((a,b)=>b[0]-a[0]).map(([p,n])=>`${n} × ${dec(p)}`).join(" + "):"keine Scheiben"}</b><span>pro Seite</span></div><div><b>${dec(l.total)} kg</b><span>gesamt mit ${dec(set.bar)}-kg-Stange</span></div></div>
   ${Math.abs(l.total-t)>.001?`<div class="msg">${dec(t)} kg geht mit diesen Scheiben nicht genau. Das ist die nächstkleinere Möglichkeit.</div>`:""}`}
function renderPlates(){
  $("#sheet").innerHTML=`<div class="bar"><span class="sub">Hantelscheiben</span><button class="icon" id="close" aria-label="Zurück">${ICON.close}</button></div>
  <div class="wrap" style="padding-top:4px"><h2 id="sh-title">Was kommt auf die Stange?</h2>
  <label class="lbl">Gesamtgewicht in kg<input id="plw" inputmode="decimal" value="${esc(dec(platesW))}"></label><div id="plres">${platesRes()}</div>
  <div class="gsec"><div class="sub">Stange</div><div class="chips wrapc">${BARS.map(b=>`<button class="chip" data-plbar="${b}" aria-pressed="${set.bar===b}">${dec(b)} kg</button>`).join("")}</div></div>
  <div class="gsec"><div class="sub">Vorhandene Scheiben</div><div class="chips wrapc">${PLATES.map(p=>`<button class="chip" data-plp="${p}" aria-pressed="${set.plates.includes(p)}">${dec(p)}</button>`).join("")}</div></div>
  <button class="cta" id="pluse">In nächsten Satz übernehmen</button></div>`}

/* ---------- Sicherung & Einstellungen ---------- */
let pend=null,undoArm=false;
const exportData=()=>({app:"trainingskarte",v:1,created:new Date().toISOString(),profiles,logs:allLogs,runs,custom,gen:GP,settings:set});
function snapshot(){try{localStorage.setItem("tk3-undo",JSON.stringify(exportData()));set.undo=Date.now();saveSet();return true}catch(e){return false}}
async function doBackup(){
  const name=`Trainingskarte-Sicherung-${dayKey(Date.now())}.json`,f=new File([JSON.stringify(exportData(),null,1)],name,{type:"application/json"});
  const done=()=>{set.backup=Date.now();saveSet();renderRemind();if(sheetMode==="set"&&!$("#sheet").hidden)keepTop(renderSet)};
  if(navigator.canShare&&navigator.canShare({files:[f]})&&matchMedia("(pointer:coarse)").matches){try{await navigator.share({files:[f]});done();return}catch(e){if(e&&e.name==="AbortError")return}}
  const a=document.createElement("a");a.href=URL.createObjectURL(f);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);done();
}
/* fremde oder kaputte Dateien abfangen: nur bekannte Felder in erwarteter Form übernehmen */
function cleanBackup(d){
  if(!d||typeof d!=="object"||d.app!=="trainingskarte"||!Array.isArray(d.profiles)||!d.profiles.length)throw new Error("Das ist keine Sicherung der Trainingskarte.");
  const str=(x,n)=>String(x??"").slice(0,n),sid=x=>/^[\w-]{1,60}$/.test(x)?x:uid("x"),int=(x,a,b,f)=>{const v=parseInt(x,10);return v>=a&&v<=b?v:f},arr=x=>Array.isArray(x)?x:[],nw=x=>/^\d{0,4}([.,]\d{0,3})?$/.test(String(x??""))?String(x??""):"";
  const tsOk=t=>typeof t==="number"&&t>0&&t<4e12,pn=x=>typeof x==="number"&&x>=0&&x<=10?Math.round(x):null;
  const cust=arr(d.custom).filter(c=>c&&/^cx[\w-]{1,40}$/.test(c.id)).map(c=>({id:c.id,name:str(c.name,60)||"Übung",type:["kg","bw","s","m"].includes(c.type)?c.type:"kg",rest:int(c.rest,0,600,60),reps:str(c.reps,20)||"10",cat:CATS.some(k=>k[0]===c.cat)?c.cat:"legs",need:arr(c.need).filter(g=>GEARS.some(k=>k[0]===g)),how:arr(c.how).map(h=>str(h,200)).slice(0,12),off:!!c.off}));
  const known=id=>(Object.hasOwn(EX,id)&&!EX[id].custom)||cust.some(c=>c.id===id);let lost=0;
  const exs=a=>arr(a).map(r=>{if(!r||!known(r.id)){lost++;return null}const o={id:r.id,sets:int(r.sets,1,10,3),reps:str(r.reps,20)||"10"};if(known(r.orig))o.orig=r.orig;return o}).filter(Boolean);
  const pr=d.profiles.map(p=>{const modes={};for(const [k,m] of Object.entries(p.modes||{}))if(/^\w{1,20}$/.test(k)&&m)modes[k]={label:str(m.label,30)||k,plans:arr(m.plans).map(x=>({id:sid(x.id),title:str(x.title,60)||"Plan",min:int(x.min,1,300,45),ex:exs(x.ex)}))};
    if(!Object.keys(modes).length)modes.gym={label:"Gym",plans:[]};
    return {id:sid(p.id),name:str(p.name,40)||"Profil",pain:str(p.pain,40),tpl:Object.hasOwn(TPL,p.tpl)?p.tpl:"leer",goal:int(p.goal,1,14,3),modes}});
  const lg=arr(d.logs).filter(l=>l&&tsOk(l.ts)).map(l=>{const entries={};for(const [id,s] of Object.entries(l.entries||{})){if(!known(id)){lost++;continue}entries[id]=arr(s).filter(x=>x&&typeof x==="object").map(x=>({w:nw(x.w),r:nw(x.r),ok:!!x.ok}))}
    return {id:l.id&&/^[\w-]{1,60}$/.test(l.id)?l.id:uid("l"),ts:l.ts,pid:str(l.pid,60),plan:str(l.plan,60),title:str(l.title,100),entries,pain:pn(l.pain),painLabel:str(l.painLabel,40),note:str(l.note,1000)}});
  const rn=arr(d.runs).filter(r=>r&&tsOk(r.ts)).map(r=>{const o={id:sid(r.id),ts:r.ts,pid:str(r.pid,60),km:Math.min(500,Math.max(0,num(r.km))),sec:int(r.sec,0,360000,0),pain:pn(r.pain),painLabel:str(r.painLabel,40),note:str(r.note,1000)};
    const sp=arr(r.splits).map(x=>int(x,1,36000,0)).filter(Boolean).slice(0,300);if(sp.length)o.splits=sp;const hr=int(r.hr,30,250,0);if(hr)o.hr=hr;if(["GPX","TCX","FIT","CSV"].includes(r.src))o.src=r.src;return o});
  return {profiles:pr,logs:lg,runs:rn,custom:cust,settings:d.settings,gen:d.gen,lost,created:d.created};
}
function cleanSet(x){const o=Object.assign({},set);if(x&&typeof x==="object"){for(const k of ["sound","loud","awake"])if(typeof x[k]==="boolean")o[k]=x[k];if(BARS.includes(x.bar))o.bar=x.bar;if(Array.isArray(x.plates))o.plates=PLATES.filter(p=>x.plates.includes(p));if(typeof x.backup==="number")o.backup=x.backup}return o}
function cleanGen(x){if(!x||typeof x!=="object")return;const gk=a=>Array.isArray(a)?a.filter(g=>GEARS.some(k=>k[0]===g)):[];
  if(["gym","home"].includes(x.where))GP.where=x.where;if(Array.isArray(x.regions))GP.regions=x.regions.filter(r=>REG.some(k=>k[0]===r));if([20,30,45,60,75].includes(x.min))GP.min=x.min;GP.gentle=!!x.gentle;if(x.gear)GP.gear={gym:gk(x.gear.gym),home:gk(x.gear.home)}}
function applyBackup(c){
  if(hold)holdCancel();
  for(const x of custom)delete EX[x.id];
  profiles=c.profiles;allLogs=c.logs;runs=c.runs;custom=c.custom;custom.forEach(regCust);draft={};order={};swaps={};work=null;editing=false;gen=null;pain=null;
  set=cleanSet(c.settings);cleanGen(c.gen);gpSave();
  activeId=profiles[0].id;mode=planId=null;ensureSel();
  const ok=[saveProfiles(),saveLogs(),saveRuns(),saveCust(),saveSet()].every(Boolean);
  back=null;pend=null;closeSheet();renderAll();toast(ok?"Daten geladen":"Laden hat nicht ganz geklappt");
}
async function pickFile(f){try{if(f.size>2e7)throw new Error("Die Datei ist zu groß.");let d;try{d=JSON.parse(await f.text())}catch(e){throw new Error("Die Datei lässt sich nicht lesen.")}pend=cleanBackup(d);pend.err=""}catch(e){pend={err:e.message||"Die Datei lässt sich nicht lesen."}}keepTop(renderSet)}
function openSet(){sheetMode="set";pend=null;undoArm=false;showSheet();renderSet()}
function renderSet(){
  const tog=(k,t,d)=>`<button class="tog" data-set="${k}" aria-pressed="${set[k]}"><span><b>${t}</b><span class="sub" style="display:block;font-size:13px">${d}</span></span><span class="sw" aria-hidden="true"></span></button>`;
  const n=(x,a,b)=>`${x} ${x===1?a:b}`;
  $("#sheet").innerHTML=`<div class="bar"><span class="sub">Einstellungen</span><button class="icon" id="close" aria-label="Schließen">${ICON.close}</button></div>
  <div class="wrap" style="padding-top:4px"><h2 id="sh-title">Sicherung</h2>
  <p class="sub">Deine Daten liegen nur auf diesem Gerät. Wenn du die App löschst oder das Handy verlierst, hilft nur die Sicherungsdatei. Sie enthält auch deine Beschwerden-Angaben.</p>
  ${profiles.length?`<button class="cta" id="bkup">Sicherung speichern</button><div class="sub" style="margin-top:6px">${set.backup?"Letzte Sicherung: "+esc(fmtDay(set.backup)):"Noch keine Sicherung gemacht."}</div>`:""}
  <label class="cta sec filebtn">Sicherung laden<input type="file" id="bkfile" accept=".json,application/json"></label>
  ${pend?pend.err?`<div class="msg">${esc(pend.err)}</div>`:`<div class="msg"><b>Gefunden</b><br>${n(pend.profiles.length,"Profil","Profile")} (${pend.profiles.map(p=>esc(p.name)).join(", ")}), ${n(pend.logs.length,"Einheit","Einheiten")}, ${n(pend.runs.length,"Lauf","Läufe")}, ${n(pend.custom.length,"eigene Übung","eigene Übungen")}.${pend.lost?`<br>${n(pend.lost,"unbekannte Übung wird","unbekannte Übungen werden")} ausgelassen.`:""}${profiles.length?"<br>Das ersetzt alle Daten, die jetzt in der App sind.":""}<button class="cta" id="bkgo">${profiles.length?"Daten ersetzen":"Daten laden"}</button></div>`:""}
  ${set.undo&&profiles.length?`<div class="row2"><button class="link" id="bkundo">${undoArm?"Ersetzt die jetzigen Daten. Nochmal tippen":`Stand vom ${esc(new Date(set.undo).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}))} wiederherstellen`}</button></div>`:""}
  ${profiles.length?`<h2 style="margin-top:28px">Training</h2>
  ${tog("sound","Ton beim Timer","Piept, wenn Pause oder Haltezeit vorbei ist. Nur solange die App offen ist.")}
  ${tog("loud","Auch im Lautlos-Modus","Kann laufende Musik anhalten.")}
  ${tog("awake","Bildschirm anlassen","Solange ein Training läuft.")}`:""}
  <p class="note">Trainingskarte ${esc(APPV)}. Die App schickt keine Daten ins Internet.</p></div>`}
function renderRemind(){const el=$("#remind"),n=[...allLogs,...runs].filter(l=>l.ts>set.backup).length;
  const show=profiles.length>0&&n>=5;el.hidden=!show;if(show)el.innerHTML=`${n} Einträge sind noch nicht gesichert. <button class="link" id="bkup">Jetzt sichern</button>`}

/* ---------- KI-Text ---------- */
function kiPrompt(){const P=gPool(),g=gen,pr=prof();
  const cat=P.filter(e=>e.kind!=="w"||GP.regions.includes("legs")).map(e=>`${e.id}: ${e.name} [${CATS.find(c=>c[0]===e.cat)[1]}, ${({c:"Grundübung",a:"Ergänzung",r:"Stabilität/Reha",w:"Aufwärmen"})[e.kind]}, Standard ${e.reps}${trow(e)}]`).join("\n");
  return `Du bist ein erfahrener Trainer und stellst einen Trainingsplan für eine App zusammen.
Rahmen: Ort ${GP.where==="gym"?"Fitnessstudio":"zuhause"}, Körperregionen: ${GP.regions.map(r=>REG.find(x=>x[0]===r)[1]).join(", ")}, Dauer ca. ${GP.min} Minuten inklusive Pausen.
${GP.gentle?`Gelenkschonend trainieren. Im Profil vermerkte Beschwerden: ${pr&&pr.pain||"keine Angabe"}. Keine Sprünge, keine schwere Achsenlast, Stabilitätsübungen einbauen.\n`:""}Aktueller Vorschlag: ${g.ex.map(r=>`${r.id} ${r.sets}x${r.reps}`).join(", ")||"leer"}.
Wünsche der Person: "${(g.wish||"keine besonderen, verbessere nur Auswahl und Reihenfolge").slice(0,400)}"
Du darfst NUR Übungen aus dieser Liste verwenden (id: Name [Kategorie, Art, Standard-Wdh.]):
${cat}
Regeln: Aufwärmen zuerst, große Grundübungen vor Ergänzungen, Rumpf am Ende. Passe die Menge an die Dauer an (pro Satz grob 1,5 bis 2,5 Minuten inklusive Pause). Wiederholungen als kurzer Text wie "8–10", "12 / Seite" oder "30" (bei Sekunden-Übungen die Sekunden).
Antworte nur mit JSON: {"title":"kurzer deutscher Planname","ex":[{"id":"…","sets":3,"reps":"8–10"}],"tip":"ein Satz, was du geändert hast"}`}
function kiHTML(){const g=gen;return `<div class="gsec" style="margin-top:24px"><div class="sub">Mit einer KI verfeinern (optional)</div>
  <p class="sub" style="font-size:13px;margin:4px 0 8px">Kopiere den Text in eine KI deiner Wahl und füge die Antwort hier ein.${GP.gentle?" Der Text enthält deine Beschwerden-Angabe aus dem Profil.":""}</p>
  <textarea id="gwish" rows="2" placeholder="Wünsche, z. B. mehr Po, keine Überkopf-Übungen">${esc(g.wish)}</textarea>
  <button class="cta sec" id="gcopy">1. Text kopieren</button>${g.show?`<textarea id="gtxt" rows="4" readonly style="margin-top:8px">${esc(g.show)}</textarea>`:""}
  <textarea id="gans" rows="2" style="margin-top:10px" placeholder="2. Antwort der KI hier einfügen">${esc(g.ans||"")}</textarea>
  <button class="cta sec" id="guse" style="margin-top:10px">3. Antwort übernehmen</button><div class="sub" id="gaimsg" style="margin-top:6px">${esc(g.aimsg||"")}</div></div>`}
function kiUse(){const g=gen;try{const t=g.ans||"",a=t.indexOf("{"),z=t.lastIndexOf("}");if(a<0||z<a)throw 0;const r=JSON.parse(t.slice(a,z+1)),ok=new Set(gPool().map(e=>e.id)),seen=new Set();
    const ex=(Array.isArray(r.ex)?r.ex:[]).filter(x=>x&&ok.has(x.id)&&!seen.has(x.id)&&seen.add(x.id)).map(x=>({id:x.id,sets:Math.min(6,Math.max(1,parseInt(x.sets,10)||3)),reps:String(x.reps||EX[x.id].reps).slice(0,20)}));
    if(ex.length<2)throw 0;g.ex=ex;g.note="";if(r.title)g.title=String(r.title).slice(0,40);g.aimsg=r.tip?String(r.tip).slice(0,200):"Plan angepasst.";g.ans="";g.show="";keepTop(renderGen);const el=$("#gpre");if(el)el.scrollIntoView({behavior:"smooth",block:"start"});toast("Vorschlag übernommen")}
  catch(e){g.aimsg="Das konnte ich nicht lesen. Kopiere die ganze Antwort der KI, sie muss geschweifte Klammern enthalten.";keepTop(renderGen)}}

/* ---------- Klicks und Eingaben der neuen Teile ---------- */
function xClick(b){const d=b.dataset;
  if(d["3d"]){open3D(d["3d"]);return true}
  if(b.id==="instx"){$("#install").hidden=true;try{sessionStorage.setItem("tk3-noinst","1")}catch(e){}return true}
  if(b.id==="updgo"){if(updW)updW.postMessage("skip");return true}
  if(b.id==="setbtn"){openSet();return true}
  if(b.id==="wset"){back=()=>{sheetMode="who";renderWho()};openSet();return true}
  if(b.id==="bkup"){doBackup();return true}
  if(b.id==="bkgo"){if(pend&&!pend.err){if(profiles.length&&!snapshot()){toast("Zu wenig Speicher für die Rückgängig-Kopie");return true}const c=pend;const u=set.undo;applyBackup(c);set.undo=u;saveSet()}return true}
  if(b.id==="bkundo"){if(!undoArm){undoArm=true;keepTop(renderSet);return true}try{const c=cleanBackup(JSON.parse(localStorage.getItem("tk3-undo")));snapshot();const u=set.undo;applyBackup(c);set.undo=u;saveSet()}catch(e){toast("Wiederherstellen hat nicht geklappt")}return true}
  if(d.set){set[d.set]=!set[d.set];saveSet();if(d.set==="awake")awake();if(d.set==="sound"&&set.sound){unlock();beep(1)}if(d.set==="loud"){unlock();beep(1)}keepTop(renderSet);return true}
  if(d.goal){const p=prof();p.goal=Math.min(14,Math.max(1,(p.goal||3)+ +d.goal));saveProfiles();renderWeek();return true}
  if(d.cal){calM=new Date(calM.getFullYear(),calM.getMonth()+ +d.cal,1);calDay=null;renderCal();return true}
  if(d.day){calDay=calDay===d.day?null:d.day;renderCal();return true}
  if(d.log){const l=allLogs.find(x=>x.id===d.log);if(l){elog=clone(l);elogDel=false;sheetMode="log";showSheet();renderLogSheet()}return true}
  if(d.lp!=null){const v=+d.lp;elog.pain=elog.pain===v?null:v;keepTop(renderLogSheet);return true}
  if(d.lx){elog.entries[d.lx].splice(+d.li,1);keepTop(renderLogSheet);return true}
  if(d.ladd){elog.entries[d.ladd].push({w:"",r:"",ok:true});keepTop(renderLogSheet);return true}
  if(b.id==="lsave"){const l=elog;for(const k of Object.keys(l.entries||{})){l.entries[k]=l.entries[k].filter(x=>x.r||x.w||(x.ok&&x.r===undefined));if(!l.entries[k].length)delete l.entries[k]}
    const old=allLogs;allLogs=allLogs.map(x=>x.id===l.id?l:x);if(!saveLogs()){allLogs=old;return true}closeSheet();toast("Einheit geändert");return true}
  if(b.id==="ldel"){if(!elogDel){elogDel=true;keepTop(renderLogSheet);return true}allLogs=allLogs.filter(x=>x.id!==elog.id);saveLogs();closeSheet();toast("Einheit gelöscht");return true}
  if(d.prog){progId=d.prog;sheetMode="prog";showSheet();renderProg();return true}
  if(b.id==="progbtn"){const s=$("#sheet").scrollTop;progId=rowAt(plan(),open).id;back=()=>{sheetMode="train";renderSheet();$("#sheet").scrollTop=s};sheetMode="prog";renderProg();return true}
  if(b.id==="platebtn"){const st=$("#sheet").scrollTop,p=plan(),id=rowAt(p,open).id,s=sets(p,open),i=Math.max(0,s.findIndex(x=>!x.ok));platesW=s[i].w||hint(id,s,i).w||"";back=()=>{sheetMode="train";renderSheet();$("#sheet").scrollTop=st};sheetMode="plates";cancelAnimationFrame(raf);renderPlates();$("#sheet").scrollTop=0;return true}
  if(d.plbar){set.bar=+d.plbar;saveSet();keepTop(renderPlates);return true}
  if(d.plp){const v=+d.plp;set.plates=set.plates.includes(v)?set.plates.filter(x=>x!==v):PLATES.filter(x=>x===v||set.plates.includes(x));saveSet();keepTop(renderPlates);return true}
  if(b.id==="pluse"){const t=num(platesW),l=t&&t<=500?loadPlates(t,set.bar,set.plates):null;if(l){const s=sets(plan(),open),x=s.find(x=>!x.ok)||s[s.length-1];x.w=String(l.total);persist();toast(dec(l.total)+" kg übernommen")}closeSheet();return true}
  if(d.rsel!=null){const r=rimp.items[+d.rsel];r.sel=!r.sel;keepTop(renderRimp);return true}
  if(b.id==="rimpgo"){rimpGo();return true}
  if(b.id==="runnew"){const p=prof();erun={id:null,ts:Date.now(),km:0,sec:0,pain:null,painLabel:p.pain,note:""};erunDel=false;sheetMode="run";showSheet();renderRunSheet();return true}
  if(d.run){const r=runs.find(x=>x.id===d.run);if(r){erun=clone(r);erunDel=false;sheetMode="run";showSheet();renderRunSheet()}return true}
  if(d.rp!=null){readRun();const v=+d.rp;erun.pain=erun.pain===v?null:v;keepTop(renderRunSheet);return true}
  if(b.id==="rsave"){const v=$("#rkm").value.trim(),dv=$("#rdur").value.trim();readRun();if((v&&!erun.km)||(dv&&!erun.sec)||(!erun.km&&!erun.sec)){$("#rmsg").textContent=!v&&!dv?"Bitte Strecke oder Dauer eintragen.":"Bitte Strecke (z. B. 5,2) und Dauer (z. B. 32:30) prüfen.";return true}
    const r=clone(erun),old=runs;if(r.id)runs=runs.map(x=>x.id===r.id?r:x);else{r.id=uid("r");r.pid=prof().id;runs=[r,...runs]}if(!saveRuns()){runs=old;$("#rmsg").textContent="Speichern hat nicht geklappt.";return true}closeSheet();toast("Lauf gespeichert");return true}
  if(b.id==="rdel"){if(!erunDel){readRun();erunDel=true;keepTop(renderRunSheet);return true}runs=runs.filter(x=>x.id!==erun.id);saveRuns();closeSheet();toast("Lauf gelöscht");return true}
  if(b.id==="custnew"){ecust={id:null,name:"",type:"kg",rest:60,reps:"10–12",cat:"legs",need:[],how:[],off:false};sheetMode="cust";showSheet();renderCust();return true}
  if(d.cedit){const c=custom.find(x=>x.id===d.cedit);if(c){ecust=clone(c);sheetMode="cust";cancelAnimationFrame(raf);renderCust();$("#sheet").scrollTop=0}return true}
  if(d.ccat){ecust.cat=d.ccat;keepTop(renderCust);return true}
  if(d.ctype){ecust.type=d.ctype;if(["8–10","10–12","30","20"].includes(ecust.reps))ecust.reps=d.ctype==="s"?"30":d.ctype==="m"?"20":"10–12";keepTop(renderCust);return true}
  if(d.cgear){const i=ecust.need.indexOf(d.cgear);if(i>=0)ecust.need.splice(i,1);else ecust.need.push(d.cgear);keepTop(renderCust);return true}
  if(b.id==="csave"||b.id==="coff"){const c=ecust;c.name=c.name.trim();if(!c.name){$('[data-cf="name"]').focus();toast("Bitte einen Namen eingeben");return true}if(b.id==="coff")c.off=!c.off;
    c.reps=c.reps.trim()||"10";c.how=c.how.map(x=>x.trim()).filter(Boolean);if(!c.id){c.id=uid("cx");custom.push(c)}else custom=custom.map(x=>x.id===c.id?c:x);regCust(c);saveCust();closeSheet();toast(b.id==="coff"?(c.off?"Ausgeblendet":"Wieder eingeblendet"):"Übung gespeichert");return true}
  if(b.id==="gcopy"){const t=kiPrompt();(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>{gen.aimsg="Text kopiert. Füge ihn in deine KI ein.";toast("Text kopiert");if(sheetMode==="gen")keepTop(renderGen)},()=>{gen.show=t;gen.aimsg="Bitte den Text oben antippen, alles auswählen und kopieren.";keepTop(renderGen)});return true}
  if(b.id==="guse"){kiUse();return true}
  return false;
}
function readRun(){erun.ts=atDay($("#rdate").value,erun.ts);erun.km=Math.min(500,Math.max(0,num($("#rkm").value)));erun.sec=Math.min(360000,parseDur($("#rdur").value));erun.note=$("#rnote").value.trim()}
function xInput(i){const d=i.dataset;
  if(i.id==="gans"){gen.ans=i.value;return true}
  if(i.id==="plw"){platesW=i.value.replace(",",".");$("#plres").innerHTML=platesRes();return true}
  if(i.id==="bkfile"||i.id==="runfile"){return true}
  if(sheetMode==="log"&&elog&&!$("#sheet").hidden){if(d.le){elog.entries[d.le][+d.li][d.lf]=i.value.trim().replace(",",".");return true}if(i.id==="lnote"){elog.note=i.value.trim();return true}if(i.id==="ldate"){elog.ts=atDay(i.value,elog.ts);return true}}
  if(d.cf&&ecust){if(d.cf==="how")ecust.how=i.value.split("\n");else if(d.cf==="rest"){const v=parseInt(i.value,10);ecust.rest=v>=0&&v<=600?v:60}else ecust[d.cf]=i.value;return true}
  return false}
document.addEventListener("change",ev=>{const t=ev.target;if(t.id==="bkfile"&&t.files[0])pickFile(t.files[0]);if(t.id==="runfile"&&t.files.length){importRuns(t.files);t.value=""}});

/* ---------- boot ---------- */
const APPV="1.2";
let updW=null;
(function boot(){
  const d=load("tk3",null);if(d){activeId=d.activeId||null;mode=d.mode||null;planId=d.planId||null;draft=d.draft||{};order=d.order||{};swaps=d.swaps||{};
    /* Tausch und Reihenfolge gelten nur heute, außer das Training ist noch offen */
    if(d.day!==dayKey(Date.now())){const openPl=new Set(Object.entries(draft).filter(([k,s])=>s.some(filled)).map(([k])=>k.split(":").slice(0,2).join(":")));
      for(const o of [swaps,order])for(const k of Object.keys(o))if(!openPl.has(k.split(":").slice(0,2).join(":")))delete o[k]}}
  set=Object.assign(set,load("tk3-set",{}));
  custom=load("tk3-cust",[]);custom.forEach(regCust);
  allLogs=load("tk3-logs",[]);runs=load("tk3-runs",[]);
  const pd=load("tk3-prof",null);profiles=pd&&Array.isArray(pd.profiles)?pd.profiles:[];
  renderTop();
  if(!profiles.length){sheetMode="who";showSheet();renderWho()}else{ensureSel();persist();renderAll();renderRemind()}
  const te=load("tk3-rest",0);if(te>Date.now()){tEnd=te;showTimer()}
  if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent),app=navigator.standalone||matchMedia("(display-mode: standalone)").matches;
  let no=null;try{no=sessionStorage.getItem("tk3-noinst")}catch(e){}
  if(ios&&!app&&!no){$("#install").hidden=false;const w=$("#sheet .wrap");if(w&&!profiles.length)w.insertAdjacentHTML("afterbegin",`<div class="msg">${$("#install").innerHTML.replace(/<div class="row2">.*<\/div>/,"")}</div>`)}
  if("serviceWorker" in navigator&&(location.protocol==="https:"||location.search.includes("sw"))){
    const had=!!navigator.serviceWorker.controller;let rel=false;
    const offer=w=>{if(w&&navigator.serviceWorker.controller){updW=w;$("#update").hidden=false}};
    navigator.serviceWorker.register("sw.js").then(r=>{offer(r.waiting);r.addEventListener("updatefound",()=>{const w=r.installing;w&&w.addEventListener("statechange",()=>{if(w.state==="installed")offer(w)})});
      document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")r.update().catch(()=>{})})}).catch(()=>{});
    navigator.serviceWorker.addEventListener("controllerchange",()=>{if(had&&!rel){rel=true;persist();location.reload()}});
  }
})();
}
