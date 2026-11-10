// app.js — UI do Julio Neves - Treinos (hipertrofia)
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const App = {
  program: null,
  st: loadState(),
  view: 'agenda',
  current: null, // id da sessão aberta
  showPast: false,
};

// ---------- persistência
function commit() {
  App.st.updatedAt = Date.now();
  saveLocal(App.st);
  Sync.schedule(() => App.st, (m) => { App.st = m; saveLocal(m); });
}
function getLog(id, create = true) {
  if (!App.st.logs[id] && create) App.st.logs[id] = { sets: {}, updatedAt: Date.now() };
  return App.st.logs[id];
}
function touch(obj) { obj.updatedAt = Date.now(); }
const settings = () => App.st.settings || (App.st.settings = { updatedAt: 0 });
const Z = () => zones(settings(), App.program);

// ---------- navegação
function showView(name) {
  App.view = name;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === (name === 'sessao' ? 'agenda' : name)));
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function render(name = App.view) {
  if (name === 'agenda') renderAgenda();
  if (name === 'sessao') renderSession(App.current);
  if (name === 'progresso') renderProgress();
  if (name === 'corpo') renderBody();
  if (name === 'ajustes') renderSettings();
}
function go(name) { render(name); showView(name); }

// ---------- utilidades de UI
function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2600);
}
function beep(times = 1, freq = 880) {
  try {
    const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = freq; g.gain.value = 0.0001;
      const t0 = ctx.currentTime + i * 0.2;
      g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
      o.start(t0); o.stop(t0 + 0.17);
    }
    if (navigator.vibrate) navigator.vibrate(times > 1 ? [200, 100, 200] : 200);
  } catch (e) { }
}
function videoBtn(v, label = '▶ Ver execução') {
  if (!v) return '';
  return `<button type="button" class="ex-video" data-video="${esc(v.id)}" data-label="${esc(label)}">${label}</button>`;
}
function bindVideos(root) {
  $$('button.ex-video', root).forEach(b => b.addEventListener('click', (e) => {
    e.preventDefault();
    const player = b.closest('[data-has-player]').querySelector('.ex-player');
    if (!player.hidden) { player.hidden = true; player.innerHTML = ''; b.textContent = b.dataset.label; return; }
    player.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${b.dataset.video}?rel=0&modestbranding=1&playsinline=1&origin=${encodeURIComponent(location.origin)}"
      title="Execução" frameborder="0" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
    player.hidden = false; b.textContent = '✕ Esconder vídeo';
  }));
}
const PHASE = { calibracao: 'Calibração', progressao: 'Progressão', leve: 'Semana leve' };
const KIND_LABEL = { straight: 'Força', biset: 'Bi-set', triset: 'Tri-set' };
const kgLabel = (it) => /halter/i.test(it.equip) && !/barra/i.test(it.equip) ? 'kg/mão' : 'kg';
const fmtNum = (x) => (x === null || x === undefined || x === '') ? '' : String(Math.round(Number(x) * 10) / 10).replace('.', ',');
const toNum = (s) => { const n = Number(String(s).replace(',', '.')); return isFinite(n) ? n : null; };

// ======================================================================
// AGENDA
// ======================================================================
function renderAgenda() {
  const root = $('#view-agenda');
  const today = todayISO();
  const sched = computeSchedule(App.program, App.st.logs, today);
  const next = sched.find(x => x.status === 'hoje' || x.status === 'atrasado' || x.status === 'pendente');
  const done = sched.filter(x => x.status === 'done').length;

  let html = '';
  if (next) {
    const isToday = next.date === today;
    html += `<div class="next-card" data-open="${next.s.id}">
      <p class="eyebrow">${isToday ? 'Hoje' : 'Próximo treino'} · ${fmtDate(next.date)}</p>
      <h2>${esc(next.s.title)}</h2>
      <p class="muted">${esc(next.s.focus)}</p>
      <div class="chips-inline">
        <span class="tag">${PHASE[next.s.phase]}</span>
        <span class="tag">Ciclo ${next.s.cycle} · semana ${next.s.cycle_week}/5</span>
        ${next.shift > 0 ? `<span class="tag warn">adiado ${next.shift} d</span>` : ''}
        ${next.inProgress ? '<span class="tag ok">em andamento</span>' : ''}
      </div>
      <button class="primary-btn" data-open="${next.s.id}">${next.inProgress ? 'Continuar' : 'Abrir treino'}</button>
    </div>`;
  } else {
    html += `<div class="next-card"><h2>Programa concluído</h2><p class="muted">${done} sessões feitas. Hora de gerar o próximo bloco.</p></div>`;
  }
  html += `<div class="agenda-meta muted">${done} de ${sched.length} sessões feitas · início ${fmtDate(App.program.start, { day: '2-digit', month: 'short' })}</div>`;

  // agrupa por semana (ter→dom) a partir da data efetiva
  const weeks = new Map();
  for (const x of sched) {
    const d = parseISO(x.date); const wd = d.getDay();
    const tue = addDays(x.date, -((wd + 5) % 7)); // terça da semana
    if (!weeks.has(tue)) weeks.set(tue, []);
    weeks.get(tue).push(x);
  }
  const thisTue = addDays(today, -((parseISO(today).getDay() + 5) % 7));
  let hidden = 0;
  for (const [tue, items] of weeks) {
    const mon = addDays(tue, 6);
    if (!App.showPast && mon < thisTue && items.every(x => x.status === 'done' || x.status === 'skipped')) { hidden++; continue; }
    const s0 = items[0].s;
    html += `<h3 class="section-heading">Semana de ${fmtDate(tue, { day: '2-digit', month: 'short' })} · ${PHASE[s0.phase]}</h3><ul class="workout-list">`;
    for (const x of items) {
      const st = { done: '✓', skipped: '—', hoje: '●', atrasado: '!', pendente: '' }[x.status];
      html += `<li class="workout-card ${x.status}" data-open="${x.s.id}">
        <div class="wc-row1">
          <span class="wc-id">${WD[weekday(x.date)]}<small>${parseISO(x.date).getDate()}</small></span>
          <div class="wc-main">
            <span class="wc-title">${esc(x.s.title)}</span>
            <span class="wc-foco">${esc(x.s.focus)}${x.shift > 0 && x.status !== 'done' ? ` · adiado ${x.shift} d` : ''}</span>
          </div>
        </div>
        <span class="wc-status">${st}</span>
      </li>`;
    }
    html += `<li class="rest-day">seg ${parseISO(mon).getDate()} · descanso</li></ul>`;
  }
  if (hidden) html += `<button class="ghost-btn" id="toggle-past">Mostrar ${hidden} semana(s) anteriores</button>`;
  else if (App.showPast) html += `<button class="ghost-btn" id="toggle-past">Esconder semanas anteriores</button>`;
  root.innerHTML = html;
  $$('[data-open]', root).forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); openSession(el.dataset.open); }));
  const tp = $('#toggle-past'); if (tp) tp.addEventListener('click', () => { App.showPast = !App.showPast; renderAgenda(); });
}

