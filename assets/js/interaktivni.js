/* =====================================================================
   Základy kresby – interaktivní ukázky
   Každá ukázka se inicializuje až při prvním otevření své záložky.
   ===================================================================== */
(function(){
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const INK = "#23272D", SOFT = "#585E66", RED = "#B4532A", BLUE = "#3E8DB0", PAPER = "#F4F0E7";
const HAND = '600 17px Caveat, "Segoe Print", cursive';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rad = d => d * Math.PI / 180;
const cz = (n, d = 1) => n.toFixed(d).replace(".", ",");
const NA_PANEL = {};
function priPanelu(id, fn){ (NA_PANEL[id] = NA_PANEL[id] || []).push(fn); }
document.addEventListener("panel:show", e => {
  const fns = NA_PANEL[e.detail]; if (!fns) return;
  delete NA_PANEL[e.detail];
  requestAnimationFrame(() => fns.forEach(f => { try { f(); } catch (err) { console.error(err); } }));
});

/* Plátno s automatickou velikostí podle rodiče (ostré i na retina displejích) */
function platno(cv, kresli){
  const ctx = cv.getContext("2d");
  const o = {ctx, w: 0, h: 0, kresli: () => kresli(o)};
  cv.style.position = "absolute"; cv.style.inset = "0";
  function velikost(){
    const r = cv.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    o.w = Math.max(200, r.width); o.h = Math.max(200, r.height);
    cv.width = Math.round(o.w * dpr); cv.height = Math.round(o.h * dpr);
    cv.style.width = o.w + "px"; cv.style.height = o.h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    kresli(o);
  }
  new ResizeObserver(velikost).observe(cv.parentElement);
  velikost();
  return o;
}
/* Tažení ukazatelem (myš, prst, pero) */
function tahni(el, h){
  let aktivni = false;
  const bod = e => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  el.addEventListener("pointerdown", e => { aktivni = true; el.setPointerCapture(e.pointerId); const [x, y] = bod(e); h.down && h.down(x, y, e); e.preventDefault(); });
  el.addEventListener("pointermove", e => { const [x, y] = bod(e); if (aktivni) h.move && h.move(x, y, e); else h.hover && h.hover(x, y, e); });
  const konec = e => { if (!aktivni) return; aktivni = false; h.up && h.up(e); };
  el.addEventListener("pointerup", konec); el.addEventListener("pointercancel", konec);
}
function segment(_, attr, fn){
  const prvni = $(`[${attr}]`); const box = prvni && prvni.parentElement; if (!box) return;
  box.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || !b.hasAttribute(attr)) return;
    $$("button", box).forEach(x => x.setAttribute("aria-pressed", x === b));
    fn(b.getAttribute(attr), b);
  });
}
function popisek(ctx, x, y, text, barva = RED, zarovnani = "left"){
  ctx.save(); ctx.font = HAND; ctx.textAlign = zarovnani; ctx.textBaseline = "middle";
  ctx.lineWidth = 4; ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.strokeText(text, x, y);
  ctx.fillStyle = barva; ctx.fillText(text, x, y); ctx.restore();
}
function sipka(ctx, x1, y1, x2, y2, barva = RED){
  ctx.save(); ctx.strokeStyle = barva; ctx.fillStyle = barva; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 8 * Math.cos(a - .4), y2 - 8 * Math.sin(a - .4)); ctx.lineTo(x2 - 8 * Math.cos(a + .4), y2 - 8 * Math.sin(a + .4)); ctx.fill();
  ctx.restore();
}
const SVGNS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}, rodic){ const el = document.createElementNS(SVGNS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); if (rodic) rodic.appendChild(el); return el; }
function svgBod(svg, e){ const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
/* deterministický náhodný generátor (stejná šrafura při každém překreslení) */
function rng(seed){ let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

/* =====================================================================
   ÚVOD – tvrdost tužky a přítlak
   ===================================================================== */
priPanelu("uvod", () => {
  const cv = $("#cv-tuzky"); if (!cv) return;
  const r = $("#r-pritlak"), out = $("#o-pritlak");
  const TUZKY = [["4H", .2], ["2H", .28], ["HB", .42], ["2B", .55], ["4B", .68], ["6B", .8], ["8B", .9]];
  const p = platno(cv, o => {
    const {ctx, w, h} = o, tlak = +r.value;
    ctx.clearRect(0, 0, w, h);
    const n = TUZKY.length, gap = 10, sw = (w - 32 - gap * (n - 1)) / n, top = 18, vy = h - 62;
    TUZKY.forEach(([jm, tvrd], i) => {
      const x0 = 16 + i * (sw + gap), rand = rng(17 + i * 31);
      const sila = clamp(tvrd * (0.25 + 0.95 * tlak) * (0.75 + 0.35 * tvrd), 0, 0.95);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, top, sw, vy - top); ctx.clip();
      ctx.lineCap = "round";
      for (let k = -vy; k < sw + vy; k += 3.2){
        ctx.strokeStyle = `rgba(35,39,45,${sila * (0.55 + 0.45 * rand())})`;
        ctx.lineWidth = 0.6 + tvrd * 1.1 + rand() * .4;
        ctx.beginPath(); ctx.moveTo(x0 + k, vy + 2); ctx.lineTo(x0 + k + (vy - top) * .9 + rand() * 4, top - 2); ctx.stroke();
      }
      if (sila > .55){ // druhá vrstva u měkkých tužek
        for (let k = -vy; k < sw + vy; k += 4){ ctx.strokeStyle = `rgba(35,39,45,${(sila - .45) * .9})`; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(x0 + k, top - 2); ctx.lineTo(x0 + k + (vy - top) * .7, vy + 2); ctx.stroke(); }
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(35,39,45,.15)"; ctx.strokeRect(x0 + .5, top + .5, sw - 1, vy - top - 1);
      // tužka
      const py = vy + 14;
      ctx.fillStyle = i < 2 ? "#5B7C99" : i === 2 ? "#6C6F73" : "#2E3A48";
      ctx.fillRect(x0 + 4, py, sw - 20, 14);
      ctx.fillStyle = "#E7C9A0"; ctx.beginPath(); ctx.moveTo(x0 + sw - 16, py); ctx.lineTo(x0 + sw - 4, py + 7); ctx.lineTo(x0 + sw - 16, py + 14); ctx.fill();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x0 + sw - 8, py + 4.6); ctx.lineTo(x0 + sw - 4, py + 7); ctx.lineTo(x0 + sw - 8, py + 9.4); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "700 11px Barlow, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(jm, x0 + (sw - 16) / 2 + 4, py + 7.5);
    });
    ctx.fillStyle = SOFT; ctx.font = "600 12.5px Barlow, sans-serif"; ctx.textAlign = "left"; ctx.fillText("tvrdá · světlá", 16, h - 12); ctx.textAlign = "right"; ctx.fillText("měkká · tmavá", w - 16, h - 12);
  });
  r.addEventListener("input", () => { const t = +r.value; out.textContent = t < .38 ? "lehký" : t < .72 ? "střední" : "silný"; p.kresli(); });
});

/* =====================================================================
   1 PERSPEKTIVA – promítání kvádrů, horizont, úběžníky, půdorys
   ===================================================================== */
priPanelu("perspektiva", () => {
  const cv = $("#cv-persp"); if (!cv) return;
  const S = {rot: 35, eye: 2.4, f: 1, lines: true, hidden: true, more: false, bx: 0.2, bz: 5.2};
  const rRot = $("#r-rot"), rEye = $("#r-eye"), rFov = $("#r-fov"), ro = $("#persp-readout");
  const DALSI = [{x: -3.1, z: 9.5, w: 1.2, d: 1.2, h: 2.4}, {x: 3.2, z: 11, w: 2.2, d: 1, h: .8}];
  let G = null; // geometrie posledního snímku (pro tažení)

  function kvadr(x, z, w, d, h){
    const c = Math.cos(rad(S.rot)), s = Math.sin(rad(S.rot)), P = [];
    for (const yy of [0, h]) for (const [lx, lz] of [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]])
      P.push([x + lx * c - lz * s, yy, z + lx * s + lz * c]);
    return P; // 0-3 spodní, 4-7 horní
  }
  const STENY = [[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];
  const HRANY = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];

  const p = platno(cv, o => {
    const {ctx, w, h} = o;
    const F = Math.min(w, h * 1.7) * 0.5 * S.f, cx = w * 0.56;
    const cy = h * (0.86 - 0.74 * (S.eye - 0.1) / 3.9);
    const proj = ([x, y, z]) => [cx + F * x / z, cy - F * (y - S.eye) / z];
    G = {F, cx, cy};
    ctx.clearRect(0, 0, w, h);
    // obloha / země
    ctx.fillStyle = "#FBFAF6"; ctx.fillRect(0, 0, w, cy);
    const gr = ctx.createLinearGradient(0, cy, 0, h); gr.addColorStop(0, "#ECE7DC"); gr.addColorStop(1, "#E2DACB");
    ctx.fillStyle = gr; ctx.fillRect(0, cy, w, h - cy);
    // podlaha – mřížka dlaždic (hloubkové linie míří do středního úběžníku)
    ctx.save(); ctx.beginPath(); ctx.rect(0, cy, w, h - cy); ctx.clip();
    ctx.strokeStyle = "rgba(35,39,45,.09)"; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = -14; x <= 14; x += 1){ const a = proj([x, 0, 1.2]), b = proj([x, 0, 80]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    for (let z = 2; z <= 40; z += (z < 12 ? 1 : 2)){ const a = proj([-40, 0, z]), b = proj([40, 0, z]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    ctx.stroke(); ctx.restore();
    // horizont
    ctx.strokeStyle = BLUE; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    popisek(ctx, 14, cy - 14, `horizont = výška očí (${cz(S.eye)} m)`, BLUE);

    // úběžníky
    const c = Math.cos(rad(S.rot)), s = Math.sin(rad(S.rot));
    const VP = [];
    if (Math.abs(s) > 0.01) VP.push({x: cx + F * c / s, barva: BLUE, smer: [c, s]});
    if (Math.abs(c) > 0.01) VP.push({x: cx - F * s / c, barva: RED, smer: [-s, c]});
    const telesa = [{x: S.bx, z: S.bz, w: 1.4, d: 1.4, h: 1.4, hlavni: true}];
    if (S.more) DALSI.forEach(t => telesa.push(t));
    telesa.sort((a, b) => b.z - a.z);

    // úběžnice (pod tělesy, aby nepřekrývaly)
    if (S.lines){
      ctx.save(); ctx.setLineDash([5, 5]); ctx.lineWidth = 1;
      telesa.forEach(t => {
        const P = kvadr(t.x, t.z, t.w, t.d, t.h);
        VP.forEach(v => { ctx.strokeStyle = v.barva + "99"; P.forEach(pt => { const q = proj(pt); ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(v.x, cy); ctx.stroke(); }); });
      });
      ctx.restore();
    }
    // tělesa
    const L = [-0.55, 0.75, -0.4]; const nl = Math.hypot(...L); L.forEach((v, i) => L[i] = v / nl);
    telesa.forEach(t => {
      const P = kvadr(t.x, t.z, t.w, t.d, t.h), Q = P.map(proj);
      const vid = STENY.map(st => {
        const a = P[st[0]], b = P[st[1]], d = P[st[3]];
        const u = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], v = [d[0]-a[0], d[1]-a[1], d[2]-a[2]];
        let n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
        const st0 = [0,1,2].map(k => (P[st[0]][k] + P[st[2]][k]) / 2), tc = [t.x, t.h / 2, t.z];
        if ((st0[0]-tc[0])*n[0] + (st0[1]-tc[1])*n[1] + (st0[2]-tc[2])*n[2] < 0) n = n.map(q => -q);
        const ln = Math.hypot(...n); n = n.map(q => q / ln);
        const kOku = [0 - st0[0], S.eye - st0[1], 0 - st0[2]];
        return {st, n, vis: n[0]*kOku[0] + n[1]*kOku[1] + n[2]*kOku[2] > 1e-6};
      });
      // vržený stín
      ctx.fillStyle = "rgba(35,39,45,.16)"; ctx.beginPath();
      const sh = [P[0], P[1], P[2], P[3]].map(pt => proj([pt[0] + t.h * 0.9, 0, pt[2] + t.h * 0.5]));
      const zak = [0,1,2,3].map(i => Q[i]);
      [...zak, ...sh].sort((a, b) => a[0] - b[0]); // jednoduchý obal
      const hull = obal([...zak, ...sh]); hull.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill();
      vid.forEach(f => {
        if (!f.vis) return;
        const svit = Math.max(0, f.n[0]*L[0] + f.n[1]*L[1] + f.n[2]*L[2]);
        const g = Math.round(150 + 100 * svit);
        ctx.fillStyle = `rgb(${g},${g - 2},${g - 6})`;
        ctx.beginPath(); f.st.forEach((k, i) => i ? ctx.lineTo(Q[k][0], Q[k][1]) : ctx.moveTo(Q[k][0], Q[k][1])); ctx.closePath(); ctx.fill();
      });
      HRANY.forEach(([a, b]) => {
        const vis = vid.some(f => f.vis && f.st.includes(a) && f.st.includes(b));
        if (!vis && !S.hidden) return;
        ctx.save(); ctx.strokeStyle = vis ? INK : "rgba(35,39,45,.55)"; ctx.lineWidth = vis ? 2.2 : 1.1;
        if (!vis) ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(Q[a][0], Q[a][1]); ctx.lineTo(Q[b][0], Q[b][1]); ctx.stroke(); ctx.restore();
      });
      if (t.hlavni) G.main = Q;
    });
    // značky úběžníků
    VP.forEach((v, i) => {
      if (v.x > -4 && v.x < w + 4){
        ctx.fillStyle = v.barva; ctx.beginPath(); ctx.arc(v.x, cy, 6, 0, 7); ctx.fill();
        popisek(ctx, clamp(v.x, 60, w - 60), cy + 22, VP.length === 1 ? "úběžník" : `úběžník ${i + 1}`, v.barva, "center");
      } else {
        const vlevo = v.x < 0, x = vlevo ? 8 : w - 8;
        sipka(ctx, vlevo ? 46 : w - 46, cy + 22, x, cy + 22, v.barva);
        popisek(ctx, vlevo ? 52 : w - 52, cy + 22, "úběžník mimo obraz", v.barva, vlevo ? "left" : "right");
      }
    });
    pudorys(ctx, w, h, telesa);
    // text
    const vys = 1.4;
    let t1 = S.rot === 0 ? "<b>Jednoúběžníková perspektiva.</b> Přední stěna je rovnoběžná s obrazem, hloubkové hrany míří do jediného úběžníku na horizontu." :
             S.rot === 90 ? "<b>Jednoúběžníková perspektiva</b> (těleso otočené o 90°)." :
             `<b>Dvouúběžníková perspektiva.</b> Těleso je natočené o ${S.rot}°, vodorovné hrany se sbíhají do dvou úběžníků, svislé zůstávají svislé.`;
    let t2 = S.eye > vys + 0.03 ? "Oči jsou výš než horní stěna – vidíte ji shora (<b>nadhled</b>)." : S.eye < vys - 0.03 ? "Horizont protíná těleso – horní ani spodní stěnu nevidíte." : "Horní stěna leží přesně ve výšce očí – splývá v čáru.";
    const mimo = VP.filter(v => v.x < 0 || v.x > w).length;
    ro.innerHTML = t1 + "<br>" + t2 + (mimo ? `<br><small>${mimo === 1 ? "Jeden úběžník leží" : "Úběžníky leží"} mimo obraz – v praxi běžné.</small>` : "");
  });

  function obal(body){ // konvexní obal (Andrew)
    const b = body.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const cr = (o, a, c) => (a[0]-o[0])*(c[1]-o[1]) - (a[1]-o[1])*(c[0]-o[0]);
    const lo = [], hi = [];
    for (const q of b){ while (lo.length >= 2 && cr(lo[lo.length-2], lo[lo.length-1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of b.reverse()){ while (hi.length >= 2 && cr(hi[hi.length-2], hi[hi.length-1], q) <= 0) hi.pop(); hi.push(q); }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
  }
  function pudorys(ctx, w, h, telesa){
    const bw = Math.min(190, w * .3), bh = bw * .85, x0 = 12, y0 = h - bh - 12;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,.93)"; ctx.strokeStyle = "rgba(35,39,45,.25)"; ctx.lineWidth = 1;
    ctx.fillRect(x0, y0, bw, bh); ctx.strokeRect(x0 + .5, y0 + .5, bw - 1, bh - 1);
    ctx.beginPath(); ctx.rect(x0, y0, bw, bh); ctx.clip();
    const sc = bh / 14, ox = x0 + bw / 2, oy = y0 + bh - 14;
    const m = (x, z) => [ox + x * sc, oy - z * sc];
    // zorné pole a obrazová rovina
    const half = (0.56 * w) / (Math.min(w, h * 1.7) * 0.5 * S.f);
    ctx.strokeStyle = "rgba(62,141,176,.5)"; ctx.beginPath(); ctx.moveTo(...m(0, 0)); ctx.lineTo(...m(-half * 14, 14)); ctx.moveTo(...m(0, 0)); ctx.lineTo(...m(half * 14, 14)); ctx.stroke();
    ctx.strokeStyle = BLUE; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...m(-half * 1.6, 1.6)); ctx.lineTo(...m(half * 1.6, 1.6)); ctx.stroke();
    const c = Math.cos(rad(S.rot)), s = Math.sin(rad(S.rot));
    telesa.forEach(t => {
      const P = [[-t.w/2,-t.d/2],[t.w/2,-t.d/2],[t.w/2,t.d/2],[-t.w/2,t.d/2]].map(([lx, lz]) => [t.x + lx*c - lz*s, t.z + lx*s + lz*c]);
      if (t.hlavni){ ctx.strokeStyle = "rgba(180,83,42,.55)"; ctx.lineWidth = .8; ctx.setLineDash([2, 3]); P.forEach(q => { ctx.beginPath(); ctx.moveTo(...m(0, 0)); ctx.lineTo(...m(q[0], q[1])); ctx.stroke(); }); ctx.setLineDash([]); }
      ctx.fillStyle = t.hlavni ? "rgba(35,39,45,.75)" : "rgba(35,39,45,.35)";
      ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(...m(q[0], q[1])) : ctx.moveTo(...m(q[0], q[1]))); ctx.closePath(); ctx.fill();
    });
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(...m(0, 0), 4, 0, 7); ctx.fill();
    ctx.restore();
    ctx.font = "700 11px Barlow, sans-serif"; ctx.fillStyle = SOFT; ctx.textAlign = "left";
    ctx.fillText("POHLED SHORA", x0 + 8, y0 + 15); ctx.fillText("oko", x0 + bw / 2 + 8, y0 + bh - 8);
    ctx.fillStyle = BLUE; ctx.fillText("obraz", x0 + 8, y0 + bh - 14 - 1.6 * (bh / 14) - 4);
  }

  // ovládání
  const sync = () => {
    $("#o-rot").textContent = S.rot + "°"; $("#o-eye").textContent = cz(S.eye, 2).replace(/0$/, "") + " m";
    $("#o-fov").textContent = S.f < .85 ? "blízko – silné sbíhání" : S.f > 1.3 ? "daleko – mírné sbíhání" : "střední";
    $$("[data-pmode]").forEach(b => b.setAttribute("aria-pressed", (S.rot === 0 || S.rot === 90) ? b.dataset.pmode === "1" : b.dataset.pmode === "2"));
    p.kresli();
  };
  rRot.addEventListener("input", () => { S.rot = +rRot.value; sync(); });
  rEye.addEventListener("input", () => { S.eye = +rEye.value; sync(); });
  rFov.addEventListener("input", () => { S.f = +rFov.value; sync(); });
  $("#c-lines").addEventListener("change", e => { S.lines = e.target.checked; p.kresli(); });
  $("#c-hidden").addEventListener("change", e => { S.hidden = e.target.checked; p.kresli(); });
  $("#c-more").addEventListener("change", e => { S.more = e.target.checked; p.kresli(); });
  $$("[data-pmode]").forEach(b => b.addEventListener("click", () => { S.rot = b.dataset.pmode === "1" ? 0 : (S.rot === 0 || S.rot === 90 ? 35 : S.rot); rRot.value = S.rot; sync(); }));
  let start = null;
  tahni(cv, {
    down: (x, y) => { start = {x, y, bx: S.bx, bz: S.bz}; cv.style.cursor = "grabbing"; },
    move: (x, y) => { if (!start || !G) return; S.bz = clamp(start.bz - (y - start.y) * 0.035, 3.2, 16); S.bx = clamp(start.bx + (x - start.x) * S.bz / G.F, -6, 6); p.kresli(); },
    up: () => { start = null; cv.style.cursor = "grab"; }
  });
  cv.style.cursor = "grab";
  sync();
});

/* =====================================================================
   2 ROTAČNÍ TĚLESA – elipsy podle výšky očí
   ===================================================================== */
priPanelu("rotacni-telesa", () => {
  const cv = $("#cv-rot"); if (!cv) return;
  const PROFILY = {
    valec: [[0,.42],[1,.42]],
    vaza:  [[0,.3],[.06,.36],[.32,.5],[.55,.42],[.74,.2],[.84,.16],[.95,.21],[1,.24]],
    lahev: [[0,.3],[.56,.3],[.68,.24],[.76,.11],[.97,.095],[1,.11]],
    kuzel: [[0,.46],[1,0]]
  };
  const S = {tvar: "vaza", eye: 1.25, osy: true, hid: true, stin: false};
  const r = $("#r-reye"), ro = $("#rot-readout");
  // hladká interpolace profilu (Catmull-Rom)
  function polomer(pr, t){
    if (pr.length === 2) return lerp(pr[0][1], pr[1][1], t);
    let i = 0; while (i < pr.length - 2 && pr[i + 1][0] < t) i++;
    const p0 = pr[Math.max(0, i - 1)], p1 = pr[i], p2 = pr[i + 1], p3 = pr[Math.min(pr.length - 1, i + 2)];
    const u = (t - p1[0]) / (p2[0] - p1[0] || 1), u2 = u * u, u3 = u2 * u;
    return 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u + (2*p0[1] - 5*p1[1] + 4*p2[1] - p3[1]) * u2 + (-p0[1] + 3*p1[1] - 3*p2[1] + p3[1]) * u3);
  }
  let G = null;
  const p = platno(cv, o => {
    const {ctx, w, h} = o, pr = PROFILY[S.tvar];
    const Hpx = Math.min(h * .62, w * .7), base = h * .82, cx = w * .5, Rs = Hpx * .62, D = 2.6;
    const hy = base - S.eye * Hpx;
    G = {Hpx, base};
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FBFAF6"; ctx.fillRect(0, 0, w, h);
    // stůl
    ctx.fillStyle = "#EFE9DD"; ctx.fillRect(0, base + 6, w, h - base);
    // horizont
    ctx.strokeStyle = BLUE; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(w, hy); ctx.stroke();
    popisek(ctx, 12, hy - 13, "horizont – výška očí", BLUE);
    const ry = t => { const rr = polomer(pr, t) * Rs; return {rr, ryy: rr * Math.sin(Math.atan((S.eye - t) / D)), yc: base - t * Hpx}; };
    // vržený stín
    const b0 = ry(0);
    ctx.fillStyle = "rgba(35,39,45,.18)"; ctx.beginPath(); ctx.ellipse(cx + b0.rr * .9, base + 2, b0.rr * 1.6, Math.max(4, Math.abs(b0.ryy) * 1.1 + 6), 0, 0, 7); ctx.fill();
    // obrys
    const N = 90, L = [], R = [];
    for (let i = 0; i <= N; i++){ const t = i / N, q = ry(t); L.push([cx - q.rr, q.yc]); R.push([cx + q.rr, q.yc]); }
    // výplň tělesa
    ctx.fillStyle = "#fff"; ctx.beginPath(); L.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); R.slice().reverse().forEach(q => ctx.lineTo(...q)); ctx.closePath(); ctx.fill();
    // šrafura po tvaru
    if (S.stin){
      ctx.save(); ctx.beginPath(); L.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); R.slice().reverse().forEach(q => ctx.lineTo(...q)); ctx.closePath(); ctx.clip();
      ctx.lineWidth = 1;
      for (let t = 0.012; t < 1; t += 0.022){
        const q = ry(t); if (q.rr < 1) continue;
        const pod = q.ryy >= 0 ? 1 : -1;
        [[-.05, .62, .5], [-.05, .38, .55], [-.05, .2, .5]].forEach(([a0, a1, al]) => {
          ctx.strokeStyle = `rgba(35,39,45,${al})`; ctx.beginPath();
          ctx.ellipse(cx, q.yc, q.rr, Math.abs(q.ryy) + .01, 0, pod > 0 ? Math.PI * a0 : -Math.PI * a1, pod > 0 ? Math.PI * a1 : Math.PI * -a0 ); ctx.stroke();
        });
      }
      ctx.restore();
    }
    // osa
    if (S.osy){ ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 1.3; ctx.setLineDash([8, 5]); ctx.beginPath(); ctx.moveTo(cx, base + 30); ctx.lineTo(cx, base - Hpx - 30); ctx.stroke(); ctx.restore(); }
    // elipsy v charakteristických místech
    const tt = pr.length === 2 ? [0, .25, .5, .75, 1] : pr.map(q => q[0]);
    tt.forEach(t => {
      const q = ry(t); if (q.rr < 1.5) return;
      const a = Math.abs(q.ryy) + .01, shora = q.ryy >= 0;
      const horni = t >= .999, dolni = t <= .001;
      // přední polovina
      ctx.strokeStyle = INK; ctx.lineWidth = (horni || dolni) ? 2.2 : 1.1;
      if (!(horni || dolni)) ctx.strokeStyle = "rgba(35,39,45,.45)";
      ctx.beginPath(); ctx.ellipse(cx, q.yc, q.rr, a, 0, shora ? 0 : Math.PI, shora ? Math.PI : Math.PI * 2); ctx.stroke();
      // zadní polovina
      const zadniVidet = (horni && shora) || (dolni && !shora);
      if (zadniVidet){ ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(cx, q.yc, q.rr, a, 0, shora ? Math.PI : 0, shora ? Math.PI * 2 : Math.PI); ctx.stroke(); }
      else if (S.hid){ ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = "rgba(35,39,45,.4)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx, q.yc, q.rr, a, 0, shora ? Math.PI : 0, shora ? Math.PI * 2 : Math.PI); ctx.stroke(); ctx.restore(); }
      if (S.osy){ ctx.save(); ctx.strokeStyle = "rgba(62,141,176,.6)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - q.rr, q.yc); ctx.lineTo(cx + q.rr, q.yc); ctx.stroke(); ctx.restore(); }
    });
    // obrysové křivky
    ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineJoin = "round";
    [L, R].forEach(pts => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.stroke(); });
    // popisky poměrů
    const top = ry(1), dno = ry(0);
    const pom = q => q.rr < 1 ? "–" : cz(Math.abs(q.ryy) / q.rr, 2);
    ctx.font = "600 13px Barlow, sans-serif"; ctx.fillStyle = SOFT; ctx.textAlign = "left";
    if (top.rr > 2) ctx.fillText(`horní elipsa ${pom(top)}`, cx + Math.max(top.rr, 20) + 14, top.yc + 4);
    ctx.fillText(`dno ${pom(dno)}`, cx + dno.rr + 14, dno.yc + 18);
    const stav = S.eye > 1.02 ? "Díváte se na těleso <b>shora</b> – všechny elipsy vidíte zespodu otevřené, nejvíc dno." :
                 S.eye < -0.02 ? "Díváte se na těleso <b>zdola</b> – elipsy se otáčejí, vidíte spodní stranu dna." :
                 "Horizont <b>protíná těleso</b>. Elipsa ve výšce očí je přímka, nad ní se elipsy otáčejí opačně než pod ní.";
    ro.innerHTML = stav + `<br><small>Číslo u elipsy = poměr její výšky a šířky (0 = přímka, 1 = kruh).</small>`;
  });
  const sync = () => { $("#o-reye").textContent = S.eye > 1.02 ? "nad tělesem" : S.eye < -0.02 ? "pod tělesem" : "v úrovni tělesa"; p.kresli(); };
  r.addEventListener("input", () => { S.eye = +r.value; sync(); });
  segment('[aria-label="Tvar tělesa"]', "data-shape", v => { S.tvar = v; p.kresli(); });
  $("#c-raxes").addEventListener("change", e => { S.osy = e.target.checked; p.kresli(); });
  $("#c-rhid").addEventListener("change", e => { S.hid = e.target.checked; p.kresli(); });
  $("#c-rshade").addEventListener("change", e => { S.stin = e.target.checked; p.kresli(); });
  tahni(cv, { down: (x, y) => posun(y), move: (x, y) => posun(y) });
  function posun(y){ if (!G) return; S.eye = clamp((G.base - y) / G.Hpx, -.3, 1.45); r.value = S.eye; sync(); }
  cv.style.cursor = "ns-resize";
  sync();
});

