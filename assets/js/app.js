/* =====================================================================
   Základy kresby – hlavní skript
   Záložky (etapy), navigace, galerie s lightboxem, videa, kvízy,
   krokované animace konstrukce, šipka nahoru, pozadí.
   Bez knihoven, funguje na GitHub Pages.
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const PORADI = ["uvod","perspektiva","rotacni-telesa","stinovani","draperie","zatisi","ruce","portret","lebka","figura","volna-temata"];
const NAZVY = {"uvod":"Úvod","perspektiva":"Perspektiva","rotacni-telesa":"Rotační tělesa","stinovani":"Stínování","draperie":"Draperie","zatisi":"Zátiší a kompozice","ruce":"Ruce","portret":"Portrét","lebka":"Lebka","figura":"Figura","volna-temata":"Volná témata","videa":"Videotutoriály"};
const ZAKLADNI_TITULEK = "Základy kresby – Grafická tvorba, 1. ročník";
const hotovo = new Set();   // panely, které už byly inicializovány

/* ---------- Přepínání záložek ---------- */
function ukazPanel(id, cil){
  const panel = document.getElementById(id);
  if (!panel || !panel.classList.contains("panel")) return;
  const uz = panel.classList.contains("on");
  $$(".panel.on").forEach(p => { if (p !== panel) p.classList.remove("on"); });
  panel.classList.add("on");
  $$(".main-nav a[data-tab]").forEach(a => a.classList.toggle("active", a.dataset.tab === id));
  // horní lišta
  const info = $("#etapaInfo");
  if (panel.dataset.etapa) info.innerHTML = `<b>ETAPA ${panel.dataset.etapa} / 9</b><span>${panel.dataset.nazev}</span>`;
  else if (id === "uvod") info.innerHTML = `<b>1. ROČNÍK</b><span>Grafická tvorba</span>`;
  else info.innerHTML = `<b>${id === "videa" ? "PŘEHLED" : "NAD RÁMEC"}</b><span>${panel.dataset.nazev}</span>`;
  document.title = id === "uvod" ? ZAKLADNI_TITULEK : `${NAZVY[id] || panel.dataset.nazev} | ${ZAKLADNI_TITULEK}`;
  if (!hotovo.has(id)){ hotovo.add(id); priprav(panel); }
  document.dispatchEvent(new CustomEvent("panel:show", {detail: id}));
  if (cil){ requestAnimationFrame(() => cil.scrollIntoView({behavior: uz && !reduceMotion ? "smooth" : "instant", block: "start"})); }
  else if (!uz) window.scrollTo({top: 0, behavior: "instant"});
}
function zpracujHash(){
  const h = decodeURIComponent(location.hash.slice(1)) || "uvod";
  const el = document.getElementById(h);
  if (!el){ ukazPanel("uvod"); return; }
  if (el.classList.contains("panel")) ukazPanel(h);
  else { const p = el.closest(".panel"); if (p) ukazPanel(p.id, el); }
}
addEventListener("hashchange", zpracujHash);

/* ---------- Příprava obsahu panelu (galerie, videa, kvízy, animace) ---------- */
function priprav(panel){
  $$("[data-gallery]", panel).forEach(vykresliGalerii);
  $$("[data-videos]", panel).forEach(el => vykresliVidea(el, el.dataset.videos));
  $$("[data-quiz]", panel).forEach(vykresliKviz);
  $$("[data-konstrukce]", panel).forEach(prehravac);
  $$("[data-pager]", panel).forEach(el => vykresliPager(el, panel.id));
  if (panel.id === "videa") vykresliVsechnaVidea();
}

