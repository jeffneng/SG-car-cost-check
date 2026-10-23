"use strict";
function start(DATA) {
const DEFAULTS = ["TOYOTA|COROLLA ALTIS 1.6 ELEGANCE", "BYD|ATTO 3 EXTENDED RANGE", "TESLA|MODEL 3 RWD 110"];
const KEY = "sgcarcost.v1";
const $ = (id) => document.getElementById(id);
const fmt = (n) => (n == null ? "–" : (n < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-SG"));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---- data ---------------------------------------------------------------
const seen = {};
const CARS = DATA.cars.cars.map((c) => {
  const k = c.make + "|" + c.model;
  seen[k] = (seen[k] || 0) + 1;
  return { ...c, id: seen[k] > 1 ? `${k}|${seen[k]}` : k };
});
const BY_ID = Object.fromEntries(CARS.map((c) => [c.id, c]));
const COE = DATA.coe;

// ---- state (persisted; every storage access guarded) ---------------------
let state = { sel: [], quotes: {}, coe: null };
try { Object.assign(state, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
// always exactly 3 slots; a saved model that no longer exists falls back to that slot's starting model
state.sel = DEFAULTS.map((d, i) => (BY_ID[state.sel?.[i]] ? state.sel[i] : BY_ID[d] ? d : CARS[i].id));
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

const coeNow = () => ({ A: state.coe?.A ?? COE.A.qp, B: state.coe?.B ?? COE.B.qp });

// ---- cost model ----------------------------------------------------------
function costs(c) {
  const latest = coeNow()[c.cat];
  return { latestCoe: latest, costLatest: c.base + latest, costPdf: c.total_pdf };
}
const margin = (quote, cost) => (quote > 0 ? { amt: quote - cost, pct: ((quote - cost) / quote) * 100 } : null);

// ---- header --------------------------------------------------------------
function renderHeader() {
  $("stamps").innerHTML = [
    `Car cost: LTA ${esc(DATA.cars.month)}`,
    `COE: ${esc(COE.exercise)} (fetched ${esc(COE.fetched)})`,
    `${CARS.length} Cat A/B models`,
  ].map((t) => `<span>${t}</span>`).join("");
  const c = coeNow();
  $("coeA").value = c.A;
  $("coeB").value = c.B;
}
function onCoeInput() {
  const A = parseInt($("coeA").value, 10), B = parseInt($("coeB").value, 10);
  state.coe = { A: A > 0 ? A : COE.A.qp, B: B > 0 ? B : COE.B.qp };
  save(); renderCompare();
}
$("coeA").addEventListener("input", onCoeInput);
$("coeB").addEventListener("input", onCoeInput);
$("coeReset").addEventListener("click", () => { state.coe = null; save(); renderHeader(); renderCompare(); });

const FUEL = { P: "Petrol", H: "Petrol-Electric", R: "Plug-in Hybrid", E: "Electric", B: "Petrol-CNG", C: "CNG", Y: "Diesel-Electric", Q: "Diesel-Electric PHEV" };
const fuelName = (f) => FUEL[f] || f;

// ---- compare -------------------------------------------------------------
const MAKES = [...new Set(CARS.map((c) => c.make))].sort();
const MODEL_OPTIONS = (selected) => MAKES.map((m) => `<optgroup label="${esc(m)}">` +
  CARS.filter((c) => c.make === m).map((c) => `<option value="${esc(c.id)}"${c.id === selected ? " selected" : ""}>${esc(c.model)}</option>`).join("") + "</optgroup>").join("");

function renderCompare() {
  const cars = state.sel.map((id) => BY_ID[id]);
  const cs = cars.map(costs);
  const lowest = (vals) => Math.min(...vals);
  const bestLatest = lowest(cs.map((x) => x.costLatest));
  const cell = (fn) => cars.map((c, i) => `<td class="n">${fn(c, cs[i], i)}</td>`).join("");
  const row = (label, fn, cls = "") => `<tr class="${cls}"><td class="lbl">${label}</td>${cell(fn)}</tr>`;
  const sec = (t) => `<tr class="sec"><td colspan="${cars.length + 1}">${t}</td></tr>`;

  const bar = (c, x) => {
    const pos = [["OMV", c.omv], ["Excise+GST", c.duty], ["ARF", c.arf], ["COE", x.latestCoe]];
    const tot = pos.reduce((s, p) => s + p[1], 0);
    const cl = ["var(--bar1)", "var(--bar2)", "var(--bar3)", "var(--bar4)"];
    return `<div class="bar" title="OMV / Excise+GST / ARF / COE">${pos.map((p, i) => `<i style="width:${(p[1] / tot) * 100}%;background:${cl[i]}"></i>`).join("")}</div>`;
  };

  $("compareBody").innerHTML = `<div class="tablewrap"><table class="cmp">
    <thead><tr><th></th>${cars.map((c) => `<th class="car"><select class="pick" data-slot="${cars.indexOf(c)}" aria-label="Model ${cars.indexOf(c) + 1}">${MODEL_OPTIONS(c.id)}</select>
      <small>Cat ${c.cat} · ${esc(fuelName(c.fuel))} · ${c.cc ? c.cc.toLocaleString() + " cc · " : ""}${c.kw} kW · VES ${esc(c.ves_band)}</small></th>`).join("")}</tr></thead>
    <tbody>
    ${sec("Basic car cost (LTA)")}
    ${row("OMV", (c) => fmt(c.omv))}
    ${row("Excise duty + GST", (c) => fmt(c.duty))}
    ${row("ARF (tiered)", (c) => fmt(c.arf))}
    ${row("VES rebate / surcharge", (c) => fmt(c.ves))}
    ${row("EV incentive (EEAI)", (c) => fmt(c.eeai))}
    ${row("Registration fee", (c) => fmt(c.regn))}
    ${row("Basic cost (no COE)", (c) => fmt(c.base), "total")}
    ${sec("With latest COE")}
    ${row("COE", (c, x) => fmt(x.latestCoe))}
    ${row("Car cost", (c, x) => `<span class="${x.costLatest === bestLatest && cars.length > 1 ? "best" : ""}">${fmt(x.costLatest)}</span>`, "total")}
    ${row("Cost mix", (c, x) => bar(c, x))}
    ${sec(`With COE in LTA ${esc(DATA.cars.month)} PDF`)}
    ${row("COE", (c) => fmt(c.coe_pdf))}
    ${row("Car cost", (c) => fmt(c.total_pdf), "total")}
    ${sec("Dealer")}
    ${row("Distributor’s published price", (c) => fmt(c.dist_price))}
    <tr><td class="lbl">Dealer’s quote (incl. COE)</td>${cars.map((c) => `<td class="n"><input type="number" min="0" step="100" inputmode="numeric" data-quote="${esc(c.id)}" value="${state.quotes[c.id] || ""}" placeholder="enter $"></td>`).join("")}</tr>
    <tr class="total" id="marginLatest"></tr>
    <tr class="total" id="marginPdf"></tr>
    <tr id="roomRow"></tr>
    </tbody></table></div>
    <p class="legend">Cost mix:<b style="background:var(--bar1)"></b>OMV<b style="background:var(--bar2)"></b>Excise+GST<b style="background:var(--bar3)"></b>ARF<b style="background:var(--bar4)"></b>COE</p>`;
  renderMargins();
}

// margin rows update without rebuilding the inputs (keeps focus while typing)
function renderMargins() {
  const cars = state.sel.map((id) => BY_ID[id]);
  const set = (id, label, fn) => {
    const el = $(id); if (!el) return;
    el.innerHTML = `<td class="lbl">${label}</td>` + cars.map((c) => `<td class="n">${fn(c)}</td>`).join("");
  };
  const pill = (m) => !m ? "–" : `<span class="pill ${m.amt >= 0 ? "good" : "bad"}">${fmt(m.amt)} · ${m.pct.toFixed(1)}%</span>`;
  set("marginLatest", "Est. margin vs latest-COE cost", (c) => pill(margin(state.quotes[c.id], costs(c).costLatest)));
  set("marginPdf", `Est. margin vs ${esc(DATA.cars.month)}-COE cost`, (c) => pill(margin(state.quotes[c.id], c.total_pdf)));
  set("roomRow", "Quote vs distributor’s price", (c) => {
    const q = state.quotes[c.id];
    return q > 0 && c.dist_price ? `<span class="muted">${fmt(q - c.dist_price)}</span>` : "–";
  });
}

$("compareBody").addEventListener("change", (e) => {
  const slot = e.target.dataset?.slot;
  if (slot == null) return;
  state.sel[+slot] = e.target.value; save(); renderCompare();
});
$("resetModels").addEventListener("click", () => { state.sel = [...DEFAULTS]; save(); renderCompare(); });
$("compareBody").addEventListener("input", (e) => {
  const id = e.target.dataset?.quote;
  if (!id) return;
  const v = parseFloat(e.target.value);
  if (v > 0) state.quotes[id] = v; else delete state.quotes[id];
  save(); renderMargins();
});

renderHeader(); renderCompare();
}