/* =====================================================================
   3 STÍNOVÁNÍ – světelná laboratoř + tónová škála
   ===================================================================== */
priPanelu("stinovani", () => {
  const cv = $("#cv-shade"); if (!cv) return;
  const S = {telo: "koule", rezim: "ton", lh: .38, lx: -.7, ly: .5, popisky: true};
  const rL = $("#r-lh");
  let img = null, G = {};
  function svetlo(){ const z = S.lh * 1.0; const n = Math.hypot(S.lx, S.ly, z); return [S.lx / n, S.ly / n, z / n]; }
  // převod tónu na výsledný pixel podle režimu
  function ton(v, x, y, stin){
    if (S.rezim === "zony"){
      if (stin === 2) return .2;           // vržený stín
      if (v > .93) return 1; if (v > .68) return .84; if (v > .4) return .62; if (stin === 1 && v > .2) return .38; return .2;
    }
    if (S.rezim === "srafura"){
      let ink = 0;
      if (v < .9 && ((x + y) % 7) < 1.3) ink = 1;
      if (v < .62 && ((x - y + 700) % 7) < 1.3) ink = 1;
      if (v < .38 && (x % 5) < 1.2) ink = 1;
      if (v < .22 && ((x + 2 * y) % 4) < 1.2) ink = 1;
      return ink ? .18 : 1;
    }
    return v;
  }
  const p = platno(cv, o => {
    const {ctx, w, h} = o;
    const W = Math.round(w), H = Math.round(h);
    if (!img || img.width !== W || img.height !== H) img = ctx.createImageData(W, H);
    const d = img.data, L = svetlo();
    const gy = H * .74, R = Math.min(W * .22, H * .3), cx = W * .46;
    const Vx = 0, Vy = 0, Vz = 1, Hv = [L[0], L[1], L[2] + 1]; const hn = Math.hypot(...Hv); Hv.forEach((q, i) => Hv[i] = q / hn);
    const ly = Math.max(.12, L[1]);
    // geometrie těles
    const kou = {cx, cy: gy - R * .85, R};
    const val = {cx, rx: R * .78, ry: R * .26, top: gy - R * 2.1, bot: gy};
    G = {R, cx, gy, kou, val};
    // stín na zemi: test v souřadnicích podlahy (X vpravo, Z do hloubky)
    const pz = R * .32;
    const naZemi = (px, py) => [(px - cx) / R, (gy + (S.telo === "koule" ? R*.15 : 0) - py) / pz];
    const sx = -L[0] / ly, sz = L[2] / ly; // posun stínu na jednotku výšky
    function vStinu(X, Z){
      if (S.telo === "koule"){
        const c = [sx * 1, sz * 1]; const e = Math.max(1, 1 / ly * .85);
        const dl = Math.hypot(c[0], c[1]) || 1, u = [c[0] / dl, c[1] / dl];
        const qx = X - c[0], qz = Z - c[1], a = qx * u[0] + qz * u[1], b = -qx * u[1] + qz * u[0];
        return (a / e) ** 2 + b * b < 1 ? Math.hypot(X, Z) / (e + 1.2) : -1;
      }
      const vyska = S.telo === "valec" ? 2.1 * .9 / .78 : 1.6, rr = S.telo === "valec" ? .78 : .75;
      const ex = sx * vyska, ez = sz * vyska, ll = ex * ex + ez * ez || 1;
      let t = clamp((X * ex + Z * ez) / ll, 0, 1); const dx = X - ex * t, dz = Z - ez * t;
      return Math.hypot(dx, dz) < rr ? t * .8 : -1;
    }
    for (let y = 0; y < H; y++){
      for (let x = 0; x < W; x++){
        let v, st = 0;
        if (y < gy){ v = .95 - .05 * (y / gy); }
        else {
          v = .87 - .08 * ((y - gy) / (H - gy));
          const [X, Z] = naZemi(x, y); const s = vStinu(X, Z);
          if (s >= 0){ v = .16 + .28 * clamp(s, 0, 1); st = 2; }
        }
        const k = (y * W + x) * 4, t = ton(v, x, y, st), g = Math.round(t * 248);
        d[k] = g + 3; d[k + 1] = g + 1; d[k + 2] = g - 4; d[k + 3] = 255;
      }
    }
    // těleso
    const shade = (nx, ny, nz, x, y) => {
      const dif = nx * L[0] + ny * L[1] + nz * L[2];
      const spec = Math.pow(Math.max(0, nx * Hv[0] + ny * Hv[1] + nz * Hv[2]), 38);
      let v, st = 0;
      if (dif >= 0) v = .2 + .74 * Math.pow(dif, .75) + .45 * spec;
      else { st = 1; const refl = clamp(-ny * .7 + .35, 0, 1) * clamp(-dif * 1.6, 0, 1); v = .17 + .17 * refl - .05 * clamp(1 - Math.abs(dif) * 5, 0, 1); }
      v = clamp(v, 0, 1);
      const k = (y * W + x) * 4, t = ton(v, x, y, st), g = Math.round(t * 248);
      d[k] = g + 3; d[k + 1] = g + 1; d[k + 2] = g - 4;
    };
    if (S.telo === "koule"){
      const {cy} = kou;
      for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++){
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const nx = (x - cx) / R, ny = -(y - cy) / R, q = nx * nx + ny * ny; if (q > 1) continue;
        shade(nx, ny, Math.sqrt(1 - q), x, y);
      }
    } else if (S.telo === "valec"){
      const {rx, ry, top, bot} = val;
      for (let y = Math.floor(top - ry); y <= bot + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++){
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const u = (x - cx) / rx; if (Math.abs(u) > 1) continue;
        const e = Math.sqrt(1 - u * u) * ry;
        const vVrchu = Math.abs(y - top) <= e;
        if (vVrchu){ shade(0, .93, .36, x, y); continue; }
        if (y > top && y <= bot + e) shade(u, 0, Math.sqrt(1 - u * u), x, y);
      }
    }
    ctx.putImageData(img, 0, 0);
    // pozn.: putImageData ignoruje transformaci – při DPR>1 obraz překreslíme ve správné velikosti
    if (cv.width !== W){ const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = H; tmp.getContext("2d").putImageData(img, 0, 0); ctx.clearRect(0, 0, w, h); ctx.drawImage(tmp, 0, 0, w, h); }
    if (S.telo === "krychle") krychle(ctx, L, cx, gy, R);
    // obrysy
    ctx.strokeStyle = "rgba(35,39,45,.8)"; ctx.lineWidth = 1.4;
    if (S.telo === "koule"){ ctx.beginPath(); ctx.arc(cx, kou.cy, R, 0, 7); ctx.stroke(); }
    if (S.telo === "valec"){ const {rx, ry, top, bot} = val; ctx.beginPath(); ctx.ellipse(cx, top, rx, ry, 0, 0, 7); ctx.moveTo(cx - rx, top); ctx.lineTo(cx - rx, bot); ctx.ellipse(cx, bot, rx, ry, 0, Math.PI, 0, true); ctx.lineTo(cx + rx, top); ctx.stroke(); }
    // lampa
    const lpx = cx + S.lx * R * 2.3, lpy = (S.telo === "koule" ? kou.cy : gy - R) - S.ly * R * 2.3;
    G.lampa = [lpx, lpy];
    ctx.save(); ctx.translate(lpx, lpy); ctx.fillStyle = "#F2C230"; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 15, Math.sin(a) * 15); ctx.lineTo(Math.cos(a) * 21, Math.sin(a) * 21); ctx.stroke(); }
    ctx.restore();
    if (S.popisky) popisky(ctx, L, ly, sx, sz, pz);
  });
  function krychle(ctx, L, cx, gy, R){
    const s = R * 1.25, a = rad(32), el = .42;
    const rot = ([x, y, z]) => [x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a)];
    const scr = ([x, y, z]) => [cx + x * s, gy - y * s * .9 + z * s * el];
    const P = []; for (const y of [0, 1]) for (const [x, z] of [[-1,-1],[1,-1],[1,1],[-1,1]]) P.push(rot([x * .5, y, z * .5]));
    const ly = Math.max(.12, L[1]);
    const sh = P.map(([x, y, z]) => scr([x - L[0] / ly * y, 0, z - L[2] / ly * y * -1 * -1]));
    const hull = (b => { b = b.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]); const cr = (o, a, c) => (a[0]-o[0])*(c[1]-o[1]) - (a[1]-o[1])*(c[0]-o[0]); const lo = [], hi = []; for (const q of b){ while (lo.length >= 2 && cr(lo[lo.length-2], lo[lo.length-1], q) <= 0) lo.pop(); lo.push(q); } for (const q of b.reverse()){ while (hi.length >= 2 && cr(hi[hi.length-2], hi[hi.length-1], q) <= 0) hi.pop(); hi.push(q); } return lo.slice(0,-1).concat(hi.slice(0,-1)); })(sh);
    ctx.fillStyle = S.rezim === "srafura" ? hatchPattern(ctx, .2) : `rgba(35,39,45,${S.rezim === "zony" ? .72 : .55})`;
    ctx.beginPath(); hull.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.closePath(); ctx.fill();
    const Q = P.map(scr);
    const steny = [{i: [4,5,6,7], n: [0,1,0]}, {i: [2,3,7,6], n: [-Math.sin(a), 0, Math.cos(a)]}, {i: [1,2,6,5], n: [Math.cos(a), 0, Math.sin(a)]}];
    steny.forEach(f => {
      const dif = f.n[0] * L[0] + f.n[1] * L[1] + f.n[2] * L[2];
      let v = dif > 0 ? .4 + .55 * dif : .2;
      if (S.rezim === "zony") v = v > .8 ? .9 : v > .55 ? .66 : .24;
      const g = Math.round(v * 248);
      ctx.fillStyle = S.rezim === "srafura" ? hatchPattern(ctx, v) : `rgb(${g+3},${g+1},${g-4})`;
      ctx.beginPath(); f.i.forEach((k, j) => j ? ctx.lineTo(...Q[k]) : ctx.moveTo(...Q[k])); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(35,39,45,.85)"; ctx.lineWidth = 1.5; ctx.stroke();
    });
  }
  const vzory = {};
  function hatchPattern(ctx, v){
    const k = Math.round(v * 10); if (vzory[k]) return vzory[k];
    const c = document.createElement("canvas"); c.width = c.height = 14; const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, 14, 14); g.strokeStyle = "rgba(35,39,45,.85)"; g.lineWidth = 1.1;
    const cara = (x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
    if (v < .9) { cara(-2, 16, 16, -2); cara(-9, 9, 9, -9); cara(5, 23, 23, 5); }
    if (v < .62) { cara(-2, -2, 16, 16); cara(-9, 5, 9, 23); cara(5, -9, 23, 9); }
    if (v < .38) { cara(3.5, 0, 3.5, 14); cara(10.5, 0, 10.5, 14); }
    return vzory[k] = ctx.createPattern(c, "repeat");
  }
  function popisky(ctx, L, ly, sx, sz, pz){
    const {R, cx, gy, kou} = G;
    if (S.telo === "koule"){
      const hv = [L[0], L[1], L[2] + 1], hn = Math.hypot(...hv);
      const hx = cx + hv[0] / hn * R, hy = kou.cy - hv[1] / hn * R;
      const dl = Math.hypot(L[0], L[1]) || 1, d2 = [-L[0] / dl, -L[1] / dl];
      const k = -(d2[0] * L[0] + d2[1] * L[1]), sT = L[2] / Math.hypot(k, L[2]);
      const bod = s => [cx + d2[0] * s * R, kou.cy - d2[1] * s * R];
      const vystup = (pt, txt, dx, dy) => { ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(pt[0], pt[1], 3, 0, 7); ctx.fill(); ctx.strokeStyle = "rgba(180,83,42,.6)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...pt); ctx.lineTo(pt[0] + dx, pt[1] + dy); ctx.stroke(); popisek(ctx, pt[0] + dx + (dx < 0 ? -4 : 4), pt[1] + dy, txt, RED, dx < 0 ? "right" : "left"); };
      const strana = d2[0] >= 0 ? 1 : -1;
      vystup([hx, hy], "odlesk", -strana * 70, -26);
      vystup(bod(Math.max(0, sT - .45)), "polostín", -strana * 90, 8);
      vystup(bod(Math.min(.97, sT + .1)), "hranice stínu", strana * 95, -34);
      vystup(bod(.95), "odražené světlo", strana * 70, 30);
      const sxp = cx + sx * R * .9, syp = gy + R * .15 - sz * pz * .9;
      vystup([clamp(sxp, 30, G.R * 6), clamp(syp, gy + 8, gy + 200)], "vržený stín", strana * 60, 40);
    } else {
      popisek(ctx, 16, 24, S.telo === "valec" ? "Válec: tón se mění plynule podle natočení povrchu" : "Krychle: každá stěna má jeden tón", SOFT);
    }
  }
  segment('[aria-label="Těleso"]', "data-body", v => { S.telo = v; p.kresli(); });
  segment('[aria-label="Způsob zobrazení"]', "data-smode", v => { S.rezim = v; p.kresli(); });
  rL.addEventListener("input", () => { S.lh = +rL.value; $("#o-lh").textContent = S.lh < .35 ? "nízko (z boku)" : S.lh > .75 ? "zepředu" : "střední"; p.kresli(); });
  $("#c-slabels").addEventListener("change", e => { S.popisky = e.target.checked; p.kresli(); });
  let raf = null;
  const nastav = (x, y) => {
    const {R, cx, gy, kou} = G; const oy = S.telo === "koule" ? kou.cy : gy - R;
    let lx = (x - cx) / (R * 2.3), ly = (oy - y) / (R * 2.3); const n = Math.hypot(lx, ly); if (n > 1.15){ lx *= 1.15 / n; ly *= 1.15 / n; }
    S.lx = lx; S.ly = Math.max(.12, ly);
    if (!raf) raf = requestAnimationFrame(() => { raf = null; p.kresli(); });
  };
  tahni(cv, {down: nastav, move: nastav});
  cv.style.cursor = "crosshair";

  // tónová škála
  const sk = $("#skala"), txt = $("#skala-txt");
  const POPIS = ["bílý papír – odlesky","nejsvětlejší světlo – sotva znatelná šrafura","světlo – řídká lineární šrafura","světlý polostín – hustší šrafura","polostín – lineární šrafura se středním přítlakem","tmavý polostín – druhá vrstva křížem","vlastní stín – křížová šrafura, měkká tužka","hranice stínu – tři vrstvy, silný přítlak 6B","vržený stín u tělesa – nejtmavší, tužka 8B"];
  sk.innerHTML = POPIS.map((_, i) => { const g = Math.round(250 - i * 27.5); return `<button type="button" data-i="${i}" title="${POPIS[i]}" style="aspect-ratio:1;border:1px solid var(--line);border-radius:4px;cursor:pointer;background:rgb(${g+2},${g},${g-4})"><span class="sr-only">Stupeň ${i + 1}</span></button>`; }).join("");
  sk.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; $$("button", sk).forEach(x => x.style.outline = x === b ? "3px solid #B4532A" : ""); txt.innerHTML = `<b>Stupeň ${+b.dataset.i + 1} z 9:</b> ${POPIS[+b.dataset.i]}.`; });
});

