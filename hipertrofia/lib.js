// lib.js — estado, sincronização, agenda, progressão e zonas (sem DOM)
'use strict';

const LS_KEY = 'jnt.estado.v1';
const DAY = 86400000;

// ---------- datas (sempre em horário local, formato YYYY-MM-DD)
function isoLocal(d) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
function parseISO(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(s, n) { const d = parseISO(s); d.setDate(d.getDate() + n); return isoLocal(d); }
function todayISO() { return isoLocal(new Date()); }
function weekday(s) { return parseISO(s).getDay(); } // 0 dom ... 1 seg
const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
function fmtDate(s, opts = { weekday: 'short', day: '2-digit', month: 'short' }) {
  return parseISO(s).toLocaleDateString('pt-BR', opts).replace('.', '');
}

// ---------- estado local + merge
function emptyState() {
  return { v: 1, logs: {}, body: {}, analyses: {}, polar: {}, settings: { updatedAt: 0 }, updatedAt: 0 };
}
function loadState() {
  try { return Object.assign(emptyState(), JSON.parse(localStorage.getItem(LS_KEY) || '{}')); }
  catch (e) { return emptyState(); }
}
function saveLocal(st) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(st)); } catch (e) { console.warn('localStorage cheio?', e); }
}
// merge por registro: vence o updatedAt mais novo (mesma regra no servidor)
function mergeState(a, b) {
  const out = emptyState();
  for (const k of ['logs', 'body', 'analyses', 'polar']) {
    const A = (a && a[k]) || {}, B = (b && b[k]) || {};
    const keys = new Set([...Object.keys(A), ...Object.keys(B)]);
    for (const id of keys) {
      const x = A[id], y = B[id];
      out[k][id] = !x ? y : !y ? x : ((y.updatedAt || 0) > (x.updatedAt || 0) ? y : x);
    }
  }
  const sa = (a && a.settings) || {}, sb = (b && b.settings) || {};
  out.settings = (sb.updatedAt || 0) > (sa.updatedAt || 0) ? sb : sa;
  out.updatedAt = Math.max((a && a.updatedAt) || 0, (b && b.updatedAt) || 0);
  return out;
}

// ---------- API (Azure SWA; em local/preview cai para modo offline)
const Api = {
  online: null, user: null,
  async me() {
    try {
      const r = await fetch('/.auth/me', { cache: 'no-store' });
      if (!r.ok) throw 0;
      const j = await r.json();
      this.user = j.clientPrincipal || null;
    } catch (e) { this.user = null; }
    return this.user;
  },
  async get(path) {
    const r = await fetch('/api/' + path, { cache: 'no-store', credentials: 'same-origin' });
    if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
    return r.json();
  },
  async send(path, body, method = 'POST') {
    const r = await fetch('/api/' + path, {
      method, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`${path}: HTTP ${r.status} ${await r.text().catch(() => '')}`.trim());
    return r.json();
  },
};

const Sync = {
  timer: null, busy: false, listeners: [],
  status: 'local', // local | ok | pendente | erro
  set(s) { this.status = s; this.listeners.forEach(f => f(s)); },
  async pull(st) {
    if (!Api.user) { this.set('local'); return st; }
    try {
      const remote = await Api.get('estado');
      const merged = mergeState(st, remote);
      saveLocal(merged);
      this.set('ok');
      return merged;
    } catch (e) { console.warn(e); this.set('erro'); return st; }
  },
  schedule(getState, apply) {
    if (!Api.user) { this.set('local'); return; }
    this.set('pendente');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.push(getState, apply), 1200);
  },
  async push(getState, apply) {
    if (this.busy) { this.schedule(getState, apply); return; }
    this.busy = true;
    try {
      const merged = await Api.send('estado', getState(), 'PUT');
      apply(mergeState(getState(), merged));
      this.set('ok');
    } catch (e) { console.warn(e); this.set('erro'); }
    finally { this.busy = false; }
  },
};

