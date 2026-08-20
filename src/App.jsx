import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ShoppingCart, UtensilsCrossed, Car, Home, Zap, HeartPulse,
  ShoppingBag, Clapperboard, Plane, MoreHorizontal,
  Coffee, Dumbbell, BookOpen, Gift, Smartphone, PawPrint,
  Baby, Wrench, Music, Bus, Fuel, Shirt, Pill, Wifi,
  GraduationCap, Ticket, Scissors, Cigarette,
  Plus, ChevronLeft, ChevronRight, Search, Delete, Repeat,
  Settings2, Wallet, ArrowDownUp, Trash2, Download, X, Check, PieChart,
  Pencil, EyeOff
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Categorie — modificabili, salvate insieme ai dati                  */
/* ------------------------------------------------------------------ */

const ICONS = {
  cart: ShoppingCart, fork: UtensilsCrossed, car: Car, home: Home,
  bolt: Zap, heart: HeartPulse, bag: ShoppingBag, film: Clapperboard,
  plane: Plane, dots: MoreHorizontal, coffee: Coffee, dumbbell: Dumbbell,
  book: BookOpen, gift: Gift, phone: Smartphone, paw: PawPrint,
  baby: Baby, tool: Wrench, music: Music, bus: Bus, fuel: Fuel,
  shirt: Shirt, pill: Pill, wifi: Wifi, school: GraduationCap,
  ticket: Ticket, scissors: Scissors, smoke: Cigarette, wallet: Wallet,
};

const PALETTE = [
  "#1F9D55", "#0D9488", "#0284C7", "#0A6CF0", "#5B5BF0", "#7C3AED",
  "#C026D3", "#E11D48", "#EA6A08", "#C08401", "#64748B", "#475569",
];

const DEFAULT_CATEGORIES = [
  { id: "spesa",      label: "Spesa",      icon: "cart",   color: "#1F9D55" },
  { id: "ristoranti", label: "Ristoranti", icon: "fork",   color: "#EA6A08" },
  { id: "trasporti",  label: "Trasporti",  icon: "car",    color: "#0A6CF0" },
  { id: "casa",       label: "Casa",       icon: "home",   color: "#7C3AED" },
  { id: "bollette",   label: "Bollette",   icon: "bolt",   color: "#C08401" },
  { id: "salute",     label: "Salute",     icon: "heart",  color: "#E11D48" },
  { id: "shopping",   label: "Shopping",   icon: "bag",    color: "#0D9488" },
  { id: "svago",      label: "Svago",      icon: "film",   color: "#C026D3" },
  { id: "viaggi",     label: "Viaggi",     icon: "plane",  color: "#0284C7" },
  { id: "altro",      label: "Altro",      icon: "dots",   color: "#64748B" },
];

const CatContext = React.createContext(null);
const useCats = () => React.useContext(CatContext);

const buildIndex = (cats) => {
  const list = (cats && cats.length ? cats : DEFAULT_CATEGORIES).map((c) => ({
    ...c, Icon: ICONS[c.icon] || MoreHorizontal,
  }));
  const map = {};
  list.forEach((c) => { map[c.id] = c; });
  const fallback = { id: "?", label: "Senza categoria", color: "#64748B", Icon: MoreHorizontal };
  return {
    all: list,
    visible: list.filter((c) => !c.hidden),
    get: (id) => map[id] || fallback,
  };
};

/* ------------------------------------------------------------------ */
/*  Utility                                                            */
/* ------------------------------------------------------------------ */

const STORE_KEY = "spese:v1";
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const eur = (n) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n || 0);

const eurShort = (n) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency", currency: "EUR",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n || 0);