/* =====================================================================
   4 DRAPERIE – simulace látky (Verletova integrace)
   ===================================================================== */
priPanelu("draperie", () => {
  const cv = $("#cv-cloth"); if (!cv) return;
  const NX = 30, NY = 26;
  const S = {piny: "2", rezim: "ton", tuhost: 2};
  let B = [], V = [], PIN = [], sp = 10, beh = false, vidi = true, chycen = -1;
  let pripraveno = false;
  const p = platno(cv, () => { if (!pripraveno) return; if (!B.length) init(); kresli(); });
  pripraveno = true; init(); kresli();
  function init(){
    const w = p.w, h = p.h; sp = Math.min(w * .56, h * .78) / (NX - 1);
    const sirka = sp * (NX - 1), x0 = (w - sirka) / 2, y0 = h * .1, rand = rng(7);
    B = []; for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++){ const x = x0 + i * sp, y = y0 + j * sp * .25, z = (rand() - .5) * 2; B.push({x, y, z, px: x, py: y, pz: z}); }
    V = [];
    const idx = (i, j) => j * NX + i;
    const vaz = (a, b, k) => V.push([a, b, Math.hypot(B[a].x - B[b].x, (B[a].y - B[b].y) / .25 * 1, 0) * 0 + k]);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++){
      if (i < NX - 1) V.push([idx(i, j), idx(i + 1, j), sp, 1]);
      if (j < NY - 1) V.push([idx(i, j), idx(i, j + 1), sp, 1]);
      if (i < NX - 1 && j < NY - 1){ V.push([idx(i, j), idx(i + 1, j + 1), sp * Math.SQRT2, 2]); V.push([idx(i + 1, j), idx(i, j + 1), sp * Math.SQRT2, 2]); }
      if (i < NX - 2) V.push([idx(i, j), idx(i + 2, j), sp * 2, 3]);
      if (j < NY - 2) V.push([idx(i, j), idx(i, j + 2), sp * 2, 3]);
    }
    const kotvy = S.piny === "1" ? [Math.floor(NX / 2)] : S.piny === "3" ? [0, Math.floor(NX / 2), NX - 1] : [0, NX - 1];
    PIN = kotvy.map(i => ({i, x: B[i].x, y: B[i].y}));
    if (S.piny === "2"){ const st = (PIN[0].x + PIN[1].x) / 2; PIN[0].x = st - sirka * .36; PIN[1].x = st + sirka * .36; }
    if (S.piny === "3"){ PIN[1].y += sp * 5; PIN[0].x += sirka * .08; PIN[2].x -= sirka * .08; }
    if (S.piny === "1"){ PIN[0].y = y0; }
    if (!beh){ beh = true; requestAnimationFrame(krok); }
  }
  function krok(){
    if (!document.getElementById("draperie").classList.contains("on") || !vidi){ beh = false; return; }
    const g = .32, tl = .985;
    for (const b of B){ const vx = (b.x - b.px) * tl, vy = (b.y - b.py) * tl, vz = (b.z - b.pz) * tl; b.px = b.x; b.py = b.y; b.pz = b.z; b.x += vx; b.y += vy + g; b.z += vz; }
    const it = [0, 5, 9, 16][S.tuhost];
    for (let k = 0; k < it; k++){
      for (const [a, c, L, typ] of V){
        if (typ === 3 && S.tuhost < 2) continue;
        const A = B[a], C = B[c]; const dx = C.x - A.x, dy = C.y - A.y, dz = C.z - A.z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        if (typ === 3 && d > L) continue; // ohybová vazba brání jen stlačení
        const f = (d - L) / d * (typ === 1 ? .5 : typ === 2 ? .25 : .12);
        A.x += dx * f; A.y += dy * f; A.z += dz * f; C.x -= dx * f; C.y -= dy * f; C.z -= dz * f;
      }
      for (const q of PIN){ const b = B[q.i]; b.x = q.x; b.y = q.y; b.z = 0; }
    }
    kresli();
    requestAnimationFrame(krok);
  }
  function kresli(){
    const {ctx, w, h} = p; ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FBFAF6"; ctx.fillRect(0, 0, w, h);
    if (!B.length) return;
    const L = [-.45, -.55, .7]; const ln = Math.hypot(...L); L.forEach((v, i) => L[i] = v / ln);
    const T = [];
    for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++){
      const a = B[j * NX + i], b = B[j * NX + i + 1], c = B[(j + 1) * NX + i + 1], d = B[(j + 1) * NX + i];
      const u = [c.x - a.x, c.y - a.y, c.z - a.z], v = [d.x - b.x, d.y - b.y, d.z - b.z];
      let n = [u[1]*v[2] - u[2]*v[1], u[2]*v[0] - u[0]*v[2], u[0]*v[1] - u[1]*v[0]]; const nn = Math.hypot(...n) || 1; n = n.map(q => q / nn);
      if (n[2] < 0) n = n.map(q => -q);
      let t = .18 + .82 * Math.max(0, n[0]*L[0] + n[1]*L[1] + n[2]*L[2]);
      T.push({q: [a, b, c, d], z: (a.z + b.z + c.z + d.z) / 4, t});
    }
    T.sort((x, y) => x.z - y.z);
    for (const f of T){
      let t = f.t;
      if (S.rezim === "zony") t = t > .82 ? .95 : t > .6 ? .75 : t > .38 ? .5 : .26;
      const g = Math.round(lerp(60, 250, t));
      ctx.fillStyle = S.rezim === "sit" ? "rgba(255,255,255,.75)" : `rgb(${g + 4},${g},${g - 8})`;
      ctx.beginPath(); f.q.forEach((b, k) => k ? ctx.lineTo(b.x, b.y) : ctx.moveTo(b.x, b.y)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = S.rezim === "sit" ? "rgba(35,39,45,.45)" : ctx.fillStyle; ctx.lineWidth = S.rezim === "sit" ? .8 : .6; ctx.stroke();
    }
    // obrys látky
    ctx.strokeStyle = "rgba(35,39,45,.7)"; ctx.lineWidth = 1.2; ctx.beginPath();
    const kraj = []; for (let i = 0; i < NX; i++) kraj.push(B[i]); for (let j = 1; j < NY; j++) kraj.push(B[j * NX + NX - 1]); for (let i = NX - 2; i >= 0; i--) kraj.push(B[(NY - 1) * NX + i]); for (let j = NY - 2; j > 0; j--) kraj.push(B[j * NX]);
    kraj.forEach((b, k) => k ? ctx.lineTo(b.x, b.y) : ctx.moveTo(b.x, b.y)); ctx.closePath(); ctx.stroke();
    PIN.forEach(q => { ctx.fillStyle = RED; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, 8, 0, 7); ctx.fill(); ctx.stroke(); });
    popisek(ctx, 14, h - 18, "body napětí = červené špendlíky", RED);
  }
  tahni(cv, {
    down: (x, y) => { chycen = -1; let best = 30; PIN.forEach((q, k) => { const d = Math.hypot(q.x - x, q.y - y); if (d < best){ best = d; chycen = k; } }); },
    move: (x, y) => { if (chycen < 0) return; PIN[chycen].x = clamp(x, 10, p.w - 10); PIN[chycen].y = clamp(y, 10, p.h - 10); if (!beh){ beh = true; requestAnimationFrame(krok); } },
    hover: (x, y) => { cv.style.cursor = PIN.some(q => Math.hypot(q.x - x, q.y - y) < 30) ? "grab" : "default"; },
    up: () => { chycen = -1; }
  });
  segment('[aria-label="Zavěšení"]', "data-pins", v => { S.piny = v; B = []; init(); });
  segment('[aria-label="Zobrazení"]', "data-cmode", v => { S.rezim = v; kresli(); });
  $("#r-stiff").addEventListener("input", e => { S.tuhost = +e.target.value; $("#o-stiff").textContent = ["", "měkká (hedvábí)", "střední (bavlna)", "tuhá (plátno)"][S.tuhost]; });
  $("#b-cloth-reset").addEventListener("click", () => { B = []; init(); });
  $("#b-cloth-wind").addEventListener("click", () => { const r = rng(Date.now() % 1e6); B.forEach(b => { b.pz -= (r() * 6 + 2); b.px -= (r() - .5) * 6; }); if (!beh){ beh = true; requestAnimationFrame(krok); } });
  new IntersectionObserver(en => { vidi = en[0].isIntersecting; if (vidi && !beh && B.length){ beh = true; requestAnimationFrame(krok); } }).observe(cv);
  document.addEventListener("panel:show", e => { if (e.detail === "draperie" && !beh && B.length){ beh = true; requestAnimationFrame(krok); } });
});