function openSession(id) { App.current = id; renderSession(id); showView('sessao'); }

// ======================================================================
// SESSÃO
// ======================================================================
function sessionById(id) { return App.program.sessions.find(s => s.id === id); }
function renderSession(id) {
  const s = sessionById(id); if (!s) return;
  const root = $('#view-sessao');
  const log = App.st.logs[id];
  const sched = computeSchedule(App.program, App.st.logs).find(x => x.s.id === id);
  const z = Z();
  let html = `<button class="back-btn" id="back">← Agenda</button>
    <header class="detail-header">
      <p class="eyebrow">${fmtDate(sched.date)} · ${PHASE[s.phase]} · ciclo ${s.cycle}, semana ${s.cycle_week}/5</p>
      <h2>${esc(s.title)}</h2>
      <p class="detail-estrutura">${esc(s.focus)}</p>
      ${log && log.status === 'done' ? `<p class="tag ok">Feito em ${fmtDate(log.date)}</p>` : ''}
      ${log && log.status === 'skipped' ? `<p class="tag warn">Pulado</p>` : ''}
    </header>`;

  if (s.kind === 'strength') html += strengthHtml(s, log);
  else html += cardioHtml(s, z);

  html += polarHtml(s, log);
  html += `<label class="field-label">Notas</label>
    <textarea id="notes" class="notes" rows="2" placeholder="Como foi? Dor, sono, energia…">${esc(log?.notes || '')}</textarea>
    <div class="action-row">
      ${log?.status === 'done' ? `<button class="secondary-btn" id="undo">Reabrir sessão</button>` :
      `<button class="primary-btn" id="finish">Concluir treino</button>
       <button class="secondary-btn" id="skip">Pular esta sessão</button>`}
    </div>`;
  root.innerHTML = html;
  $('#back').addEventListener('click', () => go('agenda'));
  bindVideos(root);
  if (s.kind === 'strength') bindStrength(root, s);
  else bindCardio(root, s);
  bindPolar(root, s);
  $('#notes').addEventListener('change', (e) => { const l = getLog(s.id); l.notes = e.target.value; touch(l); commit(); });
  const fin = $('#finish'); if (fin) fin.addEventListener('click', () => finishSession(s));
  const sk = $('#skip'); if (sk) sk.addEventListener('click', () => {
    if (!confirm('Pular esta sessão? Ela fica marcada como não feita e a agenda segue para a próxima.')) return;
    const l = getLog(s.id); l.status = 'skipped'; l.date = todayISO(); touch(l); commit(); go('agenda');
  });
  const un = $('#undo'); if (un) un.addEventListener('click', () => { const l = getLog(s.id); delete l.status; touch(l); commit(); renderSession(s.id); });
}

function finishSession(s) {
  const l = getLog(s.id);
  if (s.kind === 'strength') {
    const total = s.blocks.reduce((a, b) => a + b.items.reduce((x, it) => x + it.sets, 0), 0);
    const done = Object.values(l.sets || {}).flat().filter(x => x && x.done).length;
    if (done < total && !confirm(`Você marcou ${done} de ${total} séries. Concluir assim mesmo?`)) return;
  }
  l.status = 'done'; l.date = todayISO(); l.finishedAt = new Date().toISOString(); touch(l); commit();
  stopRest();
  toast('Treino concluído. Bom trabalho!');
  go('agenda');
}