/* ---------- Galerie + lightbox ---------- */
const kategorieVolna = src => /\/uhel-/.test(src) ? "uhel" : /(skica-|detail-stromu)/.test(src) ? "krajina" : "zvirata";
function vykresliGalerii(el){
  const data = (window.GALERIE || {})[el.dataset.gallery] || [];
  el.innerHTML = data.map((g, i) => `<button type="button" data-i="${i}" data-kat="${el.dataset.gallery === "volna-temata" ? kategorieVolna(g.src) : ""}"><img src="${g.thumb}" alt="${g.cap}" width="${g.tw}" height="${g.th}" loading="lazy" decoding="async"><span>${g.cap}</span></button>`).join("");
  el.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const viditelne = $$("button", el).filter(x => x.style.display !== "none");
    lightbox.otevri(viditelne.map(x => data[+x.dataset.i]), viditelne.indexOf(b));
  });
}
const lightbox = (() => {
  const box = $("#lightbox"), img = $("#lb-img"), cap = $("#lb-cap");
  let seznam = [], i = 0, posledniFokus = null;
  function ukaz(){ const g = seznam[i]; img.src = g.src; img.alt = g.cap; cap.innerHTML = `${g.cap}<small>${i + 1} / ${seznam.length}</small>`; }
  function otevri(s, k){ seznam = s; i = Math.max(0, k); posledniFokus = document.activeElement; ukaz(); box.classList.add("open"); document.body.style.overflow = "hidden"; $(".lb-close", box).focus(); }
  function zavri(){ box.classList.remove("open"); document.body.style.overflow = ""; img.removeAttribute("src"); if (posledniFokus) posledniFokus.focus(); }
  const dalsi = d => { i = (i + d + seznam.length) % seznam.length; ukaz(); };
  $(".lb-close", box).addEventListener("click", zavri);
  $(".lb-prev", box).addEventListener("click", () => dalsi(-1));
  $(".lb-next", box).addEventListener("click", () => dalsi(1));
  box.addEventListener("click", e => { if (e.target === box || e.target.tagName === "FIGURE") zavri(); });
  addEventListener("keydown", e => { if (!box.classList.contains("open")) return; if (e.key === "Escape") zavri(); if (e.key === "ArrowLeft") dalsi(-1); if (e.key === "ArrowRight") dalsi(1); });
  let sx = null; box.addEventListener("touchstart", e => sx = e.touches[0].clientX, {passive: true});
  box.addEventListener("touchend", e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) dalsi(dx < 0 ? 1 : -1); sx = null; });
  return {otevri};
})();
// filtr volných témat
(function(){
  const f = $("#volna-filtry"); if (!f) return;
  f.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$("button", f).forEach(x => x.setAttribute("aria-pressed", x === b));
    $$('[data-gallery="volna-temata"] button').forEach(x => x.style.display = (b.dataset.filter === "vse" || x.dataset.kat === b.dataset.filter) ? "" : "none");
  });
})();