/* =====================================================================
   5 ZÁTIŠÍ – měření tužkou, kompoziční hledáček, rozbor kresby
   ===================================================================== */
priPanelu("zatisi", () => {
  /* ---------- Animace měření ---------- */
  const sv = $("#sv-mereni");
  if (sv){
    sv.innerHTML = `
      <rect x="0" y="0" width="520" height="330" fill="#FBFAF6"/>
      <rect x="0" y="290" width="520" height="40" fill="#EFE9DD"/><line x1="0" y1="290" x2="520" y2="290" stroke="#23272D" stroke-width="1.2" opacity=".5"/>
      <ellipse cx="398" cy="294" rx="60" ry="6" fill="#23272D" opacity=".15"/><ellipse cx="200" cy="292" rx="44" ry="6" fill="#23272D" opacity=".15"/>
      <path d="M350 290 L350 150 C350 128 362 120 366 108 L366 70 L384 70 L384 108 C388 120 400 128 400 150 L400 290 Z" fill="#fff" stroke="#23272D" stroke-width="2"/>
      <rect x="362" y="62" width="26" height="10" rx="2" fill="#fff" stroke="#23272D" stroke-width="2"/>
      <path d="M200 216 C222 206 244 222 242 250 C240 278 222 290 200 289 C178 290 160 278 158 250 C156 222 178 206 200 216 Z" fill="#fff" stroke="#23272D" stroke-width="2"/>
      <path d="M200 216 C198 208 202 202 206 198" fill="none" stroke="#23272D" stroke-width="2"/>
      <g id="m-ticks"></g>
      <g id="m-oko" opacity=".9"><path d="M20 40 Q40 26 60 40 Q40 54 20 40Z" fill="#fff" stroke="#23272D" stroke-width="1.6"/><circle cx="40" cy="40" r="6" fill="#23272D"/></g>
      <line id="m-paprsek" x1="60" y1="40" x2="200" y2="216" stroke="#B4532A" stroke-width="1" stroke-dasharray="4 4"/>
      <g id="m-tuzka" style="transition:transform .9s cubic-bezier(.4,.1,.2,1)">
        <rect x="-5" y="0" width="10" height="150" fill="#2E3A48"/><path d="M-5 0 L0 -16 L5 0Z" fill="#E7C9A0"/><path d="M-1.6 -11 L0 -16 L1.6 -11Z" fill="#23272D"/>
        <rect id="m-palec" x="-11" y="74" width="22" height="9" rx="4" fill="#E2B48C" stroke="#8A5A34" style="transition:transform .9s"/>
      </g>
      <text id="m-txt" x="260" y="318" text-anchor="middle" style="font:600 19px Caveat,cursive;fill:#B4532A"></text>`;
    const tz = $("#m-tuzka", sv), palec = $("#m-palec", sv), ticks = $("#m-ticks", sv), txt = $("#m-txt", sv), pap = $("#m-paprsek", sv), t2 = $("#t-mereni");
    const U = 74; let casy = [];
    const tuzka = (x, top, delka) => { tz.style.transform = `translate(${x}px,${top + 16}px)`; palec.style.transform = `translate(0px,${delka - 74 - 16}px)`; pap.setAttribute("x2", x); pap.setAttribute("y2", top); };
    function prehraj(){
      casy.forEach(clearTimeout); casy = []; ticks.innerHTML = "";
      const kroky = [
        [0,   () => { tuzka(250, 216, U); txt.textContent = "1. Paže natažená, jedno oko zavřené"; t2.textContent = "Hrot tužky na vrchol jablka, palec na jeho spodek. Tato délka je naše jednotka."; }],
        [1500,() => { txt.textContent = "jednotka = výška jablka"; svgEl("line", {x1: 236, y1: 216, x2: 264, y2: 216, stroke: RED, "stroke-width": 2}, ticks); svgEl("line", {x1: 236, y1: 290, x2: 264, y2: 290, stroke: RED, "stroke-width": 2}, ticks); }],
        [2700,() => { tuzka(420, 216, U); txt.textContent = "2. Stejnou délku přeneseme k lahvi"; t2.textContent = "Nesmíte pohnout palcem ani ohnout loket – jinak se jednotka změní."; }],
        [3900,() => { svgEl("line", {x1: 404, y1: 290, x2: 440, y2: 290, stroke: RED, "stroke-width": 2}, ticks); svgEl("line", {x1: 404, y1: 216, x2: 440, y2: 216, stroke: RED, "stroke-width": 2}, ticks); svgEl("text", {x: 446, y: 258, style: "font:600 20px Caveat,cursive;fill:#B4532A"}, ticks).textContent = "1"; }],
        [4700,() => { tuzka(420, 142, U); }],
        [5600,() => { svgEl("line", {x1: 404, y1: 142, x2: 440, y2: 142, stroke: RED, "stroke-width": 2}, ticks); svgEl("text", {x: 446, y: 184, style: "font:600 20px Caveat,cursive;fill:#B4532A"}, ticks).textContent = "2"; }],
        [6400,() => { tuzka(420, 68, U); }],
        [7300,() => { svgEl("line", {x1: 404, y1: 68, x2: 440, y2: 68, stroke: RED, "stroke-width": 2}, ticks); svgEl("text", {x: 446, y: 110, style: "font:600 20px Caveat,cursive;fill:#B4532A"}, ticks).textContent = "3"; }],
        [8100,() => { txt.textContent = "Lahev je vysoká jako tři jablka"; t2.innerHTML = "<b>Výsledek:</b> lahev = 3 jablka. Stejný poměr musí platit i na vašem výkresu."; }]
      ];
      kroky.forEach(([t, f]) => casy.push(setTimeout(f, t)));
    }
    $("#b-mereni").addEventListener("click", prehraj);
    new IntersectionObserver((en, o) => { if (en[0].isIntersecting){ o.disconnect(); prehraj(); } }, {threshold: .4}).observe(sv);
  }

  /* ---------- Kompoziční hledáček ---------- */
  const svk = $("#sv-komp");
  if (svk){
    const FORMATY = {"na-sirku": [40, 50, 720, 500], "na-vysku": [215, 20, 370, 560], "ctverec": [130, 40, 540, 520]};
    // předměty: [id, šířka, výška, váha, kresba (počátek = střed podstavy)]
    const PREDMETY = [
      {id: "lahev", w: 64, h: 230, k: 1.25, svg: `<path d="M-30 0 L-30 -140 C-30 -160 -14 -168 -10 -182 L-10 -222 L10 -222 L10 -182 C14 -168 30 -160 30 -140 L30 0Z" fill="#9AA0A6" stroke="#23272D" stroke-width="2"/><rect x="-12" y="-232" width="24" height="12" rx="2" fill="#6E747A" stroke="#23272D" stroke-width="2"/><path d="M-20 -130 L-20 -20" stroke="#fff" stroke-width="5" opacity=".5" stroke-linecap="round"/>`},
      {id: "vaza", w: 128, h: 172, k: 1, svg: `<path d="M-36 0 C-60 -40 -66 -96 -40 -128 C-28 -144 -28 -156 -32 -166 L32 -166 C28 -156 28 -144 40 -128 C66 -96 60 -40 36 0Z" fill="#D9D2C3" stroke="#23272D" stroke-width="2"/><ellipse cx="0" cy="-166" rx="32" ry="6" fill="#fff" stroke="#23272D" stroke-width="2"/><path d="M26 -120 C44 -90 44 -50 28 -14" stroke="#23272D" stroke-width="10" opacity=".15" fill="none"/>`},
      {id: "miska", w: 150, h: 54, k: .7, svg: `<path d="M-74 -46 C-70 -10 -40 0 0 0 C40 0 70 -10 74 -46Z" fill="#EDE7DB" stroke="#23272D" stroke-width="2"/><ellipse cx="0" cy="-46" rx="74" ry="9" fill="#fff" stroke="#23272D" stroke-width="2"/>`},
      {id: "jablko", w: 70, h: 66, k: .75, svg: `<path d="M0 -58 C20 -70 36 -52 34 -30 C32 -8 16 0 0 -1 C-16 0 -32 -8 -34 -30 C-36 -52 -20 -70 0 -58Z" fill="#C9B8A0" stroke="#23272D" stroke-width="2"/><path d="M0 -58 C-1 -66 2 -72 6 -76" stroke="#23272D" stroke-width="2" fill="none"/><ellipse cx="-12" cy="-44" rx="7" ry="5" fill="#fff" opacity=".7"/>`},
      {id: "hruska", w: 62, h: 98, k: .7, svg: `<path d="M0 -90 C12 -90 14 -72 16 -60 C22 -44 32 -36 30 -18 C28 -4 14 0 0 0 C-14 0 -28 -4 -30 -18 C-32 -36 -22 -44 -16 -60 C-14 -72 -12 -90 0 -90Z" fill="#BDB49A" stroke="#23272D" stroke-width="2"/><path d="M0 -90 C1 -96 4 -100 8 -104" stroke="#23272D" stroke-width="2" fill="none"/>`},
      {id: "hrnek", w: 92, h: 80, k: .85, svg: `<path d="M-36 0 L-36 -76 L36 -76 L36 0Z" fill="#7F868D" stroke="#23272D" stroke-width="2"/><ellipse cx="0" cy="-76" rx="36" ry="7" fill="#C9CDD1" stroke="#23272D" stroke-width="2"/><path d="M36 -60 C58 -60 58 -24 36 -24" fill="none" stroke="#23272D" stroke-width="7"/>`}
    ];
    const DOBRE = {"na-sirku": [[460, 435], [272, 455], [385, 470], [560, 488], [200, 478], [630, 470]], "na-vysku": [[445, 430], [330, 468], [395, 505], [520, 512], [262, 512], [490, 462]], "ctverec": [[455, 420], [300, 455], [390, 500], [520, 496], [250, 505], [575, 470]]};
    const S = {format: "na-sirku", tretiny: true, zlaty: false, diag: false, tez: true, pos: DOBRE["na-sirku"].map(q => q.slice())};
    const vrstva = {pozadi: svgEl("g", {}, svk), mrizka: svgEl("g", {}, svk), predmety: svgEl("g", {}, svk), info: svgEl("g", {}, svk)};
    const uzly = PREDMETY.map((pr, i) => { const g = svgEl("g", {"data-i": i, style: "cursor:grab"}); g.innerHTML = pr.svg + `<ellipse cx="0" cy="2" rx="${pr.w * .55}" ry="7" fill="#23272D" opacity=".12"/>`; g.insertBefore(g.lastChild, g.firstChild); return g; });
    const bbox = (i) => { const pr = PREDMETY[i], [x, y] = S.pos[i]; return {x0: x - pr.w / 2, x1: x + pr.w / 2, y0: y - pr.h, y1: y, w: pr.w, h: pr.h, plocha: pr.w * pr.h * pr.k}; };
    function kresli(){
      const [fx, fy, fw, fh] = FORMATY[S.format];
      vrstva.pozadi.innerHTML = `<rect x="0" y="0" width="800" height="600" fill="#E9E3D6"/><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="#FFFDF8" stroke="#23272D" stroke-width="1.5"/><rect x="${fx}" y="${fy + fh * .72}" width="${fw}" height="${fh * .28}" fill="#F1ECE1"/>`;
      let m = "";
      const L = (x1, y1, x2, y2, c, d = "") => m += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="1.3" ${d ? `stroke-dasharray="${d}"` : ""}/>`;
      if (S.tretiny){ [1, 2].forEach(k => { L(fx + fw * k / 3, fy, fx + fw * k / 3, fy + fh, "#3E8DB0"); L(fx, fy + fh * k / 3, fx + fw, fy + fh * k / 3, "#3E8DB0"); }); [1, 2].forEach(a => [1, 2].forEach(b => m += `<circle cx="${fx + fw * a / 3}" cy="${fy + fh * b / 3}" r="7" fill="none" stroke="#3E8DB0" stroke-width="2"/>`)); }
      if (S.zlaty){ [.382, .618].forEach(k => { L(fx + fw * k, fy, fx + fw * k, fy + fh, "#C69A5B", "8 5"); L(fx, fy + fh * k, fx + fw, fy + fh * k, "#C69A5B", "8 5"); }); }
      if (S.diag){ L(fx, fy, fx + fw, fy + fh, "#4E7A45", "3 5"); L(fx + fw, fy, fx, fy + fh, "#4E7A45", "3 5"); }
      vrstva.mrizka.innerHTML = m;
      // předměty – vzdálenější (výš) kreslíme dřív
      const poradi = PREDMETY.map((_, i) => i).sort((a, b) => S.pos[a][1] - S.pos[b][1]);
      vrstva.predmety.innerHTML = ""; poradi.forEach(i => { uzly[i].setAttribute("transform", `translate(${S.pos[i][0]} ${S.pos[i][1]})`); vrstva.predmety.appendChild(uzly[i]); });
      rozbor(fx, fy, fw, fh);
    }
    function rozbor(fx, fy, fw, fh){
      const bb = PREDMETY.map((_, i) => bbox(i)); const celk = bb.reduce((s, b) => s + b.plocha, 0);
      const tx = bb.reduce((s, b) => s + (b.x0 + b.x1) / 2 * b.plocha, 0) / celk, ty = bb.reduce((s, b) => s + (b.y0 + b.y1) / 2 * b.plocha, 0) / celk;
      const dom = bb.reduce((m, b, i) => b.plocha > bb[m].plocha ? i : m, 0), D = bb[dom];
      const dx = (D.x0 + D.x1) / 2, dy = D.y0 + D.h * .45;
      const body = []; [1, 2].forEach(a => [1, 2].forEach(b => body.push([fx + fw * a / 3, fy + fh * b / 3])));
      const blizko = Math.min(...body.map(([x, y]) => Math.hypot(x - dx, y - dy))) / Math.hypot(fw, fh);
      const stred = Math.hypot(dx - (fx + fw / 2), dy - (fy + fh / 2)) / Math.hypot(fw, fh);
      const U = {x0: Math.min(...bb.map(b => b.x0)), x1: Math.max(...bb.map(b => b.x1)), y0: Math.min(...bb.map(b => b.y0)), y1: Math.max(...bb.map(b => b.y1))};
      const zabira = ((U.x1 - U.x0) * (U.y1 - U.y0)) / (fw * fh);
      const okraj = bb.some(b => b.x0 < fx + 10 || b.x1 > fx + fw - 10 || b.y0 < fy + 10 || b.y1 > fy + fh - 6);
      let prekryv = 0, tecny = 0;
      for (let i = 0; i < bb.length; i++) for (let j = i + 1; j < bb.length; j++){
        const a = bb[i], b = bb[j];
        const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        if (ox > 8 && oy > 8) prekryv++; else if ((ox > -6 && ox <= 8 && oy > 8) || (oy > -6 && oy <= 8 && ox > 8)) tecny++;
      }
      const vyvaha = (tx - (fx + fw / 2)) / fw;
      const r = [];
      const ok = (b, t) => r.push(`<div style="margin:3px 0">${b ? "✔" : "✘"} ${t}</div>`);
      ok(Math.abs(vyvaha) < .09, Math.abs(vyvaha) < .09 ? "Kompozice je vyvážená." : `Kompozice je těžká ${vyvaha < 0 ? "vlevo" : "vpravo"} – přesuňte něco na druhou stranu.`);
      ok(blizko < .09, blizko < .09 ? "Dominanta (největší předmět) leží v silovém bodě." : stred < .08 ? "Dominanta je přesně uprostřed – klidné, ale nudné." : "Dominanta neleží v silovém bodě třetin.");
      ok(zabira > .3 && zabira < .9, zabira <= .3 ? "Sestava je na formátu moc malá." : zabira >= .9 ? "Sestava je natěsno – chybí vzduch." : "Sestava dobře vyplňuje formát.");
      ok(!okraj, okraj ? "Předmět naráží na okraj formátu nebo je useknutý." : "Předměty mají od okrajů odstup.");
      ok(prekryv > 0, prekryv > 0 ? `Překrývání (${prekryv}×) vytváří hloubku prostoru.` : "Nic se nepřekrývá – zátiší působí ploše.");
      if (tecny) ok(false, "Pozor na tečny: obrysy se jen dotýkají – překryjte je, nebo oddělte.");
      const body2 = r.filter(x => x.includes("✔")).length;
      $("#komp-readout").innerHTML = `<b>Rozbor: ${body2} / ${r.length}</b>` + r.join("");
      let inf = "";
      if (S.tez){ inf += `<g stroke="#B4532A" stroke-width="2.5"><line x1="${tx - 12}" y1="${ty}" x2="${tx + 12}" y2="${ty}"/><line x1="${tx}" y1="${ty - 12}" x2="${tx}" y2="${ty + 12}"/></g><circle cx="${tx}" cy="${ty}" r="5" fill="#B4532A"/><text x="${tx + 14}" y="${ty - 10}" style="font:600 18px Caveat,cursive;fill:#B4532A">těžiště</text><line x1="${fx + fw / 2}" y1="${fy + fh / 2 - 8}" x2="${fx + fw / 2}" y2="${fy + fh / 2 + 8}" stroke="#585E66"/><line x1="${fx + fw / 2 - 8}" y1="${fy + fh / 2}" x2="${fx + fw / 2 + 8}" y2="${fy + fh / 2}" stroke="#585E66"/>`; }
      inf += `<text x="${dx}" y="${D.y0 - 10}" text-anchor="middle" style="font:600 17px Caveat,cursive;fill:#23272D">dominanta</text>`;
      vrstva.info.innerHTML = inf;
    }
    let tah = null;
    svk.addEventListener("pointerdown", e => { const g = e.target.closest("[data-i]"); if (!g) return; const i = +g.dataset.i, b = svgBod(svk, e); tah = {i, ox: b.x - S.pos[i][0], oy: b.y - S.pos[i][1]}; svk.setPointerCapture(e.pointerId); g.style.cursor = "grabbing"; e.preventDefault(); });
    svk.addEventListener("pointermove", e => { if (!tah) return; const b = svgBod(svk, e), pr = PREDMETY[tah.i]; S.pos[tah.i] = [clamp(b.x - tah.ox, pr.w / 2, 800 - pr.w / 2), clamp(b.y - tah.oy, pr.h, 600)]; kresli(); });
    const pust = () => { if (tah){ uzly[tah.i].style.cursor = "grab"; tah = null; } };
    svk.addEventListener("pointerup", pust); svk.addEventListener("pointercancel", pust);
    segment('[aria-label="Formát"]', "data-format", v => { S.format = v; S.pos = DOBRE[v].map(q => q.slice()); kresli(); });
    $("#c-tretiny").addEventListener("change", e => { S.tretiny = e.target.checked; kresli(); });
    $("#c-zlaty").addEventListener("change", e => { S.zlaty = e.target.checked; kresli(); });
    $("#c-diag").addEventListener("change", e => { S.diag = e.target.checked; kresli(); });
    $("#c-tez").addEventListener("change", e => { S.tez = e.target.checked; kresli(); });
    $("#b-komp-ok").addEventListener("click", () => { S.pos = DOBRE[S.format].map(q => q.slice()); kresli(); });
    $("#b-komp-mix").addEventListener("click", () => { const [fx, fy, fw, fh] = FORMATY[S.format]; S.pos = PREDMETY.map(pr => [fx + pr.w / 2 + Math.random() * (fw - pr.w), fy + pr.h + Math.random() * (fh - pr.h)]); kresli(); });
    kresli();
  }

  /* ---------- Rozbor hotové kresby ---------- */
  const an = $("#analyza");
  if (an){
    const OBR = ["img/zatisi/cernobile-zatisi-02.webp", "img/zatisi/cernobile-zatisi-03.webp", "img/zatisi/cernobile-zatisi-04.webp"];
    an.innerHTML = `<img src="${OBR[0]}" alt="Kresba zátiší k rozboru kompozice" style="display:block;max-width:100%;max-height:540px;width:auto;height:auto;border-radius:3px"><svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></svg>`;
    const img = $("img", an), ov = $("svg", an);
    const L = (x1, y1, x2, y2, c, d) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="1.6" vector-effect="non-scaling-stroke" ${d ? `stroke-dasharray="${d}"` : ""}/>`;
    function kresli(){
      const zap = $$(".an-ov").filter(c => c.checked).map(c => c.value); let m = "";
      if (zap.includes("tretiny")) [33.333, 66.667].forEach(k => m += L(k, 0, k, 100, "#38C4F0") + L(0, k, 100, k, "#38C4F0"));
      if (zap.includes("zlaty")) [38.2, 61.8].forEach(k => m += L(k, 0, k, 100, "#F2C230", "6 4") + L(0, k, 100, k, "#F2C230", "6 4"));
      if (zap.includes("diag")) m += L(0, 0, 100, 100, "#7CC56A", "3 4") + L(100, 0, 0, 100, "#7CC56A", "3 4");
      if (zap.includes("stred")) m += L(46, 50, 54, 50, "#fff") + L(50, 46, 50, 54, "#fff") + L(45, 45, 55, 45, "#B4532A") + L(50, 40, 50, 50, "#B4532A");
      ov.innerHTML = m;
    }
    $$(".an-ov").forEach(c => c.addEventListener("change", kresli));
    segment('[aria-label="Obrázek"]', "data-an", v => { img.src = OBR[+v]; });
    kresli();
  }
});

/* =====================================================================
   6 RUCE – schéma ruky s ohýbáním prstů
   ===================================================================== */
priPanelu("ruce", () => {
  const cv = $("#cv-hand"); if (!cv) return;
  const S = {curl: .15, spread: .45, thumb: .25, rot: 0, rezim: "schema", oblouky: true};
  const PRSTY = [
    {bx: -.38, by: -.97, a0: -6, as: -14, L: [.44, .27, .2], w: .2},
    {bx: -.12, by: -1.02, a0: -1, as: 0, L: [.48, .3, .22], w: .21},
    {bx: .13, by: -.99, a0: 4, as: 10, L: [.45, .28, .21], w: .2},
    {bx: .36, by: -.9, a0: 9, as: 22, L: [.35, .21, .17], w: .17}
  ];
  const p = platno(cv, o => {
    const {ctx, w, h} = o, P = Math.min(h * .36, w * .34), PW = P * .92;
    const ox = w * .5, oy = h * .93, r = rad(S.rot);
    const T = (x, y) => [ox + x * Math.cos(r) - y * Math.sin(r), oy + x * Math.sin(r) + y * Math.cos(r)];
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#FBFAF6"; ctx.fillRect(0, 0, w, h);
    // dlaň
    const dlan = [[-.3 * PW, 0], [-.5 * PW, -.95 * P], [-.15 * PW, -1.04 * P], [.15 * PW, -1.02 * P], [.46 * PW, -.88 * P], [.3 * PW, 0]];
    ctx.fillStyle = S.rezim === "objem" ? "#E9DFCF" : "#F3EEE4"; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); dlan.forEach(([x, y], i) => i ? ctx.lineTo(...T(x, y)) : ctx.moveTo(...T(x, y))); ctx.closePath(); ctx.fill(); ctx.stroke();
    // prsty
    const body = PRSTY.map(f => {
      const ang = rad(f.a0 + f.as * S.spread); const dx = Math.sin(ang), dy = -Math.cos(ang);
      const ohyby = [80, 100, 70].map(b => b * S.curl);
      let x = f.bx * PW, y = f.by * P, kum = 0; const pts = [[x, y]], tony = [];
      f.L.forEach((l, i) => { kum += ohyby[i]; const c = Math.cos(rad(kum)); x += dx * l * P * c; y += dy * l * P * c; pts.push([x, y]); tony.push(c); });
      return {pts, tony, w: f.w * P};
    });
    // palec
    const tz = S.thumb, tAng = rad(-58 + 50 * tz), tb = [-.4 * PW, -.42 * P];
    const tp = [tb]; { let x = tb[0], y = tb[1], a = tAng; [.4, .3, .25].forEach((l, i) => { a += rad(i ? 18 * tz + 8 : 0); x += Math.sin(a) * l * P; y += -Math.cos(a) * l * P; tp.push([x, y]); }); }
    const kresliClanek = (a, b, sirka, ton) => {
      const A = T(...a), B = T(...b);
      if (S.rezim === "objem"){
        const g = Math.round(lerp(150, 236, clamp(ton, 0, 1)));
        ctx.strokeStyle = `rgb(${g + 6},${g - 4},${g - 18})`; ctx.lineWidth = sirka; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(...B); ctx.stroke();
        ctx.strokeStyle = "rgba(35,39,45,.55)"; ctx.lineWidth = 1.2;
        const d = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, nx = -(B[1] - A[1]) / d * sirka / 2, ny = (B[0] - A[0]) / d * sirka / 2;
        ctx.beginPath(); ctx.moveTo(A[0] + nx, A[1] + ny); ctx.lineTo(B[0] + nx, B[1] + ny); ctx.moveTo(A[0] - nx, A[1] - ny); ctx.lineTo(B[0] - nx, B[1] - ny); ctx.stroke();
      } else {
        ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(...B); ctx.stroke();
      }
    };
    // metakarpy (kosti dlaně) ve schématu
    if (S.rezim === "schema"){ ctx.strokeStyle = "rgba(35,39,45,.3)"; ctx.lineWidth = 1.5; body.forEach(f => { ctx.beginPath(); ctx.moveTo(...T(0, -.05 * P)); ctx.lineTo(...T(...f.pts[0])); ctx.stroke(); }); }
    const kresliPrst = f => { for (let i = 0; i < 3; i++) kresliClanek(f.pts[i], f.pts[i + 1], f.w * (1 - i * .12), .35 + .65 * Math.abs(f.tony[i])); };
    body.forEach(kresliPrst);
    for (let i = 0; i < 3; i++) kresliClanek(tp[i], tp[i + 1], P * (.26 - i * .03), .8);
    // klouby
    ctx.fillStyle = RED; [...body.flatMap(f => f.pts.slice(0, 3)), ...tp.slice(0, 3)].forEach(q => { ctx.beginPath(); ctx.arc(...T(...q), 4.2, 0, 7); ctx.fill(); });
    // nehty
    body.forEach(f => { const t = f.tony[2]; if (t < .35) return; const a = f.pts[2], b = f.pts[3]; const m = [lerp(a[0], b[0], .62), lerp(a[1], b[1], .62)]; ctx.strokeStyle = "rgba(35,39,45,.6)"; ctx.lineWidth = 1.2; ctx.beginPath(); const M = T(...m), B = T(...b); ctx.ellipse((M[0] + B[0]) / 2, (M[1] + B[1]) / 2, f.w * .28, Math.max(2, Math.hypot(B[0] - M[0], B[1] - M[1]) * .5), Math.atan2(B[1] - M[1], B[0] - M[0]) + Math.PI / 2, 0, 7); ctx.stroke(); });
    // oblouky kloubů
    if (S.oblouky){
      ctx.save(); ctx.strokeStyle = "rgba(180,83,42,.75)"; ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]);
      for (let k = 0; k < 4; k++){
        const q = body.map(f => T(...f.pts[k]));
        ctx.beginPath(); ctx.moveTo(...q[0]);
        for (let i = 1; i < q.length - 1; i++){ const mx = (q[i][0] + q[i + 1][0]) / 2, my = (q[i][1] + q[i + 1][1]) / 2; ctx.quadraticCurveTo(q[i][0], q[i][1], mx, my); }
        ctx.lineTo(...q[q.length - 1]); ctx.stroke();
      }
      ctx.restore();
    }
    popisek(ctx, 14, 22, S.curl > .55 ? "Sevřené prsty se v pohledu shora silně zkracují" : "Klouby leží na obloucích, ne v přímce", RED);
    popisek(ctx, 14, 46, "dlaň ≈ prostředníček", SOFT);
  });
  const vazba = (id, klic, out, fmt) => $(id).addEventListener("input", e => { S[klic] = klic === "rot" ? +e.target.value : e.target.value / 100; $(out).textContent = fmt(S[klic]); p.kresli(); });
  vazba("#r-curl", "curl", "#o-curl", v => Math.round(v * 100) + " %");
  vazba("#r-spread", "spread", "#o-spread", v => v < .3 ? "u sebe" : v > .7 ? "roztažené" : "střední");
  vazba("#r-thumb", "thumb", "#o-thumb", v => v < .35 ? "otevřený" : v > .7 ? "přes dlaň" : "střední");
  vazba("#r-hrot", "rot", "#o-hrot", v => v + "°");
  segment(null, "data-hmode", v => { S.rezim = v; p.kresli(); });
  $("#c-harcs").addEventListener("change", e => { S.oblouky = e.target.checked; p.kresli(); });
});