// ---------- musculação
function blockTitle(b, bi, s) {
  const letters = s.blocks.map(x => x.kind);
  // A1, A2 (força) · B1, B2 (bi-sets) · C (tri-set)
  const idx = letters.slice(0, bi + 1).filter(k => k === b.kind).length;
  const L = b.kind === 'straight' ? 'A' : b.kind === 'biset' ? 'B' : 'C';
  const n = letters.filter(k => k === b.kind).length > 1 ? idx : '';
  const rest = b.kind === 'straight' ? `descanso ${fmtSec(b.rest_sec)} entre séries` :
    `${b.rounds} voltas · sem pausa entre exercícios · ${b.rest_sec}s ao fim da volta`;
  return `<span class="blk-letter">${L}${n}</span> ${KIND_LABEL[b.kind]} <span class="muted">· ${rest}</span>`;
}
function strengthHtml(s, log) {
  let html = `<div class="callout"><strong>Aquecimento</strong> ${esc(s.warmup)}</div>`;
  if (s.phase === 'calibracao') html += `<div class="callout gold"><strong>Semana de calibração.</strong> Em cada exercício, ache a carga em que você chega ao topo da faixa sobrando 2 repetições (RIR 2). Registre carga e reps: é daqui que a progressão parte.</div>`;
  if (s.phase === 'leve') html += `<div class="callout"><strong>Semana leve.</strong> Menos séries, −10% de carga, longe da falha. É a semana que deixa o corpo absorver o ciclo.</div>`;
  s.blocks.forEach((b, bi) => {
    html += `<section class="block block-${b.kind}"><h3 class="block-title">${blockTitle(b, bi, s)}</h3>`;
    b.items.forEach((it, ii) => {
      const key = `${bi}.${ii}`;
      const sug = suggest(App.st.logs, App.program, s, it);
      const sets = (log?.sets?.[key]) || [];
      const last = sug.last;
      const lastTxt = last ? `Última (${fmtDate(last.date, { day: '2-digit', month: 'short' })}): ${last.sets.map(x => `${fmtNum(x.kg)}×${x.reps}`).join(' · ')}` : '';
      const target = it.unit === 's' ? `${it.sets} × ${it.reps[0]}–${it.reps[1]} s` : `${it.sets} × ${it.reps[0]}–${it.reps[1]} reps`;
      html += `<div class="ex-card" data-has-player data-key="${key}">
        <div class="ex-head">
          <div>
            <div class="ex-name">${esc(it.name)}${it.main ? ' <span class="tag mini">principal</span>' : ''}</div>
            <div class="ex-sets">${target} · RIR ${esc(it.rir)} · ${esc(it.equip)}</div>
          </div>
        </div>
        <div class="ex-actions">${videoBtn(it.video)}</div>
        <div class="ex-player" hidden></div>
        ${lastTxt ? `<div class="ex-last">${esc(lastTxt)}</div>` : ''}
        <div class="ex-sug sug-${sug.kind}">${sug.kg !== null && it.inc ? `<strong>Sugerido: ${fmtNum(sug.kg)} ${kgLabel(it)}</strong> · ` : ''}${esc(sug.note)}</div>
        <div class="set-rows">`;
      for (let i = 0; i < it.sets; i++) {
        const x = sets[i] || {};
        const kgVal = x.kg ?? '';
        const kgPh = sug.kg !== null && it.inc ? fmtNum(sug.kg) : '—';
        html += `<div class="set-row ${x.done ? 'done' : ''}" data-i="${i}">
          <span class="set-n">${b.kind === 'straight' ? i + 1 : 'V' + (i + 1)}</span>
          ${it.inc ? `<label class="in"><input class="in-kg" inputmode="decimal" placeholder="${kgPh}" value="${fmtNum(kgVal)}" aria-label="Carga"><small>${kgLabel(it)}</small></label>` : `<label class="in"><input class="in-kg" inputmode="decimal" placeholder="extra" value="${fmtNum(kgVal)}" aria-label="Carga extra"><small>+kg</small></label>`}
          <label class="in"><input class="in-reps" inputmode="numeric" placeholder="${it.reps[1]}" value="${x.reps ?? ''}" aria-label="Repetições"><small>${it.unit === 's' ? 's' : 'reps'}</small></label>
          <div class="rir" role="group" aria-label="RIR">${[0, 1, 2, 3].map(r => `<button class="${String(x.rir) === String(r) ? 'on' : ''}" data-rir="${r}">${r === 3 ? '3+' : r}</button>`).join('')}</div>
          <button class="set-ok" aria-label="Série feita">✓</button>
        </div>`;
      }
      html += `</div></div>`;
    });
    html += `</section>`;
  });
  if (s.finisher) {
    const f = s.finisher, z = Z()[f.zone];
    html += `<section class="block block-cardio" data-has-player><h3 class="block-title"><span class="blk-letter">+</span> ${esc(f.label)}</h3>
      <div class="ex-card"><div class="ex-name">${esc(f.machine)} · ${f.min} min</div>
      <div class="ex-sets">Zona 2: <strong>${z[0]}–${z[1]} bpm</strong> · ${esc(f.equip)}</div>
      <div class="ex-actions">${videoBtn(f.video)}</div><div class="ex-player" hidden></div></div></section>`;
  }
  return html;
}
function bindStrength(root, s) {
  $$('.ex-card[data-key]', root).forEach(card => {
    const key = card.dataset.key;
    const [bi, ii] = key.split('.').map(Number);
    const b = s.blocks[bi], it = b.items[ii];
    const rows = $$('.set-row', card);
    const save = (i, patch) => {
      const l = getLog(s.id); l.sets = l.sets || {};
      const arr = l.sets[key] = l.sets[key] || [];
      arr[i] = Object.assign({}, arr[i] || {}, patch, { t: Date.now() });
      if (!l.startedAt) l.startedAt = new Date().toISOString();
      touch(l); commit();
    };
    rows.forEach((row, i) => {
      const kg = $('.in-kg', row), reps = $('.in-reps', row);
      kg.addEventListener('change', () => {
        save(i, { kg: toNum(kg.value) });
        // propaga a carga para as séries seguintes ainda vazias
        rows.slice(i + 1).forEach((r2, j) => { const k2 = $('.in-kg', r2); if (!k2.value) { k2.value = kg.value; save(i + 1 + j, { kg: toNum(kg.value) }); } });
      });
      reps.addEventListener('change', () => save(i, { reps: toNum(reps.value) }));
      $$('.rir button', row).forEach(btn => btn.addEventListener('click', () => {
        const on = btn.classList.contains('on');
        $$('.rir button', row).forEach(x => x.classList.remove('on'));
        if (!on) btn.classList.add('on');
        save(i, { rir: on ? null : Number(btn.dataset.rir) });
      }));
      $('.set-ok', row).addEventListener('click', () => {
        const doneNow = !row.classList.contains('done');
        // preenche com sugestão/alvo se o campo ficou vazio
        if (doneNow) {
          if (!kg.value && kg.placeholder && /\d/.test(kg.placeholder)) kg.value = kg.placeholder;
          if (!reps.value) reps.value = reps.placeholder;
        }
        row.classList.toggle('done', doneNow);
        save(i, { done: doneNow, kg: toNum(kg.value), reps: toNum(reps.value) });
        if (doneNow) afterSet(s, bi, ii, i);
      });
    });
  });
}
function afterSet(s, bi, ii, i) {
  const b = s.blocks[bi], it = b.items[ii];
  if (b.kind === 'straight') {
    const nextTxt = i + 1 < it.sets ? `Próxima: série ${i + 2} de ${it.sets}` : nextBlockName(s, bi);
    startRest(b.rest_sec, nextTxt);
  } else if (ii < b.items.length - 1) {
    toast(`→ Sem pausa: ${b.items[ii + 1].name}`);
  } else {
    const nextTxt = i + 1 < b.rounds ? `Próxima: volta ${i + 2} de ${b.rounds} · ${b.items[0].name}` : nextBlockName(s, bi);
    startRest(b.rest_sec, nextTxt);
  }
}
function nextBlockName(s, bi) {
  const nb = s.blocks[bi + 1];
  return nb ? `Próximo bloco: ${nb.items.map(x => x.name).join(' + ')}` : (s.finisher ? `Agora: ${s.finisher.machine} ${s.finisher.min} min` : 'Último bloco feito!');
}

// ---------- descanso (barra flutuante)
const Rest = { end: 0, h: null };
function startRest(sec, nextTxt) {
  Rest.end = Date.now() + sec * 1000;
  $('#rest-next').textContent = nextTxt || '';
  $('#rest-bar').hidden = false;
  clearInterval(Rest.h);
  const tick = () => {
    const left = (Rest.end - Date.now()) / 1000;
    $('#rest-clock').textContent = fmtSec(left);
    $('#rest-bar').classList.toggle('ending', left <= 10);
    if (left <= 0) { stopRest(); beep(3); toast('Descanso acabou: bora!'); }
  };
  tick(); Rest.h = setInterval(tick, 250);
}
function stopRest() { clearInterval(Rest.h); $('#rest-bar').hidden = true; }