// ---------- agenda: ordem fixa, datas que se reajustam
// Sessões feitas/puladas ficam na data em que aconteceram. As pendentes são encaixadas
// a partir de hoje (nunca antes da data planejada), pulando o dia de descanso.
function computeSchedule(program, logs, today = todayISO()) {
  const rest = program.rest_weekday; // 1 = segunda
  const out = [];
  const doneToday = Object.values(logs).some(l => l && l.status === 'done' && l.date === today);
  let cursor = doneToday ? addDays(today, 1) : today;
  const nextFree = (d) => { while (weekday(d) === rest) d = addDays(d, 1); return d; };
  for (const s of program.sessions) {
    const log = logs[s.id];
    if (log && (log.status === 'done' || log.status === 'skipped')) {
      out.push({ s, date: log.date || s.planned, status: log.status, shift: 0 });
      continue;
    }
    let d = s.planned > cursor ? s.planned : cursor;
    d = nextFree(d);
    const shift = Math.round((parseISO(d) - parseISO(s.planned)) / DAY);
    out.push({ s, date: d, status: d === today ? 'hoje' : (d < today ? 'atrasado' : 'pendente'), shift, inProgress: !!(log && log.sets && Object.keys(log.sets).length) });
    cursor = addDays(d, 1);
  }
  return out;
}

// ---------- zonas (FCmáx fixa ou Karvonen se houver FC de repouso)
const ZONE_PCT = { z1: [0.50, 0.60], z2: [0.60, 0.70], z3: [0.70, 0.80], z4: [0.80, 0.90], z5: [0.90, 1.00] };
function zones(settings, program) {
  const max = Number(settings.fcmax) || program.fcmax || 176;
  const rest = Number(settings.fcrest) || 0;
  const raw = (p) => rest ? rest + p * (max - rest) : p * max;
  const z = {};
  // limites sem sobreposição: início = teto do limite, fim = piso do próximo (176 → Z2 106–123)
  for (const [k, [lo, hi]] of Object.entries(ZONE_PCT)) z[k] = [k === 'z1' ? Math.round(raw(lo)) : Math.ceil(raw(lo)), k === 'z5' ? max : Math.floor(raw(hi))];
  z.tiro = [Math.ceil(raw(0.82)), Math.round(raw(0.91))];
  z.recup = Math.round(raw(0.68));
  z.max = max; z.rest = rest; z.method = rest ? 'Karvonen (com FC de repouso)' : '% da FC máxima';
  return z;
}

// ---------- progressão (dupla progressão + regressão)
function exHistory(logs, program, name) {
  const byId = Object.fromEntries(program.sessions.map(s => [s.id, s]));
  const h = [];
  for (const [sid, log] of Object.entries(logs)) {
    if (!log || log.status !== 'done' || !log.sets) continue;
    const s = byId[sid]; if (!s || !s.blocks) continue;
    s.blocks.forEach((b, bi) => b.items.forEach((it, ii) => {
      if (it.name !== name) return;
      const sets = (log.sets[`${bi}.${ii}`] || []).filter(x => x && x.done && (Number(x.reps) > 0));
      if (!sets.length) return;
      h.push({ date: log.date, sid, phase: s.phase, range: it.reps, target: it.sets, sets });
    }));
  }
  return h.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.sid < b.sid ? -1 : 1);
}
function roundTo(x, inc) { if (!inc) return x; return Math.round(x / inc) * inc; }
function workKg(entry) { // carga de trabalho = a mais usada (desempate: maior); na calibração (rampa), a maior
  if (entry.phase === 'calibracao') return Math.max(...entry.sets.map(x => Number(x.kg) || 0));
  const c = {};
  entry.sets.forEach(s => { const k = Number(s.kg) || 0; c[k] = (c[k] || 0) + 1; });
  return Number(Object.entries(c).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0]);
}
function repsAt(entry, kg) { return entry.sets.filter(s => (Number(s.kg) || 0) === kg).reduce((a, s) => a + Number(s.reps), 0); }

