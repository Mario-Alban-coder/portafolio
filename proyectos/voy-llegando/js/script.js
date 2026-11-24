// Episodio interactivo «Voy llegando»: reproductor por rutas, transcripción, diccionario, votos y muro.
{
const LINES = window.TRANSCRIPCION;
const DICT = [
 ["pal mundial qué","¿Para cuándo? Como si fuera a llegar para el próximo Mundial.","Vanessa"],
 ["métele nitro","Apúrate, acelera.","Vanessa"],
 ["mamamos la espera","De «mamarse la espera»: aguantarse la espera hasta cansarse.","Vanessa"],
 ["voy saliendo","Según Juanda: que apenas se está bañando.","Juanda"],
 ["tanqueando","Echándole gasolina a la moto o al carro. O sea, todavía falta.","Juanda"],
 ["ya te vi","Excusa para ganar tiempo: todavía no ha visto a nadie.","David"],
 ["jerda","Expresión de fastidio o sorpresa, como «uy, ya es mucho».","Jasis"],
 ["pinto","Un tipo, un man.","Juanda"],
 ["relaja","Relajado, tranquilo.","Juanda"],
 ["echar cuento","Contar historias para hacer reír a la gente.","Jesús"],
 ["parche","El plan con los amigos, o el grupo de amigos.","Jesús"],
 ["man","Un tipo, una persona.","Jasis"],
 ["nomás","Nada más, solamente.","Jesús"],
 ["mira ve","Para llamar la atención: oye, mira.","Uso Carruso"],
 ["mamado cacho","Que le han sido infiel.","Uso Carruso"],
 ["amortiguá el golpe","Suavizar la noticia para que no duela tanto.","Gabriela"]
];
const PARTS = {
 inicio:{name:"Inicio",s:0,e:63.0,blocks:[[0,"Entrada","La opinión de Gabriela"],[28.6,"Presentación","Jesús y Vanessa"]]},
 espera:{name:"Ruta 1 · El que espera",s:63.0,e:286.0,blocks:[[63.0,"Jasis","Cuánto es normal esperar"],[116.5,"Jesús","¿En qué momento empezamos?"],[148.1,"Andrés","Depende de la persona"],[169.6,"Jesús","Situaciones cotidianas"],[210.3,"Silvana","Casi dos horas esperando"],[259.3,"Abril","Las amigas impuntuales"]]},
 hace:{name:"Ruta 2 · El que hace esperar",s:286.0,e:431.0,blocks:[[286.0,"Vanessa","Expresiones costeñas"],[313.6,"David","Máximo una hora"],[341.5,"Juanda","Los 15 minutos de gracia"],[398.8,"Jesús y Vanessa","Cuando nos espera alguien que nos gusta"]]},
 cierre:{name:"Final",s:431.0,e:517.95,blocks:[[431.0,"Uso Carruso","Un cuento sobre las salidas"],[503.6,"Jesús","Créditos y despedida"]]}
};
const EXC = ["Ya casi…","Estoy tanqueando…","Ya te vi…","Voy saliendo… digo, llegando","Pidiendo el mototaxi…","Echándome perfume…","Estoy a dos cuadras…","Dame cinco minutos…"];
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = t => { t = Math.max(0, Math.round(t)); return Math.floor(t/60) + ":" + String(t%60).padStart(2,"0"); };
const au = $("#au");
const ME = ["Jesús","Vanessa"];
const st = { mode:"rutas", part:null, seq:[], heard:new Set(), routes:[], antes:null, despues:null, uid:null, waiting:false, presses:0 };
let db = null, user = null, owner = false, votosAll = [], muroAll = [];
const store = { get(k){ try { return JSON.parse(localStorage.getItem("vl_"+k)); } catch(e) { return null; } }, set(k,v){ try { localStorage.setItem("vl_"+k, JSON.stringify(v)); } catch(e) {} } };

/* -------- audio: se carga entero como blob para poder saltar entre partes -------- */
let audioReady = null;
function loadAudio(){
  if (!audioReady) audioReady = fetch("audio/voy-llegando-cap1.mp3").then(r => { if (!r.ok) throw 0; return r.blob(); })
    .then(b => { au.src = URL.createObjectURL(b); return new Promise(res => { if (au.readyState >= 1) res(); else au.addEventListener("loadedmetadata", res, { once:true }); }); })
    .catch(() => { au.src = "audio/voy-llegando-cap1.mp3"; return new Promise(res => au.addEventListener("loadedmetadata", res, { once:true })); });
  return audioReady;
}
loadAudio();
/* -------- diccionario en el texto -------- */
const dictRe = new RegExp("(" + DICT.map(d => d[0]).sort((a,b) => b.length - a.length).map(w => w.replace(/[.*+?^${}()|[\]\\']/g,"\\$&")).join("|") + ")(?![a-záéíóúñ])", "gi");
function withDict(text){
  let out = "", last = 0, m;
  dictRe.lastIndex = 0;
  while ((m = dictRe.exec(text))) {
    const prev = text[m.index-1];
    if (prev && /[a-záéíóúñ]/i.test(prev)) continue;
    const i = DICT.findIndex(d => d[0].toLowerCase() === m[0].toLowerCase());
    out += esc(text.slice(last, m.index)) + '<button class="w" data-d="' + i + '">' + esc(m[0]) + '</button>';
    last = m.index + m[0].length;
  }
  return out + esc(text.slice(last));
}
const pop = $("#pop");
function showDef(btn){
  const d = DICT[+btn.dataset.d];
  pop.innerHTML = "<b>" + esc(d[0]) + ":</b> " + esc(d[1]) + '<span class="who2">Lo dice ' + esc(d[2]) + "</span>";
  pop.classList.remove("hide");
  const r = btn.getBoundingClientRect(), w = Math.min(290, innerWidth - 24);
  pop.style.left = Math.max(12, Math.min(r.left, innerWidth - w - 12)) + "px";
  const below = r.bottom + 8 + pop.offsetHeight < innerHeight;
  pop.style.top = (below ? r.bottom + 8 : r.top - pop.offsetHeight - 8) + "px";
}
document.addEventListener("click", e => {
  const w = e.target.closest(".w");
  if (w) { e.stopPropagation(); showDef(w); return; }
  pop.classList.add("hide");
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape") pop.classList.add("hide"); });
addEventListener("scroll", () => pop.classList.add("hide"), { passive:true });

/* -------- vistas -------- */
function view(id){
  for (const s of ["intro","player","choose","final"]) $("#"+s).classList.toggle("hide", s !== id);
  scrollTo({ top:0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

/* -------- partes y transcripción -------- */
function renderPart(){
  const P = PARTS[st.part];
  $("#partName").textContent = P.name;
  $("#parts").innerHTML = P.blocks.map((b,i) => '<li><button data-b="' + i + '"><b>' + esc(b[1]) + '</b> ' + esc(b[2]) + '<span>' + fmt(b[0] - P.s) + '</span></button></li>').join("");
  const ls = LINES.map((l,i) => [l,i]).filter(([l]) => l.t >= P.s - 0.3 && l.t < P.e);
  $("#chat").innerHTML = ls.map(([l,i]) => '<div class="msg' + (ME.includes(l.w) ? " me" : "") + '" data-i="' + i + '"><small>' + esc(l.w) + "</small>" + withDict(l.x) + "</div>").join("");
  $("#chat").scrollTop = 0;
  lastLine = -1; lastBlock = -1;
}
let lastLine = -1, lastBlock = -1;
function tick(){
  if (!st.part) return;
  const P = PARTS[st.part], t = au.currentTime;
  if (t >= P.e - 0.05 && !au.paused) { au.pause(); partEnd(); return; }
  const pct = Math.min(100, Math.max(0, (t - P.s) / (P.e - P.s) * 100));
  $("#fill").style.width = pct + "%";
  $("#seek").setAttribute("aria-valuenow", Math.round(pct));
  $("#tNow").textContent = fmt(t - P.s); $("#tEnd").textContent = fmt(P.e - P.s);
  let bi = 0; P.blocks.forEach((b,i) => { if (t >= b[0] - 0.05) bi = i; });
  if (bi !== lastBlock) {
    lastBlock = bi;
    document.querySelectorAll("#parts button").forEach((b,i) => b.classList.toggle("on", i === bi));
    $("#blk").textContent = P.blocks[bi][2];
  }
  let li = -1; LINES.forEach((l,i) => { if (t >= l.t && t < l.e + 0.35 && l.t >= P.s - 0.3 && l.t < P.e) li = i; });
  if (li !== lastLine && li >= 0) {
    lastLine = li;
    $("#who").textContent = LINES[li].w;
    const chat = $("#chat");
    chat.querySelectorAll(".msg").forEach(m => { const i = +m.dataset.i; m.classList.toggle("on", i === li); m.classList.toggle("past", i < li); });
    const m = chat.querySelector('[data-i="' + li + '"]');
    if (m) chat.scrollTop = m.offsetTop - chat.clientHeight / 2 + m.offsetHeight / 2;
    if (!st.heard.has(li)) {
      st.heard.add(li);
      const n = (LINES[li].x.toLowerCase().match(/voy llegando/g) || []).length;
      if (n) { setCount(true); }
    }
  }
}
function setCount(anim){
  let c = 0; st.heard.forEach(i => { c += (LINES[i].x.toLowerCase().match(/voy llegando/g) || []).length; });
  $("#cNum").textContent = c;
  if (anim) { const el = $("#count"); el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
}
au.addEventListener("timeupdate", tick);
au.addEventListener("ended", () => { if (st.part && !st.waiting) partEnd(); });
setInterval(() => { if (!au.paused) tick(); }, 200);
au.addEventListener("play", setIcon); au.addEventListener("pause", setIcon);
function setIcon(){
  $("#ppIcon").innerHTML = au.paused ? '<path d="M7 4l13 8-13 8z"/>' : '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>';
  $("#pp").setAttribute("aria-label", au.paused ? "Reproducir" : "Pausar");
}
function playPart(key, at){
  st.part = key; renderPart(); view("player");
  const P = PARTS[key];
  const go = () => { au.currentTime = at ?? P.s; au.play().catch(() => setIcon()); tick(); };
  if (au.readyState >= 1) go(); else { $("#blk").textContent = "Cargando el audio…"; au.play().catch(() => {}); loadAudio().then(go); }
}
function partEnd(){
  const k = st.part;
  if (st.mode === "corrido") {
    const order = ["inicio","espera","hace","cierre"], n = order[order.indexOf(k) + 1];
    return n ? playPart(n) : toFinal();
  }
  if (k === "inicio") return showChoose(false);
  if (k === "cierre") return toFinal();
  if (!st.routes.includes(k)) st.routes.push(k);
  const other = k === "espera" ? "hace" : "espera";
  if (!st.routes.includes(other)) return showChoose(true);
  playPart("cierre");
}
function showChoose(after){
  view("choose");
  $("#chooseTitle").textContent = after ? "¿Quieres oír el otro lado?" : "¿De qué lado lo quieres oír?";
  $("#chooseLead").textContent = after ? "Ya escuchaste una cara del «voy llegando». Te falta la otra." : "Todos hemos sido los dos. Escoge uno; al terminar puedes oír el otro.";
  document.querySelectorAll(".route").forEach(r => r.classList.toggle("hide", st.routes.includes(r.dataset.r)));
  $("#toEnd").classList.toggle("hide", !after);
}

/* -------- el botón que se queda pegado -------- */
function voyLlegando(then){
  if (st.waiting) return;
  st.waiting = true; st.presses++;
  const w = $("#wait"), f = $("#wFill"), msg = $("#wMsg"), pct = $("#wPct");
  const stall = st.presses === 1 || Math.random() < 0.5;
  w.classList.remove("hide"); f.style.width = "0%"; msg.textContent = "Voy llegando…"; pct.textContent = "0 %";
  requestAnimationFrame(() => requestAnimationFrame(() => { f.style.width = "90%"; }));
  let n = 0;
  const steps = [];
  setTimeout(() => { pct.textContent = "90 %"; }, 700);
  if (stall) {
    const pick = EXC.slice().sort(() => Math.random() - .5).slice(0,3);
    pick.forEach((e,i) => steps.push(setTimeout(() => { msg.textContent = e; }, 900 + i * 850)));
  }
  const total = stall ? 900 + 3 * 850 : 900;
  setTimeout(() => { f.style.width = "100%"; pct.textContent = "100 %"; msg.textContent = "¡Llegué!"; }, total);
  setTimeout(() => { w.classList.add("hide"); st.waiting = false; then(); }, total + 650);
}
$("#next").addEventListener("click", () => {
  const P = PARTS[st.part], t = au.currentTime;
  const nb = P.blocks.find(b => b[0] > t + 0.5);
  voyLlegando(() => {
    if (nb) { au.currentTime = nb[0]; if (au.paused) au.play().catch(() => {}); tick(); }
    else { au.pause(); partEnd(); }
  });
});
$("#pp").addEventListener("click", () => { if (au.paused) { if (au.currentTime >= PARTS[st.part].e - .1) au.currentTime = PARTS[st.part].s; au.play().catch(() => {}); } else au.pause(); });
$("#back").addEventListener("click", () => { au.currentTime = Math.max(PARTS[st.part].s, au.currentTime - 10); tick(); });
function seekTo(clientX){
  const r = $("#seek").getBoundingClientRect(), P = PARTS[st.part];
  au.currentTime = P.s + Math.min(.999, Math.max(0, (clientX - r.left) / r.width)) * (P.e - P.s); tick();
}
$("#seek").addEventListener("click", e => seekTo(e.clientX));
$("#seek").addEventListener("keydown", e => {
  if (e.key === "ArrowRight") au.currentTime = Math.min(PARTS[st.part].e - .2, au.currentTime + 5);
  else if (e.key === "ArrowLeft") au.currentTime = Math.max(PARTS[st.part].s, au.currentTime - 5);
  else return;
  e.preventDefault(); tick();
});
$("#parts").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; au.currentTime = PARTS[st.part].blocks[+b.dataset.b][0]; au.play().catch(() => {}); tick(); });
$("#chat").addEventListener("click", e => { if (e.target.closest(".w")) return; const m = e.target.closest(".msg"); if (!m) return; au.currentTime = LINES[+m.dataset.i].t; au.play().catch(() => {}); tick(); });
document.querySelectorAll(".route").forEach(r => r.addEventListener("click", () => { const k = r.dataset.r; if (!st.routes.includes(k)) { st.routes.push(k); saveVote(); } playPart(k); }));
$("#toEnd").addEventListener("click", () => playPart("cierre"));

/* -------- votos -------- */
const LABEL = { "mentira":"mentira", "costumbre":"costumbre", "las dos":"las dos cosas" };
$("#vote1").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  st.antes = b.dataset.v; store.set("antes", st.antes); saveVote();
  st.mode = "rutas"; playPart("inicio");
});
$("#corrido").addEventListener("click", () => { st.mode = "corrido"; playPart("inicio"); });
$("#vote2").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  st.despues = b.dataset.v; store.set("despues", st.despues);
  document.querySelectorAll("#vote2 button").forEach(x => x.setAttribute("aria-pressed", x === b));
  document.querySelectorAll("#vote2 button").forEach(x => x.classList.toggle("y", x === b));
  $("#changed").textContent = !st.antes ? "¡Listo, quedó tu voto!" : st.antes === st.despues ? "Sigues pensando lo mismo que al principio: " + LABEL[st.despues] + "." : "Cambiaste de opinión: antes decías " + LABEL[st.antes] + " y ahora " + LABEL[st.despues] + ".";
  saveVote(); renderRes();
});
function toFinal(){
  view("final");
  $("#before").textContent = st.antes ? "Al principio dijiste que era " + LABEL[st.antes] + ". Después de escuchar a todos, ¿sigues pensando igual?" : "Ya escuchaste a todos. ¿Qué crees?";
  renderRes(); renderWall();
}
$("#again").addEventListener("click", () => { st.routes = []; view("intro"); });

function saveVote(){ store.set("rutas", st.routes); }
const ENTREVISTA = [
 ["Gabriela","las dos","«Es que es mentira y es costumbre»"],
 ["Jasis","costumbre","«Yo diría que es más costumbre que mentira»"],
 ["Andrés","costumbre","«Es más bien una costumbre que se quedó instaurada»"]
];
function renderRes(){
  const rows = ENTREVISTA.map(e => '<div class="post cap"><div class="meta"><span class="who3">' + esc(e[0]) + '</span><span>' + esc(LABEL[e[1]]) + '</span></div>' + esc(e[2]) + '</div>');
  const tu = st.despues || st.antes;
  rows.unshift('<div class="post"><div class="meta"><span class="who3">Tú</span><span>' + (tu ? esc(LABEL[tu]) : "todavía no votas") + '</span></div>' +
    (st.antes && st.despues ? (st.antes === st.despues ? "Pensabas lo mismo antes de escuchar." : "Antes de escuchar decías " + esc(LABEL[st.antes]) + ".") : "Escoge una opción arriba.") + '</div>');
  $("#res").innerHTML = rows.join("");
  $("#resNote").textContent = "Así respondieron en el capítulo los entrevistados que dieron una respuesta directa.";
}

/* -------- muro -------- */
const DESTINO = "https://formsubmit.co/ajax/marjunioralban@gmail.com";
const DEL_CAPITULO = [
 ["Silvana","Se hicieron las 10:30, se hicieron las 11… Me quedé esperando casi dos horas a que se dignara aparecer."],
 ["Abril","Con mis amigas podían ser por lo bajo 2 horas o 1 hora de espera en mi casa a que llegaran."],
 ["Juanda","Ese «voy saliendo» de mi papá es que apenas se está bañando, y ese «voy llegando» es que apenas está tanqueando."],
 ["David","Ahí es cuando suelto todas: «voy llegando», «ya estoy llegando», «ya te vi»… y no lo he visto."]
];
let aprobadas = [];
fetch("datos/muro.json").then(r => r.ok ? r.json() : []).then(d => { aprobadas = Array.isArray(d) ? d : []; renderWall(); }).catch(() => {});
function renderWall(){
  const mia = store.get("mia");
  const html = [];
  if (mia && mia.texto) html.push('<div class="post"><div class="meta"><span>Tú' + (mia.lugar ? " · " + esc(mia.lugar) : "") + '</span><span>en revisión</span></div>' + esc(mia.texto) + '</div>');
  aprobadas.forEach(p => { if (p && p.texto) html.push('<div class="post"><div class="meta"><span>Anónimo' + (p.lugar ? " · " + esc(p.lugar) : "") + '</span></div>' + esc(p.texto) + '</div>'); });
  DEL_CAPITULO.forEach(p => html.push('<div class="post cap"><div class="meta"><span>' + esc(p[0]) + '</span><span>del capítulo</span></div>' + esc(p[1]) + '</div>'));
  $("#wall").innerHTML = html.join("");
}
$("#form").addEventListener("submit", async e => {
  e.preventDefault();
  if ($("#honey").value) return;
  const texto = $("#txt").value.trim().slice(0,280), lugar = $("#lugar").value.trim().slice(0,40);
  if (!texto) return;
  $("#send").disabled = true; $("#sendMsg").textContent = "Enviando…";
  try {
    const r = await fetch(DESTINO, { method:"POST", headers:{ "Content-Type":"application/json", Accept:"application/json" },
      body: JSON.stringify({ _subject:"Voy llegando · nueva historia para el muro", _template:"table", historia:texto, lugar:lugar || "(sin lugar)", voto_antes:st.antes || "-", voto_despues:st.despues || "-", rutas:st.routes.join(", ") || "-" }) });
    const d = await r.json();
    if (String(d.success) !== "true") throw new Error(d.message || "");
    store.set("mia", { texto, lugar }); store.set("borrador", "");
    $("#txt").value = ""; $("#lugar").value = "";
    $("#sendMsg").textContent = "¡Llegó! Tu historia aparece en el muro cuando la revisemos.";
    renderWall();
  } catch (err) {
    $("#sendMsg").textContent = "No se pudo enviar. Revisa tu conexión e inténtalo otra vez.";
  } finally { $("#send").disabled = false; }
});
$("#txt").addEventListener("input", () => store.set("borrador", $("#txt").value));
$("#txt").value = store.get("borrador") || "";

st.antes = store.get("antes"); st.despues = null; renderWall();
if (location.hash === "#final") toFinal();
}