// ---------- aeróbico
function cardioTimeline(s, z) {
  const c = s.cardio, segs = [];
  if (c.kind === 'continuous') {
    c.segments.forEach(g => segs.push({ label: `${g.label} · ${g.machine}`, sec: g.min * 60, zone: g.zone, bpm: z[g.zone] }));
  } else {
    segs.push({ label: `${c.warmup.label} · ${c.warmup.machine}`, sec: c.warmup.min * 60, zone: 'z1', bpm: z.z1 });
    for (let r = 0; r < c.rounds; r++) {
      const m = c.machines[r % c.machines.length];
      segs.push({ label: `Tiro ${r + 1}/${c.rounds} · ${m}`, sec: c.on_sec, zone: 'tiro', bpm: z.tiro, hard: true });
      segs.push({ label: `Recuperação ${r + 1}/${c.rounds}`, sec: c.off_sec, zone: 'recup', bpm: [0, z.recup] });
    }
    segs.push({ label: `${c.cooldown.label} · ${c.cooldown.machine}`, sec: c.cooldown.min * 60, zone: 'z1', bpm: z.z1 });
  }
  return segs;
}
function cardioHtml(s, z) {
  const c = s.cardio;
  const segs = cardioTimeline(s, z);
  const total = segs.reduce((a, g) => a + g.sec, 0);
  let html = `<div class="callout">FC máx. ${z.max} bpm · método: ${z.method}. Confira a FC no Polar durante a sessão.</div>`;
  if (c.kind === 'continuous') {
    html += `<section class="block">`;
    c.segments.forEach(g => {
      html += `<div class="ex-card" data-has-player><div class="ex-name">${esc(g.label)} · ${esc(g.machine)}</div>
        <div class="ex-sets">${g.min} min · ${g.zone.toUpperCase()} <strong>${z[g.zone][0]}–${z[g.zone][1]} bpm</strong> · ${esc(g.equip)}</div>
        <div class="ex-actions">${videoBtn(g.video)}</div><div class="ex-player" hidden></div></div>`;
    });
    html += `</section>`;
  } else {
    html += `<section class="block">
      <div class="ex-card" data-has-player><div class="ex-name">${esc(c.warmup.label)} · ${esc(c.warmup.machine)}</div>
        <div class="ex-sets">${c.warmup.min} min subindo de Z1 para Z2 (${z.z1[0]}–${z.z2[1]} bpm)</div>
        <div class="ex-actions">${videoBtn(c.warmup.video)}</div><div class="ex-player" hidden></div></div>
      <div class="ex-card" data-has-player><div class="ex-name">${c.rounds} tiros de ${c.on_sec}s · recuperação ${c.off_sec}s</div>
        <div class="ex-sets">Tiro: chegar a <strong>${z.tiro[0]}–${z.tiro[1]} bpm</strong> no fim do minuto · Recuperação: deixar cair abaixo de <strong>${z.recup} bpm</strong></div>
        <div class="ex-sets">Alterne: ${c.machines.join(' → ')}. Troque de máquina na recuperação.</div>
        <div class="ex-actions">${c.machines.map(m => videoBtn(c.machine_info[m].video, '▶ ' + m.split(' ')[0])).join('')}</div>
        <div class="ex-player" hidden></div></div>
      <div class="ex-card"><div class="ex-name">${esc(c.cooldown.label)} · ${esc(c.cooldown.machine)}</div><div class="ex-sets">${c.cooldown.min} min em Z1</div></div>
    </section>`;
  }
  html += `<div class="timer-display" id="ctimer">
      <p class="timer-phase" id="ct-label">${esc(segs[0].label)}</p>
      <span class="timer-clock" id="ct-clock">${fmtSec(segs[0].sec)}</span>
      <p class="timer-round" id="ct-zone">${zoneTxt(segs[0])}</p>
      <p class="timer-round" id="ct-total">Total ${fmtSec(total)}</p>
    </div>
    <div class="timer-controls"><button id="ct-start" class="primary-btn">Iniciar</button><button id="ct-pause" class="secondary-btn">Pausa</button><button id="ct-next" class="secondary-btn">Pular etapa</button></div>`;
  return html;
}
function zoneTxt(g) { return g.zone === 'recup' ? `Recuperar: abaixo de ${g.bpm[1]} bpm` : `${g.zone === 'tiro' ? 'Tiro' : g.zone.toUpperCase()}: ${g.bpm[0]}–${g.bpm[1]} bpm`; }
const CT = { segs: [], i: 0, left: 0, h: null, running: false };
function bindCardio(root, s) {
  CT.segs = cardioTimeline(s, Z()); CT.i = 0; CT.left = CT.segs[0].sec; CT.running = false; clearInterval(CT.h);
  const draw = () => {
    const g = CT.segs[CT.i]; if (!g) return;
    $('#ct-label').textContent = g.label; $('#ct-clock').textContent = fmtSec(CT.left); $('#ct-zone').textContent = zoneTxt(g);
    $('#ctimer').classList.toggle('hard', !!g.hard);
    const rem = CT.left + CT.segs.slice(CT.i + 1).reduce((a, x) => a + x.sec, 0);
    $('#ct-total').textContent = `Faltam ${fmtSec(rem)}`;
  };
  const step = () => {
    CT.left -= 1;
    if (CT.left <= 3 && CT.left > 0) beep(1, 660);
    if (CT.left <= 0) {
      CT.i++;
      if (CT.i >= CT.segs.length) { clearInterval(CT.h); CT.running = false; beep(3); $('#ct-label').textContent = 'Fim! Registre o Polar abaixo.'; return; }
      CT.left = CT.segs[CT.i].sec; beep(CT.segs[CT.i].hard ? 2 : 1);
      const l = getLog(s.id); if (!l.startedAt) { l.startedAt = new Date().toISOString(); touch(l); commit(); }
    }
    draw();
  };
  $('#ct-start').addEventListener('click', () => { if (CT.running) return; CT.running = true; beep(1); CT.h = setInterval(step, 1000); });
  $('#ct-pause').addEventListener('click', () => { CT.running = false; clearInterval(CT.h); });
  $('#ct-next').addEventListener('click', () => { CT.left = 1; step(); });
  draw();
}