const isoDate = (d) => {
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const monthName = (y, m) =>
  new Date(y, m, 1).toLocaleDateString("it-IT", { month: "long" });

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const parseAmount = (raw) => {
  const n = parseFloat(String(raw).replace(",", "."));
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
};

const DEFAULT_DATA = { transactions: [], budget: 1200, recurring: [], categories: DEFAULT_CATEGORIES };

/* Archivio locale del browser: sostituisce window.storage degli artifact */
const store = {
  async get(key) {
    const v = localStorage.getItem(key);
    return v === null ? null : { key, value: v };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
};

/* ------------------------------------------------------------------ */
/*  Stile — Liquid Glass, tema chiaro                                  */
/* ------------------------------------------------------------------ */

const CSS = `
.lg-root *, .lg-root *::before, .lg-root *::after { box-sizing: border-box; }
.lg-root {
  --bg:#F1F0F6;
  --text:#15141C;
  --t2:rgba(30,28,44,.62);
  --t3:rgba(30,28,44,.40);
  --hair:rgba(24,22,44,.09);
  --radius:26px;
  position:relative; height:100%; width:100%;
  background:var(--bg); color:var(--text);
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Inter,system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;
  overflow:hidden;
  letter-spacing:-0.011em;
}
.lg-root button { font:inherit; color:inherit; border:none; background:none; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.lg-root input { font:inherit; color:inherit; }

/* --- sfondo pastello: il vetro ha bisogno di colore da rifrangere --- */
.mesh { position:absolute; inset:-22%; z-index:0; filter:blur(64px); opacity:.9; }
.blob { position:absolute; border-radius:50%; }
.b1 { width:56%; height:46%; left:-8%;   top:0%;    background:radial-gradient(circle,rgba(167,139,250,.85) 0%,rgba(167,139,250,0) 68%); animation:drift1 28s ease-in-out infinite; }
.b2 { width:58%; height:50%; right:-12%; top:12%;   background:radial-gradient(circle,rgba(125,211,252,.9) 0%,rgba(125,211,252,0) 68%); animation:drift2 34s ease-in-out infinite; }
.b3 { width:52%; height:44%; left:8%;    bottom:-6%; background:radial-gradient(circle,rgba(253,186,206,.85) 0%,rgba(253,186,206,0) 68%); animation:drift3 40s ease-in-out infinite; }
.b4 { width:40%; height:36%; right:2%;   bottom:2%;  background:radial-gradient(circle,rgba(167,243,208,.8) 0%,rgba(167,243,208,0) 68%); animation:drift1 46s ease-in-out infinite reverse; }
@keyframes drift1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(9%,7%) scale(1.14)} }
@keyframes drift2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-11%,9%) scale(1.1)} }
@keyframes drift3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(7%,-9%) scale(1.16)} }
.grain { position:absolute; inset:0; z-index:1; pointer-events:none; opacity:.055;
  background-image:radial-gradient(rgba(20,18,40,.9) .5px, transparent .5px);
  background-size:3px 3px; }

/* --- ricetta vetro chiaro --- */
.glass {
  background:linear-gradient(158deg, rgba(255,255,255,.82), rgba(255,255,255,.58) 58%, rgba(255,255,255,.72));
  -webkit-backdrop-filter:blur(30px) saturate(185%);
  backdrop-filter:blur(30px) saturate(185%);
  border:1px solid rgba(255,255,255,.85);
  border-radius:var(--radius);
  box-shadow:
    0 10px 34px rgba(60,50,110,.13),
    0 1px 2px rgba(60,50,110,.06),
    inset 0 1px 0 rgba(255,255,255,.95);
}
.glass-thin {
  background:linear-gradient(158deg, rgba(255,255,255,.7), rgba(255,255,255,.5));
  -webkit-backdrop-filter:blur(20px) saturate(175%);
  backdrop-filter:blur(20px) saturate(175%);
  border:1px solid rgba(255,255,255,.8);
  box-shadow:0 4px 16px rgba(60,50,110,.09), inset 0 1px 0 rgba(255,255,255,.9);
}

/* --- impalcatura --- */
.scroll { position:relative; z-index:2; height:100%; overflow-y:auto; overflow-x:hidden;
  padding:calc(env(safe-area-inset-top,0px) + 18px) 16px 168px; -webkit-overflow-scrolling:touch; }
.view { animation:rise .34s cubic-bezier(.22,1,.36,1) both; }
@keyframes rise { from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:none} }

.eyebrow { font-size:11px; font-weight:600; letter-spacing:.09em; text-transform:uppercase; color:var(--t3); }
.h1 { font-size:26px; font-weight:680; letter-spacing:-.028em; margin:0; }
.h2 { font-size:13px; font-weight:620; letter-spacing:.01em; color:var(--t2); margin:26px 4px 10px; }
.num { font-variant-numeric:tabular-nums; font-feature-settings:"tnum"; }

/* --- selettore mese --- */
.monthbar { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:16px; }
.mbtn { width:38px; height:38px; border-radius:50%; display:grid; place-items:center; color:var(--t2);
  transition:transform .18s, background .18s; }
.mbtn:hover { background:rgba(255,255,255,.75); color:var(--text); }
.mbtn:active { transform:scale(.9); }
.mbtn:disabled { opacity:.28; cursor:default; }

/* --- eroe: budget --- */
.hero { padding:24px 22px 22px; }
.hero-amount { font-size:46px; font-weight:700; letter-spacing:-.04em; line-height:1.02; margin:8px 0 0; }
.delta { display:inline-flex; align-items:center; gap:5px; margin-top:12px; padding:5px 11px 5px 8px;
  border-radius:999px; font-size:12px; font-weight:580; }
.delta.up   { background:rgba(225,29,72,.11);  color:#BE123C; }
.delta.down { background:rgba(31,157,85,.13);  color:#15803D; }
.delta.flat { background:rgba(24,22,44,.07);   color:var(--t2); }

/* SIGNATURE: la capsula-liquido */
.meter { position:relative; height:16px; margin-top:22px; border-radius:999px; overflow:hidden;
  background:rgba(24,22,44,.08);
  box-shadow:inset 0 1px 2px rgba(24,22,44,.14), inset 0 -1px 0 rgba(255,255,255,.7); }
.meter-fill { position:absolute; inset:0 auto 0 0; border-radius:999px;
  background:linear-gradient(90deg,#2DD4BF,#6366F1 52%,#EC4899);
  box-shadow:0 2px 10px rgba(99,102,241,.4), inset 0 1px 0 rgba(255,255,255,.55);
  transition:width .7s cubic-bezier(.22,1,.36,1); }
.meter-fill.over { background:linear-gradient(90deg,#FB7185,#E11D48); box-shadow:0 2px 10px rgba(225,29,72,.42), inset 0 1px 0 rgba(255,255,255,.5); }
.meter-fill::after { content:""; position:absolute; inset:0; border-radius:999px;
  background:linear-gradient(100deg,transparent 20%,rgba(255,255,255,.6) 48%,transparent 76%);
  background-size:260% 100%; animation:sheen 3.6s linear infinite; }
@keyframes sheen { from{background-position:180% 0} to{background-position:-80% 0} }
.meter-foot { display:flex; justify-content:space-between; margin-top:11px; font-size:12.5px; color:var(--t2); }

/* --- righe --- */
.card { padding:6px 4px; overflow:hidden; }
.row { display:flex; align-items:center; gap:13px; width:100%; padding:12px 14px; border-radius:18px;
  text-align:left; transition:background .16s, transform .16s; }
.row:hover { background:rgba(255,255,255,.66); }
.row:active { transform:scale(.985); }
.chip-ico { width:37px; height:37px; border-radius:12px; display:grid; place-items:center; flex:none;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.7); }
.row-main { flex:1; min-width:0; }
.row-title { font-size:15px; font-weight:540; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row-sub { font-size:12.5px; color:var(--t3); margin-top:2px; display:flex; align-items:center; gap:5px; }
.row-amt { font-size:15px; font-weight:620; letter-spacing:-.02em; flex:none; }
.bar { height:4px; border-radius:2px; background:rgba(24,22,44,.08); margin-top:7px; overflow:hidden; }
.bar > i { display:block; height:100%; border-radius:2px; transition:width .6s cubic-bezier(.22,1,.36,1); }
.sep { height:1px; background:var(--hair); margin:0 16px; }

.empty { text-align:center; padding:44px 20px; color:var(--t3); font-size:14px; line-height:1.6; }

/* --- barra tab flottante --- */
.tabbar { position:absolute; z-index:20; left:50%; transform:translateX(-50%);
  bottom:calc(env(safe-area-inset-bottom,0px) + 18px);
  display:flex; align-items:center; gap:4px; padding:7px; border-radius:999px;
  background:linear-gradient(150deg, rgba(255,255,255,.8), rgba(255,255,255,.58));
  -webkit-backdrop-filter:blur(36px) saturate(200%); backdrop-filter:blur(36px) saturate(200%);
  border:1px solid rgba(255,255,255,.9);
  box-shadow:0 14px 42px rgba(60,50,110,.2), 0 2px 6px rgba(60,50,110,.08), inset 0 1px 0 rgba(255,255,255,1); }
.tab { display:flex; align-items:center; gap:7px; padding:10px 14px; border-radius:999px;
  font-size:13px; font-weight:580; color:var(--t2); white-space:nowrap;
  transition:all .22s cubic-bezier(.22,1,.36,1); }
.tab.on { color:var(--text); background:#fff; box-shadow:0 2px 8px rgba(60,50,110,.14), inset 0 1px 0 rgba(255,255,255,1); }
.tab:active { transform:scale(.94); }
.tab span { display:none; }
.tab.on span { display:inline; }
.fab { position:absolute; z-index:21; right:20px;
  bottom:calc(env(safe-area-inset-bottom,0px) + 92px);
  width:60px; height:60px; border-radius:50%; display:grid; place-items:center;
  background:linear-gradient(155deg,#33314D,#151426 60%,#0A0912);
  border:2px solid rgba(255,255,255,.95);
  box-shadow:0 12px 28px rgba(17,16,32,.5), 0 4px 10px rgba(17,16,32,.34), inset 0 1px 0 rgba(255,255,255,.24);
  transition:transform .2s cubic-bezier(.22,1,.36,1), box-shadow .2s;
  animation:fabin .5s cubic-bezier(.22,1,.36,1) both .15s; }
@keyframes fabin { from{opacity:0; transform:scale(.6)} to{opacity:1; transform:none} }
.fab:hover { box-shadow:0 14px 32px rgba(17,16,32,.56), inset 0 1px 0 rgba(255,255,255,.3); }
.fab:active { transform:scale(.88) rotate(90deg); }

/* --- foglio --- */
.scrim { position:absolute; inset:0; z-index:30; background:rgba(45,40,70,.22);
  -webkit-backdrop-filter:blur(9px); backdrop-filter:blur(9px); animation:fade .26s ease both; }
@keyframes fade { from{opacity:0} to{opacity:1} }
.sheet { position:absolute; z-index:31; left:0; right:0; bottom:0; max-height:96%; overflow-y:auto;
  border-radius:34px 34px 0 0; padding:10px 18px calc(env(safe-area-inset-bottom,0px) + 20px);
  background:linear-gradient(180deg, rgba(255,255,255,.9), rgba(246,245,251,.95));
  -webkit-backdrop-filter:blur(42px) saturate(190%); backdrop-filter:blur(42px) saturate(190%);
  border-top:1px solid rgba(255,255,255,.95);
  box-shadow:0 -18px 60px rgba(50,42,90,.22), inset 0 1px 0 rgba(255,255,255,1);
  animation:up .42s cubic-bezier(.2,1.02,.34,1) both; }
@keyframes up { from{transform:translateY(102%)} to{transform:none} }
.grip { width:38px; height:5px; border-radius:3px; background:rgba(24,22,44,.18); margin:0 auto 14px; }
.sheet-handle { touch-action:none; cursor:grab; }
.sheet-handle:active { cursor:grabbing; }

.display { text-align:center; padding:6px 0 16px; }
.display-amt { font-size:52px; font-weight:700; letter-spacing:-.045em; line-height:1; }
.display-amt.zero { color:var(--t3); }

.catstrip { display:flex; gap:9px; overflow-x:auto; padding:4px 2px 12px; scrollbar-width:none; }
.catstrip::-webkit-scrollbar { display:none; }
.cat { flex:none; display:flex; flex-direction:column; align-items:center; gap:6px; width:66px;
  padding:11px 4px; border-radius:19px; font-size:10.5px; font-weight:560; color:var(--t2);
  border:1px solid transparent; transition:all .2s; }
.cat.on { color:var(--text); background:#fff; border-color:rgba(255,255,255,.9);
  box-shadow:0 3px 12px rgba(60,50,110,.14); }
.cat:active { transform:scale(.93); }

.metarow { display:flex; gap:9px; margin-bottom:12px; }
.field { display:flex; align-items:center; gap:8px; padding:11px 14px; border-radius:16px;
  background:rgba(255,255,255,.72); border:1px solid rgba(255,255,255,.9);
  box-shadow:inset 0 1px 2px rgba(24,22,44,.05), 0 1px 3px rgba(60,50,110,.06); }
.field input { background:none; border:none; outline:none; width:100%; font-size:14px; }
.field input::placeholder { color:var(--t3); }

.pad { display:grid; grid-template-columns:repeat(3,1fr); gap:9px; margin-bottom:14px; }
.key { height:52px; border-radius:17px; font-size:22px; font-weight:520; display:grid; place-items:center;
  background:linear-gradient(158deg, rgba(255,255,255,.95), rgba(255,255,255,.72));
  border:1px solid rgba(255,255,255,.9);
  box-shadow:0 2px 6px rgba(60,50,110,.1), inset 0 1px 0 rgba(255,255,255,1);
  transition:transform .12s, filter .12s; }
.key:active { transform:scale(.93); filter:brightness(.93); }

.cta { width:100%; height:54px; border-radius:19px; font-size:16px; font-weight:640; letter-spacing:-.01em;
  display:grid; place-items:center; color:#fff;
  background:linear-gradient(150deg,#8B5CF6,#5B5BF0 52%,#22C7E8);
  box-shadow:0 8px 22px rgba(91,91,240,.38), inset 0 1px 0 rgba(255,255,255,.5);
  transition:transform .16s, opacity .16s; }
.cta:active { transform:scale(.975); }
.cta:disabled { opacity:.4; box-shadow:none; cursor:default; }
.ghost { width:100%; height:48px; border-radius:17px; font-size:15px; font-weight:570; display:grid; place-items:center;
  background:rgba(255,255,255,.72); border:1px solid rgba(255,255,255,.9);
  box-shadow:0 2px 8px rgba(60,50,110,.08); margin-top:10px; transition:transform .16s; }
.ghost.danger { color:#D01844; background:rgba(225,29,72,.09); border-color:rgba(225,29,72,.18); }
.ghost:active { transform:scale(.98); }

.searchbar { display:flex; align-items:center; gap:10px; padding:12px 15px; border-radius:18px; margin-bottom:14px; }
.searchbar input { background:none; border:none; outline:none; width:100%; font-size:15px; }
.searchbar input::placeholder { color:var(--t3); }

.daylabel { font-size:12px; font-weight:620; color:var(--t3); margin:20px 6px 8px; letter-spacing:.01em; }
.badge { display:inline-flex; align-items:center; gap:3px; padding:2px 7px; border-radius:999px;
  background:rgba(24,22,44,.07); font-size:10px; font-weight:580; color:var(--t2); }

.setrow { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:15px 16px; }
.setrow-label { font-size:14.5px; font-weight:540; }
.setrow-hint { font-size:12px; color:var(--t3); margin-top:3px; line-height:1.45; }
.budgetinput { width:112px; text-align:right; background:rgba(255,255,255,.85); border:1px solid rgba(255,255,255,.9);
  border-radius:13px; padding:9px 12px; font-size:15px; font-weight:620; outline:none;
  box-shadow:inset 0 1px 2px rgba(24,22,44,.06); }
.budgetinput:focus { border-color:rgba(139,92,246,.5); }
.notice { padding:13px 16px; border-radius:17px; font-size:12.5px; line-height:1.55;
  background:rgba(234,138,8,.12); border:1px solid rgba(234,138,8,.24); color:#96560A; margin-bottom:14px; }

/* --- grafici --- */
.seg { display:flex; gap:3px; padding:3px; border-radius:15px; margin-bottom:16px;
  background:rgba(24,22,44,.06); border:1px solid rgba(255,255,255,.75);
  box-shadow:inset 0 1px 2px rgba(24,22,44,.05); }
.seg button { flex:1; padding:8px 0; border-radius:12px; font-size:13px; font-weight:580; color:var(--t2);
  transition:all .22s cubic-bezier(.22,1,.36,1); }
.seg button.on { background:#fff; color:var(--text); box-shadow:0 1px 5px rgba(60,50,110,.16); }
.seg button:active { transform:scale(.97); }

.chartcard { padding:20px 18px 14px; margin-bottom:14px; }
.chart-head { display:flex; align-items:baseline; justify-content:space-between; gap:10px; margin-bottom:14px; }
.chart-title { font-size:15px; font-weight:630; letter-spacing:-.018em; }
.chart-sub { font-size:12px; color:var(--t3); white-space:nowrap; }
.svgwrap svg { display:block; width:100%; height:auto; }
.axis { font-size:9.5px; font-weight:580; fill:rgba(30,28,44,.42); }
.axis.on { fill:var(--text); }
.axis.hint { font-size:9px; fill:rgba(30,28,44,.34); }
.vlabel { font-size:12px; font-weight:680; fill:var(--text); }
.barv { transform-box:fill-box; transform-origin:bottom; animation:grow .55s cubic-bezier(.22,1,.36,1) both; }
@keyframes grow { from{transform:scaleY(.02)} to{transform:scaleY(1)} }
.donut { animation:pop .55s cubic-bezier(.22,1,.36,1) both; }
@keyframes pop { from{opacity:0; transform:scale(.88)} to{opacity:1; transform:none} }
.trace { stroke-dasharray:1400; animation:draw 1.1s cubic-bezier(.4,0,.2,1) both; }
@keyframes draw { from{stroke-dashoffset:1400} to{stroke-dashoffset:0} }
.tiles { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.tile { padding:15px 16px; border-radius:20px; }
.tile-k { font-size:10.5px; font-weight:620; letter-spacing:.07em; text-transform:uppercase; color:var(--t3); }
.tile-v { font-size:19px; font-weight:690; letter-spacing:-.032em; margin-top:7px; }
.tile-s { font-size:11.5px; color:var(--t3); margin-top:3px; }
.legend { display:flex; align-items:center; gap:11px; padding:9px 4px; }
.dot { width:9px; height:9px; border-radius:3px; flex:none; }
.legend-name { flex:1; font-size:14px; font-weight:530; }
.legend-pct { font-size:12.5px; color:var(--t3); width:38px; text-align:right; }
.legend-amt { font-size:14px; font-weight:620; letter-spacing:-.02em; }

/* --- filtri per categoria --- */
.fchips { display:flex; gap:7px; overflow-x:auto; padding:2px 2px 12px; scrollbar-width:none; }
.fchips::-webkit-scrollbar { display:none; }
.fchip { flex:none; display:flex; align-items:center; gap:6px; padding:8px 13px; border-radius:999px;
  font-size:13px; font-weight:560; color:var(--t2); white-space:nowrap;
  background:rgba(255,255,255,.62); border:1px solid rgba(255,255,255,.85);
  box-shadow:0 1px 4px rgba(60,50,110,.07); transition:all .2s cubic-bezier(.22,1,.36,1); }
.fchip.on { color:#fff; border-color:transparent; box-shadow:0 3px 10px rgba(60,50,110,.2); }
.fchip:active { transform:scale(.94); }
.filterinfo { display:flex; justify-content:space-between; align-items:center;
  font-size:12.5px; color:var(--t2); padding:0 6px 4px; }
.linkbtn { font-size:12.5px; font-weight:600; color:#5B5BF0; }

/* --- editor categoria --- */
.editor { padding:16px; margin:4px 0 6px; border-radius:22px;
  background:rgba(255,255,255,.72); border:1px solid rgba(255,255,255,.9);
  box-shadow:inset 0 1px 0 rgba(255,255,255,1), 0 3px 12px rgba(60,50,110,.09);
  animation:rise .3s cubic-bezier(.22,1,.36,1) both; }
.ed-label { font-size:11px; font-weight:620; letter-spacing:.07em; text-transform:uppercase;
  color:var(--t3); margin:16px 2px 9px; }
.swatches { display:grid; grid-template-columns:repeat(6,1fr); gap:9px; }
.swatch { height:34px; border-radius:11px; border:2px solid transparent;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4); transition:transform .18s; position:relative; }
.swatch.on { border-color:#fff; box-shadow:0 0 0 2px rgba(30,28,44,.35), inset 0 1px 0 rgba(255,255,255,.5); }
.swatch:active { transform:scale(.9); }
.iconsgrid { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; }
.iconbtn { height:40px; border-radius:13px; display:grid; place-items:center; color:var(--t2);
  background:rgba(255,255,255,.8); border:1.5px solid rgba(255,255,255,.9);
  box-shadow:0 1px 3px rgba(60,50,110,.07); transition:transform .16s; }
.iconbtn.on { background:#fff; box-shadow:0 2px 8px rgba(60,50,110,.16); }
.iconbtn:active { transform:scale(.9); }

@media (prefers-reduced-motion: reduce) {
  .lg-root *, .lg-root *::after { animation:none !important; transition-duration:.01ms !important; }
}
.lg-root :focus-visible { outline:2px solid rgba(91,91,240,.75); outline-offset:2px; border-radius:12px; }
`;

const MUTED_ICON = "rgba(30,28,44,.45)";

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */

export default function App() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const [tab, setTab] = useState("mese");
  const [sheet, setSheet] = useState(null); // null | {mode:'new'} | {mode:'edit', tx}
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });

  /* ---- carica ---- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await store.get(STORE_KEY);
        const parsed = res ? JSON.parse(res.value) : DEFAULT_DATA;
        if (alive) setData(applyRecurring({ ...DEFAULT_DATA, ...parsed }));
      } catch (e) {
        if (alive) setData(applyRecurring(DEFAULT_DATA));
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  /* ---- salva ---- */
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await store.set(STORE_KEY, JSON.stringify(data));
        setStorageOk(true);
      } catch (e) {
        setStorageOk(false);
      }
    })();
  }, [data, loaded]);

  /* ---- ricorrenti ---- */
  function applyRecurring(d) {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth(), dd = now.getDate();
    const add = [];
    (d.recurring || []).forEach((r) => {
      if (r.day > dd) return;
      const key = `${r.id}@${y}-${m}`;
      if ((d.transactions || []).some((t) => t.rec === key)) return;
      const last = new Date(y, m + 1, 0).getDate();
      add.push({
        id: uid(), amount: r.amount, category: r.category,
        date: isoDate(new Date(y, m, Math.min(r.day, last))),
        note: r.label, rec: key,
      });
    });
    return add.length ? { ...d, transactions: [...(d.transactions || []), ...add] } : d;
  }

  /* ---- derivati ---- */
  const inMonth = (t, y, m) => {
    const [ty, tm] = t.date.split("-").map(Number);
    return ty === y && tm - 1 === m;
  };

  const monthTx = useMemo(
    () => data.transactions.filter((t) => inMonth(t, cursor.y, cursor.m))
      .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.transactions, cursor]
  );

  const total = useMemo(() => monthTx.reduce((s, t) => s + t.amount, 0), [monthTx]);

  const prev = useMemo(() => {
    const d = new Date(cursor.y, cursor.m - 1, 1);
    const t = data.transactions.filter((x) => inMonth(x, d.getFullYear(), d.getMonth()));
    return { total: t.reduce((s, x) => s + x.amount, 0), name: monthName(d.getFullYear(), d.getMonth()) };
  }, [data.transactions, cursor]);

  const byCat = useMemo(() => {
    const map = {};
    monthTx.forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([id, amt]) => ({ id, amt }))
      .sort((a, b) => b.amt - a.amt);
  }, [monthTx]);

  const isCurrentMonth = cursor.y === today.getFullYear() && cursor.m === today.getMonth();

  const cats = useMemo(() => buildIndex(data.categories), [data.categories]);

  /* ---- azioni ---- */
  const saveTx = (tx) =>
    setData((d) => ({
      ...d,
      transactions: d.transactions.some((t) => t.id === tx.id)
        ? d.transactions.map((t) => (t.id === tx.id ? tx : t))
        : [...d.transactions, tx],
    }));

  const removeTx = (id) =>
    setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }));

  const shiftMonth = (n) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const exportCSV = () => {
    const rows = [["Data", "Importo", "Categoria", "Nota"]];
    [...data.transactions].sort((a, b) => (a.date < b.date ? -1 : 1)).forEach((t) =>
      rows.push([
        t.date,
        String(t.amount).replace(".", ","),
        cats.get(t.category).label,
        (t.note || "").replace(/[;\n\r]/g, " "),
      ])
    );
    const csv = "\uFEFF" + rows.map((r) => r.join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `spese-${isoDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---- render ---- */
  return (
    <CatContext.Provider value={cats}>
    <div className="lg-root">
      <style>{CSS}</style>

      <div className="mesh" aria-hidden="true">
        <div className="blob b1" /><div className="blob b2" />
        <div className="blob b3" /><div className="blob b4" />
      </div>
      <div className="grain" aria-hidden="true" />

      <div className="scroll" key={tab}>
        {tab === "mese" && (
          <MonthView
            cursor={cursor} shiftMonth={shiftMonth} isCurrentMonth={isCurrentMonth}
            total={total} prev={prev} budget={data.budget} byCat={byCat}
            recent={monthTx.slice(0, 5)} onOpen={(tx) => setSheet({ mode: "edit", tx })}
          />
        )}
        {tab === "grafici" && (
          <ChartsView transactions={data.transactions} budget={data.budget} />
        )}
        {tab === "spese" && (
          <ListView tx={data.transactions} onOpen={(tx) => setSheet({ mode: "edit", tx })} />
        )}
        {tab === "impostazioni" && (
          <SettingsView
            data={data} setData={setData} applyRecurring={applyRecurring}
            exportCSV={exportCSV} storageOk={storageOk}
          />
        )}
      </div>

      <nav className="tabbar">
        <button className={`tab ${tab === "mese" ? "on" : ""}`} onClick={() => setTab("mese")}>
          <Wallet size={18} strokeWidth={2} /><span>Mese</span>
        </button>
        <button className={`tab ${tab === "grafici" ? "on" : ""}`} onClick={() => setTab("grafici")}>
          <PieChart size={18} strokeWidth={2} /><span>Grafici</span>
        </button>
        <button className={`tab ${tab === "spese" ? "on" : ""}`} onClick={() => setTab("spese")}>
          <ArrowDownUp size={18} strokeWidth={2} /><span>Spese</span>
        </button>
        <button className={`tab ${tab === "impostazioni" ? "on" : ""}`} onClick={() => setTab("impostazioni")}>
          <Settings2 size={18} strokeWidth={2} /><span>Impostazioni</span>
        </button>
      </nav>

      <button className="fab" onClick={() => setSheet({ mode: "new" })} aria-label="Aggiungi spesa">
        <Plus size={28} strokeWidth={2.9} color="#fff" />
      </button>

      {sheet && (
        <>
          <div className="scrim" onClick={() => setSheet(null)} />
          <EntrySheet
            tx={sheet.tx}
            onSave={(t) => { saveTx(t); setSheet(null); }}
            onDelete={(id) => { removeTx(id); setSheet(null); }}
            onClose={() => setSheet(null)}
          />
        </>
      )}
    </div>
    </CatContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Vista mese                                                         */
/* ------------------------------------------------------------------ */

function MonthView({ cursor, shiftMonth, isCurrentMonth, total, prev, budget, byCat, recent, onOpen }) {
  const { get: catOf } = useCats();
  const pct = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;
  const over = total > budget && budget > 0;
  const rest = budget - total;

  let delta = null;
  if (prev.total > 0) {
    const p = Math.round(((total - prev.total) / prev.total) * 100);
    delta = { p, cls: p > 2 ? "up" : p < -2 ? "down" : "flat" };
  }

  const max = byCat.length ? byCat[0].amt : 1;

  return (
    <div className="view">
      <div className="monthbar">
        <button className="mbtn" onClick={() => shiftMonth(-1)} aria-label="Mese precedente">
          <ChevronLeft size={21} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div className="eyebrow">{cursor.y}</div>
          <h1 className="h1">{cap(monthName(cursor.y, cursor.m))}</h1>
        </div>
        <button className="mbtn" onClick={() => shiftMonth(1)} disabled={isCurrentMonth} aria-label="Mese successivo">
          <ChevronRight size={21} />
        </button>
      </div>

      <div className="glass hero">
        <div className="eyebrow">Totale speso</div>
        <div className="hero-amount num">{eur(total)}</div>

        {delta && (
          <div className={`delta ${delta.cls}`}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>
              {delta.p > 2 ? "↑" : delta.p < -2 ? "↓" : "→"}
            </span>
            {Math.abs(delta.p)}% rispetto a {prev.name}
          </div>
        )}

        <div className="meter" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className={`meter-fill ${over ? "over" : ""}`} style={{ width: `${Math.max(pct, 2)}%` }} />
        </div>
        <div className="meter-foot">
          <span>
            {over
              ? <b style={{ color: "#BE123C" }}>{eur(Math.abs(rest))} oltre il budget</b>
              : <>Restano <b style={{ color: "var(--text)" }}>{eur(rest)}</b></>}
          </span>
          <span className="num">Budget {eurShort(budget)}</span>
        </div>
      </div>

      <h2 className="h2">Per categoria</h2>
      {byCat.length === 0 ? (
        <div className="glass empty">
          Nessuna spesa in questo mese.<br />Tocca <b>+</b> per registrarne una.
        </div>
      ) : (
        <div className="glass card">
          {byCat.map((c, i) => {
            const { label, color, Icon } = catOf(c.id);
            return (
              <div key={c.id}>
                {i > 0 && <div className="sep" />}
                <div className="row" style={{ cursor: "default" }}>
                  <div className="chip-ico" style={{ background: `${color}1F` }}>
                    <Icon size={18} color={color} strokeWidth={2.1} />
                  </div>
                  <div className="row-main">
                    <div className="row-title">{label}</div>
                    <div className="bar">
                      <i style={{ width: `${(c.amt / max) * 100}%`, background: color }} />
                    </div>
                  </div>
                  <div className="row-amt num">{eur(c.amt)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recent.length > 0 && (
        <>
          <h2 className="h2">Ultime spese</h2>
          <div className="glass card">
            {recent.map((t, i) => (
              <div key={t.id}>
                {i > 0 && <div className="sep" />}
                <TxRow tx={t} onOpen={onOpen} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Riga transazione                                                   */
/* ------------------------------------------------------------------ */

function TxRow({ tx, onOpen }) {
  const { get: catOf } = useCats();
  const { label, color, Icon } = catOf(tx.category);
  const d = new Date(tx.date + "T12:00:00");
  return (
    <button className="row" onClick={() => onOpen(tx)}>
      <div className="chip-ico" style={{ background: `${color}1F` }}>
        <Icon size={18} color={color} strokeWidth={2.1} />
      </div>
      <div className="row-main">
        <div className="row-title">{tx.note?.trim() || label}</div>
        <div className="row-sub">
          <span>{tx.note?.trim() ? label : ""}</span>
          <span>{d.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</span>
          {tx.rec && <span className="badge"><Repeat size={9} /> ricorrente</span>}
        </div>
      </div>
      <div className="row-amt num">{eur(tx.amount)}</div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Vista elenco                                                       */
/* ------------------------------------------------------------------ */

function ListView({ tx, onOpen }) {
  const { get: catOf, all: allCats } = useCats();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState([]);

  const present = useMemo(
    () => allCats.filter((c) => tx.some((t) => t.category === c.id)),
    [allCats, tx]
  );

  const toggle = (id) =>
    setFilters((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tx
      .filter((t) => !filters.length || filters.includes(t.category))
      .filter((t) =>
        !s ||
        (t.note || "").toLowerCase().includes(s) ||
        catOf(t.category).label.toLowerCase().includes(s) ||
        String(t.amount).includes(s))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [tx, q, filters, catOf]);

  const sumFiltered = useMemo(
    () => filtered.reduce((s, t) => s + t.amount, 0),
    [filtered]
  );

  const groups = useMemo(() => {
    const g = [];
    filtered.forEach((t) => {
      const last = g[g.length - 1];
      if (last && last.date === t.date) last.items.push(t);
      else g.push({ date: t.date, items: [t] });
    });
    return g;
  }, [filtered]);

  const dayLabel = (iso) => {
    const d = new Date(iso + "T12:00:00");
    const n = new Date();
    const diff = Math.round(
      (new Date(n.getFullYear(), n.getMonth(), n.getDate()) -
        new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000
    );
    if (diff === 0) return "Oggi";
    if (diff === 1) return "Ieri";
    return cap(d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }));
  };

  return (
    <div className="view">
      <h1 className="h1" style={{ margin: "0 4px 16px" }}>Spese</h1>

      <div className="glass-thin searchbar" style={{ borderRadius: 18 }}>
        <Search size={17} color={MUTED_ICON} />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca per nota, categoria o importo"
        />
        {q && (
          <button onClick={() => setQ("")} aria-label="Cancella ricerca">
            <X size={16} color={MUTED_ICON} />
          </button>
        )}
      </div>

      {present.length > 1 && (
        <>
          <div className="fchips">
            <button
              className="fchip"
              onClick={() => setFilters([])}
              style={filters.length === 0 ? { background: "#15141C", color: "#fff", borderColor: "transparent" } : undefined}
            >
              Tutte
            </button>
            {present.map(({ id, label, color, Icon }) => {
              const on = filters.includes(id);
              return (
                <button
                  key={id} className={`fchip ${on ? "on" : ""}`} onClick={() => toggle(id)}
                  style={on ? { background: color } : undefined}
                >
                  <Icon size={14} strokeWidth={2.2} color={on ? "#fff" : color} />
                  {label}
                </button>
              );
            })}
          </div>
          {filters.length > 0 && (
            <div className="filterinfo">
              <span>
                {filtered.length} {filtered.length === 1 ? "spesa" : "spese"} ·{" "}
                <b className="num" style={{ color: "var(--text)" }}>{eur(sumFiltered)}</b>
              </span>
              <button className="linkbtn" onClick={() => setFilters([])}>Azzera filtri</button>
            </div>
          )}
        </>
      )}

      {groups.length === 0 ? (
        <div className="glass empty">
          {q || filters.length
            ? <>Nessun risultato.<br />Prova a cambiare ricerca o filtri.</>
            : <>Ancora nessuna spesa.<br />Tocca <b>+</b> per registrare la prima.</>}
        </div>
      ) : (
        groups.map((g) => {
          const sum = g.items.reduce((s, t) => s + t.amount, 0);
          return (
            <div key={g.date}>
              <div className="daylabel" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{dayLabel(g.date)}</span>
                <span className="num">{eur(sum)}</span>
              </div>
              <div className="glass card">
                {g.items.map((t, i) => (
                  <div key={t.id}>
                    {i > 0 && <div className="sep" />}
                    <TxRow tx={t} onOpen={onOpen} />
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Impostazioni                                                       */
/* ------------------------------------------------------------------ */

function SettingsView({ data, setData, applyRecurring, exportCSV, storageOk }) {
  const { get: catOf, all: allCats } = useCats();
  const [budget, setBudget] = useState(String(data.budget));
  const [adding, setAdding] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const commitBudget = () => {
    const v = parseAmount(budget);
    setData((d) => ({ ...d, budget: v }));
    setBudget(String(v));
  };

  const addRecurring = (r) => {
    setData((d) => applyRecurring({ ...d, recurring: [...d.recurring, r] }));
    setAdding(false);
  };

  const delRecurring = (id) =>
    setData((d) => ({ ...d, recurring: d.recurring.filter((r) => r.id !== id) }));

  return (
    <div className="view">
      <h1 className="h1" style={{ margin: "0 4px 16px" }}>Impostazioni</h1>

      {!storageOk && (
        <div className="notice">
          I dati non vengono salvati su questo dispositivo. Esporta il CSV prima di chiudere l’app.
        </div>
      )}

      <div className="glass" style={{ overflow: "hidden" }}>
        <div className="setrow">
          <div>
            <div className="setrow-label">Budget mensile</div>
            <div className="setrow-hint">Il limite che vuoi rispettare ogni mese.</div>
          </div>
          <input
            className="budgetinput num" inputMode="decimal" value={budget}
            onChange={(e) => setBudget(e.target.value.replace(/[^\d.,]/g, ""))}
            onBlur={commitBudget}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
        </div>
      </div>

      <h2 className="h2">Categorie</h2>
      <CategoryManager
        cats={allCats}
        transactions={data.transactions}
        recurring={data.recurring}
        setData={setData}
      />

      <h2 className="h2">Spese ricorrenti</h2>
      <div className="glass card">
        {data.recurring.length === 0 && !adding && (
          <div className="empty" style={{ padding: "26px 20px" }}>
            Affitto, abbonamenti, rate: registrali una volta e verranno aggiunti da soli ogni mese.
          </div>
        )}
        {data.recurring.map((r, i) => {
          const { label, color, Icon } = catOf(r.category);
          return (
            <div key={r.id}>
              {i > 0 && <div className="sep" />}
              <div className="row" style={{ cursor: "default" }}>
                <div className="chip-ico" style={{ background: `${color}1F` }}>
                  <Icon size={18} color={color} strokeWidth={2.1} />
                </div>
                <div className="row-main">
                  <div className="row-title">{r.label}</div>
                  <div className="row-sub">{label} · ogni {r.day} del mese</div>
                </div>
                <div className="row-amt num">{eur(r.amount)}</div>
                <button onClick={() => delRecurring(r.id)} aria-label={`Elimina ${r.label}`} style={{ padding: 6 }}>
                  <Trash2 size={16} color={MUTED_ICON} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {adding ? (
        <RecurringForm onSave={addRecurring} onCancel={() => setAdding(false)} />
      ) : (
        <button className="ghost" onClick={() => setAdding(true)}>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Plus size={16} /> Aggiungi spesa ricorrente
          </span>
        </button>
      )}

      <h2 className="h2">Dati</h2>
      <button className="ghost" onClick={exportCSV} style={{ marginTop: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Download size={16} /> Esporta CSV
        </span>
      </button>
      <button
        className="ghost danger"
        onClick={() => {
          if (confirmReset) { setData({ ...DEFAULT_DATA, budget: data.budget }); setConfirmReset(false); }
          else setConfirmReset(true);
        }}
      >
        {confirmReset ? "Tocca di nuovo per cancellare tutto" : "Cancella tutti i dati"}
      </button>

      <p style={{ fontSize: 11.5, color: "var(--t3)", textAlign: "center", margin: "22px 20px 0", lineHeight: 1.6 }}>
        {data.transactions.length} spese registrate · i dati restano su questo dispositivo
      </p>
    </div>
  );
}

function RecurringForm({ onSave, onCancel }) {
  const { visible: CATS } = useCats();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState((CATS[0] || {}).id);
  const [day, setDay] = useState("1");

  const valid = label.trim() && parseAmount(amount) > 0 && category;

  return (
    <div className="glass" style={{ padding: 16, marginTop: 10 }}>
      <div className="field" style={{ marginBottom: 9 }}>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nome (es. Affitto)" />
      </div>
      <div className="metarow">
        <div className="field" style={{ flex: 1 }}>
          <span style={{ color: "var(--t3)", fontSize: 14 }}>€</span>
          <input
            className="num" inputMode="decimal" value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="0,00"
          />
        </div>
        <div className="field" style={{ width: 120 }}>
          <span style={{ color: "var(--t3)", fontSize: 12, whiteSpace: "nowrap" }}>giorno</span>
          <input
            className="num" inputMode="numeric" value={day}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              setDay(v === "" ? "" : String(Math.min(Math.max(+v, 1), 28)));
            }}
          />
        </div>
      </div>
      <div className="catstrip">
        {CATS.map(({ id, label: l, color, Icon }) => (
          <button key={id} className={`cat ${category === id ? "on" : ""}`} onClick={() => setCategory(id)}>
            <Icon size={19} color={category === id ? color : MUTED_ICON} strokeWidth={2.1} />
            {l}
          </button>
        ))}
      </div>
      <button
        className="cta" disabled={!valid}
        onClick={() => onSave({
          id: uid(), label: label.trim(), amount: parseAmount(amount),
          category, day: Math.min(Math.max(+day || 1, 1), 28),
        })}
      >
        Salva ricorrenza
      </button>
      <button className="ghost" onClick={onCancel}>Annulla</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Foglio di inserimento — 3 tocchi                                   */
/* ------------------------------------------------------------------ */

function EntrySheet({ tx, onSave, onDelete, onClose }) {
  const { visible: CATS } = useCats();
  const editing = !!tx;
  const [raw, setRaw] = useState(editing ? String(tx.amount).replace(".", ",") : "");
  const [category, setCategory] = useState(editing ? tx.category : null);
  const [date, setDate] = useState(editing ? tx.date : isoDate(new Date()));
  const [note, setNote] = useState(editing ? (tx.rec ? "" : tx.note || "") : "");
  const [confirmDel, setConfirmDel] = useState(false);
  const stripRef = useRef(null);
  const sheetRef = useRef(null);
  // active: pointer is down somewhere in the sheet, not yet decided what the gesture is.
  // moving: confirmed as a sheet-drag (as opposed to a tap, or a scroll/swipe the sheet itself should ignore).
  const drag = useRef({ active: false, moving: false, pointerId: null, startX: 0, startY: 0, startT: 0, lastY: 0 });

  const amount = parseAmount(raw);
  const valid = amount > 0 && category;

  const DISMISS_DISTANCE = 110;
  const DISMISS_VELOCITY = 0.6; // px/ms
  const DRAG_SLOP = 6; // px of wiggle room before a touch counts as an intentional drag, not a tap

  const closeWithSlide = () => {
    const el = sheetRef.current;
    if (el) {
      el.style.transition = "transform .22s cubic-bezier(.22,1,.36,1)";
      el.style.transform = "translateY(100%)";
    }
    setTimeout(onClose, 200);
  };

  const snapBack = () => {
    const el = sheetRef.current;
    if (el) {
      el.style.transition = "transform .3s cubic-bezier(.22,1,.36,1)";
      el.style.transform = "";
    }
  };

  const onSheetPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = {
      active: true, moving: false, pointerId: e.pointerId,
      startX: e.clientX, startY: e.clientY, startT: Date.now(), lastY: e.clientY,
    };
  };

  const onSheetPointerMove = (e) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    d.lastY = e.clientY;

    if (!d.moving) {
      if (Math.abs(dx) < DRAG_SLOP && Math.abs(dy) < DRAG_SLOP) return;
      // Only claim the gesture when it's clearly a downward drag (not a horizontal
      // swipe on the category strip, and not an upward scroll of the sheet's own
      // content) and the sheet content is scrolled all the way to the top — mirrors
      // how Apple's sheets defer to inner scrolling first, then drag once at the top.
      const goingDown = dy > 0 && dy > Math.abs(dx) * 1.2;
      const atTop = (sheetRef.current?.scrollTop ?? 0) <= 0;
      if (!goingDown || !atTop) { d.active = false; return; }
      d.moving = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }

    e.preventDefault();
    const offset = Math.max(0, dy);
    const el = sheetRef.current;
    if (el) {
      el.style.transition = "none";
      el.style.transform = `translateY(${offset}px)`;
    }
  };

  const onSheetPointerUp = (e) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.pointerId) return;
    d.active = false;
    if (!d.moving) return;
    d.moving = false;
    const offset = Math.max(0, d.lastY - d.startY);
    const velocity = offset / Math.max(1, Date.now() - d.startT);
    if (offset > DISMISS_DISTANCE || (offset > 24 && velocity > DISMISS_VELOCITY)) {
      closeWithSlide();
    } else {
      snapBack();
    }
  };

  const press = (k) => {
    setRaw((r) => {
      if (k === "back") return r.slice(0, -1);
      if (k === ",") return r.includes(",") ? r : (r === "" ? "0," : r + ",");
      if (r.includes(",") && r.split(",")[1].length >= 2) return r;
      if (r === "0" && k !== ",") return k;
      if (r.replace(",", "").length >= 8) return r;
      return r + k;
    });
  };

  const display = raw === "" ? "0" : raw;

  return (
    <div
      className="sheet" role="dialog" aria-label={editing ? "Modifica spesa" : "Nuova spesa"}
      ref={sheetRef}
      onPointerDown={onSheetPointerDown}
      onPointerMove={onSheetPointerMove}
      onPointerUp={onSheetPointerUp}
      onPointerCancel={onSheetPointerUp}
    >
      <div className="sheet-handle">
        <div className="grip" />

        <div className="display">
          <div className="eyebrow">{editing ? "Modifica spesa" : "Nuova spesa"}</div>
          <div className={`display-amt num ${amount === 0 ? "zero" : ""}`} style={{ marginTop: 8 }}>
            {display} <span style={{ fontSize: 30, opacity: .5 }}>€</span>
          </div>
        </div>
      </div>

      <div className="catstrip" ref={stripRef}>
        {CATS.map(({ id, label, color, Icon }) => (
          <button
            key={id}
            className={`cat ${category === id ? "on" : ""}`}
            onClick={() => setCategory(id)}
            style={category === id
              ? { boxShadow: `0 3px 12px ${color}40, inset 0 0 0 1.5px ${color}` }
              : undefined}
          >
            <Icon size={20} color={category === id ? color : MUTED_ICON} strokeWidth={2.1} />
            {label}
          </button>
        ))}
      </div>

      <div className="metarow">
        <div className="field" style={{ width: 148 }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (facoltativa)" maxLength={60} />
        </div>
      </div>

      <div className="pad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0"].map((k) => (
          <button key={k} className="key num" onClick={() => press(k)}>{k}</button>
        ))}
        <button className="key" onClick={() => press("back")} aria-label="Cancella">
          <Delete size={21} strokeWidth={2} />
        </button>
      </div>

      <button
        className="cta" disabled={!valid}
        onClick={() => onSave({
          id: editing ? tx.id : uid(),
          amount, category, date,
          note: note.trim(),
          ...(editing && tx.rec ? { rec: tx.rec } : {}),
        })}
      >
        {editing ? "Salva modifiche" : valid ? `Salva ${eur(amount)}` : "Inserisci importo e categoria"}
      </button>

      {editing ? (
        <button
          className="ghost danger"
          onClick={() => (confirmDel ? onDelete(tx.id) : setConfirmDel(true))}
        >
          {confirmDel
            ? <span style={{ display: "flex", alignItems: "center", gap: 7 }}><Check size={16} /> Tocca di nuovo per eliminare</span>
            : <span style={{ display: "flex", alignItems: "center", gap: 7 }}><Trash2 size={16} /> Elimina spesa</span>}
        </button>
      ) : (
        <button className="ghost" onClick={onClose}>Annulla</button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Grafici                                                            */
/* ------------------------------------------------------------------ */

function ChartsView({ transactions, budget }) {
  const { get: catOf } = useCats();
  const [range, setRange] = useState(6);
  const [sel, setSel] = useState(null);
  const now = new Date();

  const months = useMemo(() => {
    const out = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear(), m = d.getMonth();
      const tx = transactions.filter((t) => {
        const [ty, tm] = t.date.split("-").map(Number);
        return ty === y && tm - 1 === m;
      });
      out.push({ y, m, tx, total: tx.reduce((s, t) => s + t.amount, 0) });
    }
    return out;
  }, [transactions, range]);

  const idx = sel === null || sel > months.length - 1 ? months.length - 1 : sel;
  const cur = months[idx];
  const isNow = cur.y === now.getFullYear() && cur.m === now.getMonth();
  const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate();
  const upTo = isNow ? now.getDate() : daysInMonth;

  const slices = useMemo(() => {
    const map = {};
    cur.tx.forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map)
      .map(([id, amt]) => ({ ...catOf(id), amt }))
      .sort((a, b) => b.amt - a.amt);
  }, [cur]);

  const byDay = useMemo(() => {
    const arr = Array(daysInMonth).fill(0);
    cur.tx.forEach((t) => { arr[Number(t.date.split("-")[2]) - 1] += t.amount; });
    return arr;
  }, [cur, daysInMonth]);

  const peak = useMemo(() => {
    let best = { day: 0, amt: 0 };
    byDay.forEach((v, i) => { if (v > best.amt) best = { day: i + 1, amt: v }; });
    return best;
  }, [byDay]);

  const label = `${monthName(cur.y, cur.m)} ${String(cur.y).slice(2)}`;
  const hasAny = months.some((m) => m.total > 0);

  if (!hasAny) {
    return (
      <div className="view">
        <h1 className="h1" style={{ margin: "0 4px 16px" }}>Grafici</h1>
        <div className="glass empty">
          I grafici compaiono appena registri qualche spesa.<br />Tocca <b>+</b> per iniziare.
        </div>
      </div>
    );
  }

  return (
    <div className="view">
      <h1 className="h1" style={{ margin: "0 4px 16px" }}>Grafici</h1>

      <div className="seg glass-thin">
        {[6, 12].map((r) => (
          <button
            key={r} className={range === r ? "on" : ""}
            onClick={() => { setRange(r); setSel(null); }}
          >
            {r} mesi
          </button>
        ))}
      </div>

      <div className="glass chartcard">
        <div className="chart-head">
          <span className="chart-title">Andamento</span>
          <span className="chart-sub">tocca una barra</span>
        </div>
        <TrendChart months={months} budget={budget} idx={idx} onSelect={setSel} />
      </div>

      <div className="glass chartcard">
        <div className="chart-head">
          <span className="chart-title">Ripartizione</span>
          <span className="chart-sub">{cap(label)}</span>
        </div>
        {slices.length === 0 ? (
          <div className="empty" style={{ padding: "26px 10px" }}>
            Nessuna spesa in {monthName(cur.y, cur.m)}.
          </div>
        ) : (
          <>
            <Donut slices={slices} total={cur.total} />
            <div style={{ marginTop: 8 }}>
              {slices.map((s, i) => (
                <div key={s.id}>
                  {i > 0 && <div className="sep" style={{ margin: 0 }} />}
                  <div className="legend">
                    <span className="dot" style={{ background: s.color }} />
                    <span className="legend-name">{s.label}</span>
                    <span className="legend-pct num">{Math.round((s.amt / cur.total) * 100)}%</span>
                    <span className="legend-amt num">{eur(s.amt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="glass chartcard">
        <div className="chart-head">
          <span className="chart-title">Ritmo di spesa</span>
          <span className="chart-sub">{isNow ? `giorni 1–${upTo}` : "mese intero"}</span>
        </div>
        <PaceChart byDay={byDay} upTo={upTo} daysInMonth={daysInMonth} budget={budget} />
      </div>

      <div className="tiles">
        <div className="glass tile">
          <div className="tile-k">Media al giorno</div>
          <div className="tile-v num">{eur(cur.total / Math.max(upTo, 1))}</div>
          <div className="tile-s">su {upTo} giorni</div>
        </div>
        <div className="glass tile">
          <div className="tile-k">Giorno più caro</div>
          <div className="tile-v num">{eur(peak.amt)}</div>
          <div className="tile-s">{peak.day ? `${peak.day} ${monthName(cur.y, cur.m)}` : "—"}</div>
        </div>
        <div className="glass tile">
          <div className="tile-k">Categoria top</div>
          <div className="tile-v" style={{ fontSize: 17 }}>{slices[0] ? slices[0].label : "—"}</div>
          <div className="tile-s">{slices[0] ? eur(slices[0].amt) : "nessuna spesa"}</div>
        </div>
        <div className="glass tile">
          <div className="tile-k">Spese registrate</div>
          <div className="tile-v num">{cur.tx.length}</div>
          <div className="tile-s">in {monthName(cur.y, cur.m)}</div>
        </div>
      </div>
    </div>
  );
}

/* --- barre: andamento mensile --- */

function TrendChart({ months, budget, idx, onSelect }) {
  const W = 340, H = 182, TOP = 30, BOT = 24;
  const h = H - TOP - BOT;
  const n = months.length;
  const gap = n > 8 ? 6 : 11;
  const bw = (W - gap * (n - 1)) / n;
  const max = Math.max(...months.map((m) => m.total), budget, 1) * 1.1;
  const yOf = (v) => TOP + h - (v / max) * h;
  const bLine = yOf(budget);

  return (
    <div className="svgwrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Spesa mensile">
        <defs>
          <linearGradient id="bg-on" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#22C7E8" />
          </linearGradient>
        </defs>

        {budget > 0 && bLine > TOP && (
          <>
            <line x1="0" y1={bLine} x2={W} y2={bLine}
              stroke="rgba(30,28,44,.26)" strokeWidth="1" strokeDasharray="3 4" />
            <text x="0" y={bLine - 6} className="axis hint">budget {eurShort(budget)}</text>
          </>
        )}

        {months.map((m, i) => {
          const x = i * (bw + gap);
          const bh = Math.max((m.total / max) * h, m.total > 0 ? 3 : 0);
          const y = TOP + h - bh;
          const on = i === idx;
          return (
            <g key={`${m.y}-${m.m}`} onClick={() => onSelect(i)} style={{ cursor: "pointer" }}>
              <rect x={x} y={TOP} width={bw} height={h + BOT} fill="transparent" />
              {bh > 0 && (
                <rect
                  className="barv" x={x} y={y} width={bw} height={bh}
                  rx={Math.min(bw / 2, 7)}
                  fill={on ? "url(#bg-on)" : "rgba(30,28,44,.13)"}
                  style={{ animationDelay: `${i * 45}ms` }}
                />
              )}
              {on && m.total > 0 && (
                <text x={x + bw / 2} y={y - 9} textAnchor="middle" className="vlabel num">
                  {eurShort(m.total)}
                </text>
              )}
              <text
                x={x + bw / 2} y={H - 7} textAnchor="middle"
                className={`axis ${on ? "on" : ""}`}
              >
                {monthName(m.y, m.m).slice(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* --- ciambella: ripartizione --- */

function Donut({ slices, total }) {
  const R = 70, SW = 22, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="svgwrap donut" style={{ maxWidth: 230, margin: "0 auto" }}>
      <svg viewBox="0 0 200 200" role="img" aria-label="Spesa per categoria">
        <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(24,22,44,.06)" strokeWidth={SW} />
        <g transform="rotate(-90 100 100)">
          {slices.map((s) => {
            const frac = s.amt / total;
            const len = Math.max(frac * C - 2.5, 1.5);
            const off = -acc * C;
            acc += frac;
            return (
              <circle
                key={s.id} cx="100" cy="100" r={R} fill="none"
                stroke={s.color} strokeWidth={SW} strokeLinecap="round"
                strokeDasharray={`${len} ${C - len}`} strokeDashoffset={off}
              />
            );
          })}
        </g>
        <text x="100" y="96" textAnchor="middle" className="num"
          style={{ fontSize: 23, fontWeight: 700, fill: "var(--text)", letterSpacing: "-.03em" }}>
          {eurShort(total)}
        </text>
        <text x="100" y="115" textAnchor="middle"
          style={{ fontSize: 11, fontWeight: 580, fill: "rgba(30,28,44,.42)" }}>
          {slices.length} categorie
        </text>
      </svg>
    </div>
  );
}

/* --- area: ritmo cumulativo vs budget --- */

function PaceChart({ byDay, upTo, daysInMonth, budget }) {
  const W = 340, H = 156, TOP = 12, BOT = 22;
  const h = H - TOP - BOT;

  const cum = [];
  let run = 0;
  for (let i = 0; i < upTo; i++) { run += byDay[i]; cum.push(run); }
  const spent = run;
  const max = Math.max(spent, budget, 1) * 1.08;

  const xOf = (i) => (i / Math.max(daysInMonth - 1, 1)) * W;
  const yOf = (v) => TOP + h - (v / max) * h;

  const line = cum.map((v, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");
  const area = `${line} L${xOf(upTo - 1).toFixed(1)},${TOP + h} L0,${TOP + h} Z`;
  const ahead = budget > 0 && spent > (budget / daysInMonth) * upTo;

  return (
    <div className="svgwrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Spesa cumulata nel mese">
        <defs>
          <linearGradient id="pace-a" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ahead ? "rgba(225,29,72,.28)" : "rgba(99,102,241,.28)"} />
            <stop offset="100%" stopColor="rgba(99,102,241,0)" />
          </linearGradient>
        </defs>

        {budget > 0 && (
          <line
            x1="0" y1={yOf(budget / daysInMonth)} x2={W} y2={yOf(budget)}
            stroke="rgba(30,28,44,.28)" strokeWidth="1.2" strokeDasharray="3 4"
          />
        )}

        {cum.length > 1 && (
          <>
            <path d={area} fill="url(#pace-a)" />
            <path
              className="trace" d={line} fill="none"
              stroke={ahead ? "#E11D48" : "#5B5BF0"} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
            />
            <circle cx={xOf(upTo - 1)} cy={yOf(spent)} r="4.5"
              fill={ahead ? "#E11D48" : "#5B5BF0"} stroke="#fff" strokeWidth="2.5" />
          </>
        )}

        <text x="0" y={H - 6} className="axis">1</text>
        <text x={W} y={H - 6} textAnchor="end" className="axis">{daysInMonth}</text>
        <text x={W / 2} y={H - 6} textAnchor="middle" className="axis hint">
          {budget > 0
            ? (ahead ? "sopra il ritmo del budget" : "entro il ritmo del budget")
            : "spesa cumulata"}
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Gestione categorie                                                 */
/* ------------------------------------------------------------------ */

function CategoryManager({ cats, transactions, recurring, setData }) {
  const [openId, setOpenId] = useState(null);

  const usage = useMemo(() => {
    const u = {};
    transactions.forEach((t) => { u[t.category] = (u[t.category] || 0) + 1; });
    recurring.forEach((r) => { u[r.category] = (u[r.category] || 0) + 1; });
    return u;
  }, [transactions, recurring]);

  const update = (id, patch) =>
    setData((d) => ({
      ...d,
      categories: (d.categories || DEFAULT_CATEGORIES).map((c) =>
        c.id === id ? { ...c, ...patch } : c),
    }));

  const remove = (id) => {
    setData((d) => ({
      ...d,
      categories: (d.categories || DEFAULT_CATEGORIES).filter((c) => c.id !== id),
    }));
    setOpenId(null);
  };

  const add = () => {
    const id = "cat_" + uid();
    setData((d) => ({
      ...d,
      categories: [
        ...(d.categories || DEFAULT_CATEGORIES),
        { id, label: "Nuova categoria", icon: "dots", color: PALETTE[4] },
      ],
    }));
    setOpenId(id);
  };

  return (
    <>
      <div className="glass card">
        {cats.map((c, i) => {
          const Icon = c.Icon;
          const open = openId === c.id;
          return (
            <div key={c.id}>
              {i > 0 && <div className="sep" />}
              <button className="row" onClick={() => setOpenId(open ? null : c.id)}>
                <div className="chip-ico" style={{ background: `${c.color}1F` }}>
                  <Icon size={18} color={c.color} strokeWidth={2.1} />
                </div>
                <div className="row-main">
                  <div className="row-title" style={{ opacity: c.hidden ? .5 : 1 }}>{c.label}</div>
                  <div className="row-sub">
                    {usage[c.id] ? `${usage[c.id]} usi` : "mai usata"}
                    {c.hidden && <span className="badge"><EyeOff size={9} /> nascosta</span>}
                  </div>
                </div>
                <Pencil size={15} color={MUTED_ICON} />
              </button>
              {open && (
                <CategoryEditor
                  cat={c}
                  uses={usage[c.id] || 0}
                  canDelete={cats.length > 1 && !usage[c.id]}
                  onChange={(patch) => update(c.id, patch)}
                  onDelete={() => remove(c.id)}
                  onClose={() => setOpenId(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      <button className="ghost" onClick={add}>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Plus size={16} /> Aggiungi categoria
        </span>
      </button>
    </>
  );
}

function CategoryEditor({ cat, uses, canDelete, onChange, onDelete, onClose }) {
  return (
    <div className="editor">
      <div className="field">
        <input
          value={cat.label} maxLength={22} autoFocus
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Nome categoria"
        />
      </div>

      <div className="ed-label">Colore</div>
      <div className="swatches">
        {PALETTE.map((c) => (
          <button
            key={c} className={`swatch ${cat.color === c ? "on" : ""}`}
            style={{ background: c }} onClick={() => onChange({ color: c })}
            aria-label={`Usa il colore ${c}`}
          />
        ))}
      </div>

      <div className="ed-label">Icona</div>
      <div className="iconsgrid">
        {Object.entries(ICONS).map(([key, I]) => (
          <button
            key={key} className={`iconbtn ${cat.icon === key ? "on" : ""}`}
            onClick={() => onChange({ icon: key })} aria-label={`Icona ${key}`}
            style={cat.icon === key ? { color: cat.color, borderColor: cat.color } : undefined}
          >
            <I size={18} strokeWidth={2.1} />
          </button>
        ))}
      </div>

      <button className="ghost" style={{ marginTop: 18 }} onClick={() => onChange({ hidden: !cat.hidden })}>
        {cat.hidden ? "Mostra tra le categorie" : "Nascondi dall’inserimento"}
      </button>

      {canDelete ? (
        <button className="ghost danger" onClick={onDelete}>Elimina categoria</button>
      ) : uses > 0 ? (
        <p className="setrow-hint" style={{ textAlign: "center", margin: "10px 8px 0" }}>
          Usata in {uses} {uses === 1 ? "voce" : "voci"}: puoi nasconderla, così sparisce
          dall’inserimento ma le spese passate restano intatte.
        </p>
      ) : null}

      <button className="cta" style={{ marginTop: 12, height: 46 }} onClick={onClose}>Fine</button>
    </div>
  );
}