/* =====================================================================
   7 PORTRÉT – konstrukční hlava (Loomis) ve 3D
   ===================================================================== */
priPanelu("portret", () => {
  const cv = $("#cv-head"); if (!cv) return;
  const rY = $("#r-yaw"), rP = $("#r-pitch");
  rY.min = -90; rY.max = 90;
  const S = {yaw: -30, pitch: -8, guides: true, feat: true, hid: false};
  const arc = (f, a0, a1, n = 40) => { const r = []; for (let i = 0; i <= n; i++){ const t = lerp(a0, a1, i / n); r.push(f(t)); } return r; };
  const SIDE = .72, SR = Math.sqrt(1 - SIDE * SIDE);
  function model(){
    const M = [];
    const add = (pts, typ, normal) => M.push({pts, typ, normal});
    // boční roviny (kruhy)
    [-1, 1].forEach(sg => add(arc(t => [sg * SIDE, SR * Math.cos(t), SR * Math.sin(t)], 0, Math.PI * 2, 60), "guide", () => [sg, 0, 0]));
    // střední osa – na kouli a dolů k bradě
    add(arc(t => [0, Math.sin(t), Math.cos(t)], rad(-90), rad(90)).reverse().concat([[0, -.69, .98], [0, -1.05, .9], [0, -1.38, .74]]), "osa", q => q[1] > -.7 ? q : [0, -.15, 1]);
    add(arc(t => [0, Math.sin(t), -Math.cos(t)], rad(-90), rad(90)), "osa", q => q);
    // linie obočí, vlasů, nosu
    const lat = (y, rr, a = 46) => arc(t => [rr * Math.sin(t), y, rr * Math.cos(t)], rad(-a), rad(a));
    add(lat(0, 1), "guide", q => q);
    add(lat(.69, SR, 48), "guide", q => q);
    add(lat(-.69, SR, 48).map(q => [q[0] * 1.05, q[1], q[2] + .2]), "guide", () => [0, -.1, 1]);
    // linie očí
    add(lat(-.19, Math.sqrt(1 - .19 * .19), 42), "oci", q => q);
    // čelist a brada
    [-1, 1].forEach(sg => add([[sg * .7, -.42, -.24], [sg * .64, -.82, -.12], [sg * .5, -1.13, .28], [sg * .26, -1.34, .64], [0, -1.39, .74]], "obrys", () => [sg * .8, -.3, .5]));
    add(arc(t => [.22 * Math.sin(t), -1.36 - .03 * Math.cos(t), .7 + .05 * Math.cos(t)], rad(-90), rad(90), 12), "guide", () => [0, -.4, 1]);
    // krk
    [-1, 1].forEach(sg => add([[sg * .4, -.95, -.3], [sg * .42, -1.85, -.3]], "obrys", () => [sg, 0, .3]));
    if (S.feat){
      // oči
      [-1, 1].forEach(sg => {
        const cx = sg * .33, cy = -.19;
        const z = (x, y) => Math.sqrt(Math.max(0, 1 - x * x - y * y)) * .99 + .01;
        add(arc(t => { const x = cx + .13 * Math.cos(t), y = cy + .05 * Math.sin(t) * (1 + .25 * sg * Math.cos(t)); return [x, y, z(x, y)]; }, 0, Math.PI * 2, 30), "rys", () => [cx, cy, z(cx, cy)]);
        add(arc(t => { const x = cx + .045 * Math.cos(t), y = cy + .045 * Math.sin(t); return [x, y, z(x, y) + .005]; }, 0, Math.PI * 2, 16), "zornice", () => [cx, cy, z(cx, cy)]);
        add(arc(t => { const x = cx + .17 * Math.cos(t), y = cy + .14 + .05 * Math.sin(t); return [x, y, z(x, y) + .02]; }, rad(20), rad(160), 14), "rys", () => [cx, cy, 1]);
      });
      // nos
      add([[0, -.08, 1.0], [0, -.5, 1.13], [0, -.62, 1.12], [0, -.69, 1.02]], "rys", () => [0, -.2, 1]);
      [-1, 1].forEach(sg => add([[sg * .02, -.66, 1.06], [sg * .12, -.68, 1.0], [sg * .14, -.6, .96]], "rys", () => [sg * .4, -.3, 1]));
      // ústa
      add(arc(t => [t, -.92 + .015 * Math.cos(t * 12), .9 - .5 * t * t], -.24, .24, 16), "rys", () => [0, -.2, 1]);
      add(arc(t => [t, -1.0 - .04 * (1 - (t / .2) ** 2), .88 - .5 * t * t], -.18, .18, 12), "rys", () => [0, -.2, 1]);
      // uši
      [-1, 1].forEach(sg => add(arc(t => [sg * (SIDE + .03), -.33 + .3 * Math.sin(t), -.1 + .15 * Math.cos(t)], 0, Math.PI * 2, 24), "ucho", () => [sg, 0, -.05]));
    }
    return M;
  }
  const p = platno(cv, o => {
    const {ctx, w, h} = o, R = Math.min(w * .26, h * .27), cx = w * .5, cy = h * .37;
    const cyw = Math.cos(rad(S.yaw)), syw = Math.sin(rad(S.yaw)), cp = Math.cos(rad(S.pitch)), sp = Math.sin(rad(S.pitch));
    const rot = ([x, y, z]) => { const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw; const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp; return [x1, y2, z2]; };
    const pr = q => { const [x, y, z] = rot(q); const k = 1 / (1 - z * .06); return [cx + x * R * k, cy - y * R * k, z]; };
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#FBFAF6"; ctx.fillRect(0, 0, w, h);
    // koule
    ctx.fillStyle = "#fff"; ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); ctx.stroke();
    const M = model();
    const styl = {guide: [BLUE, 1.6], osa: [RED, 2], oci: [RED, 1.4], obrys: [INK, 2.2], rys: [INK, 2], zornice: [INK, 1.6], ucho: [INK, 1.8]};
    M.forEach(m => {
      if (!S.guides && (m.typ === "guide" || m.typ === "osa" || m.typ === "oci")) return;
      const P = m.pts.map(pr);
      for (let i = 0; i < P.length - 1; i++){
        const mid = m.pts[i].map((v, k) => (v + m.pts[i + 1][k]) / 2);
        const n = m.normal(mid); const vis = rot(n)[2] > -0.02;
        if (!vis && !S.hid) continue;
        ctx.save(); const [c, lw] = styl[m.typ];
        ctx.strokeStyle = c; ctx.lineWidth = vis ? lw : 1; ctx.globalAlpha = vis ? 1 : .35; if (!vis) ctx.setLineDash([4, 4]);
        if (m.typ === "zornice" && vis){ ctx.fillStyle = INK; }
        ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[i + 1][0], P[i + 1][1]); ctx.stroke(); ctx.restore();
      }
      if (m.typ === "zornice"){ const c = m.normal(); if (rot(c)[2] > .1){ const q = pr(c); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(q[0], q[1], R * .03, 0, 7); ctx.fill(); } }
    });
    if (S.guides){
      const pop = (q, t, b = RED) => { const s = pr(q); if (rot(q)[2] > -0.05) popisek(ctx, s[0] + 10, s[1] - 10, t, b); };
      pop([0, .69, SR], "vlasy", BLUE); pop([0, 0, 1], "obočí", BLUE); pop([0, -.69, .98], "nos", BLUE); pop([0, -1.38, .74], "brada", RED);
    }
    const txt = Math.abs(S.yaw) < 8 && Math.abs(S.pitch) < 8 ? "En face – osa obličeje je svislá přímka, linie jsou vodorovné." :
                Math.abs(S.yaw) > 70 ? "Profil – boční rovina hlavy je kruh, osa obličeje je na obrysu." :
                Math.abs(S.pitch) > 18 ? (S.pitch > 0 ? "Pohled shora – linie se prohýbají dolů, vidíte temeno." : "Pohled zdola – linie se prohýbají nahoru, brada překrývá krk.") :
                "Tříčtvrteční pohled – osa obličeje se zakřivuje po kouli, vzdálenější oko je užší.";
    popisek(ctx, 14, h - 18, txt, SOFT);
  });
  const sync = () => { $("#o-yaw").textContent = Math.round(S.yaw) + "°"; $("#o-pitch").textContent = Math.round(S.pitch) + "°"; rY.value = S.yaw; rP.value = S.pitch; p.kresli(); };
  rY.addEventListener("input", () => { S.yaw = +rY.value; sync(); });
  rP.addEventListener("input", () => { S.pitch = +rP.value; sync(); });
  $("#c-hguides").addEventListener("change", e => { S.guides = e.target.checked; p.kresli(); });
  $("#c-hfeat").addEventListener("change", e => { S.feat = e.target.checked; p.kresli(); });
  $("#c-hhid").addEventListener("change", e => { S.hid = e.target.checked; p.kresli(); });
  $$("[data-hpose]").forEach(b => b.addEventListener("click", () => { const [y, pt] = b.dataset.hpose.split(",").map(Number); S.yaw = y; S.pitch = pt; sync(); }));
  let st = null;
  tahni(cv, { down: (x, y) => st = {x, y, yaw: S.yaw, pitch: S.pitch}, move: (x, y) => { if (!st) return; S.yaw = clamp(st.yaw + (x - st.x) * .45, -90, 90); S.pitch = clamp(st.pitch + (y - st.y) * .35, -25, 25); sync(); }, up: () => st = null });
  cv.style.cursor = "grab";
  sync();
});