// ---------- Polar (arquivo, API, prints, manual)
function polarHtml(s, log) {
  const p = log?.polar;
  const z = Z();
  let sum = '<p class="muted">Sem dados do Polar ainda.</p>';
  if (p) {
    const tz = p.zones_s ? Object.entries(p.zones_s).filter(([, v]) => v).map(([k, v]) => `${k.toUpperCase()} ${Math.round(v / 60)}′`).join(' · ') : '';
    sum = `<div class="polar-grid">
      <div><span>${p.duration_s ? fmtSec(p.duration_s / 60).replace(':', 'h') : '—'}</span><small>duração</small></div>
      <div><span>${p.kcal || '—'}</span><small>kcal</small></div>
      <div><span>${p.hr_avg || '—'}</span><small>FC média</small></div>
      <div><span>${p.hr_max || '—'}</span><small>FC máx.</small></div>
    </div>${tz ? `<p class="muted small">Tempo em zona: ${tz}</p>` : ''}<p class="muted small">Fonte: ${esc(p.source || 'manual')}</p>`;
  }
  const prints = (log?.prints || []).map(id => `<a href="/api/foto?id=${encodeURIComponent(id)}" target="_blank"><img class="thumb" src="/api/foto?id=${encodeURIComponent(id)}" alt="print Polar"></a>`).join('');
  return `<h3 class="section-heading">Polar</h3>
  <div class="card">${sum}
    <div class="btn-row">
      <label class="secondary-btn small file-btn">Importar TCX/CSV<input type="file" id="polar-file" accept=".tcx,.csv,application/xml,text/csv" hidden></label>
      ${Api.user ? `<button class="secondary-btn small" id="polar-api">Buscar na Polar</button>` : ''}
      <label class="secondary-btn small file-btn">Anexar print<input type="file" id="polar-print" accept="image/*" multiple hidden></label>
    </div>
    <details class="manual"><summary>Preencher à mão</summary>
      <div class="manual-grid">
        <label>Duração (min)<input id="pm-dur" inputmode="numeric" value="${p?.duration_s ? Math.round(p.duration_s / 60) : ''}"></label>
        <label>kcal<input id="pm-kcal" inputmode="numeric" value="${p?.kcal || ''}"></label>
        <label>FC média<input id="pm-avg" inputmode="numeric" value="${p?.hr_avg || ''}"></label>
        <label>FC máx.<input id="pm-max" inputmode="numeric" value="${p?.hr_max || ''}"></label>
      </div><button class="secondary-btn small" id="pm-save">Salvar</button>
    </details>
    <div id="polar-pick"></div>
    <div class="thumbs">${prints}</div>
  </div>`;
}
function setPolar(s, data) {
  const l = getLog(s.id);
  const zs = data.hr_samples ? PolarFile.timeInZones(data.hr_samples, Z()) : (data.zones_s || null);
  l.polar = { source: data.source, start: data.start, duration_s: data.duration_s, kcal: data.kcal, hr_avg: data.hr_avg, hr_max: data.hr_max, sport: data.sport, zones_s: zs, polar_id: data.polar_id || null };
  touch(l); commit(); renderSession(s.id); toast('Dados do Polar registrados.');
}
function bindPolar(root, s) {
  $('#polar-file', root).addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { setPolar(s, await PolarFile.parse(f)); } catch (err) { alert(err.message); }
  });
  $('#pm-save', root).addEventListener('click', () => {
    const n = (id) => toNum($(id).value) || null;
    setPolar(s, { source: 'manual', duration_s: (n('#pm-dur') || 0) * 60, kcal: n('#pm-kcal'), hr_avg: n('#pm-avg'), hr_max: n('#pm-max') });
  });
  $('#polar-print', root).addEventListener('change', async (e) => {
    if (!Api.user) { alert('Prints precisam do app conectado (login). Use Importar TCX/CSV ou preencha à mão.'); return; }
    const l = getLog(s.id); l.prints = l.prints || [];
    for (const f of e.target.files) {
      try { const r = await uploadPhoto(f, 'polar', s.id); l.prints.push(r.id); } catch (err) { alert('Falha no upload: ' + err.message); }
    }
    touch(l); commit(); renderSession(s.id);
  });
  const api = $('#polar-api', root);
  if (api) api.addEventListener('click', async () => {
    api.disabled = true; api.textContent = 'Buscando…';
    try {
      const r = await Api.send('polar-sync', {});
      (r.exercises || []).forEach(x => { App.st.polar[x.id] = Object.assign({}, x, { updatedAt: Date.now() }); });
      commit();
      const date = (computeSchedule(App.program, App.st.logs).find(x => x.s.id === s.id) || {}).date;
      const cands = Object.values(App.st.polar).filter(x => (x.start_time || '').slice(0, 10) === date || (x.start_time || '').slice(0, 10) === todayISO());
      const box = $('#polar-pick');
      if (!cands.length) { box.innerHTML = '<p class="muted small">Nenhum treino da Polar nesta data. Sincronize o relógio com o app Polar Flow e tente de novo.</p>'; return; }
      box.innerHTML = cands.map(x => `<button class="pick" data-id="${esc(x.id)}">${esc((x.start_time || '').slice(11, 16))} · ${esc(x.sport || '')} · ${Math.round(isoDurToSec(x.duration) / 60)} min · ${x.calories || '—'} kcal</button>`).join('');
      $$('.pick', box).forEach(b => b.addEventListener('click', () => {
        const x = App.st.polar[b.dataset.id];
        setPolar(s, { source: 'Polar (API)', polar_id: x.id, start: x.start_time, duration_s: isoDurToSec(x.duration), kcal: x.calories, hr_avg: x.heart_rate?.average, hr_max: x.heart_rate?.maximum, sport: x.sport, zones_s: x.zones_s });
      }));
    } catch (err) { alert('Polar: ' + err.message); }
    finally { api.disabled = false; api.textContent = 'Buscar na Polar'; }
  });
}

// ---------- fotos
async function compressImage(file, maxSide = 1600, q = 0.82) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const k = Math.min(1, maxSide / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', q);
}
async function uploadPhoto(file, kind, ref) {
  const data = await compressImage(file);
  return Api.send('foto', { kind, ref, data });
}
const photoUrl = (id) => `/api/foto?id=${encodeURIComponent(id)}`;