function suggest(logs, program, session, item) {
  const all = exHistory(logs, program, item.name).filter(e => e.sid !== session.id);
  const hi = item.reps[1], lo = item.reps[0];
  const unit = item.unit === 's' ? 's' : 'reps';
  const last = all[all.length - 1];
  if (session.phase === 'leve') {
    if (!last) return { kg: null, kind: 'leve', note: 'Semana leve: carga confortável, longe da falha.' };
    const kg = roundTo(workKg(last) * 0.9, item.inc || 1);
    return { kg: item.inc ? kg : workKg(last), kind: 'leve', note: `Semana leve: −10% e menos séries, RIR ${item.rir}.`, last };
  }
  const h = all.filter(e => e.phase !== 'leve');
  const L = h[h.length - 1];
  if (!L) {
    return { kg: null, kind: 'calibrar',
      note: unit === 's' ? `Calibrar: sustente ${hi}s com boa técnica.` :
        `Calibrar: ache a carga que dá ${hi} reps com RIR 2 (sobram 2).`, last };
  }
  const kg = workKg(L);
  const done = L.sets.filter(s => (Number(s.kg) || 0) === kg);
  const allTop = done.length >= L.target && done.every(s => Number(s.reps) >= hi);
  const rirs = done.map(s => s.rir).filter(r => r !== undefined && r !== null && r !== '');
  const avgRir = rirs.length ? rirs.reduce((a, r) => a + Number(r), 0) / rirs.length : null;

  if (!item.inc) { // peso corporal / tempo: progride em reps ou segundos
    if (allTop) return { kg, kind: 'subir', note: unit === 's' ? `Fechou ${hi}s: some +5–10s por série.` : `Fechou ${hi} reps: acrescente carga (halter/cinto) ou +2 reps.`, last: L };
    return { kg, kind: 'manter', note: `Busque +1 ${unit === 's' ? 'a 5 s' : 'rep'} em alguma série.`, last: L };
  }
  // regressão duas vezes seguidas na mesma carga
  if (h.length >= 3) {
    const [a, b, c] = h.slice(-3);
    if (workKg(a) === kg && workKg(b) === kg && repsAt(b, kg) < repsAt(a, kg) && repsAt(c, kg) < repsAt(b, kg)) {
      return { kg: roundTo(kg * 0.9, item.inc), kind: 'reduzir', note: 'Regrediu 2 vezes seguidas: −10% para retomar a progressão.', last: L };
    }
  }
  if (allTop) {
    let step = item.main ? Math.max(item.inc, roundTo(kg * 0.025, item.inc)) : item.inc;
    if (avgRir !== null && avgRir >= 3) step *= 2;
    return { kg: roundTo(kg + step, item.inc), kind: 'subir',
      note: `Fechou ${hi} em todas as séries${avgRir !== null && avgRir >= 3 ? ' com folga (RIR ≥ 3)' : ''}: +${String(step).replace(".", ",")} kg.`, last: L };
  }
  return { kg, kind: 'manter', note: `Mantém ${kg} kg: busque +1 rep até fechar ${hi} em todas.`, last: L };
}

// trajetória esperada vs. real (por exercício)
function expectedCurve(hist, item) {
  const h = hist.filter(e => e.phase !== 'leve');
  if (!h.length) return [];
  const k0 = workKg(h[0]);
  return hist.map((e, i) => {
    const n = hist.slice(1, i + 1).filter(x => x.phase !== 'leve').length; // exposições de progressão
    const exp = item.main ? k0 * Math.pow(1.025, n) : k0 + item.inc * Math.floor(n / 2);
    return { date: e.date, real: workKg(e), exp: e.phase === 'leve' ? roundTo(exp * 0.9, item.inc || 1) : roundTo(exp, item.inc || 0.5) };
  });
}

function fmtSec(t) {
  t = Math.max(0, Math.round(t));
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

if (typeof module !== 'undefined') module.exports = { computeSchedule, suggest, exHistory, mergeState, zones, expectedCurve, addDays, isoLocal };