/* ---------- Videa ---------- */
const PLAY = `<svg viewBox="0 0 68 48" aria-hidden="true"><path d="M66.5 7.7A8.5 8.5 0 0 0 60.5 1.7C55.2.3 34 .3 34 .3S12.8.3 7.5 1.7A8.5 8.5 0 0 0 1.5 7.7C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z" fill="#B4532A"/><path d="M27 34.3 45 24 27 13.7z" fill="#fff"/></svg>`;
function kartaVidea(v){
  return `<article class="video"><button class="play" type="button" data-yt="${v.id}" style="background-image:url('https://i.ytimg.com/vi/${v.id}/hqdefault.jpg')" aria-label="Přehrát video: ${v.t.replace(/"/g, "&quot;")}">${PLAY}</button>
  <div class="v-body"><h4>${v.cz}</h4><p>${v.t}</p><div class="v-meta"><span>${v.ch}</span><a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">YouTube ↗</a></div></div></article>`;
}
function vykresliVidea(el, klic){ el.innerHTML = ((window.VIDEA || {})[klic] || []).map(kartaVidea).join(""); }
document.addEventListener("click", e => {
  const b = e.target.closest("button.play[data-yt]"); if (!b) return;
  const f = document.createElement("iframe");
  f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0&cc_load_policy=1`;
  f.title = b.getAttribute("aria-label"); f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"; f.allowFullscreen = true;
  b.replaceWith(f);
});
function vykresliVsechnaVidea(){
  const box = $("#videa-vse"), filtry = $("#video-filtry");
  const klice = PORADI.filter(k => (window.VIDEA || {})[k]);
  const pocet = klice.reduce((s, k) => s + VIDEA[k].length, 0);
  filtry.innerHTML = `<button type="button" data-vf="vse" aria-pressed="true">Vše (${pocet})</button>` + klice.map(k => `<button type="button" data-vf="${k}" aria-pressed="false">${NAZVY[k]} (${VIDEA[k].length})</button>`).join("");
  box.innerHTML = klice.map(k => `<div class="v-group" data-vg="${k}"><h3>${NAZVY[k]} <a href="#${k}">přejít na etapu →</a></h3><div class="videos">${VIDEA[k].map(kartaVidea).join("")}</div></div>`).join("");
  filtry.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$("button", filtry).forEach(x => x.setAttribute("aria-pressed", x === b));
    $$(".v-group", box).forEach(g => g.style.display = (b.dataset.vf === "vse" || g.dataset.vg === b.dataset.vf) ? "" : "none");
  });
}

/* ---------- Kvíz ---------- */
function vykresliKviz(el){
  const data = (window.KVIZY || {})[el.dataset.quiz] || [];
  let ok = 0, hotovych = 0;
  el.innerHTML = data.map((k, i) => `<div class="q" data-i="${i}"><p>${i + 1}. ${k.q}</p><div class="opts">${k.o.map((o, j) => `<button type="button" data-j="${j}">${o}</button>`).join("")}</div><p class="why">${k.w}</p></div>`).join("") + `<p class="score" aria-live="polite"></p>`;
  el.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const q = b.closest(".q"); if (q.classList.contains("done")) return;
    const k = data[+q.dataset.i]; q.classList.add("done"); hotovych++;
    if (+b.dataset.j === k.a){ b.classList.add("ok"); ok++; } else { b.classList.add("bad"); $(`[data-j="${k.a}"]`, q).classList.add("ok"); }
    $(".score", el).textContent = hotovych < data.length ? `Správně ${ok} z ${hotovych}` : (ok === data.length ? `Výborně – ${ok} z ${data.length}!` : `Hotovo: ${ok} z ${data.length}. Projděte si vysvětlení u chybných odpovědí.`);
  });
}

/* ---------- Navigace mezi etapami ---------- */
function vykresliPager(el, id){
  const i = PORADI.indexOf(id); if (i < 0) return;
  const pred = PORADI[i - 1], dal = PORADI[i + 1];
  el.innerHTML = (pred ? `<a class="prev" href="#${pred}"><small>← Předchozí</small><b>${NAZVY[pred]}</b></a>` : `<span></span>`) +
                 (dal ? `<a class="next" href="#${dal}"><small>Další etapa →</small><b>${NAZVY[dal]}</b></a>` : "");
}

/* ---------- Krokovaná animace konstrukce ---------- */
const IKONY = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5"/></svg>'
};
function prehravac(root){
  const kroky = $$("ol li", root), skupiny = $$("svg [data-k]", root), ctrl = $(".k-ctrl", root);
  const N = kroky.length; let cur = 0, timer = null;
  ctrl.innerHTML = `<button type="button" data-a="play">${IKONY.play}<span>Přehrát</span></button><button type="button" data-a="prev" aria-label="Předchozí krok">${IKONY.prev}</button><button type="button" data-a="next" aria-label="Další krok">${IKONY.next}</button><button type="button" data-a="reset" aria-label="Znovu od začátku">${IKONY.reset}</button>`;
  const btnPlay = $('[data-a="play"]', ctrl);
  skupiny.forEach(g => g.classList.add("k-hid"));
  function kresli(g){
    g.classList.remove("k-hid");
    if (reduceMotion) return;
    $$("path,line,ellipse,circle,polyline,rect", g).forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.stroke === "none" || !el.getTotalLength) return;
      if (cs.strokeDasharray && cs.strokeDasharray !== "none") return;      // čárkované jen prolínáme
      let L = 0; try { L = el.getTotalLength(); } catch(_) { return; }
      if (!L) return;
      el.style.transition = "none"; el.style.strokeDasharray = L; el.style.strokeDashoffset = L;
      el.getBoundingClientRect();
      el.style.transition = "stroke-dashoffset 1.1s ease-in-out"; el.style.strokeDashoffset = 0;
      setTimeout(() => { el.style.transition = ""; el.style.strokeDasharray = ""; el.style.strokeDashoffset = ""; }, 1200);
    });
  }
  function nastav(k, animuj){
    const pred = cur; cur = Math.max(0, Math.min(N, k));
    skupiny.forEach(g => {
      const n = +g.dataset.k;
      if (n <= cur){ if (n > pred && animuj) kresli(g); else g.classList.remove("k-hid"); }
      else g.classList.add("k-hid");
    });
    kroky.forEach((li, i) => { li.classList.toggle("done", i < cur - 1); li.classList.toggle("cur", i === cur - 1); });
  }
  function stop(){ clearInterval(timer); timer = null; btnPlay.innerHTML = IKONY.play + "<span>Přehrát</span>"; }
  function play(){
    if (cur >= N) nastav(0, false);
    btnPlay.innerHTML = IKONY.pause + "<span>Pauza</span>";
    nastav(cur + 1, true);
    timer = setInterval(() => { if (cur >= N) { stop(); return; } nastav(cur + 1, true); }, 1900);
  }
  ctrl.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const a = b.dataset.a;
    if (a === "play") { timer ? stop() : play(); return; }
    stop();
    if (a === "prev") nastav(cur - 1, false);
    if (a === "next") nastav(cur + 1, true);
    if (a === "reset") { nastav(0, false); play(); }
  });
  kroky.forEach((li, i) => { li.tabIndex = 0; const go = () => { stop(); nastav(i + 1, i + 1 > cur); }; li.addEventListener("click", go); li.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }); });
  // automatické spuštění při prvním zobrazení
  if (reduceMotion) { nastav(N, false); return; }
  const io = new IntersectionObserver(en => { if (en[0].isIntersecting){ io.disconnect(); play(); } }, {threshold: .35});
  io.observe(root);
}

/* ---------- Drobnosti: menu, průběh, šipka nahoru, zjevování ---------- */
(function ui(){
  const tg = $(".nav-toggle"), nav = $("#menu");
  tg.addEventListener("click", () => { const o = nav.classList.toggle("open"); tg.setAttribute("aria-expanded", o); });
  nav.addEventListener("click", e => { if (e.target.closest("a")) { nav.classList.remove("open"); tg.setAttribute("aria-expanded", false); } });
  addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("open")) { nav.classList.remove("open"); tg.setAttribute("aria-expanded", false); tg.focus(); } });
  $("#rok").textContent = new Date().getFullYear();
  const pr = $("#progress"), top = $("#totop"), ring = $("#totop .ring circle");
  function naScroll(){
    const h = document.documentElement, f = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    pr.style.width = (f * 100) + "%";
    top.classList.toggle("show", h.scrollTop > 480);
    ring.style.strokeDashoffset = 157 * (1 - f);
  }
  addEventListener("scroll", naScroll, {passive: true});
  top.addEventListener("click", () => window.scrollTo({top: 0, behavior: reduceMotion ? "auto" : "smooth"}));
  const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting){ x.target.classList.add("in"); io.unobserve(x.target); } }), {rootMargin: "0px 0px -6% 0px", threshold: .06});
  $$(".reveal").forEach(el => io.observe(el));
  naScroll();
  // první zobrazení až po načtení všech skriptů (interaktivní ukázky se registrují později)
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", zpracujHash); else setTimeout(zpracujHash, 0);
})();

/* ---------- Pozadí: jemné úběžnice, které sledují kurzor ---------- */
(function pozadi(){
  const cv = $("#bg"), ctx = cv.getContext("2d");
  let W, H, vx, vy, tx, ty, raf = null;
  function velikost(){
    const dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (vx === undefined){ vx = tx = W * .62; vy = ty = H * .36; }
    kresli();
  }
  function kresli(){
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(35,39,45,.055)";
    ctx.beginPath();
    const krok = 70;
    for (let x = -krok; x <= W + krok; x += krok){ ctx.moveTo(vx, vy); ctx.lineTo(x, H + 10); }
    for (let y = vy + krok; y <= H; y += krok * 1.4){ ctx.moveTo(vx, vy); ctx.lineTo(-10, y); ctx.moveTo(vx, vy); ctx.lineTo(W + 10, y); }
    ctx.stroke();
    ctx.strokeStyle = "rgba(180,83,42,.12)"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, vy); ctx.lineTo(W, vy); ctx.stroke();
    ctx.fillStyle = "rgba(180,83,42,.22)"; ctx.beginPath(); ctx.arc(vx, vy, 3, 0, 7); ctx.fill();
  }
  function smycka(){
    vx += (tx - vx) * .06; vy += (ty - vy) * .06; kresli();
    raf = (Math.abs(tx - vx) + Math.abs(ty - vy) > .5) ? requestAnimationFrame(smycka) : null;
  }
  velikost();
  let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(velikost, 150); });
  if (reduceMotion) return;
  addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    tx = W * .5 + (e.clientX - W * .5) * .35; ty = H * .32 + (e.clientY - H * .5) * .18;
    if (!raf) raf = requestAnimationFrame(smycka);
  }, {passive: true});
})();