// ======================================================================
// PROGRESSO
// ======================================================================
function svgChart(points, w = 320, h = 120) {
  if (points.length < 1) return '';
  const xs = points.map((_, i) => i), ys = points.flatMap(p => [p.real, p.exp]).filter(v => v != null);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 18, X = (i) => pad + (points.length === 1 ? (w - 2 * pad) / 2 : i * (w - 2 * pad) / (points.length - 1));
  const Y = (v) => h - pad - (maxY === minY ? (h - 2 * pad) / 2 : (v - minY) * (h - 2 * pad) / (maxY - minY));
  const line = (k) => points.map((p, i) => p[k] == null ? '' : `${i && points[i - 1][k] != null ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p[k]).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" class="chart" role="img" aria-label="Carga real e esperada">
    <path d="${line('exp')}" class="ln-exp"/><path d="${line('real')}" class="ln-real"/>
    ${points.map((p, i) => p.real == null ? `<circle cx="${X(i)}" cy="${Y(p.exp)}" r="2.5" class="pt-exp"/>` : `<circle cx="${X(i)}" cy="${Y(p.real)}" r="3" class="pt-real"/>`).join('')}
    <text x="${pad}" y="12" class="ax">${fmtNum(maxY)} kg</text><text x="${pad}" y="${h - 4}" class="ax">${fmtNum(minY)} kg</text>
  </svg>`;
}
function renderProgress() {
  const root = $('#view-progresso');
  const logs = App.st.logs;
  const sched = computeSchedule(App.program, logs);
  // resumo semanal
  const byWeek = new Map();
  for (const x of sched) {
    const w = x.s.week; if (!byWeek.has(w)) byWeek.set(w, { plan: 0, done: 0, sec: 0, kcal: 0, phase: x.s.phase, first: x.date });
    const W = byWeek.get(w); W.plan++;
    const l = logs[x.s.id];
    if (l && l.status === 'done') { W.done++; W.sec += l.polar?.duration_s || 0; W.kcal += l.polar?.kcal || 0; }
  }
  let html = `<h2>Progresso</h2><h3 class="section-heading">Semanas</h3><div class="table-wrap"><table class="tbl"><thead><tr><th>Sem.</th><th>Fase</th><th>Feitas</th><th>Tempo</th><th>kcal</th></tr></thead><tbody>`;
  let tSec = 0, tK = 0;
  for (const [w, W] of byWeek) {
    if (!W.done && W.first > todayISO()) continue;
    tSec += W.sec; tK += W.kcal;
    html += `<tr><td>${w}</td><td>${PHASE[W.phase]}</td><td>${W.done}/${W.plan}</td><td>${W.sec ? Math.round(W.sec / 60) + ' min' : '—'}</td><td>${W.kcal || '—'}</td></tr>`;
  }
  html += `</tbody><tfoot><tr><td colspan="3">Total</td><td>${Math.round(tSec / 60)} min</td><td>${tK}</td></tr></tfoot></table></div>`;

  // exercícios: principais com gráfico, demais em lista
  const items = new Map();
  App.program.sessions.forEach(s => (s.blocks || []).forEach(b => b.items.forEach(it => { if (!items.has(it.name)) items.set(it.name, it); })));
  const next = sched.filter(x => x.status !== 'done' && x.status !== 'skipped');
  const nextOf = (name) => { for (const x of next) for (const b of (x.s.blocks || [])) for (const it of b.items) if (it.name === name) return { s: x.s, it, date: x.date }; return null; };
  let mains = '', others = '';
  for (const [name, it] of items) {
    const h = exHistory(logs, App.program, name);
    if (!h.length) continue;
    const nx = nextOf(name);
    const sg = nx ? suggest(logs, App.program, nx.s, nx.it) : null;
    const curve = expectedCurve(h, it);
    const lastE = curve[curve.length - 1];
    const line = `<div class="prog-row"><div><strong>${esc(name)}</strong><div class="muted small">${h.length} sessões · atual ${fmtNum(lastE.real)} kg · esperado ${fmtNum(lastE.exp)} kg</div></div>
      <div class="prog-next">${sg && sg.kg != null ? `${fmtNum(sg.kg)} kg` : '—'}<small>${nx ? fmtDate(nx.date, { day: '2-digit', month: 'short' }) : ''}</small></div></div>`;
    // projeção: as próximas 4 ocorrências do exercício no programa
    const proj = [];
    let e = lastE.exp;
    for (const x of next) {
      if (proj.length >= 4) break;
      if (!(x.s.blocks || []).some(b => b.items.some(i2 => i2.name === name))) continue;
      e = x.s.phase === 'leve' ? e : e * 1.025;
      proj.push({ date: x.date, real: null, exp: x.s.phase === 'leve' ? roundTo(e * 0.9, it.inc) : roundTo(e, it.inc) });
    }
    const projTxt = proj.length ? `<p class="muted small">Esperado nas próximas: ${proj.map(p => `${fmtDate(p.date, { day: '2-digit', month: 'short' })} ${fmtNum(p.exp)} kg`).join(' · ')}</p>` : '';
    if (it.main) mains += `<div class="card">${line}${svgChart(curve.concat(proj))}<p class="legend"><span class="lg-real"></span> real <span class="lg-exp"></span> esperado (+2,5% por sessão de progressão)</p>${projTxt}</div>`;
    else others += `<div class="card slim">${line}</div>`;
  }
  html += `<h3 class="section-heading">Exercícios principais</h3>${mains || '<p class="muted">Os gráficos aparecem depois da semana de calibração.</p>'}`;
  html += `<h3 class="section-heading">Acessórios · próxima carga</h3>${others || '<p class="muted">Sem registros ainda.</p>'}`;

  // volume semanal planejado por grupamento (semana corrente)
  const cur = sched.find(x => x.status !== 'done' && x.status !== 'skipped');
  if (cur) {
    const vol = {};
    App.program.sessions.filter(s => s.week === cur.s.week && s.blocks).forEach(s => s.blocks.forEach(b => b.items.forEach(it => { vol[it.grupo] = (vol[it.grupo] || 0) + it.sets; })));
    html += `<h3 class="section-heading">Séries por grupamento · semana ${cur.s.week}</h3><div class="vol">${Object.entries(vol).sort((a, b) => b[1] - a[1]).map(([g, n]) => `<div class="vol-row"><span>${esc(g)}</span><span class="bar" style="--w:${Math.min(100, n * 5)}%"></span><b>${n}</b></div>`).join('')}</div>
      <p class="muted small">Referência para hipertrofia: 10–20 séries semanais por grupamento grande.</p>`;
  }
  root.innerHTML = html;
}

// ======================================================================
// CORPO
// ======================================================================
const POSES = [['front', 'Frente'], ['side', 'Lado'], ['back', 'Costas']];
function renderBody() {
  const root = $('#view-corpo');
  const entries = Object.entries(App.st.body).filter(([, v]) => v && !v.deleted).sort((a, b) => a[0] < b[0] ? 1 : -1);
  const online = !!Api.user;
  let html = `<h2>Corpo</h2>
  <div class="card">
    <p class="muted small">Registro semanal, de manhã, em jejum. Fotos: mesma luz, mesmo lugar, corpo inteiro.</p>
    <div class="manual-grid">
      <label>Data<input type="date" id="b-date" value="${todayISO()}"></label>
      <label>Peso (kg)<input id="b-weight" inputmode="decimal" placeholder="84,0"></label>
      <label>Cintura (cm)<input id="b-waist" inputmode="decimal" placeholder="umbigo"></label>
    </div>
    <div class="pose-row">${POSES.map(([k, l]) => `<label class="pose ${online ? '' : 'disabled'}"><input type="file" accept="image/*" data-pose="${k}" hidden ${online ? '' : 'disabled'}><span>${l}</span><small id="pose-${k}">foto</small></label>`).join('')}</div>
    ${online ? '' : '<p class="muted small">Fotos ficam disponíveis com o app conectado (login).</p>'}
    <button class="primary-btn" id="b-save">Salvar registro</button>
  </div>`;

  // tendência
  const ws = entries.filter(([, v]) => v.weight).slice().reverse();
  if (ws.length >= 2) {
    const pts = ws.map(([d, v]) => ({ real: v.weight, exp: v.weight }));
    html += `<h3 class="section-heading">Peso</h3><div class="card">${svgChart(pts)}<p class="muted small">${fmtNum(ws[0][1].weight)} → ${fmtNum(ws[ws.length - 1][1].weight)} kg${ws[0][1].waist && ws[ws.length - 1][1].waist ? ` · cintura ${fmtNum(ws[0][1].waist)} → ${fmtNum(ws[ws.length - 1][1].waist)} cm` : ''}</p></div>`;
  }
  // comparação primeira × última por pose
  const withPhotos = entries.filter(([, v]) => v.photos && Object.keys(v.photos).length);
  if (withPhotos.length >= 2) {
    const first = withPhotos[withPhotos.length - 1], last = withPhotos[0];
    html += `<h3 class="section-heading">Evolução · ${fmtDate(first[0], { day: '2-digit', month: 'short' })} × ${fmtDate(last[0], { day: '2-digit', month: 'short' })}</h3><div class="compare">`;
    for (const [k, l] of POSES) {
      const a = first[1].photos[k], b = last[1].photos[k];
      if (a && b) html += `<div class="cmp"><img src="${photoUrl(a)}" alt="${l} antes"><img src="${photoUrl(b)}" alt="${l} agora"><small>${l}</small></div>`;
    }
    html += `</div>`;
  }
  // análise
  const an = Object.entries(App.st.analyses).sort((a, b) => a[0] < b[0] ? 1 : -1)[0];
  html += `<h3 class="section-heading">Análise e ajustes por grupamento</h3><div class="card">
    ${an ? `<p class="muted small">Última análise: ${fmtDate(an[0].slice(0, 10))}</p><div class="analysis">${esc(an[1].text).replace(/\n/g, '<br>')}</div>` : '<p class="muted small">Recomendado a cada 4 semanas, com fotos de frente, lado e costas.</p>'}
    ${online ? `<button class="secondary-btn" id="b-analyse" ${withPhotos.length ? '' : 'disabled'}>Pedir análise agora</button>` : ''}
    <p class="muted small">Leitura visual aproximada para orientar o próximo ciclo. Não é avaliação física.</p></div>`;

  html += `<h3 class="section-heading">Registros</h3><ul class="history-list">${entries.map(([d, v]) => `<li class="history-item"><div><strong>${fmtDate(d)}</strong><div class="history-date">${v.weight ? fmtNum(v.weight) + ' kg' : ''}${v.waist ? ' · ' + fmtNum(v.waist) + ' cm' : ''}</div></div>
    <div class="thumbs">${Object.values(v.photos || {}).map(id => `<img class="thumb" src="${photoUrl(id)}" alt="">`).join('')}</div></li>`).join('') || '<li class="muted">Nenhum registro ainda.</li>'}</ul>`;
  root.innerHTML = html;

  const pending = {};
  $$('input[data-pose]', root).forEach(inp => inp.addEventListener('change', () => {
    const f = inp.files[0]; if (!f) return; pending[inp.dataset.pose] = f; $(`#pose-${inp.dataset.pose}`).textContent = '✓ pronta';
  }));
  $('#b-save').addEventListener('click', async (e) => {
    const d = $('#b-date').value || todayISO();
    const cur = Object.assign({ photos: {} }, App.st.body[d] || {});
    const w = toNum($('#b-weight').value), wa = toNum($('#b-waist').value);
    if (w) cur.weight = w; if (wa) cur.waist = wa;
    e.target.disabled = true; e.target.textContent = 'Salvando…';
    try {
      for (const [k, f] of Object.entries(pending)) { const r = await uploadPhoto(f, 'corpo', `${d}-${k}`); cur.photos[k] = r.id; }
      touch(cur); App.st.body[d] = cur; commit(); toast('Registro salvo.'); renderBody();
    } catch (err) { alert('Falha ao salvar fotos: ' + err.message); e.target.disabled = false; e.target.textContent = 'Salvar registro'; }
  });
  const ab = $('#b-analyse');
  if (ab) ab.addEventListener('click', async () => {
    ab.disabled = true; ab.textContent = 'Analisando (até 1 min)…';
    try {
      const first = withPhotos[withPhotos.length - 1], last = withPhotos[0];
      const recent = recentTrainingSummary();
      const r = await Api.send('analise', {
        baseline: { date: first[0], ...first[1] }, latest: { date: last[0], ...last[1] },
        weights: ws.map(([d, v]) => ({ date: d, weight: v.weight, waist: v.waist })), training: recent,
        profile: { idade: 45, altura_cm: 174 },
      });
      App.st.analyses[new Date().toISOString()] = { text: r.text, updatedAt: Date.now() }; commit(); renderBody();
    } catch (err) { alert('Análise: ' + err.message); ab.disabled = false; ab.textContent = 'Pedir análise agora'; }
  });
}
function recentTrainingSummary() {
  const out = [];
  const items = new Map();
  App.program.sessions.forEach(s => (s.blocks || []).forEach(b => b.items.forEach(it => items.set(it.name, it))));
  for (const [name, it] of items) {
    const h = exHistory(App.st.logs, App.program, name); if (!h.length) continue;
    const c = expectedCurve(h, it);
    out.push({ exercicio: name, grupo: it.grupo, sessoes: h.length, carga_inicial: c[0].real, carga_atual: c[c.length - 1].real, esperado: c[c.length - 1].exp });
  }
  return out;
}

// ======================================================================
// AJUSTES
// ======================================================================
function renderSettings() {
  const root = $('#view-ajustes');
  const z = Z(), S = settings();
  const u = Api.user;
  root.innerHTML = `<h2>Ajustes</h2>
  <h3 class="section-heading">Conta e sincronização</h3>
  <div class="card">
    ${u ? `<p>Conectado como <strong>${esc(u.userDetails)}</strong> (${esc(u.identityProvider)}).</p><p class="muted small">Status: ${esc(Sync.status)}</p>
      <div class="btn-row"><button class="secondary-btn small" id="sync-now">Sincronizar agora</button><a class="secondary-btn small" href="/.auth/logout?post_logout_redirect_uri=/">Sair</a></div>` :
      `<p class="muted">Modo local: os dados ficam só neste aparelho.</p><a class="primary-btn" href="/.auth/login/github?post_login_redirect_uri=/">Entrar</a>`}
  </div>
  <h3 class="section-heading">Frequência cardíaca</h3>
  <div class="card">
    <div class="manual-grid">
      <label>FC máxima<input id="s-max" inputmode="numeric" value="${S.fcmax || ''}" placeholder="${App.program.fcmax}"></label>
      <label>FC de repouso<input id="s-rest" inputmode="numeric" value="${S.fcrest || ''}" placeholder="do Polar"></label>
    </div>
    <button class="secondary-btn small" id="s-save">Salvar</button>
    <p class="muted small">Método atual: ${z.method}. Com a FC de repouso, as zonas ficam personalizadas.</p>
    <table class="tbl"><tbody>
      ${['z1', 'z2', 'z3', 'z4', 'z5'].map(k => `<tr><td>${k.toUpperCase()}</td><td>${z[k][0]}–${z[k][1]} bpm</td></tr>`).join('')}
      <tr><td>Tiro</td><td>${z.tiro[0]}–${z.tiro[1]} bpm</td></tr><tr><td>Recuperação</td><td>&lt; ${z.recup} bpm</td></tr>
    </tbody></table>
  </div>
  <h3 class="section-heading">Polar</h3>
  <div class="card">
    ${u ? `<p class="muted small">Conecte uma vez; depois os treinos chegam sozinhos quando o relógio sincroniza com o Polar Flow.</p>
      <div class="btn-row"><a class="secondary-btn small" href="/api/polar-login">Conectar conta Polar</a><button class="secondary-btn small" id="polar-status">Ver status</button></div><p class="muted small" id="polar-st"></p>` :
      `<p class="muted small">Disponível com o app conectado. Enquanto isso, importe o TCX/CSV em cada sessão.</p>`}
  </div>
  <h3 class="section-heading">Backup</h3>
  <div class="card"><div class="btn-row">
    <button class="secondary-btn small" id="bk-exp">Exportar JSON</button>
    <label class="secondary-btn small file-btn">Importar JSON<input type="file" id="bk-imp" accept="application/json" hidden></label>
  </div><p class="muted small">Programa: ${App.program.sessions.length} sessões, de ${fmtDate(App.program.start)} a ${fmtDate(App.program.sessions[App.program.sessions.length - 1].planned)}.</p></div>`;

  $('#s-save').addEventListener('click', () => {
    const S2 = settings(); S2.fcmax = toNum($('#s-max').value) || null; S2.fcrest = toNum($('#s-rest').value) || null; touch(S2); commit(); renderSettings(); toast('Zonas atualizadas.');
  });
  const sn = $('#sync-now'); if (sn) sn.addEventListener('click', async () => { App.st = await Sync.pull(App.st); await Sync.push(() => App.st, (m) => { App.st = m; saveLocal(m); }); renderSettings(); });
  const ps = $('#polar-status'); if (ps) ps.addEventListener('click', async () => {
    try { const r = await Api.get('polar-sync'); $('#polar-st').textContent = r.connected ? `Conectado. ${r.count || 0} treinos guardados.` : 'Ainda não conectado.'; }
    catch (e) { $('#polar-st').textContent = e.message; }
  });
  $('#bk-exp').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(App.st, null, 1)], { type: 'application/json' }));
    a.download = `treinos-backup-${todayISO()}.json`; a.click();
  });
  $('#bk-imp').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { App.st = mergeState(App.st, JSON.parse(await f.text())); commit(); toast('Backup importado.'); renderSettings(); } catch (err) { alert('Arquivo inválido.'); }
  });
}

// ======================================================================
// BOOT
// ======================================================================
function bindChrome() {
  $$('.tab').forEach(t => t.addEventListener('click', () => go(t.dataset.view)));
  $('#rest-plus').addEventListener('click', () => { Rest.end += 15000; });
  $('#rest-skip').addEventListener('click', stopRest);
  Sync.listeners.push((s) => { const d = $('#sync-dot'); d.className = `sync-dot ${s}`; d.title = `Sincronização: ${s}`; });
  window.addEventListener('focus', async () => { if (Api.user) { App.st = await Sync.pull(App.st); if (App.view !== 'sessao') render(); } });
}
async function boot() {
  bindChrome();
  try {
    const r = await fetch('data/programa.json', { cache: 'no-cache' });
    App.program = await r.json();
  } catch (e) { document.body.innerHTML = `<div style="padding:24px">Falha ao carregar o programa: ${esc(e.message)}</div>`; return; }
  await Api.me();
  if (Api.user) App.st = await Sync.pull(App.st); else Sync.set('local');
  const hash = location.hash.replace('#', '');
  if (hash.startsWith('ajustes')) { go('ajustes'); if (hash.includes('polar=ok')) toast('Conta Polar conectada.'); }
  else go('agenda');
}
boot();