/* =====================================================================
   8 LEBKA – interaktivní atlas
   ===================================================================== */
priPanelu("lebka", () => {
  const sv = $("#sv-lebka"); if (!sv) return;
  const POPIS = {
    celni: ["Čelní kost", "Tvoří čelo a přechází do klenby lebky. Na hlavě je to největší souvislá světlá plocha – často zde bývá lesk."],
    temenni: ["Temenní kost", "Párová kost tvořící klenbu lebky. Z profilu ukazuje, jak daleko za obličej lebka sahá – začátečníci ji kreslí moc malou."],
    tylni: ["Týlní kost", "Uzavírá lebku vzadu a dole, navazuje na ni páteř a svaly krku."],
    spankova: ["Spánková kost", "Boční kost lebky okolo ucha. Spánková jamka je mírně propadlá – na spáncích proto vzniká stín."],
    nadocnicovy: ["Nadočnicový oblouk", "Hrana nad očnicí. Vrhá stín do očí a určuje linii obočí."],
    ocnice: ["Očnice", "Hluboké jamky pro oční koule ve tvaru zaobleného čtverce, mírně skloněné ven a dolů. V kresbě lebky jsou nejtmavší."],
    nosni_kost: ["Nosní kosti", "Tvoří jen horní část hřbetu nosu. Zbytek nosu je chrupavka, která se na lebce nezachovává."],
    nosni_otvor: ["Nosní otvor", "Má tvar obrácené hrušky. Jeho spodní okraj odpovídá spodku nosu na živé tváři."],
    licni: ["Lícní (jařmová) kost", "Nejširší místo obličeje. Odděluje čelní a boční rovinu tváře – právě zde se na portrétu láme světlo a stín."],
    jarmovy: ["Jařmový oblouk", "Vede z lícní kosti vodorovně dozadu ke zvukovodu. Z profilu je to důležitá vodorovná linie."],
    horni_celist: ["Horní čelist", "Nese horní zuby a tvoří spodní okraj nosního otvoru."],
    zuby: ["Zuby", "Leží na oblouku – při natočení hlavy se zkracují stejně jako elipsa. Kreslete je jako celek, ne zub po zubu."],
    dolni_celist: ["Dolní čelist (mandibula)", "Jediná pohyblivá kost lebky. Tvoří bradu a úhel čelisti pod uchem."],
    zvukovod: ["Vnější zvukovod", "Otvor ucha. Leží zhruba v polovině délky lebky, za lícní kostí – tam patří na portrétu ucho."],
    bradavkovy: ["Bradavkový výběžek", "Výstupek za uchem. Upíná se na něj kývač – výrazný sval na boku krku."]
  };
  const PREDNI = {
    kresba: `<g transform="translate(30 -6)" fill="none" stroke="#23272D" stroke-width="2.2" stroke-linejoin="round">
      <path d="M68 218 A136 150 0 1 1 332 218" />
      <path d="M68 218 C58 252 58 292 72 312 C80 336 94 360 100 386 C106 420 150 458 200 460 C250 458 294 420 300 386 C306 360 320 336 332 312 C342 292 342 252 332 218"/>
      <path d="M110 224 C112 212 172 210 182 222 C192 240 186 284 166 292 C140 298 112 290 106 270 C102 252 104 234 110 224Z" fill="#3B4048"/>
      <path d="M290 224 C288 212 228 210 218 222 C208 240 214 284 234 292 C260 298 288 290 294 270 C298 252 296 234 290 224Z" fill="#3B4048"/>
      <path d="M200 296 C188 299 178 324 182 340 C186 348 195 345 200 338 C205 345 214 348 218 340 C222 324 212 299 200 296Z" fill="#23272D"/>
      <path d="M72 300 C100 296 120 304 136 318 M328 300 C300 296 280 304 264 318" stroke-width="1.6"/>
      <path d="M142 370 Q200 360 258 370 L256 394 Q200 400 144 394Z M146 396 Q200 402 254 396 L250 414 Q200 420 150 414Z" fill="#fff" stroke-width="1.6"/>
      ${Array.from({length: 8}, (_, i) => `<line x1="${158 + i * 12}" y1="370" x2="${158 + i * 12}" y2="414" stroke-width="1"/>`).join("")}
      <path d="M100 386 C116 402 132 410 146 414 M300 386 C284 402 268 410 254 414" stroke-width="1.6"/>
    </g>`,
    casti: [
      ["celni", "M68 218 A136 150 0 1 1 332 218 C300 206 230 206 218 222 L182 222 C170 206 100 206 68 218Z"],
      ["spankova", "M70 220 C64 250 70 280 86 300 C92 270 88 245 70 220Z M330 220 C336 250 330 280 314 300 C308 270 312 245 330 220Z"],
      ["nadocnicovy", "M104 222 C130 202 176 204 186 220 L182 230 C168 216 130 214 108 234Z M296 222 C270 202 224 204 214 220 L218 230 C232 216 270 214 292 234Z"],
      ["ocnice", "M110 232 C114 222 172 220 180 230 C188 246 184 282 166 290 C140 296 114 288 108 270 C104 254 106 240 110 232Z M290 232 C286 222 228 220 220 230 C212 246 216 282 234 290 C260 296 286 288 292 270 C296 254 294 240 290 232Z"],
      ["nosni_kost", "M188 236 L212 236 L208 294 L192 294Z"],
      ["nosni_otvor", "M200 296 C188 299 178 324 182 340 C186 348 195 345 200 338 C205 345 214 348 218 340 C222 324 212 299 200 296Z"],
      ["licni", "M70 296 C100 290 126 300 140 322 C122 330 100 326 80 316Z M330 296 C300 290 274 300 260 322 C278 330 300 326 320 316Z"],
      ["horni_celist", "M140 324 C160 338 178 350 200 352 C222 350 240 338 260 324 L260 368 Q200 358 140 368Z"],
      ["zuby", "M142 370 Q200 360 258 370 L256 394 Q200 400 144 394Z M146 396 Q200 402 254 396 L250 414 Q200 420 150 414Z"],
      ["dolni_celist", "M100 386 C106 420 150 458 200 460 C250 458 294 420 300 386 C290 402 270 412 254 416 Q200 424 146 416 C130 412 110 402 100 386Z"]
    ]
  };
  const PROFIL = {
    kresba: `<g fill="none" stroke="#23272D" stroke-width="2.2" stroke-linejoin="round">
      <path d="M110 300 C72 278 52 210 70 150 C92 82 160 46 240 44 C320 44 372 92 384 158 C387 176 386 186 381 196 C390 204 398 214 400 226 C392 230 386 236 384 244 C390 262 390 282 382 298 L380 300"/>
      <path d="M110 300 C130 312 160 306 190 290"/>
      <path d="M250 46 C258 100 262 150 268 196 M112 92 C122 150 140 210 160 262 M170 236 C200 196 260 190 290 216" stroke-width="1" stroke-dasharray="3 4"/>
      <path d="M318 196 C334 186 358 192 364 210 C368 228 352 244 334 242 C318 240 310 210 318 196Z" fill="#3B4048"/>
      <path d="M384 246 C372 250 366 270 376 292 C384 280 388 262 384 246Z" fill="#23272D"/>
      <path d="M298 250 C318 242 346 246 356 264 C344 274 318 274 300 264Z M300 254 L236 248 L236 262 L300 264"/>
      <circle cx="222" cy="264" r="10" fill="#23272D"/>
      <path d="M196 278 C200 302 214 308 222 296"/>
      <path d="M330 298 L380 300 L378 318 L332 316Z" fill="#fff" stroke-width="1.6"/>
      <path d="M334 320 L376 322 L374 338 L336 336Z" fill="#fff" stroke-width="1.6"/>
      ${Array.from({length: 4}, (_, i) => `<line x1="${342 + i * 10}" y1="298" x2="${342 + i * 10}" y2="338" stroke-width="1"/>`).join("")}
      <path d="M332 318 L378 320 C382 342 378 362 364 372 C336 380 296 366 270 350 C258 336 252 306 258 280 C262 272 272 272 272 282 C272 306 280 326 300 334 C312 330 322 322 332 318Z"/>
    </g>`,
    casti: [
      ["celni", "M250 46 C320 44 372 92 384 158 C387 176 386 186 381 196 L330 190 C300 196 280 200 268 196 C262 150 258 100 250 46Z"],
      ["temenni", "M250 46 C258 100 262 150 268 196 C240 190 200 200 175 228 C150 180 130 140 112 92 C150 60 200 46 250 46Z"],
      ["tylni", "M112 92 C122 150 140 210 160 262 C150 290 130 302 110 300 C72 278 52 210 70 150 C80 122 95 104 112 92Z"],
      ["spankova", "M175 228 C200 200 250 192 290 216 C296 236 296 244 290 250 L236 246 C214 246 200 250 190 262 C182 252 178 240 175 228Z"],
      ["nadocnicovy", "M318 190 C340 180 368 184 382 196 L378 204 C362 194 338 192 320 198Z"],
      ["ocnice", "M318 196 C334 186 358 192 364 210 C368 228 352 244 334 242 C318 240 310 210 318 196Z"],
      ["nosni_kost", "M380 198 C390 204 398 214 400 226 C392 230 386 236 384 244 L374 236 C378 222 378 210 380 198Z"],
      ["nosni_otvor", "M384 246 C372 250 366 270 376 292 C384 280 388 262 384 246Z"],
      ["licni", "M298 250 C318 242 346 246 356 264 C344 274 318 274 300 264Z"],
      ["jarmovy", "M300 254 L236 248 L236 262 L300 264Z"],
      ["zvukovod", "M222 252 A12 12 0 1 1 221.9 252Z"],
      ["bradavkovy", "M196 278 C200 302 214 308 222 296 L224 280 C214 278 204 276 196 278Z"],
      ["horni_celist", "M302 268 C322 278 350 280 380 292 L380 300 L330 298 C318 290 306 282 296 272Z"],
      ["zuby", "M330 298 L380 300 L378 318 L332 316Z M334 320 L376 322 L374 338 L336 336Z"],
      ["dolni_celist", "M336 338 L374 340 C372 356 370 364 364 372 C336 380 296 366 270 350 C258 336 252 306 258 280 C262 272 272 272 272 282 C272 306 280 326 300 334 C312 334 324 336 336 338Z"]
    ]
  };
  let pohled = "front", aktivni = null;
  function vykresli(){
    const D = pohled === "front" ? PREDNI : PROFIL;
    sv.innerHTML = `<rect width="460" height="460" fill="#fff"/>` + D.kresba +
      `<g ${pohled === "front" ? 'transform="translate(30 -6)"' : 'transform="translate(10 40)"'}>` + D.casti.map(([id, d]) => `<path d="${d}" data-part="${id}" fill="rgba(180,83,42,0)" stroke="transparent" stroke-width="2" style="cursor:pointer;transition:fill .2s"/>`).join("") + `</g>`;
    if (pohled === "profil"){ const g = sv.querySelector("g"); g.setAttribute("transform", "translate(10 40)"); }
    $("#lebka-list").innerHTML = D.casti.map(([id]) => `<li><button type="button" class="btn btn-small btn-ghost" data-lp="${id}" style="padding:5px 10px;font-size:13.5px">${POPIS[id][0]}</button></li>`).join("");
    if (aktivni && D.casti.some(c => c[0] === aktivni)) zvyrazni(aktivni); else aktivni = null;
  }
  function zvyrazni(id){
    aktivni = id;
    $$("[data-part]", sv).forEach(p => { const on = p.dataset.part === id; p.setAttribute("fill", on ? "rgba(180,83,42,.42)" : "rgba(180,83,42,0)"); p.setAttribute("stroke", on ? "#B4532A" : "transparent"); });
    $$("[data-lp]").forEach(b => b.setAttribute("aria-pressed", b.dataset.lp === id));
    $("#lebka-readout").innerHTML = `<b>${POPIS[id][0]}</b><br>${POPIS[id][1]}`;
  }
  sv.addEventListener("pointerover", e => { const p = e.target.closest("[data-part]"); if (p) zvyrazni(p.dataset.part); });
  sv.addEventListener("click", e => { const p = e.target.closest("[data-part]"); if (p) zvyrazni(p.dataset.part); });
  $("#lebka-list").addEventListener("click", e => { const b = e.target.closest("[data-lp]"); if (b) zvyrazni(b.dataset.lp); });
  segment(null, "data-lview", v => { pohled = v; vykresli(); });
  vykresli();
});

/* =====================================================================
   9 FIGURA – kánon postavy a kreslicí panák
   ===================================================================== */
priPanelu("figura", () => {
  /* ---------- Kánon ---------- */
  const sk = $("#sv-kanon");
  if (sk){
    const TYPY = {
      muz:  {n: 8, head: [.34, .5], neck: [.22, 1.0, 1.28], sh: [1.0, 1.42], ch: [.84, 2.0], wa: [.62, 2.95], hp: [.76, 3.6], cr: 4.0, leg: .4, th: .36, kn: [5.75, .22], an: [7.72, .12], arm: [[.94, 1.5], [1.08, 3.0], [1.12, 4.0], [1.14, 4.72]], aw: .22,
              txt: "Muž: výška 8 hlav, ramena asi 2 hlavy široká, boky užší než ramena. Polovina výšky leží v rozkroku."},
      zena: {n: 8, head: [.32, .5], neck: [.17, 1.0, 1.3], sh: [.84, 1.45], ch: [.74, 2.0], wa: [.5, 2.85], hp: [.84, 3.65], cr: 4.0, leg: .42, th: .38, kn: [5.75, .2], an: [7.72, .11], arm: [[.78, 1.52], [.94, 2.95], [1.0, 3.95], [1.02, 4.65]], aw: .18,
              txt: "Žena: ramena užší (asi 1,7 hlavy), pas výš a užší, boky stejně široké nebo širší než ramena. Krk je delší a štíhlejší."},
      dite: {n: 6, head: [.38, .5], neck: [.2, 1.0, 1.12], sh: [.72, 1.22], ch: [.66, 1.75], wa: [.58, 2.4], hp: [.62, 2.85], cr: 3.15, leg: .3, th: .26, kn: [4.5, .17], an: [5.78, .11], arm: [[.68, 1.3], [.8, 2.3], [.84, 3.0], [.86, 3.45]], aw: .17,
              txt: "Dítě (asi 6 let): jen 6 hlav – hlava je vůči tělu velká, nohy kratší. Polovina výšky leží nad rozkrokem, u pupku."}
    };
    const JMENA8 = ["brada", "bradavky", "pupek", "rozkrok", "½ stehen", "pod kolenem", "½ lýtek", "chodidla"];
    const JMENA6 = ["brada", "bradavky", "pupek", "rozkrok", "kolena", "chodidla"];
    function kanon(typ){
      const T = TYPY[typ], U = 560 / T.n, X = 260, Y0 = 34, x = v => X + v * U, y = v => Y0 + v * U;
      let s = `<rect width="520" height="620" fill="#fff"/>`;
      for (let k = 0; k <= T.n; k++){ s += `<line x1="40" y1="${y(k)}" x2="500" y2="${y(k)}" stroke="#3E8DB0" stroke-width="1" stroke-dasharray="${k % 1 ? "" : "5 5"}" opacity=".6"/>`; if (k) { s += `<text x="24" y="${y(k) - U / 2 + 5}" text-anchor="middle" style="font:700 15px Barlow Condensed,sans-serif;fill:#585E66">${k}</text><text x="504" y="${y(k) - 6}" text-anchor="end" style="font:600 13px Barlow,sans-serif;fill:#585E66">${(T.n === 8 ? JMENA8 : JMENA6)[k - 1]}</text>`; } }
      // obrys těla: trup + nohy (levá polovina, pak zrcadlově)
      const L = [[-T.neck[0], T.neck[1]], [-T.neck[0], T.neck[2]], [-T.sh[0] + .1, T.sh[1] - .05], [-T.sh[0], T.sh[1] + .25], [-T.ch[0], T.ch[1]], [-T.wa[0], T.wa[1]], [-T.hp[0], T.hp[1]], [-(T.leg + T.th), T.cr + .5], [-(T.leg + T.kn[1] + .02), T.kn[0]], [-(T.leg + T.kn[1] * .9), T.kn[0] + .6], [-(T.leg + T.an[1]), T.an[0]], [-(T.leg + .2), T.n], [-(T.leg - .12), T.n], [-(T.leg - T.an[1]), T.an[0]], [-(T.leg - T.kn[1] * .8), T.kn[0] + .4], [-(T.leg - T.kn[1]), T.kn[0]], [-(T.leg - T.th + .08), T.cr + .5], [0, T.cr]];
      const R = L.slice(0, -1).reverse().map(([a, b]) => [-a, b]);
      const body = [...L, ...R];
      const hladce = pts => { let d = `M${x(pts[0][0])} ${y(pts[0][1])}`; for (let i = 1; i < pts.length - 1; i++){ const mx = (x(pts[i][0]) + x(pts[i + 1][0])) / 2, my = (y(pts[i][1]) + y(pts[i + 1][1])) / 2; d += ` Q${x(pts[i][0])} ${y(pts[i][1])} ${mx} ${my}`; } return d + ` L${x(pts[pts.length - 1][0])} ${y(pts[pts.length - 1][1])}`; };
      s += `<path d="${hladce(body)}Z" fill="#E9DFCF" stroke="#23272D" stroke-width="2"/>`;
      [-1, 1].forEach(sg => { const a = T.arm; s += `<path d="M${x(sg * a[0][0])} ${y(a[0][1])} L${x(sg * a[1][0])} ${y(a[1][1])} L${x(sg * a[2][0])} ${y(a[2][1])} L${x(sg * a[3][0])} ${y(a[3][1])}" fill="none" stroke="#E9DFCF" stroke-width="${T.aw * U}" stroke-linecap="round" stroke-linejoin="round"/><path d="M${x(sg * a[0][0])} ${y(a[0][1])} L${x(sg * a[1][0])} ${y(a[1][1])} L${x(sg * a[2][0])} ${y(a[2][1])} L${x(sg * a[3][0])} ${y(a[3][1])}" fill="none" stroke="#23272D" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`; a.slice(0, 3).forEach(q => s += `<circle cx="${x(sg * q[0])}" cy="${y(q[1])}" r="4.5" fill="#B4532A"/>`); });
      s += `<ellipse cx="${X}" cy="${y(T.head[1])}" rx="${T.head[0] * U}" ry="${.5 * U}" fill="#E9DFCF" stroke="#23272D" stroke-width="2"/>`;
      // šířka ramen
      s += `<line x1="${x(-T.sh[0])}" y1="${y(T.sh[1]) - 14}" x2="${x(T.sh[0])}" y2="${y(T.sh[1]) - 14}" stroke="#B4532A" stroke-width="2"/><text x="${x(T.sh[0]) + 12}" y="${y(T.sh[1]) - 8}" style="font:600 17px Caveat,cursive;fill:#B4532A">ramena ${cz(T.sh[0] * 2)} hlavy</text>`;
      s += `<line x1="${x(-T.hp[0])}" y1="${y(T.hp[1])}" x2="${x(T.hp[0])}" y2="${y(T.hp[1])}" stroke="#B4532A" stroke-width="2" stroke-dasharray="4 3"/>`;
      s += `<line x1="40" y1="${y(T.n / 2)}" x2="500" y2="${y(T.n / 2)}" stroke="#B4532A" stroke-width="1.5"/><text x="44" y="${y(T.n / 2) - 6}" style="font:600 16px Caveat,cursive;fill:#B4532A">polovina výšky</text>`;
      sk.innerHTML = s; $("#kanon-txt").textContent = T.txt;
    }
    segment(null, "data-kanon", kanon); kanon("muz");
  }

  /* ---------- Kreslicí panák ---------- */
  const cv = $("#cv-figure"); if (!cv) return;
  // kosti: rodič, délka (v hlavách), šířka objemu
  const KOSTI = {
    trup: [null, 2.35, .0], krk: ["trup", .32, .0], hlava: ["krk", .95, .0],
    ramL: ["trup", .9, 0], ramP: ["trup", .9, 0],
    paL: ["ramL", 1.45, .36], pL: ["paL", 1.25, .3], rL: ["pL", .6, .2],
    paP: ["ramP", 1.45, .36], pP: ["paP", 1.25, .3], rP: ["pP", .6, .2],
    kycL: [null, .42, 0], kycP: [null, .42, 0],
    stL: ["kycL", 1.95, .52], lyL: ["stL", 1.85, .4], chL: ["lyL", .55, .2],
    stP: ["kycP", 1.95, .52], lyP: ["stP", 1.85, .4], chP: ["lyP", .55, .2]
  };
  const POZY = {
    "Stoj":       {root: [0, 3.75], trup: -90, krk: -90, hlava: -90, ramL: 180, ramP: 0, paL: 96, pL: 94, rL: 92, paP: 84, pP: 86, rP: 88, kycL: 180, kycP: 0, stL: 92, lyL: 90, chL: 130, stP: 88, lyP: 90, chP: 50},
    "Kontrapost": {root: [.1, 3.8], trup: -94, krk: -86, hlava: -84, ramL: 186, ramP: 6, paL: 100, pL: 96, rL: 95, paP: 70, pP: 140, rP: 150, kycL: 190, kycP: 10, stL: 102, lyL: 82, chL: 140, stP: 95, lyP: 92, chP: 40},
    "Chůze":      {root: [0, 3.85], trup: -88, krk: -84, hlava: -84, ramL: 182, ramP: 2, paL: 118, pL: 105, rL: 100, paP: 62, pP: 40, rP: 40, kycL: 182, kycP: 2, stL: 62, lyL: 88, chL: 10, stP: 118, lyP: 138, chP: 60},
    "Běh":        {root: [0, 3.8], trup: -72, krk: -70, hlava: -76, ramL: 175, ramP: -5, paL: 140, pL: 70, rL: 60, paP: 30, pP: -60, rP: -50, kycL: 175, kycP: -5, stL: 25, lyL: 105, chL: 10, stP: 130, lyP: 170, chP: 100},
    "Sed":        {root: [-.4, 5.0], trup: -95, krk: -88, hlava: -86, ramL: 182, ramP: 2, paL: 80, pL: 10, rL: 10, paP: 86, pP: 20, rP: 20, kycL: 182, kycP: 2, stL: 4, lyL: 92, chL: 0, stP: 8, lyP: 96, chP: 10},
    "Skok":       {root: [0, 3.4], trup: -92, krk: -94, hlava: -96, ramL: 182, ramP: -2, paL: -130, pL: -115, rL: -110, paP: -50, pP: -66, rP: -70, kycL: 182, kycP: -2, stL: 120, lyL: 60, chL: 120, stP: 60, lyP: 120, chP: 60},
    "Předklon":   {root: [-.6, 3.75], trup: -15, krk: -5, hlava: 20, ramL: 75, ramP: -105, paL: 92, pL: 90, rL: 90, paP: 96, pP: 92, rP: 92, kycL: 180, kycP: 0, stL: 94, lyL: 90, chL: 0, stP: 86, lyP: 90, chP: 0}
  };
  const S = {abs: {}, root: [0, 3.75], linie: true, objem: true, osy: true, tez: false};
  function nastavPozu(jm, sum = 0){
    const P = POZY[jm]; S.root = P.root.slice();
    Object.keys(KOSTI).forEach(k => S.abs[k] = P[k] + (sum ? (Math.random() - .5) * sum : 0));
    p.kresli();
  }
  function klouby(){
    const J = {}, U = G.U;
    const pz = [G.ox + S.root[0] * U, G.oy + S.root[1] * U]; J.root = pz;
    const konec = (start, k) => { const a = rad(S.abs[k]), L = KOSTI[k][1] * U; return [start[0] + Math.cos(a) * L, start[1] + Math.sin(a) * L]; };
    const start = k => { const r = KOSTI[k][0]; if (!r) return pz; if (k === "ramL" || k === "ramP"){ const t = J.trup0, e = J.trup; return [lerp(t[0], e[0], .9), lerp(t[1], e[1], .9)]; } return J[r]; };
    ["trup", "krk", "hlava", "ramL", "ramP", "paL", "pL", "rL", "paP", "pP", "rP", "kycL", "kycP", "stL", "lyL", "chL", "stP", "lyP", "chP"].forEach(k => {
      const s = start(k); if (k === "trup") J.trup0 = s; J[k + "0"] = s; J[k] = konec(s, k);
    });
    return J;
  }
  let G = {ox: 0, oy: 0, U: 50};
  const p = platno(cv, o => {
    const {ctx, w, h} = o; G.U = Math.min(h * .84 / 8.4, w * .085); G.ox = w * .5; G.oy = h * .05;
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#FBFAF6"; ctx.fillRect(0, 0, w, h);
    if (!S.abs.trup) Object.keys(KOSTI).forEach(k => S.abs[k] = POZY["Stoj"][k]);
    const J = klouby(), U = G.U;
    // země
    const zem = Math.max(J.chL[1], J.chP[1], J.lyL[1], J.lyP[1]) + 4;
    ctx.strokeStyle = "rgba(35,39,45,.18)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, zem); ctx.lineTo(w, zem); ctx.stroke();
    // linie pohybu
    if (S.linie){
      const stojna = J.lyL[1] > J.lyP[1] ? "L" : "P";
      const pts = [J.hlava, J.krk0, [lerp(J.trup0[0], J.trup[0], .5), lerp(J.trup0[1], J.trup[1], .5)], J.root, J["st" + stojna], J["ly" + stojna]];
      ctx.save(); ctx.strokeStyle = "rgba(180,83,42,.35)"; ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(...pts[0]);
      for (let i = 1; i < pts.length - 1; i++){ const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
      ctx.lineTo(...pts[pts.length - 1]); ctx.stroke(); ctx.restore();
    }
    const usek = (a, b, wd, barva) => { ctx.strokeStyle = barva; ctx.lineWidth = wd; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); };
    // objemy
    if (S.objem){
      const tel = "#E7DED0", tel2 = "#DCCFBC";
      // vzdálenější končetiny (levá) tmavší
      [["paL", tel2], ["pL", tel2], ["stL", tel2], ["lyL", tel2], ["rL", tel2], ["chL", tel2]].forEach(([k, c]) => usek(J[k + "0"], J[k], KOSTI[k][2] * U, c));
      // hrudník a pánev
      const t0 = J.trup0, t1 = J.trup, a = Math.atan2(t1[1] - t0[1], t1[0] - t0[0]);
      ctx.save(); ctx.translate(lerp(t0[0], t1[0], .66), lerp(t0[1], t1[1], .66)); ctx.rotate(a); ctx.fillStyle = tel; ctx.strokeStyle = "rgba(35,39,45,.6)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, 0, U * .78, U * .72, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(lerp(t0[0], t1[0], .28), lerp(t0[1], t1[1], .28)); ctx.rotate(a); ctx.fillStyle = tel; ctx.beginPath(); ctx.ellipse(0, 0, U * .5, U * .45, 0, 0, 7); ctx.fill(); ctx.restore();
      const kp = rad(S.abs.kycP); ctx.save(); ctx.translate(...J.root); ctx.rotate(kp); ctx.fillStyle = tel; ctx.strokeStyle = "rgba(35,39,45,.6)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.rect(-U * .62, -U * .35, U * 1.24, U * .7); ctx.fill(); ctx.stroke(); ctx.restore();
      [["paP", tel], ["pP", tel], ["stP", tel], ["lyP", tel], ["rP", tel], ["chP", tel]].forEach(([k, c]) => usek(J[k + "0"], J[k], KOSTI[k][2] * U, c));
      usek(J.krk0, J.krk, U * .26, tel);
    }
    // kostra
    ["trup", "krk", "ramL", "ramP", "paL", "pL", "rL", "paP", "pP", "rP", "kycL", "kycP", "stL", "lyL", "chL", "stP", "lyP", "chP"].forEach(k => usek(J[k + "0"], J[k], 2.6, INK));
    // hlava
    const hk = J.krk, ha = rad(S.abs.hlava), hc = [hk[0] + Math.cos(ha) * U * .5, hk[1] + Math.sin(ha) * U * .5];
    ctx.save(); ctx.translate(...hc); ctx.rotate(ha + Math.PI / 2); ctx.fillStyle = S.objem ? "#E7DED0" : "#fff"; ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(0, 0, U * .36, U * .5, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
    // osy ramen a boků
    if (S.osy){
      ctx.save(); ctx.strokeStyle = BLUE; ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]);
      const os = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; ctx.beginPath(); ctx.moveTo(a[0] - dx * .35, a[1] - dy * .35); ctx.lineTo(b[0] + dx * .35, b[1] + dy * .35); ctx.stroke(); };
      os(J.ramL, J.ramP); os(J.kycL, J.kycP); ctx.restore();
    }
    // těžnice
    if (S.tez){
      const jx = J.krk0[0], minx = Math.min(J.chL[0], J.chP[0], J.lyL[0], J.lyP[0]) - U * .15, maxx = Math.max(J.chL[0], J.chP[0], J.lyL[0], J.lyP[0]) + U * .15;
      const ok = jx >= minx && jx <= maxx;
      ctx.save(); ctx.strokeStyle = ok ? "#4E7A45" : "#A33"; ctx.lineWidth = 1.6; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(jx, J.krk0[1]); ctx.lineTo(jx, zem); ctx.stroke(); ctx.restore();
      popisek(ctx, jx + 8, zem - 14, ok ? "těžnice dopadá na opornou plochu" : "těžnice mimo nohy – figura padá", ok ? "#4E7A45" : "#A33");
    }
    // klouby
    G.body = [];
    ["root", "trup", "hlava", "paL", "pL", "rL", "paP", "pP", "rP", "stL", "lyL", "chL", "stP", "lyP", "chP"].forEach(k => {
      const q = k === "hlava" ? [hk[0] + Math.cos(ha) * U, hk[1] + Math.sin(ha) * U] : J[k];
      G.body.push([k, q]);
      ctx.fillStyle = k === "root" ? INK : RED; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q[0], q[1], k === "root" ? 7 : 6, 0, 7); ctx.fill(); ctx.stroke();
    });
    G.J = J;
  });
  let tah = null;
  tahni(cv, {
    down: (x, y) => { tah = null; let best = 26; (G.body || []).forEach(([k, q]) => { const d = Math.hypot(q[0] - x, q[1] - y); if (d < best){ best = d; tah = k; } }); },
    move: (x, y) => {
      if (!tah) return; const J = G.J;
      if (tah === "root"){ S.root = [(x - G.ox) / G.U, (y - G.oy) / G.U]; }
      else {
        const k = tah === "hlava" ? "hlava" : tah; const s = tah === "hlava" ? J.krk : J[k + "0"];
        const novy = Math.atan2(y - s[1], x - s[0]) * 180 / Math.PI;
        const d = novy - S.abs[k];
        // potomci se otáčejí s rodičem
        const deti = kk => Object.keys(KOSTI).filter(c => KOSTI[c][0] === kk);
        const rotuj = kk => { S.abs[kk] += d; deti(kk).forEach(rotuj); };
        if (k === "trup"){ rotuj("trup"); } else rotuj(k);
      }
      p.kresli();
    },
    hover: (x, y) => { cv.style.cursor = (G.body || []).some(([, q]) => Math.hypot(q[0] - x, q[1] - y) < 26) ? "grab" : "default"; },
    up: () => tah = null
  });
  const pb = $("#pose-btns");
  pb.innerHTML = Object.keys(POZY).map(k => `<button type="button" class="btn btn-small btn-ghost" data-pose="${k}">${k}</button>`).join("");
  pb.addEventListener("click", e => { const b = e.target.closest("[data-pose]"); if (b) nastavPozu(b.dataset.pose); });
  $("#c-fline").addEventListener("change", e => { S.linie = e.target.checked; p.kresli(); });
  $("#c-fvol").addEventListener("change", e => { S.objem = e.target.checked; p.kresli(); });
  $("#c-faxes").addEventListener("change", e => { S.osy = e.target.checked; p.kresli(); });
  $("#c-fgrav").addEventListener("change", e => { S.tez = e.target.checked; p.kresli(); });
  // trénink pohybových skic
  let cas = 30, zbyva = 0, interval = null, posledni = "";
  segment(null, "data-ft", v => cas = +v);
  const bt = $("#b-ftrain"), tm = $("#ftimer");
  function dalsi(){ const k = Object.keys(POZY).filter(x => x !== posledni); posledni = k[Math.floor(Math.random() * k.length)]; nastavPozu(posledni, 24); zbyva = cas; tm.textContent = zbyva + " s"; }
  bt.addEventListener("click", () => {
    if (interval){ clearInterval(interval); interval = null; bt.textContent = "Spustit"; tm.textContent = ""; return; }
    bt.textContent = "Zastavit"; dalsi();
    interval = setInterval(() => { zbyva--; tm.textContent = zbyva + " s"; if (zbyva <= 0) dalsi(); if (!document.getElementById("figura").classList.contains("on")){ clearInterval(interval); interval = null; bt.textContent = "Spustit"; tm.textContent = ""; } }, 1000);
  });
});

})();
